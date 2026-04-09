import { Router, Request, Response } from 'express';
import { sql } from 'kysely';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

const DDAL_ELIGIBLE_PATH = 'dungeons-dragons/5e/2024';
const CONTACT_CHANNELS = ['whatsapp', 'discord', 'phone', 'email', 'facebook', 'instagram', 'form'] as const;

// Anti-abuso de métricas: janelas de throttle por ação (em milissegundos)
const METRIC_THROTTLE_WINDOWS = {
  view: 15 * 60 * 1000,      // 15 minutos
  click: 5 * 60 * 1000,       // 5 minutos
  contact: 30 * 60 * 1000,    // 30 minutos
  favorite: 24 * 60 * 60 * 1000, // 24 horas
} as const;

type MetricAction = keyof typeof METRIC_THROTTLE_WINDOWS;

/**
 * Extrai IP do cliente considerando proxies (X-Forwarded-For, X-Real-IP)
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp.trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Gera fingerprint hash (SHA256) de IP + User-Agent para deduplicação sem armazenar PII
 */
function generateFingerprint(req: Request): string {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const raw = `${ip}:${userAgent}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Verifica se métrica deve ser contada (não existe evento recente na janela de throttle)
 * Retorna true se deve contar, false se está dentro da janela (duplicado)
 */
async function shouldCountMetric(
  tableId: string,
  action: MetricAction,
  fingerprint: string
): Promise<boolean> {
  const windowMs = METRIC_THROTTLE_WINDOWS[action];
  const cutoff = new Date(Date.now() - windowMs);

  const recentEvent = await db
    .selectFrom('table_metric_events')
    .select('id')
    .where('table_id', '=', tableId)
    .where('action', '=', action)
    .where('fingerprint_hash', '=', fingerprint)
    .where('created_at', '>', cutoff)
    .executeTakeFirst();

  return !recentEvent; // true se não existe evento recente
}

type ContactChannel = (typeof CONTACT_CHANNELS)[number];
type PublisherRole = 'gm' | 'announcer';

interface SanitizedTableContact {
  channel: ContactChannel;
  value: string;
  label: string | null;
  discord_server_url: string | null;
  sort_order: number;
}

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

const sanitizePublisherRole = (value: unknown): PublisherRole => {
  if (typeof value !== 'string') return 'gm';
  const normalized = value.trim().toLowerCase();
  return normalized === 'announcer' ? 'announcer' : 'gm';
};

const sanitizeContactsPayload = (value: unknown): { contacts: SanitizedTableContact[]; error: string | null } => {
  if (value === undefined || value === null) {
    return { contacts: [], error: null };
  }

  if (!Array.isArray(value)) {
    return { contacts: [], error: 'Formato inválido para contatos.' };
  }

  const contacts: SanitizedTableContact[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (!item || typeof item !== 'object') {
      return { contacts: [], error: `Contato #${index + 1} inválido.` };
    }

    const source = item as Record<string, unknown>;
    const rawChannel = typeof source.channel === 'string' ? source.channel.trim().toLowerCase() : '';

    if (!CONTACT_CHANNELS.includes(rawChannel as ContactChannel)) {
      return { contacts: [], error: `Canal inválido no contato #${index + 1}.` };
    }

    const safeChannel = rawChannel as ContactChannel;
    const safeValue = sanitizeOptionalText(source.value);

    if (!safeValue) {
      return { contacts: [], error: `Preencha o valor do contato #${index + 1}.` };
    }

    const safeLabel = sanitizeOptionalText(source.label);
    const safeDiscordServerUrl = safeChannel === 'discord'
      ? sanitizeOptionalText(source.discord_server_url)
      : null;

    contacts.push({
      channel: safeChannel,
      value: safeValue,
      label: safeLabel,
      discord_server_url: safeDiscordServerUrl,
      sort_order: index,
    });
  }

  return { contacts, error: null };
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

  // Log do payload recebido para diagnóstico
  console.log('[POST /gm/tables] Payload recebido:', JSON.stringify({
    userId,
    bodyKeys: Object.keys(req.body),
    title: req.body.title,
    type: req.body.type,
    modality: req.body.modality,
    hasSchedules: Array.isArray(req.body.schedules),
    schedulesCount: Array.isArray(req.body.schedules) ? req.body.schedules.length : 0,
    hasContacts: Array.isArray(req.body.contacts),
    contactsCount: Array.isArray(req.body.contacts) ? req.body.contacts.length : 0,
    settingName: req.body.setting_name,
    settingStyles: req.body.setting_styles,
  }, null, 2));

  const {
    title,
    description,
    system_id,
    scenario_id, // CORREÇÃO DT-002: Adicionar scenario_id ao destructuring
    type,
    audience,
    modality,
    price_type,
    price_value,
    price_frequency,
    slots_total,
    slots_open, // REQ-02: Vagas abertas para recrutamento
    language,
    experience_level,
    starts_at,
    city,
    state,
    content_warnings,
    safety_tools,
    publisher_role,
    actual_gm_name,
    contacts,
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
    frequency, // CORREÇÃO DT-004: Já estava no destructuring
    frequency_custom, // CORREÇÃO DT-004: Já estava no destructuring
    // VTT Platform (Migration 006)
    vtt_platform_id, // CORREÇÃO DT-001: Já estava no destructuring, mas não era persistido
    game_platform_custom,
    communication_platform,
    rules_notes,
    banner_url,
    is_covil,
    // CORREÇÃO: Adicionar campos avançados (REQ-26)
    master_display_name,
    campaign_length,
    level_range,
    billing_text,
    session_zero_free,
    synopsis,
    style_text,
    listing_excerpt,
    technical_requirements,
    requires_pc,
    requires_camera,
    requires_microphone,
    // CORREÇÃO: Adicionar schedules (REQ-27)
    schedules,
    // REQ-28 Fase 6: Campos editoriais separados (CORREÇÃO CRÍTICA)
    synopsis_narrative,
    benefits_text,
    table_gm_bio,
  } = req.body;

  if (!title || !type || !modality) {
    return res.status(400).json({ error: 'Campos obrigatórios: title, type, modality.' });
  }

  // CORREÇÃO DT-20: Validar system_id obrigatório
  if (!system_id || typeof system_id !== 'string' || system_id.trim() === '') {
    return res.status(400).json({ error: 'Sistema é obrigatório. Selecione um sistema de RPG.' });
  }

  // Lacuna 3: Frequência obrigatória para mesas em andamento (type === 'campanha' ou 'oneshot-serie')
  if ((type === 'campanha' || type === 'oneshot-serie') && !frequency) {
    return res.status(400).json({ error: 'Frequência é obrigatória para campanhas e one-shots em série.' });
  }

  // CORREÇÃO DT-01, DT-02: Validar slots_total e slots_open
  const parsedSlotsTotal = Number(slots_total);
  const parsedSlotsOpen = Number(slots_open);
  
  if (slots_total !== undefined && (isNaN(parsedSlotsTotal) || parsedSlotsTotal < 1 || parsedSlotsTotal > 100)) {
    return res.status(400).json({ error: 'Vagas totais deve ser um número entre 1 e 100.' });
  }
  
  if (slots_open !== undefined && (isNaN(parsedSlotsOpen) || parsedSlotsOpen < 0)) {
    return res.status(400).json({ error: 'Vagas abertas deve ser um número maior ou igual a zero.' });
  }
  
  if (slots_open !== undefined && slots_total !== undefined && parsedSlotsOpen > parsedSlotsTotal) {
    return res.status(400).json({ error: 'Vagas abertas não pode ser maior que vagas totais.' });
  }

  const safePublisherRole = sanitizePublisherRole(publisher_role);
  const safeActualGmName = sanitizeOptionalText(actual_gm_name);
  const contactsPayload = sanitizeContactsPayload(contacts);

  if (contactsPayload.error) {
    return res.status(400).json({ error: contactsPayload.error });
  }

  if (contactsPayload.contacts.length === 0) {
    return res.status(400).json({ error: 'Informe ao menos um canal de contato para recrutamento.' });
  }

  if (safePublisherRole === 'announcer' && !safeActualGmName) {
    return res.status(400).json({ error: 'Quando for anunciante, informe o nome do mestre real.' });
  }

  // Validação de frequência
  const safeFrequency = frequency && ['semanal', 'quinzenal', 'mensal', 'outros'].includes(frequency) ? frequency : null;
  const safeFrequencyCustom = sanitizeOptionalText(frequency_custom);
  
  if (safeFrequency === 'outros' && !safeFrequencyCustom) {
    return res.status(400).json({ error: 'Quando frequência for "Outros", informe a descrição customizada.' });
  }

  // VTT Platform (Migration 006): Sanitizar e validar
  const safeVttPlatformId = vtt_platform_id && typeof vtt_platform_id === 'string' ? vtt_platform_id.trim() : null;
  const safeGamePlatformCustom = sanitizeOptionalText(game_platform_custom);
  
  // CORREÇÃO D01-D02 + G01: Buscar UUID pelo slug e validar com try/catch
  let vttPlatformUuid: string | null = null;
  if (safeVttPlatformId && safeVttPlatformId !== 'custom') {
    try {
      const vttPlatform = await db
        .selectFrom('vtt_platforms')
        .select(['id', 'slug'])
        .where('slug', '=', safeVttPlatformId)
        .where('is_active', '=', true)
        .executeTakeFirst();
      
      if (!vttPlatform) {
        return res.status(400).json({ error: 'Plataforma VTT inválida.' });
      }
      
      vttPlatformUuid = vttPlatform.id;
    } catch (error) {
      // CORREÇÃO G01: Tratar erro de banco de dados
      console.error('[gmPanel] Erro ao validar VTT:', error);
      return res.status(500).json({ 
        error: 'Erro ao validar plataforma VTT. Tente novamente em alguns instantes.' 
      });
    }
  }
  
  // CORREÇÃO D06: Validar campo customizado obrigatório
  if (safeVttPlatformId === 'custom' && !safeGamePlatformCustom) {
    return res.status(400).json({ error: 'Quando selecionar "Personalizado", informe o nome da plataforma.' });
  }
  
  // CORREÇÃO G06: Validar modalidade se VTT preenchida
  if ((vttPlatformUuid || safeGamePlatformCustom) && modality !== 'online' && modality !== 'hibrida') {
    return res.status(400).json({ 
      error: 'Plataforma VTT só pode ser selecionada para mesas online ou híbridas.' 
    });
  }

  const safeCommunicationPlatform = sanitizeOptionalText(communication_platform);

  const safeRulesNotes = sanitizeOptionalText(rules_notes);
  const safeBannerUrl = sanitizeOptionalText(banner_url);

  const safeIsDdal = parseOptionalBoolean(is_ddal) ?? false;
  
  // CORREÇÃO B03: Validar role admin para is_covil
  const userRole = (req as any).user?.role;
  const safeIsCovil = (userRole === 'admin' && parseOptionalBoolean(is_covil)) ? true : false;
  
  const safeDdalCode = sanitizeOptionalText(ddal_code);
  const safeDdalName = sanitizeOptionalText(ddal_name);
  const safeDdalTier = sanitizeOptionalTier(ddal_tier);
  const safeDdalSeason = sanitizeOptionalText(ddal_season);
  const safeDdalDuration = sanitizeOptionalText(ddal_duration);
  const safeDdalFormat = sanitizeOptionalText(ddal_format);
  const safeDdalOrgCode = sanitizeOptionalText(ddal_org_code);
  const safeDdalSetting = sanitizeOptionalText(ddal_setting);
  const safeDdalRulesNotes = sanitizeOptionalText(ddal_rules_notes);

  // CORREÇÃO: Sanitizar campos avançados (REQ-26)
  const safeMasterDisplayName = sanitizeOptionalText(master_display_name);
  const safeCampaignLength = sanitizeOptionalText(campaign_length);
  const safeLevelRange = sanitizeOptionalText(level_range);
  const safeBillingText = sanitizeOptionalText(billing_text);
  const safeSessionZeroFree = parseOptionalBoolean(session_zero_free) ?? false;
  const safeSynopsis = sanitizeOptionalText(synopsis);
  const safeStyleText = sanitizeOptionalText(style_text);
  const safeListingExcerpt = sanitizeOptionalText(listing_excerpt);
  const safeTechnicalRequirements = sanitizeOptionalText(technical_requirements);
  const safeRequiresPc = parseOptionalBoolean(requires_pc) ?? false;
  const safeRequiresCamera = parseOptionalBoolean(requires_camera) ?? false;
  const safeRequiresMicrophone = parseOptionalBoolean(requires_microphone) ?? false;

  // Sanitizar campos de cenário e estilos (REQ-28)
  const safeSettingName = sanitizeOptionalText(req.body.setting_name);
  const safeSettingStyles = sanitizeStringArray(req.body.setting_styles);

  // REQ-28 Fase 6: Sanitizar campos editoriais separados
  const safeSynopsisNarrative = sanitizeOptionalText(req.body.synopsis_narrative);
  const safeBenefitsText = sanitizeOptionalText(req.body.benefits_text);
  const safeTableGmBio = sanitizeOptionalText(req.body.table_gm_bio);

  // CORREÇÃO E128: Validar price_value quando price_type for 'paga'
  const safePriceType = price_type ?? 'gratuita';
  if (safePriceType === 'paga') {
    const parsedPriceValue = Number(price_value);
    if (!price_value || isNaN(parsedPriceValue) || parsedPriceValue <= 0) {
      return res.status(400).json({ error: 'Para mesas pagas, informe um valor válido maior que zero.' });
    }
  }

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

    const safeWarnings = Array.isArray(content_warnings) ? content_warnings.filter((v) => typeof v === 'string') : [];
    const safeSafetyTools = Array.isArray(safety_tools) ? safety_tools.filter((v) => typeof v === 'string') : [];

    const newTable = await db.transaction().execute(async (trx) => {
      const [insertedTable] = await trx
        .insertInto('tables')
        .values({
          slug,
          gm_id: gmProfile.id,
          system_id: system_id ?? null,
          scenario_id: req.body.scenario_id ?? null, // CORREÇÃO REG-02: Persistir cenário selecionado
          title,
          description: description ?? null,
          type,
          audience: audience ?? 'livre',
          modality,
          price_type: safePriceType,
          price_value: price_value ?? null,
          price_frequency: price_frequency ?? null,
          slots_total: slots_total ?? 4,
          slots_open: slots_open ?? (slots_total ?? 4), // REQ-02: Default = total de vagas
          language: language ?? 'Português',
          experience_level: experience_level ?? 'todos',
          starts_at: starts_at ? new Date(starts_at) : null,
          city: city ?? null,
          state: state ?? null,
          content_warnings: safeWarnings,
          safety_tools: safeSafetyTools,
          publisher_role: safePublisherRole,
          actual_gm_name: safePublisherRole === 'announcer' ? safeActualGmName : null,
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
          frequency: safeFrequency,
          frequency_custom: safeFrequency === 'outros' ? safeFrequencyCustom : null,
          // VTT Platform (Migration 006) - CORREÇÃO D02: Persistir UUID, não slug
          vtt_platform_id: vttPlatformUuid, // UUID ou null
          game_platform_custom: safeVttPlatformId === 'custom' ? safeGamePlatformCustom : null,
          communication_platform: safeCommunicationPlatform,
          rules_notes: safeRulesNotes,
          banner_url: safeBannerUrl,
          is_covil: safeIsCovil,
          // CORREÇÃO: Persistir campos avançados (REQ-26)
          master_display_name: safeMasterDisplayName,
          campaign_length: safeCampaignLength,
          level_range: safeLevelRange,
          billing_text: safeBillingText,
          session_zero_free: safeSessionZeroFree,
          synopsis: safeSynopsis,
          style_text: safeStyleText,
          listing_excerpt: safeListingExcerpt,
          technical_requirements: safeTechnicalRequirements,
          requires_pc: safeRequiresPc,
          requires_camera: safeRequiresCamera,
          requires_microphone: safeRequiresMicrophone,
          // Campos de cenário e estilos (REQ-28)
          setting_name: safeSettingName,
          setting_styles: safeSettingStyles.length > 0 ? safeSettingStyles : null,
          // REQ-28 Fase 6: Campos editoriais separados
          synopsis_narrative: safeSynopsisNarrative,
          benefits_text: safeBenefitsText,
          table_gm_bio: safeTableGmBio,
          status: 'active',
        })
        .returning([
          'id',
          'slug',
          'title',
          'status',
          'publisher_role',
          'actual_gm_name',
          'is_ddal',
          'is_covil', // CORREÇÃO A03: Retornar flag Covil do Lich
          'ddal_code',
          'ddal_name',
          'ddal_tier',
          'created_at',
        ])
        .execute();

      await trx
        .insertInto('table_contacts')
        .values(
          contactsPayload.contacts.map((contact) => ({
            table_id: insertedTable.id,
            channel: contact.channel,
            value: contact.value,
            label: contact.label,
            discord_server_url: contact.discord_server_url,
            sort_order: contact.sort_order,
          }))
        )
        .execute();

      // CORREÇÃO REG-03: Validar e persistir schedules
      if (schedules && Array.isArray(schedules) && schedules.length > 0) {
        // CORREÇÃO DT-07: Validar enum de day_of_week
        const VALID_DAYS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
        
        // Validar estrutura de cada schedule
        const validSchedules = schedules.filter((s: any) => {
          if (!s.day_of_week || !s.start_time || !s.frequency) {
            console.warn('[POST /gm/tables] Schedule inválido ignorado:', s);
            return false;
          }
          // CORREÇÃO DT-07: Validar se day_of_week é válido
          if (!VALID_DAYS.includes(s.day_of_week)) {
            console.warn('[POST /gm/tables] day_of_week inválido:', s.day_of_week);
            return false;
          }
          return true;
        });

        if (validSchedules.length === 0) {
          throw new Error('Nenhum horário válido foi fornecido. Verifique os campos obrigatórios: dia da semana, horário inicial e frequência.');
        }

        await trx
          .insertInto('table_schedules')
          .values(
            validSchedules.map((schedule: any, index: number) => ({
              table_id: insertedTable.id,
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time || null,
              frequency: schedule.frequency,
              slots_per_session: schedule.slots_per_session || null,
              is_ongoing: schedule.is_ongoing ?? false,
              notes: schedule.notes || null,
              sort_order: schedule.sort_order ?? index,
            }))
          )
          .execute();
      }

      return {
        ...insertedTable,
        contacts: contactsPayload.contacts,
      };
    });

    return res.status(201).json({ data: newTable });
  } catch (error: any) {
    console.error('[POST /gm/tables] Erro ao criar mesa:', JSON.stringify({
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
      stack: error.stack,
    }, null, 2));
    
    // Retornar erro mais específico quando possível
    if (error.code === '23502') {
      return res.status(400).json({ 
        error: `Campo obrigatório ausente: ${error.column || 'desconhecido'}` 
      });
    }
    
    if (error.code === '23503') {
      // CORREÇÃO G02: Mensagem específica para FK de VTT
      if (error.constraint?.includes('vtt_platform')) {
        return res.status(400).json({ 
          error: 'A plataforma VTT selecionada não está mais disponível. Recarregue a página e tente novamente.' 
        });
      }
      return res.status(400).json({ 
        error: `Referência inválida: ${error.detail || 'verifique os dados enviados'}` 
      });
    }
    
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: `Valor duplicado: ${error.detail || 'já existe'}` 
      });
    }
    
    if (error.code === '22P02') {
      return res.status(400).json({ 
        error: `Tipo de dado inválido: ${error.message}` 
      });
    }
    
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
    scenario_id, // CORREÇÃO DT-003: Adicionar scenario_id ao PUT
    type,
    audience,
    modality,
    price_type,
    price_value,
    price_frequency,
    slots_total,
    slots_filled,
    slots_open, // REQ-02: Vagas abertas para recrutamento
    language,
    experience_level,
    starts_at,
    city,
    state,
    content_warnings,
    safety_tools,
    publisher_role,
    actual_gm_name,
    contacts,
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
    // CORREÇÃO DT-004: Adicionar frequency ao PUT
    frequency,
    frequency_custom,
    // CORREÇÃO DT-001: Adicionar vtt_platform_id ao PUT
    vtt_platform_id,
    game_platform_custom,
    communication_platform,
    // CORREÇÃO: Adicionar campos avançados (REQ-26)
    master_display_name,
    campaign_length,
    level_range,
    billing_text,
    session_zero_free,
    synopsis,
    style_text,
    listing_excerpt,
    technical_requirements,
    requires_pc,
    requires_camera,
    requires_microphone,
    // CORREÇÃO: Adicionar schedules (REQ-27)
    schedules,
    // CORREÇÃO C7-A: Adicionar campos editoriais Fase 6 (REQ-28)
    synopsis_narrative,
    benefits_text,
    table_gm_bio,
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
      .select([
        'id',
        'gm_id',
        'system_id',
        'publisher_role',
        'actual_gm_name',
        'is_ddal',
        'ddal_code',
        'ddal_name',
        'ddal_tier',
        'ddal_season',
        'ddal_duration',
        'ddal_format',
        'ddal_org_code',
        'ddal_setting',
        'ddal_rules_notes',
      ])
      .where('id', '=', id)
      .where('gm_id', '=', gmProfile.id)
      .executeTakeFirst();

    if (!existingTable) {
      return res.status(404).json({ error: 'Mesa não encontrada ou sem permissão.' });
    }

    const safeWarnings = Array.isArray(content_warnings) ? content_warnings.filter((v) => typeof v === 'string') : undefined;
    const safeSafetyTools = Array.isArray(safety_tools) ? safety_tools.filter((v) => typeof v === 'string') : undefined;

    const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(req.body, key);

    const contactsPayload = hasOwn('contacts')
      ? sanitizeContactsPayload(contacts)
      : { contacts: [] as SanitizedTableContact[], error: null as string | null };

    if (contactsPayload.error) {
      return res.status(400).json({ error: contactsPayload.error });
    }

    if (hasOwn('contacts') && contactsPayload.contacts.length === 0) {
      return res.status(400).json({ error: 'Informe ao menos um canal de contato para recrutamento.' });
    }

    const nextPublisherRole = hasOwn('publisher_role')
      ? sanitizePublisherRole(publisher_role)
      : existingTable.publisher_role;

    const nextActualGmName = hasOwn('actual_gm_name')
      ? sanitizeOptionalText(actual_gm_name)
      : existingTable.actual_gm_name;

    if (nextPublisherRole === 'announcer' && !nextActualGmName) {
      return res.status(400).json({ error: 'Quando for anunciante, informe o nome do mestre real.' });
    }

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

    // CORREÇÃO DT-04: Validar slots_total e slots_open na edição
    if (hasOwn('slots_total') || hasOwn('slots_open')) {
      const parsedSlotsTotal = slots_total !== undefined ? Number(slots_total) : undefined;
      const parsedSlotsOpen = slots_open !== undefined ? Number(slots_open) : undefined;
      
      if (parsedSlotsTotal !== undefined && (isNaN(parsedSlotsTotal) || parsedSlotsTotal < 1 || parsedSlotsTotal > 100)) {
        return res.status(400).json({ error: 'Vagas totais deve ser um número entre 1 e 100.' });
      }
      
      if (parsedSlotsOpen !== undefined && (isNaN(parsedSlotsOpen) || parsedSlotsOpen < 0)) {
        return res.status(400).json({ error: 'Vagas abertas deve ser um número maior ou igual a zero.' });
      }
      
      // Validar relação entre slots_open e slots_total
      const finalSlotsTotal = parsedSlotsTotal ?? (await db.selectFrom('tables').select('slots_total').where('id', '=', id).executeTakeFirst())?.slots_total ?? 4;
      const finalSlotsOpen = parsedSlotsOpen ?? (await db.selectFrom('tables').select('slots_open').where('id', '=', id).executeTakeFirst())?.slots_open ?? finalSlotsTotal;
      
      if (parsedSlotsOpen !== undefined && parsedSlotsOpen > finalSlotsTotal) {
        return res.status(400).json({ error: 'Vagas abertas não pode ser maior que vagas totais.' });
      }
      
      if (parsedSlotsTotal !== undefined && finalSlotsOpen > parsedSlotsTotal) {
        return res.status(400).json({ error: 'Vagas totais não pode ser menor que vagas abertas atuais.' });
      }
    }

    const updated = await db.transaction().execute(async (trx) => {
      const [updatedTable] = await trx
        .updateTable('tables')
        .set({
          title: title ?? undefined,
          description: description ?? undefined,
          system_id: hasOwn('system_id') ? (system_id ?? null) : undefined,
          scenario_id: hasOwn('scenario_id') ? (scenario_id ?? null) : undefined, // CORREÇÃO DT-003
          type: type ?? undefined,
          audience: audience ?? undefined,
          modality: modality ?? undefined,
          price_type: price_type ?? undefined,
          price_value: price_value ?? undefined,
          price_frequency: price_frequency ?? undefined,
          slots_total: slots_total ?? undefined,
          slots_filled: slots_filled ?? undefined,
          slots_open: slots_open ?? undefined, // REQ-02: Vagas abertas para recrutamento
          language: language ?? undefined,
          experience_level: experience_level ?? undefined,
          starts_at: starts_at ? new Date(starts_at) : undefined,
          city: city ?? undefined,
          state: state ?? undefined,
          content_warnings: safeWarnings,
          safety_tools: safeSafetyTools,
          publisher_role: nextPublisherRole,
          actual_gm_name: nextPublisherRole === 'announcer' ? nextActualGmName : null,
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
          // CORREÇÃO DT-004: Adicionar frequency ao update
          frequency: hasOwn('frequency') ? (frequency ?? null) : undefined,
          frequency_custom: hasOwn('frequency_custom') ? (frequency_custom ?? null) : undefined,
          // CORREÇÃO DT-001: Adicionar vtt_platform_id ao update
          vtt_platform_id: hasOwn('vtt_platform_id') ? (vtt_platform_id ?? null) : undefined,
          game_platform_custom: hasOwn('game_platform_custom') ? sanitizeOptionalText(game_platform_custom) : undefined,
          communication_platform: hasOwn('communication_platform') ? sanitizeOptionalText(communication_platform) : undefined,
          // CORREÇÃO: Persistir campos avançados (REQ-26)
          master_display_name: hasOwn('master_display_name') ? sanitizeOptionalText(master_display_name) : undefined,
          campaign_length: hasOwn('campaign_length') ? sanitizeOptionalText(campaign_length) : undefined,
          level_range: hasOwn('level_range') ? sanitizeOptionalText(level_range) : undefined,
          billing_text: hasOwn('billing_text') ? sanitizeOptionalText(billing_text) : undefined,
          session_zero_free: hasOwn('session_zero_free') ? (parseOptionalBoolean(session_zero_free) ?? false) : undefined,
          synopsis: hasOwn('synopsis') ? sanitizeOptionalText(synopsis) : undefined,
          style_text: hasOwn('style_text') ? sanitizeOptionalText(style_text) : undefined,
          listing_excerpt: hasOwn('listing_excerpt') ? sanitizeOptionalText(listing_excerpt) : undefined,
          technical_requirements: hasOwn('technical_requirements') ? sanitizeOptionalText(technical_requirements) : undefined,
          requires_pc: hasOwn('requires_pc') ? (parseOptionalBoolean(requires_pc) ?? false) : undefined,
          requires_camera: hasOwn('requires_camera') ? (parseOptionalBoolean(requires_camera) ?? false) : undefined,
          requires_microphone: hasOwn('requires_microphone') ? (parseOptionalBoolean(requires_microphone) ?? false) : undefined,
          // Campos de cenário e estilos (REQ-28)
          setting_name: hasOwn('setting_name') ? sanitizeOptionalText(req.body.setting_name) : undefined,
          // CORREÇÃO DT-05: Evitar duplicação de sanitizeStringArray
          setting_styles: hasOwn('setting_styles') ? (() => {
            const sanitized = sanitizeStringArray(req.body.setting_styles);
            return sanitized.length > 0 ? sanitized : null;
          })() : undefined,
          // CORREÇÃO C7-A: Persistir campos editoriais Fase 6 (REQ-28)
          synopsis_narrative: hasOwn('synopsis_narrative') ? sanitizeOptionalText(synopsis_narrative) : undefined,
          benefits_text: hasOwn('benefits_text') ? sanitizeOptionalText(benefits_text) : undefined,
          table_gm_bio: hasOwn('table_gm_bio') ? sanitizeOptionalText(table_gm_bio) : undefined,
        })
        .where('id', '=', id)
        .where('gm_id', '=', gmProfile.id)
        .returning([
          'id',
          'slug',
          'title',
          'status',
          'publisher_role',
          'actual_gm_name',
          'is_ddal',
          'ddal_code',
          'ddal_name',
          'ddal_tier',
          'updated_at',
        ])
        .execute();

      if (!updatedTable) {
        return null;
      }

      if (hasOwn('contacts')) {
        await trx
          .deleteFrom('table_contacts')
          .where('table_id', '=', updatedTable.id)
          .execute();

        if (contactsPayload.contacts.length > 0) {
          await trx
            .insertInto('table_contacts')
            .values(
              contactsPayload.contacts.map((contact) => ({
                table_id: updatedTable.id,
                channel: contact.channel,
                value: contact.value,
                label: contact.label,
                discord_server_url: contact.discord_server_url,
                sort_order: contact.sort_order,
              }))
            )
            .execute();
        }
      }

      // CORREÇÃO #11: Atualizar schedules (REQ-27) se fornecidos
      if (hasOwn('schedules')) {
        // Deletar schedules existentes
        await trx
          .deleteFrom('table_schedules')
          .where('table_id', '=', updatedTable.id)
          .execute();

        // CORREÇÃO #12: Validar e inserir novos schedules
        if (schedules && Array.isArray(schedules) && schedules.length > 0) {
          await trx
            .insertInto('table_schedules')
            .values(
              schedules.map((schedule: any, index: number) => ({
                table_id: updatedTable.id,
                day_of_week: schedule.day_of_week,
                start_time: schedule.start_time,
                end_time: schedule.end_time || null,
                frequency: schedule.frequency,
                slots_per_session: schedule.slots_per_session || null,
                is_ongoing: schedule.is_ongoing ?? false,
                notes: schedule.notes || null,
                sort_order: index,
              }))
            )
            .execute();
        }
      }

      const finalContacts = await trx
        .selectFrom('table_contacts')
        .select(['channel', 'value', 'label', 'discord_server_url', 'sort_order'])
        .where('table_id', '=', updatedTable.id)
        .orderBy('sort_order', 'asc')
        .execute();

      return {
        ...updatedTable,
        contacts: finalContacts,
      };
    });

    if (!updated) {
      return res.status(404).json({ error: 'Mesa não encontrada ou sem permissão.' });
    }

    return res.json({ data: updated });
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
      .leftJoin('table_metrics as tm', 'tm.table_id', 't.id')
      .select([
        't.id',
        't.slug',
        't.title',
        't.description',
        't.banner_url as image_url', // Para dashboard de métricas
        't.status',
        't.modality',
        't.system_id',
        't.type',
        't.audience',
        't.price_type',
        't.price_value',
        't.price_frequency',
        't.slots_total',
        't.slots_filled',
        't.slots_open', // CORREÇÃO DT-005: Adicionar vagas abertas ao painel
        't.language',
        't.experience_level',
        't.starts_at',
        't.city',
        't.state',
        't.content_warnings',
        't.safety_tools',
        't.publisher_role',
        't.actual_gm_name',
        't.is_ddal',
        't.ddal_code',
        't.ddal_name',
        't.ddal_tier',
        't.created_at',
        't.updated_at',
        // CORREÇÃO #13: Retornar campos avançados (REQ-26)
        't.master_display_name',
        't.campaign_length',
        't.level_range',
        't.billing_text',
        't.session_zero_free',
        't.synopsis',
        't.style_text',
        't.listing_excerpt',
        't.technical_requirements',
        't.requires_pc',
        't.requires_camera',
        't.requires_microphone',
        // CORREÇÃO DT-18: Retornar campos de cenário e estilos (REQ-28)
        't.setting_name',
        't.setting_styles',
        // CORREÇÃO DT-006: Retornar campos editoriais Fase 6 (REQ-28)
        't.synopsis_narrative',
        't.benefits_text',
        't.table_gm_bio',
        // CORREÇÃO DT-004: Retornar frequency para edição
        't.frequency',
        't.frequency_custom',
        // CORREÇÃO DT-001: Retornar vtt_platform_id para edição
        't.vtt_platform_id',
        't.game_platform_custom',
        't.communication_platform',
        's.name as system_name',
        // Métricas de engajamento
        sql<number>`COALESCE(tm.views_count, 0)`.as('metrics_views'),
        sql<number>`COALESCE(tm.clicks_count, 0)`.as('metrics_clicks'),
        sql<number>`COALESCE(tm.contacts_count, 0)`.as('metrics_contacts'),
        sql<number>`COALESCE(tm.favorites_count, 0)`.as('metrics_favorites'),
      ])
      .where('t.gm_id', '=', gmProfile.id)
      .orderBy('t.created_at', 'desc')
      .execute();

    if (tables.length === 0) {
      return res.json({ data: [] });
    }

    const tableIds = tables.map((table) => table.id);

    const contacts = await db
      .selectFrom('table_contacts')
      .select(['table_id', 'channel', 'value', 'label', 'discord_server_url', 'sort_order'])
      .where('table_id', 'in', tableIds)
      .orderBy('sort_order', 'asc')
      .execute();

    const contactsByTable = new Map<string, Array<{
      channel: ContactChannel;
      value: string;
      label: string | null;
      discord_server_url: string | null;
      sort_order: number;
    }>>();

    for (const contact of contacts) {
      if (!contactsByTable.has(contact.table_id)) {
        contactsByTable.set(contact.table_id, []);
      }

      contactsByTable.get(contact.table_id)!.push({
        channel: contact.channel as ContactChannel,
        value: contact.value,
        label: contact.label,
        discord_server_url: contact.discord_server_url,
        sort_order: contact.sort_order,
      });
    }

    // CORREÇÃO #13: Buscar schedules (REQ-27)
    const schedules = await db
      .selectFrom('table_schedules')
      .selectAll()
      .where('table_id', 'in', tableIds)
      .orderBy('sort_order', 'asc')
      .execute();

    const schedulesByTable = new Map<string, Array<any>>();
    for (const schedule of schedules) {
      if (!schedulesByTable.has(schedule.table_id)) {
        schedulesByTable.set(schedule.table_id, []);
      }
      schedulesByTable.get(schedule.table_id)!.push(schedule);
    }

    const tablesWithContactsAndSchedules = tables.map((table) => ({
      ...table,
      contacts: contactsByTable.get(table.id) ?? [],
      schedules: schedulesByTable.get(table.id) ?? [],
    }));

    return res.json({ data: tablesWithContactsAndSchedules });
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




