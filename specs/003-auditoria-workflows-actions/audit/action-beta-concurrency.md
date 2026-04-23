# Regularization Action: Beta Concurrency Policy Adjustment

**Action ID:** ACTION-BETA-CONC  
**Related Finding:** CONC-01  
**Priority:** HIGH  
**Status:** Planned

---

## Objective

Ajustar política de concorrência em `deploy-beta.yml` para cancelar deploys obsoletos automaticamente, priorizando o commit mais recente e reduzindo tempo de feedback de 25min para 5min.

---

## Target Files

1. `.github/workflows/deploy-beta.yml`

---

## Planned Changes

### Change 1: Update Concurrency Policy

**File:** `.github/workflows/deploy-beta.yml`

**Current:**
```yaml
concurrency:
  group: deploy-beta-${{ github.ref }}
  cancel-in-progress: false
```

**Planned:**
```yaml
concurrency:
  group: deploy-beta-${{ github.ref }}
  # Cancel obsolete deploys to prioritize latest commit
  # Safe because: flock prevents mid-migration cancellation
  cancel-in-progress: true
```

**Rationale:**
- Cancela deploys obsoletos automaticamente
- Prioriza commit mais recente
- Reduz tempo de feedback de 25min → 5min
- Economiza recursos CI (20 min de runner time por burst de 5 commits)

---

### Change 2: Add Explanatory Comment

**File:** `.github/workflows/deploy-beta.yml`

**Location:** Acima do bloco `concurrency`

**Planned Addition:**
```yaml
# Concurrency Policy:
# - cancel-in-progress: true → Cancels obsolete deploys when new commit arrives
# - Safe: flock in migrate job prevents cancellation during migration execution
# - Benefit: Faster feedback (5min vs 25min for 5 commits), reduced CI waste
```

**Rationale:** Documenta decisão para futuros mantenedores.

---

### Change 3: Add Deploy Start Logging (Optional)

**File:** `.github/workflows/deploy-beta.yml`

**Location:** Primeiro step do job `migrate`

**Planned Addition:**
```yaml
      - name: Log deploy start
        run: |
          echo "Deploy started for commit ${{ github.sha }}"
          echo "Triggered by: ${{ github.actor }}"
          echo "Ref: ${{ github.ref }}"
          echo "Run ID: ${{ github.run_id }}"
```

**Rationale:** Permite auditoria de quantos deploys foram cancelados vs. completados.

---

## Safety Analysis

### Why This Change is Safe

**1. Flock Protection:**
```yaml
# In migrate job
exec 9>/tmp/mesas-beta-deploy.lock
if ! flock -w 120 9; then
  echo "ERRO: Timeout aguardando lock de deploy beta (E146)"
  exit 1
fi
```

- Lock é adquirido ANTES de qualquer operação de migration
- Cancelamento ocorre ANTES de SSH (não interrompe migration em andamento)
- Se workflow for cancelado após adquirir lock, próximo workflow aguarda lock ser liberado

**2. Rollback Trap:**
```yaml
rollback() {
  echo "ROLLBACK: tentando resubir containers..."
  docker compose -f docker-compose.beta.yml up -d --force-recreate || true
}
trap rollback ERR
```

- Rollback trap permanece ativo mesmo se workflow for cancelado
- Containers antigos permanecem rodando se deploy for cancelado antes de `down`

**3. Cancellation Points:**
- ✅ Safe: Durante checkout, setup, typecheck (antes de SSH)
- ✅ Safe: Durante aguardo de flock (antes de adquirir lock)
- ❌ Unsafe: Durante migration execution (protegido por flock)
- ❌ Unsafe: Durante container rebuild (protegido por trap)

---

## Expected Behavior Changes

### Before (cancel-in-progress: false)

**Scenario:** 5 commits pushed to dev in 2 minutes

```
10:00 - Commit N-4 pushed → deploy starts
10:01 - Commit N-3 pushed → queued (waits for N-4)
10:01 - Commit N-2 pushed → queued (waits for N-3)
10:02 - Commit N-1 pushed → queued (waits for N-2)
10:02 - Commit N   pushed → queued (waits for N-1)

10:05 - N-4 completes
10:10 - N-3 completes (obsolete)
10:15 - N-2 completes (obsolete)
10:20 - N-1 completes (obsolete)
10:25 - N   completes (finally!)

Result: 25 minutes, 20 min wasted on obsolete deploys
```

---

### After (cancel-in-progress: true)

**Scenario:** 5 commits pushed to dev in 2 minutes

```
10:00 - Commit N-4 pushed → deploy starts
10:01 - Commit N-3 pushed → N-4 cancelled, N-3 starts
10:01 - Commit N-2 pushed → N-3 cancelled, N-2 starts
10:02 - Commit N-1 pushed → N-2 cancelled, N-1 starts
10:02 - Commit N   pushed → N-1 cancelled, N   starts

10:07 - N completes

Result: 7 minutes, 0 min wasted
```

---

## Rollback Plan

### If Changes Cause Issues

**Step 1: Revert concurrency policy**
```yaml
concurrency:
  group: deploy-beta-${{ github.ref }}
  cancel-in-progress: false  # Revert to original
```

**Step 2: Push change**
```bash
git add .github/workflows/deploy-beta.yml
git commit -m "revert: restore deploy-beta concurrency policy"
git push origin feat/003-auditoria-workflows-actions
```

**Rollback time:** ~2 minutes (single line change)

---

## Validation Criteria

- [ ] `cancel-in-progress: true` applied in `deploy-beta.yml`
- [ ] Explanatory comment added
- [ ] Test: Push 3 commits rapidly to dev
  - Expected: Only last commit completes deploy
  - Expected: First 2 commits show "cancelled" status
- [ ] Test: Verify flock prevents mid-migration cancellation
  - Method: Trigger deploy, wait for migration to start, push new commit
  - Expected: New deploy waits for lock (does not cancel mid-migration)
- [ ] Monitor logs for 1 week: cancellation rate < 30%

---

## Monitoring Plan

### Metrics to Track (Post-Deployment)

**Week 1 after change:**
- Total deploys triggered: X
- Deploys completed: Y
- Deploys cancelled: Z
- Cancellation rate: Z/X (target: < 30%)
- Average feedback time: T (target: < 10 min)

**If cancellation rate > 50%:**
- Investigate: Are developers pushing too frequently?
- Consider: Adding debounce (30s delay before starting deploy)

---

## Dependencies

**Must complete before:**
- None (independent action)

**Must complete after:**
- None (can be executed immediately)

---

## Estimated Impact

**Deployment time (single commit):** No change (~5 min)  
**Deployment time (5 commits burst):** 25 min → 7 min (72% reduction)  
**CI resources saved:** 20 min per burst  
**Developer feedback:** 5x faster  
**Risk:** Low (protected by flock + rollback trap)

---

## Approval Status

**Approved by:** User (2026-04-23)  
**Decision:** Opção A (cancelar deploys obsoletos)
