import { Router, Request, Response } from 'express';
import { sql } from 'kysely';
import { db } from '../db';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { generateEmbedUrl, detectLinkType, LinkType } from '../services/linkService';

const router = Router();

type PublicTableContact = {
  channel: string;
  value: string;
  label: string | null;
  discord_server_url: string | null;
  sort_order: number;
};

type MetricRow = {
  id: string;
  slug: string;
  title: string;
  views: number;
  clicks: number;
  contacts: number;
  favorites: number;
};

type Recommendation = {
  table_slug: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
};

function buildRecommendations(metrics: MetricRow[]): Recommendation[] {
  // Agrupa por title para evitar 3x "Pathfinder: Kingmaker"
  const byTitle = new Map<string, MetricRow[]>();
  for (const m of metrics) {
    const key = m.title.trim().toLowerCase();
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(m);
  }

  const recs: Recommendation[] = [];

  for (const group of byTitle.values()) {
    // Se há múltiplas mesas com mesmo título, agrega a primeira e indica quantidade
    const first = group[0];
    const count = group.length;
    const suffix = count > 1 ? ` (${count} instâncias)` : '';

    // Soma métricas do grupo para evitar falso positivo (ex.: "0 views" quando uma das 3 mesas tem views)
    const totalViews = group.reduce((s, m) => s + m.views, 0);
    const totalClicks = group.reduce((s, m) => s + m.clicks, 0);
    const totalContacts = group.reduce((s, m) => s + m.contacts, 0);

    if (totalViews >= 20 && totalContacts === 0) {
      recs.push({
        table_slug: first.slug,
        severity: 'high',
        message: `Mesa "${first.title}"${suffix} tem ${totalViews} visualizações e zero contatos. Revise capa, preço e descrição.`,
      });
      continue;
    }
    if (totalClicks >= 10 && totalContacts === 0) {
      recs.push({
        table_slug: first.slug,
        severity: 'medium',
        message: `Mesa "${first.title}"${suffix} recebe cliques mas não gera contato. Teste um CTA mais direto na descrição.`,
      });
      continue;
    }
    if (totalViews === 0 && totalClicks === 0) {
      recs.push({
        table_slug: first.slug,
        severity: 'low',
        message: `Mesa "${first.title}"${suffix} ainda não recebeu tráfego. Compartilhe o link em suas redes.`,
      });
    }
  }

  return recs;
}

// GET /api/v1/gm/:slug — Perfil público do mestre (anônimo + autenticado opcional)
router.get('/:slug', optionalAuth, async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const gm = await db
      .selectFrom('gm_profiles as gm')
      .innerJoin('users as u', 'u.id', 'gm.user_id')
      .innerJoin('profiles as p', 'p.user_id', 'u.id')
      .select([
        'gm.id',
        'gm.user_id',
        'gm.slug',
        sql<string>`COALESCE(gm.nickname, p.display_name)`.as('display_name'),
        'gm.bio_long',
        'gm.tagline',
        sql<string>`COALESCE(gm.avatar_url, p.avatar_url)`.as('avatar_url'),
        'gm.banner_url',
        'gm.languages',
        'gm.specialties',
        'gm.badges',
        'gm.selling_points',
        'gm.promo_badge_text',
        'gm.closed_group_enabled',
        'gm.closed_group_systems',
        'gm.closed_group_description',
        'gm.closed_group_min_price_cents',
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

    // Aumenta qualidade de imagens do Google (mesmo tratamento do og.ts)
    if (gm.avatar_url && gm.avatar_url.includes('googleusercontent.com')) {
      gm.avatar_url = gm.avatar_url.replace(/=s\d+-c$/, '=s400-c');
    }
    if (gm.banner_url && gm.banner_url.includes('googleusercontent.com')) {
      gm.banner_url = gm.banner_url.replace(/=s\d+-c$/, '=s400-c');
    }

    const viewer_context = {
      is_owner: req.user?.userId === gm.user_id,
      is_admin: req.user?.role === 'admin',
    };

    // Buscar mesas ativas do mestre (sem métricas sensíveis)
    const tables = await db
      .selectFrom('tables as t')
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
        't.publisher_role',
        't.actual_gm_name',
        't.featured',
        't.is_ddal',
        't.ddal_code',
        't.ddal_name',
        't.ddal_tier',
        't.created_at',
        't.synopsis_narrative',
        't.features',
        's.name as system_name',
        's.slug as system_slug',
      ])
      .where('t.gm_id', '=', gm.id)
      .where('t.status', '=', 'active')
      .orderBy('t.featured', 'desc')
      .orderBy('t.created_at', 'desc')
      .execute();

    let tablesWithContacts: any[] = [];

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

    // CORREÇÃO DT-04: Buscar links públicos do mestre com contrato completo
    const links = await db
      .selectFrom('user_links')
      .innerJoin('users as u', 'u.id', 'user_links.user_id')
      .innerJoin('gm_profiles as gm_check', 'gm_check.user_id', 'u.id')
      .select([
        'user_links.id',
        'user_links.url',
        'user_links.title',
        'user_links.description',
        'user_links.type',
        'user_links.thumbnail_url',
        'user_links.sort_order',
        'user_links.metadata_status',
      ])
      .where('gm_check.id', '=', gm.id)
      .orderBy('user_links.sort_order', 'asc')
      .execute();

    if (links.length > 0) {
      const linkIdsToTouch = links.map(l => l.id);
      db.updateTable('user_links')
        .set({ metadata_last_accessed_at: sql`NOW()` })
        .where('id', 'in', linkIdsToTouch)
        .where('metadata_last_accessed_at', '<', sql<Date>`NOW() - interval '6 hours'`)
        .execute()
        .catch((e: any) => console.error('[GET /gm/:slug] Falha ao atualizar acesso do link:', e));

      // CORREÇÃO DT-04: Worker "fire-and-forget" para cobrir base de links órfãos ('pending')
      if (links.some(l => (l as any).metadata_status === 'pending')) {
        const { processPendingLinks } = require('../scripts/processLinkMetadataJobs');
        processPendingLinks().catch((err: any) => console.error('Silent processPending error:', err));
      }
    }

    const enrichedLinks = links.map((link) => ({
      ...link,
      embed_url: generateEmbedUrl(link.url, link.type as LinkType)
    }));

    let closedGroupSystems: Array<{ id: string; name: string }> = [];
    if (gm.closed_group_enabled && Array.isArray(gm.closed_group_systems) && gm.closed_group_systems.length > 0) {
      closedGroupSystems = await db
        .selectFrom('systems')
        .select(['id', 'name'])
        .where('id', 'in', gm.closed_group_systems as string[])
        .execute();
    }

    const closed_group = {
      enabled: !!gm.closed_group_enabled,
      systems: closedGroupSystems,
      description: gm.closed_group_description,
      min_price_cents: gm.closed_group_min_price_cents,
    };

    const { user_id, closed_group_enabled, closed_group_systems, closed_group_description, closed_group_min_price_cents, ...gmPublic } = gm;

    return res.json({
      data: {
        ...gmPublic,
        closed_group,
        tables: tablesWithContacts,
        links: enrichedLinks,
        viewer_context,
      },
    });
  } catch (error: any) {
    console.error('[GET /gm/:slug]', error);
    return res.status(500).json({ error: 'Erro ao buscar perfil do mestre.' });
  }
});

