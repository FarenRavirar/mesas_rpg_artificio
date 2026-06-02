# Spec 023 - Saneamento de Lint do Frontend

## Objetivo

Zerar os erros de ESLint do frontend (`npm --prefix frontend run lint`) sem alterar comportamento de runtime, eliminando debito de qualidade acumulado antes da abertura ao publico.

## Problema

O lint do frontend acusa erros pre-existentes herdados de codigo legado. Inventario medido em 02/06/2026 (branch `feat/022-feedback-desenvolvimento`, apos tipar GestaoPage):

```
npm --prefix frontend run lint  ->  124 problems (110 errors, 14 warnings)
```

Esses erros nao sao introduzidos pela Spec 022 (feedback de desenvolvimento), que adiciona 0 erros. Sao codigo antigo.

### Inventario por regra (provas do lint)

| Regra | Qtd | Severidade |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | 96 | error |
| `@typescript-eslint/no-unused-vars` | 6 | error |
| `react-hooks/set-state-in-effect` | 4 | error |
| `react-refresh/only-export-components` | 3 | error |
| `react-hooks/set-state-in-render` | 1 | error |
| `react-hooks/exhaustive-deps` | 14 | warning |

Total: 110 errors + 14 warnings. (96+6+4+3+1 = 110 errors.)

### Inventario por arquivo (top concentracoes, problemas err+warn)

| Arquivo | Qtd |
|---|---|
| `src/pages/CatalogoPage.tsx` | 11 |
| `src/services/analytics.ts` | 9 |
| `src/hooks/useProfile.ts` | 8 |
| `src/hooks/useProfileQuery.ts` | 7 |
| `src/features/create-table/components/CreateTableForm.tsx` | 6 |
| `src/services/apiClient.ts` | 5 |
| `src/utils/sanitize.ts` | 4 |
| `src/pages/PainelMestrePage.tsx` | 4 |
| `src/hooks/useLinks.ts` | 4 |
| `src/components/SettingStylesField.tsx` | 4 |

Restante distribuido em ~30 arquivos com 1-3 ocorrencias cada (ProfileContext, SystemTreeSelector, authenticatedFetch, useCreateTableForm, MesaPage, OnboardingPage, hooks de insights, mappers, etc.).

### Contexto de risco real

- CI **nao** roda este ESLint como gate. O job `lint` dos workflows de deploy (`deploy-beta.yml`/`deploy-prod.yml`) usa `_lint-shell.yml` (shellcheck + actionlint), nao `eslint .` do frontend. Logo, os 110 erros **nao bloqueiam deploy** hoje.
- Config: `frontend/eslint.config.js` usa presets `recommended` (`@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`) sem override de regras; `dist` ignorado. `no-explicit-any` e error por padrao.

## Escopo

- Eliminar os 110 erros de ESLint do frontend.
- Tratar os 14 warnings de `exhaustive-deps` (corrigir ou suprimir com justificativa por caso).
- Tipagem real onde houver `any` (preferir tipos/normalizadores existentes; respeitar NFR-004 de normalizar payload externo como `unknown`).
- Remover/ajustar imports e variaveis nao usadas.
- Corrigir padroes de hooks (`set-state-in-effect`, `set-state-in-render`) sem mudar comportamento observavel.
- Ajustar `only-export-components` (separar exports nao-componente de arquivos de componente).

## Fora do Escopo

- Backend (jest/tsc backend ja verde; sem erros equivalentes nesta spec).
- Mudanca de comportamento de runtime, UI ou contrato de API.
- Introduzir o ESLint frontend como gate de CI (pode virar follow-up apos zerar).
- Refatorar arquitetura de hooks/servicos alem do necessario para o lint.
- Reescrever testes (apenas garantir que continuam verdes).

## Requisitos Funcionais

- FR-001: `npm --prefix frontend run lint` retorna 0 errors.
- FR-002: Cada `any` removido vira tipo explicito, `unknown` + narrowing, ou tipo de payload normalizado; proibido `eslint-disable` de `no-explicit-any` sem justificativa registrada por caso.
- FR-003: `no-unused-vars` resolvido removendo o simbolo ou prefixando `_` quando exigido por assinatura.
- FR-004: `set-state-in-effect`/`set-state-in-render` resolvidos sem alterar comportamento observavel (validar com testes e fluxo).
- FR-005: `only-export-components` resolvido movendo helpers/constantes para modulo separado quando aplicavel.
- FR-006: `exhaustive-deps` (warnings) corrigido por dependencia correta ou suprimido com comentario justificando, caso a inclusao cause loop.

## Requisitos Nao Funcionais

- NFR-001: Sem mudanca de comportamento de runtime; `npm --prefix frontend run build` e `npm --prefix frontend test` permanecem verdes.
- NFR-002: Dados externos normalizados como `unknown` antes de entrar em estado/props (AGENTS.md).
- NFR-003: Mudanca minima por arquivo; sem refactor arquitetural amplo.
- NFR-004: TypeScript estrito, sem `any` implicito novo.
- NFR-005: Cada `eslint-disable` pontual exige comentario com motivo.

## Risco e Processo

Classificacao: SDD Completo (refatoracao ampla, ~40 arquivos), apesar de baixo risco por arquivo.

Motivo:

- Toca muitos arquivos de UI/servicos/hooks.
- `set-state-in-effect`/`set-state-in-render` podem mascarar bugs de render; correcao errada muda comportamento.
- Requer validacao funcional pos-deploy em Beta.

Observacao de prioridade: como o ESLint frontend nao e gate de CI, esta spec e debito de qualidade, nao bloqueio de release. Deve ser executada **apos** a Spec 022 estar concluida e validada.

## Pre-condicao de Execucao

- Spec 022 (feedback de desenvolvimento) 100% concluida e validada (mantenedor em janela anonima no Beta).
- Branch dedicada `feat/023-saneamento-lint-frontend` criada a partir de `dev` atualizado (nao reaproveitar a branch da 022).

## Criterio de Pronto

- `npm --prefix frontend run lint` = 0 errors (warnings tratados ou justificados).
- `npm --prefix frontend run build` GREEN.
- `npm --prefix frontend test` (vitest) GREEN.
- `git diff --check` limpo.
- Nenhuma mudanca de comportamento observavel (validacao do mantenedor quando houver superficie de UI afetada).
- Inventario final reconcilia: 0 erros, delta de warnings documentado.
