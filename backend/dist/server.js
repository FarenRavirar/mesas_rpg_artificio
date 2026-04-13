"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const tables_1 = __importDefault(require("./routes/tables"));
const gm_1 = __importDefault(require("./routes/gm"));
const gmPanel_1 = __importDefault(require("./routes/gmPanel"));
const systems_1 = __importDefault(require("./routes/systems"));
const scenarios_1 = __importDefault(require("./routes/scenarios"));
const systemSuggestions_1 = __importDefault(require("./routes/systemSuggestions"));
const systemSuggestionsAdmin_1 = __importDefault(require("./routes/systemSuggestionsAdmin"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const me_1 = __importDefault(require("./routes/me"));
const profile_1 = __importDefault(require("./routes/profile"));
const adminProfile_1 = __importDefault(require("./routes/adminProfile"));
const links_1 = __importDefault(require("./routes/links"));
const discord_1 = __importDefault(require("./routes/discord"));
const settings_1 = __importDefault(require("./routes/settings"));
const adminSettingSuggestions_1 = __importDefault(require("./routes/adminSettingSuggestions"));
const vttPlatforms_1 = __importDefault(require("./routes/vttPlatforms"));
const changelog_1 = __importDefault(require("./routes/changelog"));
const adminTables_1 = __importDefault(require("./routes/adminTables"));
require("express-async-errors");
const db_1 = require("./db");
const requestLogger_1 = require("./middleware/requestLogger");
dotenv_1.default.config();
const requiredEnv = ['FRONTEND_URL', 'JWT_SECRET', 'DATABASE_URL'];
for (const envName of requiredEnv) {
    if (!process.env[envName]) {
        throw new Error(`[startup] Variável obrigatória ausente: ${envName}`);
    }
}
const frontendUrl = process.env.FRONTEND_URL;
const frontendOrigin = new URL(frontendUrl).origin;
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: frontendOrigin,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
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
app.use('/api/v1/notifications', notifications_1.default);
app.use('/api/v1/admin', adminTables_1.default);
app.use('/api/v1/admin', systemSuggestionsAdmin_1.default);
app.use('/api/v1/gm', gmPanel_1.default);
app.use('/api/v1/gm', gm_1.default);
app.use('/api/v1/settings', settings_1.default);
app.use('/api/v1/admin/setting-suggestions', adminSettingSuggestions_1.default);
app.use('/api/v1/vtt-platforms', vttPlatforms_1.default);
app.use('/api/v1/changelog', changelog_1.default);
app.use((err, req, res, next) => {
    console.error('[Global Error]', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
