import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const changelogsPath = join(__dirname, '../../..', 'database', 'changelogs.json');
    const changelogsData = readFileSync(changelogsPath, 'utf-8');
    const changelogs = JSON.parse(changelogsData);
    
    // Filtrar apenas publicados e ordenar por data
    const published = changelogs
      .filter((log: any) => log.published)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    res.json({ data: published });
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