// DELETE /api/v1/gm/tables/:id — Deleta mesa própria
router.delete('/tables/:id', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;

  try {
    const gmProfile = await db
      .selectFrom('gm_profiles')
      .select('id')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!gmProfile) {
      return res.status(403).json({ error: 'Perfil de mestre não encontrado.' });
    }

    // Verificar se mesa existe e pertence ao GM
    const existingTable = await db
      .selectFrom('tables')
      .select(['id', 'title', 'gm_id', 'origin'])
      .where('id', '=', id)
      .where('gm_id', '=', gmProfile.id)
      .executeTakeFirst();

    if (!existingTable) {
      return res.status(404).json({ error: 'Mesa não encontrada ou sem permissão.' });
    }

    // Deletar em transação (schedules, contacts, depois table)
    await db.transaction().execute(async (trx) => {
      // Deletar schedules
      await trx
        .deleteFrom('table_schedules')
        .where('table_id', '=', id)
        .execute();

      // Deletar contatos
      await trx
        .deleteFrom('table_contacts')
        .where('table_id', '=', id)
        .execute();

      // Deletar mesa
      await trx
        .deleteFrom('tables')
        .where('id', '=', id)
        .execute();
    });

    return res.json({ 
      data: { 
        message: `Mesa "${existingTable.title}" deletada com sucesso.` 
      } 
    });
  } catch (error: any) {
    console.error('[DELETE /gm/tables/:id]', error);
    return res.status(500).json({ error: 'Erro ao deletar mesa.' });
  }
});

