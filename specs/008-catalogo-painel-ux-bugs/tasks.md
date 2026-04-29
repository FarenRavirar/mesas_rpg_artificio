# Tasks: Revisão Visual e Responsiva do Catálogo

**Input**: Design documents from `/specs/008-catalogo-painel-ux-bugs/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: Build técnico do frontend e validação funcional em Beta são obrigatórios; validação visual deve cobrir desktop, tablet/mobile e comparação com gestão de sistemas.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo quando tocar arquivos diferentes e não depender de tarefa incompleta.
- **[Story]**: Mapeia a tarefa para a user story da spec.
- Todas as tarefas devem citar caminho de arquivo.

## Phase 1: Setup (Shared Investigation)

**Purpose**: Mapear superfícies e bugs visuais relacionados antes de alterar código.

- [ ] T001 Identificar a página/componente do catálogo em `frontend/src/` e registrar o caminho encontrado na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T002 Identificar componentes de menus, filtros, cards e estados do catálogo em `frontend/src/` e registrar caminhos na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T003 Identificar componentes/estilos da gestão de sistemas que servem como referência visual para menus e filtros em `frontend/src/`
- [ ] T004 Mapear bugs visuais relacionados ao catálogo, incluindo sobreposição, rolagem horizontal, espaçamento, estados e inconsistências com gestão de sistemas, registrando achados na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`

---

## Phase 2: Foundational (Design Alignment)

**Purpose**: Definir estratégia visual e responsiva antes dos patches.

**⚠️ CRITICAL**: Nenhuma alteração visual deve iniciar antes desta fase estar concluída.

- [ ] T005 Definir estratégia de padronização de menus/filtros do catálogo com base na gestão de sistemas e registrar na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T006 Definir estratégia responsiva para desktop, tablet e mobile nos arquivos do catálogo identificados em `frontend/src/`
- [ ] T007 Registrar na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md` os arquivos exatos que serão modificados antes do primeiro patch técnico

**Checkpoint**: Fundação pronta para implementar histórias com rastreabilidade.

---

## Phase 3: User Story 1 - Catálogo sem sobreposição visual (Priority: P1) 🎯 MVP

**Goal**: Corrigir sobreposição visual no catálogo preservando hierarquia entre menus, filtros, cards e estados.

**Independent Test**: Abrir catálogo em desktop, interagir com menus/filtros e rolar a página confirmando ausência de sobreposição indevida.

### Implementation for User Story 1

- [ ] T008 [US1] Ajustar estrutura da página do catálogo no componente identificado em `frontend/src/` para separar menus, filtros e resultados sem sobreposição
- [ ] T009 [US1] Ajustar estilos do catálogo no arquivo CSS correspondente em `frontend/src/` para remover posicionamentos ou limites que causam sobrescrita visual
- [ ] T010 [US1] Ajustar estados carregando, vazio e erro do catálogo no componente identificado em `frontend/src/` para preservar estrutura visual
- [ ] T011 [US1] Validar visualmente o catálogo em desktop e registrar evidência textual na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`

**Checkpoint**: Catálogo desktop funcional e sem sobrescrever a tela.

---

## Phase 4: User Story 2 - Menus e filtros padronizados com gestão de sistemas (Priority: P1)

**Goal**: Alinhar menus e filtros do catálogo ao padrão visual e comportamental da gestão de sistemas.

**Independent Test**: Comparar catálogo com gestão de sistemas e confirmar consistência de espaçamento, estados, agrupamento e comportamento.

### Implementation for User Story 2

