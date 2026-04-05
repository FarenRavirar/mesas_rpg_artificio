import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { sourceService } from '../services/aggregator/sourceService';
import { importFromExporterService } from '../services/aggregator/importFromExporterService';
import { exportService } from '../services/aggregator/exportService';
import type { AggregatorPublishMode } from '../db/types';

const router = Router();

// Não aplicar authMiddleware globalmente - cada rota decide se precisa

const ALLOWED_PUBLISH_MODES: AggregatorPublishMode[] = ['manual_review', 'auto_publish'];

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const asBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return null;
};

const parsePublishMode = (value: unknown): AggregatorPublishMode | null => {
  if (typeof value !== 'string') return null;
  if (ALLOWED_PUBLISH_MODES.includes(value as AggregatorPublishMode)) {
    return value as AggregatorPublishMode;
  }

  return null;
};

const parseDryRun = (value: unknown): boolean => {
  const parsed = asBoolean(value);
  return parsed === true;
};

const extractPayload = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body;

  const maybePayload = (body as { payload?: unknown }).payload;
  return maybePayload ?? body;
};

// GET /api/v1/aggregator/sources
router.get('/sources', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const sources = await sourceService.list();
    return res.json({ data: sources });
  } catch (error: any) {
    console.error('[GET /aggregator/sources]', error);
    return res.status(500).json({ error: 'Erro ao listar sources do agregador.' });
  }
});

// POST /api/v1/aggregator/sources
router.post('/sources', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const name = asNonEmptyString(req.body?.name);
  const serverId = asNonEmptyString(req.body?.serverId);
  const channelId = asNonEmptyString(req.body?.channelId);

  if (!name || !serverId || !channelId) {
    return res.status(400).json({
      error: 'Campos obrigatórios ausentes: name, serverId e channelId.',
    });
  }

  const publishModeRaw = req.body?.publishMode;
  const publishMode = publishModeRaw === undefined ? undefined : parsePublishMode(publishModeRaw);

  if (publishModeRaw !== undefined && !publishMode) {
    return res.status(400).json({ error: 'publishMode inválido. Use manual_review ou auto_publish.' });
  }

  const enabledRaw = req.body?.enabled;
  const allowPaidRaw = req.body?.allowPaid;

  const enabled = enabledRaw === undefined ? undefined : asBoolean(enabledRaw);
  const allowPaid = allowPaidRaw === undefined ? undefined : asBoolean(allowPaidRaw);

  if (enabledRaw !== undefined && enabled === null) {
    return res.status(400).json({ error: 'enabled deve ser boolean.' });
  }

  if (allowPaidRaw !== undefined && allowPaid === null) {
    return res.status(400).json({ error: 'allowPaid deve ser boolean.' });
  }

  try {
    const created = await sourceService.create({
      name,
      serverId,
      channelId,
      enabled: enabled ?? undefined,
      allowPaid: allowPaid ?? undefined,
      publishMode: publishMode ?? undefined,
      defaultTimezone: asNonEmptyString(req.body?.defaultTimezone) ?? undefined,
      notes: req.body?.notes === null ? null : asNonEmptyString(req.body?.notes),
    });

    return res.status(201).json({ data: created });
  } catch (error: any) {
    console.error('[POST /aggregator/sources]', error);
    return res.status(500).json({ error: 'Erro ao criar source do agregador.' });
  }
});

