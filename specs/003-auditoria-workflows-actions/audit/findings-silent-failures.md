# Finding: Silent Failure Patterns

**Finding ID:** SF-01, SF-02  
**Category:** Error Handling / Silent Failures  
**Severity:** CRITICAL (SF-01), MEDIUM (SF-02)  
**Status:** Open

---

## Summary

Workflows de deploy contêm padrões que mascaram falhas reais, permitindo que deploys sejam marcados como bem-sucedidos mesmo quando etapas críticas falharam. Isso cria falso senso de estabilidade e dificulta diagnóstico de problemas.

---

## SF-01: Smoke Tests Fail But Containers Remain Up

### Evidence

**File:** `.github/workflows/deploy-beta.yml` (job: `smoke`)

```yaml
smoke:
  needs: deploy-app
  runs-on: ubuntu-latest
  steps:
    - name: Smoke Tests
      uses: appleboy/ssh-action@v1.0.0
      with:
        script: |
          # ... health checks ...
          if ! check_beta_critical_routes; then exit 1; fi
```

**Problem:** Se smoke tests falham, o workflow é marcado como ❌, mas os containers deployados permanecem no ar.

### Operational Impact

**Scenario:** Deploy de commit com bug crítico

1. `deploy-app` job completa com sucesso (containers up)
2. `smoke` job executa health checks
3. Critical route `/api/v1/tables` retorna HTTP 500
4. `smoke` job falha com `exit 1`
5. **Workflow status:** ❌ Failed
6. **Beta environment status:** Containers running (serving broken code)

**Result:**
- ✅ Workflow corretamente reporta falha
- ❌ Ambiente beta serve código quebrado para usuários
- ❌ Próximo deploy bem-sucedido "esconde" o problema

### Root Cause

**Design flaw:** Smoke tests são validação pós-deploy, não gate pré-deploy.

**Missing:** Rollback automático quando smoke tests falham.

### Recommended Action

**Priority:** CRITICAL

**File:** `.github/workflows/deploy-beta.yml`

**Change:** Adicionar rollback automático no job `smoke`

```yaml
smoke:
  needs: deploy-app
  runs-on: ubuntu-latest
  steps:
    - name: Smoke Tests
      uses: appleboy/ssh-action@v1.0.0
      with:
        script: |
          set -euo pipefail
          cd /opt/mesas-beta
          
          # ... existing health checks ...
          
          if ! check_beta_critical_routes; then
            echo "ERRO: Smoke tests falharam. Iniciando rollback..."
            
            # Rollback: restart containers to previous state
            docker compose -f docker-compose.beta.yml restart
            
            # Wait for health
            sleep 10
            
            # Re-check routes
            if ! check_beta_critical_routes; then
              echo "ERRO CRÍTICO: Rollback falhou. Intervenção manual necessária."
              exit 1
            fi
            
            echo "Rollback concluído. Ambiente beta restaurado."
            exit 1  # Still fail workflow to alert team
          fi
```

**Rationale:**
- Tenta restaurar estado anterior via restart
- Ainda falha workflow para alertar equipe
- Reduz janela de exposição de código quebrado

**Risk:** Rollback via restart pode não ser suficiente se problema for de migration. Alternativa: manter snapshot de imagem anterior.

---

## SF-02: Auto-Recovery E150 Masks Root Cause

### Evidence

**File:** `.github/workflows/deploy-prod.yml` (job: `deploy-production`)

```yaml
if ! check_prod_critical_routes; then
  echo "AVISO: Rotas criticas de producao falharam. Tentando auto-recuperacao E150 (restart do frontend)..."
  docker restart mesas-app
  
  # ... wait for health ...
  
  if ! check_prod_critical_routes; then
    echo "ERRO: Rotas criticas de producao permanecem falhando apos recuperacao E150"
    exit 1
  fi
fi
```

**Problem:** Restart do frontend "corrige" sintoma sem diagnosticar causa raiz.

