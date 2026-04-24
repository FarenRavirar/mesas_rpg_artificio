# PLAN: Refatoração do Gate de Migrations dev→prod

**Spec:** ./spec.md
**Status:** rascunho — decisões consolidadas

---

## 1. Stack específica desta feature

Herda de `constitution.md`. Diferenças:

- Script principal: **bash 5+**.
- Sem nova dependência Node/Python. `sha256sum` via coreutils.
- Parsing de cabeçalho: `grep` + `awk` puros.
- Validação via `shellcheck` (`ludeeus/action-shellcheck@master`).
- Validação de workflows via `actionlint`.

---

## 2. Arquivos que serão criados

- `database/README.md` — especificação do cabeçalho, convenção de nomes, exemplos de cada classe.
- `database/migration_NNN_add_applied_by.sql` — adiciona coluna `applied_by TEXT` em `schema_migrations`. Número NNN = próximo disponível no momento da implementação. **Não inclui `checksum`** (fase posterior).
- `scripts/deploy/lib_migrations.sh` — biblioteca bash com funções: `parse_header`, `validate_sql_against_class`, `list_pending_by_set_diff`, `acquire_lock`, `release_lock`.
- `scripts/deploy/preflight_prod.sh` — SSH read-only em beta e prod, gera relatório Markdown comparando cada ambiente contra sua branch-alvo.
- `scripts/deploy/reconcile_migrations.sh` — subcomandos `--list` e `--mark-applied <version>`.
- `.github/workflows/_enforce-migration-dir.yml` — workflow reutilizável. Lê `.github/migration-dir-allowlist`. Falha se encontrar `migration_*.sql` fora dos paths permitidos.
- `.github/workflows/preflight-prod.yml` — dispara em `pull_request base: main, head: dev`.
- `.github/workflows/_lint-shell.yml` — workflow reutilizável `shellcheck` + `actionlint`.
- `.github/migration-dir-allowlist` — arquivo texto, uma linha por path permitido. Proposta inicial:
  ```
  ./database/
  ./testes/deploy/fixtures/
  ./specs/**/fixtures/
  ```
- `testes/deploy/lib_migrations.bats` — testes bats-core (se Fase A aprovou TDAD).
- `testes/deploy/header_contract.sh` — varre `./database/migration_*.sql` validando cabeçalho.
- `testes/deploy/integration_apply.sh` — teste de integração com postgres descartável.
- `testes/deploy/fixtures/*.sql` — 6-8 fixtures cobrindo casos válidos e inválidos.
- `specs/001-gate-migrations-refactor/adr-001-metadata-no-header.md` — decisão de mover classificação para cabeçalho.
- `specs/001-gate-migrations-refactor/adr-002-forward-only.md` — forward-only permanece.
- `specs/001-gate-migrations-refactor/adr-003-canonical-dir-stays-database.md` — decisão de manter `./database` (não migrar para `database/migrations/`).
- `specs/001-gate-migrations-refactor/adr-004-checksum-out-of-scope.md` — checksum fica para fase posterior.
- `specs/001-gate-migrations-refactor/migrations-inventory.md` — inventário inicial de arquivos `.sql` no repo.
- `specs/001-gate-migrations-refactor/pr-description.md` — gerado ao final para `gh pr create --body-file`.

---

## 3. Arquivos que serão modificados

- `scripts/deploy/apply_required_migrations.sh` — reescrita. Assinatura mantida `$1 compose-file $2 db-service`. Internamente `source lib_migrations.sh`, classificação via cabeçalho, `list_pending` via set-diff contra `schema_migrations`.
- `.github/workflows/deploy-beta.yml` — **refatoração estrutural prioritária**. Separar em jobs: `enforce-dir` (chama reutilizável) → `validate` → `migrate` → `deploy-app` → `smoke`. Corrige ordem atual (app subia antes do gate).
- `.github/workflows/deploy-prod.yml` — refatoração cosmética. Ordem atual já correta (DB→migrate→app). Separação serve para uniformidade com beta e adição do `enforce-dir` como primeiro step.
- `.github/workflows/promote-to-prod.yml` — refatoração cosmética, mesmo padrão.
- `migrations_guide.md` — reescrita parcial. Documenta cabeçalho, fluxo automatizado, emergência com reconciliação obrigatória.
- `OPERACAO_PRODUCAO.md` — seção "GUIA COMPLETO DE MIGRATIONS" vira `APÊNDICE A — EMERGÊNCIA APENAS`. Obrigação explícita de `reconcile_migrations.sh --mark-applied` como passo 11 (pós-aplicação, pré-exit do SSH). Seção 2 atualiza interface do script.
- `PRE_DEPLOY_CHECKLIST.md` — adicionar na Fase 1: "Comentário do `preflight-prod` revisado e check `enforce-migration-dir` aprovado". Remover referência à classificação manual nas listas do script.
- `ERRORS_SOLUTIONS.md` — entrada nova (próximo Exxx disponível) documentando incidente recorrente e solução.
- Arquivos `.sql` existentes em `./database/` — adicionar cabeçalho em cada.
- Arquivos `.sql` órfãos em `backend/src/db/migrations/` (se existirem, confirmar via T003) — mover para `./database/` e adicionar cabeçalho.

