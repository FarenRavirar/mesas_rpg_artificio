# Tasks 012 — Pipeline de Importacao e Sincronizacao Covil do Lich

**Feature:** `012-discord-covil-sync`
**Data:** 2026-05-03 (reordenado em 2026-05-03)
**Sessao:** `26-05-03_3_discord-covil-sync.md`

> Formato de estado: NOT STARTED | BLOCKED | RED | GREEN | DONE
> Regra de transicao: toda mudanca de estado exige evidencia (comando + output literal + git status).
>
> Ordem de fases ajustada a pedido do mantenedor em 03/05/2026:
> Rotas + Frontend primeiro → parser testado com mensagens reais do banco em vez de fixtures manuais.

---

## Fase 0 — Especificacao e Setup

### T001 — Criar artefatos SDD da feature
**Estado:** DONE
**Evidencia:** spec.md, plan.md e tasks.md criados na sessao 26-05-03_3. Sem codigo alterado.

### T002 — Criar branch da feature
**Estado:** DONE
**Evidencia:** `git checkout -b feat/012-discord-covil-sync origin/dev` executado. Branch ativa confirmada por `git status`.

---

## Fase 1 — Banco e Tipos

### T003 — Criar migration_115_discord_import.sql
**Estado:** DONE
**Evidencia:** `database/migration_115_discord_import.sql` criado com 3 tabelas (`discord_import_sources`, `discord_import_messages`, `discord_import_table_drafts`), indices e bloco de validacao DO $$.

### T004 — Validar migration em banco de teste
**Estado:** DONE
**Evidencia:** container efemero `mesas-test-pg-1777815311` (postgres:16-alpine) criado na VM. Todas as 47 migrations aplicadas em ordem. `\dt discord_*` retornou 3 tabelas com estrutura correta. Container destruido apos validacao.

### T005 — Adicionar tipos Kysely em backend/src/db/types.ts
**Estado:** DONE
**Evidencia:** `DiscordImportSourcesTable`, `DiscordImportMessagesTable`, `DiscordImportTableDraftsTable` adicionados. `Database` extendido. `npm --prefix backend run build` GREEN.

### T006 — Criar estrutura base do modulo Discord (types.ts, index.ts, config.ts)
**Estado:** DONE
**Evidencia:** `backend/src/discord/types.ts`, `config.ts` e `index.ts` criados. Fronteira publica via `index.ts`. `npm --prefix backend run build` GREEN.

---

## Fase 2 — Rotas Administrativas e Ingestao REST

### T007 — Criar adminDiscordSync.ts — CRUD de fontes
**Estado:** DONE
**Evidencia:** `backend/src/routes/adminDiscordSync.ts` criado. CRUD de fontes com Zod v4 (`z.record(z.string(), z.unknown())`), `authMiddleware` + `role === 'admin'` em todas as rotas, respostas 200/201/400/401/403/404/409/500. `npm --prefix backend run build` GREEN.

### T008 — Adicionar ingestao REST e listagem de mensagens/drafts
**Estado:** DONE
**Dependencia:** T007
**Evidencia:** `POST /fetch` delega para `ingestMessages` do modulo discord; `GET /messages`, `GET /drafts`, `GET /drafts/:id`, `PATCH /drafts/:id` implementados; stubs 501 para reparse/sync substituidos na T012. `npm --prefix backend run build` GREEN.

### T009 — Criar ingestMessages.ts
**Estado:** DONE
**Dependencia:** T006
**Evidencia:** `backend/src/discord/ingestMessages.ts` criado. Funcao `ingestMessages({sourceId, channelId, guildId, botToken, limit?, beforeMessageId?, sourceKind?})` usa `fetch` nativo + `AbortSignal.timeout(10_000)`, SHA-256 via `node:crypto`, insere ou atualiza por `(discord_channel_id, discord_message_id)`. Exportada via `index.ts`. `npm --prefix backend run build` GREEN.

### T010 — Registrar adminDiscordSync no server.ts e atualizar MAPA_DE_API.md
**Estado:** DONE
**Dependencia:** T007
**Evidencia:** `app.use('/api/v1/admin/discord-sync', adminDiscordSyncRoutes)` registrado em `server.ts`. 12 rotas adicionadas em `MAPA_DE_API.md` com status `🔧 Impl.` (operacionais) e `⏳ FaseX` (pendentes). `npm --prefix backend run build` GREEN.

---

## Fase 3 — Sincronizacao para tables

