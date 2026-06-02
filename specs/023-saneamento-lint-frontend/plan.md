# Plan 023 - Saneamento de Lint do Frontend

## Estado Medido (provas)

Comando: `npm --prefix frontend run lint` em 02/06/2026, branch `feat/022-feedback-desenvolvimento`.

Resultado: `124 problems (110 errors, 14 warnings)`.

Config: `frontend/eslint.config.js` (presets recommended, sem override; ignora `dist`). CI nao roda este lint (job `lint` = shellcheck/actionlint via `_lint-shell.yml`).

## Estrategia por Categoria de Regra

Atacar por regra, da mais segura (mecanica) para a mais sensivel (comportamental).

### 1. `no-unused-vars` (6 errors) — mecanico, risco baixo

- Remover import/variavel morta; ou prefixar `_` em parametro exigido por assinatura.
- Verificar que o simbolo nao tem efeito colateral antes de remover.

### 2. `only-export-components` (3 errors) — estrutural, risco baixo

- Mover constantes/helpers/contextos exportados junto de componentes para modulo proprio (ex.: `*.constants.ts`, `*.context.ts`), atualizando imports.

### 3. `no-explicit-any` (96 errors) — tipagem, risco medio

- Por ocorrencia: substituir `any` por tipo real, `unknown` + narrowing, ou tipo de payload normalizado.
- Reusar tipos/normalizadores existentes: `frontend/src/types/**`, `frontend/src/schemas/**`, normalizadores ja presentes (ex.: padroes de `GestaoPage`, `devFeedbackApi`).
- Para dados de API/DB/localStorage: normalizar como `unknown` antes de virar estado/props (NFR-002).
- `eslint-disable` so com comentario justificando (ultimo recurso).

### 4. `exhaustive-deps` (14 warnings) — hooks, risco medio

- Incluir dependencia correta quando seguro.
- Quando incluir causar loop/refetch indevido, manter exclusao com `// eslint-disable-next-line react-hooks/exhaustive-deps` + motivo, ou estabilizar a funcao com `useCallback`.

### 5. `set-state-in-effect` (4) e `set-state-in-render` (1) — comportamental, risco alto

- Caso a caso. `set-state-in-render` deve sair do corpo de render (mover para evento/efeito/derivacao memoizada).
- `set-state-in-effect`: validar se o efeito e necessario; preferir estado derivado/memo quando possivel, sem mudar comportamento observavel.
- Cada correcao acompanhada de verificacao manual do fluxo afetado.

## Ordem de Execucao (commits atomicos por grupo)

1. `no-unused-vars` (1 commit).
2. `only-export-components` (1 commit).
3. `no-explicit-any` por grupos de arquivo (varios commits pequenos, ex.: services, hooks, pages, features), reavaliando lint e build a cada grupo.
4. `exhaustive-deps` (1-2 commits).
5. `set-state-*` (1 commit, com validacao funcional).
6. Reconciliacao final + build + testes.

A cada grupo: `npm --prefix frontend run lint` (contagem cai), `build`, e testes do escopo tocado.

## Arquivos (concentracoes; lista completa derivada do lint no inicio da execucao)

Top: `src/pages/CatalogoPage.tsx` (11), `src/services/analytics.ts` (9), `src/hooks/useProfile.ts` (8), `src/hooks/useProfileQuery.ts` (7), `src/features/create-table/components/CreateTableForm.tsx` (6), `src/services/apiClient.ts` (5), `src/utils/sanitize.ts` (4), `src/pages/PainelMestrePage.tsx` (4), `src/hooks/useLinks.ts` (4), `src/components/SettingStylesField.tsx` (4). Restante (~30 arquivos) com 1-3.

A lista canonica deve ser regenerada com o lint no comeco da execucao (o inventario pode mudar conforme `dev` evolui).

## Validacao Tecnica

- `npm --prefix frontend run lint` -> 0 errors (meta).
- `npm --prefix frontend run build` GREEN.
- `npm --prefix frontend test` GREEN.
- `git diff --check` limpo.
- Diff revisado garantindo zero mudanca de comportamento (especial atencao aos `set-state-*`).

## Validacao Funcional

- Apos deploy em `dev`/Beta, mantenedor confere as telas com maior concentracao de mudanca (Catalogo, Painel do Mestre, Criar Mesa, Perfil) em janela anonima.

## Decisoes a Confirmar com o Mantenedor (antes de executar)

- D1: Tratar os 14 warnings de `exhaustive-deps` nesta spec ou deixar so os errors? (proposta: tratar/justificar todos).
- D2: Apos zerar, adicionar o ESLint frontend como gate de CI? (follow-up sugerido, fora desta spec por padrao).
- D3: Politica de `eslint-disable` pontual permitida com justificativa, ou proibir 100%?
