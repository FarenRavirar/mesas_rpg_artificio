"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const activityLogger_1 = require("../services/activityLogger");
const adminNotifications_1 = require("../services/adminNotifications");
const router = (0, express_1.Router)();
async function resolveActorName(userId) {
    try {
        const profile = await db_1.db
            .selectFrom('profiles')
            .select('display_name')
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (profile?.display_name && profile.display_name.trim().length > 0) {
            return profile.display_name.trim();
        }
        const user = await db_1.db
            .selectFrom('users')
            .select(['username', 'email'])
            .where('id', '=', userId)
            .executeTakeFirst();
        if (user?.username && user.username.trim().length > 0) {
            return user.username.trim();
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
    }
    catch (error) {
        console.error('[scenarioSuggestions][resolveActorName]', error);
    }
    return 'Usuário';
}
router.use(auth_1.authMiddleware);
// POST /api/v1/scenario-suggestions - Criar sugestão
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        const { name, name_pt, description } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        }
        // Limite de 5 sugestões pendentes por usuário
        const pendingCount = await db_1.db
            .selectFrom('scenario_suggestions')
            .select(db_1.db.fn.count('id').as('count'))
            .where('user_id', '=', userId)
            .where('status', '=', 'pending')
            .executeTakeFirst();
        if (pendingCount && Number(pendingCount.count) >= 5) {
            return res.status(400).json({ error: 'Você já possui 5 sugestões pendentes. Aguarde a revisão.' });
        }
        const userName = await resolveActorName(userId);
        const newSuggestion = await db_1.db.transaction().execute(async (trx) => {
            const created = await trx
                .insertInto('scenario_suggestions')
                .values({
                user_id: userId,
                name: name.trim(),
                name_pt: typeof name_pt === 'string' && name_pt.trim().length > 0 ? name_pt.trim() : null,
                description: typeof description === 'string' && description.trim().length > 0 ? description.trim() : null,
                status: 'pending',
            })
                .returningAll()
                .executeTakeFirstOrThrow();
            await (0, adminNotifications_1.notifyAdmins)({
                type: 'scenario_suggestion',
                title: 'Nova sugestão de cenário',
                message: `${userName} sugeriu "${created.name}" para o catálogo.`,
                action_url: '/gestao',
                metadata: {
                    suggestion_id: created.id,
                    suggestion_kind: 'scenario',
                },
                excludeUserId: userId,
            }, trx);
            return created;
        });
        if (newSuggestion) {
            void (0, activityLogger_1.logActivity)({
                actorId: userId,
                actorRole: req.user?.role,
                action: 'scenario_suggestion.created',
                entityType: 'scenario_suggestion',
                entityId: newSuggestion.id,
                entityLabel: newSuggestion.name,
                targetUserId: userId,
                summary: `${userName} sugeriu o cenário "${newSuggestion.name}".`,
                metadata: {
                    suggestion_id: newSuggestion.id,
                    name_pt: newSuggestion.name_pt,
                },
            });
        }
        return res.status(201).json({ data: newSuggestion });
    }
    catch (error) {
        console.error('[POST /scenario-suggestions]', error);
        return res.status(500).json({ error: 'Erro ao criar sugestão.' });
    }
});
// GET /api/v1/scenario-suggestions/mine - Listar minhas sugestões
router.get('/mine', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        const suggestions = await db_1.db
            .selectFrom('scenario_suggestions')
            .selectAll()
            .where('user_id', '=', userId)
            .orderBy('created_at', 'desc')
            .execute();
        return res.json({ data: suggestions });
    }
    catch (error) {
        console.error('[GET /scenario-suggestions/mine]', error);
        return res.status(500).json({ error: 'Erro ao listar sugestões.' });
    }
});
exports.default = router;
