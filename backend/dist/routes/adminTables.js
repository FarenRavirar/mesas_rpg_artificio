"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const tableRepository_1 = require("../repositories/tableRepository");
const router = (0, express_1.Router)();
// PUT /api/v1/admin/tables/:id — Ações administrativas (status, covil, etc.)
router.put('/tables/:id', auth_1.authMiddleware, async (req, res) => {
    const userRole = req.user.role;
    const { id } = req.params;
    const { status, is_covil } = req.body;
    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    try {
        const updateData = {};
        if (status !== undefined) {
            const validStatuses = ['active', 'full', 'cancelled', 'ended'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: `Status inválido. Valores: ${validStatuses.join(', ')}` });
            }
            updateData.status = status;
        }
        if (is_covil !== undefined) {
            updateData.is_covil = is_covil;
        }
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
        }
        const [result] = await db_1.db
            .updateTable('tables')
            .set(updateData)
            .where('id', '=', id)
            .returning(['id', 'slug', 'title', 'status', 'is_covil'])
            .execute();
        return res.json({ data: result });
    }
    catch (error) {
        console.error('[PUT /admin/tables/:id]', error);
        return res.status(500).json({ error: 'Erro ao atualizar mesa.' });
    }
});
// DELETE /api/v1/admin/tables/:id — Exclusão administrativa de mesa
router.delete('/tables/:id', auth_1.authMiddleware, async (req, res) => {
    const userRole = req.user.role;
    const { id } = req.params;
    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    try {
        const existingTable = await db_1.db
            .selectFrom('tables')
            .select(['id', 'title'])
            .where('id', '=', id)
            .executeTakeFirst();
        if (!existingTable) {
            return res.status(404).json({ error: 'Mesa não encontrada.' });
        }
        await tableRepository_1.TableRepository.deleteTableWithRelations(id);
        return res.json({ data: { message: `Mesa administrativa "${existingTable.title}" excluída.` } });
    }
    catch (error) {
        console.error('[DELETE /admin/tables/:id]', error);
        return res.status(500).json({ error: 'Erro ao excluir mesa.' });
    }
});
exports.default = router;
