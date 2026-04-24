# Regularization Action: Production Workflow Separation

**Action ID:** ACTION-PROD-SEP  
**Related Finding:** OVERLAP-01, RC-01  
**Priority:** HIGH  
**Status:** Planned

---

## Objective

Estabelecer separação explícita de responsabilidades entre `deploy-prod.yml` (break-glass emergency) e `promote-to-prod.yml` (canonical PR-driven deployment), eliminando ambiguidade operacional e prevenindo uso acidental de bypass de governança.

---

## Target Files

1. `.github/workflows/deploy-prod.yml`
2. `.github/workflows/promote-to-prod.yml`
3. `docs/workflows/DEPLOY_DECISION_TREE.md` (novo)

---

## Planned Changes

### Change 1: Rename Workflows for Clarity

**File:** `.github/workflows/promote-to-prod.yml`

**Current:**
```yaml
name: Promote Beta to Production
```

**Planned:**
```yaml
name: Promote Beta to Production (CANONICAL)
```

**Rationale:** Torna explícito na UI do GitHub Actions que este é o workflow principal.

---

**File:** `.github/workflows/deploy-prod.yml`

**Current:**
```yaml
name: Deploy Production
```

**Planned:**
```yaml
name: Deploy Production (BREAK-GLASS ONLY — Use promote-to-prod.yml instead)
```

**Rationale:** Alerta visível na UI para prevenir uso acidental.

---

### Change 2: Add Cooldown Check to Break-Glass Workflow

**File:** `.github/workflows/deploy-prod.yml`

**Location:** Novo job antes de `deploy-production`

**Planned Addition:**
```yaml
  check-recent-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Check for recent production deploy
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          set -euo pipefail
          
          # Get last workflow run of promote-to-prod.yml
          LAST_PROMOTE=$(gh api \
            repos/${{ github.repository }}/actions/workflows/promote-to-prod.yml/runs \
            --jq '.workflow_runs[0] | {conclusion, created_at, html_url}')
          
          LAST_PROMOTE_TIME=$(echo "$LAST_PROMOTE" | jq -r '.created_at')
          LAST_PROMOTE_URL=$(echo "$LAST_PROMOTE" | jq -r '.html_url')
          
          # Calculate time difference
          LAST_PROMOTE_EPOCH=$(date -d "$LAST_PROMOTE_TIME" +%s)
          NOW_EPOCH=$(date +%s)
          DIFF_SECONDS=$((NOW_EPOCH - LAST_PROMOTE_EPOCH))
          DIFF_MINUTES=$((DIFF_SECONDS / 60))
          
          # Enforce 10-minute cooldown
          if [ $DIFF_MINUTES -lt 10 ]; then
            echo "::error::BLOQUEIO: Deploy canônico executou há $DIFF_MINUTES minutos"
            echo "::error::Cooldown period: 10 minutos"
            echo "::error::Último deploy: $LAST_PROMOTE_URL"
            echo "::error::Aguarde $((10 - DIFF_MINUTES)) minutos ou confirme emergência real"
            exit 1
          fi
          
          echo "Cooldown period respeitado. Prosseguindo com break-glass deploy."

  deploy-production:
    needs: [enforce-dir, lint, check-recent-deploy]  # Add dependency
    # ... rest of job
```

**Rationale:** Previne disparo acidental logo após deploy canônico. Força operador a confirmar emergência real.

---

### Change 3: Add Break-Glass Usage Alert

**File:** `.github/workflows/deploy-prod.yml`

**Location:** Primeiro step do job `deploy-production`

**Planned Addition:**
```yaml
      - name: Alert break-glass usage
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          # Create issue to track break-glass usage
          gh issue create \
            --title "🚨 Break-glass deploy executado em $(date -Iseconds)" \
            --body "**Workflow:** deploy-prod.yml
          **Disparado por:** ${{ github.actor }}
          **Branch:** ${{ github.ref }}
          **Commit:** ${{ github.sha }}
          **Run:** ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          
          **Ação necessária:**
          - [ ] Validar que deploy foi intencional
          - [ ] Documentar motivo da emergência
          - [ ] Criar release retroativa se necessário
          - [ ] Fechar issue após validação" \
            --label "ops,break-glass,needs-review"
```

**Rationale:** Cria auditoria automática de uso de break-glass. Força documentação retroativa.

---

