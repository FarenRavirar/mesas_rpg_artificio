"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const activityLogger_1 = require("../services/activityLogger");
const router = (0, express_1.Router)();
const VALID_STATUS = new Set([
    'new', 'triaged', 'in_progress', 'resolved', 'wont_fix', 'duplicate',
]);
const VALID_KIND = new Set(['bug', 'suggestion']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Resolve nomes de varios reporters em lote (evita N+1):
 * 1 query em profiles + 1 query em users (so para os sem display_name).
 */
async function resolveActorNames(userIds) {
    const names = new Map();
    const ids = Array.from(new Set(userIds.filter((id) => Boolean(id))));
    if (ids.length === 0)
        return names;
    try {
        const profiles = await db_1.db
            .selectFrom('profiles')
            .select(['user_id', 'display_name'])
            .where('user_id', 'in', ids)
            .execute();
        for (const p of profiles) {
            if (p.display_name && p.display_name.trim().length > 0) {
                names.set(p.user_id, p.display_name.trim());
            }
        }
        const remaining = ids.filter((id) => !names.has(id));
        if (remaining.length > 0) {
            const users = await db_1.db
                .selectFrom('users')
                .select(['id', 'username', 'email'])
                .where('id', 'in', remaining)
                .execute();
            for (const u of users) {
                if (u.username && u.username.trim().length > 0) {
                    names.set(u.id, u.username.trim());
                }
                else if (u.email) {
                    names.set(u.id, u.email.split('@')[0]);
                }
            }
        }
    }
    catch (error) {
        console.error('[devFeedbackAdmin][resolveActorNames]', error);
    }
    return names;
}
router.use(auth_1.authMiddleware, (0, auth_1.requireRole)('admin'));
// GET /api/v1/admin/dev-feedback?status=&kind= - lista para triagem
router.get('/dev-feedback', async (req, res) => {
    try {
        let query = db_1.db.selectFrom('dev_feedback').selectAll().orderBy('created_at', 'desc');
        const status = typeof req.query.status === 'string' ? req.query.status : '';
        if (VALID_STATUS.has(status)) {
            query = query.where('status', '=', status);
        }
        const kind = typeof req.query.kind === 'string' ? req.query.kind : '';
        if (VALID_KIND.has(kind)) {
            query = query.where('kind', '=', kind);
        }
        const rows = await query.execute();
        const names = await resolveActorNames(rows.map((row) => row.user_id).filter((id) => Boolean(id)));
        const data = rows.map((row) => ({
            ...row,
            reporter_name: row.user_id ? (names.get(row.user_id) ?? 'Anonimo') : 'Anonimo',
        }));
        return res.json({ data });
    }
    catch (error) {
        console.error('[GET /admin/dev-feedback]', error);
        return res.status(500).json({ error: 'Erro ao listar feedbacks.' });
    }
});
// PATCH /api/v1/admin/dev-feedback/:id - atualiza status e/ou notas
router.patch('/dev-feedback/:id', async (req, res) => {
    try {
        const adminId = req.user?.userId;
        if (!adminId) {
            return res.status(401).json({ error: 'Nao autenticado.' });
        }
        const { id } = req.params;
        // Garante UUID valido: coluna `id` e UUID; entrada malformada retorna 400 em vez de 500.
        if (!UUID_RE.test(id)) {
            return res.status(400).json({ error: 'ID invalido.' });
        }
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const update = {
            reviewed_by: adminId,
            reviewed_at: new Date(),
            updated_at: new Date(),
        };
        let nextStatus = null;
        if (typeof body.status === 'string') {
            if (!VALID_STATUS.has(body.status)) {
                return res.status(400).json({ error: 'Status invalido.' });
            }
            nextStatus = body.status;
            update.status = nextStatus;
        }
        if (typeof body.admin_notes === 'string') {
            const notes = body.admin_notes.trim();
            update.admin_notes = notes.length > 0 ? notes.slice(0, 4000) : null;
        }
        const updated = await db_1.db
            .updateTable('dev_feedback')
            .set(update)
            .where('id', '=', id)
            .returning(['id', 'kind', 'title', 'status', 'admin_notes', 'updated_at'])
            .executeTakeFirst();
        if (!updated) {
            return res.status(404).json({ error: 'Feedback nao encontrado.' });
        }
        void (0, activityLogger_1.logActivity)({
            actorId: adminId,
            actorRole: 'admin',
            action: 'dev_feedback.updated',
            entityType: 'dev_feedback',
            entityId: updated.id,
            entityLabel: updated.title,
            summary: `Feedback "${updated.title}" atualizado${nextStatus ? ` para ${nextStatus}` : ''}.`,
            metadata: { status: updated.status },
        });
        return res.json({ data: updated });
    }
    catch (error) {
        console.error('[PATCH /admin/dev-feedback/:id]', error);
        return res.status(500).json({ error: 'Erro ao atualizar feedback.' });
    }
});
exports.default = router;
