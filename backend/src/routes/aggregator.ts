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
  const userId = (req as any).user.userId;

  if (!id) {
    return res.status(400).json({ error: 'ID do candidato é obrigatório.' });
  }

  try {
    const { db } = await import('../db');
    
    // CORREÇÃO DT-02: Buscar gm_profile do admin que está aprovando
    const adminGmProfile = await db
      .selectFrom('gm_profiles')
      .select(['id'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!adminGmProfile) {
      return res.status(403).json({ error: 'Admin precisa ter perfil de mestre para aprovar candidatos.' });
    }
    
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
    
    // CORREÇÃO DT-09: Merge de overrides editados pelo admin (req.body tem prioridade)
    const overrides = req.body || {};
    const mergedData = { ...parsedData, ...overrides };
    
    console.log('[POST /aggregator/candidates/:id/approve] Overrides recebidos:', {
      hasOverrides: Object.keys(overrides).length > 0,
      overrideKeys: Object.keys(overrides),
    });
    
    // CORREÇÃO DT-04: Validar campos obrigatórios
    if (!mergedData.title || !mergedData.title.trim()) {
      return res.status(400).json({ error: 'Candidato sem título válido. Não pode ser aprovado.' });
    }

    // CORREÇÃO DT-07: Validar description com fallback seguro
    const description = mergedData.description || mergedData.synopsis_narrative || mergedData.synopsis || '';
    if (!description.trim()) {
      return res.status(400).json({ error: 'Candidato sem descrição válida. Não pode ser aprovado.' });
    }

    // CORREÇÃO DT-03: Mapear price_type corretamente
    let priceType = 'gratuita';
    if (mergedData.price_type === 'paga' || mergedData.price_type === 'paid') {
      priceType = 'paga';
    } else if (mergedData.isPaid === true) {
      priceType = 'paga';
    }

    // CORREÇÃO DT-05: Buscar scenario_id se setting_name existir
    let scenarioId: string | null = null;
    if (mergedData.setting_name && typeof mergedData.setting_name === 'string') {
      const scenario = await db
        .selectFrom('scenarios')
        .select(['id'])
        .where('name', 'ilike', mergedData.setting_name.trim())
        .executeTakeFirst();
      
      if (scenario) {
        scenarioId = scenario.id;
      }
    }

    // CORREÇÃO DT-06: Log estruturado antes de criar mesa
    console.log('[POST /aggregator/candidates/:id/approve] Criando mesa:', {
      candidateId: id,
      title: mergedData.title,
      hasContacts: !!mergedData.contacts,
      hasSchedules: !!mergedData.schedules,
      priceType,
      scenarioId,
      adminGmProfileId: adminGmProfile.id,
    });

    // Criar mesa em transação
    const result = await db.transaction().execute(async (trx) => {
      // CORREÇÃO DT-01, DT-12, DT-13, DT-14: Persistir TODOS os campos extraídos
      const tableData: any = {
        title: mergedData.title.trim(),
        description: description.trim(),
        type: mergedData.type || 'oneshot',
        modality: mergedData.modality || 'online',
        system_id: mergedData.system_id || null,
        scenario_id: scenarioId,
        price_type: priceType,
        slots_total: mergedData.slots_total ? Number(mergedData.slots_total) : 4,
        language: mergedData.language || 'Português',
        // CORREÇÃO DT-15: publisher_role correto para importados
        publisher_role: 'announcer',
        actual_gm_name: mergedData.actual_gm_name || mergedData.masterText || mergedData.recruiterName || 'Não informado',
        origin: 'imported',
        gm_id: adminGmProfile.id,
        status: 'active',
        // Campos editoriais (REQ-28)
        synopsis_narrative: mergedData.synopsis_narrative || null,
        benefits_text: mergedData.benefits_text || null,
        gm_bio: mergedData.gm_bio || null,
        // Cenário e estilos (REQ-28)
        setting_name: mergedData.setting_name || null,
        setting_styles: Array.isArray(mergedData.setting_styles) ? mergedData.setting_styles : null,
        // Campos básicos
        rules_notes: mergedData.rules_notes || null,
        banner_url: mergedData.banner_url || null,
        is_covil: mergedData.is_covil || false,
        starts_at: mergedData.starts_at ? new Date(mergedData.starts_at) : null,
        // CORREÇÃO DT-13: Persistir frequency
        frequency: mergedData.frequency || null,
        frequency_custom: mergedData.frequency_custom || null,
        city: mergedData.city || null,
        state: mergedData.state || null,
        // CORREÇÃO DT-14: Campos avançados (REQ-26)
        master_display_name: mergedData.master_display_name || null,
        campaign_length: mergedData.campaign_length || null,
        level_range: mergedData.level_range || null,
        billing_text: mergedData.billing_text || mergedData.priceText || null,
        session_zero_free: mergedData.session_zero_free || false,
        synopsis: mergedData.synopsis || null,
        style_text: mergedData.style_text || null,
        listing_excerpt: mergedData.listing_excerpt || null,
        technical_requirements: mergedData.technical_requirements || null,
        // CORREÇÃO DT-12: Requisitos técnicos
        requires_pc: mergedData.requires_pc || false,
        requires_camera: mergedData.requires_camera || false,
        requires_microphone: mergedData.requires_microphone || false,
      };

      const insertedTable = await trx
        .insertInto('tables')
        .values(tableData)
        .returningAll()
        .executeTakeFirstOrThrow();

      // CORREÇÃO DT-01: Persistir contacts
      if (mergedData.contacts && Array.isArray(mergedData.contacts) && mergedData.contacts.length > 0) {
        await trx
          .insertInto('table_contacts')
          .values(
            mergedData.contacts.map((contact: any, index: number) => ({
              table_id: insertedTable.id,
              channel: contact.channel || 'outros',
              value: contact.value || '',
              label: contact.label || null,
              discord_server_url: contact.extra_url || contact.discord_server_url || null,
              sort_order: index,
            }))
          )
          .execute();
      }

      // CORREÇÃO DT-01: Persistir schedules
      if (mergedData.schedules && Array.isArray(mergedData.schedules) && mergedData.schedules.length > 0) {
        await trx
          .insertInto('table_schedules')
          .values(
            mergedData.schedules.map((schedule: any, index: number) => ({
              table_id: insertedTable.id,
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time || null,
              frequency: schedule.frequency || 'semanal',
              slots_per_session: schedule.slots_per_session || null,
              is_ongoing: schedule.is_ongoing ?? false,
              notes: schedule.notes || null,
              sort_order: index,
            }))
          )
          .execute();
      }

      // Atualizar candidato
      await trx
        .updateTable('aggregator_import_candidates')
        .set({
          editorial_status: 'accepted',
          published_table_id: insertedTable.id,
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .executeTakeFirst();

      return insertedTable;
    });

    // CORREÇÃO DT-06: Log estruturado de sucesso
    console.log('[POST /aggregator/candidates/:id/approve] Mesa criada com sucesso:', {
      tableId: result.id,
      slug: result.slug,
      candidateId: id,
    });

    return res.status(201).json({ 
      data: { 
        message: 'Candidato aprovado e mesa criada com sucesso.',
        tableId: result.id,
        slug: result.slug
      } 
    });
  } catch (error: any) {
    // CORREÇÃO DT-06: Log estruturado de erro
    console.error('[POST /aggregator/candidates/:id/approve] Erro ao aprovar candidato:', {
      candidateId: id,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetail: error.detail,
      errorConstraint: error.constraint,
      stack: error.stack,
    });
    
    // Retornar erro específico quando possível
    if (error.code === '23502') {
      return res.status(400).json({ error: `Campo obrigatório ausente: ${error.column || 'desconhecido'}` });
    }
    
    if (error.code === '23503') {
      return res.status(400).json({ error: `Referência inválida: ${error.detail || 'verifique system_id ou scenario_id'}` });
    }
    
    return res.status(500).json({ error: 'Erro ao aprovar candidato: ' + error.message });
  }
});

export default router;
