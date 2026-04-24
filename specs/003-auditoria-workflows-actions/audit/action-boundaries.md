# Regularization Action: Operational Boundaries Documentation

**Action ID:** ACTION-BOUNDARIES  
**Related Finding:** OVERLAP-01, RED-01  
**Priority:** MEDIUM  
**Status:** Planned

---

## Objective

Documentar fronteiras operacionais explícitas entre workflows de CI/CD, estabelecendo responsabilidades claras e prevenindo sobreposição de funções.

---

## Target Files

1. `.github/workflows/ci.yml` (adicionar comentário)
2. `.github/workflows/deploy-beta.yml` (adicionar comentário)
3. `.github/workflows/deploy-prod.yml` (adicionar comentário)
4. `.github/workflows/promote-to-prod.yml` (adicionar comentário)
5. `.github/workflows/preflight-prod.yml` (adicionar comentário)
6. `.github/workflows/docker-cleanup.yml` (adicionar comentário)
7. `.github/workflows/sync-arquitetura.yml` (adicionar comentário)
8. `docs/workflows/WORKFLOW_BOUNDARIES.md` (novo)

---

## Planned Changes

### Change 1: Add Inline Documentation to Each Workflow

**Template for workflow header comments:**

```yaml
# ============================================================================
# WORKFLOW: [Nome do Workflow]
# RESPONSIBILITY: [Responsabilidade operacional]
# TRIGGER: [Quando executa]
# SCOPE: [O que faz]
# DEPENDENCIES: [Workflows que este workflow depende]
# CONSUMERS: [Workflows que dependem deste workflow]
# MAINTAINER: [Equipe responsável]
# LAST UPDATED: [Data]
# ============================================================================
```

---

**File:** `.github/workflows/ci.yml`

**Planned Addition (top of file):**
```yaml
# ============================================================================
# WORKFLOW: CI — Validação de PR
# RESPONSIBILITY: Continuous Integration
# TRIGGER: Pull request para branch dev
# SCOPE: Valida build de frontend e backend antes de merge
# DEPENDENCIES: Nenhuma
# CONSUMERS: Nenhum (gate de PR)
# MAINTAINER: Equipe de desenvolvimento
# LAST UPDATED: 2026-04-23
# ============================================================================
```

---

**File:** `.github/workflows/deploy-beta.yml`

**Planned Addition:**
```yaml
# ============================================================================
# WORKFLOW: Deploy Beta
# RESPONSIBILITY: Continuous Deployment (Beta)
# TRIGGER: Push para branch dev (automático)
# SCOPE: Deploy completo para ambiente beta (migrations + containers + smoke tests)
# DEPENDENCIES: _enforce-migration-dir.yml, _lint-shell.yml
# CONSUMERS: Nenhum
# MAINTAINER: Equipe de operações
# LAST UPDATED: 2026-04-23
# NOTES: Único workflow autorizado a deployar para beta
# ============================================================================
```

---

**File:** `.github/workflows/deploy-prod.yml`

**Planned Addition:**
```yaml
# ============================================================================
# WORKFLOW: Deploy Production (BREAK-GLASS ONLY)
# RESPONSIBILITY: Continuous Deployment (Production - Emergency)
# TRIGGER: Manual (workflow_dispatch) - USO RESTRITO
# SCOPE: Deploy direto para produção SEM governança de PR
# DEPENDENCIES: _enforce-migration-dir.yml, _lint-shell.yml
# CONSUMERS: Nenhum
# MAINTAINER: Equipe de operações
# LAST UPDATED: 2026-04-23
# NOTES: 
#   - USO APENAS EM EMERGÊNCIAS (vulnerabilidade crítica, downtime)
#   - Requer aprovação verbal do mantenedor
#   - Bypassa governance gate
#   - Cria issue automática para auditoria
#   - Cooldown de 10 minutos após promote-to-prod.yml
#   - Workflow canônico: promote-to-prod.yml
# ============================================================================
```

---

**File:** `.github/workflows/promote-to-prod.yml`

