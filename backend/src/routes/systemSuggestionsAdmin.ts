import express from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/admin/system-suggestions - Listar sugestões pendentes + log
router.get('/system-suggestions', authMiddleware, requireRole('admin'), async (req, res) => {
  const { status } = req.query;

  try {
    let query = db
      .selectFrom('system_suggestions as ss')
      .leftJoin('users as u', 'ss.user_id', 'u.id')
      .leftJoin('profiles as p', 'u.id', 'p.user_id')
      .leftJoin('systems as parent', 'ss.parent_id', 'parent.id')
      .leftJoin('users as reviewer', 'ss.reviewed_by', 'reviewer.id')
      .leftJoin('profiles as reviewer_profile', 'reviewer.id', 'reviewer_profile.user_id')
      .select([
        'ss.id',
        'ss.name',
        'ss.node_type',
        'ss.parent_id',
        'parent.name as parent_name',
        'ss.description',
        'ss.aliases',
        'ss.status',
        'ss.user_id',
        'p.display_name as user_name',
        'u.email as user_email',
        'ss.reviewed_by',
        'reviewer_profile.display_name as reviewer_name',
        'ss.reviewed_at',
        'ss.rejection_reason',
        'ss.created_at',
        'ss.updated_at'
      ]);

    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      query = query.where('ss.status', '=', status as any);
    }

    const suggestions = await query
      .orderBy('ss.created_at', 'desc')
      .execute();

    res.json({
      data: suggestions
    });
  } catch (error: any) {
    console.error('[admin/system-suggestions] Erro ao listar sugestões:', error);
    res.status(500).json({
      error: 'Erro ao listar sugestões',
      message: error.message
    });
  }
});

// PATCH /api/v1/admin/system-suggestions/:id/approve - Aprovar sugestão
router.patch('/system-suggestions/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const adminId = req.user!.userId;
  const { edited_name, edited_description, edited_aliases } = req.body;

  try {
    // Buscar sugestão
    const suggestion = await db
      .selectFrom('system_suggestions')
      .where('id', '=', id)
      .where('status', '=', 'pending')
      .selectAll()
      .executeTakeFirst();

    if (!suggestion) {
      return res.status(404).json({
        error: 'Sugestão não encontrada',
        message: 'Sugestão não existe ou já foi processada.'
      });
    }

    // Usar valores editados se fornecidos, senão usar originais
    const finalName = edited_name?.trim() || suggestion.name;
    const finalDescription = edited_description?.trim() || suggestion.description;
    const finalAliases = edited_aliases || suggestion.aliases;

    // Gerar slug
    const slug = finalName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Gerar path_slug
    let pathSlug = slug;
    if (suggestion.parent_id) {
      const parent = await db
        .selectFrom('systems')
        .where('id', '=', suggestion.parent_id)
        .select('path_slug')
        .executeTakeFirst();
      
      if (parent) {
        pathSlug = `${parent.path_slug}/${slug}`;
      }
    }

    // Criar sistema
    const newSystem = await db
      .insertInto('systems')
      .values({
        name: finalName,
        slug,
        path_slug: pathSlug,
        node_type: suggestion.node_type,
        parent_id: suggestion.parent_id,
        description: finalDescription,
      })
      .returningAll()
      .executeTakeFirst();

    // Criar aliases se fornecidos
    if (finalAliases && finalAliases.length > 0) {
      await db
        .insertInto('system_aliases')
        .values(
          finalAliases.map((alias: string) => ({
            system_id: newSystem!.id,
            alias: alias.trim(),
          }))
        )
        .execute();
    }

    // Atualizar sugestão como aprovada
    await db
      .updateTable('system_suggestions')
      .set({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date(),
      })
      .where('id', '=', id)
      .execute();

    // Criar notificação para o usuário
    await db
      .insertInto('notifications')
      .values({
        user_id: suggestion.user_id,
        type: 'suggestion_approved',
        title: '✅ Sugestão Aprovada',
        message: `Sua sugestão "${finalName}" foi aprovada e publicada!`,
        link: `/catalogo?system=${newSystem!.id}`,
      })
      .execute();

    res.json({
      message: 'Sugestão aprovada e sistema criado com sucesso',
      data: {
        suggestion_id: id,
        system_id: newSystem!.id,
        system: newSystem
      }
    });
  } catch (error: any) {
    console.error('[admin/system-suggestions] Erro ao aprovar sugestão:', error);
    res.status(500).json({
      error: 'Erro ao aprovar sugestão',
      message: error.message
    });
  }
});

