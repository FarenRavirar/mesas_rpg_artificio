import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/v1/gm/profile — Cria perfil de mestre (eleva role player → gm)
router.post('/profile', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  // Validação mínima
  const { slug, bio_long, languages, specialties, badges } = req.body;
  if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'Slug inválido. Use apenas letras minúsculas, números e hífens.' });
  }

  const safeLanguages = Array.isArray(languages) ? languages.filter((v) => typeof v === 'string') : [];
  const safeSpecialties = Array.isArray(specialties) ? specialties.filter((v) => typeof v === 'string') : [];
  const safeBadges = Array.isArray(badges) ? badges.filter((v) => typeof v === 'string') : [];

  try {
    // Verifica se slug já existe
    const existing = await db
      .selectFrom('gm_profiles')
      .select('id')
      .where('slug', '=', slug)
      .executeTakeFirst();

    if (existing) {
      return res.status(409).json({ error: 'Este slug de mestre já está em uso.' });
    }

    // Cria gm_profile
    const [gmProfile] = await db
      .insertInto('gm_profiles')
      .values({
        user_id: userId,
        slug,
        bio_long: bio_long ?? null,
        languages: safeLanguages,
        specialties: safeSpecialties,
        badges: safeBadges,
      })
      .returning(['id', 'slug', 'bio_long', 'avatar_url', 'languages', 'specialties', 'badges', 'created_at'])
      .execute();

    // Eleva role para gm
    await db
      .updateTable('users')
      .set({ role: 'gm' })
      .where('id', '=', userId)
      .where('role', '=', 'player') // Só eleva se ainda for player
      .execute();

    return res.status(201).json({ data: gmProfile });
  } catch (error: any) {
    console.error('[POST /gm/profile]', error);
    return res.status(500).json({ error: 'Erro ao criar perfil de mestre.' });
  }
});

// PUT /api/v1/gm/profile — Edita perfil do mestre logado
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { bio_long, languages, specialties, badges, avatar_url, banner_url } = req.body;

  const safeLanguages = Array.isArray(languages) ? languages.filter((v) => typeof v === 'string') : undefined;
  const safeSpecialties = Array.isArray(specialties) ? specialties.filter((v) => typeof v === 'string') : undefined;
  const safeBadges = Array.isArray(badges) ? badges.filter((v) => typeof v === 'string') : undefined;

  try {
    const gmProfile = await db
      .selectFrom('gm_profiles')
      .select(['id'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!gmProfile) {
      return res.status(404).json({ error: 'Perfil de mestre não encontrado.' });
    }

    const [updated] = await db
      .updateTable('gm_profiles')
      .set({
        bio_long: bio_long ?? undefined,
        languages: safeLanguages,
        specialties: safeSpecialties,
        badges: safeBadges,
        avatar_url: avatar_url ?? undefined,
        banner_url: banner_url ?? undefined,
      })
      .where('id', '=', gmProfile.id)
      .returning(['id', 'slug', 'bio_long', 'avatar_url', 'banner_url', 'languages', 'specialties', 'badges', 'updated_at'])
      .execute();

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PUT /gm/profile]', error);
    return res.status(500).json({ error: 'Erro ao atualizar perfil de mestre.' });
  }
});

// GET /api/v1/gm/me — Retorna perfil próprio do mestre logado
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const gmProfile = await db
      .selectFrom('gm_profiles')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!gmProfile) {
      return res.status(404).json({ error: 'Perfil de mestre não encontrado.' });
    }

    const tablesCountRow = await db
      .selectFrom('tables')
      .select(({ fn }) => [fn.count<string>('id').as('count')])
      .where('gm_id', '=', gmProfile.id)
      .executeTakeFirst();

    const tablesCount = Number(tablesCountRow?.count ?? 0);

    // Não retornamos os deletehash — filtramos manualmente
    const { avatar_deletehash, banner_deletehash, ...safeProfile } = gmProfile;
    return res.json({
      data: {
        ...safeProfile,
        tables_count: tablesCount,
        avg_rating: null,
      },
    });
  } catch (error: any) {
    console.error('[GET /gm/me]', error);
    return res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
});

