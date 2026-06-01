# Sessao 26-06-01_2 - Resolucao de Sugestoes de Sistemas (Spec 018)

**Data:** 2026-06-01
**Objetivo:** implementar fluxo administrativo de resolucao de sugestoes de sistemas (alias, edicao/variante/subsistema, sistema novo, mescla, rejeicao) evitando redundancia no catalogo. SDD Completo `specs/018-resolucao-sugestoes-sistemas/`.

## Vinculos

- Spec/plan/tasks: `specs/018-resolucao-sugestoes-sistemas/{spec,plan,tasks}.md` + `handoff.md`.
- Sessao de origem (encerravel): `sessoes/26-06-01_1_diagnostico-criacao-mesa-sistemas.md` (fatias A-C entregues; 018 era o "proximo chat").
- Governanca: `AGENTS.md`, `docs/agents/context-capsule.md`, `.specify/memory/project-state.md`.

## Diagnostico do fluxo atual (confirmado no codigo)

Backend admin: `backend/src/routes/systemSuggestionsAdmin.ts`
- `GET /api/v1/admin/system-suggestions?status=` lista tudo (orderBy created_at desc).
- `PATCH .../:id/approve` -> em transacao: SELECT pending, valida parent, gera `path_slug`/`depth`, **sempre INSERT em `systems`** (cria no), copia `aliases[]` para `system_aliases`, marca `approved`, notifica usuario, loga atividade. Pos-tx: linka drafts Discord cujo `parsed_payload.table.raw_system_hint === name`.
- `PATCH .../:id/reject` -> marca `rejected` (+ reason opcional), notifica, loga.
- **Nao existe** acao alias-only, merge sem criar, nem busca de candidatos. Aprovar = criar sistema (raiz ou filho conforme `parent_id`/`node_type` da propria sugestao).

Schema:
- `system_suggestions` (mig 06 + 105): id, user_id, name, name_pt, node_type CHECK(system|edition|variant|subsystem), parent_id, description, aliases text[]|null, status CHECK(pending|approved|rejected), rejection_reason, reviewed_by/at, user_notified, created_at, updated_at. **Sem colunas de resolucao/auditoria de tipo.**
- `systems` (mig 02 + 102 + 108): id, name, name_pt, slug, description, parent_id, node_type, depth, path_slug (UNIQUE), logo_filename, website_url.
- `system_aliases` (mig 02): id, system_id, alias, alias_slug, is_official. UNIQUE(system_id, alias_slug). **Nao ha unique global em alias_slug** (mesmo alias pode existir em sistemas diferentes).
- Hierarquia (`systems.ts` VALID_PARENT): edition->[system], subsystem->[system], variant->[edition|subsystem], system->raiz.

Criacao admin direta ja existe: `POST /api/v1/systems/admin` (valida node_type, parent, hierarquia, gera path_slug, cria aliases). Reaproveitar logica para `create_system`/`create_child`.

Frontend admin: `frontend/src/pages/GestaoPage.tsx`
- Normaliza system+scenario suggestions como `unknown` (fatia C). Filtros all/pending/approved/rejected. Cards com checkbox + botoes "Aprovar"/"Rejeitar" via `getSuggestionEndpoint`. **Sem drawer de resolucao, sem candidatos, sem alias/merge.**

Estado Beta (SELECT read-only, 01/06): `system_suggestions` 37 (pending=35, approved=2); `scenario_suggestions` 0. Producao: 0/0.

## Plano de execucao (segue plan.md 018)

- [x] T001-T003 + alias dup + lote: decisoes fechadas pelo mantenedor (01/06):
  - Auditoria: **colunas em `system_suggestions`** (sem tabela paralela).
  - Status final: **reusar `approved` + `resolution_type`** (mantem CHECK e filtros UI).
  - Alias duplicado: **create_alias idempotente** (no-op + aponta existente, sem 409).
  - Lote: **so rejeitar em lote**; resolver sempre individual no drawer.
- [ ] Fase 1 backend candidatos: normalizador puro testavel + helper score + `GET .../:id/candidates` (TDD).
- [ ] Fase 2 auditoria+resolucao: migration + tipos DB + `POST .../:id/resolve` (create_system/create_child/create_alias idempotente/merge_existing/reject) + relink drafts Discord.
- [ ] Fase 3 frontend: normalizadores unknown, acao primaria Resolver, drawer, candidatos, forms, preview, refresh.
- [ ] Fase 4 qualidade: testes back/front, builds, changelogs.json, git diff --check.
- [ ] Fase 5 Beta: commit/push/deploy so apos autorizacao explicita; mantenedor valida janela anonima.

