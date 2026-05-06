"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const discord_1 = require("../discord");
const config_1 = require("../discord/config");
const settingsCrypto_1 = require("../discord/settingsCrypto");
const router = (0, express_1.Router)();
const DISCORD_API_BASE = 'https://discord.com/api/v10';
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
    channel_type: zod_1.z.enum(['text', 'announcement', 'forum']).optional(),
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
const updateMessageSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'parsed', 'needs_review', 'synced', 'ignored', 'error']),
});
const fetchSchema = zod_1.z.object({
    source_id: zod_1.z.string().uuid(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    before_message_id: zod_1.z.string().optional(),
    since: zod_1.z.coerce.date().optional(),
    until: zod_1.z.coerce.date().optional(),
}).refine((value) => !value.since || !value.until || value.since <= value.until, {
    message: 'Janela de tempo inválida.',
    path: ['until'],
});
const reingestForceSchema = zod_1.z.object({
    since: zod_1.z.coerce.date().optional(),
    until: zod_1.z.coerce.date().optional(),
}).refine((value) => !value.since || !value.until || value.since <= value.until, {
    message: 'Janela de tempo inválida.',
    path: ['until'],
});
const snowflakeParamSchema = zod_1.z.object({
    guildId: zod_1.z.string().regex(/^\d{5,30}$/, 'Servidor Discord inválido.'),
});
const botTokenSchema = zod_1.z.object({
    token: zod_1.z.string().trim().min(50, 'Token deve ter pelo menos 50 caracteres.').regex(/^\S+$/, 'Token não pode conter espaços.'),
});
const discordMessageDiagnosticSchema = zod_1.z.object({
    id: zod_1.z.string(),
    content: zod_1.z.string().optional().default(''),
    attachments: zod_1.z.array(zod_1.z.unknown()).optional().default([]),
    embeds: zod_1.z.array(zod_1.z.unknown()).optional().default([]),
    message_reference: zod_1.z.unknown().optional(),
    flags: zod_1.z.number().optional(),
});
/** Carrega todos os sistemas e seus aliases do banco para o parser. */
// Embeds/attachments podem vir como array (novo) ou JSON string (dados antigos)
function parseJsonField(value) {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === 'object') {
        const record = value;
        if (Array.isArray(record.items))
            return record.items;
        if (Array.isArray(record.data))
            return record.data;
        return Object.values(record);
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    return [];
}
async function fetchDiscordMessageDiagnostic(channelId, messageId) {
    const token = (await (0, config_1.requireDiscordBotToken)()).trim();
    const response = await fetch(`${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, { headers: { Authorization: `Bot ${token}` } });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'message' in payload
            ? String(payload.message)
            : 'Discord não respondeu como esperado.';
        throw new discord_1.DiscordIngestError(message, response.status === 403 ? 403 : 502);
    }
    const parsed = discordMessageDiagnosticSchema.safeParse(payload);
    if (!parsed.success) {
        throw new discord_1.DiscordIngestError('Discord retornou mensagem em formato inesperado.', 502);
    }
    return parsed.data;
}
async function loadSystemsForParser() {
    const systems = await db_1.db
        .selectFrom('systems')
        .select(['id', 'name', 'name_pt'])
        .execute();
    const aliases = await db_1.db
        .selectFrom('system_aliases')
        .select(['system_id', 'alias'])
        .execute();
    const aliasMap = new Map();
    for (const a of aliases) {
        const list = aliasMap.get(a.system_id) ?? [];
        list.push(a.alias);
        aliasMap.set(a.system_id, list);
    }
    return systems.map((s) => ({
        id: s.id,
        name: s.name,
        name_pt: s.name_pt,
        aliases: aliasMap.get(s.id) ?? [],
    }));
}
function getUnmatchedSystemHint(draft) {
    if (draft.table.system_id)
        return null;
    const hint = draft.table.raw_system_hint ?? draft.table.system_name;
    const normalized = typeof hint === 'string' ? hint.trim() : '';
    return normalized.length > 0 ? normalized : null;
}
async function ensureSystemSuggestionForDraft(draft, adminId, sourceLabel) {
    const rawHint = getUnmatchedSystemHint(draft);
    if (!rawHint || !adminId)
        return;
    const existing = await db_1.db
        .selectFrom('system_suggestions')
        .select('id')
        .where('name', '=', rawHint)
        .where('status', 'in', ['pending', 'approved'])
        .executeTakeFirst();
    if (existing)
        return;
    await db_1.db
        .insertInto('system_suggestions')
        .values({
        user_id: adminId,
        name: rawHint,
        name_pt: null,
        node_type: 'system',
        parent_id: null,
        description: `Sugestão automática gerada ao parsear mensagem Discord: "${sourceLabel ?? rawHint}"`,
        aliases: [rawHint],
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
    })
        .execute();
}
async function createOrUpdateDraftFromMessage(message, systems, adminId) {
    const parsed = (0, discord_1.parseDiscordAnnouncement)({
        source_kind: message.source_kind,
        discord_message_id: message.discord_message_id,
        discord_channel_id: message.discord_channel_id,
        discord_guild_id: message.discord_guild_id,
        discord_parent_channel_id: message.discord_parent_channel_id,
        discord_thread_id: message.discord_thread_id,
        discord_thread_name: message.discord_thread_name,
        discord_author_id: message.discord_author_id,
        discord_author_name: message.discord_author_name,
        discord_message_url: message.discord_message_url,
        content_raw: message.content_raw,
        attachments: parseJsonField(message.attachments),
        embeds: parseJsonField(message.embeds),
        message_created_at: message.message_created_at,
        message_edited_at: message.message_edited_at,
    }, systems);
    if (!parsed) {
        await db_1.db.updateTable('discord_import_messages')
            .set({ status: 'ignored', parse_error: null, updated_at: new Date() })
            .where('id', '=', message.id)
            .execute();
        return 'ignored';
    }
    const normalized = (0, discord_1.normalizeDiscordTableDraft)(parsed, systems);
    const existingDraft = await db_1.db
        .selectFrom('discord_import_table_drafts')
        .select(['id', 'status'])
        .where('discord_message_id', '=', message.id)
        .executeTakeFirst();
    if (existingDraft && existingDraft.status !== 'synced' && existingDraft.status !== 'rejected') {
        await db_1.db
            .updateTable('discord_import_table_drafts')
            .set({
            parsed_payload: parsed,
            normalized_payload: normalized.draft,
            confidence: normalized.draft.confidence,
            status: normalized.status,
            review_notes: null,
            updated_at: new Date(),
        })
            .where('id', '=', existingDraft.id)
            .execute();
    }
    else if (!existingDraft) {
        await db_1.db
            .insertInto('discord_import_table_drafts')
            .values({
            discord_message_id: message.id,
            table_id: null,
            parsed_payload: parsed,
            normalized_payload: normalized.draft,
            confidence: normalized.draft.confidence,
            status: normalized.status,
            review_notes: null,
        })
            .execute();
    }
    await db_1.db.updateTable('discord_import_messages')
        .set({ status: 'parsed', parse_error: null, updated_at: new Date() })
        .where('id', '=', message.id)
        .execute();
    await ensureSystemSuggestionForDraft(normalized.draft, adminId, message.discord_thread_name ?? message.discord_message_id);
    return 'draft';
}
async function parsePendingMessagesForSource(sourceId, since, until, adminId) {
    let query = db_1.db
        .selectFrom('discord_import_messages')
        .selectAll()
        .where('source_id', '=', sourceId)
        .where('status', 'in', ['pending', 'error'])
        .orderBy('message_created_at', 'desc')
        .limit(200);
    if (since)
        query = query.where('message_created_at', '>=', since);
    if (until)
        query = query.where('message_created_at', '<=', until);
    const messages = await query.execute();
    if (messages.length === 0)
        return { processed: 0, succeeded: 0, ignored: 0, failed: 0 };
    const systems = await loadSystemsForParser();
    let succeeded = 0;
    let ignored = 0;
    let failed = 0;
    for (const message of messages) {
        try {
            const result = await createOrUpdateDraftFromMessage(message, systems, adminId);
            if (result === 'draft')
                succeeded++;
            else
                ignored++;
        }
        catch (error) {
            await db_1.db.updateTable('discord_import_messages')
                .set({
                status: 'error',
                parse_error: error instanceof Error ? error.message : 'Erro no parse automatico',
                updated_at: new Date(),
            })
                .where('id', '=', message.id)
                .execute();
            failed++;
        }
    }
    return { processed: messages.length, succeeded, ignored, failed };
}
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
function normalizeSourceChannelType(value) {
    return value === 'announcement' || value === 'forum' ? value : 'text';
}
function sendDiscordFetchError(res, error) {
    if (error instanceof settingsCrypto_1.DiscordSettingsSecretUnavailableError) {
        return res.status(503).json({ error: error.message });
    }
    if (error instanceof discord_1.DiscordIngestError) {
        return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof Error && error.message.includes('DISCORD_BOT_TOKEN não configurado')) {
        return res.status(422).json({ error: error.message });
    }
    console.error('[POST /admin/discord-sync/fetch]', error);
    return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
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
            .values({
            ...parsed.data,
            channel_type: parsed.data.channel_type ?? 'text',
        })
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
    const { source_id, limit, before_message_id, since, until } = parsed.data;
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
        const sourceChannelType = normalizeSourceChannelType(source.channel_type);
        const result = sourceChannelType === 'forum'
            ? await (0, discord_1.ingestForumMessages)({
                sourceId: source_id,
                forumChannelId: source.channel_id,
                guildId: source.guild_id,
                limit,
                since,
                until,
            })
            : await (0, discord_1.ingestMessages)({
                sourceId: source_id,
                channelId: source.channel_id,
                guildId: source.guild_id,
                limit,
                beforeMessageId: before_message_id,
                since,
                until,
            });
        // Atualiza last_synced_at apenas se a chamada ao Discord foi concluida com sucesso
        if (result.inserted > 0 || result.updated > 0 || result.total === 0) {
            await db_1.db
                .updateTable('discord_import_sources')
                .set({ last_synced_at: new Date(), updated_at: new Date() })
                .where('id', '=', source_id)
                .execute();
        }
        const parse = await parsePendingMessagesForSource(source_id, since, until, req.user?.userId);
        return res.json({ data: { ...result, parse } });
    }
    catch (error) {
        return sendDiscordFetchError(res, error);
    }
});
// POST /sources/:sourceId/reingest-force — apaga mensagens pendentes e rebusca no Discord
router.post('/sources/:sourceId/reingest-force', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    const parsed = reingestForceSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    }
    try {
        const source = await db_1.db
            .selectFrom('discord_import_sources')
            .selectAll()
            .where('id', '=', req.params.sourceId)
            .executeTakeFirst();
        if (!source)
            return res.status(404).json({ error: 'Fonte não encontrada.' });
        const { since, until } = parsed.data;
        // Apaga mensagens não-sincronizadas para forçar reingestão
        let deleteQuery = db_1.db
            .deleteFrom('discord_import_messages')
            .where('source_id', '=', source.id)
            .where('status', 'not in', ['synced']);
        if (since)
            deleteQuery = deleteQuery.where('message_created_at', '>=', since);
        if (until)
            deleteQuery = deleteQuery.where('message_created_at', '<=', until);
        const deleted = await deleteQuery.executeTakeFirst();
        const sourceChannelType = normalizeSourceChannelType(source.channel_type);
        const result = sourceChannelType === 'forum'
            ? await (0, discord_1.ingestForumMessages)({ sourceId: source.id, forumChannelId: source.channel_id, guildId: source.guild_id, since, until })
            : await (0, discord_1.ingestMessages)({ sourceId: source.id, channelId: source.channel_id, guildId: source.guild_id, since, until });
        await db_1.db.updateTable('discord_import_sources')
            .set({ last_synced_at: new Date(), updated_at: new Date() })
            .where('id', '=', source.id)
            .execute();
        const parse = await parsePendingMessagesForSource(source.id, since, until, req.user?.userId);
        return res.json({ data: { deleted: Number(deleted.numDeletedRows ?? 0), ...result, parse } });
    }
    catch (error) {
        return sendDiscordFetchError(res, error);
    }
});
// POST /messages/parse-batch — parseia todas as mensagens pendentes em lote
router.post('/messages/parse-batch', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const messages = await db_1.db
            .selectFrom('discord_import_messages')
            .selectAll()
            .where('status', 'in', ['pending', 'error'])
            .limit(200)
            .execute();
        if (messages.length === 0)
            return res.json({ data: { processed: 0, succeeded: 0, failed: 0 } });
        const systems = await loadSystemsForParser();
        let succeeded = 0;
        let failed = 0;
        for (const message of messages) {
            try {
                const parsed = (0, discord_1.parseDiscordAnnouncement)({
                    source_kind: message.source_kind,
                    discord_message_id: message.discord_message_id,
                    discord_channel_id: message.discord_channel_id,
                    discord_guild_id: message.discord_guild_id,
                    discord_parent_channel_id: message.discord_parent_channel_id,
                    discord_thread_id: message.discord_thread_id,
                    discord_thread_name: message.discord_thread_name,
                    discord_author_id: message.discord_author_id,
                    discord_author_name: message.discord_author_name,
                    discord_message_url: message.discord_message_url,
                    content_raw: message.content_raw,
                    attachments: parseJsonField(message.attachments),
                    embeds: parseJsonField(message.embeds),
                    message_created_at: message.message_created_at,
                    message_edited_at: message.message_edited_at,
                }, systems);
                if (!parsed) {
                    await db_1.db.updateTable('discord_import_messages')
                        .set({ status: 'ignored', parse_error: null, updated_at: new Date() })
                        .where('id', '=', message.id)
                        .execute();
                    continue;
                }
                const normalized = (0, discord_1.normalizeDiscordTableDraft)(parsed, systems);
                const existing = await db_1.db.selectFrom('discord_import_table_drafts')
                    .select('id')
                    .where('discord_message_id', '=', message.id)
                    .executeTakeFirst();
                if (existing) {
                    await db_1.db.updateTable('discord_import_table_drafts')
                        .set({
                        parsed_payload: parsed,
                        normalized_payload: normalized.draft,
                        confidence: normalized.draft.confidence,
                        status: normalized.status,
                        updated_at: new Date(),
                    })
                        .where('id', '=', existing.id)
                        .execute();
                }
                else {
                    await db_1.db.insertInto('discord_import_table_drafts')
                        .values({
                        discord_message_id: message.id,
                        parsed_payload: parsed,
                        normalized_payload: normalized.draft,
                        confidence: normalized.draft.confidence,
                        status: normalized.status,
                    })
                        .execute();
                }
                await db_1.db.updateTable('discord_import_messages')
                    .set({ status: 'parsed', parse_error: null, updated_at: new Date() })
                    .where('id', '=', message.id)
                    .execute();
                await ensureSystemSuggestionForDraft(normalized.draft, req.user?.userId, message.discord_thread_name ?? message.discord_message_id);
                succeeded++;
            }
            catch {
                await db_1.db.updateTable('discord_import_messages')
                    .set({ status: 'error', parse_error: 'Erro no parse em lote', updated_at: new Date() })
                    .where('id', '=', message.id)
                    .execute();
                failed++;
            }
        }
        return res.json({ data: { processed: messages.length, succeeded, failed } });
    }
    catch (error) {
        console.error('[POST /messages/parse-batch]', error);
        return res.status(500).json({ error: 'Erro ao processar mensagens em lote.' });
    }
});
// ─── Mensagens ────────────────────────────────────────────────────────────────
// GET /messages
router.get('/messages', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const { source_id, status, limit = '50', offset = '0', since, until } = req.query;
        const sinceDate = since ? new Date(since) : null;
        const untilDate = until ? new Date(until) : null;
        if ((sinceDate && Number.isNaN(sinceDate.getTime())) || (untilDate && Number.isNaN(untilDate.getTime()))) {
            return res.status(400).json({ error: 'Janela de tempo inválida.' });
        }
        if (sinceDate && untilDate && sinceDate > untilDate) {
            return res.status(400).json({ error: 'Janela de tempo inválida.' });
        }
        let query = db_1.db
            .selectFrom('discord_import_messages')
            .selectAll()
            .orderBy('message_created_at', 'desc')
            .limit(Math.min(Number(limit) || 50, 100))
            .offset(Number(offset) || 0);
        if (source_id)
            query = query.where('source_id', '=', source_id);
        if (sinceDate)
            query = query.where('message_created_at', '>=', sinceDate);
        if (untilDate)
            query = query.where('message_created_at', '<=', untilDate);
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
// PATCH /messages/:id
router.patch('/messages/:id', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    const parsed = updateMessageSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    }
    try {
        const [message] = await db_1.db
            .updateTable('discord_import_messages')
            .set({ status: parsed.data.status, parse_error: null, updated_at: new Date() })
            .where('id', '=', req.params.id)
            .returningAll()
            .execute();
        if (!message)
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        return res.json({ data: message });
    }
    catch (error) {
        console.error('[PATCH /admin/discord-sync/messages/:id]', error);
        return res.status(500).json({ error: 'Erro ao atualizar mensagem.' });
    }
});
// POST /messages/:id/diagnose-content — compara DB vs API Discord sem expor token
router.post('/messages/:id/diagnose-content', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const message = await db_1.db
            .selectFrom('discord_import_messages')
            .selectAll()
            .where('id', '=', req.params.id)
            .executeTakeFirst();
        if (!message)
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        const apiMessage = await fetchDiscordMessageDiagnostic(message.discord_channel_id, message.discord_message_id);
        const apiContentLength = apiMessage.content.trim().length;
        const dbContentLength = message.content_raw.trim().length;
        const likelyMissingMessageContentIntent = apiContentLength === 0 &&
            dbContentLength === 0 &&
            Boolean(message.discord_thread_name) &&
            apiMessage.attachments.length === 0 &&
            apiMessage.embeds.length === 0;
        return res.json({
            data: {
                discord_message_id: message.discord_message_id,
                discord_channel_id: message.discord_channel_id,
                discord_thread_name: message.discord_thread_name,
                db_content_length: dbContentLength,
                api_content_length: apiContentLength,
                api_attachments_count: apiMessage.attachments.length,
                api_embeds_count: apiMessage.embeds.length,
                api_content_preview: apiMessage.content.trim().slice(0, 240),
                likely_missing_message_content_intent: likelyMissingMessageContentIntent,
                diagnosis: likelyMissingMessageContentIntent
                    ? 'A API do Discord entregou o starter do tópico sem corpo, anexos ou embeds. O post existe, mas o bot não recebeu o conteúdo pela API; verifique o Message Content Intent no Developer Portal e permissões do canal/tópico.'
                    : 'A API do Discord entregou algum conteúdo para esta mensagem.',
            },
        });
    }
    catch (error) {
        return sendDiscordFetchError(res, error);
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
// POST /messages/:id/parse — parseia mensagem e cria (ou atualiza) um draft
router.post('/messages/:id/parse', auth_1.authMiddleware, async (req, res) => {
    if (!isAdmin(req, res))
        return;
    try {
        const message = await db_1.db
            .selectFrom('discord_import_messages')
            .selectAll()
            .where('id', '=', req.params.id)
            .executeTakeFirst();
        if (!message)
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        if (message.status === 'synced') {
            return res.status(422).json({ error: 'Mensagem já sincronizada como mesa. Não pode ser reparseada.' });
        }
        const systems = await loadSystemsForParser();
        const parsed = (0, discord_1.parseDiscordAnnouncement)({
            source_kind: message.source_kind,
            discord_message_id: message.discord_message_id,
            discord_channel_id: message.discord_channel_id,
            discord_guild_id: message.discord_guild_id,
            discord_parent_channel_id: message.discord_parent_channel_id,
            discord_thread_id: message.discord_thread_id,
            discord_thread_name: message.discord_thread_name,
            discord_author_id: message.discord_author_id,
            discord_author_name: message.discord_author_name,
            discord_message_url: message.discord_message_url,
            content_raw: message.content_raw,
            attachments: parseJsonField(message.attachments),
            embeds: parseJsonField(message.embeds),
            message_created_at: message.message_created_at,
            message_edited_at: message.message_edited_at,
        }, systems);
        if (!parsed)
            return res.status(422).json({ error: 'Mensagem sem conteudo elegivel para virar draft.' });
        const normalized = (0, discord_1.normalizeDiscordTableDraft)(parsed, systems);
        // Verifica se já existe draft para esta mensagem
        const existingDraft = await db_1.db
            .selectFrom('discord_import_table_drafts')
            .select(['id', 'status'])
            .where('discord_message_id', '=', message.id)
            .executeTakeFirst();
        let draft;
        if (existingDraft && existingDraft.status !== 'synced' && existingDraft.status !== 'rejected') {
            // Atualiza draft existente
            [draft] = await db_1.db
                .updateTable('discord_import_table_drafts')
                .set({
                parsed_payload: parsed,
                normalized_payload: normalized.draft,
                confidence: normalized.draft.confidence,
                status: normalized.status,
                review_notes: null,
                updated_at: new Date(),
            })
                .where('id', '=', existingDraft.id)
                .returningAll()
                .execute();
        }
        else {
            // Cria novo draft
            [draft] = await db_1.db
                .insertInto('discord_import_table_drafts')
                .values({
                discord_message_id: message.id,
                table_id: null,
                parsed_payload: parsed,
                normalized_payload: normalized.draft,
                confidence: normalized.draft.confidence,
                status: normalized.status,
                review_notes: null,
            })
                .returningAll()
                .execute();
        }
        // Atualiza status da mensagem para 'parsed'
        await db_1.db
            .updateTable('discord_import_messages')
            .set({ status: 'parsed', parse_error: null, updated_at: new Date() })
            .where('id', '=', message.id)
            .execute();
        await ensureSystemSuggestionForDraft(normalized.draft, req.user?.userId, message.discord_thread_name ?? message.discord_message_id);
        return res.json({ data: draft });
    }
    catch (error) {
        console.error('[POST /admin/discord-sync/messages/:id/parse]', error);
        const msg = error instanceof Error ? error.message : 'Erro ao parsear mensagem.';
        await db_1.db
            .updateTable('discord_import_messages')
            .set({ parse_error: msg, updated_at: new Date() })
            .where('id', '=', req.params.id)
            .execute();
        return res.status(500).json({ error: msg });
    }
});
// POST /drafts/:id/reparse — re-parseia a mensagem de origem e atualiza o draft
router.post('/drafts/:id/reparse', auth_1.authMiddleware, async (req, res) => {
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
        if (draft.status === 'synced') {
            return res.status(422).json({ error: 'Draft já sincronizado. Não pode ser reparseado.' });
        }
        const message = await db_1.db
            .selectFrom('discord_import_messages')
            .selectAll()
            .where('id', '=', draft.discord_message_id)
            .executeTakeFirst();
        if (!message)
            return res.status(404).json({ error: 'Mensagem de origem não encontrada.' });
        const systems = await loadSystemsForParser();
        const parsed = (0, discord_1.parseDiscordAnnouncement)({
            source_kind: message.source_kind,
            discord_message_id: message.discord_message_id,
            discord_channel_id: message.discord_channel_id,
            discord_guild_id: message.discord_guild_id,
            discord_parent_channel_id: message.discord_parent_channel_id,
            discord_thread_id: message.discord_thread_id,
            discord_thread_name: message.discord_thread_name,
            discord_author_id: message.discord_author_id,
            discord_author_name: message.discord_author_name,
            discord_message_url: message.discord_message_url,
            content_raw: message.content_raw,
            attachments: parseJsonField(message.attachments),
            embeds: parseJsonField(message.embeds),
            message_created_at: message.message_created_at,
            message_edited_at: message.message_edited_at,
        }, systems);
        if (!parsed)
            return res.status(422).json({ error: 'Mensagem sem conteudo elegivel para virar draft.' });
        const normalized = (0, discord_1.normalizeDiscordTableDraft)(parsed, systems);
        const [updated] = await db_1.db
            .updateTable('discord_import_table_drafts')
            .set({
            parsed_payload: parsed,
            normalized_payload: normalized.draft,
            confidence: normalized.draft.confidence,
            status: normalized.status,
            updated_at: new Date(),
        })
            .where('id', '=', req.params.id)
            .returningAll()
            .execute();
        await ensureSystemSuggestionForDraft(normalized.draft, req.user?.userId, message.discord_thread_name ?? message.discord_message_id);
        return res.json({ data: updated });
    }
    catch (error) {
        console.error('[POST /admin/discord-sync/drafts/:id/reparse]', error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao reparsar draft.' });
    }
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
        if (error instanceof discord_1.DiscordDraftSyncValidationError) {
            return res.status(422).json({ error: message, details: { missingFields: error.missingFields } });
        }
        if (message.includes('não encontrado') || message.includes('rejeitado') || message.includes('status ready')) {
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
