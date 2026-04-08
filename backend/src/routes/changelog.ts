import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/v1/changelog — Público (não requer autenticação)
router.get('/', async (req: Request, res: Response) => {
  try {
    const logs = await db
      .selectFrom('update_log')
      .select(['id', 'title', 'body', 'type', 'created_at'])
      .where('published', '=', true)
      .orderBy('created_at', 'desc')
      .limit(50)
      .execute();

    res.json({ data: logs });
  } catch (error: any) {
    // CORREÇÃO A01: Log estruturado com stack trace para debug em produção
    console.error('[GET /changelog] Erro ao buscar atualizações:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: 'Erro ao buscar atualizações.' });
  }
});

export default router;
