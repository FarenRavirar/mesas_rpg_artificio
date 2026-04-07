import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tablesRoutes from './routes/tables';
import tableSchedulesRoutes from './routes/tableSchedules';
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
import vttPlatformsRoutes from './routes/vttPlatforms'; // Sistema de VTT Platforms
import 'express-async-errors';
import { db } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração básica
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Suporta JSONs grandes de formulários complexos

// CORREÇÃO DT-005: Validar todas env vars obrigatórias no healthcheck
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'IMGUR_CLIENT_ID'
];

// Verificação de ambiente em health-check
app.get('/api/v1/health', async (req, res) => {
  try {
    const defaultResponse = { status: 'ok', environment: process.env.APP_ENV || 'local' };
    const missingVars: string[] = [];

    // Validar variáveis obrigatórias
    for (const varName of REQUIRED_ENV_VARS) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      return res.status(500).json({
        status: 'error',
        message: 'Variáveis de ambiente obrigatórias ausentes',
        missing: missingVars
      });
    }

    // Test DB connection usando Kysely
    const result = await db.selectFrom('users').select('id').limit(1).execute();
    res.json({ ...defaultResponse, db: 'connected', usersSampled: result.length > 0 });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', details: error.message });
  }
});

// Rotas Principais Fase 1, 2 e 3
// Compatibilidade OAuth: mantém rota canônica em /api/v1/auth e aceita callback legado em /auth
app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/auth', discordRoutes);  // Discord OAuth
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/profile', profileRoutes);  // REQ-29: Sistema de perfil completo
app.use('/api/v1/profile', linksRoutes);  // Links e Conteúdo (prova social externa)
app.use('/api/v1/admin', adminProfileRoutes);  // REQ-29: Admin - Selo Covil
app.use('/api/v1/tables', tablesRoutes);
app.use('/api/v1/tables', tableSchedulesRoutes);  // REQ-27: Agenda Estruturada
app.use('/api/v1/systems', systemsRoutes);
app.use('/api/v1/scenarios', scenariosRoutes);
app.use('/api/v1/system-suggestions', systemSuggestionsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', systemSuggestionsAdminRoutes);
app.use('/api/v1/gm', gmPanelRoutes);  // Painel autenticado do mestre
app.use('/api/v1/gm', gmRoutes);       // Perfil público do mestre
app.use('/api/v1/settings', settingsRoutes);  // REQ-28: Sugestões de estilos por cenário
app.use('/api/v1/admin/setting-suggestions', adminSettingSuggestionsRoutes);  // REQ-28: Admin CRUD
app.use('/api/v1/vtt-platforms', vttPlatformsRoutes);  // Sistema de VTT Platforms com logos



// Custom Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]', err);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
