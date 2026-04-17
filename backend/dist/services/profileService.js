"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFullProfile = getFullProfile;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.checkUsernameExists = checkUsernameExists;
exports.updateProfile = updateProfile;
exports.updatePlayerProfile = updatePlayerProfile;
exports.updateGmProfile = updateGmProfile;
exports.addUserSystem = addUserSystem;
exports.removeUserSystem = removeUserSystem;
exports.removeUserSystemByParams = removeUserSystemByParams;
exports.getDiscordStatus = getDiscordStatus;
exports.connectDiscord = connectDiscord;
exports.disconnectDiscord = disconnectDiscord;
exports.toggleCovilVerified = toggleCovilVerified;
const db_1 = require("../db");
async function getFullProfile(userId) {
    const user = await db_1.db
        .selectFrom('users')
        .select(['id', 'email', 'username', 'location', 'role', 'created_at'])
        .where('id', '=', userId)
        .executeTakeFirst();
    if (!user) {
        throw new Error('Usuário não encontrado');
    }
    const profile = await db_1.db
        .selectFrom('profiles')
        .select(['display_name', 'bio', 'avatar_url', 'languages'])
        .where('user_id', '=', userId)
        .executeTakeFirst();
    const player = await db_1.db
        .selectFrom('player_profiles')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst();
    const gm = await db_1.db
        .selectFrom('gm_profiles')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst();
    const allSystems = await db_1.db
        .selectFrom('user_systems')
        .selectAll()
        .where('user_id', '=', userId)
        .execute();
    const systems = {
        favorite: allSystems.filter((s) => s.type === 'favorite'),
        gm: allSystems.filter((s) => s.type === 'gm'),
    };
    return {
        user,
        profile: profile || null,
        player: player || null,
        gm: gm || null,
        systems,
    };
}
// =============================================================================
// GET USER BY ID (com refresh_token)
// =============================================================================
async function getUserById(userId) {
    return db_1.db
        .selectFrom('users')
        .select(['id', 'email', 'username', 'role', 'refresh_token'])
        .where('id', '=', userId)
        .executeTakeFirst();
}
// =============================================================================
// UPDATE USER (dados gerais)
// =============================================================================
async function updateUser(userId, data) {
    await db_1.db
        .updateTable('users')
        .set({
        ...data,
        updated_at: new Date(),
    })
        .where('id', '=', userId)
        .execute();
    return db_1.db
        .selectFrom('users')
        .select(['id', 'email', 'username', 'location', 'role', 'created_at'])
        .where('id', '=', userId)
        .executeTakeFirst();
}
// =============================================================================
// CHECK USERNAME EXISTS
// =============================================================================
async function checkUsernameExists(username, excludeUserId) {
    let query = db_1.db.selectFrom('users').select('id').where('username', '=', username);
    if (excludeUserId) {
        query = query.where('id', '!=', excludeUserId);
    }
    const result = await query.executeTakeFirst();
    return !!result;
}
// =============================================================================
// UPDATE PROFILE (display_name, bio, avatar)
// =============================================================================
async function updateProfile(userId, data) {
    const exists = await db_1.db
        .selectFrom('profiles')
        .select('id')
        .where('user_id', '=', userId)
        .executeTakeFirst();
    if (exists) {
        await db_1.db
            .updateTable('profiles')
            .set({
            ...data,
            updated_at: new Date(),
        })
            .where('user_id', '=', userId)
            .execute();
    }
    else {
        await db_1.db
            .insertInto('profiles')
            .values({
            user_id: userId,
            display_name: data.display_name || 'Usuário',
            bio: data.bio || null,
            avatar_url: data.avatar_url || null,
            languages: data.languages || [],
        })
            .execute();
    }
    return db_1.db
        .selectFrom('profiles')
        .select(['display_name', 'bio', 'avatar_url', 'languages'])
        .where('user_id', '=', userId)
        .executeTakeFirst();
}
// =============================================================================
// UPDATE PLAYER PROFILE
// =============================================================================
async function updatePlayerProfile(userId, data) {
    await db_1.db
        .insertInto('player_profiles')
        .values({
        user_id: userId,
        ...data,
        updated_at: new Date(),
    })
        .onConflict((oc) => oc.column('user_id').doUpdateSet({
        ...data,
        updated_at: new Date(),
    }))
        .execute();
    const result = await db_1.db
        .selectFrom('player_profiles')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst();
    if (!result) {
        throw new Error('Erro ao atualizar perfil de jogador');
    }
    return result;
}
// =============================================================================
// UPDATE GM PROFILE
// =============================================================================
async function updateGmProfile(userId, data) {
    // Verificar se já existe
    const exists = await db_1.db
        .selectFrom('gm_profiles')
        .select('id')
        .where('user_id', '=', userId)
        .executeTakeFirst();
    if (exists) {
        // Update
        await db_1.db
            .updateTable('gm_profiles')
            .set({
            ...data,
            updated_at: new Date(),
        })
            .where('user_id', '=', userId)
            .execute();
    }
    else {
        // Insert (precisa de slug)
        const user = await db_1.db
            .selectFrom('users')
            .select(['username', 'email'])
            .where('id', '=', userId)
            .executeTakeFirst();
        const slug = user?.username || user?.email.split('@')[0] || `user-${userId.slice(0, 8)}`;
        await db_1.db
            .insertInto('gm_profiles')
            .values({
            user_id: userId,
            slug,
            ...data,
        })
            .execute();
        // Elevar role para 'gm'
        await db_1.db.updateTable('users').set({ role: 'gm' }).where('id', '=', userId).execute();
    }
    const result = await db_1.db
        .selectFrom('gm_profiles')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst();
    if (!result) {
        throw new Error('Erro ao atualizar perfil de mestre');
    }
    return result;
}
// =============================================================================
// USER SYSTEMS (adicionar/remover)
// =============================================================================
async function addUserSystem(userId, systemId, type) {
    // Verificar se sistema existe
    const systemExists = await db_1.db
        .selectFrom('systems')
        .select('id')
        .where('id', '=', systemId)
        .executeTakeFirst();
    if (!systemExists) {
        throw new Error('Sistema não encontrado');
    }
    await db_1.db
        .insertInto('user_systems')
        .values({
        user_id: userId,
        system_id: systemId,
        type,
    })
        .onConflict((oc) => oc.columns(['user_id', 'system_id', 'type']).doNothing())
        .execute();
    const result = await db_1.db
        .selectFrom('user_systems')
        .selectAll()
        .where('user_id', '=', userId)
        .where('system_id', '=', systemId)
        .where('type', '=', type)
        .executeTakeFirst();
    if (!result) {
        throw new Error('Erro ao adicionar sistema');
    }
    return result;
}
async function removeUserSystem(id, userId) {
    await db_1.db
        .deleteFrom('user_systems')
        .where('id', '=', id)
        .where('user_id', '=', userId)
        .execute();
}
async function removeUserSystemByParams(userId, systemId, type) {
    await db_1.db
        .deleteFrom('user_systems')
        .where('user_id', '=', userId)
        .where('system_id', '=', systemId)
        .where('type', '=', type)
        .execute();
}
async function getDiscordStatus(userId) {
    const gm = await db_1.db
        .selectFrom('gm_profiles')
        .select(['discord_connected', 'discord_username', 'covil_verified'])
        .where('user_id', '=', userId)
        .executeTakeFirst();
    return {
        connected: gm?.discord_connected || false,
        username: gm?.discord_username || null,
        verified: gm?.covil_verified || false,
    };
}
async function connectDiscord(userId, discordData) {
    // Criar ou atualizar gm_profile
    const exists = await db_1.db
        .selectFrom('gm_profiles')
        .select('id')
        .where('user_id', '=', userId)
        .executeTakeFirst();
    if (exists) {
        await db_1.db
            .updateTable('gm_profiles')
            .set({
            discord_connected: true,
            discord_username: discordData.username,
            discord_id: discordData.id,
            updated_at: new Date(),
        })
            .where('user_id', '=', userId)
            .execute();
    }
    else {
        // Criar gm_profile se não existir
        const user = await db_1.db
            .selectFrom('users')
            .select(['username', 'email'])
            .where('id', '=', userId)
            .executeTakeFirst();
        const slug = user?.username || user?.email.split('@')[0] || `user-${userId.slice(0, 8)}`;
        await db_1.db
            .insertInto('gm_profiles')
            .values({
            user_id: userId,
            slug,
            discord_connected: true,
            discord_username: discordData.username,
            discord_id: discordData.id,
        })
            .execute();
        // Elevar role para 'gm'
        await db_1.db.updateTable('users').set({ role: 'gm' }).where('id', '=', userId).execute();
    }
    // Registrar em auth_providers
    await db_1.db
        .insertInto('auth_providers')
        .values({
        user_id: userId,
        provider: 'discord',
        provider_user_id: discordData.id,
        provider_data: { username: discordData.username },
    })
        .onConflict((oc) => oc.columns(['provider', 'provider_user_id']).doNothing())
        .execute();
    return getDiscordStatus(userId);
}
async function disconnectDiscord(userId) {
    await db_1.db
        .updateTable('gm_profiles')
        .set({
        discord_connected: false,
        discord_username: null,
        discord_id: null,
        updated_at: new Date(),
    })
        .where('user_id', '=', userId)
        .execute();
    // Remover de auth_providers
    await db_1.db
        .deleteFrom('auth_providers')
        .where('user_id', '=', userId)
        .where('provider', '=', 'discord')
        .execute();
}
// =============================================================================
// ADMIN: TOGGLE COVIL VERIFIED
// =============================================================================
async function toggleCovilVerified(userId, verified, adminId) {
    await db_1.db
        .updateTable('gm_profiles')
        .set({
        covil_verified: verified,
        covil_verified_at: verified ? new Date() : null,
        covil_verified_by: verified ? adminId : null,
        updated_at: new Date(),
    })
        .where('user_id', '=', userId)
        .execute();
}
