"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// POST /api/v1/system-suggestions - Criar sugestão
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        const { name, name_pt, description, parent_id, suggestion_type } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        }
        if (!suggestion_type || !['system', 'edition', 'variant', 'subsystem'].includes(suggestion_type)) {
            return res.status(400).json({ error: 'Tipo de sugestão inválido.' });
        }
        // Verificar limite de 5 sugestões pendentes
        const pendingCount = await db_1.db
            .selectFrom('system_suggestions')
            .select(db_1.db.fn.count('id').as('count'))
            .where('user_id', '=', userId)
            .where('status', '=', 'pending')
            .executeTakeFirst();
        if (pendingCount && Number(pendingCount.count) >= 5) {
            return res.status(400).json({ error: 'Você já possui 5 sugestões pendentes. Aguarde a revisão.' });
        }
        const newSuggestion = await db_1.db
            .insertInto('system_suggestions')
            .values({
            user_id: userId,
            name: name.trim(),
            name_pt: typeof name_pt === 'string' && name_pt.trim().length > 0 ? name_pt.trim() : null,
            description: description?.trim() || null,
            parent_id: parent_id?.trim() || null,
            node_type: suggestion_type,
            status: 'pending',
        })
            .returningAll()
            .executeTakeFirst();
        return res.status(201).json({ data: newSuggestion });
    }
    catch (error) {
        console.error('[POST /system-suggestions]', error);
        return res.status(500).json({ error: 'Erro ao criar sugestão.' });
    }
});
// GET /api/v1/system-suggestions/mine - Listar minhas sugestões
router.get('/mine', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        const suggestions = await db_1.db
            .selectFrom('system_suggestions')
            .selectAll()
            .where('user_id', '=', userId)
            .orderBy('created_at', 'desc')
            .execute();
        return res.json({ data: suggestions });
    }
    catch (error) {
        console.error('[GET /system-suggestions/mine]', error);
        return res.status(500).json({ error: 'Erro ao listar sugestões.' });
    }
});
exports.default = router;
