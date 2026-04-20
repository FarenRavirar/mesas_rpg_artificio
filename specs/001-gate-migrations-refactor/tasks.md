# TASKS: Refatoração do Gate de Migrations dev→prod

**Spec:** ./spec.md
**Plan:** ./plan.md

---

## Regras

- Toda task: ID, descrição, arquivos, critério de done.
- `[P]` marca tasks paralelizáveis.
- Testes ANTES de implementação (TDAD).
- Commit ao final de cada fase.
- Falha de task PARA o fluxo — reporta, não faz workaround.

---

## Fase 1 — Setup

### T001: Garantir branch ativa
- **Ação:** confirmar que a branch `001-gate-migrations-refactor` existe e está em checkout, working tree limpa.
- **Arquivos:** n/a (git).
- **Done:** `git branch --show-current` = `001-gate-migrations-refactor` e `git status` limpo.

### T002: Confirmar canônico `./database`
- **Ação:** validar que `MIGRATIONS_DIR` no script atual aponta para `./database`; se outro caminho, abrir ADR própria antes de prosseguir.
- **Arquivos:** leitura de `scripts/deploy/apply_required_migrations.sh`.
- **Done:** registro em `migrations-inventory.md` confirmando canônico atual.

### T003: Inventariar migrations existentes
- **Ação:** `find . -name "migration_*.sql" -not -path "./.git/*" -not -path "./node_modules/*"`. Gerar `migrations-inventory.md` com: caminho atual, número, descrição, classificação sugerida (online-safe / manual-risk) inferida do conteúdo.
- **Arquivos:** `specs/001-gate-migrations-refactor/migrations-inventory.md` (criar).
- **Done:** arquivo existe listando todas as migrations; revisão humana confirma classificações sugeridas.

### T004: Backup do script atual
- **Ação:** `cp scripts/deploy/apply_required_migrations.sh scripts/deploy/apply_required_migrations.sh.bak`.
- **Arquivos:** `.bak` criado.
- **Done:** arquivo backup byte-identical ao original.

### T005 [P]: Criar `database/README.md`
- **Ação:** documentar cabeçalho, convenção de nomes (`NNN_descricao_snake_case.sql`), exemplos de `online-safe` e `manual-risk`, política forward-only, referência ao `reconcile_migrations.sh` para emergência.
- **Arquivos:** `database/README.md` (criar).
- **Done:** README existe com exemplos completos.

### T006 [P]: Criar ADRs
- **Ação:** redigir ADR-001 (metadados no cabeçalho), ADR-002 (forward-only), ADR-003 (canônico permanece `./database`), ADR-004 (checksum fora de escopo).
- **Arquivos:**
  - `specs/001-gate-migrations-refactor/adr-001-metadata-no-header.md`
  - `specs/001-gate-migrations-refactor/adr-002-forward-only.md`
  - `specs/001-gate-migrations-refactor/adr-003-canonical-dir-stays-database.md`
  - `specs/001-gate-migrations-refactor/adr-004-checksum-out-of-scope.md`
- **Done:** quatro arquivos com seções Contexto, Escolhido, Rejeitado, Motivo, Consequências.

### T007 [P]: Criar allowlist inicial
- **Ação:** criar `.github/migration-dir-allowlist` com paths aprovados em Clarify.
- **Arquivos:** `.github/migration-dir-allowlist` (criar).
- **Done:** arquivo contém minimamente `./database/`, `./testes/deploy/fixtures/`, `./specs/**/fixtures/`.

### T008: Executar e registrar backups (Beta e Prod)
- **Ação:** Realizar dump completo do banco de dados na VM para beta e prod. Registrar os caminhos absolutos dos arquivos de backup no arquivo `RESUMO_EXECUCAO.md` para garantir rollback seguro se a refatoração falhar.
- **Arquivos:** via SSH (bash commands) e atualização em `RESUMO_EXECUCAO.md`.
- **Done:** Backups criados com sucesso com tamanho > 0 bytes e caminhos registrados.

**Checkpoint Fase 1:**
```
git add database/README.md scripts/deploy/apply_required_migrations.sh.bak .github/migration-dir-allowlist specs/001-gate-migrations-refactor/
git commit -m "feat(001): setup — inventário, ADRs, allowlist, backup"
```

---

## Fase 2 — Testes (Red)

