"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kysely_1 = require("kysely"); // CORREÇÃO G03: Import sql para queries case-insensitive
const db_1 = require("../db");
const auth_1 = require("../middleware/auth"); // CORREÇÃO A02: Import middleware
const router = (0, express_1.Router)();
const slugify = (value) => (value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100));
const normalizeWebsiteUrl = (value) => {
    if (!value)
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    try {
        const url = new URL(trimmed);
        return url.toString();
    }
    catch {
        throw new Error('URL da plataforma inválida.');
    }
};
const normalizeLogoFilename = (value) => {
    if (value === undefined || value === null)
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    if (trimmed.length > 255) {
        throw new Error('Nome de arquivo de logo inválido (máximo 255 caracteres).');
    }
    return trimmed;
};
const isUniqueViolation = (error) => {
    if (!error || typeof error !== 'object' || !('code' in error)) {
        return false;
    }
    return error.code === '23505';
};
const getErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    return 'Erro interno';
};
/**
 * GET /api/v1/vtt-platforms
 * Lista todas as plataformas VTT ativas
 * Público - não requer autenticação
 */
router.get('/', async (req, res) => {
    try {
        const platforms = await db_1.db
            .selectFrom('vtt_platforms')
            .select([
            'id',
            'name',
            'slug',
            'logo_filename',
            'website_url',
            'sort_order',
        ])
            .where('is_active', '=', true)
            .orderBy('sort_order', 'asc')
            .orderBy('name', 'asc')
            .execute();
        return res.json({ data: platforms });
    }
    catch (error) {
        console.error('[GET /vtt-platforms] Erro ao buscar plataformas:', error);
        return res.status(500).json({ error: 'Erro ao buscar plataformas VTT.' });
    }
});
/**
 * POST /api/v1/vtt-platforms/suggest
 * Mestre sugere nova VTT personalizada
 * CORREÇÃO A02: Protegido com authMiddleware
 */
router.post('/suggest', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Autenticação necessária.' });
    }
    const { suggested_name, table_id } = req.body;
    if (!suggested_name || typeof suggested_name !== 'string' || suggested_name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome da plataforma é obrigatório.' });
    }
    if (suggested_name.trim().length > 100) {
        return res.status(400).json({ error: 'Nome da plataforma muito longo (máximo 100 caracteres).' });
    }
    try {
        // CORREÇÃO G03: Validar se VTT já existe no banco
        const existingVtt = await db_1.db
            .selectFrom('vtt_platforms')
            .select('name')
            .where((0, kysely_1.sql) `LOWER(name)`, '=', suggested_name.trim().toLowerCase())
            .executeTakeFirst();
        if (existingVtt) {
            return res.status(409).json({
                error: `A plataforma "${existingVtt.name}" já existe no sistema.`
            });
        }
        // CORREÇÃO G03: Validar se já existe sugestão pendente
        const existingSuggestion = await db_1.db
            .selectFrom('vtt_platform_suggestions')
            .select('suggested_name')
            .where((0, kysely_1.sql) `LOWER(suggested_name)`, '=', suggested_name.trim().toLowerCase())
            .where('status', '=', 'pending')
            .executeTakeFirst();
        if (existingSuggestion) {
            return res.status(409).json({
                error: `Já existe uma sugestão pendente para "${existingSuggestion.suggested_name}".`
            });
        }
        const suggestion = await db_1.db
            .insertInto('vtt_platform_suggestions')
            .values({
            suggested_name: suggested_name.trim(),
            suggested_by_user_id: userId,
            table_id: table_id || null,
            status: 'pending',
        })
            .returning(['id', 'suggested_name', 'created_at'])
            .executeTakeFirst();
        console.log(`[POST /vtt-platforms/suggest] Nova sugestão: "${suggested_name}" por user ${userId}`);
        return res.status(201).json({
            data: suggestion,
            message: 'Sugestão enviada com sucesso! Será analisada pela equipe.'
        });
    }
    catch (error) {
        console.error('[POST /vtt-platforms/suggest] Erro ao criar sugestão:', error);
        return res.status(500).json({ error: 'Erro ao enviar sugestão.' });
    }
});
/**
 * GET /api/v1/vtt-platforms/admin
 * Lista completa para administração
 */
router.get('/admin', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (_req, res) => {
    try {
        const platforms = await db_1.db
            .selectFrom('vtt_platforms')
            .select([
            'id',
            'name',
            'slug',
            'logo_filename',
            'website_url',
            'is_active',
            'sort_order',
            'created_at',
            'updated_at',
        ])
            .orderBy('sort_order', 'asc')
            .orderBy('name', 'asc')
            .execute();
        return res.json({ data: platforms });
    }
    catch (error) {
        console.error('[GET /vtt-platforms/admin] Erro ao buscar plataformas:', error);
        return res.status(500).json({ error: 'Erro ao buscar plataformas VTT.' });
    }
});
/**
 * POST /api/v1/vtt-platforms/admin
 * Cria plataforma VTT
 */