// PUT /api/v1/aggregator/sources/:id
router.put('/sources/:id', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const { id } = req.params;

  const publishModeRaw = req.body?.publishMode;
  const publishMode = publishModeRaw === undefined ? undefined : parsePublishMode(publishModeRaw);
  if (publishModeRaw !== undefined && !publishMode) {
    return res.status(400).json({ error: 'publishMode inválido. Use manual_review ou auto_publish.' });
  }

  const enabledRaw = req.body?.enabled;
  const allowPaidRaw = req.body?.allowPaid;

  const enabled = enabledRaw === undefined ? undefined : asBoolean(enabledRaw);
  const allowPaid = allowPaidRaw === undefined ? undefined : asBoolean(allowPaidRaw);

  if (enabledRaw !== undefined && enabled === null) {
    return res.status(400).json({ error: 'enabled deve ser boolean.' });
  }

  if (allowPaidRaw !== undefined && allowPaid === null) {
    return res.status(400).json({ error: 'allowPaid deve ser boolean.' });
  }

  try {
    const updated = await sourceService.update(id, {
      name: req.body?.name === undefined ? undefined : asNonEmptyString(req.body?.name) ?? '',
      serverId: req.body?.serverId === undefined ? undefined : asNonEmptyString(req.body?.serverId) ?? '',
      channelId: req.body?.channelId === undefined ? undefined : asNonEmptyString(req.body?.channelId) ?? '',
      enabled: enabled ?? undefined,
      allowPaid: allowPaid ?? undefined,
      publishMode: publishMode ?? undefined,
      defaultTimezone: req.body?.defaultTimezone === undefined
        ? undefined
        : asNonEmptyString(req.body?.defaultTimezone) ?? '',
      notes: req.body?.notes === undefined
        ? undefined
        : req.body?.notes === null
          ? null
          : asNonEmptyString(req.body?.notes),
    });

    if (!updated) {
      return res.status(404).json({ error: 'Source não encontrada.' });
    }

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PUT /aggregator/sources/:id]', error);
    return res.status(500).json({ error: 'Erro ao atualizar source do agregador.' });
  }
});

// PATCH /api/v1/aggregator/sources/:id/enabled
router.patch('/sources/:id/enabled', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const enabled = asBoolean(req.body?.enabled);

  if (enabled === null) {
    return res.status(400).json({ error: 'enabled deve ser boolean.' });
  }

  try {
    const updated = await sourceService.setEnabled(id, enabled);
    if (!updated) {
      return res.status(404).json({ error: 'Source não encontrada.' });
    }

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PATCH /aggregator/sources/:id/enabled]', error);
    return res.status(500).json({ error: 'Erro ao alterar status da source.' });
  }
});

// POST /api/v1/aggregator/import/file
router.post('/import/file', async (req: Request, res: Response) => {
  const sourceId = asNonEmptyString(req.body?.sourceId) ?? undefined;
  const dryRun = parseDryRun(req.body?.dryRun);
  const payload = extractPayload(req.body);

  try {
    const summary = await importFromExporterService.importPayload({
      payload,
      sourceId,
      dryRun,
    });

    return res.json({ data: summary });
  } catch (error: any) {
    console.error('[POST /aggregator/import/file]', error);
    return res.status(400).json({ error: error?.message ?? 'Falha ao importar payload do exporter.' });
  }
});

// POST /api/v1/aggregator/import/source/:id/run
router.post('/import/source/:id/run', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const dryRun = parseDryRun(req.body?.dryRun);
  const payload = extractPayload(req.body);

  try {
    const summary = await importFromExporterService.importPayload({
      payload,
      sourceId: id,
      dryRun,
    });

    return res.json({ data: summary });
  } catch (error: any) {
    console.error('[POST /aggregator/import/source/:id/run]', error);
    return res.status(400).json({ error: error?.message ?? 'Falha ao executar importação da source.' });
  }
});

// GET /api/v1/aggregator/exports/day
router.get('/exports/day', async (req: Request, res: Response) => {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;

  try {
    const data = await exportService.getDailyAccepted(date);
    return res.json({ data });
  } catch (error: any) {
    console.error('[GET /aggregator/exports/day]', error);
    return res.status(400).json({ error: error?.message ?? 'Falha ao gerar exportação diária.' });
  }
});

// GET /api/v1/aggregator/exports/day.txt
router.get('/exports/day.txt', async (req: Request, res: Response) => {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;

  try {
    const data = await exportService.getDailyAccepted(date);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(data.text);
  } catch (error: any) {
    console.error('[GET /aggregator/exports/day.txt]', error);
    return res.status(400).json({ error: error?.message ?? 'Falha ao gerar exportação TXT.' });
  }
});

