# Tasks 022 - Feedback de Desenvolvimento

Convencao: cada task mapeia para um passo verificavel. TDD onde indicado (teste RED antes da impl GREEN). Commit/push/deploy/migration em servidor exigem aprovacao explicita (AGENTS.md).

## Fase 0 - Preparacao

- [x] T001 Confirmar decisoes do mantenedor (C1-C5 do spec) registradas.
- [x] T002 Criar branch `feat/022-feedback-desenvolvimento` (automatico).
- [x] T003 Abrir sessao `sessoes/26-06-02_1_feedback-desenvolvimento.md` e atualizar `sessoes/index.md`.

## Fase 1 - Banco e tipos

- [x] T004 `database/migration_125_dev_feedback.sql` (online-safe, `@requires-backup: false`, IF NOT EXISTS, CHECK de `kind`/`status` via DO/pg_constraint, indices).
- [x] T005 `DevFeedbackTable` em `backend/src/db/types.ts` (Generated em id/status/timestamps; `console_errors`/`network_errors` como `ColumnType<unknown[], string, string>`); exportar Selectable/Insertable/Updateable; registrar `dev_feedback` em `interface Database`.
- [x] T006 `NotificationType` += `'dev_feedback'` (db/types.ts) e `AdminNotificationType` += `'dev_feedback'` (adminNotifications.ts); `ActivityAction`/`ActivityEntityType` += `dev_feedback.created`/`dev_feedback.updated`.

## Fase 2 - Validador (TDD)

- [x] T007 (RED) `backend/src/validators/__tests__/devFeedbackValidator.test.ts` confirmado RED (modulo ausente).
- [x] T008 (GREEN) `backend/src/validators/devFeedbackValidator.ts`: normalizador puro tratando entrada como `unknown`; sem `.map` em payload nao validado (Array.isArray + loop). Helper `parseDevFeedbackInput` + `DEV_FEEDBACK_LIMITS`.
- [x] T009 `npx jest devFeedbackValidator` GREEN (19/19).

## Fase 3 - Backend rotas

- [x] T010 `uploadScreenshotToCloudinary(dataUri)` em `backend/src/services/cloudinary.ts` (folder `mesas_rpg/dev_feedback`, `crop:'limit'`, `width:1600`, `quality:'auto:eco'`).
- [x] T011 `backend/src/routes/devFeedback.ts`: `POST /` com `strictRateLimiter` + `optionalAuth`; valida via T008; upload screenshot nao-fatal; INSERT; `notifyAdmins` + `logActivity` fora de transacao; `201 { data }`.
- [x] T012 `backend/src/routes/devFeedbackAdmin.ts`: `authMiddleware` + `requireRole('admin')`; `GET /dev-feedback?status=&kind=` com `resolveActorName`; `PATCH /dev-feedback/:id` (status/admin_notes + reviewed_by/at + logActivity).
- [x] T013 Registrado no `backend/src/server.ts`: `app.use('/api/v1/dev-feedback', ...)` e `app.use('/api/v1/admin', devFeedbackAdminRoutes)`.
- [x] T014 `npm run build` (backend) GREEN.

## Fase 4 - Frontend diagnostico

- [x] T015 `npm install html2canvas` (`^1.4.1`).
- [x] T016 `frontend/src/lib/diagnostics.ts`: ring buffer (cap 30, msg <=500), hooks `error`/`unhandledrejection`, wrap `console.error/warn`, patch `window.fetch` (>=400, sem corpo/headers), classe `DiagnosticsTracker implements ErrorTracker` + `setErrorTracker`, `installDiagnostics()`, `getDiagnosticsSnapshot()`, `collectPageContext()` (environment por hostname com fallback MODE). Helpers `recordConsoleEntry`/`recordNetworkEntry`/`clearDiagnostics` p/ teste.
- [x] T017 `frontend/src/test/diagnostics.test.ts` GREEN (7/7).
- [x] T018 `frontend/src/main.tsx`: `installDiagnostics()` antes do render.

## Fase 5 - Frontend widget

- [x] T019 `frontend/src/features/dev-feedback/devFeedbackApi.ts`: tipos + normalizadores `unknown` (submit + admin list/patch) + `submitDevFeedback` (api.post, skipErrorToast/skipRetry).
- [x] T020 `FeedbackButton.tsx`: FAB fixo, tokens Artificio, aria-label, foco visivel; oculta em `/login` e `/auth/callback` via `useLocation`.
- [x] T021 `FeedbackModal.tsx` (createPortal, ESC, foco inicial): toggle bug/sugestao, title, description, e-mail opcional (so anonimo), bloco transparente de contexto, checkboxes incluir screenshot/erros (default on), submit com html2canvas do viewport (downscale ~1280, jpeg 0.7), toast, fecha.
- [x] T022 `<FeedbackButton/>` montado em `frontend/src/components/AppShell.tsx`.

## Fase 6 - Frontend gestao

- [x] T023 `frontend/src/pages/GestaoPage.tsx`: `activeTab` += `'dev'` + botao de aba "Desenvolvimento".
- [x] T024 `frontend/src/modules/admin/dev-feedback/DevFeedbackPanel.tsx`: filtros status/kind, cards com contexto completo (rota clicavel, erros console, falhas rede, thumbnail screenshot), select de status + textarea de notas -> PATCH, normalizacao `unknown`.

## Fase 7 - Qualidade

- [x] T025 `npm run build` (frontend) GREEN.
- [x] T026 Lint: arquivos novos = 0 erros. Arquivos modificados por mim = 0 erros. Os 2 `any` pre-existentes em `GestaoPage.tsx` (`scenarioEditModal`/`allTables`) foram tipados (`ScenarioEditTarget`/`AdminTableRow`) -> GestaoPage agora 0 erros (restou 1 warning pre-existente de exhaustive-deps). Repo total caiu de 112 para **110 erros**/14 warnings pre-existentes (logger/sanitize/etc), fora de escopo.
- [x] T027 `npx vitest run` GREEN (13/13, inclui diagnostics 7/7).
- [ ] T028 Aplicar migration 125 em DB local; `SELECT` confirma tabela/constraints/indices. BLOQUEADO: write em DB exige aprovacao + Postgres local; sera validado no migrate gate do Beta.
- [x] T029 `database/changelogs.json` atualizado (entrada leiga, `published:false` ate deploy) e JSON valido.
- [x] T030 `git diff --check` limpo (apenas avisos EOL CRLF).

## Fase 8 - Beta

- [ ] T031 Commit e push para `dev` quando autorizado por pedido de deploy.
- [ ] T032 Acompanhar Deploy Beta + migrate gate (migration 125).
- [ ] T033 Registrar run GREEN e smokes.
- [ ] T034 Mantenedor envia bug + sugestao em janela anonima; confere aba Desenvolvimento (contexto + screenshot).
- [ ] T035 Atualizar `.specify/memory/project-state.md` e registrar resultado.

## Criterio de Conclusao

- Usuario reporta bug/sugestao de qualquer pagina (exceto login/callback), anonimo ou logado.
- Contexto tecnico + screenshot chegam gravados e visiveis na aba Desenvolvimento.
- Admin altera status/notas via PATCH.
- Validador GREEN (TDD); builds back/front GREEN; lint GREEN; changelogs.json valido; git diff --check limpo.
- Nenhuma validacao funcional de UI declarada concluida antes do teste do mantenedor em Beta (janela anonima).
