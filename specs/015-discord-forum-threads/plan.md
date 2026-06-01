# Implementation Plan: Discord Forum Threads

**Branch**: `feat/015-discord-forum-threads` | **Date**: 2026-05-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-discord-forum-threads/spec.md`

## Summary

Adicionar suporte a fontes Discord de forum no painel "Discord Sync": discovery passa a listar foruns, fontes passam a registrar tipo do canal, e a ingestao escolhe entre fluxo existente de canais textuais/anuncio e novo fluxo de posts/threads. A solucao mantem compatibilidade com fontes atuais, preserva deduplicacao por mensagem dentro do canal/thread real e adiciona metadados de forum/thread para auditoria, parser, draft revisavel e URL correta do Discord.

## Technical Context

**Language/Version**: TypeScript estrito; Node.js 25.9.0; React + Vite  
**Primary Dependencies**: Express, Kysely, Zod 4.3.6, React, Tailwind; Discord REST API v10 via `fetch` nativo  
**Storage**: PostgreSQL 16; tabelas existentes `discord_import_sources` e `discord_import_messages` com migration online-safe nova  
**Testing**: `npm --prefix backend test -- parseDiscordAnnouncement`; `npm --prefix backend run build`; `npm --prefix frontend run build`; verificacoes direcionadas com `rg`; teste funcional final em Beta pelo mantenedor em janela anonima
**Target Platform**: Backend e frontend do portal em Beta/Producao via workflow GitHub Actions  
**Project Type**: Monorepo web app + API administrativa  
**Performance Goals**: Uma busca manual de forum deve processar lote limitado de threads/mensagens sem travar a UI; cada chamada externa deve ter timeout explicito  
**Constraints**: Sem expor token; sem scraping; sem `AbortSignal.timeout`; schema online-safe; fontes legadas sem `channel_type` devem continuar como canais textuais; parser v1 deterministico e sem LLM; sync cria mesa em status `draft`; sync bloqueado ate draft `ready` com campos obrigatorios completos
**Scale/Scope**: Admin interno; suporte a `GUILD_TEXT` (0), `GUILD_ANNOUNCEMENT` (5), `GUILD_FORUM` (15); `GUILD_MEDIA` (16) fica fora do escopo de implementacao inicial por aviso oficial de desenvolvimento ativo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Gate 1 — Produto e privacidade**: PASS. Mantem gratuidade, nao adiciona anuncios e nao amplia coleta de dados alem de metadados necessarios de origem Discord.

**Gate 2 — TypeScript estrito**: PASS. Tipos de fronteira Discord devem passar por Zod/normalizadores antes de uso.

**Gate 3 — Schema/migrations**: PASS com migration online-safe `migration_117_discord_forum_threads.sql`, apenas `ADD COLUMN IF NOT EXISTS` e indices. Sem DROP/TRUNCATE/DELETE.

**Gate 4 — Segredos**: PASS. Token continua vindo do provedor existente e nunca deve aparecer em resposta, log ou UI.

**Gate 5 — Sessao e evidencias**: PASS. Sessao `sessoes/26-05-04_1_discord-forum-threads.md` deve ser atualizada a cada fase/task.

**Gate 6 — Escopo estrito**: PASS. Arquivos tocaveis definidos na Seção 3 abaixo; qualquer arquivo fora da lista exige parada e justificativa.

## Project Structure

### Documentation (this feature)

```text
specs/015-discord-forum-threads/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── README.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── routes/
│   │   └── adminDiscordSync.ts
  │   ├── discord/
  │   │   ├── __tests__/parseDiscordAnnouncement.test.ts
  │   │   ├── discovery.ts
  │   │   ├── ingestMessages.ts
  │   │   ├── normalizeDiscordTableDraft.ts
  │   │   ├── parseDiscordAnnouncement.ts
  │   │   ├── syncDiscordDraftToTable.ts
  │   │   ├── types.ts
  │   │   └── index.ts
│   └── db/
│       └── types.ts

frontend/
├── src/
│   └── features/
│       └── discord-sync/
│           ├── api/discordSyncApi.ts
│           ├── components/DiscordSourceList.tsx
│           ├── components/DiscordSyncPanel.tsx
│           └── types.ts

database/
└── migration_117_discord_forum_threads.sql

MAPA_DE_API.md
```

**Structure Decision**: Implementar como extensao incremental do modulo `discord-sync` existente. O backend concentra regras de acesso ao Discord e persistencia; o frontend apenas envia tipo normalizado da fonte e exibe estado/feedback.

## Seção 3 — Arquivos Autorizados para Mudança

- `sessoes/26-05-04_1_discord-forum-threads.md`
- `sessoes/index.md`
- `.specify/feature.json`
- `AGENTS.md`
- `specs/015-discord-forum-threads/spec.md`
- `specs/015-discord-forum-threads/checklists/requirements.md`
- `specs/015-discord-forum-threads/plan.md`
- `specs/015-discord-forum-threads/research.md`
- `specs/015-discord-forum-threads/data-model.md`
- `specs/015-discord-forum-threads/quickstart.md`
- `specs/015-discord-forum-threads/contracts/README.md`
- `specs/015-discord-forum-threads/tasks.md`
- `specs/015-discord-forum-threads/pr-description.md`
- `database/migration_117_discord_forum_threads.sql`
- `backend/src/db/types.ts`
- `backend/src/discord/discovery.ts`
- `backend/src/discord/ingestMessages.ts`
- `backend/src/discord/parseDiscordAnnouncement.ts`
- `backend/src/discord/normalizeDiscordTableDraft.ts`
- `backend/src/discord/syncDiscordDraftToTable.ts`
- `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts`
- `backend/src/discord/types.ts`
- `backend/src/discord/index.ts`
- `backend/src/routes/adminDiscordSync.ts`
- `backend/dist/discord/discovery.js`
- `backend/dist/discord/index.js`
- `backend/dist/discord/ingestMessages.js`
- `backend/dist/discord/normalizeDiscordTableDraft.js`
- `backend/dist/discord/parseDiscordAnnouncement.js`
- `backend/dist/routes/adminDiscordSync.js`
- `backend/dist/routes/systemSuggestionsAdmin.js` (build artifact regenerated from existing `origin/dev` source)
- `frontend/src/features/discord-sync/api/discordSyncApi.ts`
- `frontend/src/features/discord-sync/components/DiscordSourceList.tsx`
- `frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx`
- `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx`
- `frontend/src/features/discord-sync/types.ts`
- `MAPA_DE_API.md`
- `.specify/memory/project-state.md`
- `.specify/memory/session-log.md`

**Bugfix**: 2026-05-04 — BUG-001 atualiza o escopo para incluir triagem funcional de mensagens importadas e filtro temporal em `POST /fetch` para qualquer fonte Discord.
**Bugfix**: 2026-05-05 — BUG-003 atualiza o plano para incluir parser, normalizador, drafts idempotentes, sync para mesa em status `draft`, gate de prontidao backend e editor estruturado de draft no frontend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

Nenhuma violacao constitucional planejada.
