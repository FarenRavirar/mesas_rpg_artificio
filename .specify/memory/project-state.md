# Project State — Mesas RPG Artifício

**Última atualização:** 2026-05-03T07:58:53-03:00
**Atualizado por:** sessão 26-05-03_2_refatoracao-changelog
---

## Ambientes

| Ambiente | URL | Branch | Pasta | Status |
|---|---|---|---|---|
| Beta | `mesasbeta.artificiorpg.com` | `dev` | `/opt/mesas-beta/` | ✅ Ativo (deploy automático) |
| Produção | `mesas.artificiorpg.com` | `main` | `/opt/mesas/` | ✅ Ativo (gate de migration) |

---

## Estado Técnico Atual

**Branch ativa:** `dev` (branch `feat/012-discord-covil-sync` a criar ao iniciar implementacao)
**Último commit base:** `3df0fff` — fix: ajusta importacao segura de url

**Feature ativa:** `specs/012-discord-covil-sync/`
**Sessão ativa:** `sessoes/26-05-03_3_discord-covil-sync.md`

**Feature 012 — Pipeline Discord Covil Sync (03/05/2026):**
- Sessao nova aberta a pedido explícito do mantenedor.
- Decisao de arquitetura aprovada: pipeline de 3 camadas (ingestao → staging → sync para `tables`).
- `origin = 'imported'`, `is_covil = true`; sem criar novo valor de enum neste ciclo.
- Migration 115 planejada: 3 novas tabelas (`discord_import_sources`, `discord_import_messages`, `discord_import_table_drafts`).
- 29 tasks criadas em 7 fases (Fases 0–6 implementaveis; Fase 7 bot/automacao posterior).
- **Status:** artefatos SDD criados; aguardando comando do mantenedor para iniciar implementacao.

**Feature 010 — Refatoração do Changelog (03/05/2026):**
- Sessão nova aberta a pedido explícito do mantenedor, sem branch dedicada; trabalho direto em `dev`.
- Sessões `26-05-03_1_verificacao-sugestoes-sistemas-admin.md` e `26-05-01_1_editor-rico-textareas.md` encerradas e movidas para `sessoes/encerradas/`.
- `.specify/feature.json` e `AGENTS.md` atualizados para apontar `specs/010-refatoracao-changelog`.
- Spec tratado como hipótese: inventário real de `database/changelogs.json` encontrou 11 entradas totais/publicadas e zero datas duplicadas.
- `specs/010-refatoracao-changelog/changelog-inventory.md` criado com decisões por entrada, grupos por data e evidências.
- `database/changelogs.json` revisado editorialmente em 4 entradas (03/05, 29/04, 18/04 e 08/04), sem remover ou despublicar histórico.
- `tasks.md` atualizado: referências de sessão antiga corrigidas e T001-T021 concluídas.
- Validação: JSON válido; busca final sem `sidebar vertical`, `migration`, `refactor`, `placeholder`, `performance`, `otimizados`, `Q1`, `Q4`, `administrativa`, `arvore administrativa`, `admin`; zero datas publicadas duplicadas.
- **Status:** Spec 010 executado localmente; pronto para revisão/commit quando solicitado.

**Feature 011 — Verificação de Sugestões e Notificações Admin (03/05/2026):**
- Sessão nova aberta a pedido explícito do mantenedor, sem branch dedicada; trabalho direto em `dev`.
- `.specify/feature.json` e `AGENTS.md` atualizados para apontar `specs/011-verificacao-sugestoes-sistemas-admin`.
- Decisão de produto incorporada: toda sugestão criada por usuário deve gerar notificação para administradores.
- Implementação aplicada:
  - `backend/src/routes/systemSuggestions.ts`: sugestões de sistemas criam notificação admin na mesma transação.
  - `backend/src/routes/scenarioSuggestions.ts`: sugestões de cenários criam notificação admin na mesma transação.
  - `backend/src/routes/vttPlatforms.ts`: sugestões de plataformas VTT criam notificação admin na mesma transação.
  - `frontend/src/components/SystemSuggestionModal.tsx`: confirmação de envio após sucesso real do POST.
- Documentação atualizada: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/README.md`, `tasks.md`, `flow-map.md` e `database/changelogs.json`.
- Validação técnica: `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN.
- **Status:** pronto para commit e deploy em `dev`; validação funcional em Beta após deploy.

**Feature 009 — Editor Rico em Textareas (01/05/2026):**
- Sessão `26-05-01_1_editor-rico-textareas` aberta a pedido explícito do mantenedor.
- Sem branch dedicada — autorizado pelo mantenedor; trabalho direto em `dev`.
- `/speckit.specify` executado: `spec.md` validado (checklist 15/15 itens ✅); `.specify/feature.json` atualizado para `specs/009-editor-rico-textareas`.
- `/speckit.plan` executado com pesquisa real do código: `MarkdownEditor` (react-markdown-editor-lite v1.4.2) confirmado como editor canônico pelo mantenedor; 10 `<textarea>` nus e 5 campos com `RichTextArea` inventariados; `research.md` e `plan.md` atualizados.
- `/speckit.tasks` executado: `tasks.md` regenerado com 22 tasks, caminhos reais, sessão correta; `AGENTS.md` aponta plano ativo para feature 009.
- **Status:** Spec kit concluído; aguardando comando do mantenedor para iniciar `/speckit.implement`.