---

## 4. Arquivos que NÃO serão tocados

**Código de aplicação:**
- Todo `backend/src/` exceto `.sql` de migration órfãos.
- Todo `frontend/`.
- `docker-compose.beta.yml` e `docker-compose.prod.yml`.

**Infra e configuração:**
- `/opt/mesas-beta/.env` e `/opt/mesas/.env` na VM.
- Cloudflare Tunnel config.
- `.agents/`, `.cline*`, `.cursorrules`, `.gemini/`, `.vscode/`.

**MDs canônicos além dos listados em Seção 3:**
- `AGENTS.md` — **proibido editar**.
- `.specify/arquiteture.md`.
- `BACKLOG_OPERACIONAL.md`.
- `FILA_IMPLEMENTACAO.md`.
- `DOCS_AGENT.md`.
- `RESUMO_EXECUCAO.md`.
- `MAPA_DE_API.md`.

---

## 5. Contratos

### 5.1 Cabeçalho de migration

Primeiras 20 linhas de todo `.sql`:

```sql
-- migration_NNN_descricao_snake_case.sql
-- @class: online-safe | manual-risk
-- @requires-backup: true | false
-- @author: <identificador>
-- @created: YYYY-MM-DD
-- @description: <uma linha>
```

Regras:
- Ordem livre, mas todos obrigatórios.
- `@requires-backup: true` implica `@class: manual-risk` — cruzar e rejeitar divergência.
- `@class: online-safe` com SQL contendo palavras destrutivas (`DROP`, `TRUNCATE`, `DELETE FROM`, `ALTER TYPE.*DROP`) é rejeitado.
- Comentários `-- DROP ...` dentro do SQL são strippados antes da verificação.

### 5.2 `apply_required_migrations.sh`

**Entrada:**
- `$1`: compose file (ex: `docker-compose.prod.yml`).
- `$2`: serviço de DB (ex: `mesas-db`).

**Variáveis de ambiente:**
- `ALLOW_MANUAL_MIGRATIONS` (default `false`).
- `REQUIRE_PROD_BACKUP_FOR_MANUAL` (default `true` em prod).
- `PROD_BACKUP_FILE` (obrigatório se `manual-risk` em prod).
- `LOCK_TIMEOUT_MS` (default `30000`).
- `STATEMENT_TIMEOUT_MS` (default `600000`).
- `MAX_AUTO_PENDING` (default `5`).
- `FORCE_LOCAL_RUN` (default `false` — requerido para rodar localmente apontando prod).

**Saída:**
- Exit `0`: schema em conformidade.
- Exit `1`: falha de validação (cabeçalho, drift, duplicata).
- Exit `2`: falha de execução SQL.
- Exit `3`: bloqueio por política (manual-risk sem autorização, backup ausente).
- Exit `4`: lock não adquirido em timeout.
- Stdout: logs com prefixo `[migrations]`.
- Última linha em sucesso: `[migrations] schema em conformidade para runtime.` (compatibilidade com grep existente).

### 5.3 `_enforce-migration-dir.yml`

**Invocação:**
- Como step em `pull_request` contra `dev` ou `main`.
- Como primeiro step de `deploy-beta.yml`, `deploy-prod.yml`, `promote-to-prod.yml`.

**Lógica:**
```bash
ALLOWLIST=$(cat .github/migration-dir-allowlist | grep -v '^#' | grep -v '^$')
FIND_EXCLUDES=""
while IFS= read -r path; do
  FIND_EXCLUDES+=" -not -path \"${path}*\""
done <<< "$ALLOWLIST"

VIOLATIONS=$(eval find . -name \"migration_*.sql\" $FIND_EXCLUDES -not -path \"./.git/*\" -not -path \"./node_modules/*\")

if [ -n "$VIOLATIONS" ]; then
  echo "::error::migration_*.sql fora do canônico:"
  echo "$VIOLATIONS"
  exit 1
fi
```

**Exit:**
- `0`: nenhuma violação.
- `1`: violação encontrada, arquivos nomeados no output.

### 5.4 `preflight-prod.yml`

**Trigger:** `pull_request` com `base: main` e `head: dev`, paths `database/**` ou `scripts/deploy/**`.

