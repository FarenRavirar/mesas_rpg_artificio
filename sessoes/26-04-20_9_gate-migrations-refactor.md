# SESSÃO: 20/04/2026 - Gate de Migrations SDD-001

**Data:** 20/04/2026  
**Objetivo:** Elaborar infraestrutura, shell scripts robustos com reconciliação idempotente e rotinas de validação de metadados das antigas migrations soltas na base, além deter o processo de quebrar beta/prod por colisão.

**Sessão Anterior:** [N/A - Primeira sessão do fluxo SDD]
**Próxima Sessão:** A definir

## Plano de Execução (Baseado em tasks.md do spec 001)
1. Fase 1: Setup e inventário (ADRs e mapeamento).
2. Fase 2: Construção da suite "Red" (mock, unit tests de script).
3. Fase 3: Implantação Core "Green" (`lib_migrations`, `preflight`, check anti-drift).
4. Fase 4: Integração de fluxos GitHub Actions (Jobs de Deploy limitados por Gate transacional).
5. Fase 5: Adaptações de acervo passivo (injecção declarativa da tag de @class).

## Arquivos Modificados
- `specs/001-gate-migrations-refactor/*.md`
- `.github/workflows/deploy-beta.yml`, `deploy-prod.yml`, `promote-to-prod.yml`
- `.github/workflows/_enforce-migration-dir.yml`, `_lint-shell.yml`, `preflight-prod.yml`
- `scripts/deploy/lib_migrations.sh`
- `scripts/deploy/apply_required_migrations.sh`
- `scripts/deploy/reconcile_migrations.sh`
- `scripts/deploy/preflight_prod.sh`
- `database/migration_114_add_applied_by.sql`
- 45 arquivos antigos `.sql` (movidos para `database/` ou tagueados).

## Checklist
- [x] Levantamento de Inventário na VM para DB e diretórios.
- [x] Setup Local (ADR, Allowlist e README limitador).
- [x] Testes Bats formulados e contrato do header avaliado.
- [x] Rewrite do Apply e adição do Reconcile para comandos avulsos.
- [x] Pull Request Actions restritos criados (workflow multi-job).
- [x] Tag header `online-safe` | `manual-risk` unificadas nas 45 migrations de log.
- [x] Atualizar `RESUMO_EXECUCAO.md`
- [x] Atualizar `index.md`
- [x] PR 121 aberto na branch `dev`.

## O que foi feito nesta sessão (retroativo)

Nota: esta seção consolida trabalho executado sem atualização contínua 
da sessão (violação AGENTS.md §6-8 reconhecida e registrada em F15 do 
SESSION_FAILURES_REGISTRY.md).

### Fase 1 — Setup
- T001-T007: ADRs, allowlist, backup do script, inventário de migrations.
- Commit: feat(001): setup — inventário, ADRs, allowlist, backup

### Fase 2 — Tests Red
- T010-T014: criação de lib_migrations.bats e integration_apply.sh 
  (este último como placeholder, corrigido em 2026-04-20 parte 2).
- Commit: feat(001): tests red — contratos falhando por ausência de impl

### Fase 3 — Core
- T020-T028: implementação de lib_migrations.sh, apply_required_migrations.sh,
  reconcile_migrations.sh, preflight_prod.sh.
- Commit: feat(001): core — lib, script refatorado, reconcile, preflight, 
  migration applied_by.

### Fase 4 — Integration (workflows)
- T030-T035: workflows separados com defesa em profundidade do enforcer.
- Commit: feat(001): yaml workflows - lint, enforce dir, beta, prod 
  refatorados.

### Fase 5 — Polish (parcial)
- T040-T041: consolidação de 45 migrations em ./database/ com cabeçalhos.
- T042: reescrita de migrations_guide.md APROVADA em revisão mas NÃO 
  COMMITADA (working tree atual).
- T043-T047: PENDENTES (marcadas SKIP em auditoria).
- Commit: chore(001): apply retro-headers and consolidate legacy files.

### Auditorias e correções pós-Fase 5

#### Bloco de governance
- d258f1b docs(constitution): Seção 9 — regras invioláveis SDD.
- 25b5662 docs(sdd): gate do /speckit.analyze.
- c737208 docs(sdd): checklist do mantenedor.
- 3e4fe03 docs(constitution): Seção 10 — infra rules.
- 5163cfd docs(sdd): SESSION_FAILURES_REGISTRY F01-F14.
- 5ea5bfd docs(sdd): mapear F01-F14 ao checklist.
- c7d6eb4 feat(sdd): pre-commit-strict hook opt-in.
- c01474d docs(001): ADR-005 routing.
- 7c70441 docs: AGENTS.md integra SDD governance routing.

#### Bloco de correções técnicas
- 2da0bd8 fix(001): convert migrations to LF.
- cb32828 fix(001): sanitize .gitattributes encoding.
- 4246678 fix(001): teste 11 com mock injection para set-diff (cobre I2).

#### Reviews processuais
- Hook pre-commit antigo (.git/hooks/pre-commit) renomeado para .disabled.
- Working tree tem 9 deleções em docs/ intencionais do mantenedor (fora 
  do escopo da feature, não devem ser commitadas aqui).
- Clarifications 1-7 do spec aprovadas; Clarification 8 (backup antes 
  Fase 2) rejeitada e removida.

## O que precisa ser feito

### Agora (Parte 2 do Débito 3)
- [ ] Auditar MIGRATIONS_DIR em lib/apply/reconcile scripts.
- [ ] Se hardcoded: commit separado honrando env var.
- [ ] Auditar uso de docker compose exec vs docker exec nos scripts.
- [ ] Criar fixtures de teste (901, 902, 903).
- [ ] Criar docker-compose.test.yml para container descartável.
- [ ] Reescrever integration_apply.sh com arquitetura SSH remota.
- [ ] Rodar 6 testes de integração contra VM faren.
- [ ] Commit atômico do integration_apply.

