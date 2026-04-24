# Tasks: 003-auditoria-workflows-actions

**Feature**: Auditoria e Regularização dos GitHub Actions Workflows  
**Branch**: `feat/003-auditoria-workflows-actions`  
**Spec**: `./spec.md` | **Plan**: `./plan.md`

---

## Implementation Strategy

**Approach**: Incremental audit with evidence-based validation. Each phase produces verifiable artifacts before proceeding.

**MVP Scope**: Phase 2 (Inventário Canônico) — establishes baseline understanding of all workflows.

**Delivery Order**:
1. Phase 1: Setup — prepare audit infrastructure
2. Phase 2: Inventário Canônico — map all workflows (FR-001, FR-002, SC-001)
3. Phase 3: Diagnóstico por Severidade — identify issues (FR-003..FR-006, SC-002)
4. Phase 4: Planejamento de Regularização — define minimal corrections (FR-007..FR-009)
5. Phase 5: Aplicação de Correções — execute atomic changes with rollback
6. Phase 6: Validação Off-Happy-Path — verify error propagation (FR-010, FR-011, SC-003, SC-004)
7. Phase 7: Documentação e Encerramento — finalize artifacts (FR-012, SC-005)

**Parallelization**: Phases 2-3 can overlap (inventory + diagnosis). Phase 6 validation scenarios are parallelizable per workflow.

---

## Dependencies

### Phase Completion Order

```
Phase 1 (Setup)
    ↓
Phase 2 (Inventário) ← MUST complete before Phase 3
    ↓
Phase 3 (Diagnóstico) ← MUST complete before Phase 4
    ↓
Phase 4 (Planejamento) ← MUST complete before Phase 5
    ↓
Phase 5 (Aplicação) ← MUST complete before Phase 6
    ↓
Phase 6 (Validação)
    ↓
Phase 7 (Encerramento)
```

### Critical Path

T001 → T002 → T003..T011 (inventory) → T012..T020 (diagnosis) → T021..T027 (planning) → T028..T034 (execution) → T035..T041 (validation) → T042..T045 (closure)

---

## Phase 1: Setup

**Goal**: Prepare audit infrastructure and establish baseline.

**Tasks**:

- [x] T001 Criar branch `feat/003-auditoria-workflows-actions` a partir de `dev`
- [x] T002 Criar estrutura de artefatos de auditoria em `specs/003-auditoria-workflows-actions/audit/`
- [x] T003 Documentar baseline de workflows ativos via `ls -1 .github/workflows/*.yml > specs/003-auditoria-workflows-actions/audit/baseline-workflows.txt`

---

## Phase 2: Inventário Canônico (FR-001, FR-002, SC-001)

**Goal**: Map 100% of workflows in `.github/workflows/` with triggers, jobs, dependencies, and operational responsibility.

**Independent Test Criteria**: 
- Every workflow file has a corresponding `WorkflowInventoryItem` entry
- All trigger types, filters, and concurrency policies are documented
- Reusable workflows (`workflow_call`) have `called_by` populated

**Tasks**:

- [x] T004 [P] Inventariar `ci.yml` em `specs/003-auditoria-workflows-actions/audit/inventory-ci.md`
- [x] T005 [P] Inventariar `deploy-beta.yml` em `specs/003-auditoria-workflows-actions/audit/inventory-deploy-beta.md`
- [x] T006 [P] Inventariar `deploy-prod.yml` em `specs/003-auditoria-workflows-actions/audit/inventory-deploy-prod.md`
- [x] T007 [P] Inventariar `promote-to-prod.yml` em `specs/003-auditoria-workflows-actions/audit/inventory-promote-to-prod.md`
- [x] T008 [P] Inventariar `preflight-prod.yml` em `specs/003-auditoria-workflows-actions/audit/inventory-preflight-prod.md`
- [x] T009 [P] Inventariar `docker-cleanup.yml` em `specs/003-auditoria-workflows-actions/audit/inventory-docker-cleanup.md`
- [x] T010 [P] Inventariar `sync-arquitetura.yml` em `specs/003-auditoria-workflows-actions/audit/inventory-sync-arquitetura.md`
- [x] T011 [P] Inventariar workflows reutilizáveis `_enforce-migration-dir.yml` e `_lint-shell.yml` em `specs/003-auditoria-workflows-actions/audit/inventory-reusable.md`
- [x] T012 Consolidar inventário completo em `specs/003-auditoria-workflows-actions/audit/inventory-consolidated.md` com mapeamento de consumidores de workflows reutilizáveis
- [x] T013 Validar SC-001: confirmar que 100% dos workflows estão inventariados e classificados por responsabilidade operacional

---