### T011 — Criar syncDiscordDraftToTable.ts
**Estado:** DONE
**Dependencia:** T006
**Arquivo:** `backend/src/discord/syncDiscordDraftToTable.ts`
**Evidencia:** `syncDiscordDraftToTable(draftId)` implementada com idempotencia via `tables.source_id = discord_message_id`; UPDATE path usa transacao direta (gm_id=null incompativel com `updateTableWithRelations`); INSERT path usa `TableRepository.createTableWithRelations`; cria `table_contacts` e `table_schedules`; marca draft.status='synced' e message.status='synced'; exportada via `index.ts`. `npm --prefix backend run build` GREEN.

### T012 — Adicionar rotas sync ao adminDiscordSync.ts
**Estado:** DONE
**Dependencia:** T011, T007
**Evidencia:** stubs 501 removidos; `POST /drafts/:id/sync` chama `syncDiscordDraftToTable`; `POST /sync-ready` itera todos os drafts `ready` em lote com coleta de erros por draft; `POST /drafts/:id/reparse` mantido como 501 ate T019; idempotencia garantida pelo check de `source_id`. `npm --prefix backend run build` GREEN.

### T013 — Criar script syncDiscordChannels.ts
**Estado:** DONE
**Dependencia:** T009
**Arquivo:** `backend/src/scripts/syncDiscordChannels.ts`
**Evidencia:** script busca fontes habilitadas (`enabled=true`), chama `ingestMessages` para cada canal, atualiza `last_synced_at`; scripts `discord:sync` e `discord:sync:dev` adicionados em `backend/package.json`. `npm --prefix backend run build` GREEN.

---

## Fase 4 — Painel Frontend

### T014 — Criar types.ts e discordSyncApi.ts
**Estado:** DONE
**Dependencia:** T010
**Evidencia:** `frontend/src/features/discord-sync/types.ts` com `DiscordSource`, `DiscordMessage`, `DiscordDraft`, `IngestResult`, `SyncReadyResult` e unions de status; `discordSyncApi.ts` com todas as 12 rotas via `apiFetch` (fetch nativo + credentials:include); Array.isArray nas respostas de lista. `npm --prefix frontend run build` GREEN.

### T015 — Criar DiscordSourceList e DiscordSyncPanel
**Estado:** DONE
**Dependencia:** T014
**Evidencia:** `DiscordSourceList` exibe fontes com CRUD (add/toggle-enabled/delete com confirmacao) e botao "Buscar mensagens" por fonte; `DiscordSyncPanel` orquestra abas Fontes/Mensagens/Drafts com filtro de status e botao Recarregar. `npm --prefix frontend run build` GREEN.

### T016 — Criar DiscordDraftReviewTable e DiscordDraftPreview
**Estado:** DONE
**Dependencia:** T015
**Evidencia:** `DiscordDraftReviewTable` lista drafts com filtro por status, botao "Sincronizar todos prontos (N)" e click para abrir preview; `DiscordDraftPreview` exibe payload JSON (parsed/normalizado), edita status+notas, botoes Sincronizar individual e Reparsar. `npm --prefix frontend run build` GREEN.

### T017 — Integrar DiscordSyncPanel na area admin
**Estado:** DONE
**Dependencia:** T016
**Evidencia:** aba "Discord Sync" adicionada em `GestaoPage.tsx`; ativa apenas dentro da rota `/gestao` protegida por `role==='admin'`; `DiscordSyncPanel` renderizado no `activeTab==='discord'`. `npm --prefix frontend run build` GREEN.

---

## Fase 5 — Parser e Normalizador (com mensagens reais do banco)

### T018 — Implementar parseDiscordAnnouncement (Red)
**Estado:** NOT STARTED
**Arquivo:** `backend/src/discord/parseDiscordAnnouncement.ts` + `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts`
**Criterio de done (RED):** arquivo de teste criado com fixtures reais do Covil (minimo 8 anuncios, incluindo os dois fornecidos pelo mantenedor); `npm --prefix backend test -- parseDiscordAnnouncement` retorna FAIL por ausencia de implementacao; output literal colado no chat.

### T019 — Implementar parseDiscordAnnouncement (Green)
**Estado:** NOT STARTED
**Dependencia:** T018
**Criterio de done (GREEN):** parser deterministico implementado; extrai todos os campos de `DiscordTableDraftTable`; `npm --prefix backend test -- parseDiscordAnnouncement` retorna PASS; coverage de pelo menos 8 anuncios distintos; output literal colado no chat; exportado via `index.ts`.

