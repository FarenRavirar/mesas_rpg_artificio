# Project State — Mesas RPG Artifício

**Última atualização:** 2026-04-23T24:15:00-03:00  
**Atualizado por:** conclusão manual da Phase 6 (Validação Off-Happy-Path) na sessão 26-04-23_3
---

## Ambientes

| Ambiente | URL | Branch | Pasta | Status |
|---|---|---|---|---|
| Beta | `mesasbeta.artificiorpg.com` | `dev` | `/opt/mesas-beta/` | ✅ Ativo (deploy automático) |
| Produção | `mesas.artificiorpg.com` | `main` | `/opt/mesas/` | ✅ Ativo (gate de migration) |

---

## Estado Técnico Atual

**Branch ativa:** `dev`  
**Último commit:** `77e971e` — chore: adiciona configuração de testes e atualiza dependências

**Feature ativa:** `specs/003-auditoria-workflows-actions/`  
**Sessão ativa:** `sessoes/26-04-23_3_auditoria-workflows-github-actions-phase6.md`

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
- **Próxima ação:** Preparar deploy de `dev` para `main` (Produção).

---

## Migrations

**Total em disco:** 46 migrations (`database/migration_*.sql`)  
**Status de drift:** Zerado em beta e produção (46 migrations aplicadas)

**Migrations especiais:**
- `migration_105` — reclassificada para `manual-risk` (contém `DROP CONSTRAINT`)
- `migration_114` — aplicada manualmente (bootstrap `applied_by`)

---

## Features Ativas

**Total de features:** 15 diretórios em `.specify/features/`

**Condição atual dos artefatos:**
- `spec.md`: 15/15 presentes
- `tasks.md`: 15/15 presentes
- `plan.md`: 15/15 presentes (**0 pendências**)

| Feature | Tasks Concluídas | Plan.md | Status |
|---|---|---|---|
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

**Feature com maior GUT pendente:** ops-08 (GUT 100, 0% concluído)

---

## Próxima Ação

**Feature 003 — Auditoria de Workflows GitHub Actions:**
1. ✅ **Concluído:** A auditoria dos workflows (Feature 003) alcançou 100% de integridade com a erradicação do vazamento documental (Phase 7 concluída).
2. O branch `dev` está completamente blindado e validado off-happy-path.
3. **Próximo passo imediato:** Iniciar preparação e execução do deploy para Produção (`dev` → `main`) seguindo rigorosamente as diretrizes.

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
- Nenhum.


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
