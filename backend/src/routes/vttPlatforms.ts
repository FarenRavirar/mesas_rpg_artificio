import { Router } from 'express';
import { sql } from 'kysely'; // CORREÇÃO G03: Import sql para queries case-insensitive
import { db } from '../db';
import { authMiddleware } from '../middleware/auth'; // CORREÇÃO A02: Import middleware

const router = Router();

/**
 * GET /api/v1/vtt-platforms
 * Lista todas as plataformas VTT ativas
 * Público - não requer autenticação
 */
router.get('/', async (req, res) => {
  try {
    const platforms = await db
      .selectFrom('vtt_platforms')
      .select([
        'id',
        'name',
        'slug',
        'logo_filename',
        'website_url',
        'sort_order',
      ])
      .where('is_active', '=', true)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
      .execute();

    return res.json({ data: platforms });
  } catch (error) {
    console.error('[GET /vtt-platforms] Erro ao buscar plataformas:', error);
    return res.status(500).json({ error: 'Erro ao buscar plataformas VTT.' });
  }
});

/**
 * POST /api/v1/vtt-platforms/suggest
 * Mestre sugere nova VTT personalizada
 * CORREÇÃO A02: Protegido com authMiddleware
 */
router.post('/suggest', authMiddleware, async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  const { suggested_name, table_id } = req.body;

  if (!suggested_name || typeof suggested_name !== 'string' || suggested_name.trim().length === 0) {
    return res.status(400).json({ error: 'Nome da plataforma é obrigatório.' });
  }

  if (suggested_name.trim().length > 100) {
    return res.status(400).json({ error: 'Nome da plataforma muito longo (máximo 100 caracteres).' });
  }

  try {
    // CORREÇÃO G03: Validar se VTT já existe no banco
    const existingVtt = await db
      .selectFrom('vtt_platforms')
      .select('name')
      .where(sql`LOWER(name)`, '=', suggested_name.trim().toLowerCase())
      .executeTakeFirst();

    if (existingVtt) {
      return res.status(409).json({ 
        error: `A plataforma "${existingVtt.name}" já existe no sistema.` 
      });
    }

    // CORREÇÃO G03: Validar se já existe sugestão pendente
    const existingSuggestion = await db
      .selectFrom('vtt_platform_suggestions')
      .select('suggested_name')
      .where(sql`LOWER(suggested_name)`, '=', suggested_name.trim().toLowerCase())
      .where('status', '=', 'pending')
      .executeTakeFirst();

    if (existingSuggestion) {
      return res.status(409).json({ 
        error: `Já existe uma sugestão pendente para "${existingSuggestion.suggested_name}".` 
      });
    }

    const suggestion = await db
      .insertInto('vtt_platform_suggestions')
      .values({
        suggested_name: suggested_name.trim(),
        suggested_by_user_id: userId,
        table_id: table_id || null,
        status: 'pending',
      })
      .returning(['id', 'suggested_name', 'created_at'])
      .executeTakeFirst();

    console.log(`[POST /vtt-platforms/suggest] Nova sugestão: "${suggested_name}" por user ${userId}`);

    return res.status(201).json({ 
      data: suggestion,
      message: 'Sugestão enviada com sucesso! Será analisada pela equipe.' 
    });
  } catch (error) {
    console.error('[POST /vtt-platforms/suggest] Erro ao criar sugestão:', error);
    return res.status(500).json({ error: 'Erro ao enviar sugestão.' });
  }
});

export default router;
