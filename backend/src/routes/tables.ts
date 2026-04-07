import { Router, Request, Response } from 'express';
import { sql } from 'kysely';
import { db } from '../db';

const router = Router();

type PublicTableContact = {
  channel: string;
  value: string;
  label: string | null;
  discord_server_url: string | null;
  sort_order: number;
};

// GET /api/v1/tables — Catálogo público, sem JWT
router.get('/', async (req: Request, res: Response) => {
  const {
    system,
    modality,
    type,
    audience,
    price_type,
    experience_level,
    state,
    city,
    featured,
    search,
    seal,
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
      .leftJoin('users as u', 'u.id', 'gm.user_id')
      .leftJoin('profiles as p', 'p.user_id', 'u.id')
      .leftJoin('systems as s', 's.id', 't.system_id')
      .select([
        't.id',
        't.slug',
        't.title',
        't.description',
        sql<string | null>`t.banner_url`.as('cover_url'),
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
        't.publisher_role',
        't.actual_gm_name',
        't.featured',
        't.created_at',
        't.is_ddal',
        't.ddal_code',
        't.ddal_name',
        't.ddal_tier',
        // CORREÇÃO DT-19: Retornar campos de cenário e estilos (REQ-28)
        't.setting_name',
        't.setting_styles',
        // CORREÇÃO DT-01: Retornar synopsis_narrative para cards
        't.synopsis_narrative',
        's.name as system_name',
        's.slug as system_slug',
        'gm.slug as gm_slug',
        'gm.avatar_url as gm_avatar_url',
        'gm.badges as gm_badges',
        sql<string>`COALESCE(gm.nickname, p.display_name)`.as('gm_display_name'),
      ])
      .where('t.status', '=', 'active')
      .orderBy('t.created_at', 'desc')
      .limit(limitNum)
      .offset(offset);

    if (system) query = query.where('s.slug', '=', system);
    if (modality) query = query.where('t.modality', '=', modality as any);
    if (type) query = query.where('t.type', '=', type as any);
    if (audience) query = query.where('t.audience', '=', audience as any);
    if (price_type) query = query.where('t.price_type', '=', price_type as any);
    if (experience_level) query = query.where('t.experience_level', '=', experience_level as any);
    if (featured === 'true') query = query.where('t.featured', '=', true);
    if (state) query = query.where('t.state', '=', state);
    if (city) query = query.where('t.city', 'ilike', `%${city}%`);

    if (seal === 'ddal') {
      query = query.where('t.is_ddal', '=', true);
    }

    if (seal === 'covil-do-lich' || seal === 'covil_do_lich') {
      query = query.where(sql<boolean>`(
        'covil_do_lich' = ANY(COALESCE(gm.badges, ARRAY[]::text[]))
        OR 'covil-do-lich' = ANY(COALESCE(gm.badges, ARRAY[]::text[]))
      )`);
    }

    if (search) {
      const safeSearch = `%${search}%`;
      query = query.where(sql<boolean>`(
        t.title ILIKE ${safeSearch}
        OR t.description ILIKE ${safeSearch}
        OR s.name ILIKE ${safeSearch}
        OR COALESCE(gm.nickname, p.display_name) ILIKE ${safeSearch}
      )`);
    }

    // Filtro de expiração para mesas importadas
    // Regra: expiram em 5 dias OU no horário do evento (o que vier primeiro)
    query = query.where((eb) =>
      eb.or([
        eb('t.origin', '=', 'manual'), // Mesas manuais sempre visíveis
        sql<boolean>`NOW() < LEAST(
          t.created_at + interval '5 days',
          COALESCE(t.starts_at, t.created_at + interval '5 days')
        )`,
      ])
    );

    const tables = await query.execute();

    let tablesWithContacts = tables as Array<typeof tables[number] & { contacts: PublicTableContact[] }>;

    if (tables.length > 0) {
      const tableIds = tables.map((table) => table.id);
      const contacts = await db
        .selectFrom('table_contacts')
        .select(['table_id', 'channel', 'value', 'label', 'discord_server_url', 'sort_order'])
        .where('table_id', 'in', tableIds)
        .orderBy('sort_order', 'asc')
        .execute();

      const contactsByTable = new Map<string, PublicTableContact[]>();

      for (const contact of contacts) {
        if (!contactsByTable.has(contact.table_id)) {
          contactsByTable.set(contact.table_id, []);
        }

        contactsByTable.get(contact.table_id)!.push({
          channel: contact.channel,
          value: contact.value,
          label: contact.label,
          discord_server_url: contact.discord_server_url,
          sort_order: contact.sort_order,
        });
      }

      tablesWithContacts = tables.map((table) => ({
        ...table,
        contacts: contactsByTable.get(table.id) ?? [],
      }));
    }

    // CORREÇÃO DT-05: Contar total de mesas ativas para prova social
    const totalCount = await db
      .selectFrom('tables as t')
      .select(sql<number>`COUNT(*)`.as('count'))
      .where('t.status', '=', 'active')
      .executeTakeFirst();

    res.json({
      data: tablesWithContacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: tables.length === limitNum,
        total: Number(totalCount?.count ?? 0), // CORREÇÃO DT-05
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
      .leftJoin('users as u', 'u.id', 'gm.user_id')
      .leftJoin('profiles as p', 'p.user_id', 'u.id')
      .leftJoin('systems as s', 's.id', 't.system_id')
      .leftJoin('scenarios as sc', 'sc.id', 't.scenario_id') // CORREÇÃO DT-02: JOIN para retornar cenário
      .select([
        't.id',
        't.slug',
        't.title',
        't.description',
        sql<string | null>`t.banner_url`.as('cover_url'),
        't.status',
        't.type',
        't.audience',
        't.modality',
        't.price_type',
        't.price_value',
        't.price_frequency',
        't.slots_total',
        't.slots_filled',
        't.language',
        't.experience_level',
        't.starts_at',
        't.city',
        't.state',
        't.content_warnings',
        't.safety_tools',
        't.publisher_role',
        't.actual_gm_name',
        't.featured',
        't.created_at',
        't.origin',
        't.is_ddal',
        't.ddal_code',
        't.ddal_name',
        't.ddal_tier',
        't.ddal_season',
        't.ddal_duration',
        't.ddal_format',
        't.ddal_org_code',
        't.ddal_setting',
        't.ddal_rules_notes',
        // CORREÇÃO: Retornar campos avançados (REQ-26)
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
        // Campos de cenário e estilos (REQ-28)
        't.setting_name',
        't.setting_styles',
        // REQ-28 Fase 7: Campos editoriais separados
        't.synopsis_narrative',
        't.benefits_text',
        't.gm_bio',
        's.name as system_name',
        's.slug as system_slug',
        // CORREÇÃO DT-02: Retornar nome do cenário
        'sc.name as scenario_name',
        'gm.slug as gm_slug',
        'gm.avatar_url as gm_avatar_url',
        'gm.badges as gm_badges',
        sql<string>`COALESCE(gm.nickname, p.display_name)`.as('gm_display_name'),
        'gm.bio_long as gm_bio_long', // CORREÇÃO REG-13: Renomeado para evitar conflito com t.gm_bio
      ])
      .where('t.slug', '=', slug)
      .executeTakeFirst();

    if (!table) {
      return res.status(404).json({ error: 'Mesa não encontrada.' });
    }

    // Validar expiração para mesas importadas
    if (table.origin === 'imported') {
      const limite5Dias = new Date(table.created_at);
      limite5Dias.setDate(limite5Dias.getDate() + 5);

      const limiteEvento = table.starts_at ? new Date(table.starts_at) : limite5Dias;
      const validadeFinal = limiteEvento < limite5Dias ? limiteEvento : limite5Dias;

      if (new Date() >= validadeFinal) {
        return res.status(404).json({ error: 'Mesa não encontrada ou expirada.' });
      }
    }

    const contacts = await db
      .selectFrom('table_contacts')
      .select(['channel', 'value', 'label', 'discord_server_url', 'sort_order'])
      .where('table_id', '=', table.id)
      .orderBy('sort_order', 'asc')
      .execute();

    // CORREÇÃO: Buscar schedules (REQ-27)
    const schedules = await db
      .selectFrom('table_schedules')
      .selectAll()
      .where('table_id', '=', table.id)
      .orderBy('sort_order', 'asc')
      .execute();

    res.json({ data: { ...table, contacts, schedules } });
  } catch (error: any) {
    console.error('[GET /tables/:slug]', error);
    res.status(500).json({ error: 'Erro ao buscar mesa.' });
  }
});

export default router;
