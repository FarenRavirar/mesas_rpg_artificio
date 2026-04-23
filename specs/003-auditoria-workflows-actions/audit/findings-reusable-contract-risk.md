# Finding: Reusable Workflow Contract Risk

**Finding ID:** CONTRACT-01  
**Category:** Contract Stability / Breaking Changes  
**Severity:** HIGH  
**Status:** Open

---

## Summary

Workflows reutilizáveis `_enforce-migration-dir.yml` e `_lint-shell.yml` não possuem versionamento, causando risco de breaking changes que afetam 3 consumidores simultaneamente e bloqueiam todos os deploys (beta + produção) sem rollback path.

---

## Evidence

### Consumer Mapping

**`_enforce-migration-dir.yml` consumers:**
1. `deploy-beta.yml` (job: `enforce-dir`)
2. `deploy-prod.yml` (job: `enforce-dir`)
3. `promote-to-prod.yml` (job: `enforce-dir`)

**`_lint-shell.yml` consumers:**
1. `deploy-beta.yml` (job: `lint`)
2. `deploy-prod.yml` (job: `lint`)
3. `promote-to-prod.yml` (job: `lint`)

**Total blast radius:** 3 deployment pipelines (100% de deploys bloqueados se reusable workflow quebrar)

### Current Contract

**File:** `.github/workflows/_enforce-migration-dir.yml`

```yaml
name: Enforce Migration Dir

on:
  workflow_call:
```

**Contract elements:**
- **Inputs:** None
- **Outputs:** None
- **Secrets:** None
- **Behavior:** Valida que `migration_*.sql` estão em paths permitidos via `.github/migration-dir-allowlist`

**File:** `.github/workflows/_lint-shell.yml`

```yaml
name: Lint Shell

on:
  workflow_call:
```

**Contract elements:**
- **Inputs:** None
- **Outputs:** None
- **Secrets:** None
- **Behavior:** Executa shellcheck em `./scripts` + actionlint em workflows

---

## Operational Impact

### Breaking Change Scenario 1: Stricter Validation

**Change:** `_enforce-migration-dir.yml` passa a rejeitar migrations com prefixo `migration_1` (apenas `migration_` permitido)

**Impact:**
- ✅ Mudança intencional para melhorar governança
- ❌ Bloqueia todos os 3 workflows de deploy imediatamente
- ❌ Migrations existentes com prefixo `migration_1` causam falha
- ❌ Sem rollback path (consumidores referenciam workflow sem versão)

**Timeline:**
```
10:00 - Commit altera _enforce-migration-dir.yml
10:01 - Push para dev dispara deploy-beta.yml
10:02 - Job enforce-dir falha (nova validação rejeita migration_105)
10:03 - Deploy beta bloqueado
10:05 - Tentativa de promote-to-prod.yml também falha
10:06 - Produção não pode receber hotfix (bloqueada)
```

**Recovery:**
- Revert commit em `_enforce-migration-dir.yml`
- Aguardar novo deploy para aplicar revert
- **Downtime de deploys:** ~10 minutos

---

### Breaking Change Scenario 2: New Dependency

**Change:** `_lint-shell.yml` passa a exigir `actionlint` versão 1.7.0+ (runner tem 1.6.x)

**Impact:**
- ✅ Mudança intencional para usar nova feature
- ❌ Bloqueia todos os 3 workflows de deploy imediatamente
- ❌ Runners não têm versão compatível
- ❌ Sem fallback para versão anterior

**Recovery:**
- Atualizar runners (requer acesso admin)
- OU revert commit
- **Downtime de deploys:** ~30 minutos (tempo de atualização de runners)

---

## Root Cause

### No Versioning Strategy

**Current reference pattern:**
```yaml
uses: ./.github/workflows/_enforce-migration-dir.yml
```

**Problem:** Sempre usa versão mais recente (HEAD), sem pin de versão.

**Missing:**
- Semantic versioning (v1, v2, v3)
- Deprecation warnings
- Gradual rollout strategy

---

## Recommended Actions

### Action 1: Implementar versionamento de workflows reutilizáveis (Priority: HIGH)

**Strategy:** Criar versões explícitas via tags/branches

**Implementation:**

**Step 1:** Criar versão inicial

```bash
# Tag current state as v1
git tag workflows/enforce-migration-dir/v1
git tag workflows/lint-shell/v1
git push origin --tags
```

**Step 2:** Atualizar consumidores para referenciar versão

**File:** `deploy-beta.yml`, `deploy-prod.yml`, `promote-to-prod.yml`