**Lógica:**
- SSH em beta (read-only): `SELECT version FROM schema_migrations ORDER BY version;`
- SSH em prod (read-only): mesma query.
- Listar arquivos em HEAD simulado pós-merge de `main`.
- Comparar: versions em disco pós-merge vs versions em `schema_migrations` de prod (gate técnico).
- Relatório adicional informativo: versions em beta vs disco de `dev` atual.

**Output:** comentário no PR com:
- Versão do PG em beta e prod.
- Set-diff prod vs HEAD(main pós-merge) — **bloqueante se I2**.
- Set-diff beta vs HEAD(dev) — informativo.
- Set-diff beta vs prod — informativo (explica cenário `main à frente de dev`).
- Status: `GO` / `BLOCKED` / `ATTENTION`.

**Secrets:** `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `DB_CONTAINER_PROD`, `DB_CONTAINER_BETA`, `DB_USER`, `DB_NAME`.

### 5.5 `reconcile_migrations.sh`

**Subcomandos:**
- `--list <compose-file> <db-service>`: lista estado atual.
- `--mark-applied <version> <compose-file> <db-service>`: insere em `schema_migrations` sem rodar SQL.

**Proteções:**
- Em produção sem `--force`: recusa.
- Se `version` já existe em `schema_migrations`: idempotente com log explícito `SKIP — already present`; exit code 0.
- Registra `applied_by = "reconcile:$(whoami)@$(hostname)"`.

---

## 6. Mudanças de schema

### Migration `migration_NNN_add_applied_by.sql`

```sql
-- migration_NNN_add_applied_by.sql
-- @class: online-safe
-- @requires-backup: false
-- @author: sdd-001-refactor
-- @created: YYYY-MM-DD
-- @description: Adiciona coluna applied_by em schema_migrations para rastreabilidade.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE schema_migrations
  ADD COLUMN IF NOT EXISTS applied_by TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='schema_migrations' AND column_name='applied_by'
  ) THEN
    RAISE EXCEPTION 'migration falhou: applied_by não criada';
  END IF;
  RAISE NOTICE 'schema_migrations.applied_by: ok';
END $$;
```

**NÃO inclui `checksum`**: essa coluna fica para feature posterior.

### Reconciliação inicial (operação única, fora do fluxo)

Antes do primeiro deploy com novo script, mantenedor roda em ambos os ambientes:

```bash
# Listar estado atual
bash scripts/deploy/reconcile_migrations.sh --list <compose> <db-service>