### Change 4: Add Warning Step

**File:** `.github/workflows/deploy-prod.yml`

**Location:** Segundo step do job `deploy-production` (após alert)

**Planned Addition:**
```yaml
      - name: Warn about break-glass usage
        run: |
          echo "::warning::BREAK-GLASS DEPLOY DETECTED"
          echo "::warning::Este workflow bypassa governança de PR."
          echo "::warning::Workflow canônico: promote-to-prod.yml"
          echo "::warning::Use este workflow apenas em emergências."
          echo "::warning::Uma issue foi criada para rastreamento."
```

**Rationale:** Alerta visível no log sem bloquear emergências.

---

### Change 5: Create Decision Tree Documentation

**File:** `docs/workflows/DEPLOY_DECISION_TREE.md` (novo)

**Planned Content:**
```markdown
# Deploy Decision Tree

## Produção

### Cenário Normal (PR aprovado)
✅ **Use:** `promote-to-prod.yml`
- **Requer:** PR dev→main aprovado e merged
- **Requer:** Input de versão (ex: v0.1.1)
- **Executa:** Governance gate + deploy + release
- **Quando usar:** 99% dos casos

### Cenário de Emergência (hotfix crítico)
⚠️ **Use:** `deploy-prod.yml`
- **Requer:** Aprovação verbal do mantenedor
- **Bypassa:** Governance gate
- **Executa:** Deploy direto (sem release)
- **Quando usar:** Apenas em emergências reais (ex: vulnerabilidade crítica, downtime de produção)
- **Cooldown:** 10 minutos após último deploy canônico
- **Auditoria:** Issue automática criada

### Exemplos de Uso Correto

**Cenário 1: Feature nova aprovada**
→ Use `promote-to-prod.yml` com versão v0.2.0

**Cenário 2: Bugfix aprovado**
→ Use `promote-to-prod.yml` com versão v0.1.2

**Cenário 3: Produção down, fix urgente**
→ Use `deploy-prod.yml` (após aprovação verbal)

**Cenário 4: Vulnerabilidade crítica descoberta**
→ Use `deploy-prod.yml` (após aprovação verbal)

### Exemplos de Uso Incorreto

❌ **Cenário 1: "Esqueci de fazer PR"**
→ Não use `deploy-prod.yml`. Crie PR e use `promote-to-prod.yml`

❌ **Cenário 2: "PR está demorando para aprovar"**
→ Não use `deploy-prod.yml`. Aguarde aprovação ou solicite review urgente

❌ **Cenário 3: "Quero testar algo rápido em produção"**
→ Não use `deploy-prod.yml`. Teste em beta primeiro
```

**Rationale:** Referência clara para operadores. Reduz ambiguidade.

---

## Rollback Plan

### If Changes Cause Issues

**Step 1: Revert workflow names**
```bash
git revert <commit-sha>
git push origin feat/003-auditoria-workflows-actions
```

**Step 2: Remove cooldown check**
- Edit `.github/workflows/deploy-prod.yml`
- Remove job `check-recent-deploy`
- Remove dependency from `deploy-production.needs`

**Step 3: Remove alert/warning steps**
- Edit `.github/workflows/deploy-prod.yml`
- Remove steps `Alert break-glass usage` and `Warn about break-glass usage`

**Rollback time:** ~5 minutes (single commit revert)

---

## Validation Criteria

- [ ] Workflow names updated in GitHub UI
- [ ] Cooldown check blocks deploy < 10min after promote
- [ ] Issue created automatically when `deploy-prod.yml` runs
- [ ] Warning visible in workflow log
- [ ] Decision tree documentation accessible
- [ ] Test: Trigger `deploy-prod.yml` < 10min after `promote-to-prod.yml` → blocked
- [ ] Test: Trigger `deploy-prod.yml` > 10min after `promote-to-prod.yml` → allowed with warnings

---

## Dependencies

**Must complete before:**
- None (independent action)

**Must complete after:**
- None (can be executed immediately)

---

## Estimated Impact

**Deployment time:** No change (cooldown check adds ~2s)  
**CI resources:** Minimal (1 API call to GitHub)  
**Operational clarity:** High improvement  
**Risk reduction:** Prevents accidental bypass of governance

---

## Approval Status

**Approved by:** User (2026-04-23)  
**Decision:** Opção A (manter com safeguards fortes)