### T010 [P]: Teste `parse_header`
- **Ação:** criar `lib_migrations.bats` com:
  - arquivo com todos campos → sucesso;
  - sem `@class` → erro;
  - `@class: invalid` → erro;
  - `@requires-backup: true` + `@class: online-safe` → erro de coerência (I6).
- **Arquivos:** `testes/deploy/lib_migrations.bats`, `testes/deploy/fixtures/header_*.sql`.
- **Done:** `bats testes/deploy/lib_migrations.bats` roda e FALHA.

### T011 [P]: Teste `validate_sql_against_class`
- **Ação:** casos:
  - `online-safe` + `CREATE TABLE` → ok;
  - `online-safe` + `DROP TABLE` → erro;
  - `online-safe` + `TRUNCATE` → erro;
  - `online-safe` + `DELETE FROM` → erro;
  - `manual-risk` + `DROP TABLE` → ok;
  - `-- DROP TABLE` em comentário → ignora.
- **Arquivos:** `lib_migrations.bats` + fixtures.
- **Done:** testes falham por ausência de implementação.

### T012 [P]: Teste `list_pending_by_set_diff`
- **Ação:** casos:
  - 3 arquivos em disco, 2 em `schema_migrations`, diff = 1 a aplicar;
  - 2 arquivos em disco, 3 em `schema_migrations` (banco à frente) → erro I2;
  - conjuntos iguais → lista vazia.
- **Arquivos:** `lib_migrations.bats` + setup de banco mock.
- **Done:** testes falham.

### T013: Contract test do cabeçalho
- **Ação:** `header_contract.sh` varre `./database/migration_*.sql` validando cada. Aceita diretório vazio como ok.
- **Arquivos:** `testes/deploy/header_contract.sh`.
- **Done:** executável; falha com fixture inválida; passa com diretório vazio.

### T014: Teste de integração
- **Ação:** `integration_apply.sh`:
  - sobe postgres descartável;
  - aplica migration de bootstrap + fixture `online-safe`;
  - verifica registro em `schema_migrations`;
  - roda 2x (idempotência);
  - testa bloqueio de `manual-risk`;
  - testa liberação com `ALLOW_MANUAL_MIGRATIONS=true` + `PROD_BACKUP_FILE`;
  - testa drift (I2).
- **Arquivos:** `testes/deploy/integration_apply.sh` + fixtures.
- **Done:** script existe; falha nos pontos esperados com lib vazio.

**Checkpoint Fase 2:**
```
git add testes/deploy/
git commit -m "feat(001): tests red — contratos falhando por ausência de impl"
```

Rodar suíte local, confirmar RED.

---

## Fase 3 — Core (Green)

### T020: `lib_migrations.sh` esqueleto
- **Ação:** arquivo com funções declaradas, stubs retornando 1. Shebang `#!/usr/bin/env bash`, `set -euo pipefail`. Source-ável.
- **Arquivos:** `scripts/deploy/lib_migrations.sh`.
- **Done:** `shellcheck` passa; `source` sem erro.

### T021: `parse_header`
- **Ação:** lê primeiras 20 linhas, extrai `@class`, `@requires-backup`, `@author`, `@created`, `@description`. Valida obrigatórios e coerência I6.
- **Arquivos:** `lib_migrations.sh`.
- **Depende de:** T020.
- **Done:** T010 verde.

### T022: `validate_sql_against_class`
- **Ação:** strippa comentários (`--...$`, `/* ... */`), busca palavras destrutivas, cruza com `@class`.
- **Arquivos:** `lib_migrations.sh`.
- **Depende de:** T021.
- **Done:** T011 verde.

### T023: `list_pending_by_set_diff`
- **Ação:** recebe compose-file + db-service. Consulta `SELECT version FROM schema_migrations ORDER BY version`. Lista arquivos em `./database/migration_*.sql`. Retorna set-diff:
  - `in_disk_not_in_db` → aplicar;
  - `in_db_not_in_disk` → erro I2.
  Nunca usa contagem.
- **Arquivos:** `lib_migrations.sh`.
- **Depende de:** T021.
- **Done:** T012 verde.

### T024: `acquire_lock` / `release_lock`
- **Ação:** `SELECT pg_try_advisory_lock(918273645)`. Timeout 30s via loop com sleep 1.
- **Arquivos:** `lib_migrations.sh`.
- **Depende de:** T020.
- **Done:** lock adquirido e liberado; segunda chamada concorrente falha em timeout.

