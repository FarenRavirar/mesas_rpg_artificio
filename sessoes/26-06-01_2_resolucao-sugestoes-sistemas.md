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

## Deploy Beta (autorizado pelo mantenedor: "pode prosseguir", 01/06)

- Commit `2ddb399` (feature) + push `dev`.
- **Run `26778729349` FALHOU no migrate:** migration 123 estava `online-safe` com `DROP CONSTRAINT` (classificador `scripts/deploy/lib_migrations.sh:61` busca `\b(DROP|TRUNCATE|DELETE\s+FROM)\b`). Falhou na classificacao **antes** de aplicar; banco Beta intacto.
- Correcao: migration 123 reescrita idempotente sem DROP (constraint via `IF NOT EXISTS` em `pg_constraint`). Commit `722f596` + push.
- **Run `26778999597` GREEN** em todos os jobs: validate, lint, enforce-dir, migrate, smoke-discord, deploy-app, smoke.
- Health Beta: root HTTP 200; `/api/v1/health` = ok/beta/connected.
- Evidencia E166 (SELECT read-only no Beta pos-deploy):
  - 7 colunas de auditoria presentes em `system_suggestions`.
  - constraint `system_suggestions_resolution_type_check` presente.
  - fila intacta: pending=33, approved=2, rejected=2 (total 37).

## Pendente

- **Validacao funcional do mantenedor em janela anonima** no Beta (`mesasbeta.artificiorpg.com` -> Gestao -> Sugestoes de Sistemas -> Resolver), resolvendo amostra real (alias/edicao/mescla/sistema novo). Unica evidencia funcional conclusiva.
- T026 (teste unitario do drawer) opcional nao adicionado.
- Promocao `dev` -> `main`/Producao (migration 123 ainda pendente em Producao) somente em fluxo controlado e autorizado.

## Retomada SDD Lite - clareza de contexto no drawer (01/06/2026)

Objetivo: melhorar a tela `Gestao Administrativa > Sugestoes de Sistemas > Resolver` para que o admin veja, antes de confirmar qualquer resolucao, nomes canonicos, aliases, nome PT, path, tipo e filhos/edicoes/variantes/subsistemas ja existentes do sistema escolhido ou candidato similar.

Problema observado: `/api/v1/systems` ja fornece contexto suficiente (`parent_id`, `name_pt`, `path_slug`, `node_type`, `aliases`, `children_count`), mas o frontend descartava parte disso e o `SearchableSelect` buscava por alias sem mostrar aliases ao usuario.

Classificacao: SDD Lite, pois a solucao esperada e frontend-only usando dados ja existentes da API. Escalar para SDD Completo somente se houver mudanca de migration, permissao, auth ou contrato/API.

Plano:
- [x] Enriquecer `SystemOption` e `SearchableOption` com contexto visivel sem quebrar busca por alias.
- [x] Criar lookup local `systemById`, `childrenByParentId` e helpers de contexto.
- [x] Mostrar aliases/nome PT/path/tipo/filhos nos candidatos similares e no item selecionado.
- [x] Mostrar contexto especifico para `create_alias`, `merge_existing`, `create_child` e risco de `create_system`.
- [x] Atualizar previa com alvo/pai canonico, path, efeito concreto e risco quando aplicavel.
- [x] Rodar `npm --prefix frontend run build` e `git diff --check`.

Arquivos provaveis:
- `frontend/src/components/SystemSuggestionResolutionDrawer.tsx`
- `frontend/src/components/SearchableSelect.tsx`
- `database/changelogs.json` se changelog visivel for necessario

Criterio de conclusao:
- Admin ve aliases existentes e edicoes/filhos existentes antes de confirmar qualquer resolucao.
- Busca por alias continua funcionando.
- Nenhum dado externo entra em estado/render sem normalizador.
- `npm --prefix frontend run build` GREEN.
- `git diff --check` limpo.
- Sessao atualizada com evidencias.

Implementacao:
- `frontend/src/components/SystemSuggestionResolutionDrawer.tsx`: `SystemOption` preserva `parent_id`, `children_count`, `aliases`, `name_pt`, `node_type` e `path_slug`; cria `systemById`/`childrenByParentId`; candidatos mostram nome canonico, path/tipo/nome PT, aliases e filhos; forms de `create_alias`, `merge_existing`, `create_child` e `create_system` exibem contexto/risco antes da confirmacao; preview descreve alvo/pai e efeito concreto.
- `frontend/src/components/SearchableSelect.tsx`: busca por alias mantida; resultados e item selecionado mostram badge de tipo, path, nome PT e chips de aliases.
- `database/changelogs.json`: entrada 01/06 ajustada para mencionar nomes/apelidos/edicoes ja cadastrados antes da confirmacao.

Evidencias:
- `npm --prefix frontend run build`: GREEN (`tsc -b && vite build`; aviso nao bloqueante de chunk >500 kB).
- `database/changelogs.json | ConvertFrom-Json`: GREEN.
- `git diff --check`: sem erros; apenas avisos EOL LF -> CRLF nos dois arquivos TSX.
- Busca final (`rg parent_id|children_count|aliases existentes|Filhos ja existentes|Risco antes de criar raiz nova|chips`): confirmou campos/contextos no drawer/select.

Pendente:
- Commit/push/deploy Beta somente apos aprovacao explicita por acao.
- Validacao funcional conclusiva continua sendo teste do mantenedor no Beta em janela anonima apos deploy.