## Phase 3: Diagnóstico por Severidade (FR-003..FR-006, SC-002)

**Goal**: Identify redundancies, race conditions, silent failures, and trigger overlaps with severity classification.

**Independent Test Criteria**:
- Every finding has severity (critical/high/medium/low) and category
- Operational impact is described with evidence references
- No finding is marked `open` without severity assignment

**Tasks**:

- [x] T014 Analisar sobreposição de gatilhos entre workflows de deploy (`deploy-beta.yml`, `deploy-prod.yml`, `promote-to-prod.yml`) em `specs/003-auditoria-workflows-actions/audit/findings-deploy-overlap.md`
- [x] T015 Analisar política de concorrência em `deploy-beta.yml` (risco de backlog de commits obsoletos) em `specs/003-auditoria-workflows-actions/audit/findings-beta-concurrency.md`
- [x] T016 Analisar padrões de falha silenciosa em scripts de deploy (`|| true`, fallback permissivo) em `specs/003-auditoria-workflows-actions/audit/findings-silent-failures.md`
- [x] T017 Analisar risco de corrida operacional entre `deploy-prod.yml` e `promote-to-prod.yml` (ambos acessam mesma infraestrutura) em `specs/003-auditoria-workflows-actions/audit/findings-prod-race.md`
- [x] T018 Analisar impacto de mudanças em workflows reutilizáveis (`_enforce-migration-dir.yml`, `_lint-shell.yml`) nos consumidores em `specs/003-auditoria-workflows-actions/audit/findings-reusable-contract-risk.md`
- [x] T019 Consolidar achados com severidade e impacto operacional em `specs/003-auditoria-workflows-actions/audit/findings-consolidated.md`
- [x] T020 Validar SC-002: confirmar que 100% dos achados críticos e altos têm ação de regularização definida

---

## Phase 4: Planejamento de Regularização (FR-007..FR-009)

**Goal**: Define minimal, reversible corrections for critical and high-severity findings.

**Independent Test Criteria**:
- Every `RegularizationAction` has explicit target files and rollback steps
- No workflow removal without dependency mapping
- Clear boundaries between CI, deploy, and auxiliary responsibilities

**Tasks**:

- [x] T021 Planejar separação explícita de responsabilidades entre `deploy-prod.yml` (break-glass) e `promote-to-prod.yml` (canônico) em `specs/003-auditoria-workflows-actions/audit/action-prod-separation.md`
- [x] T022 Planejar ajuste de política de concorrência em `deploy-beta.yml` para priorizar commit mais recente em `specs/003-auditoria-workflows-actions/audit/action-beta-concurrency.md`
- [x] T023 Planejar eliminação de padrões tolerantes em etapas críticas de validação em `specs/003-auditoria-workflows-actions/audit/action-failure-propagation.md`
- [x] T024 Planejar documentação de fronteiras operacionais entre workflows em `specs/003-auditoria-workflows-actions/audit/action-boundaries.md`
- [x] T025 Mapear consumidores de workflows reutilizáveis antes de qualquer alteração em `specs/003-auditoria-workflows-actions/audit/reusable-consumers-map.md`
- [x] T026 Consolidar plano de regularização com rollback explícito por ação em `specs/003-auditoria-workflows-actions/audit/regularization-plan.md`
- [x] T027 Validar que nenhuma ação planejada remove workflow sem mapeamento prévio de dependências

---

## Phase 5: Aplicação de Correções (Atomic, Reversible)

**Goal**: Execute planned corrections incrementally with explicit rollback capability.

**Independent Test Criteria**:
- Each correction is applied in a single atomic commit
- Rollback steps are documented and tested
- No breaking changes to workflow contracts

**Tasks**:

- [x] T028 Aplicar separação de responsabilidades em `deploy-prod.yml` (adicionar comentário de uso excepcional) e `promote-to-prod.yml` (marcar como canônico)
- [x] T029 Aplicar ajuste de política de concorrência em `deploy-beta.yml` (revisar `cancel-in-progress` conforme decisão de research.md)
- [x] T030 Aplicar eliminação de padrões tolerantes em etapas críticas de `deploy-beta.yml` e `deploy-prod.yml`
- [x] T031 Aplicar documentação de fronteiras operacionais em comentários inline dos workflows
- [x] T032 Validar que workflows reutilizáveis não sofreram alterações de contrato sem aprovação de consumidores
- [x] T033 Registrar evidência de aplicação (commit SHA, arquivos alterados) em `specs/003-auditoria-workflows-actions/audit/application-evidence.md`
- [x] T034 Testar rollback de uma correção aplicada para validar reversibilidade

---

