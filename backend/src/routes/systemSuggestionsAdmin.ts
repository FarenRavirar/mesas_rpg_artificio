import { Router, Request, Response } from 'express';
import { Transaction } from 'kysely';
import { authMiddleware, requireRole } from '../middleware/auth';
import { db } from '../db';
import { Database } from '../db/types';
import { logActivity } from '../services/activityLogger';

const router = Router();

async function resolveActorName(userId: string, trx?: Transaction<Database>): Promise<string> {
  const executor = trx ?? db;

  try {
    const profile = await executor
      .selectFrom('profiles')
      .select('display_name')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (profile?.display_name && profile.display_name.trim().length > 0) {
      return profile.display_name.trim();
    }

    const adminUser = await executor
      .selectFrom('users')
      .select(['username', 'email'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (adminUser?.username && adminUser.username.trim().length > 0) {
      return adminUser.username.trim();
    }

    if (adminUser?.email) {
      return adminUser.email.split('@')[0];
    }
  } catch (error) {
    console.error('[systemSuggestionsAdmin][resolveActorName]', error);
  }

  return 'Admin';
}

router.use(authMiddleware, requireRole('admin'));

// GET /api/v1/admin/system-suggestions - Listar todas as sugestões
router.get('/system-suggestions', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = db.selectFrom('system_suggestions').selectAll().orderBy('created_at', 'desc');

    if (status && typeof status === 'string') {
      query = query.where('status', '=', status as any);
    }

    const suggestions = await query.execute();
    return res.json({ data: suggestions });
  } catch (error: any) {
    console.error('[GET /admin/system-suggestions]', error);
    return res.status(500).json({ error: 'Erro ao listar sugestões.' });
  }
});

// PATCH /api/v1/admin/system-suggestions/:id/approve - Aprovar sugestão
router.patch('/system-suggestions/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    // Transação completa: SELECT + INSERT systems + UPDATE status + INSERT notification
    const result = await db.transaction().execute(async (trx) => {
      // 1. SELECT sugestão WHERE status='pending'
      const suggestion = await trx
        .selectFrom('system_suggestions')
        .selectAll()
        .where('id', '=', id)
        .where('status', '=', 'pending')
        .executeTakeFirst();

      if (!suggestion) {
        throw new Error('NOT_FOUND_OR_REVIEWED');
      }

      const adminName = await resolveActorName(adminId, trx);

      // 2. Verificar se parent_id existe (se fornecido)
      if (suggestion.parent_id) {
        const parentExists = await trx
          .selectFrom('systems')
          .select('id')
          .where('id', '=', suggestion.parent_id)
          .executeTakeFirst();

        if (!parentExists) {
          throw new Error('PARENT_NOT_FOUND');
        }
      }

      // 3. Gerar path_slug e verificar colisão
      const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = slugify(suggestion.name);
      
      let pathSlug = slug;
      let depth = 0;
      if (suggestion.parent_id) {
        const parent = await trx
          .selectFrom('systems')
          .select(['path_slug', 'depth'])
          .where('id', '=', suggestion.parent_id)
          .executeTakeFirst();

        pathSlug = parent ? `${parent.path_slug}/${slug}` : slug;
        depth = (parent?.depth ?? 0) + 1;
      }

      const existingSystem = await trx
        .selectFrom('systems')
        .select('id')
        .where('path_slug', '=', pathSlug)
        .executeTakeFirst();

      if (existingSystem) {
        throw new Error('PATH_SLUG_CONFLICT');
      }

      // 4. INSERT em systems

      const newSystem = await trx
        .insertInto('systems')
        .values({
          name: suggestion.name,
          name_pt: suggestion.name_pt,
          slug,
          path_slug: pathSlug,
          node_type: suggestion.node_type,
          depth,
          parent_id: suggestion.parent_id,
          description: suggestion.description,
        })
        .returning(['id', 'name', 'path_slug'])
        .executeTakeFirstOrThrow();

      // 5. Copiar aliases para system_aliases (se existirem)
      if (suggestion.aliases && suggestion.aliases.length > 0) {
        const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        for (const alias of suggestion.aliases) {
          await trx
            .insertInto('system_aliases')
            .values({
              system_id: newSystem.id,
              alias: alias,
              alias_slug: slugify(alias),
              is_official: false,
            })
            .execute();
        }
      }

      // 5. UPDATE status da sugestão
      await trx
        .updateTable('system_suggestions')
        .set({
          status: 'approved',
          reviewed_at: new Date(),
          reviewed_by: adminId,
        })
        .where('id', '=', id)
        .execute();

      // 6. INSERT em notifications
      await trx
        .insertInto('notifications')
        .values({
          user_id: suggestion.user_id,
          type: 'suggestion_approved',
          title: 'Sugestão aprovada',
          message: `Seu sistema "${suggestion.name}" foi adicionado ao catálogo.`,
          action_url: `/catalogo?system=${newSystem.path_slug}`,
          metadata: JSON.stringify({
            suggestion_id: id,
            suggestion_kind: 'system',
            system_id: newSystem.id,
            path_slug: newSystem.path_slug,
          }),
        })
        .execute();

      await logActivity({
        actorId: adminId,
        actorRole: 'admin',
        action: 'system_suggestion.approved',
        entityType: 'system_suggestion',
        entityId: id,
        entityLabel: suggestion.name,
        targetUserId: suggestion.user_id,
        summary: `${adminName} aprovou "${suggestion.name}" e adicionou ao catálogo.`,
        metadata: {
          suggestion_id: id,
          system_id: newSystem.id,
          path_slug: newSystem.path_slug,
        },
      }, trx);

      return {
        suggestion_id: id,
        system_id: newSystem.id,
        system_name: suggestion.name,
        path_slug: newSystem.path_slug,
      };
    });

    // Pós-transação: linkar drafts Discord que aguardavam este sistema
    const pendingDrafts: Array<{ id: string; title: string | null }> = [];
    try {
      const drafts = await db
        .selectFrom('discord_import_table_drafts')
        .select(['id', 'parsed_payload'])
        .where('status', 'not in', ['synced', 'rejected'])
        .execute();

      for (const draft of drafts) {
        const payload = draft.parsed_payload as Record<string, any> | null;
        if (payload?.table?.raw_system_hint === result.system_name) {
          const updated = {
            ...payload,
            table: {
              ...payload.table,
              system_id: result.system_id,
              system_name: result.system_name,
              raw_system_hint: null,
            },
          };
          await db
            .updateTable('discord_import_table_drafts')
            .set({ parsed_payload: updated as any, status: 'ready' })
            .where('id', '=', draft.id)
            .execute();
          pendingDrafts.push({ id: draft.id, title: payload.table?.title ?? null });
        }
      }
    } catch (linkErr) {
      console.error('[approve] Erro ao linkar drafts:', linkErr);
    }

    return res.json({ success: true, data: { ...result, pending_drafts: pendingDrafts } });
  } catch (error: any) {
    console.error('[PATCH /admin/system-suggestions/:id/approve]', error);
    
    if (error.message === 'NOT_FOUND_OR_REVIEWED') {
      return res.status(404).json({ error: 'Sugestão não encontrada ou já foi revisada.' });
    }
    if (error.message === 'PARENT_NOT_FOUND') {
      return res.status(404).json({ error: 'Sistema pai não encontrado.' });
    }
    if (error.message === 'PATH_SLUG_CONFLICT') {
      return res.status(409).json({ error: 'Já existe um sistema com este caminho.' });
    }
    
    return res.status(500).json({ error: 'Erro ao aprovar sugestão.' });
  }
});

