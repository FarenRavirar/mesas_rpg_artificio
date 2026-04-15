# RESUMO_EXECUCAO.md

**Última atualização:** 15/04/2026 00:32 BRT

---

## Estado Atual do Projeto

**Ambiente Beta:** `mesasbeta.artificiorpg.com` — deploy automático por `dev`  
**Ambiente Produção:** `mesas.artificiorpg.com` — workflow com gate de migration habilitado (`deploy-prod.yml`)  
**Branch ativa:** `dev`

**Status técnico mais recente (15/04/2026):**
- Deploy beta concluído com sucesso (run `24434872861`)
- `t.frequency` e `t.frequency_custom` removidos do build compilado do beta
- `GET /gm/tables` sem erro de coluna — painel do mestre funcional
- `migration_101` corrigida para ser idempotente (`IF NOT EXISTS`)
- `migration_104` classificada como `MANUAL_RISK` — pendente aplicação manual
- `deploy-beta.yml` corrigido: `--no-cache` adicionado ao `docker compose build`
- Mensagem de erro de backend indisponível atualizada para linguagem de atualização
- `VITE_API_URL` corrigido em produção (apontava para beta)

---

## Próxima Ação

1. Validar funcionalmente o painel em `https://mesasbeta.artificiorpg.com/painel` (requer login)
2. Aplicar `migration_104_drop_tables_frequency_columns.sql` no Beta via fluxo manual controlado
3. Validar endpoints e telas após schema atualizado no banco Beta
4. Promover para produção apenas após validação operacional no Beta

---

## Última Sessão

**Data:** 15/04/2026 00:32 BRT  
**Tipo:** Correções de deploy, frequency legado e incidentes de produção  
**Arquivo:** `sessoes/resumo_14-04_continuacao-migrations.md`  
**O que foi feito:**
- Diagnosticado e corrigido incidente E148: `VITE_API_URL` apontava para beta em produção
- Removidos `t.frequency` e `t.frequency_custom` da query `GET /gm/tables` (causa raiz do painel vazio)
- Corrigido `deploy-beta.yml`: `--no-cache` adicionado ao build (evita cache de camadas antigas)
- Corrigida `migration_101` para ser idempotente (`IF NOT EXISTS`)
- Atualizada mensagem de erro de backend indisponível no `App.tsx`
- Deploy beta concluído com sucesso (run `24434872861`)

**Status:** ✅ Deploy beta funcional. Pendente: migration_104 manual + validação funcional do painel.

---

## Se der incidente e você precisar abrir novo chat

Abrir o novo chat já apontando estes arquivos, nesta ordem:
1. `RESUMO_EXECUCAO.md` (estado mais recente)
2. `sessoes/resumo_14-04_continuacao-migrations.md` (linha do tempo da limpeza estrutural)
3. `PRE_DEPLOY_CHECKLIST.md` (gates obrigatórios)
4. `OPERACAO_PRODUCAO.md` (runbook de deploy e validação)
5. `scripts/deploy/apply_required_migrations.sh` (fonte canônica do gate)