## Phase 6: Validação Off-Happy-Path (FR-010, FR-011, SC-003, SC-004)

**Goal**: Verify that workflows exhibit correct status (✅/❌) in adversarial scenarios.

**Independent Test Criteria**:
- Real error in critical step results in workflow status `failure`
- No false positives (error masked as success)
- Evidence includes run URL, log excerpt, and observed status

**Tasks**:

- [x] T035 [P] Validar cenário off-happy-path: erro induzido em migration gate de `deploy-beta.yml` deve resultar em status ❌ em `specs/003-auditoria-workflows-actions/audit/validation-beta-migration-failure.md`
- [x] T036 [P] Validar cenário off-happy-path: erro induzido em shellcheck de `ci.yml` deve resultar em status ❌ em `specs/003-auditoria-workflows-actions/audit/validation-ci-shellcheck-failure.md`
- [x] T037 [P] Validar cenário off-happy-path: erro induzido em preflight de `preflight-prod.yml` deve bloquear promoção em `specs/003-auditoria-workflows-actions/audit/validation-preflight-block.md`
- [x] T038 [P] Validar cenário happy-path: push para `dev` dispara apenas `deploy-beta.yml` (não `deploy-prod.yml`) em `specs/003-auditoria-workflows-actions/audit/validation-beta-trigger-isolation.md`
- [x] T039 [P] Validar cenário happy-path: PR aprovado para `main` dispara apenas `promote-to-prod.yml` (não `deploy-prod.yml`) em `specs/003-auditoria-workflows-actions/audit/validation-prod-trigger-isolation.md`
- [x] T040 Consolidar evidências de validação com run URLs e status observados em `specs/003-auditoria-workflows-actions/audit/validation-evidence.md`
- [x] T041 Validar SC-003 e SC-004: confirmar que não há duplicidade indevida e que 100% dos cenários off-happy-path exibem status coerente

---

## Phase 7: Documentação e Encerramento (FR-012, SC-005)

**Goal**: Finalize audit artifacts and prepare for PR.

**Independent Test Criteria**:
- All findings are resolved or marked as accepted-risk
- Residual risks are documented with justification
- PR description includes audit summary and evidence

**Tasks**:

- [ ] T042 Consolidar relatório final de auditoria em `specs/003-auditoria-workflows-actions/audit/audit-report.md` com itens corrigidos, riscos residuais e pendências bloqueantes
- [ ] T043 Validar SC-005: confirmar que toda correção aplicada possui evidência literal associada e rastreável
- [ ] T044 Gerar `specs/003-auditoria-workflows-actions/pr-description.md` com sumário executivo, mudanças por workflow, testing evidence e checklist pós-merge
- [ ] T045 Atualizar sessão `sessoes/26-04-23_2_auditoria-workflows-github-actions.md` com encerramento da feature e executar `/speckit.retro.run`

---

## Task Summary

**Total Tasks**: 45  
**Parallelizable Tasks**: 15 (T004-T011 in Phase 2, T035-T039 in Phase 6)

**Task Distribution by Phase**:
- Phase 1 (Setup): 3 tasks
- Phase 2 (Inventário): 10 tasks (8 parallelizable)
- Phase 3 (Diagnóstico): 7 tasks
- Phase 4 (Planejamento): 7 tasks
- Phase 5 (Aplicação): 7 tasks
- Phase 6 (Validação): 7 tasks (5 parallelizable)
- Phase 7 (Encerramento): 4 tasks

**Coverage**:
- FR-001..FR-012: 100% covered
- SC-001..SC-005: 100% covered
- User Stories: 3/3 mapped (Inventário, Diagnóstico, Regularização)

**Estimated MVP Completion**: Phase 2 (T001-T013) — provides complete workflow inventory baseline.

---

## Parallel Execution Examples

### Phase 2 (Inventário)
```bash
# All inventory tasks can run in parallel (different files)
T004, T005, T006, T007, T008, T009, T010, T011
```

### Phase 6 (Validação)
```bash
# All validation scenarios can run in parallel (independent runs)
T035, T036, T037, T038, T039
```

---

## Notes

- **Rollback Strategy**: Each correction in Phase 5 is atomic (single commit). Rollback via `git revert <commit-sha>`.
- **Evidence Requirements**: Every validation task (Phase 6) must include run URL, log excerpt, and observed status.
- **Blocking Dependencies**: Phase 2 must complete before Phase 3 (diagnosis requires complete inventory). Phase 5 must complete before Phase 6 (validation requires corrections applied).
- **Reusable Workflow Risk**: Tasks T011, T018, T025, T032 specifically address contract risk for `_enforce-migration-dir.yml` and `_lint-shell.yml`.
