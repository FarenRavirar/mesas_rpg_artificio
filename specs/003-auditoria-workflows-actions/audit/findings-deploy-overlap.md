# Finding: Deploy Trigger Overlap

**Finding ID:** OVERLAP-01  
**Category:** Redundancy / Trigger Overlap  
**Severity:** MEDIUM  
**Status:** Open

---

## Summary

Workflows `deploy-prod.yml` e `promote-to-prod.yml` compartilham responsabilidade de deploy para produção com gatilhos manuais (`workflow_dispatch`), criando ambiguidade operacional sobre qual workflow usar em cada cenário.

---

## Evidence

### Trigger Analysis

**`deploy-prod.yml`:**
```yaml
on:
  workflow_dispatch:
```
- **Trigger:** Manual, sem inputs
- **Branch validation:** Nenhuma (pode ser disparado de qualquer branch)
- **Governance gate:** Ausente

**`promote-to-prod.yml`:**
```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Versao da release (ex: v0.1.1)'
        required: true
        type: string
```
- **Trigger:** Manual, requer input `version`
- **Branch validation:** Presente (valida que `dev` não está à frente de `main`)
- **Governance gate:** Presente (job `governance_gate`)

### Concurrency Lock Overlap

Ambos workflows compartilham o mesmo concurrency group:

```yaml
concurrency:
  group: production-deploy-lock
  cancel-in-progress: false
```

**Implicação:** Se ambos forem disparados simultaneamente, executam sequencialmente (não há proteção contra disparo duplo).

---

## Operational Impact

### Current State

**Scenario 1:** Operador dispara `deploy-prod.yml` por engano
- ❌ Sem validação de branch
- ❌ Sem validação de PR aprovado
- ❌ Sem versionamento de release
- ✅ Deploy executado (bypass de governança)

**Scenario 2:** Operador dispara `promote-to-prod.yml` corretamente
- ✅ Validação de branch
- ✅ Validação de PR aprovado
- ✅ Versionamento de release
- ✅ Deploy executado com governança

**Scenario 3:** Ambos disparados em sequência rápida
- ⚠️ Segundo workflow aguarda lock
- ⚠️ Segundo deploy sobrescreve primeiro (sem detecção de conflito)

### Manifestation Frequency

- **Observed:** Não há evidência de disparo duplo nos logs recentes
- **Risk:** MEDIUM (depende de erro humano)
- **Detection:** Ausente (sem alerta de disparo de `deploy-prod.yml`)

---

## Root Cause

1. **Falta de documentação clara:** Não há comentário inline ou README indicando quando usar cada workflow
2. **Ausência de deprecation:** `deploy-prod.yml` não está marcado como "break-glass only"
3. **Trigger idêntico:** Ambos aparecem na UI do GitHub Actions sem distinção clara

---

## Recommended Actions

### Action 1: Documentar uso canônico (Priority: HIGH)

**File:** `.github/workflows/promote-to-prod.yml`

**Change:**
```yaml
name: Promote Beta to Production (CANONICAL)
```

**File:** `.github/workflows/deploy-prod.yml`

**Change:**
```yaml
name: Deploy Production (BREAK-GLASS ONLY — Use promote-to-prod.yml instead)
```

**Rationale:** Torna explícito na UI qual workflow usar.

---

### Action 2: Adicionar validação de uso em `deploy-prod.yml` (Priority: MEDIUM)

**File:** `.github/workflows/deploy-prod.yml`

**Add job (before `deploy-production`):**
```yaml
  warn-break-glass:
    runs-on: ubuntu-latest
    steps:
      - name: Warn about break-glass usage
        run: |
          echo "::warning::BREAK-GLASS DEPLOY DETECTED"
          echo "::warning::Este workflow bypassa governança de PR."
          echo "::warning::Workflow canônico: promote-to-prod.yml"
          echo "::warning::Use este workflow apenas em emergências."
```

**Rationale:** Alerta visível no log sem bloquear emergências.

---

### Action 3: Criar documentação operacional (Priority: LOW)

**File:** `docs/workflows/DEPLOY_DECISION_TREE.md` (novo)

**Content:**
```markdown
# Deploy Decision Tree

## Produção

### Cenário Normal (PR aprovado)
✅ Use: `promote-to-prod.yml`
- Requer: PR dev→main aprovado e merged
- Requer: Input de versão (ex: v0.1.1)
- Executa: Governance gate + deploy + release

### Cenário de Emergência (hotfix crítico)
⚠️ Use: `deploy-prod.yml`
- Requer: Aprovação verbal do mantenedor
- Bypassa: Governance gate
- Executa: Deploy direto (sem release)
```

**Rationale:** Referência clara para operadores.

---

## Severity Justification

**MEDIUM** porque:
- ✅ Não causa falha automática (depende de erro humano)
- ✅ Concurrency lock previne corrupção de estado
- ❌ Permite bypass de governança sem auditoria
- ❌ Ambiguidade pode causar deploy não-versionado

**Upgrade to HIGH if:** Evidência de uso incorreto de `deploy-prod.yml` em logs.

---

## Related Findings

- **RC-01:** Race condition entre workflows de produção (concurrency lock compartilhado)
- **RED-01:** Lógica duplicada entre `deploy-prod.yml` e `promote-to-prod.yml`

---

## Validation Criteria

- [ ] Comentários inline adicionados aos workflows
- [ ] Warning step adicionado a `deploy-prod.yml`
- [ ] Documentação de decision tree criada
- [ ] Nenhum disparo de `deploy-prod.yml` nos últimos 30 dias (auditoria de logs)