// =============================================================================
// ROTAS ADMINISTRATIVAS (CRUD)
// =============================================================================

// PUT /api/v1/admin/tables/:id — Editar qualquer mesa (admin)
router.put('/admin/tables/:id', authMiddleware, async (req: Request, res: Response) => {
  const userRole = (req as any).user.role;
  
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }

  const { id } = req.params;
  const {
    title,
    description,
    system_id,
    scenario_id,
    type,
    audience,
    age_rating,
    modality,
    game_platform,
    communication_platform,
    price_type,
    price_value,
    price_frequency,
    slots_total,
    slots_filled,
    language,
    experience_level,
    table_level,
    starts_at,
    city,
    state,
    content_warnings,
    safety_tools,
    status,
    frequency,
    frequency_custom,
    rules_notes,
    banner_url,
    // CORREÇÃO B06: Campos REQ-26/28 estavam ausentes no admin PUT — zerados silenciosamente
    master_display_name,
    campaign_length,
    level_range,
    billing_text,
    session_zero_free,
    synopsis,
    style_text,
    listing_excerpt,
    technical_requirements,
    requires_pc,
    requires_camera,
    requires_microphone,
    setting_name,
    setting_styles,
    synopsis_narrative,
    benefits_text,
    table_gm_bio,
    // REQ-21: Novos campos
    custom_scenario,
    style_tags,
    // REQ-05: Flag Covil do Lich (admin only)
    is_covil,
  } = req.body;

  try {
    // Verificar se mesa existe
    const existing = await db
      .selectFrom('tables')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({ error: 'Mesa não encontrada.' });
    }

    // Verificar se system_id existe (se fornecido)
    if (system_id) {
      const systemExists = await db
        .selectFrom('systems')
        .select('id')
        .where('id', '=', system_id)
        .executeTakeFirst();

      if (!systemExists) {
        return res.status(404).json({ error: 'Sistema não encontrado.' });
      }
    }

    // Verificar se scenario_id existe (se fornecido)
    if (scenario_id) {
      const scenarioExists = await db
        .selectFrom('scenarios')
        .select('id')
        .where('id', '=', scenario_id)
        .executeTakeFirst();

      if (!scenarioExists) {
        return res.status(404).json({ error: 'Cenário não encontrado.' });
      }
    }

    const safeWarnings = Array.isArray(content_warnings) ? content_warnings.filter((v) => typeof v === 'string') : undefined;
    const safeSafetyTools = Array.isArray(safety_tools) ? safety_tools.filter((v) => typeof v === 'string') : undefined;

    const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(req.body, key);

    const updated = await db
      .updateTable('tables')
      .set({
        title: title ?? undefined,
        description: hasOwn('description') ? (description ?? null) : undefined,
        system_id: hasOwn('system_id') ? (system_id ?? null) : undefined,
        scenario_id: hasOwn('scenario_id') ? (scenario_id ?? null) : undefined,
        type: type ?? undefined,
        audience: audience ?? undefined,
        age_rating: age_rating ?? undefined,
        modality: modality ?? undefined,
        game_platform: hasOwn('game_platform') ? sanitizeOptionalText(game_platform) : undefined,
        communication_platform: hasOwn('communication_platform') ? sanitizeOptionalText(communication_platform) : undefined,
        price_type: price_type ?? undefined,
        price_value: hasOwn('price_value') ? (price_value ?? null) : undefined,
        price_frequency: hasOwn('price_frequency') ? (price_frequency ?? null) : undefined,
        slots_total: slots_total ?? undefined,
        slots_filled: slots_filled ?? undefined,
        language: language ?? undefined,
        experience_level: experience_level ?? undefined,
        table_level: table_level ?? undefined,
        starts_at: hasOwn('starts_at') ? (starts_at ? new Date(starts_at) : null) : undefined,
        city: hasOwn('city') ? (city ?? null) : undefined,
        state: hasOwn('state') ? (state ?? null) : undefined,
        content_warnings: safeWarnings,
        safety_tools: safeSafetyTools,
        status: status ?? undefined,
        frequency: hasOwn('frequency') ? (frequency ?? null) : undefined,
        frequency_custom: hasOwn('frequency_custom') ? (frequency_custom ?? null) : undefined,
        rules_notes: hasOwn('rules_notes') ? (rules_notes ?? null) : undefined,
        banner_url: hasOwn('banner_url') ? (banner_url ?? null) : undefined,
        // CORREÇÃO B06: Persistir campos REQ-26/28
        master_display_name: hasOwn('master_display_name') ? sanitizeOptionalText(master_display_name) : undefined,
        campaign_length: hasOwn('campaign_length') ? sanitizeOptionalText(campaign_length) : undefined,
        level_range: hasOwn('level_range') ? sanitizeOptionalText(level_range) : undefined,
        billing_text: hasOwn('billing_text') ? sanitizeOptionalText(billing_text) : undefined,
        session_zero_free: hasOwn('session_zero_free') ? (parseOptionalBoolean(session_zero_free) ?? false) : undefined,
        synopsis: hasOwn('synopsis') ? sanitizeOptionalText(synopsis) : undefined,
        style_text: hasOwn('style_text') ? sanitizeOptionalText(style_text) : undefined,
        listing_excerpt: hasOwn('listing_excerpt') ? sanitizeOptionalText(listing_excerpt) : undefined,
        technical_requirements: hasOwn('technical_requirements') ? sanitizeOptionalText(technical_requirements) : undefined,
        requires_pc: hasOwn('requires_pc') ? (parseOptionalBoolean(requires_pc) ?? false) : undefined,
        requires_camera: hasOwn('requires_camera') ? (parseOptionalBoolean(requires_camera) ?? false) : undefined,
        requires_microphone: hasOwn('requires_microphone') ? (parseOptionalBoolean(requires_microphone) ?? false) : undefined,
        setting_name: hasOwn('setting_name') ? sanitizeOptionalText(setting_name) : undefined,
        setting_styles: hasOwn('setting_styles') ? (() => {
          const sanitized = sanitizeStringArray(setting_styles);
          return sanitized.length > 0 ? sanitized : null;
        })() : undefined,
        synopsis_narrative: hasOwn('synopsis_narrative') ? sanitizeOptionalText(synopsis_narrative) : undefined,
        benefits_text: hasOwn('benefits_text') ? sanitizeOptionalText(benefits_text) : undefined,
        table_gm_bio: hasOwn('table_gm_bio') ? sanitizeOptionalText(table_gm_bio) : undefined,
        // REQ-21: Novos campos
        custom_scenario: hasOwn('custom_scenario') ? sanitizeOptionalText(custom_scenario) : undefined,
        style_tags: hasOwn('style_tags') ? (() => {
          const sanitized = sanitizeStringArray(style_tags);
          return sanitized.length > 0 ? sanitized : null;
        })() : undefined,
        // REQ-05: Flag Covil do Lich (admin only)
        // CORREÇÃO B03: Validar role admin para is_covil
        is_covil: hasOwn('is_covil') ? ((req as any).user?.role === 'admin' && parseOptionalBoolean(is_covil) ? true : false) : undefined,
      })
      .where('id', '=', id)
      .returning([
        'id',
        'slug',
        'title',
        'description',
        'system_id',
        'scenario_id',
        'status',
        'updated_at',
      ])
      .executeTakeFirst();

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PUT /admin/tables/:id]', error);
    return res.status(500).json({ error: 'Erro ao atualizar mesa.' });
  }
});

