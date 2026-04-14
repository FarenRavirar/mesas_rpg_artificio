"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAdmin = exports.requireRole = exports.authMiddleware = void 0;
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
    // LOG TEMPORÁRIO: Diagnóstico do erro 401
    console.log('[authMiddleware] Verificando autenticação:', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!authHeader,
        hasBearerToken: !!bearerToken,
        hasCookie: !!cookieToken,
        cookieLength: cookieToken?.length,
        timestamp: new Date().toISOString()
    });
    // Prioridade: Bearer token (APIs) → Cookie (web app)
    const token = bearerToken || cookieToken;
    if (!token) {
        console.log('[authMiddleware] Token não fornecido - retornando 401');
        return res.status(401).json({ error: 'Token não fornecido.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('[authMiddleware] Token válido:', { userId: decoded.userId, role: decoded.role });
        next();
    }
    catch (error) {
        console.log('[authMiddleware] Token inválido ou expirado:', error);
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
// Middleware opcional: permite usuários anônimos (não retorna 401)
const optionalAuth = (req, res, next) => {
    if (!process.env.JWT_SECRET) {
        console.error('[optionalAuth] JWT_SECRET não configurado');
        req.user = undefined;
        return next();
    }
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieToken = req.cookies?.am_session ?? null;
    const token = bearerToken || cookieToken;
    if (!token) {
        req.user = undefined; // Usuário anônimo
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        req.user = undefined; // Token inválido = usuário anônimo
        next();
    }
};
exports.optionalAuth = optionalAuth;
