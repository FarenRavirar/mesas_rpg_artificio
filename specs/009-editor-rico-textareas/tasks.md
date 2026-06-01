# Tasks: Editor Rico em Textareas

**Input**: Design documents from `/specs/009-editor-rico-textareas/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Sessão**: `sessoes/26-05-01_1_editor-rico-textareas.md`
**Tests**: `npm --prefix frontend run build` e validação funcional dos formulários alterados são obrigatórios; validação em Beta/janela anônima é obrigatória quando afetar fluxos reais.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo quando tocar arquivos diferentes e não depender de tarefa incompleta.
- **[Story]**: Mapeia a tarefa para a user story da spec.
- Todas as tarefas devem citar caminho de arquivo.

---

## Phase 1: Setup (Inventory)

**Purpose**: Confirmar inventário completo antes de qualquer substituição.

Achados da pesquisa de código já consolidados em `research.md`. As tasks abaixo formalizam o inventário no arquivo canônico da feature e confirmam cobertura 100%.

- [x] T001 Criar `specs/009-editor-rico-textareas/textarea-inventory.md` com as 10 ocorrências de `<textarea>` nu listadas em `research.md` — arquivo, linha, tela, finalidade e campo de classificação em branco
- [x] T002 Adicionar ao inventário `specs/009-editor-rico-textareas/textarea-inventory.md` os 5 campos que usam `RichTextArea` (`StepBasic.tsx:33`, `StepFinal.tsx:164`, `StepFinal.tsx:258`, `StepFinal.tsx:268`, `StepFinal.tsx:290`) como seção separada "Campos com RichTextArea"
- [x] T003 Confirmar que `frontend/src/components/MarkdownEditor.tsx` existe e que `react-markdown-editor-lite` está em `frontend/package.json`, registrar versão no inventário `specs/009-editor-rico-textareas/textarea-inventory.md`

---

## Phase 2: Foundational (Classification)

**Purpose**: Classificar todas as ocorrências antes de alterar código.

**⚠️ CRITICAL**: Nenhuma substituição deve iniciar antes do inventário e classificação estarem completos e registrados em `specs/009-editor-rico-textareas/textarea-inventory.md`.

- [x] T004 Classificar cada uma das 10 ocorrências de `<textarea>` nu em `specs/009-editor-rico-textareas/textarea-inventory.md` como elegível ou não elegível para `MarkdownEditor`, com justificativa
- [x] T005 Classificar cada um dos 5 campos com `RichTextArea` em `specs/009-editor-rico-textareas/textarea-inventory.md` como elegível ou não elegível para upgrade para `MarkdownEditor`, com justificativa
- [x] T006 Registrar na sessão `sessoes/26-05-01_1_editor-rico-textareas.md` os arquivos exatos que serão modificados, com lista de campos elegíveis aprovada antes do primeiro patch

**Checkpoint**: Inventário completo e classificado. Gate obrigatório antes da Phase 3.

---

## Phase 3: User Story 1 - Mapear todos os campos longos de texto (Priority: P1) 🎯 MVP

**Goal**: Garantir cobertura de 100% dos campos de texto no frontend com decisão explícita para cada um.

**Independent Test**: Executar grep por `<textarea` em `frontend/src/` e confirmar que cada resultado está no inventário `textarea-inventory.md` com classificação.

### Implementation for User Story 1

- [x] T007 [US1] Executar `grep -rn "<textarea" frontend/src/` e comparar resultado com `specs/009-editor-rico-textareas/textarea-inventory.md` — confirmar cobertura 100%
- [x] T008 [US1] Executar `grep -rn "RichTextArea" frontend/src/` e comparar resultado com a seção "Campos com RichTextArea" do inventário — confirmar cobertura 100%
- [x] T009 [US1] Registrar na sessão `sessoes/26-05-01_1_editor-rico-textareas.md`: total de ocorrências, total elegíveis, total não elegíveis

**Checkpoint**: Mapeamento auditável completo. Grep de validação executado com saída literal registrada.

---

## Phase 4: User Story 2 - Padronizar edição rica onde houver texto descritivo longo (Priority: P1)

**Goal**: Substituir campos elegíveis por `MarkdownEditor` (`frontend/src/components/MarkdownEditor.tsx`).

**Independent Test**: Abrir cada formulário alterado, inserir texto com formatação markdown, salvar e reabrir — conteúdo deve persistir.

### Implementation for User Story 2

- [x] T010 [US2] Substituir primeiro campo elegível de `<textarea>` nu pelo `MarkdownEditor` no arquivo correspondente em `frontend/src/`, preservando `value`, `onChange`, `placeholder` e limites de validação
- [x] T011 [US2] Executar `npm --prefix frontend run build` após T010 e confirmar zero erros antes de continuar
- [x] T012 [P] [US2] Substituir demais campos elegíveis de `<textarea>` nu por `MarkdownEditor` nos arquivos correspondentes em `frontend/src/` — um arquivo por subtarefa, em paralelo se tocarem arquivos diferentes
- [x] T013 [P] [US2] Substituir campos elegíveis com `RichTextArea` por `MarkdownEditor` nos arquivos correspondentes em `frontend/src/` — um arquivo por subtarefa, em paralelo se tocarem arquivos diferentes
- [x] T014 [US2] Executar `npm --prefix frontend run build` após todas as substituições e registrar saída literal na sessão `sessoes/26-05-01_1_editor-rico-textareas.md`
- [ ] T015 [US2] Validar abrir, editar com formatação, salvar e reabrir cada formulário alterado — registrar evidência na sessão `sessoes/26-05-01_1_editor-rico-textareas.md`

**Checkpoint**: Campos elegíveis usam `MarkdownEditor`. Build verde. Evidência de salvar/reabrir registrada.

---

## Phase 5: User Story 3 - Preservar campos simples como texto puro (Priority: P2)

**Goal**: Garantir que campos não elegíveis permaneçam como `<textarea>` simples e com justificativa documentada.

**Independent Test**: Abrir cada formulário com campo não elegível e confirmar que é textarea simples, sem toolbar de editor.

### Implementation for User Story 3

- [x] T016 [US3] Verificar que cada campo classificado como não elegível em `specs/009-editor-rico-textareas/textarea-inventory.md` permanece como `<textarea>` nos arquivos correspondentes em `frontend/src/`
- [x] T017 [US3] Confirmar que campos não elegíveis salvam e exibem conteúdo sem regressão
- [x] T018 [US3] Registrar na sessão `sessoes/26-05-01_1_editor-rico-textareas.md` confirmação de cada campo não elegível preservado com justificativa

**Checkpoint**: Campos simples preservados sem regressão.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação técnica e funcional final.

- [x] T019 Executar busca final `grep -rn "<textarea" frontend/src/` e confirmar que todas as ocorrências remanescentes estão em `textarea-inventory.md` como não elegíveis ou já justificadas — registrar saída literal na sessão `sessoes/26-05-01_1_editor-rico-textareas.md`
- [ ] T020 Validar responsividade do `MarkdownEditor` nos formulários alterados em desktop e mobile — registrar evidência na sessão `sessoes/26-05-01_1_editor-rico-textareas.md`
- [ ] T021 Validar `quickstart.md` nos formulários afetados no Beta em janela anônima quando houver deploy — registrar resultado na sessão `sessoes/26-05-01_1_editor-rico-textareas.md`
- [ ] T022 Atualizar `database/changelogs.json` com entrada unificada para a data de deploy se a mudança visual/editorial for publicada para usuários finais

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sem dependências.
- **Phase 2 (Foundational)**: depende de Phase 1 completa.
- **Phase 3 (US1)**: depende de Phase 2 completa (classificação feita).
- **Phase 4 (US2)**: depende de Phase 3 (cobertura confirmada) e Phase 2 (elegíveis definidos).
- **Phase 5 (US3)**: depende de Phase 2 (não elegíveis definidos) — pode rodar em paralelo com Phase 4.
- **Phase 6 (Polish)**: depende de Phases 4 e 5 completas.

### Parallel Opportunities

- T012 e T013: substituições em arquivos diferentes podem ser paralelas após T011 verde.
- T016-T018: podem rodar em paralelo com T012-T015 se tocarem arquivos distintos.
- Validações de formulários diferentes em T015 podem ser paralelas após T014.

---

## Implementation Strategy

### MVP First

1. Criar inventário formal em `textarea-inventory.md`.
2. Classificar todos os campos (elegíveis / não elegíveis).
3. Confirmar cobertura 100% via grep.
4. Substituir primeiro campo elegível e validar build.
5. Repetir para demais elegíveis — build verde após cada lote.
6. Confirmar remanescentes não elegíveis preservados.
7. Validação responsiva e funcional em Beta.

### Incremental Delivery

- Nenhum campo deve ser substituído sem estar no inventário com classificação explícita.
- Cada substituição deve preservar `value`, `onChange`, validações e salvamento.
- Build verde obrigatório após cada arquivo modificado antes de avançar.
- Qualquer incompatibilidade de payload deve parar execução e exigir revisão de spec/plan.
