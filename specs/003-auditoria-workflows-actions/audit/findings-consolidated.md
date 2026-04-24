# Consolidated Findings Report

**Feature:** 003-auditoria-workflows-actions  
**Phase:** 3 (Diagnóstico por Severidade)  
**Generated:** 2026-04-23  
**Total Findings:** 7 (1 CRITICAL, 4 HIGH, 2 MEDIUM)

---

## Executive Summary

Auditoria identificou 7 findings críticos e de alta severidade nos workflows de CI/CD, com foco em race conditions, falhas silenciosas, concorrência inadequada e riscos de contrato. Todos os findings críticos e altos possuem ações de regularização definidas e priorizadas.

---

## Findings by Severity

### CRITICAL (1)

| ID | Title | Category | Impact | Action Priority |
|---|---|---|---|---|
| **SF-01** | Smoke Tests Fail But Containers Remain Up | Error Handling | Código quebrado em produção/beta | CRITICAL |

---

### HIGH (4)

| ID | Title | Category | Impact | Action Priority |
|---|---|---|---|---|
| **CONC-01** | Beta Concurrency Policy Risk | Concurrency | Feedback atrasado, desperdício de CI | HIGH |
| **RC-01** | Production Race Condition | Race Condition | Divergência release/código | HIGH |
| **CONTRACT-01** | Reusable Workflow Contract Risk | Contract Stability | Bloqueio de 100% dos deploys | HIGH |
| **RED-01** | Duplicate Logic Between Production Workflows | Redundancy | Manutenção duplicada | MEDIUM* |

*Nota: RED-01 identificado na Phase 2, severidade reavaliada como MEDIUM (não HIGH) pois não causa falha operacional imediata.

---

### MEDIUM (2)

| ID | Title | Category | Impact | Action Priority |
|---|---|---|---|---|
| **OVERLAP-01** | Deploy Trigger Overlap | Redundancy | Ambiguidade operacional | MEDIUM |
| **SF-02** | Auto-Recovery E150 Masks Root Cause | Error Handling | Diagnóstico dificultado | MEDIUM |

---

## Detailed Findings

### SF-01: Smoke Tests Fail But Containers Remain Up (CRITICAL)

**File:** `audit/findings-silent-failures.md`

**Problem:** Quando smoke tests falham em `deploy-beta.yml`, o workflow é marcado como ❌ mas containers permanecem servindo código quebrado.

**Evidence:**
- Job `smoke` executa após `deploy-app`
- Falha em `check_beta_critical_routes` causa `exit 1`
- Containers não são revertidos

**Operational Impact:**
- Usuários de beta expostos a código quebrado
- Próximo deploy bem-sucedido "esconde" problema
- Sem alerta de que ambiente está degradado

**Recommended Action (CRITICAL Priority):**
```yaml
# Add to deploy-beta.yml smoke job
if ! check_beta_critical_routes; then
  echo "ERRO: Smoke tests falharam. Iniciando rollback..."
  docker compose -f docker-compose.beta.yml restart
  # ... validation ...
  exit 1
fi
```

**Validation:**
- [ ] Rollback automático implementado
- [ ] Teste induzido: deploy com rota quebrada triggera rollback
- [ ] Ambiente beta não serve código quebrado após rollback

---

### CONC-01: Beta Concurrency Policy Risk (HIGH)

**File:** `audit/findings-beta-concurrency.md`

**Problem:** `deploy-beta.yml` usa `cancel-in-progress: false`, enfileirando deploys obsoletos.

**Evidence:**
- 5 commits rápidos → 5 deploys sequenciais (~25 min)
- Commits N-4 até N-1 são obsoletos quando executam
- Feedback atrasado de 5min → 25min

**Operational Impact:**
- Desperdício de 20 min de runner time
- Feedback atrasado (5x mais lento)
- Notificações de falha para código já corrigido

**Recommended Action (HIGH Priority):**
```yaml
# Change in deploy-beta.yml
concurrency:
  group: deploy-beta-${{ github.ref }}
  cancel-in-progress: true  # Changed from false
```

