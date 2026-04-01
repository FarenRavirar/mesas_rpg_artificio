import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import 'express-async-errors'; // Adiciona handler global automatico para promises
import { db } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração básica
app.use(cors());
app.use(express.json());

// Verificação de ambiente em health-check
app.get('/api/v1/health', async (req, res) => {
  try {
    const defaultResponse = { status: 'ok', environment: process.env.APP_ENV || 'local' };
    
    // Test DB connection usando Kysely
    if (process.env.DATABASE_URL) {
      const result = await db.selectFrom('users').select('id').limit(1).execute();
      res.json({ ...defaultResponse, db: 'connected', usersSampled: result.length > 0 });
    } else {
      res.json(defaultResponse);
    }
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', details: error.message });
  }
});

// Rotas Principais Fase 1
app.use('/api/v1/auth', authRoutes);

// Custom Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]', err);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
