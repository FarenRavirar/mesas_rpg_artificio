"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, auth_1.requireRole)('admin'));
// GET /api/v1/admin/system-suggestions - Listar todas as sugestões
router.get('/system-suggestions', async (req, res) => {
    try {
        const { status } = req.query;
        let query = db_1.db.selectFrom('system_suggestions').selectAll().orderBy('created_at', 'desc');
        if (status && typeof status === 'string') {
            query = query.where('status', '=', status);
        }
        const suggestions = await query.execute();
        return res.json({ data: suggestions });
    }
    catch (error) {
        console.error('[GET /admin/system-suggestions]', error);
        return res.status(500).json({ error: 'Erro ao listar sugestões.' });
    }
});
// PATCH /api/v1/admin/system-suggestions/:id/approve - Aprovar sugestão
router.patch('/system-suggestions/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user?.userId;
        if (!adminId) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        const updated = await db_1.db
            .updateTable('system_suggestions')
            .set({
            status: 'approved',
            reviewed_at: new Date(),
            reviewed_by: adminId,
        })
            .where('id', '=', id)
            .executeTakeFirst();
        if (updated.numUpdatedRows === 0n) {
            return res.status(404).json({ error: 'Sugestão não encontrada.' });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('[PATCH /admin/system-suggestions/:id/approve]', error);
        return res.status(500).json({ error: 'Erro ao aprovar sugestão.' });
    }
});
// PATCH /api/v1/admin/system-suggestions/:id/reject - Rejeitar sugestão
router.patch('/system-suggestions/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user?.userId;
        if (!adminId) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return res.status(400).json({ error: 'Motivo da rejeição é obrigatório.' });
        }
        const updated = await db_1.db
            .updateTable('system_suggestions')
            .set({
            status: 'rejected',
            rejection_reason: reason.trim(),
            reviewed_at: new Date(),
            reviewed_by: adminId,
        })
            .where('id', '=', id)
            .executeTakeFirst();
        if (updated.numUpdatedRows === 0n) {
            return res.status(404).json({ error: 'Sugestão não encontrada.' });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('[PATCH /admin/system-suggestions/:id/reject]', error);
        return res.status(500).json({ error: 'Erro ao rejeitar sugestão.' });
    }
});
exports.default = router;
