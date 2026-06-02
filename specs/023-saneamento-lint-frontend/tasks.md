# Tasks 023 - Saneamento de Lint do Frontend

Pre-condicao: Spec 022 concluida e validada. Branch dedicada `feat/023-saneamento-lint-frontend` a partir de `dev`. Commit/push/deploy exigem aprovacao explicita (AGENTS.md).

Status atual desta spec: **PREVIA / a validar** (nao executar fixes antes da validacao do mantenedor e do fechamento da 022).

## Fase 0 - Preparacao

- [ ] T001 Confirmar decisoes D1-D3 do plan com o mantenedor.
- [ ] T002 Atualizar `dev` local; criar branch `feat/023-saneamento-lint-frontend`.
- [ ] T003 Regenerar inventario: `npm --prefix frontend run lint` -> salvar contagem por regra e por arquivo (baseline da execucao).
- [ ] T004 Abrir sessao e atualizar `sessoes/index.md`.

## Fase 1 - Erros mecanicos

- [ ] T005 Corrigir `no-unused-vars` (6): remover simbolo morto ou prefixar `_`. Lint recount.
- [ ] T006 Corrigir `only-export-components` (3): mover helpers/constantes/contexto para modulo proprio; atualizar imports. Build GREEN.

## Fase 2 - Tipagem (no-explicit-any, 96)

- [ ] T007 Grupo services (`analytics.ts`, `apiClient.ts`, `authenticatedFetch.ts`, `logger.ts`): tipar `any`. Lint recount + build.
- [ ] T008 Grupo utils (`sanitize.ts`, `features/table/**` mappers/utils): tipar. Lint recount + build.
- [ ] T009 Grupo hooks (`useProfile`, `useProfileQuery`, `useLinks`, `useMestre`, `useFetchTables`, insights, `useCreateTableForm`, `useAutosave`): tipar. Lint recount + build.
- [ ] T010 Grupo pages (`CatalogoPage`, `PainelMestrePage`, `MesaPage`, `OnboardingPage`, `PlayerPage`, `HomePage`, `SystemsAdminView`, `ScenariosAdminView`): tipar. Lint recount + build.
- [ ] T011 Grupo components/features (`CreateTableForm`, `SettingStylesField`, `SystemTreeSelector`, `ProfileContext`, `ChangelogModal`, `mestre/**`, `master/**`, `admin/**`, `discord-sync/**`, `TableContactsBlock`): tipar. Lint recount + build.
- [ ] T012 Confirmar `no-explicit-any` = 0. Listar qualquer `eslint-disable` usado com justificativa.

## Fase 3 - Hooks

- [ ] T013 Corrigir/justificar `exhaustive-deps` (14 warnings) caso a caso (dep correta, `useCallback`, ou disable justificado).
- [ ] T014 Corrigir `set-state-in-effect` (4) e `set-state-in-render` (1) sem mudar comportamento; validar fluxo afetado manualmente.

## Fase 4 - Qualidade

- [ ] T015 `npm --prefix frontend run lint` = 0 errors.
- [ ] T016 `npm --prefix frontend run build` GREEN.
- [ ] T017 `npm --prefix frontend test` GREEN.
- [ ] T018 `git diff --check` limpo.
- [ ] T019 Revisar diff completo confirmando zero mudanca de comportamento.

## Fase 5 - Beta

- [ ] T020 Commit/push para `dev` quando autorizado.
- [ ] T021 Acompanhar Deploy Beta GREEN.
- [ ] T022 Mantenedor valida telas de maior mudanca em janela anonima.
- [ ] T023 (Opcional/D2) Avaliar adicionar ESLint frontend como gate de CI.
- [ ] T024 Atualizar `.specify/memory/project-state.md`.

## Criterio de Conclusao

- 0 erros de ESLint no frontend; warnings tratados ou justificados.
- Build e testes verdes; sem regressao de comportamento.
- Nenhuma validacao funcional declarada concluida antes do teste do mantenedor em Beta.
