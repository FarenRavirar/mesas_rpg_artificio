# Tasks: Exclusão de Mesa Sem Pop-up

**Input**: Design documents from `specs/007-exclusao-mesa-sem-popup/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/inline-delete-confirmation.md`, `quickstart.md`

## Phase 1: Setup

- [x] T001 Confirmar checklist de requisitos completo em `specs/007-exclusao-mesa-sem-popup/checklists/requirements.md`
- [x] T002 Verificar arquivos de escopo e estado inicial com `git status --short`

## Phase 2: Foundational

- [x] T003 Criar componente compartilhado de confirmação inline em `frontend/src/components/InlineDeleteConfirmation.tsx`

## Phase 3: User Story 1 - Confirmar exclusão dentro da página (P1)

**Goal**: Mestre/admin inicia exclusão e vê confirmação integrada ao layout, sem pop-up.

**Independent Test**: Clicar em excluir em cada fluxo alterado e verificar que a primeira ação apenas abre confirmação inline.

- [x] T004 [US1] Integrar `InlineDeleteConfirmation` ao card do painel em `frontend/src/components/TableCardDashboard.tsx`
- [x] T005 [US1] Atualizar o fluxo de exclusão do painel em `frontend/src/pages/PainelMestrePage.tsx`
- [x] T006 [US1] Integrar confirmação inline ao fluxo administrativo de mesas em `frontend/src/pages/GestaoPage.tsx`
- [x] T007 [US1] ⚠️ Reopened (BUG-001) Integrar confirmação inline à página/preview da mesa em `frontend/src/features/table/components/TableActionPanel.tsx`, selecionando endpoint GM/admin conforme contexto de gestão

## Phase 4: User Story 2 - Evitar exclusão acidental (P1)

**Goal**: Nenhuma mesa é excluída na primeira ação e confirmações duplicadas são bloqueadas durante processamento.

**Independent Test**: Acionar excluir, cancelar, reabrir, confirmar e tentar clicar repetidamente durante processamento.

- [x] T008 [US2] Remover handler de exclusão baseado em `confirm`/`prompt`/`alert` de `frontend/src/features/table/utils/uiHelpers.ts`
- [x] T009 [US2] Garantir desabilitação de confirmação final durante `isProcessing` em `frontend/src/components/InlineDeleteConfirmation.tsx`
- [x] T010 [US2] Validar que o primeiro clique não chama endpoint `DELETE` nos handlers de `PainelMestrePage.tsx`, `GestaoPage.tsx` e `TableActionPanel.tsx`

## Phase 5: User Story 3 - Entender o impacto antes da exclusão (P2)

**Goal**: A confirmação mostra a mesa afetada, consequência simples, cancelamento e feedback de sucesso/erro.

**Independent Test**: A confirmação identifica a mesa; sucesso e erro aparecem sem pop-up; cancelamento preserva estado.

- [x] T011 [US3] Ajustar microcopy e estados do componente em `frontend/src/components/InlineDeleteConfirmation.tsx`
- [x] T012 [US3] Garantir mensagens de sucesso/erro sem `alert` em `frontend/src/pages/PainelMestrePage.tsx`, `frontend/src/pages/GestaoPage.tsx` e `frontend/src/features/table/components/TableActionPanel.tsx`
- [x] T019 [US1] Corrigir `MesaPage` para passar escopo de exclusão admin ao `TableActionPanel` quando `user.role === 'admin'`
- [x] T020 [US1] Validar build e busca final após BUG-001

**Bugfix**: 2026-04-29 — BUG-001 Updated from bugfix patch.

## Phase 6: Validation & Documentation

- [x] T013 Rodar busca final por pop-ups de exclusão de mesa nos arquivos de escopo
- [x] T014 Rodar `npm --prefix frontend run build`
- [x] T015 Atualizar `database/changelogs.json` com mudança visível do fluxo de exclusão
- [x] T016 Criar `specs/007-exclusao-mesa-sem-popup/pr-description.md`
- [x] T017 Atualizar `.specify/memory/project-state.md`
- [x] T018 Atualizar `sessoes/26-04-29_3_exclusao-mesa-sem-popup.md` e `sessoes/index.md`

## Dependencies

- Phase 1 before all phases.
- T003 before T004-T009.
- US1 before US2 validation tasks.
- T019-T020 after BUG-001 patch in T007.
- US3 after US1/US2 integration.
- Validation after implementation.

## Parallel Opportunities

- T004 and T006 can be reviewed independently after T003.
- T005 and T007 touch separate feature surfaces but both depend on T003.
- T015 and T016 can be prepared after validation evidence exists.

## Implementation Strategy

1. MVP: T003-T007 remove pop-up confirmation from all table deletion surfaces.
2. Safety: T008-T012 remove remaining browser dialogs and reinforce processing/copy.
3. Validation: T013-T018 prove no scoped dialog remnants, build succeeds, docs/status are current.
