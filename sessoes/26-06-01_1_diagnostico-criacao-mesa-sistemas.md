# Sessao 26-06-01_1 - Diagnostico criacao de mesa e sistemas

**Data:** 2026-06-01  
**Objetivo:** diagnosticar cinco problemas no fluxo de Nova Mesa, sugestoes de sistemas/cenarios e horario das sessoes; classificar risco/processo; propor plano curto antes de implementar fatias seguras.

## Vinculos

- Pedido do mantenedor em 2026-06-01.
- Governanca: `AGENTS.md`.
- Contexto minimo: `.specify/memory/project-state.md`, `docs/agents/context-capsule.md`.

## Problemas mapeados

1. `Nova Mesa > Descricao da Mesa`: editor rico com contraste ruim em tema escuro.
2. `Nova Mesa > sugestao/adicionar sistema`: sugestao redireciona para `/painel`; esperado manter fluxo de criacao.
3. Admin adicionando sistema: admin nao deve passar por sugestao/aprovacao; deve criar direto catalogo/arvore e disponibilizar no fluxo.
4. `Gestao Administrativa > Sugestoes de Sistemas/Cenarios`: tela limpa ha muito tempo; diagnosticar envio, listagem/filtro, API, tabela, permissao ou ausencia real de dados.
5. `Nova Mesa > horario das sessoes`: adicionar opcoes explicitas `dia da semana a definir` e `horario a definir`; verificar impacto frontend/backend/validacao/normalizacao/banco/API/exibicao publica.

## Modo e classificacao inicial

- Item 1: Sem SDD ou SDD Lite, conforme achado. Provavel ajuste visual localizado.
- Item 2: SDD Lite. Bug de fluxo/UX com impacto de produto.
- Item 3: SDD Completo se exigir permissao/backend/contrato; SDD Lite se ja existir endpoint admin seguro reaproveitavel sem contrato novo.
- Item 4: Diagnostico SDD Lite; SDD Completo se exigir write DB, migration, auth/permissao ou contrato API.
- Item 5: SDD Completo se exigir schema/API/contrato ou migration; SDD Lite se valores ja forem aceitos como texto livre normalizado e mudanca ficar no frontend/exibicao.

## Plano de execucao

- [ ] Mapear componentes/rotas do fluxo de criacao de mesa.
- [ ] Mapear APIs/backend de sistemas, cenarios e sugestoes.
- [ ] Localizar normalizadores/tipos de horario/dia.
- [ ] Reproduzir ou criar loops rapidos para cada bug antes de fix.
- [ ] Produzir hipoteses ranqueadas e plano curto por fatia.
- [ ] Implementar somente fatias seguras apos diagnostico registrado.
- [ ] Validar com testes/builds adequados.
- [ ] Atualizar `database/changelogs.json` antes de deploy se houver mudanca visivel.

## Arquivos provaveis

- `frontend/src/features/create-table/**`
- `frontend/src/components/**`
- `frontend/src/pages/**`
- `frontend/src/features/admin/**`
- `backend/src/routes/**`
- `backend/src/**systems**`
- `backend/src/**suggest**`
- `database/changelogs.json`
- Arquivos de testes relacionados.

## Criterio de conclusao explicito

- Cada item tem causa provavel ou causa confirmada registrada.
- Cada item tem processo definido: Sem SDD, SDD Lite ou SDD Completo.
- Fatias implementadas tem evidencia tecnica registrada.
- Busca final relevante confirma ausencia de padroes quebrados no escopo alterado.
- `database/changelogs.json` atualizado para mudancas visiveis antes de deploy.
- `.specify/memory/project-state.md` avaliado/atualizado se estado operacional mudar.
- `sessoes/index.md` atualizado com esta sessao.

## Evidencias

- Retomada minima lida em ordem: `.specify/memory/project-state.md`, `AGENTS.md`, `docs/agents/context-capsule.md`.
- `git status --short --branch`: branch `dev`, diff existente em `sessoes/26-05-12_1_parser-refinements-imagens.md` preservado sem alteracao.
- Branch/status inicial: `dev...origin/dev`; arquivos modificados antes desta sessao: `sessoes/26-05-12_1_parser-refinements-imagens.md`.
- Sessao nova aberta por escopo dedicado; sessoes antigas de Discord/governanca preservadas.
- Item 1 mapeado em `frontend/src/components/MarkdownEditor.tsx` usado por `StepBasic`. CSS define texto branco, mas editor de markdown herda areas internas claras da lib; faltam regras fortes para background/caret/selection da area `.sec-md`/`.input`.
- Item 2 mapeado: `CreateTableForm` renderiza um `<form>` externo e `StepSystem` renderiza `SystemSuggestionModal`/`ScenarioSuggestionModal`, cada um com outro `<form>` dentro. HTML nao suporta form aninhado; submit da sugestao pode vazar para o submit da mesa e acionar `refreshData()`, que troca URL para `/painel`.
- Item 3 mapeado: backend ja tem criacao admin direta em `POST /api/v1/systems/admin` e `POST /api/v1/scenarios/admin`; modal de sistema sempre chama `POST /api/v1/system-suggestions`, mesmo quando `user.role === 'admin'`.
- Item 4 mapeado: `GestaoPage` busca somente `/api/v1/admin/system-suggestions`; nao busca nem renderiza `/api/v1/admin/scenario-suggestions`.
- Item 4 SELECT read-only Beta: `system_suggestions` tem 37 linhas (`pending=35`, `approved=2`); `scenario_suggestions` tem 0.
- Item 4 SELECT read-only Producao: `system_suggestions=0`, `scenario_suggestions=0`.
- Item 5 mapeado: frontend exige dia/horario em `SessionRepeater` e `validation.ts`; backend `tableValidators.ts` exige `day_of_week` enum e `start_time` regex; DB `table_schedules` tem `day_of_week TEXT NOT NULL` com CHECK e `start_time TIME NOT NULL`. Opcao "a definir" exige decisao de contrato/dados.

