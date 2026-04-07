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
 * Rotas administrativas de perfil
 * Requerem role 'admin'
 */
// =============================================================================
// PATCH /api/v1/admin/users/:id/covil — Toggle selo "Mestre do Covil"
// =============================================================================
router.patch('/users/:id/covil', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const adminId = req.user?.userId;
    const { id: userId } = req.params;
    const { verified } = req.body;
    if (!adminId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    if (typeof verified !== 'boolean') {
        return res.status(400).json({ error: 'Campo "verified" deve ser boolean' });
    }
    try {
        await profileService.toggleCovilVerified(userId, verified, adminId);
        return res.json({
            data: {
                user_id: userId,
                covil_verified: verified,
                verified_by: adminId,
                verified_at: verified ? new Date() : null,
            },
        });
    }
    catch (error) {
        console.error('[PATCH /admin/users/:id/covil]', error);
        return res.status(500).json({ error: 'Erro ao atualizar selo Covil' });
    }
});
// =============================================================================
// GET /api/v1/admin/users — Listar usuários (para gestão)
// =============================================================================
router.get('/users', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { search, role, covil_verified } = req.query;
    try {
        // TODO: Implementar listagem com filtros
        // Por enquanto, retorna estrutura básica
        return res.json({
            data: [],
            meta: {
                total: 0,
                page: 1,
                per_page: 20,
            },
        });
    }
    catch (error) {
        console.error('[GET /admin/users]', error);
        return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});
// =============================================================================
// GET /api/v1/admin/users/:id — Detalhes de usuário (para gestão)
// =============================================================================
router.get('/users/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const profile = await profileService.getFullProfile(id);
        return res.json({ data: profile });
    }
    catch (error) {
        console.error('[GET /admin/users/:id]', error);
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});
exports.default = router;