// POST /api/v1/gm/:slug/view — Registrar visualização do perfil público
router.post('/:slug/view', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const sessionId = req.header('x-session-id')?.trim();

  if (!slug || slug.length > 200 || !/^[a-z0-9-]+$/i.test(slug)) {
    return res.status(400).json({ error: 'Slug inválido.' });
  }

  if (!sessionId || sessionId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
    return res.status(400).json({ error: 'Sessão inválida.' });
  }

  try {
    const gm = await db
      .selectFrom('gm_profiles as gm')
      .select(['gm.id'])
      .where('gm.slug', '=', slug)
      .executeTakeFirst();

    if (!gm) {
      return res.status(404).json({ error: 'Mestre não encontrado.' });
    }

    const counted = await db.transaction().execute(async (trx) => {
      const insertedViewEvent = await trx
        .insertInto('gm_profile_view_events')
        .values({
          gm_profile_id: gm.id,
          session_id: sessionId,
        })
        .onConflict((oc) => oc.columns(['gm_profile_id', 'session_id']).doNothing())
        .returning('id')
        .executeTakeFirst();

      if (!insertedViewEvent) {
        return false;
      }

      await trx
        .insertInto('gm_profile_metrics')
        .values({
          gm_profile_id: gm.id,
          views_count: 1,
        })
        .onConflict((oc) =>
          oc.column('gm_profile_id').doUpdateSet({
            views_count: sql`gm_profile_metrics.views_count + 1`,
            updated_at: sql`NOW()`,
          })
        )
        .execute();

      return true;
    });

    if (!counted) {
      return res.status(202).json({ success: true, deduped: true });
    }

    return res.json({ success: true, deduped: false });
  } catch (error: any) {
    console.error('[POST /gm/:slug/view]', error);
    return res.status(500).json({ error: 'Erro ao registrar visualização do perfil.' });
  }
});

// GET /api/v1/gm/:slug/insights
// Protegido: somente dono ou admin.
router.get('/:slug/insights', authMiddleware, async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const gm = await db
      .selectFrom('gm_profiles')
      .select(['id', 'user_id'])
      .where('slug', '=', slug)
      .executeTakeFirst();

    if (!gm) {
      return res.status(404).json({ error: 'Mestre não encontrado.' });
    }

    const isOwner = req.user!.userId === gm.user_id;
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const metrics = await db
      .selectFrom('tables as t')
      .leftJoin('table_metrics as tm', 'tm.table_id', 't.id')
      .select([
        't.id',
        't.slug',
        't.title',
        sql<number>`COALESCE(tm.views_count, 0)`.as('views'),
        sql<number>`COALESCE(tm.clicks_count, 0)`.as('clicks'),
        sql<number>`COALESCE(tm.contacts_count, 0)`.as('contacts'),
        sql<number>`COALESCE(tm.favorites_count, 0)`.as('favorites'),
      ])
      .where('t.gm_id', '=', gm.id)
      .orderBy('t.created_at', 'desc')
      .execute();

    const recommendations = buildRecommendations(metrics as MetricRow[]);

    return res.json({
      data: {
        metrics,
        recommendations,
      },
    });
  } catch (error: any) {
    console.error('[GET /gm/:slug/insights]', error);
    return res.status(500).json({ error: 'Erro ao buscar insights.' });
  }
});

export default router;
