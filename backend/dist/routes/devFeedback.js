"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const db_1 = require("../db");
const devFeedbackValidator_1 = require("../validators/devFeedbackValidator");
const cloudinary_1 = require("../services/cloudinary");
const adminNotifications_1 = require("../services/adminNotifications");
const activityLogger_1 = require("../services/activityLogger");
const router = (0, express_1.Router)();
// POST /api/v1/dev-feedback - relato de problema ou sugestao (publico, anonimo permitido)
router.post('/', rateLimit_1.strictRateLimiter, auth_1.optionalAuth, async (req, res) => {
    try {
        const parsed = (0, devFeedbackValidator_1.parseDevFeedbackInput)(req.body);
        if (!parsed.ok) {
            return res.status(400).json({ error: parsed.error });
        }
        const input = parsed.value;
        const userId = req.user?.userId ?? null;
        const reporterRole = req.user?.role ?? 'visitor';
        // Upload de screenshot e nao-fatal: falha grava o feedback sem imagem (FR-008).
        let screenshotUrl = null;
        if (input.screenshot) {
            try {
                const result = await (0, cloudinary_1.uploadScreenshotToCloudinary)(input.screenshot);
                screenshotUrl = result.secure_url;
            }
            catch (error) {
                console.warn('[devFeedback] Falha no upload da captura de tela; gravando sem imagem.', error);
            }
        }
        const created = await db_1.db
            .insertInto('dev_feedback')
            .values({
            user_id: userId,
            reporter_role: reporterRole,
            contact_email: input.contact_email,
            kind: input.kind,
            title: input.title,
            description: input.description,
            page_url: input.page_url,
            route_path: input.route_path,
            page_title: input.page_title,
            environment: input.environment,
            user_agent: input.user_agent,
            viewport: input.viewport,
            console_errors: JSON.stringify(input.console_errors),
            network_errors: JSON.stringify(input.network_errors),
            screenshot_url: screenshotUrl,
        })
            .returning(['id', 'kind', 'status', 'created_at'])
            .executeTakeFirstOrThrow();
        // Notificacao e auditoria fora de transacao (regra reforcada do project-state).
        const kindLabel = input.kind === 'bug' ? 'Problema' : 'Sugestao';
        await (0, adminNotifications_1.notifyAdmins)({
            type: 'dev_feedback',
            title: `Novo feedback de desenvolvimento (${kindLabel})`,
            message: `${input.title}${input.route_path ? ` — ${input.route_path}` : ''}`,
            action_url: '/gestao',
            metadata: {
                feedback_id: created.id,
                kind: input.kind,
                route_path: input.route_path,
            },
            excludeUserId: userId,
        });
        void (0, activityLogger_1.logActivity)({
            actorId: userId,
            actorRole: req.user?.role ?? null,
            action: 'dev_feedback.created',
            entityType: 'dev_feedback',
            entityId: created.id,
            entityLabel: input.title,
            summary: `${kindLabel} reportado em ${input.route_path ?? 'pagina nao informada'}.`,
            metadata: {
                kind: input.kind,
                route_path: input.route_path,
                environment: input.environment,
                has_screenshot: Boolean(screenshotUrl),
                console_error_count: input.console_errors.length,
                network_error_count: input.network_errors.length,
            },
        });
        return res.status(201).json({ data: created });
    }
    catch (error) {
        console.error('[POST /dev-feedback]', error);
        return res.status(500).json({ error: 'Erro ao registrar feedback.' });
    }
});
exports.default = router;