router.post('/admin', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const payload = req.body;
    const name = payload.name?.trim();
    if (!name || name.length < 2 || name.length > 100) {
        return res.status(400).json({ error: 'Nome da plataforma inválido (2-100 caracteres).' });
    }
    const slug = payload.slug?.trim() || slugify(name);
    if (!slug || slug.length < 2 || slug.length > 100) {
        return res.status(400).json({ error: 'Slug da plataforma inválido.' });
    }
    const sortOrder = Number.isInteger(payload.sort_order) ? Number(payload.sort_order) : 0;
    try {
        const websiteUrl = normalizeWebsiteUrl(payload.website_url);
        const logoFilename = normalizeLogoFilename(payload.logo_filename);
        const created = await db_1.db
            .insertInto('vtt_platforms')
            .values({
            name,
            slug,
            logo_filename: logoFilename,
            website_url: websiteUrl,
            sort_order: sortOrder,
            is_active: payload.is_active ?? true,
        })
            .returning([
            'id',
            'name',
            'slug',
            'logo_filename',
            'website_url',
            'is_active',
            'sort_order',
            'created_at',
            'updated_at',
        ])
            .executeTakeFirst();
        return res.status(201).json({ data: created });
    }
    catch (error) {
        console.error('[POST /vtt-platforms/admin] Erro ao criar plataforma:', error);
        const errorMessage = getErrorMessage(error);
        if (errorMessage === 'URL da plataforma inválida.' || errorMessage === 'Nome de arquivo de logo inválido (máximo 255 caracteres).') {
            return res.status(400).json({ error: errorMessage });
        }
        if (isUniqueViolation(error)) {
            return res.status(409).json({ error: 'Já existe plataforma com este nome ou slug.' });
        }
        return res.status(500).json({ error: 'Erro ao criar plataforma VTT.' });
    }
});
/**
 * PUT /api/v1/vtt-platforms/admin/:id
 * Atualiza plataforma VTT
 */
router.put('/admin/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const updateData = {};
    if (payload.name !== undefined) {
        const name = payload.name?.trim();
        if (!name || name.length < 2 || name.length > 100) {
            return res.status(400).json({ error: 'Nome da plataforma inválido (2-100 caracteres).' });
        }
        updateData.name = name;
    }
    if (payload.slug !== undefined) {
        const slug = payload.slug.trim();
        if (!slug || slug.length < 2 || slug.length > 100) {
            return res.status(400).json({ error: 'Slug da plataforma inválido.' });
        }
        updateData.slug = slug;
    }
    if (payload.logo_filename !== undefined) {
        try {
            updateData.logo_filename = normalizeLogoFilename(payload.logo_filename);
        }
        catch (error) {
            return res.status(400).json({ error: getErrorMessage(error) });
        }
    }
    if (payload.website_url !== undefined) {
        try {
            updateData.website_url = normalizeWebsiteUrl(payload.website_url);
        }
        catch (error) {
            return res.status(400).json({ error: getErrorMessage(error) });
        }
    }
    if (payload.sort_order !== undefined) {
        if (!Number.isInteger(payload.sort_order)) {
            return res.status(400).json({ error: 'sort_order deve ser inteiro.' });
        }
        updateData.sort_order = payload.sort_order;
    }
    if (payload.is_active !== undefined) {
        if (typeof payload.is_active !== 'boolean') {
            return res.status(400).json({ error: 'is_active deve ser boolean.' });
        }
        updateData.is_active = payload.is_active;
    }
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualização.' });
    }
    try {
        const updated = await db_1.db
            .updateTable('vtt_platforms')
            .set(updateData)
            .where('id', '=', id)
            .returning([
            'id',
            'name',
            'slug',
            'logo_filename',
            'website_url',
            'is_active',
            'sort_order',
            'created_at',
            'updated_at',
        ])
            .executeTakeFirst();
        if (!updated) {
            return res.status(404).json({ error: 'Plataforma VTT não encontrada.' });
        }
        return res.json({ data: updated });
    }
    catch (error) {
        console.error('[PUT /vtt-platforms/admin/:id] Erro ao atualizar plataforma:', error);
        if (isUniqueViolation(error)) {
            return res.status(409).json({ error: 'Já existe plataforma com este nome ou slug.' });
        }
        return res.status(500).json({ error: 'Erro ao atualizar plataforma VTT.' });
    }
});
/**
 * DELETE /api/v1/vtt-platforms/admin/:id
 * Remove plataforma não utilizada
 */
router.delete('/admin/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const inUse = await db_1.db
            .selectFrom('tables')
            .select('id')
            .where('vtt_platform_id', '=', id)
            .limit(1)
            .executeTakeFirst();
        if (inUse) {
            return res.status(409).json({
                error: 'Esta plataforma está vinculada a mesas. Desative-a em vez de remover.',
            });
        }
        const deleted = await db_1.db
            .deleteFrom('vtt_platforms')
            .where('id', '=', id)
            .returning(['id', 'name'])
            .executeTakeFirst();
        if (!deleted) {
            return res.status(404).json({ error: 'Plataforma VTT não encontrada.' });
        }
        return res.json({ data: deleted });
    }
    catch (error) {
        console.error('[DELETE /vtt-platforms/admin/:id] Erro ao remover plataforma:', error);
        return res.status(500).json({ error: 'Erro ao remover plataforma VTT.' });
    }
});
exports.default = router;