// PATCH /api/v1/admin/system-suggestions/:id/reject - Rejeitar sugestão
router.patch('/system-suggestions/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Motivo da rejeição é obrigatório.' });
    }

    // Transação: UPDATE status + INSERT notification
    await db.transaction().execute(async (trx) => {
      // 1. SELECT sugestão WHERE status='pending'
      const suggestion = await trx
        .selectFrom('system_suggestions')
        .select(['id', 'user_id', 'name'])
        .where('id', '=', id)
        .where('status', '=', 'pending')
        .executeTakeFirst();

      if (!suggestion) {
        throw new Error('NOT_FOUND_OR_REVIEWED');
      }

      const adminName = await resolveActorName(adminId, trx);

      // 2. UPDATE status para rejected
      await trx
        .updateTable('system_suggestions')
        .set({
          status: 'rejected',
          rejection_reason: reason.trim(),
          reviewed_at: new Date(),
          reviewed_by: adminId,
        })
        .where('id', '=', id)
        .execute();

      // 3. INSERT em notifications
      await trx
        .insertInto('notifications')
        .values({
          user_id: suggestion.user_id,
          type: 'suggestion_rejected',
          title: 'Sugestão revisada',
          message: `Sua sugestão "${suggestion.name}" não foi aceita desta vez.`,
          action_url: `/perfil/minhas-sugestoes/${id}`,
          metadata: JSON.stringify({
            suggestion_id: id,
            suggestion_kind: 'system',
            reason: reason.trim(),
          }),
        })
        .execute();

      await logActivity({
        actorId: adminId,
        actorRole: 'admin',
        action: 'system_suggestion.rejected',
        entityType: 'system_suggestion',
        entityId: id,
        entityLabel: suggestion.name,
        targetUserId: suggestion.user_id,
        summary: `${adminName} rejeitou a sugestão "${suggestion.name}".`,
        metadata: {
          suggestion_id: id,
          reason: reason.trim(),
        },
      }, trx);
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[PATCH /admin/system-suggestions/:id/reject]', error);
    
    if (error.message === 'NOT_FOUND_OR_REVIEWED') {
      return res.status(404).json({ error: 'Sugestão não encontrada ou já foi revisada.' });
    }
    
    return res.status(500).json({ error: 'Erro ao rejeitar sugestão.' });
  }
});

export default router;
