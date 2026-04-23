# Consolidated Workflow Inventory

**Feature:** 003-auditoria-workflows-actions  
**Generated:** 2026-04-23  
**Total Workflows Inventoried:** 9 (7 operational + 2 reusable)

---

## Executive Summary

### Workflow Classification

| Workflow | Type | Trigger | Responsibility | Consumers |
|---|---|---|---|---|
| `ci.yml` | Operational | PR to `dev` | CI validation | — |
| `deploy-beta.yml` | Operational | Push to `dev` | CD beta | — |
| `deploy-prod.yml` | Operational | Manual | CD prod (break-glass) | — |
| `promote-to-prod.yml` | Operational | Manual | CD prod (canonical) | — |
| `preflight-prod.yml` | Operational | PR to `main` | Gate validation | — |
| `docker-cleanup.yml` | Operational | Schedule/Manual | Maintenance | — |
| `sync-arquitetura.yml` | Operational | Push to `dev` | Documentation | — |
| `_enforce-migration-dir.yml` | Reusable | `workflow_call` | Migration gate | 3 workflows |
| `_lint-shell.yml` | Reusable | `workflow_call` | Linting gate | 3 workflows |

---

## Reusable Workflow Dependency Map

### `_enforce-migration-dir.yml`

**Called By:**
1. `deploy-beta.yml` (job: `enforce-dir`)
2. `deploy-prod.yml` (job: `enforce-dir`)
3. `promote-to-prod.yml` (job: `enforce-dir`)

**Contract:** Validates migration file location against `.github/migration-dir-allowlist`

**Breaking Change Impact:** Blocks all 3 deployment pipelines simultaneously

---

### `_lint-shell.yml`

**Called By:**
1. `deploy-beta.yml` (job: `lint`)
2. `deploy-prod.yml` (job: `lint`)
3. `promote-to-prod.yml` (job: `lint`)

**Contract:** Runs shellcheck on `./scripts` + actionlint on workflows

**Breaking Change Impact:** Blocks all 3 deployment pipelines simultaneously

---

## Operational Responsibility Matrix

### CI/CD — Continuous Integration

| Workflow | Scope | Frequency | Blocking |
|---|---|---|---|
| `ci.yml` | PR validation (dev) | Per PR | Yes |
| `preflight-prod.yml` | PR validation (main) | Per PR | Yes |

---

### CI/CD — Continuous Deployment

| Workflow | Environment | Trigger | Governance |
|---|---|---|---|
| `deploy-beta.yml` | Beta | Automatic (push to dev) | Migration gate + TypeScript |
| `deploy-prod.yml` | Production | Manual (break-glass) | Migration gate + TypeScript |
| `promote-to-prod.yml` | Production | Manual (canonical) | PR-first + Migration gate + TypeScript |

---

### Maintenance

| Workflow | Purpose | Frequency | Impact |
|---|---|---|---|
| `docker-cleanup.yml` | Disk space management | Weekly (Sundays 3 AM UTC) | Non-blocking |
| `sync-arquitetura.yml` | Documentation sync | Per push to dev | Non-blocking |

---

## Critical Findings Summary

### Race Conditions

**Finding RC-01:** `deploy-prod.yml` and `promote-to-prod.yml` share concurrency lock `production-deploy-lock`
- **Risk:** Both workflows can be triggered simultaneously
- **Impact:** Potential state corruption in `/opt/mesas`
- **Severity:** HIGH

---

### Redundancy

**Finding RED-01:** `deploy-prod.yml` and `promote-to-prod.yml` have 90% duplicate logic
- **Risk:** Maintenance burden, divergence over time
- **Impact:** Bug fixes must be applied twice
- **Severity:** MEDIUM

**Finding RED-02:** `ci.yml` does not validate TypeScript, but deploy workflows do
- **Risk:** Type errors discovered late (post-merge)
- **Impact:** Failed deployments after PR approval
- **Severity:** MEDIUM

---

### Silent Failures

**Finding SF-01:** `deploy-beta.yml` smoke tests fail but containers remain up
- **Risk:** Inconsistent state (containers up, routes failing)
- **Impact:** False sense of successful deployment
- **Severity:** HIGH

**Finding SF-02:** Auto-recovery E150 in production workflows masks root cause
- **Risk:** Frontend restart "fixes" symptom, not cause
- **Impact:** Recurring failures without diagnosis
- **Severity:** MEDIUM

---

