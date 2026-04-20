"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const normalizeText = (value) => value.trim().toLowerCase();
// Função auxiliar para gerar slug
const slugify = (value) => {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};
// GET /api/v1/scenarios — Listar todos os cenários
// Suporta paginação cursor-based: ?limit=50&cursor=abc123
router.get('/', async (req, res) => {
    const search = typeof req.query.search === 'string'
        ? req.query.search
        : typeof req.query.q === 'string'
            ? req.query.q
            : '';
    // Paginação cursor-based
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    try {
        const shouldPaginate = limit !== undefined && limit > 0;
        let query = db_1.db
            .selectFrom('scenarios')
            .select(['id', 'name', 'name_pt', 'slug', 'subgenres'])
            .orderBy('name', 'asc');
        // Aplicar cursor (continuar de onde parou)
        if (shouldPaginate && cursor) {
            query = query.where('id', '>', cursor);
        }
        // Aplicar limit (+1 para detectar has_more)
        if (shouldPaginate) {
            query = query.limit(limit + 1);
        }
        const scenarios = await query.execute();
        // Detectar se há mais páginas
        let hasMore = false;
        let nextCursor = null;
        if (shouldPaginate && scenarios.length > limit) {
            hasMore = true;
            scenarios.pop(); // Remove o item extra
            nextCursor = scenarios[scenarios.length - 1]?.id || null;
        }
        // Busca full-text se houver query
        if (search.trim().length > 0) {
            const normalizedSearch = normalizeText(search);
            // Filtrar no backend (busca em name, slug e subgenres)
            const filtered = scenarios.filter((scenario) => {
                return normalizeText(scenario.name).includes(normalizedSearch)
                    || normalizeText(scenario.slug).includes(normalizedSearch)
                    || scenario.subgenres.some((subgenre) => normalizeText(subgenre).includes(normalizedSearch));
            });
            return res.json({
                data: filtered,
                pagination: {
                    next_cursor: shouldPaginate ? nextCursor : null,
                    has_more: shouldPaginate ? hasMore : false,
                },
            });
        }
        return res.json({
            data: scenarios,
            pagination: {
                next_cursor: shouldPaginate ? nextCursor : null,
                has_more: shouldPaginate ? hasMore : false,
            },
        });
    }
    catch (error) {
        console.error('[GET /scenarios]', error);
        return res.status(500).json({ error: 'Erro ao buscar cenários.' });
    }
});
// GET /api/v1/scenarios/:id — Buscar cenário por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const scenario = await db_1.db
            .selectFrom('scenarios')
            .select(['id', 'name', 'name_pt', 'slug', 'subgenres'])
            .where('id', '=', id)
            .executeTakeFirst();
        if (!scenario) {
            return res.status(404).json({ error: 'Cenário não encontrado.' });
        }
        return res.json({ data: scenario });
    }
    catch (error) {
        console.error('[GET /scenarios/:id]', error);
        return res.status(500).json({ error: 'Erro ao buscar cenário.' });
    }
});
// =============================================================================
// ROTAS ADMINISTRATIVAS (CRUD)
// =============================================================================
// POST /api/v1/admin/scenarios — Criar novo cenário
router.post('/admin', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { name, name_pt, subgenres } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
    }
    try {
        const slug = slugify(name);
        // Verificar se slug já existe
        const existing = await db_1.db
            .selectFrom('scenarios')
            .select('id')
            .where('slug', '=', slug)
            .executeTakeFirst();
        if (existing) {
            return res.status(409).json({ error: 'Já existe um cenário com este slug.' });
        }
        // Validar subgenres como array
        const subgenresArray = Array.isArray(subgenres) ? subgenres : [];
        // Inserir cenário
        const newScenario = await db_1.db
            .insertInto('scenarios')
            .values({
            name,
            name_pt: name_pt || null,
            slug,
            subgenres: subgenresArray,
        })
            .returning(['id', 'name', 'name_pt', 'slug', 'subgenres'])
            .executeTakeFirst();
        return res.status(201).json({ data: newScenario });
    }
    catch (error) {
        console.error('[POST /admin/scenarios]', error);
        return res.status(500).json({ error: 'Erro ao criar cenário.' });
    }
});
// PUT /api/v1/admin/scenarios/:id — Editar cenário
router.put('/admin/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { id } = req.params;
    const { name, name_pt, subgenres } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
    }
    try {
        // Verificar se cenário existe
        const existing = await db_1.db
            .selectFrom('scenarios')
            .select('id')
            .where('id', '=', id)
            .executeTakeFirst();
        if (!existing) {
            return res.status(404).json({ error: 'Cenário não encontrado.' });
        }
        const slug = slugify(name);
        // Verificar se slug já existe em outro cenário
        const duplicateSlug = await db_1.db
            .selectFrom('scenarios')
            .select('id')
            .where('slug', '=', slug)
            .where('id', '!=', id)
            .executeTakeFirst();
        if (duplicateSlug) {
            return res.status(409).json({ error: 'Já existe outro cenário com este slug.' });
        }
        // Validar subgenres como array
        const subgenresArray = Array.isArray(subgenres) ? subgenres : [];
        // Atualizar cenário
        const updated = await db_1.db
            .updateTable('scenarios')
            .set({
            name,
            name_pt: name_pt || null,
            slug,
            subgenres: subgenresArray,
        })
            .where('id', '=', id)
            .returning(['id', 'name', 'name_pt', 'slug', 'subgenres'])
            .executeTakeFirst();
        return res.json({ data: updated });
    }
    catch (error) {
        console.error('[PUT /admin/scenarios/:id]', error);
        return res.status(500).json({ error: 'Erro ao atualizar cenário.' });
    }
});
// DELETE /api/v1/admin/scenarios/:id — Deletar cenário
router.delete('/admin/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar se cenário existe
        const existing = await db_1.db
            .selectFrom('scenarios')
            .select('name')
            .where('id', '=', id)
            .executeTakeFirst();
        if (!existing) {
            return res.status(404).json({ error: 'Cenário não encontrado.' });
        }
        // Verificar se há mesas vinculadas
        const tablesCount = await db_1.db
            .selectFrom('tables')
            .select(db_1.db.fn.count('id').as('count'))
            .where('scenario_id', '=', id)
            .executeTakeFirst();
        if (tablesCount && Number(tablesCount.count) > 0) {
            return res.status(409).json({
                error: `Não é possível deletar este cenário. Existem ${tablesCount.count} mesa(s) vinculada(s).`,
            });
        }
        // Deletar cenário
        await db_1.db
            .deleteFrom('scenarios')
            .where('id', '=', id)
            .execute();
        return res.json({ data: { message: 'Cenário deletado com sucesso.' } });
    }
    catch (error) {
        console.error('[DELETE /admin/scenarios/:id]', error);
        return res.status(500).json({ error: 'Erro ao deletar cenário.' });
    }
});
exports.default = router;