## Hipoteses ranqueadas

1. Item 2: form aninhado causa submit involuntario da mesa; mover modais para portal fora do form pai deve eliminar redirecionamento.
2. Item 1: CSS incompleto do `react-markdown-editor-lite` deixa subarea clara; regras especificas para `.sec-md`, `.input`, `textarea`, `::selection` devem corrigir contraste.
3. Item 4: tela limpa em Producao e real para dados de Producao; Beta tem sistemas pendentes, mas UI nao inclui cenarios. Se mantenedor testa Beta e nao ve sistemas, investigar aba/filtro/auth.
4. Item 3: backend suporta criacao direta de sistema, mas UX nao ramifica por admin; precisa usar endpoint admin e atualizar arvore/selecionar novo sistema.
5. Item 5: sem migration/contrato novo, "a definir" so caberia como ausencia de schedule, mas UI/backend atuais exigem um schedule completo; implementacao correta e SDD Completo.

## Plano por fatia

- Fatia A (SDD Lite, segura): corrigir contraste do `MarkdownEditor`; mover modais de sugestao para portal fora do form pai; validar build frontend e, se possivel, teste/browser.
- Fatia B (SDD Lite, moderada): para admin no modal de sistema, criar direto via `POST /api/v1/systems/admin`, atualizar arvore e selecionar o novo sistema se retorno trouxer `id`; avaliar backend aceitar `description`.
- Fatia C (SDD Lite, moderada): `GestaoPage` listar sistemas e cenarios, com filtros por status e acoes por tipo; corrigir rejeicao de cenarios sem motivo se UX exigir descarte rapido igual sistemas.
- Fatia D (SDD Completo): definir modelo de `dia a definir`/`horario a definir` antes de editar DB/API. Opcoes: permitir schedule parcial com colunas nullable + status explicito, ou modelar disponibilidade como enum separado sem criar `table_schedules` incompleto.

## Execucao

- Ajuste de governanca solicitado pelo mantenedor em 2026-06-01: deixar claro nos documentos core que Browser plugin/Playwright local nao contam como validacao funcional de UI; fluxo correto e publicar em `dev`/Beta e aguardar analise do mantenedor.
- Fatia A iniciada: `MarkdownEditor`, `SystemSuggestionModal`, `ScenarioSuggestionModal` e teste frontend dedicado.
- Fatia A validada: `npm --prefix frontend test -- suggestionModals` GREEN; `npm --prefix frontend run build` GREEN; `database/changelogs.json` atualizado e JSON valido.
- Fatia B iniciada: admin deve criar sistema direto pelo endpoint admin existente e manter o fluxo de Nova Mesa.
- Fatia B validada: `SystemSuggestionModal` usa `POST /api/v1/systems/admin` para `user.role === 'admin'`, retorna `id` para selecionar no fluxo e backend preserva `description`; `npm --prefix frontend test -- suggestionModals` GREEN; `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN.
- Fatia C implementada: `GestaoPage` busca e normaliza `system_suggestions` e `scenario_suggestions`, mistura ambas na fila administrativa e usa endpoint correto para aprovar/rejeitar por tipo; backend de cenarios aceita rejeicao sem motivo, alinhado a sistemas.
- Fatia C validada: `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; `database/changelogs.json` valido; `git diff --check` sem erro (apenas avisos de EOL).
- Fatia D nao implementada nesta rodada: exige SDD Completo por contrato/API/DB de `table_schedules`.
- Deploy Beta autorizado pelo mantenedor em 2026-06-01: comando "faca o deploy" deve ser tratado como aprovacao explicita para commit e `git push origin dev` neste contexto operacional.
- Planejamento solicitado para proximo chat em 2026-06-01: criar SDD Completo `specs/018-resolucao-sugestoes-sistemas/` para fluxo saudavel de resolucao de sugestoes, evitando redundancia por alias/edicao/mescla.
