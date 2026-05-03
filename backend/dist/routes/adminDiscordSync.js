"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const discord_1 = require("../discord");
const settingsCrypto_1 = require("../discord/settingsCrypto");
const router = (0, express_1.Router)();
function isAdmin(req, res) {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Acesso restrito a administradores.' });
        return false;
    }
    return true;
}
// ─── Schemas de validacao ────────────────────────────────────────────────────
const createSourceSchema = zod_1.z.object({
    guild_id: zod_1.z.string().min(1),
    channel_id: zod_1.z.string().min(1),
    channel_name: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().optional(),
    auto_sync_enabled: zod_1.z.boolean().optional(),
});
const updateSourceSchema = zod_1.z.object({
    channel_name: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().optional(),
    auto_sync_enabled: zod_1.z.boolean().optional(),
});
const updateDraftSchema = zod_1.z.object({
    normalized_payload: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    status: zod_1.z.enum(['draft', 'ready', 'needs_review', 'rejected']).optional(),
    review_notes: zod_1.z.string().optional(),
});
const fetchSchema = zod_1.z.object({
    source_id: zod_1.z.string().uuid(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    before_message_id: zod_1.z.string().optional(),
});
const snowflakeParamSchema = zod_1.z.object({
    guildId: zod_1.z.string().regex(/^\d{5,30}$/, 'Servidor Discord inválido.'),
});
const botTokenSchema = zod_1.z.object({
    token: zod_1.z.string().trim().min(50, 'Token deve ter pelo menos 50 caracteres.').regex(/^\S+$/, 'Token não pode conter espaços.'),
});
function maskToken(token) {
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
function sendSettingsError(res, error, fallbackMessage) {
    if (error instanceof settingsCrypto_1.DiscordSettingsSecretUnavailableError) {
        return res.status(503).json({ error: error.message });
    }
    console.error(fallbackMessage, error);
    return res.status(500).json({ error: 'Erro ao acessar configurações do Discord.' });
}
function sendDiscordDiscoveryError(res, error, fallbackMessage) {
    if (error instanceof settingsCrypto_1.DiscordSettingsSecretUnavailableError) {
        return res.status(503).json({ error: error.message });
    }
    if (error instanceof discord_1.DiscordDiscoveryError) {
        return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof Error && error.message.includes('DISCORD_BOT_TOKEN não configurado')) {
        return res.status(422).json({ error: 'Configure o token do bot antes de descobrir servidores e canais.' });
    }
    console.error(fallbackMessage, error);
    return res.status(502).json({ error: 'Não foi possível consultar o Discord agora. Tente novamente em instantes.' });
}
// ─── Configuracoes ───────────────────────────────────────────────────────────
// GET /settings
router.get('/settings', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const setting = await db_1.db
            .selectFrom('discord_settings')
            .select(['value', 'updated_at'])
            .where('guild_id', 'is', null)
            .where('key', '=', 'bot_token')
            .executeTakeFirst();
        if (!setting) {
            return res.json({ data: { bot_token: { is_set: false, preview: null, updated_at: null } } });
        }
        const token = (0, settingsCrypto_1.decryptDiscordSetting)(setting.value);
        return res.json({
            data: {
                bot_token: {
                    is_set: true,
                    preview: maskToken(token),
                    updated_at: setting.updated_at,
                },
            },
        });
    }
    catch (error) {
        return sendSettingsError(res, error, '[GET /admin/discord-sync/settings]');
    }
});
// PUT /settings/bot-token
router.put('/settings/bot-token', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    const parsed = botTokenSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Token inválido.', details: parsed.error.flatten() });
    }
    try {
        const encryptedValue = (0, settingsCrypto_1.encryptDiscordSetting)(parsed.data.token);
        const existing = await db_1.db
            .selectFrom('discord_settings')
            .select('id')
            .where('guild_id', 'is', null)
            .where('key', '=', 'bot_token')
            .executeTakeFirst();
        const now = new Date();
        const setting = existing
            ? await db_1.db
                .updateTable('discord_settings')
                .set({ value: encryptedValue, updated_at: now })
                .where('id', '=', existing.id)
                .returning(['updated_at'])
                .executeTakeFirstOrThrow()
            : await db_1.db
                .insertInto('discord_settings')
                .values({
                guild_id: null,
                key: 'bot_token',
                value: encryptedValue,
                updated_at: now,
            })
                .returning(['updated_at'])
                .executeTakeFirstOrThrow();
        return res.json({
            data: {
                is_set: true,
                preview: maskToken(parsed.data.token),
                updated_at: setting.updated_at,
            },
        });
    }
    catch (error) {
        return sendSettingsError(res, error, '[PUT /admin/discord-sync/settings/bot-token]');
    }
});
// DELETE /settings/bot-token
router.delete('/settings/bot-token', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        await db_1.db
            .deleteFrom('discord_settings')
            .where('guild_id', 'is', null)
            .where('key', '=', 'bot_token')
            .execute();
        return res.status(204).send();
    }
    catch (error) {
        return sendSettingsError(res, error, '[DELETE /admin/discord-sync/settings/bot-token]');
    }
});
// ─── Descoberta de servidores/canais ─────────────────────────────────────────
// GET /discovery/guilds
router.get('/discovery/guilds', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const guilds = await (0, discord_1.discoverDiscordGuilds)();
        return res.json({ data: guilds });
    }
    catch (error) {
        return sendDiscordDiscoveryError(res, error, '[GET /admin/discord-sync/discovery/guilds]');
    }
});
// GET /discovery/guilds/:guildId/channels
router.get('/discovery/guilds/:guildId/channels', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    const parsed = snowflakeParamSchema.safeParse(req.params);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Servidor Discord inválido.', details: parsed.error.flatten() });
    }
    try {
        const channels = await (0, discord_1.discoverDiscordChannels)(parsed.data.guildId);
        return res.json({ data: channels });
    }
    catch (error) {
        return sendDiscordDiscoveryError(res, error, '[GET /admin/discord-sync/discovery/guilds/:guildId/channels]');
    }
});
// ─── Fontes (canais autorizados) ─────────────────────────────────────────────
// GET /sources
router.get('/sources', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const sources = await db_1.db
            .selectFrom('discord_import_sources')
            .selectAll()
            .orderBy('created_at', 'desc')
            .execute();
        return res.json({ data: sources });
    }
    catch (error) {
        console.error('[GET /admin/discord-sync/sources]', error);
        return res.status(500).json({ error: 'Erro ao listar fontes.' });
    }
});
// POST /sources
router.post('/sources', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    const parsed = createSourceSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    }
    try {
        const existing = await db_1.db
            .selectFrom('discord_import_sources')
            .select('id')
            .where('channel_id', '=', parsed.data.channel_id)
            .executeTakeFirst();
        if (existing) {
            return res.status(409).json({ error: 'Canal já cadastrado.' });
        }
        const [source] = await db_1.db
            .insertInto('discord_import_sources')
            .values(parsed.data)
            .returningAll()
            .execute();
        return res.status(201).json({ data: source });
    }
    catch (error) {
        console.error('[POST /admin/discord-sync/sources]', error);
        return res.status(500).json({ error: 'Erro ao criar fonte.' });
    }
});
// PATCH /sources/:id
router.patch('/sources/:id', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    const { id } = req.params;
    const parsed = updateSourceSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    }
    if (Object.keys(parsed.data).length === 0) {
        return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
    }
    try {
        const [source] = await db_1.db
            .updateTable('discord_import_sources')
            .set({ ...parsed.data, updated_at: new Date() })
            .where('id', '=', id)
            .returningAll()
            .execute();
        if (!source)
            return res.status(404).json({ error: 'Fonte não encontrada.' });
        return res.json({ data: source });
    }
    catch (error) {
        console.error('[PATCH /admin/discord-sync/sources/:id]', error);
        return res.status(500).json({ error: 'Erro ao atualizar fonte.' });
    }
});
// DELETE /sources/:id
router.delete('/sources/:id', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    const { id } = req.params;
    try {
        const source = await db_1.db
            .selectFrom('discord_import_sources')
            .select('id')
            .where('id', '=', id)
            .executeTakeFirst();
        if (!source)
            return res.status(404).json({ error: 'Fonte não encontrada.' });
        await db_1.db.deleteFrom('discord_import_sources').where('id', '=', id).execute();
        return res.json({ data: { message: 'Fonte removida.' } });
    }
    catch (error) {
        console.error('[DELETE /admin/discord-sync/sources/:id]', error);
        return res.status(500).json({ error: 'Erro ao remover fonte.' });
    }
});
// ─── Ingestao REST ────────────────────────────────────────────────────────────
// POST /fetch — busca mensagens de um canal via REST API Discord
router.post('/fetch', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    const parsed = fetchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    }
    const { source_id, limit, before_message_id } = parsed.data;
    try {
        const source = await db_1.db
            .selectFrom('discord_import_sources')
            .selectAll()
            .where('id', '=', source_id)
            .where('enabled', '=', true)
            .executeTakeFirst();
        if (!source) {
            return res.status(404).json({ error: 'Fonte não encontrada ou desabilitada.' });
        }
        const result = await (0, discord_1.ingestMessages)({
            sourceId: source_id,
            channelId: source.channel_id,
            guildId: source.guild_id,
            limit,
            beforeMessageId: before_message_id,
        });
        // Atualiza last_synced_at apenas se a chamada ao Discord foi concluida com sucesso
        if (result.inserted > 0 || result.updated > 0 || result.total === 0) {
            await db_1.db
                .updateTable('discord_import_sources')
                .set({ last_synced_at: new Date(), updated_at: new Date() })
                .where('id', '=', source_id)
                .execute();
        }
        return res.json({ data: result });
    }
    catch (error) {
        if (error instanceof settingsCrypto_1.DiscordSettingsSecretUnavailableError) {
            return res.status(503).json({ error: error.message });
        }
        if (error instanceof Error && error.message.includes('DISCORD_BOT_TOKEN não configurado')) {
            return res.status(422).json({ error: error.message });
        }
        console.error('[POST /admin/discord-sync/fetch]', error);
        return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
});
// ─── Mensagens ────────────────────────────────────────────────────────────────
// GET /messages
router.get('/messages', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const { source_id, status, limit = '50', offset = '0' } = req.query;
        let query = db_1.db
            .selectFrom('discord_import_messages')
            .selectAll()
            .orderBy('message_created_at', 'desc')
            .limit(Math.min(Number(limit) || 50, 100))
            .offset(Number(offset) || 0);
        if (source_id)
            query = query.where('source_id', '=', source_id);
        const validMessageStatuses = ['pending', 'parsed', 'needs_review', 'synced', 'ignored', 'error'];
        if (status && validMessageStatuses.includes(status)) {
            query = query.where('status', '=', status);
        }
        const messages = await query.execute();
        return res.json({ data: messages });
    }
    catch (error) {
        console.error('[GET /admin/discord-sync/messages]', error);
        return res.status(500).json({ error: 'Erro ao listar mensagens.' });
    }
});
// ─── Drafts ───────────────────────────────────────────────────────────────────
// GET /drafts
router.get('/drafts', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const { status, limit = '50', offset = '0' } = req.query;
        let query = db_1.db
            .selectFrom('discord_import_table_drafts')
            .selectAll()
            .orderBy('created_at', 'desc')
            .limit(Math.min(Number(limit) || 50, 100))
            .offset(Number(offset) || 0);
        const validDraftStatuses = ['draft', 'ready', 'needs_review', 'synced', 'rejected'];
        if (status && validDraftStatuses.includes(status)) {
            query = query.where('status', '=', status);
        }
        const drafts = await query.execute();
        return res.json({ data: drafts });
    }
    catch (error) {
        console.error('[GET /admin/discord-sync/drafts]', error);
        return res.status(500).json({ error: 'Erro ao listar drafts.' });
    }
});
// GET /drafts/:id
router.get('/drafts/:id', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const draft = await db_1.db
            .selectFrom('discord_import_table_drafts')
            .selectAll()
            .where('id', '=', req.params.id)
            .executeTakeFirst();
        if (!draft)
            return res.status(404).json({ error: 'Draft não encontrado.' });
        return res.json({ data: draft });
    }
    catch (error) {
        console.error('[GET /admin/discord-sync/drafts/:id]', error);
        return res.status(500).json({ error: 'Erro ao buscar draft.' });
    }
});
// PATCH /drafts/:id
router.patch('/drafts/:id', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    const parsed = updateDraftSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    }
    if (Object.keys(parsed.data).length === 0) {
        return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
    }
    try {
        const [draft] = await db_1.db
            .updateTable('discord_import_table_drafts')
            .set({ ...parsed.data, updated_at: new Date() })
            .where('id', '=', req.params.id)
            .returningAll()
            .execute();
        if (!draft)
            return res.status(404).json({ error: 'Draft não encontrado.' });
        return res.json({ data: draft });
    }
    catch (error) {
        console.error('[PATCH /admin/discord-sync/drafts/:id]', error);
        return res.status(500).json({ error: 'Erro ao atualizar draft.' });
    }
});
// POST /drafts/:id/reparse — placeholder ate o parser estar implementado (T019)
router.post('/drafts/:id/reparse', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    return res.status(501).json({ error: 'NOT IMPLEMENTED: parser disponível na Fase 5 (T019).' });
});
// POST /drafts/:id/sync
router.post('/drafts/:id/sync', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const result = await (0, discord_1.syncDiscordDraftToTable)(req.params.id);
        return res.json({ data: result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao sincronizar draft.';
        console.error('[POST /admin/discord-sync/drafts/:id/sync]', error);
        if (message.includes('não encontrado') || message.includes('rejeitado')) {
            return res.status(422).json({ error: message });
        }
        return res.status(500).json({ error: message });
    }
});
// POST /sync-ready — sincroniza todos os drafts com status 'ready' em lote
router.post('/sync-ready', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const readyDrafts = await db_1.db
            .selectFrom('discord_import_table_drafts')
            .select('id')
            .where('status', '=', 'ready')
            .execute();
        const results = { synced: 0, failed: 0, errors: [] };
        for (const draft of readyDrafts) {
            try {
                await (0, discord_1.syncDiscordDraftToTable)(draft.id);
                results.synced++;
            }
            catch (err) {
                results.failed++;
                results.errors.push(`${draft.id}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        return res.json({ data: results });
    }
    catch (error) {
        console.error('[POST /admin/discord-sync/sync-ready]', error);
        return res.status(500).json({ error: 'Erro ao sincronizar drafts em lote.' });
    }
});
exports.default = router;
