# Feature 001: Migration Governance Pipeline

## Sumário

Esta feature implementa um sistema completo de governança de migrations SQL para o projeto Mesas RPG, eliminando drift entre código e schema através de gates automatizados, classificação de risco e reconciliação transacional.

O pipeline introduz três camadas de proteção: (1) enforcer de diretório canônico que bloqueia migrations fora de `database/`, (2) gate de aplicação que detecta drift I2/I3/I5 e bloqueia deploy até reconciliação, e (3) preflight de produção que valida estado do schema antes de merge em `main`. Migrations são classificadas por header (`@class: online-safe` ou `manual-risk`) e operações destrutivas exigem autorização explícita via `workflow_dispatch` com backup validado.

A feature resolve incidentes recorrentes de hotfixes manuais não reconciliados, migrations aplicadas fora de ordem, e dessincronia entre ambientes beta/prod que causavam falhas de deploy e regressões de schema.

## Motivação

**Incidentes que motivaram a feature:**

- **Drift I2 (hotfix manual sem reconciliação):** Migrations aplicadas via SSH em produção para corrigir incidentes urgentes, mas arquivo `.sql` não commitado no repositório. Deploy posterior falhava ao detectar entrada em `schema_migrations` sem arquivo correspondente no disco.

- **Drift I3 (manual-risk não autorizado):** Migrations destrutivas (`DROP TABLE`, `ALTER COLUMN TYPE`) aplicadas sem backup prévio, causando perda de dados e necessidade de restore emergencial.

- **Drift I5 (dessincronia dev/main):** Features mergeadas em `dev` sem promoção subsequente para `main`, ou hotfixes aplicados em `main` sem backport para `dev`, causando divergência de schema entre ambientes.

- **Falta de gate de qualidade:** Deploy automático aplicava qualquer migration sem validação de risco, classificação ou estado do banco, fragilizando a estabilidade do sistema.

**Objetivo:** Estabelecer protocolo SDD (Spec-Driven Development) para migrations com fail-closed behavior, rastreabilidade completa e prevenção de drift operacional.

## Mudanças por Fase

### Fase 1: Fundação e Tabela de Controle

**Commits:** `b62399d`

- Criação da tabela `schema_migrations` (migration_name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ)
- Implementação de `lib_migrations.sh` com funções core: `list_pending_by_set_diff`, `apply_migration_transactional`, `validate_migration_header`
- Testes unitários BATS (12 testes) cobrindo lógica de set diff, validação de header e aplicação transacional

### Fase 2: Core Scripts e Reconciliação

**Commits:** `22c2285`

- Script `apply_required_migrations.sh` com lógica de drift detection (I2/I3/I5)
- Script `reconcile_migrations.sh` com subcomandos `--list` e `--mark-applied` para reconciliação de hotfixes
- Workflow `preflight-prod.yml` que detecta drift antes de merge em `main` e posta relatório no PR
- Adição de coluna `applied_by` em `schema_migrations` para rastreabilidade

### Fase 3: Workflows e Enforcer

**Commits:** `a52feeb`

- Workflow `enforce-migration-dir.yml` que bloqueia PRs com migrations fora de `database/`
- Refatoração de `deploy-beta.yml` e `deploy-prod.yml` para integração com gate de migrations
- Validação de nomenclatura (`migration_NNN_*.sql`) e estrutura de diretório

### Fase 4: Classificação de Risco e Flags

**Commits:** `d063124`

- Classificação por header: `@class: online-safe` (aplicação automática) vs `@class: manual-risk` (requer autorização)
- Exit codes específicos: 0 (sucesso), 1 (erro técnico), 2 (drift I2), 3 (manual-risk bloqueado), 4 (drift I5)
- Flags de controle: `ALLOW_MANUAL_MIGRATIONS`, `PROD_BACKUP_FILE`, `REQUIRE_PROD_BACKUP_FOR_MANUAL`
- Aplicação retroativa de headers em migrations legadas

### Fase 5: Testes de Integração Remota

**Commits:** `ff66371`, `57924ee`

- Suite de integração `integration_apply.sh` com 6 cenários: online-safe, manual-risk bloqueado, drift I2, reconciliação, múltiplas migrations, rollback
- Fixtures Docker Compose efêmeros para PostgreSQL isolado
- Validação de exit codes, mensagens de erro e estado transacional

### Governance e Documentação

**Commits:** `dcbab9c`, `25b5662`, `c737208`, `5163cfd`, `5ea5bfd`, `c01474d`, `ef00c78`, `b8de85a`, `6541f46`, `41894a7`, `7e8c934`, `b75111f`, `3014f93`, `2f8e656`, `1f9d315`

