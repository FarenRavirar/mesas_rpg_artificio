"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const tables_1 = __importDefault(require("./routes/tables"));
const gm_1 = __importDefault(require("./routes/gm"));
const gmPanel_1 = __importDefault(require("./routes/gmPanel"));
const systems_1 = __importDefault(require("./routes/systems"));
const scenarios_1 = __importDefault(require("./routes/scenarios"));
const systemSuggestions_1 = __importDefault(require("./routes/systemSuggestions"));
const scenarioSuggestions_1 = __importDefault(require("./routes/scenarioSuggestions"));
const systemSuggestionsAdmin_1 = __importDefault(require("./routes/systemSuggestionsAdmin"));
const scenarioSuggestionsAdmin_1 = __importDefault(require("./routes/scenarioSuggestionsAdmin"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const me_1 = __importDefault(require("./routes/me"));
const profile_1 = __importDefault(require("./routes/profile"));
const adminProfile_1 = __importDefault(require("./routes/adminProfile"));
const links_1 = __importDefault(require("./routes/links"));
const discord_1 = __importDefault(require("./routes/discord"));
const settings_1 = __importDefault(require("./routes/settings"));
const adminSettingSuggestions_1 = __importDefault(require("./routes/adminSettingSuggestions"));
const vttPlatforms_1 = __importDefault(require("./routes/vttPlatforms"));
const communicationPlatforms_1 = __importDefault(require("./routes/communicationPlatforms"));
const changelog_1 = __importDefault(require("./routes/changelog"));
const adminTables_1 = __importDefault(require("./routes/adminTables"));
const adminHydration_1 = __importDefault(require("./routes/adminHydration"));
const activityLog_1 = __importDefault(require("./routes/activityLog"));
const upload_1 = __importDefault(require("./routes/upload"));
const og_1 = __importDefault(require("./routes/og"));
require("express-async-errors");
const db_1 = require("./db");
const requestLogger_1 = require("./middleware/requestLogger");
const csrfProtection_1 = require("./middleware/csrfProtection");
const parseCookies_1 = require("./middleware/parseCookies");
const rateLimit_1 = require("./middleware/rateLimit");
dotenv_1.default.config();
const requiredEnv = ['FRONTEND_URL', 'JWT_SECRET', 'DATABASE_URL'];
for (const envName of requiredEnv) {
    if (!process.env[envName]) {
        throw new Error(`[startup] Variável obrigatória ausente: ${envName}`);
    }
}
const frontendUrls = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS?.split(',') ?? []),
]
    .map((url) => url?.trim())
    .filter((url) => Boolean(url))
    .map((url) => new URL(url).origin);
const allowedFrontendOrigins = Array.from(new Set(frontendUrls));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedFrontendOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`[cors] Origin não permitida: ${origin}`));
    },
    credentials: true,
}));
app.use(parseCookies_1.parseCookies);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(rateLimit_1.globalRateLimiter);
app.use((0, csrfProtection_1.csrfProtection)(allowedFrontendOrigins));
// Middleware de logging de todas as requisições
app.use(requestLogger_1.requestLogger);
app.get('/api/v1/health', async (req, res) => {
    try {
        const result = await db_1.db.selectFrom('users').select('id').limit(1).execute();
        res.json({
            status: 'ok',
            environment: process.env.APP_ENV || 'production',
            db: 'connected',
            usersSampled: result.length > 0,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            details: error.message,
        });
    }
});
app.use('/api/v1/auth', auth_1.default);
app.use('/auth', auth_1.default);
app.use('/auth', discord_1.default);
app.use('/api/v1/me', me_1.default);
app.use('/api/v1/profile', profile_1.default);
app.use('/api/v1/profile', links_1.default);
app.use('/api/v1/admin', adminProfile_1.default);
app.use('/api/v1/tables', tables_1.default);
app.use('/api/v1/systems', systems_1.default);
app.use('/api/v1/scenarios', scenarios_1.default);
app.use('/api/v1/system-suggestions', systemSuggestions_1.default);
app.use('/api/v1/scenario-suggestions', scenarioSuggestions_1.default);
app.use('/api/v1/notifications', notifications_1.default);
app.use('/api/v1/admin', adminTables_1.default);
app.use('/api/v1/admin', adminHydration_1.default);
app.use('/api/v1/admin', systemSuggestionsAdmin_1.default);
app.use('/api/v1/admin', scenarioSuggestionsAdmin_1.default);
app.use('/api/v1/admin', activityLog_1.default);
app.use('/api/v1/gm', gmPanel_1.default);
app.use('/api/v1/gm', gm_1.default);
app.use('/api/v1/settings', settings_1.default);
app.use('/api/v1/admin/setting-suggestions', adminSettingSuggestions_1.default);
app.use('/api/v1/vtt-platforms', vttPlatforms_1.default);
app.use('/api/v1/communication-platforms', communicationPlatforms_1.default);
app.use('/api/v1/changelog', changelog_1.default);
app.use('/api/v1', upload_1.default);
app.use('/og', og_1.default);
app.use((err, req, res, next) => {
    console.error('[Global Error]', err);
    if (res.headersSent) {
        return next(err);
    }
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
    }
    const status = typeof err?.status === 'number'
        ? err.status
        : typeof err?.statusCode === 'number'
            ? err.statusCode
            : 500;
    if (status >= 500) {
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
    return res.status(status).json({ error: err?.message || 'Requisição inválida.' });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
