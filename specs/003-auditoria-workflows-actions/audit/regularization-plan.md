# Consolidated Regularization Plan

**Feature:** 003-auditoria-workflows-actions  
**Phase:** 4 (Planejamento de Regularização)  
**Generated:** 2026-04-23  
**Total Actions:** 5 (1 CRITICAL, 3 HIGH, 1 MEDIUM)

---

## Executive Summary

Plano consolidado de regularização para eliminar findings críticos e de alta severidade identificados na auditoria de workflows GitHub Actions. Todas as ações são mínimas, reversíveis e atômicas, com rollback explícito documentado.

---

## Actions by Priority

### CRITICAL (1)

| Action ID | Title | Target | Rollback Time | Estimated Impact |
|---|---|---|---|---|
| **ACTION-FAILURE-PROP** | Failure Propagation and Rollback | deploy-beta.yml, deploy-prod.yml, promote-to-prod.yml | 5 min | +60-120s deploy time |

---

### HIGH (3)

| Action ID | Title | Target | Rollback Time | Estimated Impact |
|---|---|---|---|---|
| **ACTION-PROD-SEP** | Production Workflow Separation | deploy-prod.yml, promote-to-prod.yml | 5 min | +2s deploy time |
| **ACTION-BETA-CONC** | Beta Concurrency Policy Adjustment | deploy-beta.yml | 2 min | -72% burst time |
| **Reusable Versioning** | Workflow Versioning Implementation | _enforce-migration-dir.yml, _lint-shell.yml | 10 min | No impact |

---

### MEDIUM (1)

| Action ID | Title | Target | Rollback Time | Estimated Impact |
|---|---|---|---|---|
| **ACTION-BOUNDARIES** | Operational Boundaries Documentation | All workflows + docs/ | 10 min | No impact |

---

## Detailed Action Plans

### ACTION-FAILURE-PROP (CRITICAL)

**Related Finding:** SF-01 (CRITICAL), SF-02 (MEDIUM)

**Objective:** Eliminar padrões de falha silenciosa via rollback automático com snapshot de banco.

**Changes:**
1. **Database snapshot before migrations** (all deploy workflows)
   - Timeout: 60s (beta), 120s (prod)
   - Storage: /tmp (~200 MB beta, ~2 GB prod)
   - Cleanup: Automatic on success

2. **Rollback on smoke test failure** (deploy-beta.yml)
   - Restore database via snapshot (timeout: 90s beta, 180s prod)
   - Restart containers
   - Re-validate environment
   - Fail workflow with rollback success message

3. **Diagnostic before E150 recovery** (deploy-prod.yml, promote-to-prod.yml)
   - Collect logs before recovery
   - Apply recovery only if E150 pattern detected
   - Fail explicitly if not E150

**Rollback:**
```yaml
# Remove snapshot creation step
# Revert to simple restart rollback
if ! check_beta_critical_routes; then
  docker compose restart
  exit 1
fi
```

**Validation:**
- [ ] Deploy with broken route → rollback triggered
- [ ] Database restored to previous state
- [ ] Environment serves previous working code
- [ ] Successful deploy → snapshot cleaned up

---

### ACTION-PROD-SEP (HIGH)

**Related Finding:** OVERLAP-01, RC-01

**Objective:** Separar responsabilidades entre deploy-prod.yml (break-glass) e promote-to-prod.yml (canonical).

**Changes:**
1. **Rename workflows** for clarity
   - `promote-to-prod.yml` → "Promote Beta to Production (CANONICAL)"
   - `deploy-prod.yml` → "Deploy Production (BREAK-GLASS ONLY)"

2. **Add cooldown check** to deploy-prod.yml
   - Block if promote-to-prod.yml ran < 10 minutes ago
   - Force confirmation of emergency

3. **Add break-glass alert**
   - Create GitHub issue automatically
   - Warning in workflow log

4. **Create decision tree documentation**
   - `docs/workflows/DEPLOY_DECISION_TREE.md`
   - Clear guidance on when to use each workflow

**Rollback:**
```bash
git revert <commit-sha>  # Single commit revert
```

**Validation:**
- [ ] Workflow names updated in UI
- [ ] Cooldown blocks deploy < 10min after promote
- [ ] Issue created when deploy-prod.yml runs
- [ ] Decision tree accessible

---

### ACTION-BETA-CONC (HIGH)

**Related Finding:** CONC-01

**Objective:** Cancelar deploys obsoletos para priorizar commit mais recente.

**Changes:**
1. **Update concurrency policy**
   ```yaml
   cancel-in-progress: true  # Changed from false
   ```

2. **Add explanatory comment**
   - Document safety (flock protection)
   - Document benefit (faster feedback)

3. **Add deploy start logging** (optional)
   - Track cancellation rate

**Rollback:**
```yaml
cancel-in-progress: false  # Revert to original
```

**Validation:**
- [ ] Push 3 commits rapidly → only last completes
- [ ] Flock prevents mid-migration cancellation
- [ ] Monitor cancellation rate < 30%

---

### Reusable Versioning (HIGH)

**Related Finding:** CONTRACT-01

**Objective:** Versionar workflows reutilizáveis para prevenir breaking changes.

