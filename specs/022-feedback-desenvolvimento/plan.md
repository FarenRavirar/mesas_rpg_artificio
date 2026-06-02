# Plan 022 - Feedback de Desenvolvimento

## Contexto Atual

Arquivos relevantes (confirmados na investigacao):

- `frontend/src/components/AppShell.tsx` (envolve todas as rotas; ponto de montagem do FAB)
- `frontend/src/App.tsx` (rotas; `ErrorBoundary` envolve so `/perfil` hoje)
- `frontend/src/main.tsx` (bootstrap do React)
- `frontend/src/contexts/AuthContext.tsx` (`useAuth`: user.id, user.role, isAuthenticated)
- `frontend/src/services/logger.ts` (infra `ErrorTracker`/`logger`/`setErrorTracker`, preparada para Sentry)
- `frontend/src/services/apiClient.ts` (`api.post`, credentials, retry)
- `frontend/src/components/ui/ConfirmDialog.tsx` (padrao de modal: `createPortal`, focus trap, ESC/Enter)
- `frontend/src/pages/GestaoPage.tsx` (abas via `activeTab`)
- `frontend/src/index.css` (tokens: `--color-artificio-orange`)
- `backend/src/server.ts` (registro de rotas; `globalRateLimiter`, `csrfProtection`)
- `backend/src/middleware/auth.ts` (`optionalAuth:84`, `requireRole`)
- `backend/src/middleware/rateLimit.ts` (`strictRateLimiter:39`, 10/15min)
- `backend/src/middleware/csrfProtection.ts` (anon e same-origin passam)
- `backend/src/services/adminNotifications.ts` (`notifyAdmins`, nao-transacional; union `AdminNotificationType`)
- `backend/src/services/activityLogger.ts` (`logActivity`; tipos `ActivityAction`/`ActivityEntityType`)
- `backend/src/services/cloudinary.ts` (`uploadImageToCloudinary:20`; atencao: forca crop 1200x650)
- `backend/src/validators/tableValidators.ts` (padrao zod)
- `backend/src/db/types.ts` (`interface Database`, tabelas Kysely)
- `backend/src/routes/scenarioSuggestions.ts` + `scenarioSuggestionsAdmin.ts` (padrao rota publica + admin + `resolveActorName`)
- `database/migration_103_scenario_suggestions.sql` (padrao de migration de tabela)
- `database/changelogs.json`

Estado observado: proxima migration = 125. Proxima branch = `feat/022-feedback-desenvolvimento`.

## Decisao de Reuso Central

O coletor de diagnostico **implementa `ErrorTracker`** (de `logger.ts`) e e registrado via `setErrorTracker(...)`, para que todo `logger.error/.warn` ja existente alimente o buffer sem sistema paralelo. Adicionalmente instala hooks globais (`window.onerror`, `unhandledrejection`, wrap de `console.error/warn`, patch de `window.fetch`), porque muitos pontos do app usam `console`/`fetch` cru e nao passam por `logger`/`apiClient`.

## Decisoes Fechadas

- Acesso anonimo + logado (`user_id` nullable).
- `contact_email` opt-in para anonimo.
- Screenshot via html2canvas, apenas viewport.
- Captura: console + erros globais + falhas de rede (>= 400).
- FAB em todas as paginas exceto `/login` e `/auth/callback`.
- Auditoria de triagem: colunas em `dev_feedback` (sem tabela paralela de eventos).
- Screenshot embutido no proprio POST como data URI (backend faz o upload); evita rota authed separada e funciona para anonimo.
- Cloudinary: criar `uploadScreenshotToCloudinary` com `crop:'limit'`, `width:1600`, `quality:'auto:eco'` (nao reutilizar o crop 1200x650 do banner, que distorce screenshot).
- `environment` derivado de hostname (`mesasbeta.*` -> beta, `mesas.*` -> production) com fallback `import.meta.env.MODE`.

## API Proposta

### POST publico

`POST /api/v1/dev-feedback` (middlewares: `strictRateLimiter`, `optionalAuth`)

Body:

```json
{
  "kind": "bug",
  "title": "Botao de publicar nao responde",
  "description": "Cliquei em publicar e nada aconteceu.",
  "contact_email": "opcional@exemplo.com",
  "page_url": "https://mesasbeta.artificiorpg.com/painel",
  "route_path": "/painel",
  "page_title": "Painel do Mestre",
  "environment": "beta",
  "user_agent": "Mozilla/5.0 ...",
  "viewport": "1366x768",
  "console_errors": [
    { "level": "error", "message": "TypeError: x is not a function", "ts": "2026-06-02T12:00:00Z" }
  ],
  "network_errors": [
    { "url": "/api/v1/gm/tables", "method": "POST", "status": 500, "ts": "2026-06-02T12:00:00Z" }
  ],
  "screenshot": "data:image/jpeg;base64,...",
  "include_screenshot": true,
  "include_diagnostics": true
}
```

