# Sessao 26-06-02_3 - Spec 023 Saneamento de Lint do Frontend

**Data:** 2026-06-02  
**Status:** Em andamento  
**Objetivo:** validar e implementar a Spec 023 para zerar o ESLint do frontend, sem alterar comportamento de runtime.

## Vinculos

- Spec: `specs/023-saneamento-lint-frontend/`
- Branch alvo: `feat/023-saneamento-lint-frontend`
- Base: `dev` / `origin/dev`
- Governanca: `AGENTS.md`, `.specify/memory/constitution.md`, `docs/sdd/SESSION_FAILURES_REGISTRY.md`, `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md`

## Decisoes D1-D3

Confirmadas pelo mantenedor em 2026-06-02:

- D1: tratar ou justificar todos os 14 warnings de `react-hooks/exhaustive-deps` nesta spec.
- D2: deixar ESLint frontend como gate de CI para follow-up fora desta spec, salvo nova decisao.
- D3: permitir `eslint-disable` pontual apenas como ultimo recurso, com justificativa especifica registrada por caso.

## Plano de execucao em fases

1. Fase 0 - Preparacao:
   - registrar sessao dedicada e atualizar `sessoes/index.md`;
   - verificar estado Git sem sobrescrever mudancas existentes;
   - atualizar `dev` local quando possivel;
   - criar branch `feat/023-saneamento-lint-frontend`;
   - regenerar baseline com `npm --prefix frontend run lint`.
2. Fase 1 - erros mecanicos:
   - corrigir `no-unused-vars`;
   - corrigir `only-export-components`;
   - recontar lint e registrar evidencias.
3. Fase 2 - `no-explicit-any` por grupos:
   - services;
   - utils;
   - hooks;
   - pages;
   - components/features;
   - usar `unknown` + narrowing/normalizadores para dados externos.
4. Fase 3 - hooks:
   - corrigir/justificar `exhaustive-deps`;
   - corrigir `set-state-in-effect` e `set-state-in-render`;
   - parar se alguma correcao exigir mudanca comportamental.
5. Fase 4 - qualidade:
   - `npm --prefix frontend run lint`;
   - `npm --prefix frontend run build`;
   - `npm --prefix frontend test`;
   - `git diff --check`;
   - revisar diff completo.
6. Fase 5 - PR/Beta:
   - commit somente com aprovacao explicita;
   - `git push origin feat/023-saneamento-lint-frontend` e PR para `dev` conforme governanca;
   - deploy Beta e validacao funcional do mantenedor somente quando autorizado.

## Arquivos previstos

- `sessoes/26-06-02_3_saneamento-lint-frontend.md`
- `sessoes/index.md`
- `specs/023-saneamento-lint-frontend/tasks.md`
- Arquivos frontend apontados pelo baseline novo de `npm --prefix frontend run lint`
- Possivel `specs/023-saneamento-lint-frontend/pr-description.md` quando houver PR
- `.specify/memory/project-state.md` somente se estado operacional mudar

## Criterio de conclusao

- `npm --prefix frontend run lint` com 0 errors.
- Warnings de `exhaustive-deps` corrigidos ou justificados.
- `npm --prefix frontend run build` GREEN.
- `npm --prefix frontend test` GREEN.
- `git diff --check` limpo.
- Diff revisado sem mudanca intencional de comportamento de runtime.
- Sessao atualizada com evidencias literais por fase.
- Nenhuma validacao funcional de UI declarada antes de deploy Beta e teste do mantenedor em janela anonima.

## Evidencias esperadas

- Comando literal executado.
- Resultado literal observado.
- Arquivos modificados por `git status --short`.
- Proxima acao registrada apos cada fase.

## Registro inicial

- Leitura minima concluida: `.specify/memory/project-state.md`, `AGENTS.md`, `docs/agents/context-capsule.md`.
- Verificacao de `sessoes/` e `sessoes/index.md` concluida; proxima sessao indicada era `26-06-02_3_*`.
- Preflight SDD Completo lido: `.specify/memory/constitution.md`, `docs/sdd/SESSION_FAILURES_REGISTRY.md`, `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md`, `docs/sdd/analyze-governance-gate.md`.
- Antes desta sessao, `git status --short --branch` ja indicava branch `dev...origin/dev` com modificacoes preexistentes em:
  - `.specify/memory/project-state.md`
  - `sessoes/26-06-02_1_feedback-desenvolvimento.md`
  - `sessoes/26-06-02_2_feedback-triage.md`
  - `specs/023-saneamento-lint-frontend/tasks.md`
  - `specs/024-feedback-triage/tasks.md`
