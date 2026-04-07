"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kysely_1 = require("kysely");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// GET /api/v1/tables — Catálogo público, sem JWT
router.get('/', async (req, res) => {
    const { system, modality, type, audience, price_type, experience_level, state, city, featured, search, seal, page = '1', limit = '12', } = req.query;
    // CORREÇÃO HP-04: Validar NaN em parseInt
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const offset = (pageNum - 1) * limitNum;
    try {
        let query = db_1.db
            .selectFrom('tables as t')
            .leftJoin('gm_profiles as gm', 'gm.id', 't.gm_id')
            .leftJoin('users as u', 'u.id', 'gm.user_id')
            .leftJoin('profiles as p', 'p.user_id', 'u.id')
            .leftJoin('systems as s', 's.id', 't.system_id')
            .select([
            't.id',
            't.slug',
            't.title',
            't.description',
            (0, kysely_1.sql) `t.banner_url`.as('cover_url'),
            't.status',
            't.type',
            't.audience',
            't.modality',
            't.price_type',
            't.price_value',
            // CORREÇÃO DT-05: Documentação de campos de vagas
            // slots_total: Capacidade máxima da mesa (ex: 5 jogadores)
            // slots_filled: Jogadores já inscritos/confirmados (ex: 3 jogadores)
            // slots_open: Vagas abertas para recrutamento, controlado pelo mestre (ex: 2 vagas)
            //   - Pode ser menor que (slots_total - slots_filled) se mestre fechar recrutamento
            //   - Frontend deve usar slots_open para exibir "vagas disponíveis"
            //   - Fallback: se NULL, calcular como (slots_total - slots_filled)
            't.slots_total',
            't.slots_filled',
            't.slots_open', // REQ-02: Vagas abertas para recrutamento
            't.language',
            't.experience_level',
            't.starts_at',
            't.content_warnings',
            't.safety_tools',
            't.publisher_role',
            't.actual_gm_name',
            't.featured',
            't.created_at',
            't.is_ddal',
            't.is_covil', // CORREÇÃO A01: Retornar flag Covil do Lich
            't.ddal_code',
            't.ddal_name',
            't.ddal_tier',
            // CORREÇÃO DT-19: Retornar campos de cenário e estilos (REQ-28)
            't.setting_name',
            't.setting_styles',
            // CORREÇÃO DT-01: Retornar synopsis_narrative para cards
            't.synopsis_narrative',
            's.name as system_name',
            's.slug as system_slug',
            'gm.slug as gm_slug',
            'gm.avatar_url as gm_avatar_url',
            'gm.badges as gm_badges',
            (0, kysely_1.sql) `COALESCE(gm.nickname, p.display_name)`.as('gm_display_name'),
        ])
            .where('t.status', '=', 'active')
            .orderBy('t.created_at', 'desc')
            .limit(limitNum)
            .offset(offset);
        if (system)
            query = query.where('s.slug', '=', system);
        if (modality)
            query = query.where('t.modality', '=', modality);
        if (type)
            query = query.where('t.type', '=', type);
        if (audience)
            query = query.where('t.audience', '=', audience);
        if (price_type)
            query = query.where('t.price_type', '=', price_type);
        if (experience_level)
            query = query.where('t.experience_level', '=', experience_level);
        if (featured === 'true')
            query = query.where('t.featured', '=', true);
        if (state)
            query = query.where('t.state', '=', state);
        if (city)
            query = query.where('t.city', 'ilike', `%${city}%`);
        if (seal === 'ddal') {
            query = query.where('t.is_ddal', '=', true);
        }
        // CORREÇÃO A02: Filtro Covil do Lich deve usar t.is_covil, não gm.badges
        if (seal === 'covil-do-lich' || seal === 'covil_do_lich') {
            query = query.where('t.is_covil', '=', true);
        }
        if (search) {
            const safeSearch = `%${search}%`;
            query = query.where((0, kysely_1.sql) `(
        t.title ILIKE ${safeSearch}
        OR t.description ILIKE ${safeSearch}
        OR s.name ILIKE ${safeSearch}
        OR COALESCE(gm.nickname, p.display_name) ILIKE ${safeSearch}
      )`);
        }
        const tables = await query.execute();
        let tablesWithContacts = tables;
        if (tables.length > 0) {
            const tableIds = tables.map((table) => table.id);
            const contacts = await db_1.db
                .selectFrom('table_contacts')
                .select(['table_id', 'channel', 'value', 'label', 'discord_server_url', 'sort_order'])
                .where('table_id', 'in', tableIds)
                .orderBy('sort_order', 'asc')
                .execute();
            const contactsByTable = new Map();
            for (const contact of contacts) {
                if (!contactsByTable.has(contact.table_id)) {
                    contactsByTable.set(contact.table_id, []);
                }
                contactsByTable.get(contact.table_id).push({
                    channel: contact.channel,
                    value: contact.value,
                    label: contact.label,
                    discord_server_url: contact.discord_server_url,
                    sort_order: contact.sort_order,
                });
            }
            tablesWithContacts = tables.map((table) => ({
                ...table,
                contacts: contactsByTable.get(table.id) ?? [],
            }));
        }
        // CORREÇÃO HP-02: Contar total de mesas ativas COM OS MESMOS FILTROS da query principal
        // Clonar query antes de aplicar limit/offset para contar resultados filtrados
        const countQuery = query
            .clearSelect()
            .clearLimit()
            .clearOffset()
            .clearOrderBy()
            .select((0, kysely_1.sql) `COUNT(*)`.as('count'));
        const totalCount = await countQuery.executeTakeFirst();
        res.json({
            data: tablesWithContacts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                hasMore: tables.length === limitNum,
                total: Number(totalCount?.count ?? 0), // CORREÇÃO DT-05
            },
        });
    }
    catch (error) {
        // CORREÇÃO HP-03: Log com contexto de query params
        console.error('[GET /tables]', error, {
            params: { system, modality, type, audience, price_type, experience_level, state, city, featured, search, seal, page, limit }
        });
        res.status(500).json({ error: 'Erro ao buscar mesas.' });
    }
});
// GET /api/v1/tables/:slug — Mesa individual
router.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const table = await db_1.db
            .selectFrom('tables as t')
            .leftJoin('gm_profiles as gm', 'gm.id', 't.gm_id')
            .leftJoin('users as u', 'u.id', 'gm.user_id')
            .leftJoin('profiles as p', 'p.user_id', 'u.id')
            .leftJoin('systems as s', 's.id', 't.system_id')
            .leftJoin('scenarios as sc', 'sc.id', 't.scenario_id') // CORREÇÃO DT-02: JOIN para retornar cenário
            // CORREÇÃO A01: JOIN com vtt_platforms para retornar dados de VTT
            .leftJoin('vtt_platforms as vtt', 'vtt.id', 't.vtt_platform_id')
            .select([
            't.id',
            't.slug',
            't.title',
            't.description',
            (0, kysely_1.sql) `t.banner_url`.as('cover_url'),
            't.status',
            't.type',
            't.audience',
            't.modality',
            't.price_type',
            't.price_value',
            't.price_frequency',
            't.slots_total',
            't.slots_filled',
            't.slots_open', // REQ-02: Vagas abertas para recrutamento
            't.language',
            't.experience_level',
            't.starts_at',
            't.city',
            't.state',
            't.content_warnings',
            't.safety_tools',
            't.publisher_role',
            't.actual_gm_name',
            't.featured',
            't.created_at',
            't.origin',
            't.is_ddal',
            't.is_covil', // CORREÇÃO A01: Retornar flag Covil do Lich
            't.ddal_code',
            't.ddal_name',
            't.ddal_tier',
            't.ddal_season',
            't.ddal_duration',
            't.ddal_format',
            't.ddal_org_code',
            't.ddal_setting',
            't.ddal_rules_notes',
            // CORREÇÃO: Retornar campos avançados (REQ-26)
            't.master_display_name',
            't.campaign_length',
            't.level_range',
            't.billing_text',
            't.session_zero_free',
            't.synopsis',
            't.style_text',
            't.listing_excerpt',
            't.technical_requirements',
            't.requires_pc',
            't.requires_camera',
            't.requires_microphone',
            // Campos de cenário e estilos (REQ-28)
            't.setting_name',
            't.setting_styles',
            // REQ-28 Fase 7: Campos editoriais separados
            't.synopsis_narrative',
            't.benefits_text',
            't.table_gm_bio',
            // CORREÇÃO A03: Retornar frequency e frequency_custom
            't.frequency',
            't.frequency_custom',
            // CORREÇÃO A01: Retornar campos de VTT Platform
            't.game_platform_custom',
            't.communication_platform',
            's.name as system_name',
            's.slug as system_slug',
            // CORREÇÃO DT-02: Retornar nome do cenário
            'sc.name as scenario_name',
            // CORREÇÃO A01: Retornar objeto vtt_platform completo
            (0, kysely_1.sql) `
          CASE WHEN vtt.id IS NOT NULL THEN
            json_build_object(
              'id', vtt.id,
              'name', vtt.name,
              'slug', vtt.slug,
              'logo_filename', vtt.logo_filename,
              'website_url', vtt.website_url
            )
          ELSE NULL
          END
        `.as('vtt_platform'),
            'gm.slug as gm_slug',
            'gm.avatar_url as gm_avatar_url',
            'gm.badges as gm_badges',
            (0, kysely_1.sql) `COALESCE(gm.nickname, p.display_name)`.as('gm_display_name'),
            'gm.bio_long as gm_bio_long', // CORREÇÃO REG-13: Renomeado para evitar conflito com t.gm_bio
        ])
            .where((eb) => eb.or([
            eb('t.slug', '=', slug),
            eb('t.id', '=', slug) // Aceita UUID também
        ]))
            .executeTakeFirst();
        if (!table) {
            return res.status(404).json({ error: 'Mesa não encontrada.' });
        }
        // Validar expiração para mesas importadas
        if (table.origin === 'imported') {
            const limite5Dias = new Date(table.created_at);
            limite5Dias.setDate(limite5Dias.getDate() + 5);
            const limiteEvento = table.starts_at ? new Date(table.starts_at) : limite5Dias;
            const validadeFinal = limiteEvento < limite5Dias ? limiteEvento : limite5Dias;
            if (new Date() >= validadeFinal) {
                return res.status(404).json({ error: 'Mesa não encontrada ou expirada.' });
            }
        }
        const contacts = await db_1.db
            .selectFrom('table_contacts')
            .select(['channel', 'value', 'label', 'discord_server_url', 'sort_order'])
            .where('table_id', '=', table.id)
            .orderBy('sort_order', 'asc')
            .execute();
        // CORREÇÃO: Buscar schedules (REQ-27)
        const schedules = await db_1.db
            .selectFrom('table_schedules')
            .selectAll()
            .where('table_id', '=', table.id)
            .orderBy('sort_order', 'asc')
            .execute();
        res.json({ data: { ...table, contacts, schedules } });
    }
    catch (error) {
        console.error('[GET /tables/:slug]', error);
        res.status(500).json({ error: 'Erro ao buscar mesa.' });
    }
});
exports.default = router;
