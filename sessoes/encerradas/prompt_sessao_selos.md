# Prompt para Iniciar Sessão de Correção de Selos DDAL e Covil do Lich

## Contexto do Projeto

Você está trabalhando no projeto **Mesas RPG Artifício** — um portal colaborativo para anúncios de mesas de RPG. O projeto está em produção em `mesas.artificiorpg.com` (prod) e `mesasbeta.artificiorpg.com` (beta).

**Stack:**
- Backend: Node.js + TypeScript + Express + PostgreSQL + Kysely
- Frontend: React + TypeScript + Vite
- Deploy: Docker Compose em VM Oracle Cloud
- Autenticação: Google OAuth (único método)

## Problema Reportado

Os selos **DDAL (D&D Adventurers League)** e **Covil do Lich** não estão aparecendo corretamente:
- **Onde devem aparecer:** Página de detalhe da mesa + cards de mesa (catálogo/dashboard)
- **Comportamento esperado:** Selos devem ser visíveis quando aplicáveis às mesas
- **Comportamento atual:** Não aparecem ou aparecem incorretamente

## Sessão Ativa

**Arquivo:** `sessoes/26-04-22_4_investigacao-selos-ddal-covil.md`

A sessão já foi criada com plano estruturado em 5 fases:
1. Diagnóstico de dados (schema + queries)
2. Diagnóstico de backend (rotas + payloads)
3. Diagnóstico de frontend (componentes + estilos)
4. Diagnóstico de regras de design (docs + migrations)
5. Relatório e proposta de correção

## Arquivos-Chave para Investigação

### Backend
- `backend/src/routes/tables.ts` — Rota pública de listagem/detalhe
- `backend/src/routes/gm.ts` — Rota pública do perfil do mestre
- `backend/src/routes/gmPanel.ts` — Rota privada do painel do mestre
- `backend/src/types/*.ts` — Tipos TypeScript

### Frontend
- `frontend/src/components/TableCard.tsx` — Cards no catálogo
- `frontend/src/components/TableCardDashboard.tsx` — Cards no painel
- `frontend/src/features/table/components/TableHero.tsx` — Hero da página de detalhe
- `frontend/src/pages/TableDetailPage.tsx` — Página de detalhe completa

### Documentação
- `.specify/arquiteture.md` — §12 (Modelo de Dados), §4 (Schema)
- `database/migration_*.sql` — Buscar por "seal", "badge", "ddal", "covil"
- `MAPA_DE_API.md` — Contratos de API

### Banco de Dados
- Tabela: `tables`
- Possíveis colunas: `seals`, `badges`, `is_ddal`, `is_covil_do_lich`, ou similar
- Verificar via SSH: `ssh -F C:\projetos\config faren`
- Query exemplo: `docker exec mesas-beta-db psql -U admin -d mesas_rpg -c "SELECT column_name FROM information_schema.columns WHERE table_name='tables' AND column_name LIKE '%seal%' OR column_name LIKE '%badge%' OR column_name LIKE '%ddal%' OR column_name LIKE '%covil%';"`

## Regras Obrigatórias

1. **Ler governance SDD antes de qualquer alteração:**
   - `.specify/memory/constitution.md` (cabeçalhos sempre)
   - `docs/sdd/SESSION_FAILURES_REGISTRY.md` (cabeçalhos sempre)
   - `AGENTS.md` (seção de roteamento de contexto)

2. **Atualizar sessão em tempo real:**
   - Marcar itens da checklist conforme progresso
   - Registrar achados no log de progresso
   - Atualizar antes e depois de cada fase

3. **Gestão de contexto:**
   - Nunca abrir `.specify/arquiteture.md` inteiro — usar grep primeiro
   - Buscar seção específica: `grep -n "§12" .specify/arquiteture.md`
   - Abrir só as linhas necessárias

4. **Diagnóstico sistemático:**
   - Coletar evidências concretas (queries, payloads, screenshots de código)
   - Não assumir — verificar cada camada (dados → backend → frontend)
   - Documentar cada achado na sessão

5. **Proposta de correção:**
   - Mudança mínima necessária
   - Reversível
   - Sem quebrar contratos existentes
   - Aguardar aprovação antes de implementar

## Comando para Iniciar

```
Iniciar sessão 26-04-22_4_investigacao-selos-ddal-covil.md

Objetivo: Investigar por que os selos DDAL e Covil do Lich não aparecem nas páginas de mesa e cards.

Começar pela Fase 1 (Diagnóstico de Dados):
1. Verificar schema da tabela `tables` — colunas relacionadas a selos
2. Consultar dados reais em beta: quantas mesas têm esses selos?
3. Identificar formato de armazenamento (JSON, array, flags booleanos)

Atualizar a sessão conforme progresso e reportar achados de cada fase antes de avançar.
```

## Informações Adicionais

- **Ambiente Beta:** Acesso via SSH `ssh -F C:\projetos\config faren`
- **Banco Beta:** `docker exec mesas-beta-db psql -U admin -d mesas_rpg`
- **Logs Backend Beta:** `docker logs mesas-beta-backend --tail 100`
- **Última feature deployada:** Feature 001 (Migration Governance Pipeline) — ativa em beta e prod
- **Branch atual:** `dev` (sincronizada com `origin/dev`)

## Histórico Relevante

De acordo com `BACKLOG_OPERACIONAL.md` §4 (Histórico de Conclusão):
- **REQ-09 (15/04/2026):** "Selos Covil + DDAL. Persistência, filtro, badges, validação." — marcado como concluído

Isso indica que a funcionalidade foi implementada anteriormente, mas pode ter regredido ou nunca funcionou corretamente. Investigar se:
- A implementação foi parcial
- Houve regressão em deploy posterior
- A funcionalidade existe no backend mas não no frontend (ou vice-versa)