**Feature 008 — Catálogo e Painel UX Bugs (29/04/2026):**
- Sessão dedicada aberta a pedido explícito do mantenedor.
- Branch `feat/008-catalogo-painel-ux-bugs` criada pelo fluxo equivalente ao hook obrigatório `speckit.git.feature`.
- `/speckit.specify` retomado para `specs/008-catalogo-painel-ux-bugs/` sem sobrescrever artefatos existentes.
- `spec.md` e `checklists/requirements.md` validados: sem placeholders de template, sem marcadores `[NEEDS CLARIFICATION]` ativos e sem itens abertos no checklist.
- `.specify/feature.json` atualizado para apontar a feature 008.
- Artefatos existentes detectados: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md` e `contracts/README.md`.
- `/speckit.plan` executado após autorização do mantenedor, tratando a spec como hipótese e validando escopo contra o código.
- Código consultado para planejamento: catálogo público, drawer/chips/cards, gestão de sistemas e seletor de sistemas compartilhado com painel.
- Achado técnico incorporado: `SystemTreeSelector` afeta catálogo e painel; o bloco de variantes em `singleSelect` deve ser tratado como risco/bug do escopo 008.
- Artefatos de planejamento atualizados: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/README.md`; `AGENTS.md` aponta o plano ativo para a feature 008.
- `/speckit.tasks` executado após aprovação do mantenedor: `tasks.md` regenerado com 30 tarefas, caminhos reais, sessão atual e fases independentes por user story.
- Validação de tarefas: 30/30 tarefas seguem formato obrigatório; zero referências à sessão antiga `26-04-29_2`; zero placeholders de template ou `NEEDS CLARIFICATION`.
- Implementação aplicada e publicada no Beta:
  - Rebase interrompido em `dev` corrigido após conflito em `TableCard.tsx` e `CatalogoPage.tsx`.
  - Commit local preservado/reaplicado sobre `origin/dev` como `8fc37ed fix: refina cards e badges do catalogo`.
  - `git push origin dev` concluído com sucesso.
  - Deploy Beta `25124747594` concluído com sucesso para `8fc37ed`: lint, enforce-dir, validate, migrate, deploy-app e smoke passaram.
  - Topo/filtros do catálogo aprovados pelo mantenedor; cards ajustados para evitar título, vagas e preço comprimidos.
- **Status:** Feature 008 publicada em Beta; aguardando teste funcional manual do mantenedor em janela anônima no Beta.

**Feature 007 — Exclusão de Mesa Sem Pop-up (29/04/2026):**
- `/speckit.plan` concluído para `specs/007-exclusao-mesa-sem-popup/` com `plan.md`, `research.md`, `data-model.md`, `quickstart.md` e contrato de confirmação inline.
- `/speckit.tasks` concluído: `tasks.md` finalizado com 20/20 tarefas concluídas após BUG-001.
- `/speckit.implement` aplicado:
  - `InlineDeleteConfirmation` criado para confirmação integrada à página.
  - Painel do mestre, página/preview da mesa e gestão administrativa usam confirmação inline antes do `DELETE`.
  - Handler antigo de exclusão com `confirm`/`prompt`/`alert` removido.
  - Changelog de 29/04/2026 consolidado com a melhoria visível.
- BUG-001 pós-deploy Beta corrigido:
  - Causa raiz: página/preview da mesa habilitava gestão para `owner || admin`, mas `TableActionPanel` chamava sempre `DELETE /api/v1/gm/tables/:id`.
  - Correção: `TableActionPanel` agora recebe `deleteEndpointScope` e usa `DELETE /api/v1/admin/tables/:id` quando a ação vem de admin.
- Validação técnica e Beta:
  - Busca direcionada por pop-ups de exclusão de mesa retornou zero ocorrências.
  - `npm --prefix frontend run build` concluído com sucesso.
  - `database/changelogs.json` validado como JSON válido.
  - Deploy Beta `25121700376` concluído com sucesso em `dev`.
  - Pós-deploy: frontend `200`, `/api/v1/health` conectado, `/api/v1/tables?limit=1` `200`.
- **Status:** Feature 007 concluída em Beta; aguardando apenas teste funcional manual em janela anônima pelo mantenedor.

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

**Feature 008 — Catálogo e Painel UX Bugs:**
1. ✅ **Sessão aberta:** `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md` criada para retomar a feature 008.
2. ✅ **Spec ativa:** `.specify/feature.json` aponta para `specs/008-catalogo-painel-ux-bugs`.
3. ✅ **Validação de spec:** `spec.md` e checklist de qualidade estão sem pendências de `/speckit.specify`.
4. ✅ **Plan concluído:** `/speckit.plan` gerou plano crítico baseado em pesquisa de código, sem considerar a spec como plenamente validada.
5. ✅ **Tasks concluído:** `tasks.md` regenerado com 30 tarefas, organizado por user story e validado contra o plano revisado.
6. **Próximo passo SDD:** aguardar comando do mantenedor para iniciar `/speckit.implement`.

**Feature 007 — Exclusão de Mesa Sem Pop-up:**
1. ✅ **Implementação concluída:** confirmação de exclusão de mesa ocorre dentro da página, sem pop-up, com segunda ação explícita e bloqueio durante processamento.
2. ✅ **BUG-001 corrigido após deploy Beta:** exclusão administrativa pela página/preview agora usa endpoint admin em vez do endpoint de mestre.
3. ✅ **Validação técnica concluída:** busca direcionada sem ocorrências, build frontend verde e changelog JSON válido.
4. ✅ **Deploy Beta concluído:** workflow `Deploy Beta` run `25121700376` verde; health público e rota crítica de mesas retornaram sucesso.
5. **Próximo passo funcional:** mantenedor testar o fluxo em janela anônima no Beta (`mesasbeta.artificiorpg.com`).

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
