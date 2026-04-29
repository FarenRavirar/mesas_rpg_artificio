"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kysely_1 = require("kysely");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const linkService_1 = require("../services/linkService");
const urlValidation_1 = require("../utils/urlValidation");
const router = (0, express_1.Router)();
function buildRecommendations(metrics) {
    // Agrupa por title para evitar 3x "Pathfinder: Kingmaker"
    const byTitle = new Map();
    for (const m of metrics) {
        const key = m.title.trim().toLowerCase();
        if (!byTitle.has(key))
            byTitle.set(key, []);
        byTitle.get(key).push(m);
    }
    const recs = [];
    for (const group of byTitle.values()) {
        const first = group[0];
        const count = group.length;
        // Se há duplicidade, gerar recomendação específica de consolidação
        if (count > 1) {
            recs.push({
                table_slug: first.slug,
                severity: 'medium',
                message: `Mesa "${first.title}" está publicada ${count} vezes com status ativo. Consolide em uma única publicação para concentrar métricas.`,
            });
            continue;
        }
        // Soma métricas do grupo (count === 1 aqui)
        const totalViews = group.reduce((s, m) => s + m.views, 0);
        const totalClicks = group.reduce((s, m) => s + m.clicks, 0);
        const totalContacts = group.reduce((s, m) => s + m.contacts, 0);
        if (totalViews >= 20 && totalContacts === 0) {
            recs.push({
                table_slug: first.slug,
                severity: 'high',
                message: `Mesa "${first.title}" tem ${totalViews} visualizações e zero contatos. Revise capa, preço e descrição.`,
            });
            continue;
        }
        if (totalClicks >= 10 && totalContacts === 0) {
            recs.push({
                table_slug: first.slug,
                severity: 'medium',
                message: `Mesa "${first.title}" recebe cliques mas não gera contato. Teste um CTA mais direto na descrição.`,
            });
            continue;
        }
        if (totalViews === 0 && totalClicks === 0) {
            recs.push({
                table_slug: first.slug,
                severity: 'low',
                message: `Mesa "${first.title}" ainda não recebeu tráfego. Compartilhe o link em suas redes.`,
            });
        }
    }
    return recs;
}
// GET /api/v1/gm/:slug — Perfil público do mestre (anônimo + autenticado opcional)
router.get('/:slug', rateLimit_1.publicRateLimiter, auth_1.optionalAuth, async (req, res) => {
    const { slug } = req.params;
    try {
        const gm = await db_1.db
            .selectFrom('gm_profiles as gm')
            .innerJoin('users as u', 'u.id', 'gm.user_id')
            .innerJoin('profiles as p', 'p.user_id', 'u.id')
            .select([
            'gm.id',
            'gm.user_id',
            'gm.slug',
            (0, kysely_1.sql) `COALESCE(gm.nickname, p.display_name)`.as('display_name'),
            'gm.bio_long',
            'gm.tagline',
            (0, kysely_1.sql) `COALESCE(gm.avatar_url, p.avatar_url)`.as('avatar_url'),
            'gm.banner_url',
            'gm.languages',
            'gm.specialties',
            'gm.badges',
            'gm.selling_points',
            'gm.promo_badge_text',
            'gm.closed_group_enabled',
            'gm.closed_group_systems',
            'gm.closed_group_description',
            'gm.closed_group_min_price_cents',
            (0, kysely_1.sql) `(SELECT COUNT(*)::int FROM tables WHERE gm_id = gm.id AND status = 'active')`.as('tables_count'),
            'gm.avg_rating',
            'gm.reviews_count',
            'gm.created_at',
            // Campos extras para prova social
            'gm.discord_connected',
            'gm.discord_username',
            'gm.covil_verified',
            'gm.experience_years',
            'gm.average_price',
            'gm.preferred_vtt_platforms',
            'gm.contact_methods',
        ])
            // Nunca retornar deletehash — REGRA PÉTREA
            .where('gm.slug', '=', slug)
            .executeTakeFirst();
        if (!gm) {
            return res.status(404).json({ error: 'Mestre não encontrado.' });
        }
        // Aumenta qualidade de imagens do Google (mesmo tratamento do og.ts)
        if (gm.avatar_url) {
            gm.avatar_url = (0, urlValidation_1.upgradeGoogleImageQuality)(gm.avatar_url, 400);
        }
        if (gm.banner_url) {
            gm.banner_url = (0, urlValidation_1.upgradeGoogleImageQuality)(gm.banner_url, 400);
        }
        const viewer_context = {
            is_owner: req.user?.userId === gm.user_id,
            is_admin: req.user?.role === 'admin',
        };
        // Buscar mesas ativas do mestre (sem métricas sensíveis)
        const tables = await db_1.db
            .selectFrom('tables as t')
            .leftJoin('systems as s', 's.id', 't.system_id')
            .leftJoin('vtt_platforms as vtt', 'vtt.id', 't.vtt_platform_id')
            .select([
            't.id',
            't.slug',
            't.title',
            't.description',
            't.cover_url',
            't.status',
            't.type',
            't.audience',
            't.modality',
            't.price_type',
            't.price_value',
            't.slots_total',
            't.slots_filled',
            't.language',
            't.experience_level',
            't.publisher_role',
            't.actual_gm_name',
            't.featured',
            't.is_covil',
            't.is_ddal',
            't.ddal_code',
            't.ddal_name',
            't.ddal_tier',
            't.created_at',
            't.synopsis_narrative',
            't.features',
            's.name as system_name',
            's.slug as system_slug',
            's.logo_filename as system_logo_filename',
            's.website_url as system_website_url',
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
            't.game_platform_custom',
        ])
            .where('t.gm_id', '=', gm.id)
            .where('t.status', '=', 'active')
            .orderBy('t.featured', 'desc')
            .orderBy('t.created_at', 'desc')
            .execute();
        let tablesWithContacts = [];
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
        // CORREÇÃO DT-04: Buscar links públicos do mestre com contrato completo
        const links = await db_1.db
            .selectFrom('user_links')
            .innerJoin('users as u', 'u.id', 'user_links.user_id')
            .innerJoin('gm_profiles as gm_check', 'gm_check.user_id', 'u.id')
            .select([
            'user_links.id',
            'user_links.url',
            'user_links.title',
            'user_links.description',
            'user_links.type',
            'user_links.thumbnail_url',
            'user_links.sort_order',
            'user_links.metadata_status',
        ])
            .where('gm_check.id', '=', gm.id)
            .orderBy('user_links.sort_order', 'asc')
            .execute();
        if (links.length > 0) {
            const linkIdsToTouch = links.map(l => l.id);
            db_1.db.updateTable('user_links')
                .set({ metadata_last_accessed_at: (0, kysely_1.sql) `NOW()` })
                .where('id', 'in', linkIdsToTouch)
                .where('metadata_last_accessed_at', '<', (0, kysely_1.sql) `NOW() - interval '6 hours'`)
                .execute()
                .catch((e) => console.error('[GET /gm/:slug] Falha ao atualizar acesso do link:', e));
            // CORREÇÃO DT-04: Worker "fire-and-forget" para cobrir base de links órfãos ('pending')
            if (links.some(l => l.metadata_status === 'pending')) {
                const { processPendingLinks } = require('../scripts/processLinkMetadataJobs');
                processPendingLinks().catch((err) => console.error('Silent processPending error:', err));
            }
        }
        const enrichedLinks = links.map((link) => ({
            ...link,
            embed_url: (0, linkService_1.generateEmbedUrl)(link.url, link.type)
        }));
        let closedGroupSystems = [];
        if (gm.closed_group_enabled && Array.isArray(gm.closed_group_systems) && gm.closed_group_systems.length > 0) {
            closedGroupSystems = await db_1.db
                .selectFrom('systems')
                .select(['id', 'name'])
                .where('id', 'in', gm.closed_group_systems)
                .execute();
        }
        // Buscar VTT platforms preferidas do mestre
        let preferredVttPlatforms = [];
        if (Array.isArray(gm.preferred_vtt_platforms) && gm.preferred_vtt_platforms.length > 0) {
            preferredVttPlatforms = await db_1.db
                .selectFrom('vtt_platforms')
                .select(['id', 'name', 'slug', 'logo_filename', 'website_url'])
                .where('id', 'in', gm.preferred_vtt_platforms)
                .execute();
        }
        const closed_group = {
            enabled: !!gm.closed_group_enabled,
            systems: closedGroupSystems,
            description: gm.closed_group_description,
            min_price_cents: gm.closed_group_min_price_cents,
        };
        const { user_id, closed_group_enabled, closed_group_systems, closed_group_description, closed_group_min_price_cents, preferred_vtt_platforms, ...gmPublic } = gm;
        return res.json({
            data: {
                ...gmPublic,
                closed_group,
                preferred_vtt_platforms: preferredVttPlatforms,
                tables: tablesWithContacts,
                links: enrichedLinks,
                viewer_context,
            },
        });
    }
    catch (error) {
        console.error('[GET /gm/:slug]', error);
        return res.status(500).json({ error: 'Erro ao buscar perfil do mestre.' });
    }
});
// POST /api/v1/gm/:slug/view — Registrar visualização do perfil público
router.post('/:slug/view', async (req, res) => {
    const { slug } = req.params;
    const sessionId = req.header('x-session-id')?.trim();
    if (!slug || slug.length > 200 || !/^[a-z0-9-]+$/i.test(slug)) {
        return res.status(400).json({ error: 'Slug inválido.' });
    }
    if (!sessionId || sessionId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
        return res.status(400).json({ error: 'Sessão inválida.' });
    }
    try {
        const gm = await db_1.db
            .selectFrom('gm_profiles as gm')
            .select(['gm.id'])
            .where('gm.slug', '=', slug)
            .executeTakeFirst();
        if (!gm) {
            return res.status(404).json({ error: 'Mestre não encontrado.' });
        }
        const counted = await db_1.db.transaction().execute(async (trx) => {
            const insertedViewEvent = await trx
                .insertInto('gm_profile_view_events')
                .values({
                gm_profile_id: gm.id,
                session_id: sessionId,
            })
                .onConflict((oc) => oc.columns(['gm_profile_id', 'session_id']).doNothing())
                .returning('id')
                .executeTakeFirst();
            if (!insertedViewEvent) {
                return false;
            }
            await trx
                .insertInto('gm_profile_metrics')
                .values({
                gm_profile_id: gm.id,
                views_count: 1,
            })
                .onConflict((oc) => oc.column('gm_profile_id').doUpdateSet({
                views_count: (0, kysely_1.sql) `gm_profile_metrics.views_count + 1`,
                updated_at: (0, kysely_1.sql) `NOW()`,
            }))
                .execute();
            return true;
        });
        if (!counted) {
            return res.status(202).json({ success: true, deduped: true });
        }
        return res.json({ success: true, deduped: false });
    }
    catch (error) {
        console.error('[POST /gm/:slug/view]', error);
        return res.status(500).json({ error: 'Erro ao registrar visualização do perfil.' });
    }
});
// GET /api/v1/gm/:slug/insights
// Protegido: somente dono ou admin.
router.get('/:slug/insights', rateLimit_1.authRateLimiter, auth_1.authMiddleware, async (req, res) => {
    const { slug } = req.params;
    try {
        const gm = await db_1.db
            .selectFrom('gm_profiles')
            .select(['id', 'user_id'])
            .where('slug', '=', slug)
            .executeTakeFirst();
        if (!gm) {
            return res.status(404).json({ error: 'Mestre não encontrado.' });
        }
        const isOwner = req.user.userId === gm.user_id;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const metrics = await db_1.db
            .selectFrom('tables as t')
            .leftJoin('table_metrics as tm', 'tm.table_id', 't.id')
            .select([
            't.id',
            't.slug',
            't.title',
            (0, kysely_1.sql) `COALESCE(tm.views_count, 0)`.as('views'),
            (0, kysely_1.sql) `COALESCE(tm.clicks_count, 0)`.as('clicks'),
            (0, kysely_1.sql) `COALESCE(tm.contacts_count, 0)`.as('contacts'),
            (0, kysely_1.sql) `COALESCE(tm.favorites_count, 0)`.as('favorites'),
        ])
            .where('t.gm_id', '=', gm.id)
            .where('t.status', '=', 'active')
            .orderBy('t.created_at', 'desc')
            .execute();
        const recommendations = buildRecommendations(metrics);
        return res.json({
            data: {
                metrics,
                recommendations,
            },
        });
    }
    catch (error) {
        console.error('[GET /gm/:slug/insights]', error);
        return res.status(500).json({ error: 'Erro ao buscar insights.' });
    }
});
// POST /:slug/contact - Formulário de contato
router.post('/:slug/contact', rateLimit_1.publicRateLimiter, async (req, res) => {
    try {
        const { slug } = req.params;
        const { name, email, message } = req.body;
        // Validações
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Nome, email e mensagem são obrigatórios.' });
        }
        if (name.length > 100) {
            return res.status(400).json({ error: 'Nome muito longo (máximo 100 caracteres).' });
        }
        if (message.length > 1000) {
            return res.status(400).json({ error: 'Mensagem muito longa (máximo 1000 caracteres).' });
        }
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido.' });
        }
        // Buscar email do mestre
        const profile = await db_1.db
            .selectFrom('gm_profiles as gp')
            .innerJoin('users as u', 'gp.user_id', 'u.id')
            // @ts-ignore - Kysely tem problema de inferência com aliases de tabelas diferentes
            .select(['u.email', 'gp.display_name'])
            .where('gp.slug', '=', slug)
            .executeTakeFirst();
        if (!profile || !profile.email) {
            return res.status(404).json({ error: 'Mestre não encontrado.' });
        }
        // TODO: Implementar envio de email
        // Por enquanto, apenas registrar no console
        console.log('[CONTACT FORM]', {
            to: profile.email,
            from: email,
            name,
            message,
            masterName: profile.display_name,
        });
        // Retornar sucesso
        return res.json({
            success: true,
            message: 'Mensagem enviada com sucesso! O mestre receberá seu contato em breve.',
        });
    }
    catch (error) {
        console.error('[POST /gm/:slug/contact]', error);
        return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    }
});
// POST /api/v1/gm/:slug/contact-click — Registrar clique em método de contato
router.post('/:slug/contact-click', rateLimit_1.publicRateLimiter, async (req, res) => {
    const { slug } = req.params;
    const { channel } = req.body;
    // Validar slug
    if (!slug || slug.length > 200 || !/^[a-z0-9-]+$/i.test(slug)) {
        return res.status(400).json({ error: 'Slug inválido.' });
    }
    // Validar channel
    const validChannels = ['whatsapp', 'email', 'discord', 'form'];
    if (!channel || !validChannels.includes(channel)) {
        return res.status(400).json({ error: 'Canal inválido.' });
    }
    try {
        // Buscar perfil GM pelo slug
        const profile = await db_1.db
            .selectFrom('gm_profiles as gm')
            .select(['gm.id'])
            .where('gm.slug', '=', slug)
            .executeTakeFirst();
        if (!profile) {
            return res.status(404).json({ error: 'Mestre não encontrado.' });
        }
        // Registrar clique (por enquanto apenas log, futuramente pode salvar em tabela)
        console.log('[GM CONTACT CLICK]', {
            gm_profile_id: profile.id,
            slug,
            channel,
            timestamp: new Date().toISOString(),
        });
        // TODO: Salvar em tabela gm_contact_metrics para analytics
        // await db.insertInto('gm_contact_clicks').values({ gm_profile_id: profile.id, channel }).execute();
        res.json({ success: true });
    }
    catch (error) {
        console.error('[POST /gm/:slug/contact-click]', error);
        res.status(500).json({ error: 'Erro ao registrar clique.' });
    }
});
exports.default = router;
