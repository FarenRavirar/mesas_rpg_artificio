"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const discord_1 = require("../discord");
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
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
        return res.status(422).json({ error: 'DISCORD_BOT_TOKEN não configurado.' });
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
            botToken,
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