// DELETE /api/v1/admin/tables/:id — Deletar qualquer mesa (admin)
router.delete('/admin/tables/:id', authMiddleware, async (req: Request, res: Response) => {
  const userRole = (req as any).user.role;
  
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }

  const { id } = req.params;

  try {
    // Verificar se mesa existe
    const existing = await db
      .selectFrom('tables')
      .select(['id', 'title'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({ error: 'Mesa não encontrada.' });
    }

    // Deletar em transação (contacts primeiro, depois table)
    await db.transaction().execute(async (trx) => {
      // CORREÇÃO A10: Deletar schedules antes de contacts
      await trx
        .deleteFrom('table_schedules')
        .where('table_id', '=', id)
        .execute();

      // Deletar contatos
      await trx
        .deleteFrom('table_contacts')
        .where('table_id', '=', id)
        .execute();

      // Deletar mesa
      await trx
        .deleteFrom('tables')
        .where('id', '=', id)
        .execute();
    });

    return res.json({ data: { message: `Mesa "${existing.title}" deletada com sucesso.` } });
  } catch (error: any) {
    console.error('[DELETE /admin/tables/:id]', error);
    return res.status(500).json({ error: 'Erro ao deletar mesa.' });
  }
});

// =============================================================================
// TRACKING DE MÉTRICAS
// =============================================================================

