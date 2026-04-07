"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const profileService = __importStar(require("../services/profileService"));
const router = (0, express_1.Router)();
/**
 * Rotas de perfil de usuário
 * Todas as rotas requerem autenticação
 */
// =============================================================================
// GET /api/v1/profile/me — Perfil completo do usuário logado
// =============================================================================
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    try {
        const profile = await profileService.getFullProfile(userId);
        return res.json({ data: profile });
    }
    catch (error) {
        console.error('[GET /profile/me]', error);
        return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
});
// =============================================================================
// PATCH /api/v1/profile/me — Atualizar dados gerais (username, location)
// =============================================================================
router.patch('/me', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    const { username, location } = req.body;
    try {
        // Validar username se fornecido
        if (username !== undefined) {
            if (typeof username !== 'string' || username.trim().length < 3) {
                return res.status(400).json({ error: 'Username deve ter no mínimo 3 caracteres' });
            }
            // Validar formato (apenas letras, números e underscore)
            if (!/^[a-z0-9_]+$/i.test(username)) {
                return res
                    .status(400)
                    .json({ error: 'Username deve conter apenas letras, números e underscore' });
            }
            // Verificar unicidade
            const existing = await profileService.checkUsernameExists(username, userId);
            if (existing) {
                return res.status(400).json({ error: 'Username já está em uso' });
            }
        }
        const user = await profileService.updateUser(userId, { username, location });
        return res.json({ data: user });
    }
    catch (error) {
        console.error('[PATCH /profile/me]', error);
        return res.status(500).json({ error: 'Erro ao atualizar dados' });
    }
});
// =============================================================================
// PATCH /api/v1/profile/me/profile — Atualizar perfil básico
// =============================================================================
router.patch('/me/profile', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    const { display_name, bio, avatar_url, languages } = req.body;
    try {
        const profile = await profileService.updateProfile(userId, {
            display_name,
            bio,
            avatar_url,
            languages,
        });
        return res.json({ data: profile });
    }
    catch (error) {
        console.error('[PATCH /profile/me/profile]', error);
        return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});
// =============================================================================
// PATCH /api/v1/profile/me/player — Atualizar perfil de jogador
// =============================================================================
router.patch('/me/player', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    const { experience_level, playstyle, preferred_days, preferred_time, pricing_preference } = req.body;
    try {
        const player = await profileService.updatePlayerProfile(userId, {
            experience_level,
            playstyle,
            preferred_days,
            preferred_time,
            pricing_preference,
        });
        return res.json({ data: player });
    }
    catch (error) {
        console.error('[PATCH /profile/me/player]', error);
        return res.status(500).json({ error: 'Erro ao atualizar perfil de jogador' });
    }
});
// =============================================================================
// PATCH /api/v1/profile/me/gm — Atualizar perfil de mestre
// =============================================================================
router.patch('/me/gm', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    const { nickname, bio_long, avatar_url, banner_url, languages, specialties, experience_years, average_price, gm_style, tools, game_format, } = req.body;
    try {
        const gm = await profileService.updateGmProfile(userId, {
            nickname,
            bio_long,
            avatar_url,
            banner_url,
            languages,
            specialties,
            experience_years,
            average_price,
            gm_style,
            tools,
            game_format,
        });
        return res.json({ data: gm });
    }
    catch (error) {
        console.error('[PATCH /profile/me/gm]', error);
        return res.status(500).json({ error: 'Erro ao atualizar perfil de mestre' });
    }
});
// =============================================================================
// POST /api/v1/profile/me/systems — Adicionar sistema favorito/gm
// =============================================================================
router.post('/me/systems', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    const { system_id, type } = req.body;
    if (!system_id || !type) {
        return res.status(400).json({ error: 'system_id e type são obrigatórios' });
    }
    if (type !== 'favorite' && type !== 'gm') {
        return res.status(400).json({ error: 'type deve ser "favorite" ou "gm"' });
    }
    try {
        const userSystem = await profileService.addUserSystem(userId, system_id, type);
        return res.json({ data: userSystem });
    }
    catch (error) {
        console.error('[POST /profile/me/systems]', error);
        return res.status(500).json({ error: error.message || 'Erro ao adicionar sistema' });
    }
});
// =============================================================================
// DELETE /api/v1/profile/me/systems/:id — Remover sistema
// =============================================================================
router.delete('/me/systems/:id', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    const { id } = req.params;
    try {
        await profileService.removeUserSystem(id, userId);
        return res.status(204).send();
    }
    catch (error) {
        console.error('[DELETE /profile/me/systems/:id]', error);
        return res.status(500).json({ error: 'Erro ao remover sistema' });
    }
});
// =============================================================================
// GET /api/v1/profile/me/discord — Status da conexão Discord
// =============================================================================
router.get('/me/discord', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    try {
        const status = await profileService.getDiscordStatus(userId);
        return res.json({ data: status });
    }
    catch (error) {
        console.error('[GET /profile/me/discord]', error);
        return res.status(500).json({ error: 'Erro ao buscar status Discord' });
    }
});
// =============================================================================
// POST /api/v1/profile/me/connect/discord — Conectar Discord
// =============================================================================
router.post('/me/connect/discord', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    const { username, id } = req.body;
    if (!username || !id) {
        return res.status(400).json({ error: 'username e id são obrigatórios' });
    }
    try {
        const status = await profileService.connectDiscord(userId, { username, id });
        return res.json({ data: status });
    }
    catch (error) {
        console.error('[POST /profile/me/connect/discord]', error);
        return res.status(500).json({ error: 'Erro ao conectar Discord' });
    }
});
// =============================================================================
// DELETE /api/v1/profile/me/connect/discord — Desconectar Discord
// =============================================================================
router.delete('/me/connect/discord', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    try {
        await profileService.disconnectDiscord(userId);
        return res.status(204).send();
    }
    catch (error) {
        console.error('[DELETE /profile/me/connect/discord]', error);
        return res.status(500).json({ error: 'Erro ao desconectar Discord' });
    }
});
exports.default = router;
