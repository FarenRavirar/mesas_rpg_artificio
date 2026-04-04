import express from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/notifications - Listar notificações do usuário
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user!.userId;
  const { unread_only } = req.query;

  try {
    let query = db
      .selectFrom('notifications')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(50); // Limitar a 50 notificações mais recentes

    if (unread_only === 'true') {
      query = query.where('read', '=', false);
    }

    const notifications = await query.execute();

    res.json({
      data: notifications
    });
  } catch (error: any) {
    console.error('[notifications] Erro ao listar notificações:', error);
    res.status(500).json({
      error: 'Erro ao listar notificações',
      message: error.message
    });
  }
});

// GET /api/v1/notifications/unread-count - Contar notificações não lidas
router.get('/unread-count', authMiddleware, async (req, res) => {
  const userId = req.user!.userId;

  try {
    const result = await db
      .selectFrom('notifications')
      .where('user_id', '=', userId)
      .where('read', '=', false)
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();

    res.json({
      count: Number(result?.count || 0)
    });
  } catch (error: any) {
    console.error('[notifications] Erro ao contar notificações:', error);
    res.status(500).json({
      error: 'Erro ao contar notificações',
      message: error.message
    });
  }
});

// PATCH /api/v1/notifications/:id/read - Marcar notificação como lida
router.patch('/:id/read', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    await db
      .updateTable('notifications')
      .set({ read: true })
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .execute();

    res.json({
      message: 'Notificação marcada como lida'
    });
  } catch (error: any) {
    console.error('[notifications] Erro ao marcar notificação:', error);
    res.status(500).json({
      error: 'Erro ao marcar notificação',
      message: error.message
    });
  }
});

// PATCH /api/v1/notifications/read-all - Marcar todas como lidas
router.patch('/read-all', authMiddleware, async (req, res) => {
  const userId = req.user!.userId;

  try {
    await db
      .updateTable('notifications')
      .set({ read: true })
      .where('user_id', '=', userId)
      .where('read', '=', false)
      .execute();

    res.json({
      message: 'Todas as notificações foram marcadas como lidas'
    });
  } catch (error: any) {
    console.error('[notifications] Erro ao marcar todas como lidas:', error);
    res.status(500).json({
      error: 'Erro ao marcar notificações',
      message: error.message
    });
  }
});

export default router;