/**
 * POST /api/v1/tables/:slug/view
 * Incrementa contador de visualizações (público, sem auth)
 * CORREÇÃO DT-10: Alterado de :id para :slug
 * PROTEÇÃO: Throttle de 15 minutos por IP+User-Agent
 */
router.post('/tables/:slug/view', async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    // CORREÇÃO DT-10: Buscar table_id pelo slug
    const table = await db
      .selectFrom('tables')
      .select('id')
      .where('slug', '=', slug)
      .executeTakeFirst();

    if (!table) {
      return res.sendStatus(404);
    }

    const fingerprint = generateFingerprint(req);
    const shouldCount = await shouldCountMetric(table.id, 'view', fingerprint);

    if (!shouldCount) {
      // Dentro da janela de throttle - não incrementar
      return res.sendStatus(202); // Accepted but not processed
    }

    // Registrar evento e incrementar métrica em transação
    await db.transaction().execute(async (trx) => {
      // Registrar evento para deduplicação
      await trx
        .insertInto('table_metric_events')
        .values({
          table_id: table.id,
          action: 'view',
          fingerprint_hash: fingerprint,
        })
        .execute();

      // Incrementar contador
      await trx
        .insertInto('table_metrics')
        .values({
          table_id: table.id,
          views_count: 1,
        })
        .onConflict((oc) =>
          oc.column('table_id').doUpdateSet({
            views_count: sql`table_metrics.views_count + 1`,
            updated_at: sql`NOW()`,
          })
        )
        .execute();
    });

    res.sendStatus(200);
  } catch (error: any) {
    console.error('[POST /tables/:slug/view]', error);
    res.sendStatus(500);
  }
});

