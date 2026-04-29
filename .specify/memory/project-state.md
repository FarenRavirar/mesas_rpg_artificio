# Project State — Mesas RPG Artifício

**Última atualização:** 2026-04-29T11:32:00-03:00
**Atualizado por:** sessão 26-04-29_1_imagens-banners-placeholder
---

## Ambientes

| Ambiente | URL | Branch | Pasta | Status |
|---|---|---|---|---|
| Beta | `mesasbeta.artificiorpg.com` | `dev` | `/opt/mesas-beta/` | ✅ Ativo (deploy automático) |
| Produção | `mesas.artificiorpg.com` | `main` | `/opt/mesas/` | ✅ Ativo (gate de migration) |

---

## Estado Técnico Atual

**Branch ativa:** `006-imagens-banners-placeholder`
**Último commit base:** `bf1eb29` — ci: corrige lint do workflow de migrations

**Feature ativa:** `specs/006-imagens-banners-placeholder/`
**Sessão ativa:** `sessoes/26-04-29_1_imagens-banners-placeholder.md`

**Progresso da feature 003 (24/04/2026 00:15 BRT):**
- `/speckit.specify` concluído: `spec.md` gerado com FR-001..FR-012 e SC-001..SC-005
- `/speckit.plan` concluído: artefatos de planejamento completos
  - `plan.md` (92 linhas) — contexto técnico, gates constitucionais, estrutura de escopo
  - `research.md` (44 linhas) — 6 decisões técnicas com justificativas
  - `data-model.md` (131 linhas) — 5 entidades, relacionamentos e transições de estado
  - `quickstart.md` (63 linhas) — procedimento operacional incremental
  - `contracts/workflow-audit.openapi.yaml` (321 linhas) — contrato OpenAPI completo
- `/speckit.tasks` concluído: `tasks.md` gerado com 45 tasks (7 fases, 15 parallelizáveis)
- **Phase 1 (Setup) concluída:** Branch criada, estrutura de auditoria preparada, baseline documentado
- **Phase 2 (Inventário Canônico) concluída:** 9 workflows inventariados (T004-T013)
  - 8 inventários individuais criados (ci, deploy-beta, deploy-prod, promote-to-prod, preflight-prod, docker-cleanup, sync-arquitetura, reusable)
  - Inventário consolidado com dependency map e 7 findings críticos
  - Cobertura 100% de FR-001, FR-002 e SC-001
- **Phase 3 (Diagnóstico por Severidade) concluída:** 7 findings classificados (T014-T020)
  - 5 findings individuais criados (deploy-overlap, beta-concurrency, silent-failures, prod-race, reusable-contract-risk)
  - Findings consolidados: 1 CRITICAL, 4 HIGH, 2 MEDIUM
  - Todos os findings críticos/altos têm ações de regularização definidas
  - Cobertura 100% de FR-003, FR-004, FR-005, FR-006 e SC-002
- **Phase 4 (Planejamento de Regularização) concluída:** 5 ações planejadas (T021-T027)
  - 5 planos de ação criados (prod-separation, beta-concurrency, failure-propagation, boundaries, reusable versioning)
  - Plano consolidado com rollback explícito para todas as ações
  - Validação confirmada: nenhum workflow será removido
  - Cobertura 100% de FR-007, FR-008 e FR-009
  - Decisões do usuário incorporadas: concurrency (cancelar obsoletos), break-glass (safeguards), rollback (snapshot 60s/90s), versioning (aprovado)
- **Phase 5 (Aplicação de Correções) concluída:** 7 tasks executadas com rollback validado (T028-T034)
  - Validação T034 atestou sucesso do processo de Rollback Automático após falha de Nginx no Beta
- Validação de qualidade: 0 placeholders de template, 0 marcadores `NEEDS CLARIFICATION`
- Inventário técnico atualizado: 8 workflows canônicos em `.github/workflows/` (2 reutilizáveis + 6 operacionais)
- **Phase 6 (Validação Off-Happy-Path) concluída:** 7 tasks executadas e isolamentos comprovados (T035-T041)
  - Evidências consolidadas documentando `failure` bloqueante em shellcheck, migrations gate e preflight
  - Prova de isolamento entre deploys de Beta vs Produção via modelo opt-in (`workflow_dispatch`)