// PATCH /api/v1/admin/system-suggestions/:id/reject - Rejeitar sugestão
router.patch('/system-suggestions/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const adminId = req.user!.userId;
  const { rejection_reason } = req.body;

  if (!rejection_reason || !rejection_reason.trim()) {
    return res.status(400).json({
      error: 'Motivo obrigatório',
      message: 'É necessário fornecer um motivo para a rejeição.'
    });
  }

  try {
    const suggestion = await db
      .selectFrom('system_suggestions')
      .where('id', '=', id)
      .where('status', '=', 'pending')
      .select(['id', 'user_id'])
      .executeTakeFirst();

    if (!suggestion) {
      return res.status(404).json({
        error: 'Sugestão não encontrada',
        message: 'Sugestão não existe ou já foi processada.'
      });
    }

    await db
      .updateTable('system_suggestions')
      .set({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date(),
        rejection_reason: rejection_reason.trim(),
      })
      .where('id', '=', id)
      .execute();

    // Criar notificação para o usuário
    await db
      .insertInto('notifications')
      .values({
        user_id: suggestion.user_id,
        type: 'suggestion_rejected',
        title: '❌ Sugestão Rejeitada',
        message: `Sua sugestão foi rejeitada. Motivo: ${rejection_reason.trim()}`,
        link: '/painel',
      })
      .execute();

    res.json({
      message: 'Sugestão rejeitada com sucesso'
    });
  } catch (error: any) {
    console.error('[admin/system-suggestions] Erro ao rejeitar sugestão:', error);
    res.status(500).json({
      error: 'Erro ao rejeitar sugestão',
      message: error.message
    });
  }
});

// PATCH /api/v1/admin/systems/:id - Editar sistema publicado
router.patch('/systems/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, description, aliases } = req.body;

  try {
    const system = await db
      .selectFrom('systems')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();

    if (!system) {
      return res.status(404).json({
        error: 'Sistema não encontrado'
      });
    }

    // Atualizar sistema
    const updates: any = {};
    if (name && name.trim() !== system.name) {
      updates.name = name.trim();
      
      // Regenerar slug
      const newSlug = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      updates.slug = newSlug;
      
      // Regenerar path_slug
      if (system.parent_id) {
        const parent = await db
          .selectFrom('systems')
          .where('id', '=', system.parent_id)
          .select('path_slug')
          .executeTakeFirst();
        
        if (parent) {
          updates.path_slug = `${parent.path_slug}/${newSlug}`;
        }
      } else {
        updates.path_slug = newSlug;
      }
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (Object.keys(updates).length > 0) {
      await db
        .updateTable('systems')
        .set(updates)
        .where('id', '=', id)
        .execute();
    }

    // Atualizar aliases se fornecidos
    if (aliases !== undefined) {
      // Remover aliases antigos
      await db
        .deleteFrom('system_aliases')
        .where('system_id', '=', id)
        .execute();

      // Adicionar novos aliases
      if (aliases && aliases.length > 0) {
        await db
          .insertInto('system_aliases')
          .values(
            aliases.map((alias: string) => ({
              system_id: id,
              alias: alias.trim(),
            }))
          )
          .execute();
      }
    }

    res.json({
      message: 'Sistema atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('[admin/systems] Erro ao editar sistema:', error);
    res.status(500).json({
      error: 'Erro ao editar sistema',
      message: error.message
    });
  }
});

export default router;