- [ ] T012 [US2] Ajustar marcação/estrutura dos filtros do catálogo no componente identificado em `frontend/src/` para refletir o padrão visual da gestão de sistemas
- [ ] T013 [US2] Ajustar estilos de menus/filtros do catálogo no arquivo CSS correspondente em `frontend/src/` para estados ativo, vazio, foco, carregando e limpeza
- [ ] T014 [US2] Garantir que múltiplos filtros ativos permaneçam escaneáveis no catálogo em `frontend/src/`
- [ ] T015 [US2] Validar comparação visual com gestão de sistemas e registrar evidência textual na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`

**Checkpoint**: Menus e filtros coerentes com o padrão interno da plataforma.

---

## Phase 5: User Story 3 - Catálogo responsivo com boas práticas modernas (Priority: P1)

**Goal**: Fazer o catálogo funcionar de forma premium e responsiva em mobile, tablet e desktop.

**Independent Test**: Redimensionar a tela e confirmar ausência de rolagem horizontal indevida, controles acessíveis e resultados preservados.

### Implementation for User Story 3

- [ ] T016 [US3] Implementar adaptação responsiva dos menus/filtros do catálogo no componente identificado em `frontend/src/`
- [ ] T017 [US3] Implementar grid responsivo dos resultados no arquivo de estilos correspondente em `frontend/src/`
- [ ] T018 [US3] Ajustar cards com textos longos, badges ou imagens ausentes no componente de card identificado em `frontend/src/`
- [ ] T019 [US3] Validar catálogo em mobile/tablet e registrar evidência textual na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`

**Checkpoint**: Catálogo responsivo sem rolagem horizontal indevida e sem controles cobrindo resultados de forma permanente.

---

## Phase 6: User Story 4 - Investigar bugs visuais relacionados ao catálogo (Priority: P2)

**Goal**: Garantir que a revisão não deixe bugs visuais relacionados sem classificação.

**Independent Test**: Revisar a lista de achados visuais e confirmar que cada item foi resolvido ou explicitamente classificado como fora de escopo.

### Implementation for User Story 4

- [ ] T020 [US4] Revisar achados mapeados em T004 e marcar cada um como resolvido ou fora de escopo na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T021 [US4] Validar estados carregando, vazio, erro, poucos resultados e muitos resultados no catálogo em `frontend/src/`
- [ ] T022 [US4] Validar zoom/fonte maior e mudança de orientação mobile no catálogo, registrando resultado na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`

**Checkpoint**: Bugs visuais relacionados foram cobertos ou classificados.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificações finais e evidências antes de considerar a implementação pronta para Beta.

- [ ] T023 Executar `npm --prefix frontend run build` e registrar saída na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T024 Validar heurísticas de Nielsen aplicáveis ao catálogo em `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T025 Validar `quickstart.md` no Beta em janela anônima após deploy e registrar resultado na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T026 Atualizar `database/changelogs.json` se a mudança visual for publicada para usuários finais

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende da identificação e mapeamento da Phase 1.
- **US1, US2, US3 e US4**: dependem da Phase 2.
- **Polish**: depende das histórias implementadas.

### User Story Dependencies

- **US1 (P1)**: pode iniciar após Phase 2.
- **US2 (P1)**: pode iniciar após Phase 2; usa a gestão de sistemas como referência.
- **US3 (P1)**: pode iniciar após Phase 2; integra visualmente com US1 e US2.
- **US4 (P2)**: deve consolidar achados após as correções principais.

### Parallel Opportunities

- T001, T002 e T003 podem ser levantadas em paralelo.
- T008 e T012 podem ser paralelas se não tocarem o mesmo componente.
- T017 e T018 podem ser paralelas se grid e card estiverem em arquivos diferentes.

---

## Implementation Strategy

### MVP First

1. Concluir Phase 1 e Phase 2.
2. Implementar US1 para remover sobreposição principal.
3. Implementar US2 para padronizar menus/filtros com gestão de sistemas.
4. Implementar US3 para completar responsividade.
5. Executar US4 para consolidar bugs relacionados.
6. Rodar build técnico e validar no Beta em janela anônima.

### Incremental Delivery

- Cada história deve ser validada separadamente antes de avançar.
- Nenhuma validação local substitui o teste funcional em Beta.
- Qualquer descoberta fora do catálogo deve parar a execução e exigir atualização de spec/plan.
