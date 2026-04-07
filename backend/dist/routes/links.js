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
const linkService = __importStar(require("../services/linkService"));
const router = (0, express_1.Router)();
/**
 * GET /api/v1/profile/links
 * Lista todos os links do usuário logado
 */
router.get('/links', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const links = await linkService.getUserLinks(userId);
        res.json({
            success: true,
            data: links,
        });
    }
    catch (error) {
        console.error('Error fetching user links:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar links',
        });
    }
});
/**
 * POST /api/v1/profile/links
 * Cria um novo link para o usuário logado
 */
router.post('/links', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { url } = req.body;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'URL é obrigatória',
            });
        }
        const link = await linkService.createUserLink(userId, { url });
        res.status(201).json({
            success: true,
            data: link,
        });
    }
    catch (error) {
        console.error('Error creating user link:', error);
        if (error.message === 'URL inválida') {
            return res.status(400).json({
                success: false,
                error: error.message,
            });
        }
        if (error.message === 'Limite de 10 links atingido') {
            return res.status(400).json({
                success: false,
                error: error.message,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Erro ao criar link',
        });
    }
});
/**
 * DELETE /api/v1/profile/links/:id
 * Remove um link do usuário logado
 */
router.delete('/links/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        await linkService.deleteUserLink(userId, id);
        res.json({
            success: true,
            message: 'Link removido com sucesso',
        });
    }
    catch (error) {
        console.error('Error deleting user link:', error);
        if (error.message === 'Link não encontrado') {
            return res.status(404).json({
                success: false,
                error: error.message,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Erro ao remover link',
        });
    }
});
/**
 * PATCH /api/v1/profile/links/reorder
 * Atualiza a ordem dos links
 */
router.patch('/links/reorder', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { linkIds } = req.body;
        if (!Array.isArray(linkIds)) {
            return res.status(400).json({
                success: false,
                error: 'linkIds deve ser um array',
            });
        }
        await linkService.updateLinksOrder(userId, linkIds);
        res.json({
            success: true,
            message: 'Ordem atualizada com sucesso',
        });
    }
    catch (error) {
        console.error('Error reordering links:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao reordenar links',
        });
    }
});
exports.default = router;
