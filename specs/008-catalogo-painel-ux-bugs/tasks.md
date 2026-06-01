# Tasks: Catálogo e Painel UX Bugs

**Input**: Design documents from `specs/008-catalogo-painel-ux-bugs/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/README.md`, `quickstart.md`  
**Tests**: validação técnica obrigatória com `npm --prefix frontend run build`; testes Vitest focados somente se a implementação introduzir lógica pura isolável. Validação funcional final exige Beta em janela anônima.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo quando tocar arquivos diferentes e não depender de tarefa incompleta.
- **[Story]**: mapeia a tarefa para a user story da spec.
- Todas as tarefas citam caminhos reais de arquivos.

## Phase 1: Setup (Shared Investigation)

**Purpose**: Confirmar o baseline real antes de alterar UI, já que a spec foi gerada por IA.

- [x] T001 Registrar baseline de código consultado e achado do `SystemTreeSelector` em `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md`
- [x] T002 [P] Mapear a estrutura sticky atual do catálogo em `frontend/src/pages/CatalogoPage.tsx`
- [x] T003 [P] Mapear o contrato visual atual do drawer mobile em `frontend/src/components/FilterDrawer.tsx`
- [x] T004 [P] Mapear a referência de busca/filtros da gestão de sistemas em `frontend/src/features/admin/components/CatalogToolbar.tsx`
- [x] T005 [P] Mapear o comportamento `singleSelect` e o bug de variantes em `frontend/src/components/SystemTreeSelector.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Preparar decisões compartilhadas que bloqueiam as user stories.

**CRITICAL**: Nenhuma alteração visual deve começar antes desta fase estar concluída.

- [x] T006 Definir no registro de sessão `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md` a lista final de arquivos frontend autorizados para implementação
- [x] T007 Definir estratégia de layout do catálogo em `specs/008-catalogo-painel-ux-bugs/quickstart.md`, incluindo breakpoints desktop/tablet/mobile e risco de `top-[88px]`
- [x] T008 Definir checklist de validação visual e Nielsen em `specs/008-catalogo-painel-ux-bugs/quickstart.md`

**Checkpoint**: Fundação pronta; user stories podem ser implementadas e testadas em incrementos independentes.

---

## Phase 3: User Story 1 - Catálogo sem sobreposição visual (Priority: P1) MVP

**Goal**: Remover sobreposição indevida entre cabeçalho, filtros, cards, botão mobile e estados da página.

**Independent Test**: Abrir `/catalogo`, rolar em desktop, interagir com filtros e confirmar que cabeçalho/filtros não cobrem cards ou estados.

### Implementation for User Story 1

- [x] T009 [US1] Reestruturar cabeçalho e superfície de filtros desktop em `frontend/src/pages/CatalogoPage.tsx` para eliminar dependência frágil de `top-[88px]`
- [x] T010 [US1] Ajustar estados de carregamento, atualização, vazio e erro em `frontend/src/pages/CatalogoPage.tsx` para manter largura e espaçamento estáveis
- [x] T011 [P] [US1] Ajustar camada, largura e áreas fixas do drawer mobile em `frontend/src/components/FilterDrawer.tsx`
- [ ] T012 [US1] Validar US1 localmente e registrar evidência textual em `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md`

**Checkpoint**: Catálogo sem sobreposição visual no fluxo principal.

---

## Phase 4: User Story 2 - Menus e filtros padronizados com gestão de sistemas (Priority: P1)

**Goal**: Tornar busca, filtros, chips e contagem do catálogo coerentes com a gestão de sistemas, preservando semântica atual dos filtros.

**Independent Test**: Comparar `/catalogo` com a gestão de sistemas e confirmar consistência de agrupamento, estados, foco, limpeza e contagem.

### Implementation for User Story 2

- [x] T013 [US2] Reorganizar busca, filtros principais, selos, estilos e contagem em `frontend/src/pages/CatalogoPage.tsx` seguindo a densidade de `CatalogToolbar`
- [x] T014 [P] [US2] Ajustar chips ativos para truncamento, quebra previsível e remoção individual em `frontend/src/components/ActiveFiltersChips.tsx`
- [x] T015 [US2] Preservar parâmetros e comportamento de filtros em `frontend/src/pages/CatalogoPage.tsx` sem alterar `useCatalogFilters`
- [ ] T016 [US2] Validar comparação visual com gestão de sistemas e registrar evidência textual em `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md`

**Checkpoint**: Filtros do catálogo coerentes com a linguagem visual interna.

---

## Phase 5: User Story 3 - Catálogo responsivo com boas práticas modernas (Priority: P1)

**Goal**: Garantir catálogo estável e confortável em mobile, tablet e desktop, sem rolagem horizontal indevida.

**Independent Test**: Redimensionar a tela e confirmar que filtros, drawer, chips, cards e paginação permanecem acessíveis e sem sobreposição.

### Implementation for User Story 3

- [x] T017 [US3] Ajustar grid responsivo, espaçamento de seção e paginação em `frontend/src/pages/CatalogoPage.tsx`
- [x] T018 [P] [US3] Ajustar cards para conteúdo longo, badges, logo VTT e imagem ausente em `frontend/src/components/TableCard.tsx`
- [x] T019 [P] [US3] Ajustar ergonomia mobile do drawer e do rodapé de ações em `frontend/src/components/FilterDrawer.tsx`
- [ ] T020 [US3] Validar mobile/tablet/desktop e registrar evidência textual em `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md`

**Checkpoint**: Catálogo responsivo e sem rolagem horizontal indevida.

---

## Phase 6: User Story 4 - Investigar bugs visuais relacionados ao catálogo (Priority: P2)

**Goal**: Resolver ou classificar bugs relacionados ao catálogo, incluindo impacto no painel pelo seletor de sistemas compartilhado.

**Independent Test**: Revisar achados mapeados e confirmar que cada item foi corrigido ou explicitamente classificado fora de escopo.

### Implementation for User Story 4

- [x] T021 [US4] Corrigir seleção de variantes em modo `singleSelect` usando a lista de variantes correta em `frontend/src/components/SystemTreeSelector.tsx`
- [x] T022 [P] [US4] Validar integração do seletor no passo de sistema em `frontend/src/components/form-steps/steps/StepSystem.tsx`
- [x] T023 [US4] Verificar se o fluxo de edição exige normalização adicional antes de tocar `frontend/src/features/create-table/utils/mapTableApiToInitialData.ts`
- [x] T024 [US4] Se T023 confirmar necessidade, normalizar payload de edição como `unknown` em `frontend/src/features/create-table/utils/mapTableApiToInitialData.ts`
- [ ] T025 [US4] Registrar todos os bugs relacionados como resolvidos ou fora de escopo em `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md`

**Checkpoint**: Bugs relacionados ao catálogo/painel classificados e tratados.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Evidência técnica, documentação e preparação para Beta.

- [x] T026 Executar `npm --prefix frontend run build` e registrar comando e output literal em `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md`
- [ ] T027 Validar o roteiro de `specs/008-catalogo-painel-ux-bugs/quickstart.md` e registrar resultado em `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md`
- [x] T028 Atualizar `database/changelogs.json` com linguagem leiga se a mudança visual for publicada para usuários finais
- [x] T029 Criar `specs/008-catalogo-painel-ux-bugs/pr-description.md` com sumário executivo, mudanças, evidências e checklist pós-merge
- [ ] T030 Atualizar `.specify/memory/project-state.md` com status da feature 008 e próximo passo Beta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: sem dependências.
- **Phase 2 Foundational**: depende da Phase 1.
- **US1, US2, US3**: dependem da Phase 2 e podem ser implementadas em ordem incremental P1.
- **US4**: depende dos achados da Phase 1/2 e pode ser executada após o seletor compartilhado estar mapeado.
- **Polish**: depende das histórias implementadas.

### User Story Dependencies

- **US1 (P1)**: MVP; remove o problema estrutural de sobreposição.
- **US2 (P1)**: pode iniciar após US1 ou em paralelo se não tocar as mesmas seções de `CatalogoPage.tsx`.
- **US3 (P1)**: depende da estrutura visual de US1/US2 para evitar retrabalho.
- **US4 (P2)**: trata bugs relacionados e integração com painel; pode seguir após T005.

### Parallel Opportunities

- T002, T003, T004 e T005 podem rodar em paralelo.
- T011 pode rodar em paralelo com T010.
- T014 pode rodar em paralelo com T013.
- T018 e T019 podem rodar em paralelo após T017.
- T022 pode rodar em paralelo com T023.

---

## Parallel Example: User Story 3

```text
Task: "T018 [P] [US3] Ajustar cards para conteúdo longo, badges, logo VTT e imagem ausente em frontend/src/components/TableCard.tsx"
Task: "T019 [P] [US3] Ajustar ergonomia mobile do drawer e do rodapé de ações em frontend/src/components/FilterDrawer.tsx"
```

---

## Implementation Strategy

### MVP First

1. Completar Phase 1 e Phase 2.
2. Implementar US1 para eliminar a sobreposição principal.
3. Validar US1 isoladamente e registrar evidência.
4. Avançar US2 e US3 para consistência visual e responsividade.
5. Executar US4 para o seletor compartilhado e bugs correlatos.

### Incremental Delivery

- Cada user story deve terminar com evidência registrada na sessão.
- `tasks.md` antigo foi substituído porque continha sessão errada e caminhos genéricos.
- Nenhuma validação local substitui teste funcional em Beta em janela anônima.
- Qualquer arquivo fora da lista de `plan.md` exige parar e pedir orientação do mantenedor.
