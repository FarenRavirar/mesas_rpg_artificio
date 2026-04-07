"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    // CORREÇÃO A01: Validar JWT_SECRET existe antes de usar
    if (!process.env.JWT_SECRET) {
        console.error('[authMiddleware] JWT_SECRET não configurado');
        return res.status(500).json({ error: 'Configuração de autenticação inválida.' });
    }
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieToken = req.cookies?.am_session ?? null;
    // Prioridade: Bearer token (APIs) → Cookie (web app)
    const token = bearerToken || cookieToken;
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (roles) => {
    const rolesArr = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        if (!rolesArr.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado para o seu perfil.' });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Middleware específico para rotas admin
exports.requireAdmin = [
    exports.authMiddleware,
    (0, exports.requireRole)('admin')
];
