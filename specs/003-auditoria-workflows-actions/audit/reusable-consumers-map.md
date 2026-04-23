# Reusable Workflow Consumers Map

**Feature:** 003-auditoria-workflows-actions  
**Purpose:** Mapear consumidores de workflows reutilizáveis antes de qualquer alteração  
**Generated:** 2026-04-23

---

## Overview

Este documento mapeia todos os consumidores de workflows reutilizáveis (`_enforce-migration-dir.yml` e `_lint-shell.yml`) para garantir que alterações nesses workflows sejam avaliadas quanto ao impacto em todos os consumidores.

---

## Reusable Workflow: _enforce-migration-dir.yml

**File:** `.github/workflows/_enforce-migration-dir.yml`  
**Purpose:** Validar que arquivos `migration_*.sql` estão em paths permitidos via `.github/migration-dir-allowlist`  
**Type:** `workflow_call`

### Contract

**Inputs:** None  
**Outputs:** None  
**Secrets:** None  
**Behavior:** Valida localização de migrations, falha se encontrar violations

### Consumers

| Workflow | Job Name | Dependency Type | Criticality |
|---|---|---|---|
| `deploy-beta.yml` | `enforce-dir` | Required (blocks deploy) | CRITICAL |
| `deploy-prod.yml` | `enforce-dir` | Required (blocks deploy) | CRITICAL |
| `promote-to-prod.yml` | `enforce-dir` | Required (blocks deploy) | CRITICAL |

**Total Consumers:** 3  
**Blast Radius:** 100% dos deploys (beta + produção)

### Breaking Change Impact

**Scenario:** Mudança em `_enforce-migration-dir.yml` que rejeita migrations válidas

**Impact:**
- ✅ `deploy-beta.yml` bloqueado → Beta não recebe novos deploys
- ✅ `deploy-prod.yml` bloqueado → Produção não pode receber hotfix
- ✅ `promote-to-prod.yml` bloqueado → Produção não pode receber release

**Recovery Time:** ~10 minutos (revert commit + redeploy)

### Change Protocol

**Before modifying `_enforce-migration-dir.yml`:**

1. **Create new version:**
   ```bash
   git tag workflows/enforce-migration-dir/v2
   git push origin workflows/enforce-migration-dir/v2
   ```

2. **Test with single consumer:**
   ```yaml
   # In deploy-beta.yml (test environment)
   enforce-dir:
     uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v2
   ```

3. **Validate in beta:**
   - Trigger deploy to beta
   - Verify migration validation works correctly
   - Monitor for false positives

4. **Migrate remaining consumers:**
   ```yaml
   # In deploy-prod.yml
   enforce-dir:
     uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v2
   
   # In promote-to-prod.yml
   enforce-dir:
     uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v2
   ```

5. **Deprecate v1:**
   - Add deprecation warning to v1
   - Set removal date (e.g., 30 days)

---

## Reusable Workflow: _lint-shell.yml

**File:** `.github/workflows/_lint-shell.yml`  
**Purpose:** Executar shellcheck em `./scripts` + actionlint em workflows  
**Type:** `workflow_call`

### Contract

**Inputs:** None  
**Outputs:** None  
**Secrets:** None  
**Behavior:** Valida shell scripts e workflow YAML, falha se encontrar issues

### Consumers

| Workflow | Job Name | Dependency Type | Criticality |
|---|---|---|---|
| `deploy-beta.yml` | `lint` | Required (blocks deploy) | CRITICAL |
| `deploy-prod.yml` | `lint` | Required (blocks deploy) | CRITICAL |
| `promote-to-prod.yml` | `lint` | Required (blocks deploy) | CRITICAL |

**Total Consumers:** 3  
**Blast Radius:** 100% dos deploys (beta + produção)

### Breaking Change Impact

**Scenario:** Mudança em `_lint-shell.yml` que adiciona regra mais estrita

**Impact:**
- ✅ `deploy-beta.yml` bloqueado → Scripts existentes falham nova regra
- ✅ `deploy-prod.yml` bloqueado → Hotfix bloqueado por lint
- ✅ `promote-to-prod.yml` bloqueado → Release bloqueada por lint

**Recovery Time:** ~10 minutos (revert commit + redeploy) ou ~30 minutos (fix scripts)

### Change Protocol

**Before modifying `_lint-shell.yml`:**

1. **Create new version:**
   ```bash
   git tag workflows/lint-shell/v2
   git push origin workflows/lint-shell/v2
   ```

2. **Test with single consumer:**
   ```yaml
   # In deploy-beta.yml (test environment)
   lint:
     uses: ./.github/workflows/_lint-shell.yml@workflows/lint-shell/v2
   ```

3. **Validate in beta:**
   - Trigger deploy to beta
   - Verify linting works correctly
   - Fix any new issues found

4. **Migrate remaining consumers:**
   ```yaml
   # In deploy-prod.yml
   lint:
     uses: ./.github/workflows/_lint-shell.yml@workflows/lint-shell/v2
   
   # In promote-to-prod.yml
   lint:
     uses: ./.github/workflows/_lint-shell.yml@workflows/lint-shell/v2
   ```