/**
 * POST /api/v1/tables/:id/click
 * Incrementa contador de cliques (público, sem auth)
 * PROTEÇÃO: Throttle de 5 minutos por IP+User-Agent
 */
router.post('/tables/:id/click', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Validar que mesa existe
    const table = await db
      .selectFrom('tables')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!table) {
      return res.sendStatus(404);
    }

    const fingerprint = generateFingerprint(req);
    const shouldCount = await shouldCountMetric(id, 'click', fingerprint);

    if (!shouldCount) {
      return res.sendStatus(202);
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('table_metric_events')
        .values({
          table_id: id,
          action: 'click',
          fingerprint_hash: fingerprint,
        })
        .execute();

      await trx
        .insertInto('table_metrics')
        .values({
          table_id: id,
          clicks_count: 1,
        })
        .onConflict((oc) =>
          oc.column('table_id').doUpdateSet({
            clicks_count: sql`table_metrics.clicks_count + 1`,
            updated_at: sql`NOW()`,
          })
        )
        .execute();
    });

    res.sendStatus(200);
  } catch (error: any) {
    console.error('[POST /tables/:id/click]', error);
    res.sendStatus(500);
  }
});

/**
 * POST /api/v1/tables/:id/contact
 * Incrementa contador de contatos (público, sem auth)
 * PROTEÇÃO: Throttle de 30 minutos por IP+User-Agent
 */