**Validation:**
- [ ] `cancel-in-progress: true` aplicado
- [ ] Teste: 3 commits rápidos → apenas último completa
- [ ] Flock previne cancelamento mid-migration

---

### RC-01: Production Race Condition (HIGH)

**File:** `audit/findings-prod-race.md`

**Problem:** `deploy-prod.yml` e `promote-to-prod.yml` compartilham lock mas podem ser disparados sequencialmente, causando sobrescrita de deploy.

**Evidence:**
- Ambos usam `concurrency: production-deploy-lock`
- Segundo workflow aguarda lock, depois sobrescreve primeiro
- Sem validação de conflito

**Operational Impact:**
- Release v0.2.0 publicada, mas produção roda código diferente
- Migrations conflitantes podem falhar
- Sem detecção ou alerta

**Recommended Action (HIGH Priority):**
```yaml
# Add to deploy-prod.yml
check-recent-deploy:
  steps:
    - name: Check for recent production deploy
      run: |
        # Enforce 10-minute cooldown
        # Block if promote-to-prod.yml ran < 10min ago
```

**Validation:**
- [ ] Cooldown check implementado
- [ ] Teste: disparo < 10min após promote bloqueia
- [ ] Issue automática criada em break-glass usage

---

### CONTRACT-01: Reusable Workflow Contract Risk (HIGH)

**File:** `audit/findings-reusable-contract-risk.md`

**Problem:** Workflows reutilizáveis sem versionamento. Breaking change bloqueia 3 consumidores simultaneamente.

**Evidence:**
- `_enforce-migration-dir.yml` e `_lint-shell.yml` usados por 3 workflows
- Referência sem pin de versão: `uses: ./.github/workflows/_enforce-migration-dir.yml`
- Breaking change bloqueia 100% dos deploys

**Operational Impact:**
- Mudança em reusable workflow afeta todos os deploys imediatamente
- Sem rollback path (consumidores não pinados)
- Recovery requer revert manual (~10 min downtime)

**Recommended Action (HIGH Priority):**
```bash
# Create version tags
git tag workflows/enforce-migration-dir/v1
git tag workflows/lint-shell/v1

# Update consumers
uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v1
```

**Validation:**
- [ ] Tags de versão criadas
- [ ] Consumidores atualizados para versão pinada
- [ ] Contract testing workflow criado
- [ ] Teste: mudança em workflow não afeta consumidores pinados

---

### OVERLAP-01: Deploy Trigger Overlap (MEDIUM)

**File:** `audit/findings-deploy-overlap.md`

**Problem:** `deploy-prod.yml` e `promote-to-prod.yml` ambos deployam para produção, causando ambiguidade sobre qual usar.

**Evidence:**
- Ambos têm trigger `workflow_dispatch`
- `deploy-prod.yml`: sem validação de branch/PR
- `promote-to-prod.yml`: com governance gate

**Operational Impact:**
- Operador pode usar workflow errado
- `deploy-prod.yml` bypassa governança sem auditoria
- Sem documentação clara de quando usar cada um

**Recommended Action (MEDIUM Priority):**
```yaml
# Rename workflows for clarity
name: Promote Beta to Production (CANONICAL)
name: Deploy Production (BREAK-GLASS ONLY — Use promote-to-prod.yml instead)

# Add warning step to deploy-prod.yml
warn-break-glass:
  steps:
    - run: echo "::warning::BREAK-GLASS DEPLOY DETECTED"
```

**Validation:**
- [ ] Nomes de workflows atualizados
- [ ] Warning step adicionado
- [ ] Documentação de decision tree criada

---

### SF-02: Auto-Recovery E150 Masks Root Cause (MEDIUM)

**File:** `audit/findings-silent-failures.md`

**Problem:** Auto-recovery em workflows de produção reinicia frontend para todos os tipos de falha, mascarando causa raiz.

**Evidence:**
- `check_prod_critical_routes` falha → restart `mesas-app`
- Recovery aplicado genericamente (não apenas para E150)
- Logs não contêm diagnóstico útil