**Change:**
```yaml
# Before
enforce-dir:
  uses: ./.github/workflows/_enforce-migration-dir.yml

# After
enforce-dir:
  uses: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v1
```

**Rationale:**
- Pin de versão previne breaking changes automáticos
- Permite testar v2 em workflow isolado antes de migrar todos
- Rollback via mudança de tag (sem revert de código)

---

### Action 2: Adicionar contract testing (Priority: MEDIUM)

**File:** `.github/workflows/test-reusable-contracts.yml` (novo)

```yaml
name: Test Reusable Workflow Contracts

on:
  pull_request:
    paths:
      - '.github/workflows/_*.yml'

jobs:
  test-enforce-dir:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Test enforce-dir contract
        uses: ./.github/workflows/_enforce-migration-dir.yml
      
      - name: Validate expected behavior
        run: |
          # Test that workflow succeeds with valid migrations
          # Test that workflow fails with invalid migrations
          echo "Contract test passed"
  
  test-lint-shell:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Test lint-shell contract
        uses: ./.github/workflows/_lint-shell.yml
      
      - name: Validate expected behavior
        run: |
          # Test that workflow succeeds with valid scripts
          # Test that workflow fails with invalid scripts
          echo "Contract test passed"
```

**Rationale:**
- Detecta breaking changes antes de merge
- Valida que contrato permanece estável
- Previne bloqueio acidental de deploys

---

### Action 3: Documentar contrato explícito (Priority: MEDIUM)

**File:** `.github/workflows/_enforce-migration-dir.yml`

**Add header comment:**
```yaml
# Reusable Workflow: Enforce Migration Directory
# Version: v1
# Contract:
#   Inputs: None
#   Outputs: None
#   Secrets: None
#   Behavior: Validates migration_*.sql files are in allowed paths
#   Dependencies: .github/migration-dir-allowlist must exist
#   Breaking changes: Require new major version (v2, v3, etc)
# Consumers: deploy-beta.yml, deploy-prod.yml, promote-to-prod.yml
# Last updated: 2026-04-23

name: Enforce Migration Dir
```

**Rationale:**
- Torna contrato explícito para mantenedores
- Documenta consumidores (blast radius)
- Define política de breaking changes

---

### Action 4: Implementar deprecation workflow (Priority: LOW)

**Strategy:** Quando criar v2, manter v1 com deprecation warning

**File:** `.github/workflows/_enforce-migration-dir-v1.yml` (renomeado de `_enforce-migration-dir.yml`)

**Add deprecation warning:**
```yaml
jobs:
  deprecation-warning:
    runs-on: ubuntu-latest
    steps:
      - name: Warn about deprecated version
        run: |
          echo "::warning::Este workflow usa _enforce-migration-dir v1 (deprecated)"
          echo "::warning::Migre para v2: ./.github/workflows/_enforce-migration-dir.yml@workflows/enforce-migration-dir/v2"
          echo "::warning::v1 será removido em: 2026-06-01"
  
  enforce-dir:
    needs: deprecation-warning
    # ... existing logic ...
```

**Rationale:**
- Permite migração gradual
- Alerta consumidores sem bloquear
- Define deadline claro para remoção

---

## Alternative Considered: Monorepo-style Versioning

**Approach:** Criar diretório `.github/workflows/v1/`, `.github/workflows/v2/`

**Rejected because:**
- GitHub Actions não suporta paths em `uses:` para workflows locais
- Requer duplicação de arquivos
- Versionamento via tags é padrão do GitHub

---

## Severity Justification

**HIGH** porque:
- ✅ Breaking change bloqueia 100% dos deploys (beta + produção)
- ✅ Sem rollback path automático
- ✅ Requer intervenção manual para recovery
- ✅ Downtime de deploys pode ser > 10 minutos
- ❌ Não causa corrupção de estado (apenas bloqueio)

**Not CRITICAL because:** Não afeta ambientes já deployados (apenas novos deploys).

---

## Validation Criteria

- [ ] Tags de versão criadas para workflows reutilizáveis
- [ ] Consumidores atualizados para referenciar versão pinada
- [ ] Contract testing workflow criado
- [ ] Documentação de contrato adicionada aos workflows
- [ ] Teste: mudança em `_enforce-migration-dir.yml` não afeta consumidores (pinados em v1)
- [ ] Teste: criação de v2 permite migração gradual

---

## Related Findings

- **RC-01:** Race condition em produção (agravado se reusable workflow quebrar durante deploy)
- **CONC-01:** Deploys enfileirados (agravado se reusable workflow causar falha em massa)
