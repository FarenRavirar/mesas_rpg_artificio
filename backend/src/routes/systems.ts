import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/v1/systems — Lista todos os sistemas de RPG (público)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const systems = await db
      .selectFrom('systems')
      .select(['id', 'name', 'slug'])
      .orderBy('name', 'asc')
      .execute();

    res.json({ data: systems });
  } catch (error: any) {
    console.error('[GET /systems]', error);
    res.status(500).json({ error: 'Erro ao buscar sistemas.' });
  }
});

export default router;