- O que sera feito agora: registrar sessao, preservar mudancas existentes, verificar `dev`/`origin/dev`, criar branch dedicada e regenerar baseline.
- O que precisa ser feito: implementar Fases 1-4 sem mudanca de runtime; Fase 5 so com autorizacao para commit/deploy conforme governanca.
- O que ja foi feito: D1-D3 confirmadas pelo mantenedor.

## Checklist de fechamento

- [x] Sessao dedicada aberta.
- [x] `sessoes/index.md` atualizado.
- [x] D1-D3 confirmadas.
- [x] Baseline novo regenerado.
- [x] Fase 1 concluida com evidencia.
- [x] Fase 2 concluida com evidencia.
- [ ] Fase 3 concluida com evidencia.
- [ ] Fase 4 concluida com evidencia.
- [ ] `.specify/memory/project-state.md` atualizado quando houver mudanca operacional.
- [ ] `.specify/memory/session-log.md` atualizado via procedimento `/speckit.retro.run` quando houver fechamento real.
- [ ] Sessao movida para `encerradas/` somente quando autorizado.
- [ ] `sessoes/index.md` atualizado no fechamento.

## Evidencias

### 2026-06-02 - Inicio

Comandos:

```powershell
Get-Content -LiteralPath '.specify\memory\project-state.md'
Get-Content -LiteralPath 'AGENTS.md'
Get-Content -LiteralPath 'docs\agents\context-capsule.md'
Get-ChildItem -LiteralPath 'sessoes' -Force | Select-Object Name,Mode,LastWriteTime
Get-Content -LiteralPath 'sessoes\index.md'
Get-Content -LiteralPath '.specify\memory\constitution.md'
Get-Content -LiteralPath 'docs\sdd\SESSION_FAILURES_REGISTRY.md'
Get-Content -LiteralPath 'docs\sdd\MAINTAINER_REVIEW_CHECKLIST.md'
Get-Content -LiteralPath 'docs\sdd\analyze-governance-gate.md'
git status --short --branch
```

Resultado:

```text
Leitura obrigatoria e preflight SDD concluidos.
git status: branch dev...origin/dev com modificacoes preexistentes em project-state, sessoes 022/024 e tasks 023/024.
```

Proxima acao: atualizar `sessoes/index.md`, verificar refs Git e preparar branch dedicada sem sobrescrever mudancas existentes.

### 2026-06-02 - Fase 0 / D1-D3, dev e branch

Comandos:

```powershell
git fetch origin
git status --short --branch
git rev-parse HEAD
git rev-parse origin/dev
git branch --list feat/023-saneamento-lint-frontend
git rev-list --left-right --count HEAD...origin/dev
git switch -c feat/023-saneamento-lint-frontend
git status --short --branch
git rev-parse HEAD
```

Resultado:

```text
git fetch origin: sem erro.
HEAD: 18330bcda7c22a3753086fd431281fc22d39c2c0
origin/dev: 18330bcda7c22a3753086fd431281fc22d39c2c0
ahead/behind: 0 0
branch existente: nenhuma
git switch: Switched to a new branch 'feat/023-saneamento-lint-frontend'
status apos branch: feat/023-saneamento-lint-frontend com dirty state documental preexistente preservado + esta sessao/index.
```

Arquivos modificados observados:

```text
 M .specify/memory/project-state.md
 M sessoes/26-06-02_1_feedback-desenvolvimento.md
 M sessoes/26-06-02_2_feedback-triage.md
 M sessoes/index.md
 M specs/023-saneamento-lint-frontend/tasks.md
 M specs/024-feedback-triage/tasks.md
?? sessoes/26-06-02_3_saneamento-lint-frontend.md
```

Proxima acao: regenerar baseline literal com `npm --prefix frontend run lint`.

### 2026-06-02 - Fase 0 / baseline novo

Comandos:

```powershell
npm --prefix frontend run lint
$eslint = Join-Path (Get-Location) 'node_modules\.bin\eslint.cmd'; $json = & $eslint . --format json 2>$null; ...
```

Resultado literal principal:

```text
> frontend_temp@0.0.0 lint
> eslint .

✖ 124 problems (110 errors, 14 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.
```