### Concurrency Issues

**Finding CONC-01:** `deploy-beta.yml` uses `cancel-in-progress: false`
- **Risk:** Backlog of obsolete deploys (commit N-5, N-4, N-3, N-2, N-1 all queued)
- **Impact:** Wasted CI time, delayed feedback
- **Severity:** MEDIUM

---

### External Dependencies

**Finding EXT-01:** `sync-arquitetura.yml` depends on external LLM API
- **Risk:** Workflow fails if API unavailable
- **Impact:** Non-blocking (documentation only)
- **Severity:** LOW

**Finding EXT-02:** `preflight-prod.yml` uses SSH config workaround (`sed` replacement)
- **Risk:** Fragile path assumption, breaks if script format changes
- **Impact:** Blocks PRs to main if workaround fails
- **Severity:** MEDIUM

---

### Contract Risks

**Finding CONTRACT-01:** Reusable workflows have no versioning
- **Risk:** Breaking changes affect 3 consumers simultaneously
- **Impact:** All deployments blocked if reusable workflow breaks
- **Severity:** HIGH

---

## Workflow Trigger Overlap Analysis

### Push to `dev`

**Triggered Workflows:**
1. `deploy-beta.yml` (automatic deployment)
2. `sync-arquitetura.yml` (documentation sync)

**Overlap:** None (different responsibilities)

---

### PR to `dev`

**Triggered Workflows:**
1. `ci.yml` (build validation)

**Overlap:** None

---

### PR to `main`

**Triggered Workflows:**
1. `preflight-prod.yml` (migration drift check)

**Overlap:** None

**Gap:** No build validation for PRs to `main` (assumes `ci.yml` already validated in `dev`)

---

### Manual Triggers

**Triggered Workflows:**
1. `deploy-prod.yml` (break-glass production deploy)
2. `promote-to-prod.yml` (canonical production deploy)
3. `docker-cleanup.yml` (maintenance)

**Overlap:** `deploy-prod.yml` and `promote-to-prod.yml` both deploy to production
- **Risk:** Confusion about which workflow to use
- **Mitigation Needed:** Clear usage policy documentation

---

## Secrets Inventory

| Secret | Used By | Purpose |
|---|---|---|
| `SERVER_HOST` | 5 workflows | SSH connection to Oracle VM |
| `SERVER_USER` | 5 workflows | SSH username |
| `SSH_PRIVATE_KEY` | `deploy-beta.yml`, `docker-cleanup.yml` | SSH auth (beta) |
| `SSH_PRIVATE_KEY_PROD` | `deploy-prod.yml`, `promote-to-prod.yml`, `preflight-prod.yml` | SSH auth (prod) |
| `GH_TOKEN` | `deploy-beta.yml`, `promote-to-prod.yml` | Git fetch + GitHub API |
| `PAT_TOKEN` | `sync-arquitetura.yml` | PR creation |
| `ROUTER_URL` | `sync-arquitetura.yml` | LLM API endpoint |
| `ROUTER_API_KEY` | `sync-arquitetura.yml` | LLM API auth |

**Total Unique Secrets:** 8

---

## Coverage Validation

### FR-001: Inventário Completo ✅

- **Requirement:** Map 100% of workflows in `.github/workflows/`
- **Status:** COMPLETE
- **Evidence:** 9/9 workflows inventoried (7 operational + 2 reusable)

---

### FR-002: Mapeamento de Dependências ✅

- **Requirement:** Document triggers, jobs, dependencies, and operational responsibility
- **Status:** COMPLETE
- **Evidence:** All workflows have complete trigger/job/dependency documentation

---

### SC-001: Classificação por Responsabilidade ✅

- **Requirement:** Classify workflows by operational responsibility
- **Status:** COMPLETE
- **Evidence:** 
  - CI: 2 workflows
  - CD: 3 workflows
  - Maintenance: 2 workflows
  - Reusable: 2 workflows

---

## Next Phase Readiness

**Phase 2 (Inventário) Status:** COMPLETE

**Phase 3 (Diagnóstico) Readiness:**
- All workflows inventoried ✅
- Critical findings identified ✅
- Reusable workflow consumers mapped ✅
- Trigger overlap analysis complete ✅

**Blocking Issues:** None

**Recommended Next Steps:**
1. Proceed to Phase 3 (Diagnóstico por Severidade)
2. Expand findings with severity classification
3. Quantify operational impact with evidence
