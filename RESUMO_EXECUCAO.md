# RESUMO_EXECUCAO.md

**Última atualização:** 14/04/2026 23:09 BRT

---

## Estado Atual do Projeto

**Ambiente Beta:** `mesasbeta.artificiorpg.com` — deploy automático por `dev`  
**Ambiente Produção:** `mesas.artificiorpg.com` — workflow com gate de migration habilitado (`deploy-prod.yml`)  
**Branch ativa:** `dev`

**Status técnico mais recente (frequência por sessão + schema):**
- Consolidação da frequência em `table_schedules.frequency` (fonte única no runtime)
- Remoção do fluxo de frequência global (`tables.frequency` / `tables.frequency_custom`) no create/edit/listagem/detalhe
- Migration estrutural criada: `database/migration_104_drop_tables_frequency_columns.sql`
- Gate de migrations atualizado para classificar a migration 104 como `MANUAL_RISK_MIGRATIONS`
- Tipo de banco alinhado: `backend/src/db/types.ts` sem `frequency` e `frequency_custom` em `TablesTable`

---

## Próxima Ação

1. Aplicar `migration_104_drop_tables_frequency_columns.sql` no Beta via fluxo manual controlado (com checklist de backup aplicável)
2. Validar endpoints e telas após schema atualizado no banco Beta
3. Promover para produção apenas após validação operacional no Beta

---

## Última Sessão

**Data:** 14/04/2026 23:09 BRT  
**Tipo:** Limpeza estrutural de frequência global da mesa  
**O que foi feito:** 
- Criação da migration de remoção das colunas legadas (`migration_104_drop_tables_frequency_columns.sql`)
- Classificação da migration 104 como manual/risk no gate de deploy
- Alinhamento do tipo de banco (`backend/src/db/types.ts`) removendo campos legados
- Validação de tipagem backend/frontend sem erro

**Status:** ✅ Implementação concluída (pendente execução operacional da migration 104 no ambiente)
**Arquivo:** `sessoes/resumo_14-04_continuacao-migrations.md`

---

## Se der incidente e você precisar abrir novo chat

Abrir o novo chat já apontando estes arquivos, nesta ordem:
1. `RESUMO_EXECUCAO.md` (estado mais recente)
2. `sessoes/resumo_14-04_continuacao-migrations.md` (linha do tempo da limpeza estrutural)
3. `PRE_DEPLOY_CHECKLIST.md` (gates obrigatórios)
4. `OPERACAO_PRODUCAO.md` (runbook de deploy e validação)
5. `scripts/deploy/apply_required_migrations.sh` (fonte canônica do gate)