Resumo por regra:

```text
@typescript-eslint/no-explicit-any    96
react-hooks/exhaustive-deps           13
@typescript-eslint/no-unused-vars      6
react-hooks/set-state-in-effect        4
react-refresh/only-export-components   3
unused eslint-disable directive        1
react-hooks/set-state-in-render        1
```

Top arquivos por ocorrencias:

```text
frontend\src\pages\CatalogoPage.tsx                              11
frontend\src\services\analytics.ts                                9
frontend\src\hooks\useProfile.ts                                  8
frontend\src\hooks\useProfileQuery.ts                             7
frontend\src\features\create-table\components\CreateTableForm.tsx 6
frontend\src\services\apiClient.ts                                5
frontend\src\utils\sanitize.ts                                    4
frontend\src\pages\PainelMestrePage.tsx                           4
frontend\src\hooks\useLinks.ts                                    4
frontend\src\components\SettingStylesField.tsx                    4
```

Arquivos modificados observados apos baseline:

```text
 M .specify/memory/project-state.md
 M sessoes/26-06-02_1_feedback-desenvolvimento.md
 M sessoes/26-06-02_2_feedback-triage.md
 M sessoes/index.md
 M specs/023-saneamento-lint-frontend/tasks.md
 M specs/024-feedback-triage/tasks.md
?? sessoes/26-06-02_3_saneamento-lint-frontend.md
```

Proxima acao: iniciar Fase 1 (`no-unused-vars`, depois `only-export-components`), com edicoes via `apply_patch`.

### 2026-06-02 - Fase 1 / no-unused-vars

Impacto revisado:

- `ImageUploader`: trocou slot nao usado do state por elisao de array; setter preservado.
- `MestreHero`: prop `totalOpenSlots` continua aceita pelo tipo, mas nao e mais destructurada.
- `MasterProfilePage` e `uiHelpers`: `catch` sem variavel quando erro nao era usado.
- `MasterReviews`: `vm` consumido com `void vm` para preservar assinatura sem renderizar nada.
- `CatalogoPage`: destructuring ignora chave com `[, slug]`.

Comando de recontagem:

```powershell
$eslint = Join-Path (Get-Location) 'node_modules\.bin\eslint.cmd'; $json = & $eslint . --format json 2>$null; ...
```

Resultado:

```text
TOTAL
117
BY_RULE
@typescript-eslint/no-explicit-any 95
react-hooks/exhaustive-deps 13
react-hooks/set-state-in-effect 4
react-refresh/only-export-components 3
unused-eslint-disable 1
react-hooks/set-state-in-render 1
```

### 2026-06-02 - Fase 1 / only-export-components

Impacto revisado:

- `ConfirmProvider`, `AuthProvider` e `ProfileProvider` continuam nos mesmos arquivos usados por `App.tsx`.
- Hooks `useConfirm`, `useAuth` e `useProfileContext` foram movidos para modulos proprios.
- Contextos runtime foram movidos para `confirmDialogContext.ts`, `authContextCore.ts` e `profileContextCore.ts`.
- Imports de consumidores e mock de teste foram atualizados por busca `rg`.

Comandos:

```powershell
rg -n 'useAuth|contexts/AuthContext|contexts/useAuth' frontend\src
rg -n 'useProfileContext|contexts/ProfileContext|contexts/useProfileContext' frontend\src
rg -n 'useConfirm|components/ui/ConfirmDialog|ui/useConfirm' frontend\src
$eslint = Join-Path (Get-Location) 'node_modules\.bin\eslint.cmd'; $json = & $eslint . --format json 2>$null; ...
npm --prefix frontend run build
git status --short --branch
```

Resultado lint:

```text
TOTAL
114
BY_RULE
@typescript-eslint/no-explicit-any 95
react-hooks/exhaustive-deps 13
react-hooks/set-state-in-effect 4
unused-eslint-disable 1
react-hooks/set-state-in-render 1
```

Resultado build:

```text
> frontend_temp@0.0.0 build
> tsc -b && vite build

✓ 2168 modules transformed.
✓ built in 1.58s
```

Arquivos modificados observados:

