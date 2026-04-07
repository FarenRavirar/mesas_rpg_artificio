"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const kysely_1 = require("kysely");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// CORREÇÃO DT-004: Validar DATABASE_URL no startup
if (!process.env.DATABASE_URL) {
    console.error('[DB] ERRO CRÍTICO: DATABASE_URL não está definida no .env');
    process.exit(1);
}
// CORREÇÃO DT-007: Sanitizar URL para logs (remover credenciais)
const sanitizeDbUrl = (url) => {
    try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.hostname}:${parsed.port}${parsed.pathname}`;
    }
    catch {
        return '[URL inválida]';
    }
};
try {
    new URL(process.env.DATABASE_URL);
}
catch {
    console.error('[DB] ERRO CRÍTICO: DATABASE_URL tem formato inválido:', sanitizeDbUrl(process.env.DATABASE_URL));
    process.exit(1);
}
const dialect = new kysely_1.PostgresDialect({
    pool: new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
    }),
});
// Database interface is passed to Kysely's constructor
exports.db = new kysely_1.Kysely({
    dialect,
});