router.post('/tables/:id/contact', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Validar que mesa existe
    const table = await db
      .selectFrom('tables')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!table) {
      return res.sendStatus(404);
    }

    const fingerprint = generateFingerprint(req);
    const shouldCount = await shouldCountMetric(id, 'contact', fingerprint);

    if (!shouldCount) {
      return res.sendStatus(202);
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('table_metric_events')
        .values({
          table_id: id,
          action: 'contact',
          fingerprint_hash: fingerprint,
        })
        .execute();

      await trx
        .insertInto('table_metrics')
        .values({
          table_id: id,
          contacts_count: 1,
        })
        .onConflict((oc) =>
          oc.column('table_id').doUpdateSet({
            contacts_count: sql`table_metrics.contacts_count + 1`,
            updated_at: sql`NOW()`,
          })
        )
        .execute();
    });

    res.sendStatus(200);
  } catch (error: any) {
    console.error('[POST /tables/:id/contact]', error);
    res.sendStatus(500);
  }
});

/**
 * POST /api/v1/tables/:id/favorite
 * Incrementa contador de favoritos (público, sem auth)
 * PROTEÇÃO: Throttle de 24 horas por IP+User-Agent
 */
router.post('/tables/:id/favorite', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Validar que mesa existe
    const table = await db
      .selectFrom('tables')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!table) {
      return res.sendStatus(404);
    }

    const fingerprint = generateFingerprint(req);
    const shouldCount = await shouldCountMetric(id, 'favorite', fingerprint);

    if (!shouldCount) {
      return res.sendStatus(202);
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('table_metric_events')
        .values({
          table_id: id,
          action: 'favorite',
          fingerprint_hash: fingerprint,
        })
        .execute();

      await trx
        .insertInto('table_metrics')
        .values({
          table_id: id,
          favorites_count: 1,
        })
        .onConflict((oc) =>
          oc.column('table_id').doUpdateSet({
            favorites_count: sql`table_metrics.favorites_count + 1`,
            updated_at: sql`NOW()`,
          })
        )
        .execute();
    });

    res.sendStatus(200);
  } catch (error: any) {
    console.error('[POST /tables/:id/favorite]', error);
    res.sendStatus(500);
  }
});

export default router;
