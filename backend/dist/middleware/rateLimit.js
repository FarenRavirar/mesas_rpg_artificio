"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictRateLimiter = exports.authRateLimiter = exports.globalRateLimiter = exports.publicRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Rate limiter para rotas públicas
 * Limite: 100 requisições por 15 minutos por IP
 */
exports.publicRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições por janela
    message: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Rate limiter para rotas autenticadas
 * Limite: 50 requisições por 15 minutos por IP
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // 50 requisições por janela
    message: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Rate limiter estrito para operações sensíveis
 * Limite: 10 requisições por 15 minutos por IP
 */
exports.strictRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 requisições por janela
    message: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});
