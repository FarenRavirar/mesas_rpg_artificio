"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const sourceService_1 = require("../services/aggregator/sourceService");
const importFromExporterService_1 = require("../services/aggregator/importFromExporterService");
const exportService_1 = require("../services/aggregator/exportService");
const router = (0, express_1.Router)();
// Não aplicar authMiddleware globalmente - cada rota decide se precisa
const ALLOWED_PUBLISH_MODES = ['manual_review', 'auto_publish'];
const asNonEmptyString = (value) => {
    if (typeof value !== 'string')
        return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};
const asBoolean = (value) => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true')
            return true;
        if (normalized === 'false')
            return false;
    }
    return null;
};
const parsePublishMode = (value) => {
    if (typeof value !== 'string')
        return null;
    if (ALLOWED_PUBLISH_MODES.includes(value)) {
        return value;
    }
    return null;
};
const parseDryRun = (value) => {
    const parsed = asBoolean(value);
    return parsed === true;
};
const extractPayload = (body) => {
    if (!body || typeof body !== 'object')
        return body;
    const maybePayload = body.payload;
    return maybePayload ?? body;
};
// GET /api/v1/aggregator/sources
router.get('/sources', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const sources = await sourceService_1.sourceService.list();
        return res.json({ data: sources });
    }
    catch (error) {
        console.error('[GET /aggregator/sources]', error);
        return res.status(500).json({ error: 'Erro ao listar sources do agregador.' });
    }
});
// POST /api/v1/aggregator/sources
router.post('/sources', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
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
        const created = await sourceService_1.sourceService.create({
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
    }
    catch (error) {
        console.error('[POST /aggregator/sources]', error);
        return res.status(500).json({ error: 'Erro ao criar source do agregador.' });
    }
});
// PUT /api/v1/aggregator/sources/:id
router.put('/sources/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
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
        const updated = await sourceService_1.sourceService.update(id, {
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
    }
    catch (error) {
        console.error('[PUT /aggregator/sources/:id]', error);
        return res.status(500).json({ error: 'Erro ao atualizar source do agregador.' });
    }
});
// PATCH /api/v1/aggregator/sources/:id/enabled
router.patch('/sources/:id/enabled', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { id } = req.params;
    const enabled = asBoolean(req.body?.enabled);
    if (enabled === null) {
        return res.status(400).json({ error: 'enabled deve ser boolean.' });
    }
    try {
        const updated = await sourceService_1.sourceService.setEnabled(id, enabled);
        if (!updated) {
            return res.status(404).json({ error: 'Source não encontrada.' });
        }
        return res.json({ data: updated });
    }
    catch (error) {
        console.error('[PATCH /aggregator/sources/:id/enabled]', error);
        return res.status(500).json({ error: 'Erro ao alterar status da source.' });
    }
});
// POST /api/v1/aggregator/import/file
router.post('/import/file', async (req, res) => {
    const sourceId = asNonEmptyString(req.body?.sourceId) ?? undefined;
    const dryRun = parseDryRun(req.body?.dryRun);
    const payload = extractPayload(req.body);
    try {
        const summary = await importFromExporterService_1.importFromExporterService.importPayload({
            payload,
            sourceId,
            dryRun,
        });
        return res.json({ data: summary });
    }
    catch (error) {
        console.error('[POST /aggregator/import/file]', error);
        return res.status(400).json({ error: error?.message ?? 'Falha ao importar payload do exporter.' });
    }
});
// POST /api/v1/aggregator/import/source/:id/run
router.post('/import/source/:id/run', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { id } = req.params;
    const dryRun = parseDryRun(req.body?.dryRun);
    const payload = extractPayload(req.body);
    try {
        const summary = await importFromExporterService_1.importFromExporterService.importPayload({
            payload,
            sourceId: id,
            dryRun,
        });
        return res.json({ data: summary });
    }
    catch (error) {
        console.error('[POST /aggregator/import/source/:id/run]', error);
        return res.status(400).json({ error: error?.message ?? 'Falha ao executar importação da source.' });
    }
});
// GET /api/v1/aggregator/exports/day
router.get('/exports/day', async (req, res) => {
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    try {
        const data = await exportService_1.exportService.getDailyAccepted(date);
        return res.json({ data });
    }
    catch (error) {
        console.error('[GET /aggregator/exports/day]', error);
        return res.status(400).json({ error: error?.message ?? 'Falha ao gerar exportação diária.' });
    }
});
// GET /api/v1/aggregator/exports/day.txt
router.get('/exports/day.txt', async (req, res) => {
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    try {
        const data = await exportService_1.exportService.getDailyAccepted(date);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(data.text);
    }
    catch (error) {
        console.error('[GET /aggregator/exports/day.txt]', error);
        return res.status(400).json({ error: error?.message ?? 'Falha ao gerar exportação TXT.' });
    }
});
// PATCH /api/v1/aggregator/candidates/reject-all
router.patch('/candidates/reject-all', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const { db } = await Promise.resolve().then(() => __importStar(require('../db')));
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
    }
    catch (error) {
        console.error('[PATCH /aggregator/candidates/reject-all]', error);
        return res.status(500).json({ error: 'Erro ao rejeitar candidatos em lote.' });
    }
});
// Desfazer rejeição de candidato (admin only)
router.patch('/candidates/:id/undo-rejection', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'ID do candidato é obrigatório.' });
    }
    try {
        const { db } = await Promise.resolve().then(() => __importStar(require('../db')));
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
    }
    catch (error) {
        console.error('[PATCH /aggregator/candidates/:id/undo-rejection]', error);
        return res.status(500).json({ error: 'Erro ao desfazer rejeição.' });
    }
});
// POST /api/v1/aggregator/candidates/:id/approve
// Aprova um candidato e cria uma mesa a partir dele
router.post('/candidates/:id/approve', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    if (!id) {
        return res.status(400).json({ error: 'ID do candidato é obrigatório.' });
    }
    try {
        const { db } = await Promise.resolve().then(() => __importStar(require('../db')));
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
        const parsedData = candidate.parsed_json;
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
        }
        else if (mergedData.isPaid === true) {
            priceType = 'paga';
        }
        // CORREÇÃO DT-05: Buscar scenario_id se setting_name existir
        let scenarioId = null;
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
            const tableData = {
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
                    .values(mergedData.contacts.map((contact, index) => ({
                    table_id: insertedTable.id,
                    channel: contact.channel || 'outros',
                    value: contact.value || '',
                    label: contact.label || null,
                    discord_server_url: contact.extra_url || contact.discord_server_url || null,
                    sort_order: index,
                })))
                    .execute();
            }
            // CORREÇÃO DT-01: Persistir schedules
            if (mergedData.schedules && Array.isArray(mergedData.schedules) && mergedData.schedules.length > 0) {
                await trx
                    .insertInto('table_schedules')
                    .values(mergedData.schedules.map((schedule, index) => ({
                    table_id: insertedTable.id,
                    day_of_week: schedule.day_of_week,
                    start_time: schedule.start_time,
                    end_time: schedule.end_time || null,
                    frequency: schedule.frequency || 'semanal',
                    slots_per_session: schedule.slots_per_session || null,
                    is_ongoing: schedule.is_ongoing ?? false,
                    notes: schedule.notes || null,
                    sort_order: index,
                })))
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
    }
    catch (error) {
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
exports.default = router;