- **Phase 7 (Finalização e Fechamento) concluída:** Relatório final (`audit-report.md`) e `pr-description.md` gerados. Tarefas T042-T045 concluídas.
- **Investigação forense da promoção concluída:** causa da falha `fatal: ambiguous argument 'v1.2.3'` confirmada no run `24867211797` (job `release`, step `Montar resumo executivo`).
- **Patch mínimo aplicado em produção pipeline:** `.github/workflows/promote-to-prod.yml` atualizado para usar `TARGET_REF` com fallback em `origin/main` quando `${VERSION}` não existe como revisão Git no runner.
- **Validação local pós-patch:** sintaxe YAML do workflow validada (`YAML_PARSE_OK`) e cálculo de range validado sem erro de revisão ambígua.

**Progresso Bugfix-UX (Covil e Placeholders + BUG-003 price_type):**
- `/speckit.bugfix.report` concluído para BUG-003 em `.specify/features/bug-ux-covil/bugs/BUG-003.md`.
- `/speckit.bugfix.patch` concluído com atualização de `plan.md` e `tasks.md` (T004/T005/T006).
- Implementação aplicada em `frontend/src/features/create-table/utils/mapper.ts` com normalização `free/paid` -> `gratuita/paga`.
- `/speckit.bugfix.verify` concluído com consistência entre artefatos e código alterado.
- **Validação global em beta concluída:**
  - Infra VM: `mesas-beta-api`, `mesas-beta-frontend`, `mesas-beta-db` saudáveis.
  - DB enum: `price_type` contém `gratuita`, `paga`.
  - Runtime endpoint: `POST /api/v1/gm/tables` com `price_type="gratuita"` retornou `HTTP 201`, criando `id=98f9e6f1-97db-4b86-93aa-6de6471140fc`.
- **Status atual:** Bugfix validado em dev/beta.
- **Próxima ação:** executar retro/status de fechamento da sessão e manter monitoramento pós-correção no painel.

---

## Migrations

**Total em disco:** 46 migrations (`database/migration_*.sql`)  
**Status de drift:** Zerado em beta e produção (46 migrations aplicadas)

**Migrations especiais:**
- `migration_105` — reclassificada para `manual-risk` (contém `DROP CONSTRAINT`)
- `migration_114` — aplicada manualmente (bootstrap `applied_by`)

---

## Features Ativas

**Total de features:** 16 diretórios em `.specify/features/`

**Condição atual dos artefatos:**
- `spec.md`: 16/16 presentes
- `tasks.md`: 15/16 presentes
- `plan.md`: 15/16 presentes (**0 pendências**)

| Feature | Tasks Concluídas | Plan.md | Status |
|---|---|---|---|
| bug-ux-covil | 6/6 (100%) | ✅ | Validado (inclui BUG-003) |
| deb-01 | 0/3 (0%) | ✅ | Pendente |
| deb-02 | 0/6 (0%) | ✅ | Pendente |
| deb-03 | 0/6 (0%) | ✅ | Pendente |
| deb-04 | 0/6 (0%) | ✅ | Pendente |
| deb-06 | 0/6 (0%) | ✅ | Pendente |
| deb-08 | 0/11 (0%) | ✅ | Pendente |
| deb-09 | 0/8 (0%) | ✅ | Pendente |
| ops-01 | 0/7 (0%) | ✅ | Pendente |
| ops-02 | 0/6 (0%) | ✅ | Pendente |
| ops-03 | 0/5 (0%) | ✅ | Pendente |
| ops-06 | 0/4 (0%) | ✅ | Pendente |
| ops-07 | 0/5 (0%) | ✅ | Pendente |
| ops-08 | 0/7 (0%) | ✅ | Pendente (GUT 100) |
| req-29 | 0/8 (0%) | ✅ | Pendente |
| req-orphan | 0/15 (0%) | ✅ | Pendente |

**Feature com maior GUT pendente:** ops-08 (GUT 100, 0% concluído).

---

## Próxima Ação

**Sessão 26-04-29_2 — Lançamento de itens SDD:**
1. ✅ **Itens esgotados pelo mantenedor:** sessão encerrada documentalmente em 29/04/2026 13:02 BRT.
2. ✅ **Artefatos preparados:** itens 007, 008, 009, 010 e 011 registrados em `specs/` com documentação SDD conforme escopo de cada item.
3. ✅ **Sem implementação técnica nos itens:** a sessão preparou specs/plans/tasks e não iniciou correções de produto.
4. ✅ **Índice de sessões atualizado:** `sessoes/index.md` aponta esta sessão como mais recente.
5. **Próximo passo autorizado:** publicar/deployar a sessão documental para `dev` conforme pedido explícito do mantenedor.