// PATCH /api/v1/aggregator/candidates/reject-all
router.patch('/candidates/reject-all', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { db } = await import('../db');
    
    // Rejeitar todos os candidatos com editorial_status = 'awaiting_review'
    const result = await db
      .updateTable('aggregator_import_candidates')
      .set({
        editorial_status: 'rejected',
        rejection_reason: 'Rejeitado em lote pelo admin',
        updated_at: new Date(),
      })
      .where('editorial_status', '=', 'awaiting_review')
      .executeTakeFirst();

    const rejectedCount = Number(result.numUpdatedRows || 0);

    return res.json({ 
      data: { 
        rejectedCount,
        message: `${rejectedCount} candidato(s) rejeitado(s) com sucesso.`
      } 
    });
  } catch (error: any) {
    console.error('[PATCH /aggregator/candidates/reject-all]', error);
    return res.status(500).json({ error: 'Erro ao rejeitar candidatos em lote.' });
  }
});

// Desfazer rejeição de candidato (admin only)
router.patch('/candidates/:id/undo-rejection', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID do candidato é obrigatório.' });
  }

  try {
    const { db } = await import('../db');
    
    // Verificar se o candidato existe e está rejeitado
    const candidate = await db
      .selectFrom('aggregator_import_candidates')
      .select(['id', 'editorial_status'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!candidate) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    if (candidate.editorial_status !== 'rejected') {
      return res.status(400).json({ error: 'Apenas candidatos rejeitados podem ser restaurados.' });
    }

    // Reverter status para awaiting_review
    await db
      .updateTable('aggregator_import_candidates')
      .set({
        editorial_status: 'awaiting_review',
        rejection_reason: null,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .executeTakeFirst();

    return res.json({ 
      data: { 
        message: 'Rejeição desfeita com sucesso. Candidato retornou para revisão.' 
      } 
    });
  } catch (error: any) {
    console.error('[PATCH /aggregator/candidates/:id/undo-rejection]', error);
    return res.status(500).json({ error: 'Erro ao desfazer rejeição.' });
  }
});

// POST /api/v1/aggregator/candidates/:id/approve
// Aprova um candidato e cria uma mesa a partir dele
router.post('/candidates/:id/approve', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID do candidato é obrigatório.' });
  }

  try {
    const { db } = await import('../db');
    
    // Buscar candidato
    const candidate = await db
      .selectFrom('aggregator_import_candidates')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!candidate) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    if (candidate.editorial_status === 'accepted' && candidate.published_table_id) {
      return res.status(400).json({ 
        error: 'Candidato já foi aprovado.',
        tableId: candidate.published_table_id 
      });
    }

    // Extrair dados do parsed_json
    const parsedData = candidate.parsed_json as any;
    
    // Criar mesa usando os mesmos campos que POST /api/v1/gm/tables
    const tableData: any = {
      title: parsedData.title || 'Mesa Importada',
      description: parsedData.description || parsedData.synopsis_narrative || '',
      type: parsedData.type || 'oneshot',
      modality: parsedData.modality || 'online',
      system_id: parsedData.system_id || null,
      price_type: parsedData.price_type || 'free',
      slots_total: parsedData.slots_total ? Number(parsedData.slots_total) : null,
      language: parsedData.language || 'pt-BR',
      publisher_role: 'gm',
      origin: 'imported',
      gm_id: req.user!.userId,
      status: 'active',
      synopsis_narrative: parsedData.synopsis_narrative || null,
      benefits_text: parsedData.benefits_text || null,
      gm_bio: parsedData.gm_bio || null,
      setting_name: parsedData.setting_name || null,
      setting_styles: parsedData.setting_styles || null,
      rules_notes: parsedData.rules_notes || null,
      banner_url: parsedData.banner_url || null,
      is_covil: parsedData.is_covil || false,
      starts_at: parsedData.starts_at || null,
      frequency: parsedData.frequency || null,
      city: parsedData.city || null,
      state: parsedData.state || null,
    };

    // Inserir mesa
    const insertedTable = await db
      .insertInto('tables')
      .values(tableData)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Atualizar candidato
    await db
      .updateTable('aggregator_import_candidates')
      .set({
        editorial_status: 'accepted',
        published_table_id: insertedTable.id,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .executeTakeFirst();

    return res.status(201).json({ 
      data: { 
        message: 'Candidato aprovado e mesa criada com sucesso.',
        tableId: insertedTable.id,
        slug: insertedTable.slug
      } 
    });
  } catch (error: any) {
    console.error('[POST /aggregator/candidates/:id/approve]', error);
    return res.status(500).json({ error: 'Erro ao aprovar candidato: ' + error.message });
  }
});

export default router;