### T025: Criar `migration_NNN_add_applied_by.sql`
- **Ação:** SQL conforme plan Seção 6. Determinar NNN inspecionando `./database/` (maior número + 1). Cabeçalho completo. Bloco de validação. **Não incluir coluna `checksum`**.
- **Arquivos:** `./database/migration_NNN_add_applied_by.sql`.
- **Done:** T013 passa; idempotente em 2ª execução.

### T026: Reescrever `apply_required_migrations.sh`
- **Ação:** reescrita. Assinatura `$1 compose-file $2 db-service` mantida. Internamente:
  1. `source lib_migrations.sh`.
  2. Bootstrap `schema_migrations` se não existir.
  3. `acquire_lock` com timeout.
  4. `list_pending_by_set_diff`.
  5. Para cada pendente: `parse_header`, `validate_sql_against_class`, aplicar política (`manual-risk` + autorização + backup), aplicar SQL em transação + `INSERT INTO schema_migrations`.
  6. `release_lock`.
  7. Última linha: `[migrations] schema em conformidade para runtime.`.
  Eliminar listas `ONLINE_SAFE_MIGRATIONS` e `MANUAL_RISK_MIGRATIONS`.
- **Arquivos:** `scripts/deploy/apply_required_migrations.sh`.
- **Depende de:** T020–T025.
- **Done:** T014 verde; `shellcheck` passa.

### T027: `reconcile_migrations.sh`
- **Ação:** subcomandos:
  - `--list <compose> <db-service>`: mostra estado atual (disco + banco + diff);
  - `--mark-applied <version> <compose> <db-service>`: insere em `schema_migrations` sem rodar SQL. Idempotente com log `SKIP` explícito se já existe (exit 0); log `NEW` quando insere; rejeita se `version` não tem arquivo `.sql` correspondente em `./database/`; registra `applied_by = "reconcile:$(whoami)@$(hostname)"`.
  Proteção: em ambiente-prod sem `--force`, recusa.
- **Arquivos:** `scripts/deploy/reconcile_migrations.sh`.
- **Depende de:** T020.
- **Done:** teste manual com postgres descartável mostra registros inseridos sem aplicar SQL; reject the version gracefully if .sql is missing.

### T028: `preflight_prod.sh`
- **Ação:** roda no runner. Via SSH:
  - `SELECT version()` em beta e prod;
  - `SELECT version FROM schema_migrations ORDER BY version` em beta e prod;
  - listar `./database/migration_*.sql` no HEAD pós-merge simulado de `main`.
  Gera relatório em `/tmp/preflight_report.md` com:
  - diff **prod vs HEAD(main pós-merge)** — bloqueante;
  - diff beta vs HEAD(dev) — informativo;
  - diff beta vs prod — informativo (contextualiza `main à frente de dev`);
  - status `GO` / `BLOCKED` / `ATTENTION`.
- **Arquivos:** `scripts/deploy/preflight_prod.sh`.
- **Depende de:** nenhum.
- **Done:** script gera relatório válido com SSH mockado em teste local.

**Checkpoint Fase 3:**
```
git add scripts/deploy/lib_migrations.sh scripts/deploy/apply_required_migrations.sh scripts/deploy/reconcile_migrations.sh scripts/deploy/preflight_prod.sh database/migration_*_add_applied_by.sql
git commit -m "feat(001): core — lib, script refatorado, reconcile, preflight, migration applied_by"
```

Rodar toda suíte Fase 2; confirmar GREEN.

---

## Fase 4 — Integração

### T030: `_enforce-migration-dir.yml`
- **Ação:** workflow reutilizável (`on: workflow_call`). Lógica conforme plan Seção 5.3. Lê `.github/migration-dir-allowlist`. Falha com `::error::` e lista arquivos infratores se encontrar violação.
- **Arquivos:** `.github/workflows/_enforce-migration-dir.yml`.
- **Done:** `actionlint` passa; teste manual com fixture violadora falha corretamente.

### T031: `_lint-shell.yml`
- **Ação:** workflow reutilizável com `ludeeus/action-shellcheck@master` + `actionlint`. Exposto via `workflow_call`.
- **Arquivos:** `.github/workflows/_lint-shell.yml`.
- **Done:** `actionlint` passa.

### T032: `preflight-prod.yml`
- **Ação:** workflow em `pull_request` com `base: main`, `head: dev`, paths `database/**` ou `scripts/deploy/**`. Chama `preflight_prod.sh` e posta comentário no PR via `gh pr comment`.
- **Arquivos:** `.github/workflows/preflight-prod.yml`.
- **Done:** `actionlint` passa; gate de paths correto.

