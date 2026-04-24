# Workflow Inventory: Reusable Workflows

**Operational Responsibility:** CI/CD — Componentes reutilizáveis compartilhados entre workflows

---

## Workflow: _enforce-migration-dir.yml

**File Path:** `.github/workflows/_enforce-migration-dir.yml`  
**Type:** Reusable workflow (`workflow_call`)

### Trigger

```yaml
on:
  workflow_call:
```

### Jobs

#### Job: `enforce-dir`

**Runs On:** `ubuntu-latest`  
**Dependencies:** None

**Steps:**
1. `actions/checkout@v4`
2. Verify migration directory canonicity:
   - Check `.github/migration-dir-allowlist` exists
   - Parse allowlist (ignore comments and empty lines)
   - Build exclusion list for `find` command
   - Search for `migration_*.sql` files outside allowed paths
   - If violations found: exit 1 with error message
   - If clean: success

**Purpose:** Enforce migration file location governance (prevent rogue migrations)

**Failure Impact:** Blocks caller workflow (migration gate)

---

### Called By

- `deploy-beta.yml` (job: `enforce-dir`)
- `deploy-prod.yml` (job: `enforce-dir`)
- `promote-to-prod.yml` (job: `enforce-dir`)

**Total Consumers:** 3 workflows

---

### Critical Observations

- **Allowlist-based:** Relies on `.github/migration-dir-allowlist` (single source of truth)
- **Strict enforcement:** Any migration file outside allowed paths blocks deployment
- **No exceptions:** No override mechanism (intentional governance constraint)
- **Contract stability:** Changes to this workflow affect 3 deployment pipelines simultaneously

---

## Workflow: _lint-shell.yml

**File Path:** `.github/workflows/_lint-shell.yml`  
**Type:** Reusable workflow (`workflow_call`)

### Trigger

```yaml
on:
  workflow_call:
```

### Jobs

#### Job: `lint`

**Runs On:** `ubuntu-latest`  
**Dependencies:** None

**Steps:**
1. `actions/checkout@v4`
2. Shellcheck:
   - Uses `ludeeus/action-shellcheck@master`
   - Scans `./scripts` directory
3. Actionlint:
   - Uses `reviewdog/action-actionlint@v1`
   - Validates workflow YAML syntax

**Purpose:** Validate shell scripts and workflow files for syntax/style issues

**Failure Impact:** Blocks caller workflow (linting gate)

---

### Called By

- `deploy-beta.yml` (job: `lint`)
- `deploy-prod.yml` (job: `lint`)
- `promote-to-prod.yml` (job: `lint`)

**Total Consumers:** 3 workflows

---

### Critical Observations

- **Dual validation:** Covers both shell scripts and workflow files
- **Shellcheck scope:** Only scans `./scripts` (does not cover inline scripts in workflows)
- **Actionlint scope:** Validates all workflow files in `.github/workflows/`
- **Contract stability:** Changes to this workflow affect 3 deployment pipelines simultaneously
- **No configuration:** Uses default shellcheck rules (no project-specific overrides)

---

## Reusable Workflow Contract Risk Analysis

### Shared Consumers

Both reusable workflows are consumed by the same 3 workflows:
- `deploy-beta.yml`
- `deploy-prod.yml`
- `promote-to-prod.yml`

### Impact of Breaking Changes

**If `_enforce-migration-dir.yml` changes:**
- All 3 deployment pipelines affected simultaneously
- Risk: Breaking change blocks all deployments (beta + production)
- Mitigation: Requires versioning strategy or feature flags

**If `_lint-shell.yml` changes:**
- All 3 deployment pipelines affected simultaneously
- Risk: Stricter linting rules block existing deployments
- Mitigation: Requires gradual rollout or exemption mechanism

### Recommendations for Phase 4

- Document contract stability requirements
- Consider versioning reusable workflows (e.g., `_enforce-migration-dir-v1.yml`)
- Implement contract testing before modifying reusable workflows
- Add deprecation warnings for breaking changes
