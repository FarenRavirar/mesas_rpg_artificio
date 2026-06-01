# Tasks 018 - Resolucao de Sugestoes de Sistemas

## Fase 0 - Preparacao

- [x] T001 Confirmar decisao de auditoria: **colunas em `system_suggestions`** (decidido pelo mantenedor).
- [x] T002 Inventario das pendentes Beta confirmado (35 pending) e exemplos classificados via testes de candidatos.
- [x] T003 Status final: **reusar `approved` + `resolution_type`** (mantem CHECK e filtros UI).

## Fase 1 - Backend de candidatos

- [x] T004 Testes para normalizacao de nomes em `backend/src/services/__tests__/systemSuggestionCandidates.test.ts` (RED antes da impl).
- [x] T005 Normalizador `normalizeSystemName`: acento, simbolos, `TM`, `&`->and, caixa, tokens de edicao (5e/5a/1.3/2024), sufixo RPG generico.
- [x] T006 Helper `scoreSystemCandidates` contra `systems` e `system_aliases` (igualdade, base+edicao, Levenshtein).
- [x] T007 Endpoint `GET /api/v1/admin/system-suggestions/:id/candidates`.
- [x] T008 Candidatos testados para `D&D 5a edicao 2024` (alias D&D), `CAIN 1.3` (base+edicao), `Pokemon RPG` (base), `On-Two-Six` (sistema novo). 14/14 GREEN.

## Fase 2 - Auditoria e resolucao

- [x] T009 Migration `database/migration_123_system_suggestion_resolution.sql` (idempotente, online-safe, CHECK de resolution_type).
- [x] T010 Tipos DB: `SystemSuggestionsTable` + `SuggestionResolutionType` em `backend/src/db/types.ts`.
- [x] T011 Endpoint `POST /api/v1/admin/system-suggestions/:id/resolve`.
- [x] T012 Resolucao `create_system` (com guard NFR-001: bloqueia raiz se houver candidato similar sem `force`).
- [x] T013 Resolucao `create_child` (edition/variant/subsystem, valida `VALID_PARENT`, gera path_slug/depth).
- [x] T014 Resolucao `create_alias` idempotente (no-op se alias_slug ja existe no alvo).
- [x] T015 Resolucao `merge_existing` (nao cria nada no catalogo).
- [x] T016 `reject` mantido compativel (motivo opcional).
- [x] T017 Relink de drafts Discord por `raw_system_hint` via helper `relinkDiscordDrafts` (espelha o approve).

## Fase 3 - Frontend admin

- [x] T018 Normalizadores `unknown` para candidates/systems/resolve em `SystemSuggestionResolutionDrawer.tsx`.
- [x] T019 Card de sugestao de sistema usa acao primaria `Resolver` (cenarios mantem Aprovar).
- [x] T020 Drawer `SystemSuggestionResolutionDrawer` criado.
- [x] T021 Candidatos com score e razoes exibidos; acao recomendada destacada.
- [x] T022 Formularios de alias, filho, novo sistema, mescla e rejeicao.
- [x] T023 Previa do efeito (path/alias) antes de confirmar.
- [x] T024 Lista recarrega apos resolucao mantendo filtro atual.

## Fase 4 - Qualidade

- [x] T025 Backend candidatos testados (14 GREEN). Resolucao validada por build (integracao com DB sera validada em Beta — infra de teste do projeto e unit-style).
- [ ] T026 Teste unitario dedicado do drawer/normalizadores frontend nao adicionado; normalizadores cobertos por build TS. (Pendente opcional.)
- [x] T027 `npm --prefix backend run build` GREEN.
- [x] T028 `npm --prefix frontend run build` GREEN.
- [x] T029 `database/changelogs.json` atualizado (bullet unificado na entrada 01/06) e JSON valido.
- [x] T030 `git diff --check` sem erros (apenas avisos de EOL CRLF).

## Fase 5 - Beta

- [ ] T031 Commit e push para `dev` quando autorizado por pedido de deploy.
- [ ] T032 Acompanhar Deploy Beta.
- [ ] T033 Registrar run GREEN e smokes.
- [ ] T034 Mantenedor validar em janela anonima resolvendo amostra real.
- [ ] T035 Registrar resultado e proximos ajustes.

## Criterio de Conclusao

- Sugestoes deixam de criar raiz duplicada por padrao.
- Alias/edicao/mescla existem como resolucoes explicitas.
- A fila pendente fica limpa ou explicavelmente pendente.
- Nenhum teste funcional de UI e declarado concluido antes do teste do mantenedor em Beta.
