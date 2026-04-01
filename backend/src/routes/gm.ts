import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/v1/gm/:slug — Perfil público do mestre (sem JWT)
router.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const gm = await db
      .selectFrom('gm_profiles as gm')
      .innerJoin('users as u', 'u.id', 'gm.user_id')
      .innerJoin('profiles as p', 'p.user_id', 'u.id')
      .select([
        'gm.id',
        'gm.slug',
        'p.display_name',
        'gm.bio_long',
        'gm.avatar_url',
        'gm.banner_url',
        'gm.languages',
        'gm.specialties',
        'gm.badges',
        'gm.tables_count',
        'gm.avg_rating',
        'gm.reviews_count',
        'gm.created_at',
      ])
      // Nunca retornar deletehash — REGRA PÉTREA
      .where('gm.slug', '=', slug)
      .executeTakeFirst();

    if (!gm) {
      return res.status(404).json({ error: 'Mestre não encontrado.' });
    }

    // Buscar mesas ativas do mestre
    const tables = await db
      .selectFrom('tables as t')
      .leftJoin('systems as s', 's.id', 't.system_id')
      .select([
        't.id', 't.slug', 't.title', 't.description',
        't.cover_url', 't.status', 't.type', 't.audience', 't.modality',
        't.price_type', 't.price_value',
        't.slots_total', 't.slots_filled',
        't.language', 't.experience_level', 't.featured', 't.created_at',
        's.name as system_name', 's.slug as system_slug',
      ])
      .where('t.gm_id', '=', gm.id)
      .where('t.status', '=', 'active')
      .orderBy('t.created_at', 'desc')
      .execute();

    res.json({ data: { ...gm, tables } });
  } catch (error: any) {
    console.error('[GET /gm/:slug]', error);
    res.status(500).json({ error: 'Erro ao buscar perfil do mestre.' });
  }
});

export default router;
