import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tablesRoutes from './routes/tables';
import gmRoutes from './routes/gm';
import gmPanelRoutes from './routes/gmPanel';
import systemsRoutes from './routes/systems';
import scenariosRoutes from './routes/scenarios';
import systemSuggestionsRoutes from './routes/systemSuggestions';
import systemSuggestionsAdminRoutes from './routes/systemSuggestionsAdmin';
import notificationsRoutes from './routes/notifications';
import meRoutes from './routes/me';
import profileRoutes from './routes/profile';
import adminProfileRoutes from './routes/adminProfile';
import linksRoutes from './routes/links';
import discordRoutes from './routes/discord';
import settingsRoutes from './routes/settings';
import adminSettingSuggestionsRoutes from './routes/adminSettingSuggestions';
import vttPlatformsRoutes from './routes/vttPlatforms';
import changelogRoutes from './routes/changelog';
import adminTablesRoutes from './routes/adminTables';
import uploadRoutes from './routes/upload';
import 'express-async-errors';
import { db } from './db';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const requiredEnv = ['FRONTEND_URL', 'JWT_SECRET', 'DATABASE_URL'] as const;

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
  .filter((url): url is string => Boolean(url))
  .map((url) => new URL(url).origin);

const allowedFrontendOrigins = Array.from(new Set(frontendUrls));

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
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

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Middleware de logging de todas as requisições
app.use(requestLogger);

app.get('/api/v1/health', async (req, res) => {
  try {
    const result = await db.selectFrom('users').select('id').limit(1).execute();
    res.json({
      status: 'ok',
      environment: process.env.APP_ENV || 'production',
      db: 'connected',
      usersSampled: result.length > 0,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      details: error.message,
    });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/auth', discordRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/profile', linksRoutes);
app.use('/api/v1/admin', adminProfileRoutes);
app.use('/api/v1/tables', tablesRoutes);
app.use('/api/v1/systems', systemsRoutes);
app.use('/api/v1/scenarios', scenariosRoutes);
app.use('/api/v1/system-suggestions', systemSuggestionsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminTablesRoutes);
app.use('/api/v1/admin', systemSuggestionsAdminRoutes);
app.use('/api/v1/gm', gmPanelRoutes);
app.use('/api/v1/gm', gmRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/admin/setting-suggestions', adminSettingSuggestionsRoutes);
app.use('/api/v1/vtt-platforms', vttPlatformsRoutes);
app.use('/api/v1/changelog', changelogRoutes);
app.use('/api/v1', uploadRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]', err);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