- `migrations_guide.md` — Guia completo de classificação, aplicação e reconciliação
- `OPERACAO_PRODUCAO.md` §11 — Passo obrigatório de reconciliação manual após hotfix
- `PRE_DEPLOY_CHECKLIST.md` — Validação de migrations, backup e flags de risco
- `docs/sdd/BRANCH_POLICY.md` — Política de branches SDD e branch protection
- `ERRORS_SOLUTIONS.md` E151/E152/E153 — Drift I2, manual-risk bloqueado, drift I5
- `ambiente_atual_mesas.md` — Arquitetura da feature 001 (scripts, workflows, flags, tabela de controle)
- `docs/sdd/SESSION_FAILURES_REGISTRY.md` — 14 falhas processuais calibradas (F01-F14)
- `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md` — Gatilhos de bloqueio imediato
- `docs/sdd/analyze-governance-gate.md` — Gate de /speckit.analyze

### Fix Técnico: Stdin Drain

**Commits:** `402ba05`

- Correção de bug crítico: `docker compose exec` em heredoc SSH drenava stdin, causando falha silenciosa em loops
- Solução: injeção de `< /dev/null` em todos os `docker compose exec` dentro de scripts remotos
- Correção de captura de exit code em subshells (process substitution mascarava falhas)
- Registro de falha processual F16 em `SESSION_FAILURES_REGISTRY.md`

### Suporte a MIGRATIONS_DIR

**Commits:** `ecace26`

- Honrar variável de ambiente `MIGRATIONS_DIR` em `apply_required_migrations.sh` e `reconcile_migrations.sh`
- Permitir override do diretório canônico para testes e ambientes não-padrão

## Gates de Qualidade Implementados

1. **Enforcer de diretório:** Bloqueia PRs com migrations fora de `database/` ou com nomenclatura incorreta
2. **Preflight de produção:** Detecta drift I2/I3/I5 antes de merge em `main` e posta relatório no PR
3. **Classificação por header:** Migrations `manual-risk` exigem autorização explícita e backup validado
4. **Reconciliação transacional:** Ferramenta `reconcile_migrations.sh` para marcar hotfixes sem reexecutar SQL
5. **Fail-closed behavior:** Deploy aborta em caso de drift, manual-risk não autorizado ou erro de aplicação

## Testing Evidence

**Testes unitários (BATS):**
- 12/12 testes GREEN
- Cobertura: set diff, validação de header, aplicação transacional, rollback, múltiplas migrations

**Testes de integração (remota via SSH):**
- 6/6 cenários GREEN
- Cobertura: online-safe, manual-risk bloqueado, drift I2, reconciliação, múltiplas migrations, rollback
- Validação de exit codes, mensagens de erro e estado de `schema_migrations`

**Correções técnicas validadas:**
- Fix de stdin drain: `docker compose exec` com `< /dev/null` em 5 arquivos (scripts e testes)
- Fix de exit code capture: substituição de process substitution por variável intermediária em `apply_required_migrations.sh`

## Checklist Pós-Merge

### Ativação de Branch Protection

Após merge em `main`, ativar manualmente no GitHub (ver `docs/sdd/BRANCH_POLICY.md`):

**Proteções para `main`:**
- [ ] Require pull request reviews before merging (1 aprovação mínima)
- [ ] Require status checks to pass before merging:
  - [ ] `preflight-prod` (workflow `preflight-prod.yml`)
  - [ ] `ci` (workflow `ci.yml`)
  - [ ] `deploy-prod` (workflow `deploy-prod.yml`)
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above settings
- [ ] Restrict who can push to matching branches (apenas mantenedores)

**Proteções para `dev`:**
- [ ] Require status checks to pass before merging:
  - [ ] `deploy-beta` (workflow `deploy-beta.yml`)
- [ ] Allow force pushes (desabilitado)

### Reconciliação Inicial

- [ ] Executar `reconcile_migrations.sh --list` em beta e prod para validar estado inicial
- [ ] Se houver drift detectado, reconciliar manualmente antes de primeiro deploy pós-merge

### Limpeza de Artefatos

- [ ] **T048:** Remover `scripts/deploy/apply_required_migrations.sh.bak` (arquivo de backup temporário criado durante desenvolvimento)

## Referências

- **Spec:** `specs/001-gate-migrations-refactor/spec.md`
- **Plan:** `specs/001-gate-migrations-refactor/plan.md`
- **Tasks:** `specs/001-gate-migrations-refactor/tasks.md`
- **Handoff:** `docs/sdd/handoff-sdd-001-2026-04-20.md`
- **Sessões:** `sessoes/26-04-20_1_sdd-governance-setup.md`, `sessoes/26-04-21_1_fix-stdin-drain.md`
