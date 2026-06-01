# Tasks: 013-discord-settings-config

**Input**: Design documents from `specs/013-discord-settings-config/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/README.md`, `quickstart.md`
**Tests**: Build backend/frontend obrigatorio; validacao funcional final em Beta apos PR/merge/deploy.

## Phase 1: Setup

- [x] T001 Validar numero da migration e registrar evidencia em `sessoes/26-05-03_4_discord-settings-config.md`
- [x] T002 Criar `database/migration_116_discord_settings.sql` com header obrigatorio, tabela, indices e bloco de validacao
- [x] T003 Atualizar `backend/src/db/types.ts` com `DiscordSettingsTable`, tipos `Selectable/Insertable/Updateable` e entrada em `Database`

## Phase 2: Foundational

- [x] T004 Criar criptografia AES-256-GCM em `backend/src/discord/settingsCrypto.ts`
- [x] T005 Atualizar leitura lazy do token em `backend/src/discord/config.ts`
- [x] T006 Atualizar `backend/src/discord/ingestMessages.ts` para aceitar `botToken` opcional e usar fallback DB -> env

## Phase 3: User Story 1 — Admin salva token pelo painel (P1)

**Goal**: Admin salva/substitui token sem SSH; token fica cifrado e nunca retorna plaintext.
**Independent Test**: `PUT /settings/bot-token` com token valido retorna preview mascarado e `GET /settings` retorna `is_set: true`.

- [x] T007 [US1] Adicionar schema Zod e helpers de preview/erro de cifra em `backend/src/routes/adminDiscordSync.ts`
- [x] T008 [US1] Implementar `GET /settings` em `backend/src/routes/adminDiscordSync.ts`
- [x] T009 [US1] Implementar `PUT /settings/bot-token` com upsert cifrado em `backend/src/routes/adminDiscordSync.ts`
- [x] T010 [US1] Atualizar `/fetch` para usar token resolvido por helper em `backend/src/routes/adminDiscordSync.ts`
- [x] T011 [US1] Adicionar tipos de settings em `frontend/src/features/discord-sync/types.ts`
- [x] T012 [US1] Adicionar parsers e metodos `getDiscordSettings`/`saveDiscordBotToken` em `frontend/src/features/discord-sync/api/discordSyncApi.ts`
- [x] T013 [US1] Criar `frontend/src/features/discord-sync/components/DiscordSettingsPanel.tsx` com status, campo senha e salvar token
- [x] T014 [US1] Inserir aba "Configuracao" antes de "Fontes" em `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx`

## Phase 4: User Story 2 — Admin remove token e fallback continua (P2)

**Goal**: Admin remove token salvo; ingestao volta para fallback `DISCORD_BOT_TOKEN` quando existir.
**Independent Test**: `DELETE /settings/bot-token` retorna 204; `GET /settings` retorna `is_set: false`; `/fetch` continua usando env quando disponivel.

- [x] T015 [US2] Implementar `DELETE /settings/bot-token` em `backend/src/routes/adminDiscordSync.ts`
- [x] T016 [US2] Adicionar metodo `deleteDiscordBotToken` em `frontend/src/features/discord-sync/api/discordSyncApi.ts`
- [x] T017 [US2] Adicionar confirmacao inline de remocao em `frontend/src/features/discord-sync/components/DiscordSettingsPanel.tsx`

## Phase 5: User Story 3 — Contratos e documentacao operacional (P3)

**Goal**: API e operacao documentadas para PR e deploy Beta.
**Independent Test**: docs refletem os endpoints reais e nao prometem plaintext.

- [x] T018 [US3] Atualizar `MAPA_DE_API.md` com as tres rotas de settings
- [x] T019 [US3] Criar `specs/013-discord-settings-config/pr-description.md` com sumario, mudancas, testing evidence e checklist pos-merge

## Phase 6: Validation

- [x] T020 Rodar `npm --prefix backend run build` e registrar output literal em `sessoes/26-05-03_4_discord-settings-config.md`
- [x] T021 Rodar `npm --prefix frontend run build` e registrar output literal em `sessoes/26-05-03_4_discord-settings-config.md`
- [x] T022 Executar busca final contra vazamento de token/plaintext nos arquivos alterados e registrar evidencia em `sessoes/26-05-03_4_discord-settings-config.md`
- [x] T023 Atualizar `specs/013-discord-settings-config/tasks.md` marcando todas as tasks concluidas
- [x] T024 Atualizar `.specify/memory/project-state.md` via `/speckit.status`
- [x] T025 Executar `/speckit.retro.run` atualizando `.specify/memory/session-log.md` e `sessoes/26-05-03_4_discord-settings-config.md`

## Dependencies

- Phase 1 bloqueia todas as demais.
- Phase 2 bloqueia US1 e US2.
- US1 e necessario antes de US2.
- US3 pode ocorrer apos os endpoints existirem.
- Validation so ocorre apos US1, US2 e US3.

## Parallel Opportunities

- T002 e T003 podem ser revisadas em paralelo, mas devem ser aplicadas antes do build backend.
- T011 e T013 podem ser trabalhadas apos T012 definir contrato frontend.
- T018 e T019 podem ser executadas em paralelo apos endpoints implementados.

## Implementation Strategy

1. Entregar backend minimo: migration, tipo, crypto, GET/PUT e token resolvido na ingestao.
2. Integrar UI como primeira aba, usando normalizadores no cliente API.
3. Adicionar DELETE e confirmacao inline.
4. Fechar docs, builds e evidencias de seguranca.