```text
 M .specify/memory/project-state.md
 M frontend/src/components/ImageUploader.tsx
 M frontend/src/components/LinksManager.tsx
 M frontend/src/components/NotificationBell.tsx
 M frontend/src/components/ProtectedRoute.tsx
 M frontend/src/components/ScenarioSuggestionModal.tsx
 M frontend/src/components/SiteHeader.tsx
 M frontend/src/components/SystemSuggestionModal.tsx
 M frontend/src/components/mestre/MestreHero.tsx
 M frontend/src/components/ui/ConfirmDialog.tsx
 M frontend/src/components/ui/index.ts
 M frontend/src/contexts/AuthContext.tsx
 M frontend/src/contexts/ProfileContext.tsx
 M frontend/src/features/create-table/components/CreateTableForm.tsx
 M frontend/src/features/dev-feedback/FeedbackModal.tsx
 M frontend/src/features/master/MasterProfilePage.tsx
 M frontend/src/features/master/components/MasterReviews.tsx
 M frontend/src/features/table/utils/uiHelpers.ts
 M frontend/src/hooks/useLinks.ts
 M frontend/src/hooks/useProfile.ts
 M frontend/src/hooks/useProfileQuery.ts
 M frontend/src/pages/CatalogoPage.tsx
 M frontend/src/pages/GestaoPage.tsx
 M frontend/src/pages/LoginPage.tsx
 M frontend/src/pages/MesaPage.tsx
 M frontend/src/pages/OnboardingPage.tsx
 M frontend/src/pages/PainelMestrePage.tsx
 M frontend/src/pages/ProfileEditPage.tsx
 M frontend/src/test/suggestionModals.test.tsx
 M sessoes/26-06-02_1_feedback-desenvolvimento.md
 M sessoes/26-06-02_2_feedback-triage.md
 M sessoes/index.md
 M specs/023-saneamento-lint-frontend/tasks.md
 M specs/024-feedback-triage/tasks.md
?? frontend/src/components/ui/confirmDialogContext.ts
?? frontend/src/components/ui/useConfirm.ts
?? frontend/src/contexts/authContextCore.ts
?? frontend/src/contexts/profileContextCore.ts
?? frontend/src/contexts/useAuth.ts
?? frontend/src/contexts/useProfileContext.ts
?? sessoes/26-06-02_3_saneamento-lint-frontend.md
```

Proxima acao: iniciar Fase 2 por grupo, com impacto revisado antes de cada patch.

### 2026-06-02 - Fase 2 / T007 services

Impacto revisado:

- `analytics.ts`: payload livre virou `Record<string, unknown>`; chamadas continuam aceitando objetos.
- `apiClient.ts`: erros passaram por narrowing (`status`, `AbortError`) antes de leitura; retry/toast/body preservados.
- `authenticatedFetch.ts`: body de helpers mutaveis virou `unknown`; `JSON.stringify` preservado.
- `logger.ts`: `extra` virou `Record<string, unknown>`.

Comandos:

```powershell
$eslint = Join-Path (Get-Location) 'node_modules\.bin\eslint.cmd'; $json = & $eslint . --format json 2>$null; ...
npm --prefix frontend run build
```

Resultado lint:

```text
TOTAL
96
BY_RULE
@typescript-eslint/no-explicit-any 77
react-hooks/exhaustive-deps 13
react-hooks/set-state-in-effect 4
unused-eslint-disable 1
react-hooks/set-state-in-render 1
```

Resultado build:

```text
> frontend_temp@0.0.0 build
> tsc -b && vite build

✓ 2168 modules transformed.
✓ built in 2.17s
```

### 2026-06-02 - Fase 2 / T008 utils

Impacto revisado:

- `sanitizeObject`: entrada generica limitada a `Record<string, unknown>`; sanitizacao so altera strings e strings dentro de arrays como antes.
- `tableViewMapper`: contatos tipados como `TableContact[]`; leitura de `sort_order`, `channel`, `value` e `discord_server_url` fica no contrato existente.

Comandos:

```powershell
$eslint = Join-Path (Get-Location) 'node_modules\.bin\eslint.cmd'; $json = & $eslint . --format json 2>$null; ...
npm --prefix frontend run build
```

Resultado lint:

```text
TOTAL
91
BY_RULE
@typescript-eslint/no-explicit-any 72
react-hooks/exhaustive-deps 13
react-hooks/set-state-in-effect 4
unused-eslint-disable 1
react-hooks/set-state-in-render 1
```

Resultado build:

```text
> frontend_temp@0.0.0 build
> tsc -b && vite build

✓ 2168 modules transformed.
✓ built in 2.41s
```

