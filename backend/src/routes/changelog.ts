import { Router, Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'kysely';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await sql<{
      id: string;
      title: string;
      body: string;
      type: string;
      created_at: string;
    }>`
      SELECT id, title, body, type, created_at
      FROM update_log
      WHERE published = true
      ORDER BY created_at DESC
      LIMIT 50
    `.execute(db);

    res.json({ data: result.rows });
  } catch (error: any) {
    console.error('[GET /changelog] Erro:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: 'Erro ao buscar atualizações.' });
  }
});

export default router;