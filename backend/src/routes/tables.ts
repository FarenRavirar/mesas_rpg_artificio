import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/v1/tables — Catálogo público, sem JWT
router.get('/', async (req: Request, res: Response) => {
  const {
    system,
    modality,
    type,
    audience,
    price_type,
    experience_level,
    tag,
    platform,
    state,
    city,
    featured,
    search,
    page = '1',
    limit = '12',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = db
      .selectFrom('tables as t')
      .leftJoin('gm_profiles as gm', 'gm.id', 't.gm_id')
      .leftJoin('systems as s', 's.id', 't.system_id')
      .select([
        't.id',
        't.slug',
        't.title',
        't.description',
        't.cover_url',
        't.status',
        't.type',
        't.audience',
        't.modality',
        't.price_type',
        't.price_value',
        't.slots_total',
        't.slots_filled',
        't.language',
        't.experience_level',
        't.starts_at',
        't.content_warnings',
        't.safety_tools',
        't.featured',
        't.created_at',
        's.name as system_name',
        's.slug as system_slug',
        'gm.slug as gm_slug',
        'gm.avatar_url as gm_avatar_url',
      ])
      .where('t.status', '=', 'active')
      .orderBy('t.created_at', 'desc')
      .limit(limitNum)
      .offset(offset);

    // Filtros opcionais
    if (system)           query = query.where('s.slug', '=', system);
    if (modality)         query = query.where('t.modality', '=', modality as any);
    if (type)             query = query.where('t.type', '=', type as any);
    if (audience)         query = query.where('t.audience', '=', audience as any);
    if (price_type)       query = query.where('t.price_type', '=', price_type as any);
    if (experience_level) query = query.where('t.experience_level', '=', experience_level as any);
    if (featured === 'true') query = query.where('t.featured', '=', true);
    if (state)            query = query.where('t.state', '=', state);
    if (city)             query = query.where('t.city', 'like', `%${city}%`);
    if (search)           query = query.where('t.title', 'ilike', `%${search}%`);

    const tables = await query.execute();

    res.json({
      data: tables,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: tables.length === limitNum,
      },
    });
  } catch (error: any) {
    console.error('[GET /tables]', error);
    res.status(500).json({ error: 'Erro ao buscar mesas.' });
  }
});

// GET /api/v1/tables/:slug — Mesa individual
router.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const table = await db
      .selectFrom('tables as t')
      .leftJoin('gm_profiles as gm', 'gm.id', 't.gm_id')
      .leftJoin('systems as s', 's.id', 't.system_id')
      .select([
        't.id', 't.slug', 't.title', 't.description',
        't.cover_url', 't.status', 't.type', 't.audience',
        't.modality', 't.price_type', 't.price_value', 't.price_frequency',
        't.slots_total', 't.slots_filled', 't.language',
        't.experience_level', 't.starts_at', 't.city', 't.state',
        't.content_warnings', 't.safety_tools', 't.featured', 't.created_at',
        's.name as system_name', 's.slug as system_slug',
        'gm.slug as gm_slug', 'gm.avatar_url as gm_avatar_url',
        'gm.bio_long as gm_bio',
      ])
      .where('t.slug', '=', slug)
      .executeTakeFirst();

    if (!table) {
      return res.status(404).json({ error: 'Mesa não encontrada.' });
    }

    res.json({ data: table });
  } catch (error: any) {
    console.error('[GET /tables/:slug]', error);
    res.status(500).json({ error: 'Erro ao buscar mesa.' });
  }
});

export default router;