Resposta `201`:

```json
{ "data": { "id": "uuid", "kind": "bug", "status": "new", "created_at": "..." } }
```

Regras:

- Validacao zod + normalizacao (etapa 3). Campos de contexto truncados server-side.
- `user_id = req.user?.userId ?? null`; `reporter_role = req.user?.role ?? 'visitor'`.
- `screenshot` so aceito como data URI `image/(png|jpeg|webp)`, com limite de tamanho; falha de upload nao derruba o registro.
- `notifyAdmins` e `logActivity` fora de transacao.

### GET admin

`GET /api/v1/admin/dev-feedback?status=&kind=` (middlewares: `authMiddleware`, `requireRole('admin')`)

Resposta:

```json
{
  "data": [
    {
      "id": "uuid",
      "kind": "bug",
      "title": "...",
      "description": "...",
      "reporter_name": "Fulano",
      "reporter_role": "player",
      "contact_email": null,
      "route_path": "/painel",
      "page_url": "...",
      "environment": "beta",
      "viewport": "1366x768",
      "user_agent": "...",
      "console_errors": [],
      "network_errors": [],
      "screenshot_url": "https://res.cloudinary.com/...",
      "status": "new",
      "admin_notes": null,
      "created_at": "..."
    }
  ]
}
```

### PATCH admin

`PATCH /api/v1/admin/dev-feedback/:id`

Body: `{ "status": "in_progress", "admin_notes": "Reproduzido no Chrome." }`

Regras: valida `status` no enum; grava `reviewed_by`/`reviewed_at`/`updated_at`; `logActivity`.

## Arquivos (Secao 3 - escopo de mudanca)

Backend:

- `database/migration_125_dev_feedback.sql` (novo)
- `backend/src/db/types.ts` (DevFeedbackTable + registro em Database + NotificationType)
- `backend/src/services/adminNotifications.ts` (union `AdminNotificationType` += `dev_feedback`)
- `backend/src/services/activityLogger.ts` (tipos += `dev_feedback.created`/`dev_feedback.updated`)
- `backend/src/services/cloudinary.ts` (uploadScreenshotToCloudinary)
- `backend/src/validators/devFeedbackValidator.ts` (novo) + `backend/src/validators/__tests__/devFeedbackValidator.test.ts` (novo)
- `backend/src/routes/devFeedback.ts` (novo)
- `backend/src/routes/devFeedbackAdmin.ts` (novo)
- `backend/src/server.ts` (registro das duas rotas)

Frontend:

- `frontend/package.json` (dep `html2canvas`)
- `frontend/src/lib/diagnostics.ts` (novo) + teste vitest
- `frontend/src/main.tsx` (chamar `installDiagnostics()`)
- `frontend/src/features/dev-feedback/FeedbackButton.tsx` (novo)
- `frontend/src/features/dev-feedback/FeedbackModal.tsx` (novo)
- `frontend/src/features/dev-feedback/devFeedbackApi.ts` (novo; normalizadores unknown + chamadas)
- `frontend/src/components/AppShell.tsx` (montar FAB)
- `frontend/src/pages/GestaoPage.tsx` (aba `dev`)
- `frontend/src/modules/admin/dev-feedback/DevFeedbackPanel.tsx` (novo)

Documentacao:

- `database/changelogs.json`
- `specs/022-feedback-desenvolvimento/{spec,plan,tasks,handoff}.md`
- `sessoes/26-06-02_1_feedback-desenvolvimento.md` + `sessoes/index.md`
- `.specify/memory/project-state.md` (ao fechar)

## Sequencia de Implementacao

1. Migration 125 (online-safe) + tipos DB.
2. Teste do validador (RED) -> validador zod/normalizador (GREEN).
3. `uploadScreenshotToCloudinary`.
4. Rota publica `POST /api/v1/dev-feedback` + registro no server.
5. Rota admin `GET`/`PATCH` + registro no server.
6. Diagnostics no frontend (buffer + ErrorTracker + hooks) + `installDiagnostics()` no main + teste.
7. Widget FAB + modal; montar no AppShell.
8. Aba "Desenvolvimento" + painel admin.
9. `changelogs.json`.
10. Builds/testes/lint; `git diff --check`.
11. Commit/push `dev`, Deploy Beta, mantenedor testa em janela anonima (so apos autorizacao explicita).

## Validacao Tecnica

Minimo:

- `npm --prefix backend test -- devFeedback` (validador GREEN)
- `npm --prefix backend run build`
- `npm --prefix frontend run build`
- `npm --prefix frontend run lint`
- `npm --prefix frontend test -- diagnostics`
- migration 125 aplicada em DB local; `SELECT` confirma tabela/constraints/indices (read-only)
- `git diff --check`

Validacao funcional:

- apenas apos deploy em `dev`/Beta;
- mantenedor envia bug + sugestao em janela anonima e confere a aba Desenvolvimento.
