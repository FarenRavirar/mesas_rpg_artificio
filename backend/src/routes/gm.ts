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
        sql<string>`COALESCE(gm.nickname, p.display_name)`.as('display_name'),
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
        // Campos extras para prova social
        'gm.discord_connected',
        'gm.discord_username',
        'gm.covil_verified',
        'gm.experience_years',
        'gm.average_price',
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
      .leftJoin('table_metrics as tm', 'tm.table_id', 't.id')
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
        't.publisher_role',
        't.actual_gm_name',
        't.featured',
        't.is_ddal',
        't.ddal_code',
        't.ddal_name',
        't.ddal_tier',
        't.created_at',
        't.synopsis_narrative',
        's.name as system_name',
        's.slug as system_slug',
        // Métricas de engajamento
        sql<number>`COALESCE(tm.views_count, 0)`.as('metrics_views'),
        sql<number>`COALESCE(tm.clicks_count, 0)`.as('metrics_clicks'),
        sql<number>`COALESCE(tm.contacts_count, 0)`.as('metrics_contacts'),
        sql<number>`COALESCE(tm.favorites_count, 0)`.as('metrics_favorites'),
      ])
      .where('t.gm_id', '=', gm.id)
      .where('t.status', '=', 'active')
      .orderBy('t.created_at', 'desc')
      .execute();

    if (tables.length === 0) {
      return res.json({ data: { ...gm, tables: [] } });
    }

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

    const tablesWithContacts = tables.map((table) => ({
      ...table,
      contacts: contactsByTable.get(table.id) ?? [],
    }));

    res.json({ data: { ...gm, tables: tablesWithContacts } });
  } catch (error: any) {
    console.error('[GET /gm/:slug]', error);
    res.status(500).json({ error: 'Erro ao buscar perfil do mestre.' });
  }
});

export default router;
