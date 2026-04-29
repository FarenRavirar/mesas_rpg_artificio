# Tasks: Editor Rico em Textareas

**Input**: Design documents from `/specs/009-editor-rico-textareas/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: Build técnico do frontend e validação funcional dos formulários alterados são obrigatórios; validação em Beta/janela anônima é obrigatória quando afetar fluxos reais.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo quando tocar arquivos diferentes e não depender de tarefa incompleta.
- **[Story]**: Mapeia a tarefa para a user story da spec.
- Todas as tarefas devem citar caminho de arquivo.

## Phase 1: Setup (Inventory)

**Purpose**: Mapear todos os `textarea` antes de qualquer substituição.

- [ ] T001 Identificar o componente/editor usado em Descrição da Mesa em `frontend/src/` e registrar caminho na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T002 Mapear todas as ocorrências de `textarea` em `frontend/src/` e registrar caminhos na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T003 Criar inventário da feature em `specs/009-editor-rico-textareas/textarea-inventory.md` com arquivo, tela, finalidade e observações de cada ocorrência

---

## Phase 2: Foundational (Classification)

**Purpose**: Classificar ocorrências antes de alterar código.

**⚠️ CRITICAL**: Nenhuma substituição deve iniciar antes do inventário e classificação estarem completos.

- [ ] T004 Classificar cada ocorrência em `specs/009-editor-rico-textareas/textarea-inventory.md` como elegível ou não elegível para editor rico
- [ ] T005 Registrar justificativa para cada ocorrência não elegível em `specs/009-editor-rico-textareas/textarea-inventory.md`
- [ ] T006 Definir padrão de reaproveitamento do editor de Descrição da Mesa em `specs/009-editor-rico-textareas/textarea-inventory.md`
- [ ] T007 Registrar na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md` os arquivos exatos que serão modificados antes do primeiro patch técnico

**Checkpoint**: Inventário completo e classificado.

---

## Phase 3: User Story 1 - Mapear todos os campos longos de texto (Priority: P1) 🎯 MVP

**Goal**: Garantir cobertura de 100% dos `textarea` no frontend.

**Independent Test**: Comparar busca final por `textarea` com o inventário e confirmar que cada ocorrência foi classificada.

### Implementation for User Story 1

- [ ] T008 [US1] Validar que `specs/009-editor-rico-textareas/textarea-inventory.md` cobre todas as ocorrências de `textarea` em `frontend/src/`
- [ ] T009 [US1] Registrar na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md` o total de ocorrências encontradas, elegíveis e não elegíveis
- [ ] T010 [US1] Revisar ocorrências que já usam editor rico ou componente equivalente e marcar como já padronizadas no inventário `specs/009-editor-rico-textareas/textarea-inventory.md`

**Checkpoint**: Mapeamento auditável completo.

---

## Phase 4: User Story 2 - Padronizar edição rica onde houver texto descritivo longo (Priority: P1)

**Goal**: Substituir campos elegíveis pelo editor rico canônico usado em Descrição da Mesa.

**Independent Test**: Abrir cada formulário alterado, editar com formatação, salvar e reabrir.

### Implementation for User Story 2

- [ ] T011 [US2] Substituir primeira ocorrência elegível pelo editor rico canônico no arquivo correspondente em `frontend/src/`
- [ ] T012 [US2] Preservar validação, valor inicial, estado de erro e salvamento da primeira ocorrência elegível no arquivo correspondente em `frontend/src/`
- [ ] T013 [US2] Repetir substituição para demais ocorrências elegíveis registradas em `specs/009-editor-rico-textareas/textarea-inventory.md`
- [ ] T014 [US2] Validar abrir, editar, salvar e reabrir cada formulário alterado e registrar evidência na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`

**Checkpoint**: Campos elegíveis usam editor rico canônico.

---

## Phase 5: User Story 3 - Preservar campos simples como texto puro (Priority: P2)

**Goal**: Garantir que campos não elegíveis permaneçam simples e justificados.

**Independent Test**: Revisar campos não elegíveis e confirmar que não foram alterados sem motivo.

### Implementation for User Story 3

- [ ] T015 [US3] Verificar que campos não elegíveis listados em `specs/009-editor-rico-textareas/textarea-inventory.md` permanecem como texto puro nos arquivos correspondentes em `frontend/src/`
- [ ] T016 [US3] Validar que campos não elegíveis continuam salvando e exibindo conteúdo como antes nos formulários afetados
- [ ] T017 [US3] Registrar na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md` que cada campo não elegível foi preservado com justificativa

**Checkpoint**: Campos simples preservados sem regressão.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação técnica e funcional.

- [ ] T018 Executar busca final por `textarea` em `frontend/src/` e confirmar que todas as ocorrências remanescentes constam como não elegíveis ou já justificadas em `specs/009-editor-rico-textareas/textarea-inventory.md`
- [ ] T019 Executar `npm --prefix frontend run build` e registrar saída na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T020 Validar responsividade do editor rico nos formulários alterados em desktop e mobile, registrando evidência na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T021 Validar `quickstart.md` no Beta em janela anônima quando houver deploy, registrando resultado na sessão `sessoes/26-04-29_2_lancamento-itens-sdd.md`
- [ ] T022 Atualizar `database/changelogs.json` se a mudança visual/editorial for publicada para usuários finais

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do inventário da Phase 1.
- **US1, US2 e US3**: dependem da classificação completa da Phase 2.
- **Polish**: depende das histórias implementadas.

### User Story Dependencies

- **US1 (P1)**: deve confirmar mapeamento antes das substituições.
- **US2 (P1)**: depende de campos elegíveis classificados.
- **US3 (P2)**: depende da lista de não elegíveis.

### Parallel Opportunities

- T001 e T002 podem ocorrer em paralelo durante investigação.
- Substituições de campos elegíveis podem ser paralelas se estiverem em arquivos diferentes e compartilharem o mesmo padrão validado.
- Validações de formulários diferentes podem ser paralelas após build técnico.

---

## Implementation Strategy

### MVP First

1. Concluir inventário de `textarea`.
2. Classificar elegíveis e não elegíveis.
3. Substituir primeiro campo elegível e validar comportamento.
4. Repetir para demais elegíveis.
5. Confirmar remanescentes justificados.
6. Rodar build técnico e validar fluxos reais.

### Incremental Delivery

- Nenhum campo deve ser substituído sem estar no inventário.
- Cada substituição deve preservar validação e salvamento.
- Qualquer incompatibilidade de payload deve parar execução e exigir revisão de spec/plan.