### T033: Refatorar `deploy-beta.yml` (PRIORITÁRIO — corrige ordem)
- **Ação:** separar em jobs:
  - `enforce-dir`: `uses: ./.github/workflows/_enforce-migration-dir.yml`;
  - `lint`: `uses: ./.github/workflows/_lint-shell.yml`;
  - `validate`: `header_contract.sh`;
  - `migrate`: SSH → `bash apply_required_migrations.sh docker-compose.beta.yml mesas-beta-db`. `needs: [enforce-dir, lint, validate]`;
  - `deploy-app`: SSH → `docker compose up -d --build mesas-beta-api mesas-beta-frontend`. `needs: migrate`;
  - `smoke`: health + tables + oauth. `needs: deploy-app`.
  Corrige ordem atual (app subia antes do gate).
- **Arquivos:** `.github/workflows/deploy-beta.yml`.
- **Done:** `actionlint` passa; lógica preservada; `needs` corretos.

### T034: Refatorar `deploy-prod.yml` (cosmético — ordem já correta)
- **Ação:** mesma estrutura de T033. Adicionar step em `migrate` que aceita `ALLOW_MANUAL_MIGRATIONS` via `workflow_dispatch` input.
- **Arquivos:** `.github/workflows/deploy-prod.yml`.
- **Done:** `actionlint` passa; inputs de dispatch documentados.

### T035: Refatorar `promote-to-prod.yml` (cosmético)
- **Ação:** mesma estrutura.
- **Arquivos:** `.github/workflows/promote-to-prod.yml`.
- **Done:** `actionlint` passa.

**Checkpoint Fase 4:**
```
git add .github/workflows/
git commit -m "feat(001): integration — workflows separados com defesa em profundidade do enforcer"
```

Push. Abrir PR dry-run contra `dev` para validar disparo dos workflows.

---

## Fase 5 — Polish

### T040: Normalizar localização de migrations órfãs
- **Ação:** baseado em `migrations-inventory.md` (T003), mover `.sql` fora de `./database/` para `./database/`, renomeando se necessário para manter numeração coerente. Atualizar inventário com estado final.
- **Arquivos:** movimentação; atualização de `migrations-inventory.md`.
- **Done:** `find . -name "migration_*.sql" -not -path "./database/*" -not -path "./.git/*" -not -path "./testes/*" -not -path "./specs/*"` retorna vazio (exceto `.bak`).

### T041: Adicionar cabeçalho em migrations existentes
- **Ação:** para cada `.sql` em `./database/`, adicionar cabeçalho. Classificação conservadora: `CREATE`, `ALTER ADD`, `CREATE INDEX` → `online-safe`; qualquer `DROP`, `ALTER DROP`, `TRUNCATE`, `DELETE` → `manual-risk`. Revisão humana obrigatória (não automatizar cegamente).
- **Arquivos:** todos `./database/migration_*.sql`.
- **Done:** `header_contract.sh` passa verde.

### T042: Reescrever `migrations_guide.md`
- **Ação:** reescrita. Conteúdo: propósito, cabeçalho obrigatório, como criar migration, fluxo padrão (commit→push→CI aplica), emergência (`reconcile_migrations.sh --mark-applied` obrigatório no mesmo procedimento), FAQ.
- **Arquivos:** `migrations_guide.md`.
- **Done:** sem instruções de aplicação manual como fluxo padrão; emergência com reconciliação inseparável.

### T043: Atualizar `OPERACAO_PRODUCAO.md`
- **Ação:** seção "GUIA COMPLETO DE MIGRATIONS" rebatizada `APÊNDICE A — EMERGÊNCIA APENAS`, com aviso no topo. **Adicionar passo 11** após o PASSO 10 existente: "11. **OBRIGATÓRIO: Reconciliar estado** — rodar `bash scripts/deploy/reconcile_migrations.sh --mark-applied <version> <compose> <db-service>` ANTES de `exit` do SSH. Sem este passo, o próximo deploy automatizado irá detectar drift e bloquear (comportamento esperado)." Seção 2 atualiza interface do script.
- **Arquivos:** `OPERACAO_PRODUCAO.md`.
- **Done:** drift com `migrations_guide.md` eliminado; reconciliação obrigatória documentada.