# Marcar baseline
bash scripts/deploy/reconcile_migrations.sh --mark-applied <v1> <compose> <db-service>
bash scripts/deploy/reconcile_migrations.sh --mark-applied <v2> <compose> <db-service>
# ... uma chamada por version ou loop
```

Isso zera o drift histórico sem tocar em dados.

---

## 7. Impacto em frontend

Nenhum.

---

## 8. Testes

### 8.1 Unitários (bats-core, conforme Fase A)

- `testes/deploy/lib_migrations.bats`:
  - `parse_header` extrai campos obrigatórios; rejeita ausente; rejeita `@class` inválido; rejeita coerência `@requires-backup: true` + `@class: online-safe`.
  - `validate_sql_against_class` aceita `online-safe` + CREATE; rejeita `online-safe` + DROP/TRUNCATE/DELETE; aceita `manual-risk` + DROP; ignora destrutivos em comentários.
  - `list_pending_by_set_diff` retorna diferença correta; detecta I2 (banco tem version ausente do disco).

### 8.2 Integração (docker compose real)

- `testes/deploy/integration_apply.sh`:
  - Postgres descartável via `docker run --rm postgres:15`.
  - Bootstrap aplica.
  - Fixture `online-safe` aplica e registra em `schema_migrations`.
  - Segunda execução não reaplica (idempotente).
  - Fixture `manual-risk` bloqueia sem `ALLOW_MANUAL_MIGRATIONS`.
  - Com `ALLOW_MANUAL_MIGRATIONS=true` + `PROD_BACKUP_FILE` válido, aplica.
  - Fixture sem cabeçalho bloqueia em `validate`.
  - Fixture `online-safe` com `DROP TABLE` bloqueia em `validate`.
  - Drift simulado (version em banco ausente do disco) bloqueia.

### 8.3 Contract test do cabeçalho

- `testes/deploy/header_contract.sh`: varre `./database/migration_*.sql`, valida cada. Rodado no CI em job `validate`.

### 8.4 Enforcer

- Teste manual em PR dry-run: criar `testes/tmp_violation/migration_999.sql` fora do allowlist → CI deve falhar. Commit reverso para não versionar o arquivo.

### 8.5 Smoke pós-deploy

- Reutiliza validação existente do `OPERACAO_PRODUCAO.md` seção 10.5.

---

## 9. Observabilidade

- Logs do script: prefixo `[migrations]` mantido.
- Novo log estruturado: `[migrations] <level> <version> <message>`.
- Comentário de `preflight-prod` no PR é canal primário pré-deploy.

---

## 10. Rollout

### 10.1 Pré-requisitos manuais (fora do código)

Antes de mergear esta feature:

1. **Ativar branch protection em `dev`:** Settings → Branches → Rules → `dev`:
   - Require a pull request before merging: ON.
   - Required status checks: `enforce-migration-dir`.
2. **Ativar branch protection em `main`:** mesmo padrão, com checks adicionais:
   - `enforce-migration-dir`.
   - `preflight-prod` (status `GO` ou `ATTENTION` aprovado; `BLOCKED` barra).
3. Documentar essas configurações em `docs/sdd/BRANCH_POLICY.md`.

Sem esses três passos, a Opção A (enforcer em PR) fica frágil — item documentado no PR final.

### 10.2 Ordem de aplicação

1. Feature implementada em branch `001-gate-migrations-refactor`.
2. PR contra `dev`. `enforce-migration-dir` roda. Testes passam.
3. Merge em `dev`. Deploy-beta roda com novo script.
4. Rodar `reconcile_migrations.sh --mark-applied` em beta para baseline.
5. Abrir PR dev→main. `preflight-prod` posta comentário.
6. Reconciliar prod se drift herdado.
7. Ativar branch protections (passos 10.1.1 e 10.1.2).
8. Merge. Deploy-prod roda.
9. Primeiro deploy limpo com novo fluxo.

### 10.3 Feature flag

Não aplicável.

### 10.4 Plano de rollback

Se script novo falhar em prod no primeiro run:

1. `gh workflow disable "Deploy Production"`.
2. Reverter merge via PR revert.
3. Restaurar `scripts/deploy/apply_required_migrations.sh.bak` (mantido até T047).
4. Re-habilitar workflow.
5. Registrar em `ERRORS_SOLUTIONS.md`.

Migrations já aplicadas permanecem (forward-only). `schema_migrations` permanece.

---

## 11. ADRs

### ADR-001: Metadados no cabeçalho do SQL
- **Contexto:** listas paralelas em shell são fonte crônica de esquecimento; script atual usa listas `ONLINE_SAFE_MIGRATIONS` e `MANUAL_RISK_MIGRATIONS`.
- **Escolhido:** cabeçalho dentro do `.sql`.
- **Rejeitado:** YAML paralelo por migration, banco separado de metadados, convenção de nome-de-arquivo.
- **Motivo:** manter fonte única; evitar esquecer de atualizar lista; evitar adicionar dependências.
- **Consequências:** toda migration precisa de cabeçalho; gate de validação passa a ser obrigatório.

### ADR-002: Forward-only
- **Contexto:** migrations up/down adicionam complexidade e raramente são usadas corretamente.
- **Escolhido:** forward-only; correção = migration nova.
- **Rejeitado:** pares up/down.
- **Motivo:** down em produção com dados reais é mais arriscado que migration corretiva nova.
- **Consequências:** disciplina de imutabilidade pós-aplicação.

### ADR-003: Canônico permanece `./database`
- **Contexto:** script atual usa `MIGRATIONS_DIR="./database"`. Subir para `database/migrations/` exige migração de arquivos + atualização do script + bootstrap + reconciliação no mesmo ciclo.
- **Escolhido:** manter `./database` nesta feature.
- **Rejeitado:** migrar para `database/migrations/`.
- **Motivo:** reduzir superfície de mudança; estabilizar gate antes de reorganizar layout.
- **Consequências:** reorganização vira ADR futura, independente desta feature.

### ADR-004: Checksum fora de escopo
- **Contexto:** validação de checksum (I7 da spec v2) requer coluna `checksum` em `schema_migrations` que não existe.
- **Escolhido:** adicionar apenas `applied_by` nesta feature; `checksum` fica para fase posterior.
- **Rejeitado:** incluir `checksum` aqui.
- **Motivo:** backfill de checksum em migrations pré-existentes é trabalho próprio; combinar com esta refatoração aumenta risco.
- **Consequências:** detecção de "migration modificada pós-aplicação" fica para feature 002 ou posterior.

---

## 12. Review Gate

- [ ] Plano revisado pelo mantenedor
- [ ] Sem conflito com MDs canônicos (Seção 4 respeitada)
- [ ] ADRs 001-004 revisadas
- [ ] Contrato do cabeçalho aprovado
- [ ] Contrato do enforcer aprovado
- [ ] Allowlist inicial aprovada
- [ ] Estratégia de reconciliação aprovada
- [ ] Pré-requisitos manuais (branch protection) entendidos
- [ ] Plano de rollback aprovado
- [ ] Aprovação explícita antes de `/speckit.tasks`
