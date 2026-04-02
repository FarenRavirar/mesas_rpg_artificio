import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const DDAL_ELIGIBLE_PATH = 'dungeons-dragons/5e/2024';

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
};

const sanitizeOptionalText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const sanitizeNickname = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const normalized = value
    .trim()
    .replace(/\s+/g, ' ');

  if (normalized.length < 2 || normalized.length > 40) {
    return null;
  }

  return normalized;
};

const sanitizeOptionalTier = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < 1 || parsed > 4) return null;
  return parsed;
};

const parseOptionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

const isDdalEligibleSystem = async (systemId: string): Promise<boolean> => {
  const system = await db
    .selectFrom('systems')
    .select(['path_slug'])
    .where('id', '=', systemId)
    .executeTakeFirst();

  const path = system?.path_slug ?? null;
  if (!path) return false;

  return path === DDAL_ELIGIBLE_PATH || path.startsWith(`${DDAL_ELIGIBLE_PATH}/`);
};

// POST /api/v1/gm/profile — Cria perfil de mestre (eleva role player → gm)
router.post('/profile', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const { slug, nickname, bio_long, languages, specialties, badges } = req.body;
  if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'Slug inválido. Use apenas letras minúsculas, números e hífens.' });
  }

  const safeNickname = sanitizeNickname(nickname);
  if (!safeNickname) {
    return res.status(400).json({ error: 'Nickname inválido. Use entre 2 e 40 caracteres.' });
  }

  const safeLanguages = sanitizeStringArray(languages);
  const safeSpecialties = sanitizeStringArray(specialties);
  const safeBadges = sanitizeStringArray(badges);

  try {
    const existing = await db
      .selectFrom('gm_profiles')
      .select('id')
      .where('slug', '=', slug)
      .executeTakeFirst();

    if (existing) {
      return res.status(409).json({ error: 'Este slug de mestre já está em uso.' });
    }

    const [gmProfile] = await db
      .insertInto('gm_profiles')
      .values({
        user_id: userId,
        slug,
        nickname: safeNickname,
        bio_long: bio_long ?? null,
        languages: safeLanguages,
        specialties: safeSpecialties,
        badges: safeBadges,
      })
      .returning(['id', 'slug', 'nickname', 'bio_long', 'avatar_url', 'languages', 'specialties', 'badges', 'created_at'])
      .execute();

    await db
      .updateTable('users')
      .set({ role: 'gm' })
      .where('id', '=', userId)
      .where('role', '=', 'player')
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
    title,
    description,
    system_id,
    type,
    audience,
    modality,
    price_type,
    price_value,
    price_frequency,
    slots_total,
    language,
    experience_level,
    starts_at,
    city,
    state,
    content_warnings,
    safety_tools,
    is_ddal,
    ddal_code,
    ddal_name,
    ddal_tier,
    ddal_season,
    ddal_duration,
    ddal_format,
    ddal_org_code,
    ddal_setting,
    ddal_rules_notes,
  } = req.body;

  if (!title || !type || !modality) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, type, modality.' });
  }

  const safeIsDdal = parseOptionalBoolean(is_ddal) ?? false;
  const safeDdalCode = sanitizeOptionalText(ddal_code);
  const safeDdalName = sanitizeOptionalText(ddal_name);
  const safeDdalTier = sanitizeOptionalTier(ddal_tier);
  const safeDdalSeason = sanitizeOptionalText(ddal_season);
  const safeDdalDuration = sanitizeOptionalText(ddal_duration);
  const safeDdalFormat = sanitizeOptionalText(ddal_format);
  const safeDdalOrgCode = sanitizeOptionalText(ddal_org_code);
  const safeDdalSetting = sanitizeOptionalText(ddal_setting);
  const safeDdalRulesNotes = sanitizeOptionalText(ddal_rules_notes);

  if (safeIsDdal) {
    if (!system_id || typeof system_id !== 'string') {
      return res.status(400).json({ error: 'Para marcar DDAL, selecione o sistema D&D 5e 2024.' });
    }

    if (!safeDdalCode || !safeDdalName || !safeDdalTier) {
      return res.status(400).json({ error: 'Para mesas DDAL, preencha Código da Aventura, Nome da Aventura e Tier (1-4).' });
    }

    const isEligible = await isDdalEligibleSystem(system_id);
    if (!isEligible) {
      return res.status(400).json({ error: 'Selo DDAL só é permitido para mesas no caminho D&D > 5e > 2024.' });
    }
  }

  try {
    const gmProfile = await db
      .selectFrom('gm_profiles')
      .select(['id'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!gmProfile) {
      return res.status(403).json({ error: 'Perfil de mestre não encontrado. Crie seu perfil primeiro.' });
    }

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
        is_ddal: safeIsDdal,
        ddal_code: safeIsDdal ? safeDdalCode : null,
        ddal_name: safeIsDdal ? safeDdalName : null,
        ddal_tier: safeIsDdal ? safeDdalTier : null,
        ddal_season: safeIsDdal ? safeDdalSeason : null,
        ddal_duration: safeIsDdal ? safeDdalDuration : null,
        ddal_format: safeIsDdal ? safeDdalFormat : null,
        ddal_org_code: safeIsDdal ? safeDdalOrgCode : null,
        ddal_setting: safeIsDdal ? safeDdalSetting : null,
        ddal_rules_notes: safeIsDdal ? safeDdalRulesNotes : null,
        status: 'active',
      })
      .returning(['id', 'slug', 'title', 'status', 'is_ddal', 'ddal_code', 'ddal_name', 'ddal_tier', 'created_at'])
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
    title,
    description,
    system_id,
    type,
    audience,
    modality,
    price_type,
    price_value,
    price_frequency,
    slots_total,
    slots_filled,
    language,
    experience_level,
    starts_at,
    city,
    state,
    content_warnings,
    safety_tools,
    is_ddal,
    ddal_code,
    ddal_name,
    ddal_tier,
    ddal_season,
    ddal_duration,
    ddal_format,
    ddal_org_code,
    ddal_setting,
    ddal_rules_notes,
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

    const existingTable = await db
      .selectFrom('tables')
      .select(['id', 'gm_id', 'system_id', 'is_ddal', 'ddal_code', 'ddal_name', 'ddal_tier', 'ddal_season', 'ddal_duration', 'ddal_format', 'ddal_org_code', 'ddal_setting', 'ddal_rules_notes'])
      .where('id', '=', id)
      .where('gm_id', '=', gmProfile.id)
      .executeTakeFirst();

    if (!existingTable) {
      return res.status(404).json({ error: 'Mesa não encontrada ou sem permissão.' });
    }

    const safeWarnings = Array.isArray(content_warnings) ? content_warnings.filter((v) => typeof v === 'string') : undefined;
    const safeSafetyTools = Array.isArray(safety_tools) ? safety_tools.filter((v) => typeof v === 'string') : undefined;

    const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(req.body, key);

    const nextSystemId = hasOwn('system_id') ? (system_id ?? null) : existingTable.system_id;

    const incomingIsDdal = parseOptionalBoolean(is_ddal);
    const nextIsDdal = incomingIsDdal ?? existingTable.is_ddal;

    const nextDdalCode = hasOwn('ddal_code') ? sanitizeOptionalText(ddal_code) : existingTable.ddal_code;
    const nextDdalName = hasOwn('ddal_name') ? sanitizeOptionalText(ddal_name) : existingTable.ddal_name;
    const nextDdalTier = hasOwn('ddal_tier') ? sanitizeOptionalTier(ddal_tier) : existingTable.ddal_tier;
    const nextDdalSeason = hasOwn('ddal_season') ? sanitizeOptionalText(ddal_season) : existingTable.ddal_season;
    const nextDdalDuration = hasOwn('ddal_duration') ? sanitizeOptionalText(ddal_duration) : existingTable.ddal_duration;
    const nextDdalFormat = hasOwn('ddal_format') ? sanitizeOptionalText(ddal_format) : existingTable.ddal_format;
    const nextDdalOrgCode = hasOwn('ddal_org_code') ? sanitizeOptionalText(ddal_org_code) : existingTable.ddal_org_code;
    const nextDdalSetting = hasOwn('ddal_setting') ? sanitizeOptionalText(ddal_setting) : existingTable.ddal_setting;
    const nextDdalRulesNotes = hasOwn('ddal_rules_notes') ? sanitizeOptionalText(ddal_rules_notes) : existingTable.ddal_rules_notes;

    if (nextIsDdal) {
      if (!nextSystemId || typeof nextSystemId !== 'string') {
        return res.status(400).json({ error: 'Para marcar DDAL, selecione o sistema D&D 5e 2024.' });
      }

      if (!nextDdalCode || !nextDdalName || !nextDdalTier) {
        return res.status(400).json({ error: 'Para mesas DDAL, preencha Código da Aventura, Nome da Aventura e Tier (1-4).' });
      }

      const isEligible = await isDdalEligibleSystem(nextSystemId);
      if (!isEligible) {
        return res.status(400).json({ error: 'Selo DDAL só é permitido para mesas no caminho D&D > 5e > 2024.' });
      }
    }

    const updated = await db
      .updateTable('tables')
      .set({
        title: title ?? undefined,
        description: description ?? undefined,
        system_id: hasOwn('system_id') ? (system_id ?? null) : undefined,
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
        is_ddal: nextIsDdal,
        ddal_code: nextIsDdal ? nextDdalCode : null,
        ddal_name: nextIsDdal ? nextDdalName : null,
        ddal_tier: nextIsDdal ? nextDdalTier : null,
        ddal_season: nextIsDdal ? nextDdalSeason : null,
        ddal_duration: nextIsDdal ? nextDdalDuration : null,
        ddal_format: nextIsDdal ? nextDdalFormat : null,
        ddal_org_code: nextIsDdal ? nextDdalOrgCode : null,
        ddal_setting: nextIsDdal ? nextDdalSetting : null,
        ddal_rules_notes: nextIsDdal ? nextDdalRulesNotes : null,
      })
      .where('id', '=', id)
      .where('gm_id', '=', gmProfile.id)
      .returning(['id', 'slug', 'title', 'status', 'is_ddal', 'ddal_code', 'ddal_name', 'ddal_tier', 'updated_at'])
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
        't.is_ddal', 't.ddal_code', 't.ddal_name', 't.ddal_tier',
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
      .where('gm_id', '=', gmProfile.id)
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