// POST /api/v1/gm/tables — Cria nova mesa (apenas usuários com gm_profile)
router.post('/tables', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const {
    title, description, system_id, type, audience, modality,
    price_type, price_value, price_frequency,
    slots_total, language, experience_level, starts_at,
    city, state, content_warnings, safety_tools
  } = req.body;

  // Validações obrigatórias
  if (!title || !type || !modality) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, type, modality.' });
  }

  try {
    // Busca gm_profile do usuário
    const gmProfile = await db
      .selectFrom('gm_profiles')
      .select(['id'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!gmProfile) {
      return res.status(403).json({ error: 'Perfil de mestre não encontrado. Crie seu perfil primeiro.' });
    }

    // Gera slug a partir do título
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 80);

    const slugSuffix = Date.now().toString(36);
    const slug = `${baseSlug}-${slugSuffix}`;

    const [newTable] = await db
      .insertInto('tables')
      .values({
        slug,
        gm_id: gmProfile.id,
        system_id: system_id ?? null,
        title,
        description: description ?? null,
        type,
        audience: audience ?? 'livre',
        modality,
        price_type: price_type ?? 'gratuita',
        price_value: price_value ?? null,
        price_frequency: price_frequency ?? null,
        slots_total: slots_total ?? 4,
        language: language ?? 'Português',
        experience_level: experience_level ?? 'todos',
        starts_at: starts_at ? new Date(starts_at) : null,
        city: city ?? null,
        state: state ?? null,
        content_warnings: content_warnings ?? [],
        safety_tools: safety_tools ?? [],
        status: 'active',
      })
      .returning(['id', 'slug', 'title', 'status', 'created_at'])
      .execute();

    return res.status(201).json({ data: newTable });
  } catch (error: any) {
    console.error('[POST /gm/tables]', error);
    return res.status(500).json({ error: 'Erro ao criar mesa.' });
  }
});

// PUT /api/v1/gm/tables/:id — Edita mesa própria
router.put('/tables/:id', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;

  const {
    title, description, system_id, type, audience, modality,
    price_type, price_value, price_frequency,
    slots_total, slots_filled, language, experience_level, starts_at,
    city, state, content_warnings, safety_tools,
  } = req.body;

  try {
    const gmProfile = await db
      .selectFrom('gm_profiles')
      .select(['id'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!gmProfile) {
      return res.status(403).json({ error: 'Perfil de mestre não encontrado.' });
    }

    const safeWarnings = Array.isArray(content_warnings) ? content_warnings.filter((v) => typeof v === 'string') : undefined;
    const safeSafetyTools = Array.isArray(safety_tools) ? safety_tools.filter((v) => typeof v === 'string') : undefined;

    const updated = await db
      .updateTable('tables')
      .set({
        title: title ?? undefined,
        description: description ?? undefined,
        system_id: system_id ?? undefined,
        type: type ?? undefined,
        audience: audience ?? undefined,
        modality: modality ?? undefined,
        price_type: price_type ?? undefined,
        price_value: price_value ?? undefined,
        price_frequency: price_frequency ?? undefined,
        slots_total: slots_total ?? undefined,
        slots_filled: slots_filled ?? undefined,
        language: language ?? undefined,
        experience_level: experience_level ?? undefined,
        starts_at: starts_at ? new Date(starts_at) : undefined,
        city: city ?? undefined,
        state: state ?? undefined,
        content_warnings: safeWarnings,
        safety_tools: safeSafetyTools,
      })
      .where('id', '=', id)
      .where('gm_id', '=', gmProfile.id)
      .returning(['id', 'slug', 'title', 'status', 'updated_at'])
      .execute();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Mesa não encontrada ou sem permissão.' });
    }

    return res.json({ data: updated[0] });
  } catch (error: any) {
    console.error('[PUT /gm/tables/:id]', error);
    return res.status(500).json({ error: 'Erro ao editar mesa.' });
  }
});

// GET /api/v1/gm/tables — Lista mesas do mestre logado
router.get('/tables', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const gmProfile = await db
      .selectFrom('gm_profiles')
      .select('id')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!gmProfile) return res.status(403).json({ error: 'Perfil de mestre não encontrado.' });

    const tables = await db
      .selectFrom('tables as t')
      .leftJoin('systems as s', 's.id', 't.system_id')
      .select([
        't.id', 't.slug', 't.title', 't.description', 't.status', 't.modality',
        't.system_id', 't.type', 't.audience',
        't.price_type', 't.price_value', 't.price_frequency',
        't.slots_total', 't.slots_filled', 't.language', 't.experience_level',
        't.starts_at', 't.city', 't.state',
        't.content_warnings', 't.safety_tools',
        't.created_at', 't.updated_at',
        's.name as system_name',
      ])
      .where('t.gm_id', '=', gmProfile.id)
      .orderBy('t.created_at', 'desc')
      .execute();

    return res.json({ data: tables });
  } catch (error: any) {
    console.error('[GET /gm/tables]', error);
    return res.status(500).json({ error: 'Erro ao buscar mesas do mestre.' });
  }
});

// PATCH /api/v1/gm/tables/:id/status — Altera status da mesa
router.patch('/tables/:id/status', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['active', 'full', 'cancelled', 'ended'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Valores permitidos: ${validStatuses.join(', ')}` });
  }

  try {
    const gmProfile = await db
      .selectFrom('gm_profiles')
      .select('id')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!gmProfile) return res.status(403).json({ error: 'Acesso negado.' });

    const result = await db
      .updateTable('tables')
      .set({ status })
      .where('id', '=', id)
      .where('gm_id', '=', gmProfile.id) // Garante que a mesa é do mestre logado
      .returning(['id', 'slug', 'title', 'status'])
      .execute();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Mesa não encontrada ou sem permissão.' });
    }

    return res.json({ data: result[0] });
  } catch (error: any) {
    console.error('[PATCH /gm/tables/:id/status]', error);
    return res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

export default router;