**Bugfix UX (Covil/Placeholders/PriceType):**
1. ✅ **Concluído:** Diagnóstico, patch, implementação, verify e validação global do BUG-003 em beta.
2. **Próximo passo:** manter registro histórico; sem ação imediata nesta sessão.

**Pacote operacional — Runtime e Workflows (novo):**
1. ✅ **US1 concluída:** `mesas-cron` corrigido para executar scripts compilados (`node dist/scripts/*.js`) em produção; container recriado e validado `Up` por mais de 30 minutos, sem `ts-node: not found`.
2. ✅ **US2 concluída:** Node.js da VM atualizado para `v25.9.0`; npm global da VM atualizado para `11.13.0`; serviços principais continuam saudáveis.
3. ✅ **US3 concluída:** workflows atualizados para `actions/checkout@v5`, `actions/setup-node@v6` e `node-version: '25.9.0'`; Dockerfiles atualizados para `node:25.9.0-alpine` com npm `11.13.0`.
4. ✅ **Lint de workflow concluído:** `_enforce-migration-dir.yml` corrigido para remover `SC2086`; Deploy Beta `25080459429` concluiu verde sem annotation `actionlint` relacionada ao aviso.
5. ✅ **Fechamento SDD concluído:** `pr-description.md`, `tasks.md`, `project-state.md`, `session-log.md` e índice de sessões atualizados; sessão movida para `sessoes/encerradas/`.
6. **Próximo passo:** se aprovado, promover `dev` para `main` por PR/fluxo controlado; não há próxima ação técnica pendente desta feature em `dev`.

**Feature 003 — Auditoria de Workflows GitHub Actions:**
1. ✅ **Concluído:** A auditoria dos workflows (Feature 003) alcançou 100% de integridade com a erradicação do vazamento documental (Phase 7 concluída).
2. O branch `dev` está completamente blindado e validado off-happy-path.
3. **Próximo passo imediato:** Executar novo `workflow_dispatch` de `promote-to-prod.yml` para validar job `release` GREEN.e blindado e validado off-happy-path.
3. **Próximo passo imediato:** Iniciar preparação e execução do deploy para Produção (`dev` → `main`) seguindo rigorosamente as diretrizes.

**Hidratação Beta (Refatoração Semântica via JSON):**
1. ✅ **Concluído:** Resolução de E160-E163 (infraestrutura, auth, ON CONFLICT, schema).
2. **Próximo passo:** Abrir nova sessão para refatorar `backend/src/routes/adminHydration.ts` para arquitetura semântica via JSON. Decisão arquitetural: import por slug/email em vez de id direto. Permite reuso futuro pra import via Discord bot.
3. **Critério de início:** Sessão nova com plano completo (export → JSON intermediário → import semântico).

**Artefatos da Phase 4:**
- 5 planos de ação em `specs/003-auditoria-workflows-actions/audit/action-*.md`
- Plano consolidado: 1 CRITICAL, 3 HIGH, 1 MEDIUM
- Rollback explícito documentado para todas as ações
- Validação: nenhum workflow será removido

**Comandos disponíveis:**
- `/speckit.status` — dashboard de estado SDD
- `/speckit.plan` — gerar `plan.md` para feature específica
- `/speckit.tasks` — gerar/ajustar `tasks.md`
- `/speckit.retro.run` — análise retrospectiva de sprint
- `/speckit.bugfix.*` — correção estruturada de bugs
- `/speckit.reconcile.run` — reconciliação de drift
- `/speckit.archive.run` — arquivamento pós-merge
- `/speckit.doctor` — diagnóstico de saúde do projeto
- `/speckit.verify-tasks` — detecção de phantom completions
- `/speckit.memorylint.run` — auditoria de governança

---

## Bloqueios Ativos

**Bloqueios/pendências ativos:**
- E164 (hidratação beta): IDs divergentes prod vs beta + transaction abortada após FK violation. Endpoint /api/v1/admin/sync/hydrate retorna 500. Decisão: refatoração arquitetural via JSON em sessão futura.


---

## Identidade

**Repositório:** `mesas_rpg_artificio`  
**SSH:** `ssh -F C:\projetos\config faren`  
**VM Oracle:** acesso via `gh` autenticado  
**Banco de dados:** `mesas_rpg` (PostgreSQL via Docker)

**Credenciais de acesso:**
```bash
# Beta
docker exec mesas-beta-db psql -U admin -d mesas_rpg

# Produção
docker exec mesas-db psql -U admin -d mesas_rpg
```
