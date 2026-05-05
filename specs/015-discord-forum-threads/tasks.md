# Tasks: Discord Forum Threads

**Input**: Design artifacts from `specs/015-discord-forum-threads/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/README.md`, `quickstart.md`

## Phase 1: Setup

- [x] T001 Create online-safe migration `database/migration_117_discord_forum_threads.sql` with channel/thread metadata columns.
- [x] T002 Update Kysely table types for Discord source/message metadata in `backend/src/db/types.ts`.
- [x] T003 Update shared Discord domain types for source channel kinds and ingest result metadata in `backend/src/discord/types.ts`.

## Phase 2: Foundational

- [x] T004 Extend Discord discovery channel type support and normalized `kind` mapping in `backend/src/discord/discovery.ts`.
- [x] T005 Refactor Discord ingest REST fetch to use manual `AbortController` timeout and safe actionable errors in `backend/src/discord/ingestMessages.ts`.
- [x] T006 Generalize message persistence helper to accept channel/thread metadata without changing existing channel behavior in `backend/src/discord/ingestMessages.ts`.
- [x] T007 Export any new Discord ingest/discovery types or helpers needed by routes in `backend/src/discord/index.ts`.
- [x] T008 Update frontend Discord types and API normalizers for `channel_type`, discovered channel `kind`, message thread fields and ingest metadata in `frontend/src/features/discord-sync/types.ts` and `frontend/src/features/discord-sync/api/discordSyncApi.ts`.

## Phase 3: User Story 1 - Importar anuncios de um forum Discord (Priority: P1)

**Goal**: Admin cadastra forum como fonte e importa mensagens de posts/threads.

**Independent Test**: Selecionar forum no painel, salvar fonte, executar busca e ver mensagens importadas com origem de thread.

- [x] T009 [US1] Accept and persist `channel_type` when creating Discord sources in `backend/src/routes/adminDiscordSync.ts`.
- [x] T010 [US1] Add forum source branching in `POST /fetch` based on persisted `channel_type` in `backend/src/routes/adminDiscordSync.ts`.
- [x] T011 [US1] Implement thread listing for active and public archived forum posts in `backend/src/discord/ingestMessages.ts`.
- [x] T012 [US1] Ingest messages from each forum thread while storing forum/thread metadata and Discord URLs in `backend/src/discord/ingestMessages.ts`.
- [x] T013 [US1] Send discovered forum kind and source `channel_type` from the source form in `frontend/src/features/discord-sync/components/DiscordSourceList.tsx`.
- [x] T014 [US1] Display forum badges and source type labels in `frontend/src/features/discord-sync/components/DiscordSourceList.tsx`.
- [x] T015 [US1] Display thread/forum metadata for imported messages in `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx`.

## Phase 4: User Story 2 - Preservar canais textuais existentes (Priority: P2)

**Goal**: Canais textuais e de anuncio continuam importando como antes.

**Independent Test**: Executar busca em fonte textual/anuncio existente e confirmar importacao/deduplicacao sem regressao.

- [x] T016 [US2] Preserve default `text` behavior for legacy sources with null or missing `channel_type` in `backend/src/routes/adminDiscordSync.ts`.
- [x] T017 [US2] Preserve text/announcement message ingest semantics and deduplication in `backend/src/discord/ingestMessages.ts`.
- [x] T018 [US2] Keep manual source creation compatible while allowing optional channel type in `frontend/src/features/discord-sync/components/DiscordSourceList.tsx`.

## Phase 5: User Story 3 - Entender falhas em foruns e threads (Priority: P3)

**Goal**: Admin entende falhas de token, permissao, rate limit, forum vazio ou Discord indisponivel sem expor token.

**Independent Test**: Simular falhas comuns e confirmar mensagens acionaveis na interface/API.

- [x] T019 [US3] Map Discord forum/thread failures to actionable admin responses in `backend/src/discord/ingestMessages.ts`.
- [x] T020 [US3] Return safe fetch errors from `POST /fetch` without logging token or raw sensitive payloads in `backend/src/routes/adminDiscordSync.ts`.
- [x] T021 [US3] Update frontend fetch feedback for forum scans and empty forum results in `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx`.

## Final Phase: Polish & Cross-Cutting Concerns