**Planned Addition:**
```yaml
# ============================================================================
# WORKFLOW: Promote Beta to Production (CANONICAL)
# RESPONSIBILITY: Continuous Deployment (Production - Canonical)
# TRIGGER: Manual (workflow_dispatch) com input de versão
# SCOPE: Deploy PR-driven para produção (governance gate + deploy + release)
# DEPENDENCIES: _enforce-migration-dir.yml, _lint-shell.yml
# CONSUMERS: Nenhum
# MAINTAINER: Equipe de operações
# LAST UPDATED: 2026-04-23
# NOTES:
#   - WORKFLOW PRINCIPAL para deploy em produção (99% dos casos)
#   - Requer PR dev→main aprovado e merged
#   - Valida que dev não está à frente de main
#   - Cria release automática com notas
#   - Versionamento semântico obrigatório (ex: v0.1.1)
# ============================================================================
```

---

**File:** `.github/workflows/preflight-prod.yml`

**Planned Addition:**
```yaml
# ============================================================================
# WORKFLOW: Preflight Prod Gate
# RESPONSIBILITY: Continuous Integration (Production Gate)
# TRIGGER: Pull request para branch main (paths: database/**, scripts/deploy/**)
# SCOPE: Valida drift de migrations entre beta e produção
# DEPENDENCIES: Nenhuma
# CONSUMERS: Nenhum (gate de PR)
# MAINTAINER: Equipe de operações
# LAST UPDATED: 2026-04-23
# NOTES: Bloqueia PR se migrations não estão sincronizadas entre ambientes
# ============================================================================
```

---

**File:** `.github/workflows/docker-cleanup.yml`

**Planned Addition:**
```yaml
# ============================================================================
# WORKFLOW: Docker Cleanup
# RESPONSIBILITY: Maintenance
# TRIGGER: Agendado (Sundays 3 AM UTC) ou manual
# SCOPE: Limpeza periódica de recursos Docker no servidor
# DEPENDENCIES: Nenhuma
# CONSUMERS: Nenhum
# MAINTAINER: Equipe de operações
# LAST UPDATED: 2026-04-23
# NOTES: Mantém apenas 3 imagens mais recentes por repositório
# ============================================================================
```

---

**File:** `.github/workflows/sync-arquitetura.yml`

**Planned Addition:**
```yaml
# ============================================================================
# WORKFLOW: Sync ARQUITETURA_PROJETO.md
# RESPONSIBILITY: Documentation
# TRIGGER: Push para branch dev
# SCOPE: Sincronização automática de documentação de arquitetura via LLM
# DEPENDENCIES: Nenhuma
# CONSUMERS: Nenhum
# MAINTAINER: Equipe de desenvolvimento
# LAST UPDATED: 2026-04-23
# NOTES: 
#   - Não-bloqueante (falha não afeta deploys)
#   - Depende de API externa (ROUTER_URL)
#   - Cria PR com patches propostos (requer revisão humana)
# ============================================================================
```

---

### Change 2: Create Comprehensive Boundaries Documentation

**File:** `docs/workflows/WORKFLOW_BOUNDARIES.md` (novo)

