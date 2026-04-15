# RESUMO_EXECUCAO.md

**Última atualização:** 14/04/2026 21:10 BRT

---

## Estado Atual do Projeto

**Ambiente Beta:** `mesasbeta.artificiorpg.com` — deploy automático por `dev`  
**Ambiente Produção:** `mesas.artificiorpg.com` — workflow com gate de migration habilitado (`deploy-prod.yml`)  
**Branch ativa:** `dev`

**Status técnico mais recente (migrations e conformidade de deploy):**
- Gate de migrations automático habilitado nos workflows:
  - `.github/workflows/deploy-beta.yml`
  - `.github/workflows/deploy-prod.yml`
  - `.github/workflows/promote-to-prod.yml`
- Script canônico de migration de deploy: `scripts/deploy/apply_required_migrations.sh`
- Controles aplicados no script:
  - registro de execução em `schema_migrations`
  - classes `ONLINE_SAFE_MIGRATIONS` e `MANUAL_RISK_MIGRATIONS`
  - limite de pendências automáticas (`MAX_AUTO_PENDING`)
  - proteção de lock/tempo (`LOCK_TIMEOUT` e `STATEMENT_TIMEOUT`)
  - exigência de backup para migration de risco em produção (quando habilitada)
  - validação final de schema mínimo (`system_suggestions.name_pt` e `scenario_suggestions`)

**Contexto de schema validado em auditoria:**
- Beta: `system_suggestions.name_pt` e `scenario_suggestions` presentes
- Produção (antes da nova gate): ausência de `system_suggestions.name_pt` e `scenario_suggestions`

---

## Próxima Ação

1. Executar um run real de `deploy-beta.yml` para validar evidência de log do gate:
   - `[migrations] schema em conformidade para runtime.`
2. Executar promoção controlada para validar `deploy-prod.yml`/`promote-to-prod.yml` com a mesma evidência
3. Confirmar pós-run em produção que `system_suggestions.name_pt` e `scenario_suggestions` ficaram presentes

---

## Última Sessão

**Data:** 14/04/2026 21:10 BRT  
**Tipo:** Conformidade de deploy + hardening de migrations  
**O que foi feito:** 
- Correção dos workflows para executar gate de migrations em beta/prod/promote
- Criação e hardening do `apply_required_migrations.sh` com classes, timeouts e bloqueios
- Atualização das documentações operacionais de deploy e checklist

**Status:** 🔄 Em validação operacional (faltam runs reais dos workflows)
**Arquivo:** `sessoes/resumo_14-04_continuacao-migrations.md`

---

## Se der incidente e você precisar abrir novo chat

Abrir o novo chat já apontando estes arquivos, nesta ordem:
1. `RESUMO_EXECUCAO.md` (estado mais recente)
2. `sessoes/resumo_14-04_continuacao-migrations.md` (linha do tempo detalhada)
3. `PRE_DEPLOY_CHECKLIST.md` (gates obrigatórios)
4. `OPERACAO_PRODUCAO.md` (runbook de deploy e validação)
5. `scripts/deploy/apply_required_migrations.sh` (fonte canônica do gate)