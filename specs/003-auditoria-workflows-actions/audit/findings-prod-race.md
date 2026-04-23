# Finding: Production Race Condition

**Finding ID:** RC-01  
**Category:** Race Condition / Concurrency  
**Severity:** HIGH  
**Status:** Open

---

## Summary

`deploy-prod.yml` e `promote-to-prod.yml` compartilham o mesmo concurrency lock (`production-deploy-lock`) mas podem ser disparados simultaneamente, criando risco de corrida operacional ao acessar a mesma infraestrutura (`/opt/mesas`) e potencial corrupção de estado durante deploy.

---

## Evidence

### Shared Concurrency Lock

**File:** `.github/workflows/deploy-prod.yml`
```yaml
concurrency:
  group: production-deploy-lock
  cancel-in-progress: false
```

**File:** `.github/workflows/promote-to-prod.yml`
```yaml
concurrency:
  group: production-deploy-lock
  cancel-in-progress: false
```

### Simultaneous Trigger Scenario

**Trigger conditions:**
- `deploy-prod.yml`: Manual (`workflow_dispatch`), sem inputs
- `promote-to-prod.yml`: Manual (`workflow_dispatch`), requer input `version`

**Race scenario:**
1. Operador A dispara `promote-to-prod.yml` (versão v0.2.0)
2. Operador B dispara `deploy-prod.yml` (break-glass) 2 segundos depois
3. GitHub Actions enfileira ambos workflows
4. `promote-to-prod.yml` inicia primeiro (adquire lock)
5. `deploy-prod.yml` aguarda lock (enfileirado)
6. `promote-to-prod.yml` completa deploy de v0.2.0
7. `deploy-prod.yml` inicia e sobrescreve com código de branch diferente

**Result:**
- ✅ Concurrency lock previne execução simultânea
- ❌ Segundo deploy sobrescreve primeiro sem validação
- ❌ Versão final em produção pode não corresponder à release publicada
- ❌ Sem detecção de conflito ou alerta

---

## Operational Impact

### State Corruption Risk

**Scenario:** Promote v0.2.0 seguido de break-glass deploy

**Timeline:**
```
10:00:00 - promote-to-prod.yml inicia (v0.2.0 from main)
10:00:30 - git reset --hard origin/main (commit ABC123)
10:01:00 - migrations aplicadas (migration_047)
10:02:00 - containers rebuilt
10:03:00 - deploy completo, release v0.2.0 publicada
10:03:10 - deploy-prod.yml inicia (break-glass from hotfix branch)
10:03:40 - git reset --hard origin/main (commit XYZ789 - diferente!)
10:04:10 - migrations aplicadas (pode falhar se migration_047 não existe em hotfix)
10:05:00 - containers rebuilt (código diferente de v0.2.0)
10:06:00 - deploy completo
```

**Result:**
- Release v0.2.0 publicada no GitHub
- Produção rodando código de hotfix branch (não versionado)
- **Divergência:** Release notes não correspondem ao código em produção

### Detection Gap

**Current monitoring:** Nenhum

**Missing:**
- Alerta quando `deploy-prod.yml` é disparado
- Validação de que código deployado corresponde à última release
- Log de qual workflow deployou qual versão

---

## Root Cause

### Design Decision

**Rationale original:**
- `deploy-prod.yml`: Break-glass para emergências
- `promote-to-prod.yml`: Caminho canônico com governança
- Concurrency lock compartilhado para prevenir execução simultânea

**Problem:** Lock previne execução simultânea mas não previne execução sequencial conflitante.

### Missing Safeguards

1. **No mutual exclusion period:** Segundo workflow pode iniciar imediatamente após primeiro
2. **No state validation:** Segundo workflow não verifica se deploy recente ocorreu
3. **No conflict detection:** Sem comparação de commit SHA entre workflows

---

## Recommended Actions

### Action 1: Adicionar cooldown period (Priority: HIGH)

**File:** `.github/workflows/deploy-prod.yml`

**Add job (before `deploy-production`):**
```yaml
  check-recent-deploy:
    runs-on: ubuntu-latest
    steps:
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
```

**Rationale:**
- Previne disparo acidental logo após deploy canônico
- Força operador a confirmar emergência real
- 10 minutos é tempo suficiente para validar deploy anterior

---

### Action 2: Adicionar validação de commit SHA (Priority: MEDIUM)

**File:** `.github/workflows/deploy-prod.yml`

**Add step (in `deploy-production` job, before SSH):**
```yaml
- name: Validate deployment target
  run: |
    set -euo pipefail
    
    # Get current commit in production
    PROD_COMMIT=$(ssh -F ~/.ssh/config faren "cd /opt/mesas && git rev-parse HEAD")
    
    # Get target commit
    TARGET_COMMIT=$(git rev-parse origin/main)
    
    echo "Commit atual em produção: $PROD_COMMIT"
    echo "Commit alvo deste deploy: $TARGET_COMMIT"
    
    if [ "$PROD_COMMIT" = "$TARGET_COMMIT" ]; then
      echo "::warning::Produção já está no commit alvo"
      echo "::warning::Este deploy é redundante"
      echo "Prosseguindo mesmo assim (break-glass)..."
    fi
```

**Rationale:**
- Alerta se deploy é redundante
- Não bloqueia (break-glass deve permitir redeploy)
- Fornece visibilidade no log

---

### Action 3: Adicionar alerta de uso de break-glass (Priority: HIGH)

**File:** `.github/workflows/deploy-prod.yml`

**Add step (first in `deploy-production` job):**
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

**Rationale:**
- Cria auditoria automática de uso de break-glass
- Força documentação retroativa
- Permite rastreamento de frequência de uso

---

## Alternative Considered: Separate Concurrency Groups

**Approach:** Usar concurrency groups diferentes para cada workflow

```yaml
# deploy-prod.yml
concurrency:
  group: production-deploy-break-glass
  
# promote-to-prod.yml
concurrency:
  group: production-deploy-canonical
```

**Rejected because:**
- Permite execução simultânea (pior que problema atual)
- Risco de corrupção de estado aumenta
- Lock compartilhado é correto, problema é falta de validação

---

## Severity Justification

**HIGH** porque:
- ✅ Risco de divergência entre release e código em produção
- ✅ Potencial corrupção de estado (migrations conflitantes)
- ✅ Sem detecção ou alerta automático
- ❌ Requer erro humano (disparo duplo)
- ❌ Concurrency lock mitiga execução simultânea

**Not CRITICAL because:** Lock previne corrupção de estado durante execução simultânea.

---

## Validation Criteria

- [ ] Cooldown check implementado em `deploy-prod.yml`
- [ ] Commit SHA validation implementada
- [ ] Issue automática criada em teste de break-glass
- [ ] Teste: disparo de `deploy-prod.yml` < 10min após `promote-to-prod.yml` deve bloquear
- [ ] Teste: disparo de `deploy-prod.yml` > 10min após `promote-to-prod.yml` deve alertar mas permitir

---

## Related Findings

- **OVERLAP-01:** Ambiguidade sobre qual workflow usar
- **RED-01:** Lógica duplicada entre workflows
