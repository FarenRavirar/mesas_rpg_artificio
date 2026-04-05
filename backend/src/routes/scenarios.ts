import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

interface ScenarioRecord {
  id: string;
  name: string;
  slug: string;
  subgenres: string[];
}

const normalizeText = (value: string): string => value.trim().toLowerCase();

// GET /api/v1/scenarios — Listar todos os cenários
router.get('/', async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string'
    ? req.query.search
    : typeof req.query.q === 'string'
      ? req.query.q
      : '';

  try {
    let query = db
      .selectFrom('scenarios')
      .select(['id', 'name', 'slug', 'subgenres'])
      .orderBy('name', 'asc');

    // Busca full-text se houver query
    if (search.trim().length > 0) {
      const normalizedSearch = normalizeText(search);
      
      const scenarios = await query.execute() as ScenarioRecord[];
      
      // Filtrar no backend (busca em name, slug e subgenres)
      const filtered = scenarios.filter((scenario) => {
        return normalizeText(scenario.name).includes(normalizedSearch)
          || normalizeText(scenario.slug).includes(normalizedSearch)
          || scenario.subgenres.some((subgenre) => normalizeText(subgenre).includes(normalizedSearch));
      });

      return res.json({ data: filtered });
    }

    const scenarios = await query.execute();
    return res.json({ data: scenarios });
  } catch (error: any) {
    console.error('[GET /scenarios]', error);
    return res.status(500).json({ error: 'Erro ao buscar cenários.' });
  }
});

// GET /api/v1/scenarios/:id — Buscar cenário por ID
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const scenario = await db
      .selectFrom('scenarios')
      .select(['id', 'name', 'slug', 'subgenres'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!scenario) {
      return res.status(404).json({ error: 'Cenário não encontrado.' });
    }

    return res.json({ data: scenario });
  } catch (error: any) {
    console.error('[GET /scenarios/:id]', error);
    return res.status(500).json({ error: 'Erro ao buscar cenário.' });
  }
});

export default router;
