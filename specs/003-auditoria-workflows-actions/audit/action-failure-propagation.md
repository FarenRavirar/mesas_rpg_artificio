# Regularization Action: Failure Propagation and Rollback

**Action ID:** ACTION-FAILURE-PROP  
**Related Finding:** SF-01 (CRITICAL), SF-02 (MEDIUM)  
**Priority:** CRITICAL  
**Status:** Planned

---

## Objective

Eliminar padrões de falha silenciosa em workflows de deploy, implementando rollback automático via snapshot de banco quando smoke tests falham e diagnóstico pré-recovery para auto-recovery E150.

---

## Target Files

1. `.github/workflows/deploy-beta.yml`
2. `.github/workflows/deploy-prod.yml`
3. `.github/workflows/promote-to-prod.yml`

---

## Planned Changes

### Change 1: Database Snapshot Before Migrations (CRITICAL)

**Applies to:** `deploy-beta.yml`, `deploy-prod.yml`, `promote-to-prod.yml`

**File:** `.github/workflows/deploy-beta.yml`

**Location:** Job `migrate`, antes de `bash ./scripts/deploy/apply_required_migrations.sh`

**Planned Addition:**
```yaml
      - name: Create database snapshot
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            set -euo pipefail
            cd /opt/mesas-beta
            
            SNAPSHOT_FILE="/tmp/beta-snapshot-$(date +%s).dump"
            echo "Criando snapshot do banco em $SNAPSHOT_FILE..."
            
            # Create snapshot with timeout (60s for beta, 120s for prod)
            timeout 60s docker exec mesas-beta-db pg_dump \
              -U admin \
              -d mesas_rpg \
              -Fc \
              -f /tmp/snapshot.dump
            
            # Copy snapshot to host
            docker cp mesas-beta-db:/tmp/snapshot.dump "$SNAPSHOT_FILE"
            
            # Store snapshot path for later use
            echo "$SNAPSHOT_FILE" > /tmp/beta-snapshot-path.txt
            
            echo "Snapshot criado com sucesso: $SNAPSHOT_FILE"
            ls -lh "$SNAPSHOT_FILE"
```

**Rationale:** Permite rollback completo (código + banco) se smoke tests falharem.

---

### Change 2: Rollback on Smoke Test Failure (CRITICAL)

**File:** `.github/workflows/deploy-beta.yml`

**Location:** Job `smoke`, substituir lógica de `check_beta_critical_routes`

**Current:**
```yaml
if ! check_beta_critical_routes; then exit 1; fi
```

**Planned:**
```yaml
if ! check_beta_critical_routes; then
  echo "ERRO: Smoke tests falharam. Iniciando rollback completo..."
  
  # Step 1: Restore database snapshot
  SNAPSHOT_FILE=$(cat /tmp/beta-snapshot-path.txt)
  
  if [ -f "$SNAPSHOT_FILE" ]; then
    echo "Restaurando snapshot do banco: $SNAPSHOT_FILE"
    
    # Copy snapshot back to container
    docker cp "$SNAPSHOT_FILE" mesas-beta-db:/tmp/snapshot.dump
    
    # Restore with timeout (90s for beta, 180s for prod)
    timeout 90s docker exec mesas-beta-db bash -c "
      pg_restore \
        -U admin \
        -d mesas_rpg \
        --clean \
        --if-exists \
        /tmp/snapshot.dump
    "
    
    echo "Snapshot restaurado com sucesso"
  else
    echo "AVISO: Snapshot não encontrado. Rollback de banco não possível."
  fi
  
  # Step 2: Restart containers (restore code)
  echo "Reiniciando containers para restaurar código anterior..."
  docker compose -f docker-compose.beta.yml restart
  
  # Step 3: Wait for health
  sleep 10
  
  # Step 4: Re-validate
  if ! check_beta_critical_routes; then
    echo "ERRO CRÍTICO: Rollback falhou. Intervenção manual necessária."
    echo "Estado do banco: restaurado via snapshot"
    echo "Estado dos containers: reiniciados"
    docker compose -f docker-compose.beta.yml ps
    docker compose -f docker-compose.beta.yml logs --tail=100
    exit 1
  fi
  
  echo "Rollback completo concluído com sucesso."
  echo "Ambiente beta restaurado ao estado anterior."
  
  # Cleanup snapshot
  rm -f "$SNAPSHOT_FILE"
  
  # Still fail workflow to alert team
  exit 1
fi

# Cleanup snapshot on success
SNAPSHOT_FILE=$(cat /tmp/beta-snapshot-path.txt)
rm -f "$SNAPSHOT_FILE"
echo "Deploy bem-sucedido. Snapshot removido."
```

**Rationale:**
- Restaura banco ao estado anterior (via snapshot)
- Restaura código ao estado anterior (via restart)
- Re-valida ambiente após rollback
- Falha workflow para alertar equipe (mesmo após rollback bem-sucedido)

---

### Change 3: Diagnostic Before Auto-Recovery E150 (MEDIUM)

**Applies to:** `deploy-prod.yml`, `promote-to-prod.yml`

**File:** `.github/workflows/deploy-prod.yml`

**Location:** Substituir bloco de auto-recovery E150

**Current:**
```yaml
if ! check_prod_critical_routes; then
  echo "AVISO: Rotas criticas de producao falharam. Tentando auto-recuperacao E150 (restart do frontend)..."
  docker restart mesas-app
  # ...
fi
```