5. **Deprecate v1:**
   - Add deprecation warning to v1
   - Set removal date (e.g., 30 days)

---

## Versioning Strategy

### Current State (Unversioned)

**Risk:** Breaking change affects all consumers immediately

```yaml
# Current reference (no version pin)
enforce-dir:
  uses: ./.github/workflows/_enforce-migration-dir.yml
```

### Planned State (Versioned)

**Benefit:** Breaking change can be tested incrementally

```yaml
# Planned reference (version pinned)
enforce-dir:
  uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v1
```

### Version Tagging Convention

**Format:** `workflows/<workflow-name>/v<major>`

**Examples:**
- `workflows/enforce-migration-dir/v1`
- `workflows/enforce-migration-dir/v2`
- `workflows/lint-shell/v1`
- `workflows/lint-shell/v2`

**Semantic Versioning:**
- **Major version bump (v1 → v2):** Breaking change (contract change, new required input, behavior change)
- **No minor/patch versions:** Workflows are atomic, no need for granular versioning

---

## Implementation Plan

### Step 1: Create Initial Version Tags

```bash
# Tag current state as v1
git tag workflows/enforce-migration-dir/v1
git tag workflows/lint-shell/v1
git push origin --tags
```

### Step 2: Update All Consumers

**File:** `.github/workflows/deploy-beta.yml`

```yaml
enforce-dir:
  uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v1

lint:
  uses: ./.github/workflows/_lint-shell.yml@workflows/lint-shell/v1
```

**File:** `.github/workflows/deploy-prod.yml`

```yaml
enforce-dir:
  uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v1

lint:
  uses: ./.github/workflows/_lint-shell.yml@workflows/lint-shell/v1
```

**File:** `.github/workflows/promote-to-prod.yml`

```yaml
enforce-dir:
  uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v1

lint:
  uses: ./.github/workflows/_lint-shell.yml@workflows/lint-shell/v1
```

### Step 3: Add Contract Documentation

**File:** `.github/workflows/_enforce-migration-dir.yml`

**Add header comment:**
```yaml
# ============================================================================
# REUSABLE WORKFLOW: Enforce Migration Directory
# VERSION: v1
# CONTRACT:
#   Inputs: None
#   Outputs: None
#   Secrets: None
#   Behavior: Validates migration_*.sql files are in allowed paths
#   Dependencies: .github/migration-dir-allowlist must exist
# BREAKING CHANGES: Require new major version (v2, v3, etc)
# CONSUMERS: deploy-beta.yml, deploy-prod.yml, promote-to-prod.yml
# LAST UPDATED: 2026-04-23
# ============================================================================
```

**File:** `.github/workflows/_lint-shell.yml`

**Add header comment:**
```yaml
# ============================================================================
# REUSABLE WORKFLOW: Lint Shell Scripts and Workflows
# VERSION: v1
# CONTRACT:
#   Inputs: None
#   Outputs: None
#   Secrets: None
#   Behavior: Runs shellcheck on ./scripts + actionlint on workflows
#   Dependencies: None
# BREAKING CHANGES: Require new major version (v2, v3, etc)
# CONSUMERS: deploy-beta.yml, deploy-prod.yml, promote-to-prod.yml
# LAST UPDATED: 2026-04-23
# ============================================================================
```

---

## Validation Criteria

- [ ] Version tags created for both reusable workflows
- [ ] All 3 consumers updated to reference v1
- [ ] Contract documentation added to reusable workflows
- [ ] Test: Modify `_enforce-migration-dir.yml` without updating tag
  - Expected: Consumers still use v1 (unaffected by change)
- [ ] Test: Create v2 tag and update single consumer
  - Expected: Only updated consumer uses v2, others remain on v1

---

## Maintenance Guidelines

### When to Create New Version

**Create v2 when:**
- Adding new required input
- Changing validation logic (stricter or looser)
- Changing dependencies (new action version)
- Changing behavior that consumers rely on

**Do NOT create new version when:**
- Fixing typos in comments
- Updating documentation
- Refactoring internal logic (no behavior change)

### Deprecation Process

**When deprecating v1:**

1. Add deprecation warning to v1:
   ```yaml
   jobs:
     deprecation-warning:
       runs-on: ubuntu-latest
       steps:
         - name: Warn about deprecated version
           run: |
             echo "::warning::Este workflow usa v1 (deprecated)"
             echo "::warning::Migre para v2: @workflows/enforce-migration-dir/v2"
             echo "::warning::v1 será removido em: 2026-06-01"
   ```

2. Set removal date (minimum 30 days)

3. Update all consumers to v2

4. Remove v1 tag after removal date

---

## Related Actions

- **ACTION-PROD-SEP:** Separation of production workflows (consumers of reusable workflows)
- **ACTION-BETA-CONC:** Beta concurrency adjustment (consumer of reusable workflows)
- **ACTION-FAILURE-PROP:** Failure propagation (consumers of reusable workflows)
