"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kysely_1 = require("kysely");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const crypto_1 = __importDefault(require("crypto"));
const tableValidators_1 = require("../validators/tableValidators");
const tableService_1 = require("../services/tableService");
const tableRepository_1 = require("../repositories/tableRepository");
const router = (0, express_1.Router)();
// ============================================================================
// CONSTANTES
// ============================================================================
const METRIC_THROTTLE_WINDOWS = {
    view: 15 * 60 * 1000,
    click: 5 * 60 * 1000,
    contact: 30 * 60 * 1000,
    favorite: 24 * 60 * 60 * 1000,
};
// ============================================================================
// UTILITÁRIOS DE MÉTRICAS
// ============================================================================
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string') {
        return realIp.trim();
    }
    return req.socket.remoteAddress || 'unknown';
}
function generateFingerprint(req) {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const raw = `${ip}:${userAgent}`;
    return crypto_1.default.createHash('sha256').update(raw).digest('hex');
}
async function shouldCountMetric(tableId, action, fingerprint) {
    const windowMs = METRIC_THROTTLE_WINDOWS[action];
    const cutoff = new Date(Date.now() - windowMs);
    const recentEvent = await db_1.db
        .selectFrom('table_metric_events')
        .select('id')
        .where('table_id', '=', tableId)
        .where('action', '=', action)
        .where('fingerprint_hash', '=', fingerprint)
        .where('created_at', '>', cutoff)
        .executeTakeFirst();
    return !recentEvent;
}
// ============================================================================
// ROTAS DE GM PROFILE
// ============================================================================
// POST /api/v1/gm/profile — Cria perfil de mestre
router.post('/profile', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { slug, nickname, bio_long, languages, specialties, badges } = req.body;
    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Slug inválido. Use apenas letras minúsculas, números e hífens.' });
    }
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 40) {
        return res.status(400).json({ error: 'Nickname inválido. Use entre 2 e 40 caracteres.' });
    }
    const safeLanguages = Array.isArray(languages) ? languages.filter(v => typeof v === 'string') : [];
    const safeSpecialties = Array.isArray(specialties) ? specialties.filter(v => typeof v === 'string') : [];
    const safeBadges = Array.isArray(badges) ? badges.filter(v => typeof v === 'string') : [];
    try {
        const existing = await db_1.db
            .selectFrom('gm_profiles')
            .select('id')
            .where('slug', '=', slug)
            .executeTakeFirst();
        if (existing) {
            return res.status(409).json({ error: 'Este slug de mestre já está em uso.' });
        }
        const [gmProfile] = await db_1.db
            .insertInto('gm_profiles')
            .values({
            user_id: userId,
            slug,
            nickname: nickname.trim(),
            bio_long: bio_long ?? null,
            languages: safeLanguages,
            specialties: safeSpecialties,
            badges: safeBadges,
        })
            .returning(['id', 'slug', 'nickname', 'bio_long', 'avatar_url', 'languages', 'specialties', 'badges', 'created_at'])
            .execute();
        await db_1.db
            .updateTable('users')
            .set({ role: 'gm' })
            .where('id', '=', userId)
            .where('role', '=', 'player')
            .execute();
        return res.status(201).json({ data: gmProfile });
    }
    catch (error) {
        console.error('[POST /gm/profile]', error);
        return res.status(500).json({ error: 'Erro ao criar perfil de mestre.' });
    }
});
// PUT /api/v1/gm/profile — Edita perfil do mestre logado
router.put('/profile', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { bio_long, languages, specialties, badges, avatar_url, banner_url } = req.body;
    const safeLanguages = Array.isArray(languages) ? languages.filter((v) => typeof v === 'string') : undefined;
    const safeSpecialties = Array.isArray(specialties) ? specialties.filter((v) => typeof v === 'string') : undefined;
    const safeBadges = Array.isArray(badges) ? badges.filter((v) => typeof v === 'string') : undefined;
    try {
        const gmProfile = await db_1.db
            .selectFrom('gm_profiles')
            .select(['id'])
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (!gmProfile) {
            return res.status(404).json({ error: 'Perfil de mestre não encontrado.' });
        }
        const [updated] = await db_1.db
            .updateTable('gm_profiles')
            .set({
            bio_long: bio_long ?? undefined,
            languages: safeLanguages,
            specialties: safeSpecialties,
            badges: safeBadges,
            avatar_url: avatar_url ?? undefined,
            banner_url: banner_url ?? undefined,
        })
            .where('id', '=', gmProfile.id)
            .returning(['id', 'slug', 'bio_long', 'avatar_url', 'banner_url', 'languages', 'specialties', 'badges', 'updated_at'])
            .execute();
        return res.json({ data: updated });
    }
    catch (error) {
        console.error('[PUT /gm/profile]', error);
        return res.status(500).json({ error: 'Erro ao atualizar perfil de mestre.' });
    }
});
// GET /api/v1/gm/me — Retorna perfil próprio do mestre logado
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    try {
        const gmProfile = await db_1.db
            .selectFrom('gm_profiles')
            .selectAll()
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (!gmProfile) {
            return res.status(404).json({ error: 'Perfil de mestre não encontrado.' });
        }
        const tablesCountRow = await db_1.db
            .selectFrom('tables')
            .select(({ fn }) => [fn.count('id').as('count')])
            .where('gm_id', '=', gmProfile.id)
            .executeTakeFirst();
        const tablesCount = Number(tablesCountRow?.count ?? 0);
        return res.json({
            data: {
                ...gmProfile,
                tables_count: tablesCount,
                avg_rating: null,
            },
        });
    }
    catch (error) {
        console.error('[GET /gm/me]', error);
        return res.status(500).json({ error: 'Erro ao buscar perfil.' });
    }
});
// ============================================================================
// ROTAS DE MESAS (GM) - REFATORADAS COM SERVICE + REPOSITORY
// ============================================================================
// GET /api/v1/gm/tables/:id — Obtém mesa específica para edição
router.get('/tables/:id', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    try {
        const gmProfile = await db_1.db
            .selectFrom('gm_profiles')
            .select(['id'])
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (!gmProfile) {
            return res.status(403).json({ error: 'Perfil de mestre não encontrado.' });
        }
        const tableData = await tableRepository_1.TableRepository.findByIdAndGm(id, gmProfile.id);
        if (!tableData) {
            return res.status(404).json({ error: 'Mesa não encontrada ou sem permissão.' });
        }
        const contacts = await tableRepository_1.TableRepository.findContactsByTableId(id);
        const schedules = await tableRepository_1.TableRepository.findSchedulesByTableId(id);
        const responseData = {
            ...tableData,
            contacts,
            schedules,
            slots_available: (tableData.slots_total ?? 0) - (tableData.slots_filled ?? 0),
        };
        return res.json({ data: responseData });
    }
    catch (error) {
        console.error('[GET /gm/tables/:id]', error);
        return res.status(500).json({ error: 'Erro ao buscar mesa.' });
    }
});
// POST /api/v1/gm/tables — Cria nova mesa
router.post('/tables', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user?.role;
    const validation = tableValidators_1.createTableSchema.safeParse(req.body);
    if (!validation.success) {
        const firstError = validation.error.issues[0];
        return res.status(400).json({
            error: firstError.message,
            field: firstError.path.join('.'),
        });
    }
    const data = validation.data;
    try {
        const gmProfile = await db_1.db
            .selectFrom('gm_profiles')
            .select(['id'])
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (!gmProfile) {
            return res.status(403).json({ error: 'Perfil de mestre não encontrado. Crie seu perfil primeiro.' });
        }
        // Validações usando Service
        if (data.is_ddal && data.system_id) {
            const isEligible = await tableService_1.TableService.isDdalEligibleSystem(data.system_id);
            if (!isEligible) {
                return res.status(400).json({ error: 'Selo DDAL só permitido para D&D > 5e > 2024.' });
            }
        }
        const vttPlatformUuid = await tableService_1.TableService.validateVttPlatform(data.vtt_platform_id ?? null);
        const slug = tableService_1.TableService.generateSlug(data.title);
        const tableData = tableService_1.TableService.prepareTableData(data, gmProfile.id, vttPlatformUuid, slug, userRole);
        // Persistência usando Repository
        const newTable = await tableRepository_1.TableRepository.createTableWithRelations(tableData, data.contacts, data.schedules);
        return res.status(201).json({ data: newTable });
    }
    catch (error) {
        console.error('[POST /gm/tables]', error);
        if (error.message === 'Plataforma VTT inválida') {
            return res.status(400).json({ error: error.message });
        }
        if (error.code === '23502') {
            return res.status(400).json({ error: `Campo obrigatório ausente: ${error.column || 'desconhecido'}` });
        }
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Referência inválida nos dados enviados.' });
        }
        return res.status(500).json({ error: 'Erro ao criar mesa.' });
    }
});
// PUT /api/v1/gm/tables/:id — Edita mesa própria
router.put('/tables/:id', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const validation = tableValidators_1.updateTableSchema.safeParse(req.body);
    if (!validation.success) {
        const firstError = validation.error.issues[0];
        return res.status(400).json({
            error: firstError.message,
            field: firstError.path.join('.'),
        });
    }
    const data = validation.data;
    try {
        const gmProfile = await db_1.db
            .selectFrom('gm_profiles')
            .select(['id'])
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (!gmProfile) {
            return res.status(403).json({ error: 'Perfil de mestre não encontrado.' });
        }
        const existingTable = await db_1.db
            .selectFrom('tables')
            .select(['id', 'gm_id', 'system_id'])
            .where('id', '=', id)
            .where('gm_id', '=', gmProfile.id)
            .executeTakeFirst();
        if (!existingTable) {
            return res.status(404).json({ error: 'Mesa não encontrada ou sem permissão.' });
        }
        // Validações
        if (data.is_ddal && (data.system_id ?? existingTable.system_id)) {
            const systemId = data.system_id ?? existingTable.system_id;
            if (systemId) {
                const isEligible = await tableService_1.TableService.isDdalEligibleSystem(systemId);
                if (!isEligible) {
                    return res.status(400).json({ error: 'Selo DDAL só permitido para D&D > 5e > 2024.' });
                }
            }
        }
        // Preparar dados de atualização
        const updateData = {
            title: data.title,
            description: data.description,
            system_id: data.system_id,
            scenario_id: data.scenario_id,
            type: data.type,
            audience: data.audience,
            modality: data.modality,
            price_type: data.price_type,
            price_value: data.price_value,
            price_frequency: data.price_frequency,
            slots_total: data.slots_total,
            slots_filled: data.slots_filled,
            slots_open: data.slots_open,
            language: data.language,
            experience_level: data.experience_level,
            starts_at: data.starts_at ? new Date(data.starts_at) : undefined,
            city: data.city,
            state: data.state,
            content_warnings: data.content_warnings,
            safety_tools: data.safety_tools,
            publisher_role: data.publisher_role,
            actual_gm_name: data.publisher_role === 'announcer' ? data.actual_gm_name : null,
            is_ddal: data.is_ddal,
            ddal_code: data.is_ddal ? data.ddal_code : undefined,
            ddal_name: data.is_ddal ? data.ddal_name : undefined,
            ddal_tier: data.is_ddal ? data.ddal_tier : undefined,
            ddal_season: data.is_ddal ? data.ddal_season : undefined,
            ddal_duration: data.is_ddal ? data.ddal_duration : undefined,
            ddal_format: data.is_ddal ? data.ddal_format : undefined,
            ddal_org_code: data.is_ddal ? data.ddal_org_code : undefined,
            ddal_setting: data.is_ddal ? data.ddal_setting : undefined,
            ddal_rules_notes: data.is_ddal ? data.ddal_rules_notes : undefined,
            frequency: data.frequency,
            frequency_custom: data.frequency_custom,
            vtt_platform_id: data.vtt_platform_id,
            game_platform_custom: data.game_platform_custom,
            communication_platform: data.communication_platform,
            rules_notes: data.rules_notes,
            banner_url: data.banner_url,
            master_display_name: data.master_display_name,
            campaign_length: data.campaign_length,
            level_range: data.level_range,
            billing_text: data.billing_text,
            session_zero_free: data.session_zero_free,
            synopsis: data.synopsis,
            style_text: data.style_text,
            listing_excerpt: data.listing_excerpt,
            technical_requirements: data.technical_requirements,
            requires_pc: data.requires_pc,
            requires_camera: data.requires_camera,
            requires_microphone: data.requires_microphone,
            setting_name: data.setting_name,
            setting_styles: data.setting_styles,
            synopsis_narrative: data.synopsis_narrative,
            benefits_text: data.benefits_text,
            table_gm_bio: data.table_gm_bio,
        };
        const updated = await tableRepository_1.TableRepository.updateTableWithRelations(id, gmProfile.id, updateData, data.contacts, data.schedules);
        if (!updated) {
            return res.status(404).json({ error: 'Mesa não encontrada.' });
        }
        return res.json({ data: updated });
    }
    catch (error) {
        console.error('[PUT /gm/tables/:id]', error);
        return res.status(500).json({ error: 'Erro ao editar mesa.' });
    }
});
// GET /api/v1/gm/tables — Lista mesas do mestre
router.get('/tables', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    try {
        const gmProfile = await db_1.db
            .selectFrom('gm_profiles')
            .select('id')
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (!gmProfile)
            return res.status(403).json({ error: 'Perfil de mestre não encontrado.' });
        const tables = await db_1.db
            .selectFrom('tables as t')
            .leftJoin('systems as s', 's.id', 't.system_id')
            .leftJoin('table_metrics as tm', 'tm.table_id', 't.id')
            .select([
            't.id',
            't.slug',
            't.title',
            't.description',
            't.banner_url as image_url',
            't.status',
            't.modality',
            't.system_id',
            't.type',
            't.audience',
            't.price_type',
            't.price_value',
            't.price_frequency',
            't.slots_total',
            't.slots_filled',
            't.slots_open',
            't.language',
            't.experience_level',
            't.starts_at',
            't.city',
            't.state',
            't.content_warnings',
            't.safety_tools',
            't.publisher_role',
            't.actual_gm_name',
            't.is_ddal',
            't.ddal_code',
            't.ddal_name',
            't.ddal_tier',
            't.created_at',
            't.updated_at',
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
            't.setting_name',
            't.setting_styles',
            't.synopsis_narrative',
            't.benefits_text',
            't.table_gm_bio',
            't.frequency',
            't.frequency_custom',
            't.vtt_platform_id',
            't.game_platform_custom',
            't.communication_platform',
            's.name as system_name',
            (0, kysely_1.sql) `COALESCE(tm.views_count, 0)`.as('metrics_views'),
            (0, kysely_1.sql) `COALESCE(tm.clicks_count, 0)`.as('metrics_clicks'),
            (0, kysely_1.sql) `COALESCE(tm.contacts_count, 0)`.as('metrics_contacts'),
            (0, kysely_1.sql) `COALESCE(tm.favorites_count, 0)`.as('metrics_favorites'),
        ])
            .where('t.gm_id', '=', gmProfile.id)
            .orderBy('t.created_at', 'desc')
            .execute();
        if (tables.length === 0) {
            return res.json({ data: [] });
        }
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
            contactsByTable.get(contact.table_id).push(contact);
        }
        const schedules = await db_1.db
            .selectFrom('table_schedules')
            .selectAll()
            .where('table_id', 'in', tableIds)
            .orderBy('sort_order', 'asc')
            .execute();
        const schedulesByTable = new Map();
        for (const schedule of schedules) {
            if (!schedulesByTable.has(schedule.table_id)) {
                schedulesByTable.set(schedule.table_id, []);
            }
            schedulesByTable.get(schedule.table_id).push(schedule);
        }
        const tablesWithData = tables.map((table) => ({
            ...table,
            contacts: contactsByTable.get(table.id) ?? [],
            schedules: schedulesByTable.get(table.id) ?? [],
        }));
        return res.json({ data: tablesWithData });
    }
    catch (error) {
        console.error('[GET /gm/tables]', error);
        return res.status(500).json({ error: 'Erro ao buscar mesas.' });
    }
});
// PATCH /api/v1/gm/tables/:id/status — Altera status da mesa
router.patch('/tables/:id/status', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { id } = req.params;
    const { status } = req.body;
    // LOG TEMPORÁRIO: Diagnóstico do erro 401
    console.log('[PATCH /tables/:id/status] Requisição recebida:', {
        userId,
        userRole,
        tableId: id,
        statusRequested: status,
        hasAuthHeader: !!req.headers.authorization,
        hasCookie: !!req.cookies?.am_session,
        timestamp: new Date().toISOString()
    });
    const validStatuses = ['active', 'full', 'cancelled', 'ended'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status inválido. Valores: ${validStatuses.join(', ')}` });
    }
    try {
        const table = await db_1.db
            .selectFrom('tables')
            .select(['id', 'gm_id'])
            .where('id', '=', id)
            .executeTakeFirst();
        if (!table) {
            return res.status(404).json({ error: 'Mesa não encontrada.' });
        }
        if (userRole === 'admin') {
            const result = await db_1.db
                .updateTable('tables')
                .set({ status })
                .where('id', '=', id)
                .returning(['id', 'slug', 'title', 'status'])
                .executeTakeFirst();
            return res.json({ data: result });
        }
        const gmProfile = await db_1.db
            .selectFrom('gm_profiles')
            .select('id')
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (!gmProfile || table.gm_id !== gmProfile.id) {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        const result = await db_1.db
            .updateTable('tables')
            .set({ status })
            .where('id', '=', id)
            .returning(['id', 'slug', 'title', 'status'])
            .executeTakeFirst();
        return res.json({ data: result });
    }
    catch (error) {
        console.error('[PATCH /gm/tables/:id/status]', error);
        return res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
});
// DELETE /api/v1/gm/tables/:id — Deleta mesa própria
router.delete('/tables/:id', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    try {
        const gmProfile = await db_1.db
            .selectFrom('gm_profiles')
            .select('id')
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (!gmProfile) {
            return res.status(403).json({ error: 'Perfil de mestre não encontrado.' });
        }
        const existingTable = await db_1.db
            .selectFrom('tables')
            .select(['id', 'title', 'gm_id'])
            .where('id', '=', id)
            .where('gm_id', '=', gmProfile.id)
            .executeTakeFirst();
        if (!existingTable) {
            return res.status(404).json({ error: 'Mesa não encontrada.' });
        }
        await tableRepository_1.TableRepository.deleteTableWithRelations(id);
        return res.json({ data: { message: `Mesa "${existingTable.title}" deletada.` } });
    }
    catch (error) {
        console.error('[DELETE /gm/tables/:id]', error);
        return res.status(500).json({ error: 'Erro ao deletar mesa.' });
    }
});
// ============================================================================
// ROTAS DE MÉTRICAS
// ============================================================================
router.post('/tables/:slug/view', async (req, res) => {
    const { slug } = req.params;
    try {
        const table = await db_1.db
            .selectFrom('tables')
            .select('id')
            .where('slug', '=', slug)
            .executeTakeFirst();
        if (!table)
            return res.sendStatus(404);
        const fingerprint = generateFingerprint(req);
        const shouldCount = await shouldCountMetric(table.id, 'view', fingerprint);
        if (!shouldCount)
            return res.sendStatus(202);
        await db_1.db.transaction().execute(async (trx) => {
            await trx
                .insertInto('table_metric_events')
                .values({ table_id: table.id, action: 'view', fingerprint_hash: fingerprint })
                .execute();
            await trx
                .insertInto('table_metrics')
                .values({ table_id: table.id, views_count: 1 })
                .onConflict((oc) => oc.column('table_id').doUpdateSet({
                views_count: (0, kysely_1.sql) `table_metrics.views_count + 1`,
                updated_at: (0, kysely_1.sql) `NOW()`,
            }))
                .execute();
        });
        res.sendStatus(200);
    }
    catch (error) {
        console.error('[POST /tables/:slug/view]', error);
        res.sendStatus(500);
    }
});
router.post('/tables/:id/click', async (req, res) => {
    const { id } = req.params;
    try {
        const table = await db_1.db.selectFrom('tables').select('id').where('id', '=', id).executeTakeFirst();
        if (!table)
            return res.sendStatus(404);
        const fingerprint = generateFingerprint(req);
        const shouldCount = await shouldCountMetric(id, 'click', fingerprint);
        if (!shouldCount)
            return res.sendStatus(202);
        await db_1.db.transaction().execute(async (trx) => {
            await trx
                .insertInto('table_metric_events')
                .values({ table_id: id, action: 'click', fingerprint_hash: fingerprint })
                .execute();
            await trx
                .insertInto('table_metrics')
                .values({ table_id: id, clicks_count: 1 })
                .onConflict((oc) => oc.column('table_id').doUpdateSet({
                clicks_count: (0, kysely_1.sql) `table_metrics.clicks_count + 1`,
                updated_at: (0, kysely_1.sql) `NOW()`,
            }))
                .execute();
        });
        res.sendStatus(200);
    }
    catch (error) {
        console.error('[POST /tables/:id/click]', error);
        res.sendStatus(500);
    }
});
router.post('/tables/:id/contact', async (req, res) => {
    const { id } = req.params;
    try {
        const table = await db_1.db.selectFrom('tables').select('id').where('id', '=', id).executeTakeFirst();
        if (!table)
            return res.sendStatus(404);
        const fingerprint = generateFingerprint(req);
        const shouldCount = await shouldCountMetric(id, 'contact', fingerprint);
        if (!shouldCount)
            return res.sendStatus(202);
        await db_1.db.transaction().execute(async (trx) => {
            await trx
                .insertInto('table_metric_events')
                .values({ table_id: id, action: 'contact', fingerprint_hash: fingerprint })
                .execute();
            await trx
                .insertInto('table_metrics')
                .values({ table_id: id, contacts_count: 1 })
                .onConflict((oc) => oc.column('table_id').doUpdateSet({
                contacts_count: (0, kysely_1.sql) `table_metrics.contacts_count + 1`,
                updated_at: (0, kysely_1.sql) `NOW()`,
            }))
                .execute();
        });
        res.sendStatus(200);
    }
    catch (error) {
        console.error('[POST /tables/:id/contact]', error);
        res.sendStatus(500);
    }
});
router.post('/tables/:id/favorite', async (req, res) => {
    const { id } = req.params;
    try {
        const table = await db_1.db.selectFrom('tables').select('id').where('id', '=', id).executeTakeFirst();
        if (!table)
            return res.sendStatus(404);
        const fingerprint = generateFingerprint(req);
        const shouldCount = await shouldCountMetric(id, 'favorite', fingerprint);
        if (!shouldCount)
            return res.sendStatus(202);
        await db_1.db.transaction().execute(async (trx) => {
            await trx
                .insertInto('table_metric_events')
                .values({ table_id: id, action: 'favorite', fingerprint_hash: fingerprint })
                .execute();
            await trx
                .insertInto('table_metrics')
                .values({ table_id: id, favorites_count: 1 })
                .onConflict((oc) => oc.column('table_id').doUpdateSet({
                favorites_count: (0, kysely_1.sql) `table_metrics.favorites_count + 1`,
                updated_at: (0, kysely_1.sql) `NOW()`,
            }))
                .execute();
        });
        res.sendStatus(200);
    }
    catch (error) {
        console.error('[POST /tables/:id/favorite]', error);
        res.sendStatus(500);
    }
});
exports.default = router;