### T020 — Criar normalizeDiscordTableDraft.ts
**Estado:** NOT STARTED
**Dependencia:** T019
**Arquivo:** `backend/src/discord/normalizeDiscordTableDraft.ts`
**Criterio de done:** funcao que recebe `DiscordTableDraft` e resolve `system_id` via query em `systems` e `system_aliases` (order: name → name_pt → slug → alias, case-insensitive); classifica draft como `ready` ou `needs_review`; exportada via `index.ts`; `npm --prefix backend run build` GREEN.

### T021 — Expor funcoes de pipeline na fronteira publica (index.ts)
**Estado:** NOT STARTED
**Dependencia:** T009, T019, T020, T011
**Arquivo:** `backend/src/discord/index.ts`
**Criterio de done:** `index.ts` descomenta e exporta `ingestMessages`, `parseDiscordAnnouncement`, `normalizeDiscordTableDraft`, `syncDiscordDraftToTable`; nenhum arquivo fora de `discord/` importa de submodulos internos; `npm --prefix backend run build` GREEN.

---

## Fase 6 — Exportacao WhatsApp

### T022 — Criar formatWhatsappExport.ts
**Estado:** NOT STARTED
**Arquivo:** `frontend/src/features/discord-sync/utils/formatWhatsappExport.ts`
**Criterio de done:** funcao pura `formatTableForWhatsapp(table: TableDetail): string` criada; formata tipo, titulo, sistema, modalidade, vagas, horario e contatos; sem dependencia de componente React; `npm --prefix frontend run build` GREEN.

### T023 — Criar WhatsappExportModal
**Estado:** NOT STARTED
**Dependencia:** T022
**Arquivo:** `frontend/src/features/discord-sync/components/WhatsappExportModal.tsx`
**Criterio de done:** modal com previa do texto e botao "Copiar para area de transferencia"; integrado ao `DiscordDraftPreview` para mesas ja sincronizadas; `npm --prefix frontend run build` GREEN.

---

## Fase 7 — Bot e Automacao (nao iniciar neste ciclo)

### T024 — Instalar discord.js e criar client.ts
**Estado:** NOT STARTED
**Nota:** Nao iniciar antes do staging (Fases 1–6) validado em Beta.
**Arquivo:** `backend/src/discord/client.ts`
**Criterio de done:** `npm --prefix backend install discord.js`; `client.ts` inicializa bot com Message Content Intent; scripts `discord:bot` e `discord:bot:dev` em `backend/package.json`; `npm --prefix backend run build` GREEN.

### T025 — Criar ingestMessages bot listener
**Estado:** NOT STARTED
**Dependencia:** T024
**Arquivo:** `backend/src/discord/ingestMessages.ts` (extensao para evento `messageCreate`/`messageUpdate`)
**Criterio de done:** listener ativo para canais cadastrados e habilitados; chama pipeline de ingestao e parsing; `npm --prefix backend run build` GREEN.

### T026 — Criar importadores separados (bot vs ChatExporter)
**Estado:** NOT STARTED
**Arquivos:** `backend/src/discord/importers/discordBotMessageImporter.ts`, `backend/src/discord/importers/discordChatExporterJsonImporter.ts`
**Criterio de done:** `discordBotMessageImporter` normaliza mensagem do discord.js para `DiscordRawMessage`; `discordChatExporterJsonImporter` aceita JSON do ChatExporter (estrutura com `guild`, `channel`, `messages[]`) e gera o mesmo schema; `npm --prefix backend run build` GREEN.

---

## Fase Final — Documentacao e Deploy

### T027 — Criar pr-description.md
**Estado:** NOT STARTED
**Dependencia:** T001–T023 DONE
**Arquivo:** `specs/012-discord-covil-sync/pr-description.md`
**Criterio de done:** sumario executivo com mudancas por fase, evidencias de testes (build GREEN + parser GREEN + sync idempotente), checklist pos-merge.

### T028 — Build final e validacao pre-PR
**Estado:** NOT STARTED
**Dependencia:** T027
**Criterio de done:**
- `npm --prefix backend run build` GREEN (output literal)
- `npm --prefix frontend run build` GREEN (output literal)
- `npm --prefix backend test -- parseDiscordAnnouncement` GREEN (output literal)
- Busca `any` implicito: zero ocorrencias nos arquivos novos
- `git status` mostra apenas arquivos da feature

### T029 — Abrir PR para dev
**Estado:** NOT STARTED
**Dependencia:** T028
**Criterio de done:** `gh pr create --base dev --head feat/012-discord-covil-sync` executado; URL do PR retornada; aprovacao do mantenedor recebida.