**Planned Content:**
```markdown
# Workflow Operational Boundaries

**Last Updated:** 2026-04-23  
**Maintainer:** Equipe de operações

---

## Overview

Este documento define as fronteiras operacionais entre workflows de CI/CD, estabelecendo responsabilidades claras e prevenindo sobreposição de funções.

---

## Workflow Classification

### Continuous Integration (CI)

**Responsibility:** Validar qualidade de código antes de merge

| Workflow | Trigger | Scope | Blocking |
|---|---|---|---|
| `ci.yml` | PR → dev | Build validation (frontend + backend) | Yes |
| `preflight-prod.yml` | PR → main | Migration drift validation | Yes |

**Boundary:** CI workflows NUNCA deployam código. Apenas validam.

---

### Continuous Deployment (CD)

**Responsibility:** Deploy de código para ambientes

| Workflow | Environment | Trigger | Governance | Usage |
|---|---|---|---|---|
| `deploy-beta.yml` | Beta | Automatic (push to dev) | Migration gate + TypeScript | 100% |
| `promote-to-prod.yml` | Production | Manual (PR-driven) | Full governance + Release | 99% |
| `deploy-prod.yml` | Production | Manual (break-glass) | Minimal (emergency) | 1% |

**Boundary:** CD workflows NUNCA validam PRs. Apenas deployam código já aprovado.

---

### Maintenance

**Responsibility:** Tarefas periódicas de manutenção

| Workflow | Trigger | Scope | Impact |
|---|---|---|---|
| `docker-cleanup.yml` | Weekly (Sunday 3 AM) | Disk space management | Non-blocking |

**Boundary:** Maintenance workflows NUNCA afetam deploys ativos.

---

### Documentation

**Responsibility:** Sincronização automática de documentação

| Workflow | Trigger | Scope | Impact |
|---|---|---|---|
| `sync-arquitetura.yml` | Push to dev | Architecture doc sync | Non-blocking |

**Boundary:** Documentation workflows NUNCA bloqueiam deploys.

---

## Deployment Decision Matrix

### When to Use Each Production Workflow

| Scenario | Workflow | Rationale |
|---|---|---|
| Feature nova aprovada via PR | `promote-to-prod.yml` | Caminho canônico com governança |
| Bugfix aprovado via PR | `promote-to-prod.yml` | Caminho canônico com governança |
| Hotfix urgente (produção down) | `deploy-prod.yml` | Break-glass com aprovação verbal |
| Vulnerabilidade crítica | `deploy-prod.yml` | Break-glass com aprovação verbal |
| "Esqueci de fazer PR" | ❌ NENHUM | Crie PR primeiro |
| "PR demorando para aprovar" | ❌ NENHUM | Solicite review urgente |
| "Testar algo rápido" | ❌ NENHUM | Teste em beta primeiro |

---

## Workflow Dependencies

### Reusable Workflows

| Workflow | Consumers | Contract Version |
|---|---|---|
| `_enforce-migration-dir.yml` | deploy-beta, deploy-prod, promote-to-prod | v1 |
| `_lint-shell.yml` | deploy-beta, deploy-prod, promote-to-prod | v1 |

**Boundary:** Reusable workflows NUNCA são disparados diretamente. Apenas via `workflow_call`.

---

## Forbidden Patterns

### ❌ DO NOT

1. **Usar `deploy-prod.yml` sem aprovação verbal**
   - Bypassa governança
   - Cria dívida de auditoria

2. **Modificar workflows reutilizáveis sem versionar**
   - Breaking change bloqueia 100% dos deploys
   - Sem rollback path

3. **Adicionar lógica de deploy em workflows de CI**
   - Viola separação de responsabilidades
   - Cria risco de deploy acidental

4. **Adicionar lógica de validação em workflows de CD**
   - Validação deve ocorrer em CI (antes de merge)
   - CD assume código já validado

5. **Criar novos workflows de deploy sem documentar fronteiras**
   - Aumenta ambiguidade operacional
   - Dificulta manutenção

---

## Maintenance Guidelines

### When Adding New Workflows

1. Classificar responsabilidade (CI / CD / Maintenance / Documentation)
2. Documentar fronteiras explícitas (header comment)
3. Atualizar este documento
4. Validar que não há sobreposição com workflows existentes

### When Modifying Existing Workflows

1. Verificar se mudança respeita fronteiras estabelecidas
2. Atualizar header comment se responsabilidade mudar
3. Atualizar este documento se fronteiras mudarem

---

## Audit Trail

| Date | Change | Author |
|---|---|---|
| 2026-04-23 | Initial boundaries documentation | Feature 003 |
```

---

## Rollback Plan

### If Documentation Causes Confusion

**Step 1: Remove inline comments**
```bash
# Edit each workflow file, remove header comments
git add .github/workflows/*.yml
git commit -m "revert: remove workflow boundary comments"
```

**Step 2: Remove documentation file**
```bash
rm docs/workflows/WORKFLOW_BOUNDARIES.md
git add docs/workflows/
git commit -m "revert: remove workflow boundaries documentation"
```

**Rollback time:** ~10 minutes

---

## Validation Criteria

- [ ] Header comments added to all 9 workflows
- [ ] `WORKFLOW_BOUNDARIES.md` created
- [ ] Documentation reviewed by team
- [ ] No ambiguity about which workflow to use for each scenario
- [ ] Decision matrix covers all common scenarios

---

## Dependencies

**Must complete before:**
- None (documentation only)

**Must complete after:**
- None (can be executed immediately)

---

## Estimated Impact

**Deployment time:** No change (documentation only)  
**Operational clarity:** High improvement  
**Onboarding time:** Reduced (new team members have clear reference)  
**Maintenance burden:** Minimal (update docs when workflows change)

---

## Approval Status

**Approved by:** User (2026-04-23)  
**Decision:** Implicit approval (part of Phase 4 planning)