Proxima acao: T009 hooks, priorizando normalizacao de payloads de API/local state sem mudar chamadas.

### 2026-06-02 - Fase 2 / T009 hooks

Impacto revisado:

- `catch` passou de `any` para `unknown` com fallback de mensagem.
- `useLinks` passou a normalizar payload de API antes de `setLinks`.
- `useProfile`/`useProfileQuery` usam tipos de retorno de perfil/sistema em vez de `data:any`.
- `useCreateTableForm` formaliza `initialData.id?` sem adicionar `id` ao mapper, preservando comportamento atual.

Resultado:

```text
TOTAL
64
BY_RULE
@typescript-eslint/no-explicit-any 45
react-hooks/exhaustive-deps 13
react-hooks/set-state-in-effect 4
unused-eslint-disable 1
react-hooks/set-state-in-render 1
```

Build:

```text
> frontend_temp@0.0.0 build
> tsc -b && vite build

✓ 2168 modules transformed.
✓ built in 2.34s
```

### 2026-06-02 - Fase 2 / T010 pages

Impacto revisado:

- `CatalogoPage`: tipos de filtros alinhados a opcoes que a UI ja enviava (`slots`, `ending_soon`), com validadores locais para selects.
- `PainelMestrePage`: payloads de `gm/me` e `gm/tables` passam por guards antes de estado.
- `MesaPage`: `gm_user_id` opcional adicionado a `TableCard/TableDetail`, refletindo campo de runtime ja lido.
- `ScenariosAdminView`: adaptador `Scenario -> System` para `EntityInspector`.

Resultado:

```text
TOTAL
44
BY_RULE
@typescript-eslint/no-explicit-any 25
react-hooks/exhaustive-deps 13
react-hooks/set-state-in-effect 4
unused-eslint-disable 1
react-hooks/set-state-in-render 1
```

Build:

```text
> frontend_temp@0.0.0 build
> tsc -b && vite build

✓ 2168 modules transformed.
✓ built in 2.15s
```

### 2026-06-02 - Fase 2 / T011-T012 components/features

Impacto revisado:

- `mapTableApiToInitialData`: `unknown` + helpers/guards; defaults preservados para payload invalido.
- `CreateTableForm`: draft/localStorage tipado como `formState`; arvore de sistemas normalizada antes de estado.
- `MarkdownEditor`: ref tipado pelo componente da lib, sem `any` local.
- Componentes mestres/admin/form steps: tipos de setter, erro e icones explicitados.

Comandos:

```powershell
rg -n "any" frontend\src
$eslint = Join-Path (Get-Location) 'node_modules\.bin\eslint.cmd'; $json = & $eslint . --format json 2>$null; ...
npm --prefix frontend run build
rg -n "no-explicit-any|eslint-disable" frontend\src
git status --short --branch
```

Resultado:

```text
rg -n "any" frontend\src: sem resultados.
TOTAL
19
BY_RULE
react-hooks/exhaustive-deps 13
react-hooks/set-state-in-effect 4
unused-eslint-disable 1
react-hooks/set-state-in-render 1
```

Build:

```text
> frontend_temp@0.0.0 build
> tsc -b && vite build

✓ 2168 modules transformed.
✓ built in 3.75s
```

`eslint-disable`:

```text
frontend\src\components\NotificationBell.tsx:79:    // eslint-disable-next-line react-hooks/exhaustive-deps
frontend\src\modules\admin\dev-feedback\DevFeedbackPanel.tsx:54:    // eslint-disable-next-line react-hooks/exhaustive-deps
```

Nao ha `eslint-disable` de `@typescript-eslint/no-explicit-any`.

Proxima acao: Fase 3 hooks (`exhaustive-deps`, disables existentes, `set-state-*`).

### 2026-06-02 - Mudanca de rota solicitada

Pedido do mantenedor:

```text
não avance para a fase 3, faça deploy antes. e um a cada fase que terminar
```

Decisao operacional:

- Pausar antes da Fase 3.
- Preparar entrega da Fase 0-2 em commit/PR/deploy Beta antes de continuar.
- A partir daqui, executar uma entrega/deploy por fase concluida, sem acumular fases.
- `git commit` exige aprovacao explicita por acao; `git push origin feat/*` e abertura de PR sao automaticos apos commit, conforme governanca, mas merge/deploy Beta dependem do fluxo para `dev` e autorizacao quando aplicavel.
