"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const buildTree = (nodes) => {
    const byId = new Map();
    const roots = [];
    for (const node of nodes) {
        byId.set(node.id, node);
    }
    for (const node of nodes) {
        if (node.parent_id && byId.has(node.parent_id)) {
            byId.get(node.parent_id)?.children.push(node);
            continue;
        }
        roots.push(node);
    }
    const sortNodes = (list) => {
        list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        for (const node of list) {
            sortNodes(node.children);
        }
    };
    sortNodes(roots);
    return roots;
};
const sanitizeStringArray = (value) => {
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
};
const sanitizeNumberArray = (value) => {
    if (!Array.isArray(value))
        return [];
    return value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);
};
const getOnboardingCompleted = (preferences) => {
    return Array.isArray(preferences?.systems) && preferences.systems.length > 0;
};
// GET /api/v1/me — Perfil + preferências do usuário logado (ou null se anônimo)
router.get('/', auth_1.optionalAuth, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.json({ data: null }); // Usuário anônimo
    }
    try {
        const user = await db_1.db
            .selectFrom('users')
            .select(['id', 'email', 'role', 'privacy_public', 'created_at'])
            .where('id', '=', userId)
            .executeTakeFirst();
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        const profile = await db_1.db
            .selectFrom('profiles')
            .select(['display_name', 'bio', 'languages', 'tags'])
            .where('user_id', '=', userId)
            .executeTakeFirst();
        const preferences = await db_1.db
            .selectFrom('user_preferences')
            .select(['systems', 'tags', 'languages', 'platforms', 'weekdays'])
            .where('user_id', '=', userId)
            .executeTakeFirst();
        const normalizedPreferences = {
            systems: preferences?.systems ?? [],
            tags: preferences?.tags ?? [],
            languages: preferences?.languages ?? [],
            platforms: preferences?.platforms ?? [],
            weekdays: preferences?.weekdays ?? [],
        };
        return res.json({
            data: {
                user,
                profile: profile ?? null,
                preferences: normalizedPreferences,
                onboarding_completed: getOnboardingCompleted(normalizedPreferences),
            },
        });
    }
    catch (error) {
        console.error('[GET /me]', error);
        return res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
    }
});
// GET /api/v1/me/options — Opções de taxonomia para onboarding
router.get('/options', auth_1.authMiddleware, async (_req, res) => {
    try {
        const [systems, aliases, tags, platforms] = await Promise.all([
            db_1.db
                .selectFrom('systems')
                .select(['id', 'name', 'slug', 'parent_id', 'node_type', 'depth', 'path_slug'])
                .orderBy('depth', 'asc')
                .orderBy('name', 'asc')
                .execute(),
            db_1.db
                .selectFrom('system_aliases')
                .select(['system_id', 'alias'])
                .execute(),
            db_1.db.selectFrom('tags').select(['id', 'name', 'slug']).orderBy('name', 'asc').execute(),
            db_1.db.selectFrom('platforms').select(['id', 'name', 'slug']).orderBy('name', 'asc').execute(),
        ]);
        const aliasesBySystem = new Map();
        for (const row of aliases) {
            const current = aliasesBySystem.get(row.system_id) ?? [];
            aliasesBySystem.set(row.system_id, [...current, row.alias]);
        }
        const parentIds = new Set();
        for (const system of systems) {
            if (system.parent_id)
                parentIds.add(system.parent_id);
        }
        const systemsFlat = systems.map((system) => ({
            ...system,
            aliases: aliasesBySystem.get(system.id) ?? [],
            has_children: parentIds.has(system.id),
            children: [],
        }));
        const systemsTree = buildTree(systemsFlat.map((node) => ({
            ...node,
            children: [],
        })));
        return res.json({
            data: {
                systems: systemsFlat.map(({ children, ...node }) => ({ ...node })),
                systems_tree: systemsTree,
                tags,
                platforms,
            },
        });
    }
    catch (error) {
        console.error('[GET /me/options]', error);
        return res.status(500).json({ error: 'Erro ao buscar opções de onboarding.' });
    }
});
// PUT /api/v1/me/preferences — Salva preferências e finaliza onboarding
router.put('/preferences', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }
    const { display_name, bio, systems, tags, platforms, languages, weekdays, } = req.body;
    if (!display_name || typeof display_name !== 'string' || display_name.trim().length < 2) {
        return res.status(400).json({ error: 'Nome de exibição inválido.' });
    }
    const safeSystemsInput = sanitizeStringArray(systems);
    if (safeSystemsInput.length === 0) {
        return res.status(400).json({ error: 'Selecione ao menos 1 sistema favorito.' });
    }
    const safeTags = sanitizeStringArray(tags);
    const safePlatforms = sanitizeStringArray(platforms);
    const safeLanguages = sanitizeStringArray(languages);
    const safeWeekdays = sanitizeNumberArray(weekdays);
    try {
        const validSystems = await db_1.db
            .selectFrom('systems')
            .select('id')
            .where('id', 'in', safeSystemsInput)
            .execute();
        const safeSystems = Array.from(new Set(validSystems.map((row) => row.id)));
        if (safeSystems.length === 0) {
            return res.status(400).json({ error: 'Nenhum sistema válido foi selecionado.' });
        }
        await db_1.db.transaction().execute(async (trx) => {
            const profileExists = await trx
                .selectFrom('profiles')
                .select('id')
                .where('user_id', '=', userId)
                .executeTakeFirst();
            if (profileExists) {
                await trx
                    .updateTable('profiles')
                    .set({
                    display_name: display_name.trim(),
                    bio: typeof bio === 'string' ? bio.trim() : null,
                    languages: safeLanguages,
                })
                    .where('user_id', '=', userId)
                    .execute();
            }
            else {
                await trx
                    .insertInto('profiles')
                    .values({
                    user_id: userId,
                    display_name: display_name.trim(),
                    bio: typeof bio === 'string' ? bio.trim() : null,
                    languages: safeLanguages,
                })
                    .execute();
            }
            await trx
                .insertInto('user_preferences')
                .values({
                user_id: userId,
                systems: safeSystems,
                tags: safeTags,
                languages: safeLanguages,
                platforms: safePlatforms,
                weekdays: safeWeekdays,
            })
                .onConflict((oc) => oc.column('user_id').doUpdateSet({
                systems: safeSystems,
                tags: safeTags,
                languages: safeLanguages,
                platforms: safePlatforms,
                weekdays: safeWeekdays,
            }))
                .execute();
        });
        return res.json({
            data: {
                onboarding_completed: true,
            },
        });
    }
    catch (error) {
        console.error('[PUT /me/preferences]', error);
        return res.status(500).json({ error: 'Erro ao salvar preferências.' });
    }
});
exports.default = router;