### Depois do Débito 3
- [ ] T042: revisar migrations_guide.md com 4 correções do mantenedor 
      (restaurar erros TypeScript, restaurar Referências Rápidas, 
      restaurar Lições Aprendidas, revisar tom).
- [ ] T043: OPERACAO_PRODUCAO.md com passo 11 obrigatório de reconcile.
- [ ] T044: PRE_DEPLOY_CHECKLIST.md atualizado.
- [ ] T045: docs/sdd/BRANCH_POLICY.md criar.
- [ ] T046: ERRORS_SOLUTIONS.md entrada nova.
- [ ] T047: pr-description.md para PR 121.
- [ ] T048: remover apply_required_migrations.sh.bak (só após deploy 
      beta validado).

### Pós-merge
- [ ] Ativar branch protection em dev (check enforce-migration-dir).
- [ ] Ativar branch protection em main (checks enforce-migration-dir + 
      preflight-prod).
- [ ] Reconciliação inicial de beta e prod via reconcile_migrations.sh.

## Estado atual da working tree

On branch 001-gate-migrations-refactor
Your branch is ahead of 'origin/001-gate-migrations-refactor' by 16 commits.
  (use "git push" to publish your local commits)

Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	deleted:    docs/auditoria_sistemas_claude.md
	deleted:    docs/sistemas_auditoria_codex.md
	deleted:    docs/sync-patches/patch-20260417-180637.md
	deleted:    docs/sync-patches/patch-20260417-190259.md
	deleted:    docs/sync-patches/patch-20260417-195450.md
	deleted:    docs/sync-patches/patch-20260417-202346.md
	deleted:    docs/sync-patches/patch-20260417-203402.md
	deleted:    docs/taxonomia/arvores_de_sistemas.md
	modified:   migrations_guide.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	bats_full_output.txt
	testes/deploy/test_helper/

no changes added to commit (use "git add" and/or "git commit -a")

## Trabalhos adicionais documentados

- Edição de enforcement na seção "INÍCIO OBRIGATÓRIO DE SESSÃO" no `AGENTS.md` a respeito do F15, aprovada pelo ADR-006.
- Git Push completo do refactoring de governaça realizado com sucesso: `1fb2791..41894a7  001-gate-migrations-refactor -> 001-gate-migrations-refactor`.

## Commits desta sessão

f755076 fix(001): honor MIGRATIONS_DIR env var in apply and reconcile scripts
5ea93fc docs(sessoes): log git push output to session file
41894a7 docs: enforce F15 session update rule in AGENTS.md per ADR-006
6541f46 docs(001): ADR-006 propõe reforço de enforcement de sessão no AGENTS.md
b8de85a docs(sdd): add F15 trigger — session file freshness check
ef00c78 docs(sdd): add F15 — session file not updated in real time
f75ad04 docs(session): consolida estado retroativo da sessão SDD-001 até checkpoint atual

7c70441 docs: integrate SDD governance routing in AGENTS.md per ADR-005
c01474d docs(001): ADR-005 propõe roteamento de SDD governance no AGENTS.md
c7d6eb4 feat(sdd): add opt-in strict pre-commit hook enforcing atomicity
5ea5bfd docs(sdd): map F01-F14 triggers to maintainer review checklist
5163cfd docs(sdd): add session failures registry — 14 padrões calibrados da feature 001
3e4fe03 docs(constitution): add section 10 — infra rules (docker/DB sempre remoto, proibição de placeholder)
4246678 fix(001): implement test 11 with mock injection for set-diff — covers I2 reverse drift
c737208 docs(sdd): add maintainer review checklist for SDD features
25b5662 docs(sdd): add governance gate for /speckit.analyze
d258f1b docs(constitution): add execution governance rules from feature 001 lessons
2da0bd8 fix(001): enforce pure LF in .gitattributes itself
620f98a docs(001): reforce tdd fidelity in constitution
cb32828 fix(001): sanitize .gitattributes encoding
8b2a40d fix(001): convert migrations to LF line endings + enforce via .gitattributes
31b666f docs(001): reforce constitution — testes shell exigem Git Bash/WSL local, BLOCKED nunca PARTIAL
dcbab9c docs(001): apply clarifications review from maintainer
1fb2791 docs: formaliza log de sessao 26-04-20_9
804aa95 docs: registra fechamento da sessao SDD-001
d063124 chore(001): apply retro-headers and consolidate legacy files
a52feeb feat(001): yaml workflows - lint, enforce dir, beta, prod refatorados
22c2285 feat(001): core - lib, script refatorado, reconcile, preflight, migration applied_by
37d5bca feat(001): tests red - contratos falhando por ausencia de impl
b62399d feat(001): setup - inventario, ADRs, allowlist, backup
7e6bc99 docs(001): atualiza specs com resolucoes do clarify
afb38a4 docs(sessoes): arquiva sessao 26-04-20_8_spec-retomada-fluxo após setup sdd concluido
22f08cb docs(sdd): detalha guia sequencial leigo dos comandos cli cli no readme
86757a7 chore(sdd): personaliza constituição e docs SDD para brownfield
1cf29cd chore(sdd): instala spec-kit oficial com suporte Antigravity (agy)
c8fbd96 chore(docs): registrar progresso de sessoes e inicializar retomada do spec-kit
990e08b chore: remover duplicacao bloco 16:07 e 2o 16:20

## Próxima ação imediata

Executar Passo 0 do prompt de arquitetura Parte 2 Débito 3: grep de 
MIGRATIONS_DIR nos 3 scripts para decidir se precisa commit intermediário.
