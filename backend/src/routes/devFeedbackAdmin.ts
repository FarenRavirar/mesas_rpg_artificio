import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { db } from '../db';
import { logActivity } from '../services/activityLogger';
import type { DevFeedbackStatus } from '../db/types';

const router = Router();

const VALID_STATUS: ReadonlySet<DevFeedbackStatus> = new Set([
  'new', 'triaged', 'in_progress', 'resolved', 'wont_fix', 'duplicate',
]);

const VALID_KIND = new Set(['bug', 'suggestion']);

async function resolveActorName(userId: string): Promise<string> {
  try {
    const profile = await db
      .selectFrom('profiles')
      .select('display_name')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (profile?.display_name && profile.display_name.trim().length > 0) {
      return profile.display_name.trim();
    }

    const user = await db
      .selectFrom('users')
      .select(['username', 'email'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (user?.username && user.username.trim().length > 0) {
      return user.username.trim();
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
  } catch (error) {
    console.error('[devFeedbackAdmin][resolveActorName]', error);
  }
  return 'Anonimo';
}

router.use(authMiddleware, requireRole('admin'));

// GET /api/v1/admin/dev-feedback?status=&kind= - lista para triagem
router.get('/dev-feedback', async (req: Request, res: Response) => {
  try {
    let query = db.selectFrom('dev_feedback').selectAll().orderBy('created_at', 'desc');

    const status = typeof req.query.status === 'string' ? req.query.status : '';
    if (VALID_STATUS.has(status as DevFeedbackStatus)) {
      query = query.where('status', '=', status as DevFeedbackStatus);
    }

    const kind = typeof req.query.kind === 'string' ? req.query.kind : '';
    if (VALID_KIND.has(kind)) {
      query = query.where('kind', '=', kind as 'bug' | 'suggestion');
    }

    const rows = await query.execute();

    const data = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        reporter_name: row.user_id ? await resolveActorName(row.user_id) : 'Anonimo',
      })),
    );

    return res.json({ data });
  } catch (error: any) {
    console.error('[GET /admin/dev-feedback]', error);
    return res.status(500).json({ error: 'Erro ao listar feedbacks.' });
  }
});

// PATCH /api/v1/admin/dev-feedback/:id - atualiza status e/ou notas
router.patch('/dev-feedback/:id', async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      return res.status(401).json({ error: 'Nao autenticado.' });
    }

    const { id } = req.params;
    const body = (req.body && typeof req.body === 'object') ? req.body as Record<string, unknown> : {};

    const update: Record<string, unknown> = {
      reviewed_by: adminId,
      reviewed_at: new Date(),
      updated_at: new Date(),
    };

    let nextStatus: DevFeedbackStatus | null = null;
    if (typeof body.status === 'string') {
      if (!VALID_STATUS.has(body.status as DevFeedbackStatus)) {
        return res.status(400).json({ error: 'Status invalido.' });
      }
      nextStatus = body.status as DevFeedbackStatus;
      update.status = nextStatus;
    }

    if (typeof body.admin_notes === 'string') {
      const notes = body.admin_notes.trim();
      update.admin_notes = notes.length > 0 ? notes.slice(0, 4000) : null;
    }

    const updated = await db
      .updateTable('dev_feedback')
      .set(update)
      .where('id', '=', id)
      .returning(['id', 'kind', 'title', 'status', 'admin_notes', 'updated_at'])
      .executeTakeFirst();

    if (!updated) {
      return res.status(404).json({ error: 'Feedback nao encontrado.' });
    }

    void logActivity({
      actorId: adminId,
      actorRole: 'admin',
      action: 'dev_feedback.updated',
      entityType: 'dev_feedback',
      entityId: updated.id,
      entityLabel: updated.title,
      summary: `Feedback "${updated.title}" atualizado${nextStatus ? ` para ${nextStatus}` : ''}.`,
      metadata: { status: updated.status },
    });

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PATCH /admin/dev-feedback/:id]', error);
    return res.status(500).json({ error: 'Erro ao atualizar feedback.' });
  }
});

export default router;