### T044: Atualizar `PRE_DEPLOY_CHECKLIST.md`
- **Ação:** Fase 1 adicionar: "Comentário do `preflight-prod` revisado; check `enforce-migration-dir` aprovado no PR". Remover referência a classificação manual em listas do script.
- **Arquivos:** `PRE_DEPLOY_CHECKLIST.md`.
- **Done:** checklist reflete novo gate.

### T045: Criar `docs/sdd/BRANCH_POLICY.md` (ou atualizar se existir)
- **Ação:** documentar pré-requisitos manuais de branch protection:
  - `dev`: PR obrigatório + check `enforce-migration-dir`.
  - `main`: PR obrigatório + checks `enforce-migration-dir` + `preflight-prod` (GO/ATTENTION).
  Incluir screenshots ou passos em Settings → Branches → Rules.
- **Arquivos:** `docs/sdd/BRANCH_POLICY.md` (criar ou atualizar).
- **Done:** arquivo existe com passos claros.

### T046: Adicionar entrada em `ERRORS_SOLUTIONS.md`
- **Ação:** nova entrada (próximo Exxx livre) — "Refactor do gate de migrations: fluxo manual substituído por CI. Ver `migrations_guide.md`. Emergência exige `reconcile_migrations.sh --mark-applied` obrigatório."
- **Arquivos:** `ERRORS_SOLUTIONS.md`.
- **Done:** entrada existe com título, contexto, sintoma anterior, nova solução, referências.

### T047: Criar `pr-description.md`
- **Ação:** gerar descrição do PR final:
  - resumo (problema + solução);
  - links para spec.md, plan.md, tasks.md, ADRs;
  - lista de arquivos tocados;
  - checklist de validação (smoke, preflight, shellcheck, enforcer);
  - **seção "Ações manuais pós-merge"** com passos 10.1.1-10.1.3 do plan (branch protections);
  - instruções de reconciliação inicial.
- **Arquivos:** `specs/001-gate-migrations-refactor/pr-description.md`.
- **Done:** arquivo pronto para `gh pr create --body-file`.

### T048: Remover `apply_required_migrations.sh.bak`
- **Ação:** após smoke verde em beta E confirmação de primeiro deploy-prod bem-sucedido com novo script, remover backup.
- **Arquivos:** deletar `.bak`.
- **Done:** arquivo removido; commit dedicado.

**Checkpoint Fase 5:**
```
git add database/ migrations_guide.md OPERACAO_PRODUCAO.md PRE_DEPLOY_CHECKLIST.md ERRORS_SOLUTIONS.md docs/sdd/BRANCH_POLICY.md specs/001-gate-migrations-refactor/
git commit -m "docs(001): polish — cabeçalhos, docs unificadas, reconciliação obrigatória em emergência"

# Só após smoke beta + primeiro deploy-prod OK:
git rm scripts/deploy/apply_required_migrations.sh.bak
git commit -m "chore(001): remove backup do script antigo após validação em prod"
```

---

## Checklist final (antes de abrir PR dev→main)

- [ ] Todos testes Fase 2 verdes.
- [ ] `shellcheck` passa em todos os scripts.
- [ ] `actionlint` passa em todos workflows.
- [ ] `header_contract.sh` passa em todas migrations.
- [ ] Enforcer testado com fixture violadora (e revertida).
- [ ] Deploy beta rodou com script novo; bootstrap aplicou.
- [ ] Reconciliação de beta executada (baseline).
- [ ] `preflight-prod` testado em PR dry-run.
- [ ] Branch protection em `dev` ativada.
- [ ] Branch protection em `main` configurada (ativar pós-merge).
- [ ] `PRE_DEPLOY_CHECKLIST.md` Fase 1 completa.
- [ ] Backup de prod confirmado (< 60 min).
- [ ] Diff revisado por humano.
- [ ] PR aberto com `pr-description.md`.

---

## Critério de DONE da feature

1. Commits existem na branch: `feat(001): setup`, `feat(001): tests red`, `feat(001): core`, `feat(001): integration`, `docs(001): polish`, `chore(001): remove backup`.
2. PR dev→main aberto com comentário do `preflight-prod` em status `GO`.
3. Branch protections ativadas em `dev` e `main`.
4. Merge autorizado explicitamente pelo mantenedor.
5. Deploy-prod pós-merge completa com `[migrations] schema em conformidade para runtime.`.
6. Smoke de prod verde conforme `OPERACAO_PRODUCAO.md` seção 10.5.
7. Entrada em `ERRORS_SOLUTIONS.md` registrada.
