"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
const crypto_1 = __importDefault(require("crypto"));
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const XSRF_COOKIE_NAME = 'xsrf_token';
const XSRF_HEADER_NAME = 'x-xsrf-token';
const csrfProtection = (allowedOrigins) => (req, res, next) => {
    const hasCookieSession = Boolean(req.cookies?.am_session);
    if (SAFE_METHODS.has(req.method)) {
        if (hasCookieSession && !req.cookies?.[XSRF_COOKIE_NAME]) {
            res.cookie(XSRF_COOKIE_NAME, crypto_1.default.randomUUID(), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });
        }
        return next();
    }
    const hasBearerToken = typeof req.headers.authorization === 'string'
        && req.headers.authorization.startsWith('Bearer ');
    if (!hasCookieSession || hasBearerToken) {
        return next();
    }
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        return next();
    }
    const xsrfCookie = req.cookies?.[XSRF_COOKIE_NAME];
    const xsrfHeader = req.headers[XSRF_HEADER_NAME];
    if (typeof xsrfCookie === 'string'
        && typeof xsrfHeader === 'string'
        && xsrfCookie === xsrfHeader) {
        return next();
    }
    return res.status(403).json({ error: 'Origem da requisição não permitida.' });
};
exports.csrfProtection = csrfProtection;