- [x] T022 Update Discord Sync API documentation in `MAPA_DE_API.md`.
- [x] T023 Create PR description for Feature 015 in `specs/015-discord-forum-threads/pr-description.md`.
- [x] T024 Run backend build with literal output recorded: `npm --prefix backend run build`.
- [x] T025 Run frontend build with literal output recorded: `npm --prefix frontend run build`.
- [x] T026 Run final safety searches for `AbortSignal.timeout` and token/plaintext leakage across Discord Sync files.
- [x] T027 Update `specs/015-discord-forum-threads/tasks.md` checkboxes with evidence after implementation.
- [x] T028 Update `.specify/memory/project-state.md` via `/speckit.status`.
- [x] T029 Update `.specify/memory/session-log.md` and session file via `/speckit.retro.run`.
- [x] T030 [BUG-001] Add temporal fetch filter support for every Discord source type in `backend/src/routes/adminDiscordSync.ts`, `backend/src/discord/ingestMessages.ts`, `frontend/src/features/discord-sync/api/discordSyncApi.ts` and `frontend/src/features/discord-sync/components/DiscordSourceList.tsx`.
- [x] T031 [BUG-001] Add imported-message status update API in `backend/src/routes/adminDiscordSync.ts` and frontend normalizer/client support in `frontend/src/features/discord-sync/api/discordSyncApi.ts`.
- [x] T032 [BUG-001] Add actionable message detail/triage UI in `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx`.
- [x] T033 [BUG-001] Update API/docs/status artifacts and run backend/frontend builds plus final searches.
- [x] T034 [BUG-002] Make imported-message triage visible and operational in `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx`, including queue summary, selected item fallback content and quick status actions.
- [x] T035 [BUG-003] Create parser RED tests with forum fixtures in `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts` before parser implementation.
- [x] T036 [BUG-003] Implement deterministic `parseDiscordAnnouncement.ts` for forum thread names, empty `content_raw`, content text and basic table fields.
- [x] T037 [BUG-003] Implement `normalizeDiscordTableDraft.ts` to resolve systems/aliases and classify `ready` vs `needs_review`.
- [x] T038 [BUG-003] Integrate parser/normalizer into `backend/src/routes/adminDiscordSync.ts` so fetch/reparse creates or updates `discord_import_table_drafts` idempotently.
- [x] T039 [BUG-003] Update `syncDiscordDraftToTable.ts` so Discord drafts create/update `tables.status='draft'` instead of publishing automatically.
- [x] T040 [BUG-003] Export parser/normalizer via `backend/src/discord/index.ts` and update Discord Sync API docs in `MAPA_DE_API.md`.
- [x] T041 [BUG-003] Run backend parser tests, backend build, frontend build, final searches and record evidence before deploy.
- [x] T042 [BUG-003] Block backend draft sync unless the draft is `ready` and has title, description, system, type, modality, price, slots, contact, day and start time.
- [x] T043 [BUG-003] Add structured draft editor in `frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx` with real system selector, field validation and disabled sync while incomplete.
- [x] T044 [BUG-003] Re-run backend/frontend builds after readiness-gate patch and record evidence before any deploy suggestion.

**Bugfix**: 2026-05-04 — BUG-001 adiciona tasks T030-T033 para filtro temporal, triagem de mensagens e validacao.
**Bugfix**: 2026-05-04 — BUG-002 adiciona T034 para corrigir apuracao invisivel e transformar a lista em painel de gestao.
**Bugfix**: 2026-05-05 — BUG-003 adiciona T035-T041 para fechar o funil forum → parser → draft → mesa em status draft.
**Bugfix**: 2026-05-05 — BUG-003 adiciona T042-T044 para impedir sync incompleto e tornar o draft editavel antes de qualquer deploy.

## Dependencies

- Phase 1 blocks all implementation.
- Phase 2 blocks all user stories.
- US1 is MVP and should complete before US2/US3 validation.
- US2 can validate in parallel after T009-T012 because it exercises the legacy path.
- US3 depends on T011-T012 to cover forum/thread-specific failures.
- Final phase depends on US1-US3.
- BUG-003 depends on T012 and must run parser RED tests before T036-T040.

## Parallel Examples

- After T001, T002 and T003 can be worked independently if file ownership is separated.
- After T004-T008, frontend UI tasks T013-T015 can proceed while backend ingest tasks T010-T012 proceed.
- T022 and T023 can be drafted after contracts stabilize.

## Implementation Strategy

1. Ship MVP: schema/types, discovery forum support, forum source creation, forum fetch.
2. Validate legacy channels immediately after forum path compiles.
3. Harden errors and UI feedback.
4. Run required builds and safety searches before PR.
5. For BUG-003, prove parser RED/GREEN before changing runtime behavior.