**Planned:**
```yaml
if ! check_prod_critical_routes; then
  echo "ERRO: Rotas criticas falharam. Coletando diagnostico..."
  
  # Collect diagnostic info
  docker compose -f docker-compose.prod.yml logs mesas-app --tail=50 > /tmp/frontend-failure-logs.txt
  docker compose -f docker-compose.prod.yml logs mesas-api --tail=50 > /tmp/api-failure-logs.txt
  docker inspect mesas-app --format '{{json .State}}' > /tmp/frontend-state.json
  
  # Check for known E150 pattern (frontend can't connect to backend)
  if grep -q "ECONNREFUSED.*mesas-api" /tmp/frontend-failure-logs.txt || \
     grep -q "connect ECONNREFUSED" /tmp/frontend-failure-logs.txt; then
    echo "DIAGNOSTICO: E150 detectado (frontend nao consegue conectar ao backend)"
    echo "Aplicando auto-recovery especifica para E150..."
    
    docker restart mesas-app
    
    # Wait for health
    FRONTEND_RETRIES=0
    until [ "$(docker inspect --format '{{.State.Health.Status}}' mesas-app 2>/dev/null || echo 'missing')" = "healthy" ]; do
      FRONTEND_RETRIES=$((FRONTEND_RETRIES+1))
      if [ $FRONTEND_RETRIES -ge 20 ]; then
        echo "ERRO: Frontend de producao nao voltou healthy apos recovery E150"
        docker inspect mesas-app --format '{{json .State.Health}}' || true
        docker compose -f docker-compose.prod.yml logs mesas-app mesas-api --tail=120
        exit 1
      fi
      sleep 3
    done
    
    sleep 5
    
    # Re-check routes
    if ! check_prod_critical_routes; then
      echo "ERRO: Rotas criticas permanecem falhando apos recovery E150"
      docker compose -f docker-compose.prod.yml ps
      docker compose -f docker-compose.prod.yml logs mesas-app mesas-api mesas-db --tail=120
      exit 1
    fi
    
    echo "Auto-recovery E150 concluida com sucesso"
  else
    echo "DIAGNOSTICO: Falha nao corresponde a E150"
    echo "Auto-recovery nao aplicavel. Logs salvos para analise:"
    echo "--- Frontend Logs ---"
    cat /tmp/frontend-failure-logs.txt
    echo "--- API Logs ---"
    cat /tmp/api-failure-logs.txt
    echo "--- Frontend State ---"
    cat /tmp/frontend-state.json
    exit 1
  fi
fi
```

**Rationale:**
- Diagnostica causa antes de aplicar recovery
- Aplica recovery apenas para E150 conhecido
- Preserva logs para outros tipos de falha
- Falha explicitamente se não for E150

---

## Rollback Plan

### If Snapshot Strategy Causes Issues

**Step 1: Remove snapshot creation**
```yaml
# Comment out or remove snapshot creation step
# - name: Create database snapshot
#   ...
```

**Step 2: Revert to simple restart rollback**
```yaml
if ! check_beta_critical_routes; then
  echo "ERRO: Smoke tests falharam. Reiniciando containers..."
  docker compose -f docker-compose.beta.yml restart
  exit 1
fi
```

**Rollback time:** ~5 minutes (edit workflow file)

---

## Validation Criteria

### SF-01 (CRITICAL) - Rollback on Smoke Test Failure

- [ ] Snapshot creation implemented in all deploy workflows
- [ ] Rollback logic implemented in smoke test job
- [ ] Test: Deploy with intentionally broken route
  - Expected: Smoke tests fail
  - Expected: Database restored via snapshot
  - Expected: Containers restarted
  - Expected: Environment serves previous working code
  - Expected: Workflow status: ❌ Failed (with rollback success message)
- [ ] Test: Deploy successful
  - Expected: Snapshot created and deleted after success
  - Expected: No disk space accumulation

### SF-02 (MEDIUM) - Diagnostic Before E150 Recovery

- [ ] Diagnostic logic implemented in prod workflows
- [ ] Test: Induce non-E150 failure (e.g., missing env var)
  - Expected: Diagnostic logs collected
  - Expected: Auto-recovery NOT applied
  - Expected: Workflow fails with diagnostic output
- [ ] Test: Induce E150 failure (frontend can't connect to API)
  - Expected: E150 pattern detected
  - Expected: Auto-recovery applied (restart frontend)
  - Expected: Routes pass after recovery

---

## Dependencies

**Must complete before:**
- None (independent action)

**Must complete after:**
- None (can be executed immediately)

**Coordination required:**
- Ensure `/tmp` has sufficient space for snapshots (~200 MB for beta, ~2 GB for prod)

---

## Estimated Impact

**Deployment time:**
- Beta: +60s (snapshot creation) + 0-90s (rollback if needed)
- Prod: +120s (snapshot creation) + 0-180s (rollback if needed)

**Disk space:**
- Beta: ~200 MB per deploy (cleaned up after success)
- Prod: ~2 GB per deploy (cleaned up after success)

**Risk reduction:**
- Eliminates exposure of broken code to users (CRITICAL)
- Prevents database inconsistency after failed deploy (CRITICAL)
- Improves diagnostic capability (MEDIUM)

---

## Approval Status

**Approved by:** User (2026-04-23)  
**Decision:** Opção C (rollback via snapshot de banco)  
**Timeout adjustments:** 60s dump / 90s restore (beta), 120s dump / 180s restore (prod)