## Arquivos provaveis

- `backend/src/routes/systemSuggestionsAdmin.ts` (novos endpoints candidates/resolve)
- `backend/src/services/` ou `backend/src/discord/` (helper normalizador/candidatos puro) + `__tests__`
- `backend/src/db/types.ts` (novos campos/tabela)
- `database/migration_NNN_*.sql` (auditoria/resolucao)
- `backend/src/routes/systems.ts` (reuso logica de criacao, se extrair helper)
- `frontend/src/pages/GestaoPage.tsx` + novo `SystemSuggestionResolutionDrawer`
- `frontend/src/**` normalizadores
- `database/changelogs.json`

## Criterio de conclusao explicito

- Resolver substitui "aprovar->raiz" como acao primaria; alias/edicao/merge sao resolucoes explicitas auditadas.
- Candidatos similares aparecem antes de criar sistema novo (NFR-001).
- Sugestoes resolvidas saem da fila pendente; auditoria registra quem/quando/tipo/alvo.
- Builds back/front GREEN; testes do normalizador/candidatos GREEN; changelogs.json atualizado e valido; git diff --check limpo.
- Nenhuma validacao funcional de UI declarada concluida antes do teste do mantenedor em Beta (janela anonima).

## Evidencias

- Retomada minima lida em ordem: project-state.md, AGENTS.md, context-capsule.md.
- Planejamento 018 lido: handoff, spec, plan, tasks.
- Modelo atual confirmado no codigo (rotas admin, systems.ts, migrations 06/105/02/102/108, db/types.ts, GestaoPage.tsx).
- `git status`: branch `dev`, sem alteracao de codigo desta sessao ainda; specs/018 untracked (pre-existente).

## Implementacao (01/06/2026)

Backend:
- `backend/src/services/systemSuggestionCandidates.ts` (novo): `normalizeSystemName` + `scoreSystemCandidates` (puros).
- `backend/src/services/__tests__/systemSuggestionCandidates.test.ts` (novo): TDD, RED confirmado antes da impl, **14/14 GREEN**.
- `backend/src/routes/systemSuggestionsAdmin.ts`: `GET .../:id/candidates` + `POST .../:id/resolve` (create_system/create_child/create_alias idempotente/merge_existing/reject) + helper `relinkDiscordDrafts` (try/catch por draft).
- `backend/src/routes/systems.ts`: `slugify` e `VALID_PARENT` exportados (reuso, sem mudanca de comportamento).
- `backend/src/db/types.ts`: colunas de resolucao em `SystemSuggestionsTable` + tipo `SuggestionResolutionType`.
- `backend/src/services/activityLogger.ts`: acao `system_suggestion.resolved`.
- `database/migration_123_system_suggestion_resolution.sql` (nova): colunas de auditoria + CHECK idempotente.

Frontend:
- `frontend/src/components/SystemSuggestionResolutionDrawer.tsx` (novo): normalizadores `unknown`, candidatos com score/razoes, forms por tipo, previa, guard NFR-001 (409 SIMILAR_EXISTS -> revisar/force).
- `frontend/src/pages/GestaoPage.tsx`: acao primaria `Resolver` para sistemas, drawer, `handleResolved`, helper `maybePublishPendingDrafts` (extraido do approve).

Evidencias tecnicas:
- `npm --prefix backend test -- systemSuggestionCandidates`: **14/14 GREEN**.
- `npm --prefix backend run build`: **GREEN**.
- `npm --prefix frontend run build`: **GREEN**.
- `npm --prefix frontend test -- suggestion`: **2/2 GREEN** (sem regressao).
- `database/changelogs.json`: JSON valido; 0 ids duplicados; 0 datas publicadas duplicadas.
- `git diff --check`: sem erros (apenas avisos EOL CRLF).

Decisoes de modelagem (mantenedor, 01/06): colunas em system_suggestions; status `approved`+`resolution_type`; alias idempotente; lote so rejeita.

Limitacoes/observacoes:
- Relink de drafts Discord espelha o `approve` (status -> ready); drafts com outros campos faltando podem ser barrados pela constraint da migration 118 (try/catch por draft evita quebra). Validacao real em Beta.
- T026 (teste unitario do drawer) nao adicionado; normalizadores cobertos por TS build. Pendente opcional.

## Pendente

- Deploy Beta (migration 123 + backend + frontend) **somente apos autorizacao explicita** do mantenedor.
- Validacao funcional do mantenedor em janela anonima resolvendo amostra real das 35 pendentes.
- Atualizar `.specify/memory/project-state.md` quando o estado operacional mudar (apos deploy).