**Changes:**
1. **Create version tags**
   ```bash
   git tag workflows/enforce-migration-dir/v1
   git tag workflows/lint-shell/v1
   ```

2. **Update all consumers** to reference v1
   ```yaml
   uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v1
   ```

3. **Add contract documentation** to reusable workflows

**Rollback:**
```yaml
# Remove version pin from consumers
uses: ./.github/workflows/_enforce-migration-dir.yml
```

**Validation:**
- [ ] Tags created
- [ ] Consumers updated
- [ ] Modify workflow without tag → consumers unaffected

---

### ACTION-BOUNDARIES (MEDIUM)

**Related Finding:** OVERLAP-01, RED-01

**Objective:** Documentar fronteiras operacionais entre workflows.

**Changes:**
1. **Add header comments** to all 9 workflows
   - Responsibility, trigger, scope, dependencies

2. **Create comprehensive documentation**
   - `docs/workflows/WORKFLOW_BOUNDARIES.md`
   - Classification matrix
   - Decision matrix
   - Forbidden patterns

**Rollback:**
```bash
# Remove comments and documentation
git revert <commit-sha>
```

**Validation:**
- [ ] Header comments added
- [ ] Documentation created
- [ ] Team review completed

---

## Execution Order

### Phase 5 (Aplicação de Correções)

**Recommended order:**

1. **ACTION-BOUNDARIES** (MEDIUM, documentation only)
   - No risk, provides context for other changes
   - Can be done in parallel with others

2. **Reusable Versioning** (HIGH, foundational)
   - Must be done before modifying reusable workflows
   - Protects against breaking changes

3. **ACTION-BETA-CONC** (HIGH, low risk)
   - Single line change
   - Protected by flock
   - Test in beta first

4. **ACTION-PROD-SEP** (HIGH, medium risk)
   - Adds safeguards to production
   - Test cooldown logic carefully

5. **ACTION-FAILURE-PROP** (CRITICAL, high complexity)
   - Most complex change
   - Test snapshot/restore thoroughly
   - Validate in beta before prod

---

## Rollback Strategy

### Per-Action Rollback

Each action is atomic (single commit or small commit set). Rollback via:

```bash
# Identify commit SHA
git log --oneline

# Revert specific commit
git revert <commit-sha>

# Push revert
git push origin feat/003-auditoria-workflows-actions
```

**Rollback time:** 2-10 minutes per action

---

### Emergency Rollback (All Changes)

If multiple actions cause issues:

```bash
# Revert entire feature branch
git reset --hard <commit-before-phase-5>
git push --force origin feat/003-auditoria-workflows-actions
```

**Rollback time:** ~5 minutes (reverts all Phase 5 changes)

---

## Validation Strategy

### Per-Action Validation

Each action has specific validation criteria (see individual action plans).

### Integration Validation

After all actions applied:

1. **Beta environment:**
   - [ ] Deploy successful commit → all checks pass
   - [ ] Deploy broken commit → rollback triggered
   - [ ] Push 3 commits rapidly → only last deploys

2. **Production environment:**
   - [ ] Promote via canonical workflow → success
   - [ ] Attempt break-glass < 10min → blocked
   - [ ] Attempt break-glass > 10min → allowed with warnings

3. **Reusable workflows:**
   - [ ] Modify without tag → consumers unaffected
   - [ ] Create v2 → gradual migration possible

---

## Risk Assessment

### Low Risk Actions

- **ACTION-BOUNDARIES:** Documentation only, no code changes
- **Reusable Versioning:** Adds protection, no behavior change

### Medium Risk Actions

- **ACTION-BETA-CONC:** Protected by flock, tested in beta first
- **ACTION-PROD-SEP:** Adds safeguards, doesn't change core logic

### High Risk Actions

- **ACTION-FAILURE-PROP:** Complex snapshot/restore logic
  - Mitigation: Test thoroughly in beta
  - Mitigation: Validate snapshot size/timing
  - Mitigation: Fallback to simple restart if snapshot fails

---

## Dependencies Between Actions

### No Dependencies

All actions are independent and can be applied in any order.

**Recommended order** (above) is based on risk, not dependencies.

---

## Estimated Total Impact

**Deployment time:**
- Beta: +60s (snapshot) + 0-90s (rollback if needed)
- Prod: +120s (snapshot) + 0-180s (rollback if needed)

**CI resources:**
- Saved: 20 min per burst (beta concurrency)
- Added: Minimal (cooldown check, snapshot storage)

**Operational clarity:**
- High improvement (documentation + safeguards)

**Risk reduction:**
- CRITICAL: Eliminates exposure of broken code
- HIGH: Prevents accidental bypass of governance
- HIGH: Prevents breaking changes to reusable workflows

---

## Approval Status

**Approved by:** User (2026-04-23)

**Decisions:**
1. ✅ Concurrency: Cancel obsolete deploys
2. ✅ Break-glass: Maintain with safeguards
3. ✅ Rollback: Snapshot strategy (60s/90s beta, 120s/180s prod)
4. ✅ Versioning: Implement (obrigatório)

---

## Next Phase

**Phase 5 (Aplicação de Correções)** — Tasks T028-T034

Execute planned actions incrementally with validation after each change.