### Operational Impact

**Scenario:** Deploy com problema de configuração

1. Deploy completa, containers up
2. Critical routes falham (ex: variável de ambiente faltando)
3. Auto-recovery reinicia frontend
4. Routes passam (problema temporariamente mascarado)
5. **Workflow status:** ✅ Success
6. **Production status:** Instável (problema pode reaparecer)

**Result:**
- ❌ Causa raiz não identificada
- ❌ Problema pode reaparecer em próximo restart
- ❌ Logs não contêm diagnóstico útil

### Root Cause

**Design decision:** Auto-recovery foi adicionado para resolver E150 (erro específico de timing de inicialização do frontend).

**Problem:** Solução específica foi generalizada para todos os casos de falha de rota.

### Recommended Action

**Priority:** MEDIUM

**File:** `.github/workflows/deploy-prod.yml`

**Change:** Adicionar diagnóstico antes de auto-recovery

```yaml
if ! check_prod_critical_routes; then
  echo "ERRO: Rotas criticas falharam. Coletando diagnostico..."
  
  # Collect diagnostic info
  docker compose -f docker-compose.prod.yml logs mesas-app --tail=50 > /tmp/frontend-failure-logs.txt
  docker compose -f docker-compose.prod.yml logs mesas-api --tail=50 > /tmp/api-failure-logs.txt
  docker inspect mesas-app --format '{{json .State}}' > /tmp/frontend-state.json
  
  # Check for known E150 pattern
  if grep -q "ECONNREFUSED.*mesas-api" /tmp/frontend-failure-logs.txt; then
    echo "DIAGNOSTICO: E150 detectado (frontend nao consegue conectar ao backend)"
    echo "Aplicando auto-recovery especifica para E150..."
    docker restart mesas-app
  else
    echo "DIAGNOSTICO: Falha nao corresponde a E150"
    echo "Auto-recovery nao aplicavel. Logs salvos em /tmp/*-logs.txt"
    cat /tmp/frontend-failure-logs.txt
    cat /tmp/api-failure-logs.txt
    exit 1
  fi
  
  # ... rest of recovery logic ...
fi
```

**Rationale:**
- Diagnostica causa antes de aplicar recovery
- Aplica recovery apenas para E150 conhecido
- Preserva logs para outros tipos de falha
- Falha explicitamente se não for E150

---

## Additional Silent Failure Patterns

### Pattern 1: `|| true` in Critical Steps

**Not found in current workflows** ✅

Audit confirmed no usage of `|| true` in critical validation steps.

### Pattern 2: `continue-on-error: true`

**Not found in current workflows** ✅

Audit confirmed no usage of `continue-on-error` in critical jobs.

---

## Severity Justification

**SF-01: CRITICAL** porque:
- ✅ Permite código quebrado em produção/beta
- ✅ Usuários afetados diretamente
- ✅ Falso senso de estabilidade (workflow failed, mas ambiente serving)
- ✅ Dificulta diagnóstico (próximo deploy "esconde" problema)

**SF-02: MEDIUM** porque:
- ✅ Mascara causa raiz de falhas
- ✅ Problema pode reaparecer
- ❌ Não causa exposição imediata de código quebrado
- ❌ Recovery funciona na maioria dos casos

---

## Validation Criteria

**SF-01:**
- [ ] Rollback automático implementado em `deploy-beta.yml`
- [ ] Teste induzido: deploy com rota quebrada deve triggerar rollback
- [ ] Verificar que ambiente beta não serve código quebrado após rollback

**SF-02:**
- [ ] Diagnóstico pré-recovery implementado em `deploy-prod.yml` e `promote-to-prod.yml`
- [ ] Teste induzido: falha não-E150 deve falhar sem recovery
- [ ] Teste induzido: E150 deve aplicar recovery específico

---

## Related Findings

- **CONC-01:** Deploys obsoletos agravam SF-01 (múltiplos deploys quebrados enfileirados)
