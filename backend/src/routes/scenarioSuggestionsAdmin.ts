import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware, requireRole } from '../middleware/auth';
import { db } from '../db';

const router = Router();

const adminScenarioSuggestionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo de 100 requisições por IP por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

router.use(authMiddleware, requireRole('admin'), adminScenarioSuggestionsLimiter);

// GET /api/v1/admin/scenario-suggestions - Listar todas as sugestões
router.get('/scenario-suggestions', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = db.selectFrom('scenario_suggestions').selectAll().orderBy('created_at', 'desc');

    if (status && typeof status === 'string') {
      query = query.where('status', '=', status as any);
    }

    const suggestions = await query.execute();
    return res.json({ data: suggestions });
  } catch (error: any) {
    console.error('[GET /admin/scenario-suggestions]', error);
    return res.status(500).json({ error: 'Erro ao listar sugestões.' });
  }
});

// PATCH /api/v1/admin/scenario-suggestions/:id/approve - Aprovar sugestão
router.patch('/scenario-suggestions/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    // Transação completa: SELECT + INSERT scenarios + UPDATE status + INSERT notification
    const result = await db.transaction().execute(async (trx) => {
      // 1. SELECT sugestão WHERE status='pending'
      const suggestion = await trx
        .selectFrom('scenario_suggestions')
        .selectAll()
        .where('id', '=', id)
        .where('status', '=', 'pending')
        .executeTakeFirst();

      if (!suggestion) {
        throw new Error('NOT_FOUND_OR_REVIEWED');
      }

      // 2. Gerar slug e verificar colisão
      const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = slugify(suggestion.name);

      const existingScenario = await trx
        .selectFrom('scenarios')
        .select('id')
        .where('slug', '=', slug)
        .executeTakeFirst();

      if (existingScenario) {
        throw new Error('SLUG_CONFLICT');
      }

      // 3. INSERT em scenarios (cenários são flat - sem depth/path_slug/parent_id)
      const newScenario = await trx
        .insertInto('scenarios')
        .values({
          name: suggestion.name,
          name_pt: suggestion.name_pt,
          slug,
          description: suggestion.description,
          subgenres: suggestion.subgenres || [],
        })
        .returning(['id', 'name', 'slug'])
        .executeTakeFirstOrThrow();

      // 4. Copiar aliases para scenario_aliases (se existirem)
      if (suggestion.aliases && suggestion.aliases.length > 0) {
        const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        for (const alias of suggestion.aliases) {
          await trx
            .insertInto('scenario_aliases')
            .values({
              scenario_id: newScenario.id,
              alias: alias,
              alias_slug: slugify(alias),
              is_official: false,
            })
            .execute();
        }
      }

      // 4. UPDATE status da sugestão
      await trx
        .updateTable('scenario_suggestions')
        .set({
          status: 'approved',
          reviewed_at: new Date(),
          reviewed_by: adminId,
        })
        .where('id', '=', id)
        .execute();

      // 5. INSERT em notifications
      await trx
        .insertInto('notifications')
        .values({
          user_id: suggestion.user_id,
          type: 'suggestion_approved',
          title: 'Sugestão aprovada',
          message: `Seu cenário "${suggestion.name}" foi adicionado ao catálogo.`,
          action_url: `/catalogo?scenario=${newScenario.slug}`,
          metadata: JSON.stringify({
            suggestion_id: id,
            suggestion_kind: 'scenario',
            scenario_id: newScenario.id,
            slug: newScenario.slug,
          }),
        })
        .execute();

      return {
        suggestion_id: id,
        scenario_id: newScenario.id,
        slug: newScenario.slug,
      };
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[PATCH /admin/scenario-suggestions/:id/approve]', error);
    
    if (error.message === 'NOT_FOUND_OR_REVIEWED') {
      return res.status(404).json({ error: 'Sugestão não encontrada ou já foi revisada.' });
    }
    if (error.message === 'SLUG_CONFLICT') {
      return res.status(409).json({ error: 'Já existe um cenário com este nome.' });
    }
    
    return res.status(500).json({ error: 'Erro ao aprovar sugestão.' });
  }
});

// PATCH /api/v1/admin/scenario-suggestions/:id/reject - Rejeitar sugestão
router.patch('/scenario-suggestions/:id/reject', async (req: Request, res: Response) => {
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
        .selectFrom('scenario_suggestions')
        .select(['id', 'user_id', 'name'])
        .where('id', '=', id)
        .where('status', '=', 'pending')
        .executeTakeFirst();

      if (!suggestion) {
        throw new Error('NOT_FOUND_OR_REVIEWED');
      }

      // 2. UPDATE status para rejected
      await trx
        .updateTable('scenario_suggestions')
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
            suggestion_kind: 'scenario',
            reason: reason.trim(),
          }),
        })
        .execute();
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[PATCH /admin/scenario-suggestions/:id/reject]', error);
    
    if (error.message === 'NOT_FOUND_OR_REVIEWED') {
      return res.status(404).json({ error: 'Sugestão não encontrada ou já foi revisada.' });
    }
    
    return res.status(500).json({ error: 'Erro ao rejeitar sugestão.' });
  }
});

export default router;