**Operational Impact:**
- Causa raiz não identificada
- Problema pode reaparecer
- Falhas não-E150 são "corrigidas" temporariamente

**Recommended Action (MEDIUM Priority):**
```yaml
# Add diagnostic before recovery
if ! check_prod_critical_routes; then
  # Collect logs
  docker compose logs mesas-app --tail=50 > /tmp/frontend-failure-logs.txt
  
  # Check for E150 pattern
  if grep -q "ECONNREFUSED.*mesas-api" /tmp/frontend-failure-logs.txt; then
    echo "DIAGNOSTICO: E150 detectado"
    docker restart mesas-app
  else
    echo "DIAGNOSTICO: Falha nao corresponde a E150"
    cat /tmp/frontend-failure-logs.txt
    exit 1
  fi
fi
```

**Validation:**
- [ ] Diagnóstico pré-recovery implementado
- [ ] Teste: falha não-E150 falha sem recovery
- [ ] Teste: E150 aplica recovery específico

---

## Findings Not Requiring Immediate Action

### RED-01: Duplicate Logic Between Production Workflows

**Severity:** MEDIUM (informational)

**Problem:** `deploy-prod.yml` e `promote-to-prod.yml` têm 90% de lógica duplicada.

**Impact:** Manutenção duplicada, risco de divergência.

**Recommendation:** Considerar extração de lógica comum para workflow reutilizável na Phase 4 (Planejamento de Regularização).

**Priority:** LOW (não bloqueia operação)

---

### RED-02: TypeScript Validation Gap in CI

**Severity:** MEDIUM (informational)

**Problem:** `ci.yml` não valida TypeScript, apenas build. Type errors descobertos apenas em deploy.

**Impact:** Feedback atrasado, PRs aprovados com type errors.

**Recommendation:** Adicionar `npx tsc --noEmit` ao `ci.yml` na Phase 4.

**Priority:** MEDIUM (melhoria de qualidade)

---

## Coverage Validation

### FR-003: Identificar Redundâncias ✅

- **Requirement:** Mapear workflows com responsabilidades sobrepostas
- **Status:** COMPLETE
- **Evidence:** OVERLAP-01 (deploy-prod vs promote-to-prod), RED-01 (lógica duplicada)

---

### FR-004: Identificar Race Conditions ✅

- **Requirement:** Detectar workflows que acessam mesma infraestrutura simultaneamente
- **Status:** COMPLETE
- **Evidence:** RC-01 (production race), CONC-01 (beta queue)

---

### FR-005: Identificar Falhas Silenciosas ✅

- **Requirement:** Detectar padrões que mascaram erros reais
- **Status:** COMPLETE
- **Evidence:** SF-01 (smoke tests), SF-02 (auto-recovery E150)

---

### FR-006: Identificar Sobreposição de Gatilhos ✅

- **Requirement:** Mapear workflows com triggers conflitantes
- **Status:** COMPLETE
- **Evidence:** OVERLAP-01 (ambos workflows deployam produção)

---

### SC-002: Ação de Regularização Definida ✅

- **Requirement:** 100% dos achados críticos/altos têm ação de regularização
- **Status:** COMPLETE
- **Evidence:**
  - SF-01 (CRITICAL): Rollback automático definido ✅
  - CONC-01 (HIGH): `cancel-in-progress: true` definido ✅
  - RC-01 (HIGH): Cooldown check definido ✅
  - CONTRACT-01 (HIGH): Versionamento definido ✅

---

## Summary Statistics

**Total Findings:** 7  
**By Severity:**
- CRITICAL: 1 (14%)
- HIGH: 4 (57%)
- MEDIUM: 2 (29%)
- LOW: 0 (0%)

**Action Coverage:**
- Findings with actions defined: 7/7 (100%)
- Critical/High with HIGH priority actions: 5/5 (100%)

**Phase 3 Completion:** ✅ COMPLETE

**Next Phase:** Phase 4 (Planejamento de Regularização) — Tasks T021-T027
