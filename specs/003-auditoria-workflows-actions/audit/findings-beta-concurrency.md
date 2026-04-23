# Finding: Beta Concurrency Policy Risk

**Finding ID:** CONC-01  
**Category:** Concurrency / Queue Management  
**Severity:** HIGH  
**Status:** Open

---

## Summary

`deploy-beta.yml` usa `cancel-in-progress: false`, causando enfileiramento de deploys obsoletos quando múltiplos commits são enviados rapidamente para `dev`. Isso resulta em desperdício de recursos CI e feedback atrasado sobre o estado real do ambiente beta.

---

## Evidence

### Current Configuration

**File:** `.github/workflows/deploy-beta.yml`

```yaml
concurrency:
  group: deploy-beta-${{ github.ref }}
  cancel-in-progress: false
```

### Behavior Analysis

**Scenario:** 5 commits enviados para `dev` em sequência rápida (N-4, N-3, N-2, N-1, N)

**Current behavior:**
1. Commit N-4 inicia deploy (tempo estimado: 5 minutos)
2. Commit N-3 entra na fila (aguarda N-4)
3. Commit N-2 entra na fila (aguarda N-3)
4. Commit N-1 entra na fila (aguarda N-2)
5. Commit N entra na fila (aguarda N-1)

**Total execution time:** ~25 minutos (5 deploys × 5 min)

**Result:** Beta environment reflete commit N após 25 minutos, mas commits N-4, N-3, N-2, N-1 são obsoletos no momento da execução.

---

## Operational Impact

### Wasted CI Resources

**Evidence from GitHub Actions:**
- Cada deploy beta consome ~5 minutos de runner time
- Deploys obsoletos (N-4 até N-1) são executados mesmo sendo irrelevantes
- **Waste:** 4 deploys × 5 min = 20 minutos de runner time desperdiçado

### Delayed Feedback

**Developer experience:**
- Push commit N às 10:00
- Feedback de deploy às 10:25 (25 min depois)
- **Expected:** Feedback em ~5 minutos

### False Sense of Stability

**Risk scenario:**
- Commit N-2 introduz bug crítico
- Commit N corrige o bug
- Deploy de N-2 executa e falha (mas já foi corrigido em N)
- **Confusion:** Notificação de falha para código já corrigido

---

## Root Cause

**Design decision:** `cancel-in-progress: false` foi escolhido para evitar interrupção de deploys em andamento.

**Rationale original (presumida):**
- Evitar estado inconsistente se deploy for cancelado no meio de migration
- Garantir que todo commit seja deployado pelo menos uma vez

**Problem:** Rationale não considera que commits intermediários se tornam obsoletos rapidamente em fluxo de desenvolvimento ativo.

---

## Recommended Actions

### Action 1: Mudar para `cancel-in-progress: true` (Priority: HIGH)

**File:** `.github/workflows/deploy-beta.yml`

**Change:**
```yaml
concurrency:
  group: deploy-beta-${{ github.ref }}
  cancel-in-progress: true  # Changed from false
```

**Rationale:**
- Cancela deploys obsoletos automaticamente
- Prioriza commit mais recente
- Reduz tempo de feedback de 25min → 5min

**Risk mitigation:**
- Migration job já usa flock (`/tmp/mesas-beta-deploy.lock`)
- Cancelamento ocorre antes de SSH (não interrompe migration em andamento)
- Rollback trap permanece ativo

---

### Action 2: Adicionar comentário explicativo (Priority: MEDIUM)

**File:** `.github/workflows/deploy-beta.yml`

**Add comment:**
```yaml
concurrency:
  group: deploy-beta-${{ github.ref }}
  # Cancel obsolete deploys to prioritize latest commit
  # Safe because: flock prevents mid-migration cancellation
  cancel-in-progress: true
```

**Rationale:** Documenta decisão para futuros mantenedores.

---

### Action 3: Monitorar taxa de cancelamento (Priority: LOW)

**Implementation:** Adicionar step de logging no início do workflow

**File:** `.github/workflows/deploy-beta.yml`

**Add step (first in `migrate` job):**
```yaml
- name: Log deploy start
  run: |
    echo "Deploy started for commit ${{ github.sha }}"
    echo "Triggered by: ${{ github.actor }}"
    echo "Ref: ${{ github.ref }}"
```

**Rationale:** Permite auditoria de quantos deploys foram cancelados vs. completados.

---

## Alternative Considered: Debouncing

**Approach:** Adicionar delay de 30s no início do workflow para "agrupar" commits rápidos.

**Rejected because:**
- Adiciona latência artificial em todos os deploys
- Não resolve problema fundamental (commits obsoletos ainda executam)
- `cancel-in-progress: true` é solução mais direta

---

## Severity Justification

**HIGH** porque:
- ✅ Impacto direto em tempo de feedback (5x mais lento)
- ✅ Desperdício mensurável de recursos CI
- ✅ Confusão operacional (notificações de falha para código já corrigido)
- ❌ Não causa falha de deploy (apenas ineficiência)

**Not CRITICAL because:** Não causa corrupção de estado ou downtime.

---

## Validation Criteria

- [ ] `cancel-in-progress: true` aplicado em `deploy-beta.yml`
- [ ] Comentário explicativo adicionado
- [ ] Teste com 3 commits rápidos: apenas último deve completar
- [ ] Verificar que flock previne cancelamento mid-migration
- [ ] Monitorar logs por 1 semana: taxa de cancelamento < 30%

---

## Related Findings

- **SF-01:** Smoke tests falham mas containers permanecem up (agravado por deploys obsoletos)
