import express from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// POST /api/v1/system-suggestions - Criar sugestão (qualquer usuário autenticado)
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user!.userId;
  const { name, node_type, parent_id, description, aliases } = req.body;

  // Validar campos obrigatórios
  if (!name || !node_type) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      message: 'Nome e tipo do sistema são obrigatórios.'
    });
  }

  // Validar node_type
  const validTypes = ['system', 'edition', 'variant', 'subsystem'];
  if (!validTypes.includes(node_type)) {
    return res.status(400).json({
      error: 'Tipo inválido',
      message: 'Tipo deve ser: system, edition, variant ou subsystem.'
    });
  }

  try {
    // Verificar limite de 5 sugestões pendentes
    const pendingCount = await db
      .selectFrom('system_suggestions')
      .where('user_id', '=', userId)
      .where('status', '=', 'pending')
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();

    if (pendingCount && Number(pendingCount.count) >= 5) {
      return res.status(400).json({
        error: 'Limite de sugestões atingido',
        message: 'Você já possui 5 sugestões pendentes. Aguarde a aprovação ou rejeição antes de enviar novas sugestões.'
      });
    }

    // Validar hierarquia se parent_id fornecido
    if (parent_id) {
      const parent = await db
        .selectFrom('systems')
        .where('id', '=', parent_id)
        .select(['id', 'node_type'])
        .executeTakeFirst();

      if (!parent) {
        return res.status(400).json({
          error: 'Sistema pai não encontrado',
          message: 'O sistema pai especificado não existe.'
        });
      }

      // Se tentar adicionar edição, verificar se já tem edições publicadas
      if (node_type === 'edition') {
        const hasEditions = await db
          .selectFrom('systems')
          .where('parent_id', '=', parent_id)
          .where('node_type', '=', 'edition')
          .select('id')
          .executeTakeFirst();

        if (hasEditions) {
          return res.status(400).json({
            error: 'Hierarquia inválida',
            message: 'Este sistema já possui edições publicadas. Você só pode adicionar Variantes.'
          });
        }
      }
    }

    // Criar sugestão
    const suggestion = await db
      .insertInto('system_suggestions')
      .values({
        user_id: userId,
        name: name.trim(),
        node_type,
        parent_id: parent_id || null,
        description: description?.trim() || null,
        aliases: aliases || null,
      })
      .returningAll()
      .executeTakeFirst();

    res.status(201).json({
      message: 'Sugestão criada com sucesso',
      data: suggestion
    });
  } catch (error: any) {
    console.error('[system-suggestions] Erro ao criar sugestão:', error);
    res.status(500).json({
      error: 'Erro ao criar sugestão',
      message: error.message
    });
  }
});

// GET /api/v1/system-suggestions/mine - Minhas sugestões
router.get('/mine', authMiddleware, async (req, res) => {
  const userId = req.user!.userId;

  try {
    const suggestions = await db
      .selectFrom('system_suggestions as ss')
      .leftJoin('systems as parent', 'ss.parent_id', 'parent.id')
      .leftJoin('users as reviewer', 'ss.reviewed_by', 'reviewer.id')
      .leftJoin('profiles as reviewer_profile', 'reviewer.id', 'reviewer_profile.user_id')
      .where('ss.user_id', '=', userId)
      .select([
        'ss.id',
        'ss.name',
        'ss.node_type',
        'ss.parent_id',
        'parent.name as parent_name',
        'ss.description',
        'ss.aliases',
        'ss.status',
        'ss.reviewed_by',
        'reviewer_profile.display_name as reviewer_name',
        'ss.reviewed_at',
        'ss.rejection_reason',
        'ss.created_at',
        'ss.updated_at'
      ])
      .orderBy('ss.created_at', 'desc')
      .execute();

    res.json({
      data: suggestions
    });
  } catch (error: any) {
    console.error('[system-suggestions] Erro ao buscar sugestões:', error);
    res.status(500).json({
      error: 'Erro ao buscar sugestões',
      message: error.message
    });
  }
});

export default router;
