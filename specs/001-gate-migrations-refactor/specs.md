# SPEC: Refatoração do Gate de Migrations dev→prod

**ID:** 001
**Branch:** 001-gate-migrations-refactor
**Status:** rascunho — decisões consolidadas após duas rodadas de review do Codex
**Origem:** Dor operacional recorrente (E143, E144, E145, E150) + drift entre `migrations_guide.md` e `OPERACAO_PRODUCAO.md`.

---

## 1. Intenção

O gate atual (`apply_required_migrations.sh`) tem fail-closed válido dentro do diretório canônico (`./database`): migration nova sem classificação nas listas `ONLINE_SAFE_MIGRATIONS` / `MANUAL_RISK_MIGRATIONS` bloqueia o deploy. A proteção falha em três vetores específicos:

1. **Migration criada fora de `./database`.** Quem seguir o procedimento do `OPERACAO_PRODUCAO.md` (que documenta `backend/src/db/migrations/`) cria o arquivo num lugar que o script não enxerga.
2. **Aplicação manual via SSH no beta** como fluxo oficial. Bypassa `schema_migrations` e gera drift silencioso.
3. **Ordem de deploy no beta**: app sobe antes do gate de migration rodar (`deploy-beta.yml` linha 87 vs 101).

Refatoração elimina os três: enforcer de diretório no CI (fecha #1), documentação consolidada + emergência com reconciliação obrigatória (fecha #2), separação em jobs no `deploy-beta.yml` (fecha #3).

**Escopo confirmado:**
- Canônico permanece `./database` (não migrar para subdiretório nesta feature).
- `deploy-prod.yml` e `promote-to-prod.yml` recebem refatoração cosmética (ordem já correta).
- Checksum de migration fica **fora** desta feature (requer coluna nova em `schema_migrations` — fase posterior).
- Classificação migra de listas em shell para cabeçalho no `.sql`.

---

## 2. User stories

- Como mantenedor, quero que `git push origin dev` aplique migrations novas no beta automaticamente, para eliminar SSH manual do fluxo padrão.
- Como mantenedor, quero que qualquer arquivo `.sql` de migration fora de `./database/` (exceto allowlist) seja detectado pelo CI e bloqueie o PR, para impossibilitar criação no lugar errado.
- Como mantenedor, quero ver antes do merge dev→main quais migrations serão aplicadas em prod via comparação por conjunto de `version`, para detectar drift real antes do deploy.
- Como mantenedor, quero que migrations de risco (`manual-risk`) bloqueiem o deploy exigindo autorização explícita com backup, para proteger a produção contra distrações.
- Como agente de IA operando deploy, quero um único diretório canônico e um enforcer de CI que imponha isso, para nunca mais decidir entre `database/` e `backend/src/db/migrations/`.
- Como mantenedor, quero que a classificação esteja no cabeçalho do `.sql`, não em lista paralela em shell, para eliminar a fonte secundária de verdade.
- Como mantenedor, quero que aplicação manual de emergência exija `reconcile_migrations.sh --mark-applied` no mesmo procedimento, para impedir que emergências recriem o drift que motivou esta refatoração.

---

## 3. Critérios de aceitação (GEARS)

### Invariantes (o sistema deve)

- O sistema deve armazenar migrations apenas em `./database/`.
- O sistema deve exigir cabeçalho de metadados (`@class`, `@requires-backup`, `@author`, `@created`, `@description`) em todo arquivo de migration.
- O sistema deve registrar toda migration aplicada na tabela `schema_migrations` de cada ambiente, incluindo coluna `applied_by`.
- O sistema deve classificar migrations em exatamente uma de duas classes: `online-safe` ou `manual-risk`.
- O sistema deve comparar migrations por conjunto de `version` (set-diff), nunca por contagem.
- O sistema deve avaliar conformidade de cada ambiente contra o HEAD da branch que o alimenta (beta contra `dev`, prod contra `main`), nunca beta contra prod diretamente.

### Eventos (quando X, o sistema deve Y)

- Quando `apply_required_migrations.sh` iniciar, o sistema deve ler `schema_migrations` do banco-alvo e listar arquivos em `./database/migration_*.sql` ordenados por número.
- Quando houver `version` em disco ausente em `schema_migrations`, o sistema deve ler o cabeçalho, validar, e decidir aplicar ou bloquear conforme a classe.
- Quando uma migration for aplicada com sucesso, o sistema deve inserir `INSERT INTO schema_migrations (version, applied_at, applied_by)` na mesma transação do SQL aplicado.
- Quando um PR de `dev` para `main` for aberto, o sistema deve rodar `preflight-prod` comparando `schema_migrations` de prod com HEAD pós-merge de `main`, e postar comentário no PR listando o que será aplicado.
- Quando o deploy de beta iniciar, o sistema deve executar na ordem: `enforce-dir` → `validate` → `migrate` → `deploy-app` → `smoke`. Cada job só dispara se o anterior retornar exit code 0.
- Quando qualquer workflow de deploy iniciar, o sistema deve rodar `enforce-migration-dir` como primeiro step, antes de qualquer migração ou rebuild de container.
- Quando um PR for aberto contra `dev` ou `main`, o sistema deve rodar `enforce-migration-dir` como check obrigatório antes de permitir merge.
- Quando uma migration for aplicada manualmente em emergência, o procedimento documentado deve exigir execução imediata de `reconcile_migrations.sh --mark-applied <version>` na mesma sessão SSH.

### Estados (enquanto X, o sistema deve Y)

- Enquanto houver migration `manual-risk` pendente e `ALLOW_MANUAL_MIGRATIONS` não for `true`, o sistema deve bloquear o deploy com exit code não-zero e mensagem clara.
- Enquanto o ambiente for produção e houver `manual-risk` liberada via `ALLOW_MANUAL_MIGRATIONS=true`, o sistema deve exigir `PROD_BACKUP_FILE` apontando para dump `.sql` com tamanho > 0 bytes e mtime dentro dos últimos 60 minutos.
- Enquanto o script estiver rodando, o sistema deve manter um `pg_advisory_lock` para impedir execução concorrente.

### Indesejados (se X, o sistema deve Y)

**I1 — Enforcer de diretório (primeiro critério crítico):**
- Se existir arquivo `migration_*.sql` fora de `./database/` em qualquer path do repositório não listado em `.github/migration-dir-allowlist`, o sistema deve bloquear o CI antes de qualquer step de deploy ou merge.

**I2 — Drift por conjunto:**
- Se o conjunto de `version` em `schema_migrations` do ambiente contiver entrada ausente do conjunto de arquivos em `./database/` **na branch-alvo daquele ambiente** (beta contra `dev`, prod contra `main`), o sistema deve bloquear o deploy e listar nominalmente cada divergência — sem depender de contagem.

**I3 — Cabeçalho inválido:**
- Se uma migration em disco não tiver cabeçalho válido (falta `@class`, `@requires-backup`, `@author`, ou `@class` com valor fora de `{online-safe, manual-risk}`), o sistema deve bloquear o deploy antes de aplicar qualquer SQL.

**I4 — Duplicata:**
- Se duas migrations com o mesmo número existirem em `./database/`, o sistema deve bloquear o deploy no step `validate`.

**I5 — Classificação divergente do conteúdo:**
- Se o cabeçalho declarar `@class: online-safe` mas o SQL (após remover comentários) contiver `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM`, `ALTER TYPE ... DROP VALUE`, o sistema deve bloquear e sinalizar "classificação incorreta".

**I6 — Coerência de `@requires-backup`:**
- Se o cabeçalho declarar `@requires-backup: true` mas `@class: online-safe`, o sistema deve rejeitar — `requires-backup` implica `manual-risk`.

**I7 — Falha em meio de execução:**
- Se uma migration falhar no meio da execução, o sistema deve NÃO registrar em `schema_migrations` e abortar imediatamente (roll-back).

**I8 — Emergência sem reconciliação:**
- Se o procedimento de emergência manual for executado e `reconcile_migrations.sh --mark-applied` não for chamado na mesma sessão, o próximo deploy automatizado irá detectar drift via I2 e bloquear — esta é consequência desejada, não bug.

---

## 4. Escopo

### Dentro

- Manter `./database` como diretório canônico de migrations (não migrar para subdiretório).
- Criar `./database/README.md` com especificação do cabeçalho obrigatório, convenção de nomes, exemplos.
- Adicionar cabeçalho em todas as migrations existentes em `./database/`, com revisão humana da classificação.
- **Migrar arquivos `.sql` órfãos** (se houver em `backend/src/db/migrations/` ou outros paths) para `./database/`, documentando origem em `migrations-inventory.md`.
- Refatorar `scripts/deploy/apply_required_migrations.sh`: eliminar listas `ONLINE_SAFE_MIGRATIONS` / `MANUAL_RISK_MIGRATIONS` embutidas; ler classificação do cabeçalho do `.sql`.
- Implementar `list_pending` via set-diff (não contagem).
- Migration bootstrap `migration_NNN_add_applied_by.sql` adicionando coluna `applied_by` em `schema_migrations` (sem `checksum`).
- **Enforcer de diretório** — workflow reutilizável `.github/workflows/_enforce-migration-dir.yml`:
  - (a) chamado em `pull_request` contra `dev` ou `main`;
  - (b) chamado como primeiro step em `deploy-beta.yml`, `deploy-prod.yml`, `promote-to-prod.yml`;
  - lê `.github/migration-dir-allowlist`.
- Arquivo `.github/migration-dir-allowlist` versionado com paths permitidos.
- `preflight-prod.yml` disparado em `pull_request base: main, head: dev`.
- **Separar `deploy-beta.yml`** em jobs `enforce-dir → validate → migrate → deploy-app → smoke` (correção de ordem — prioritário).
- Separar `deploy-prod.yml` e `promote-to-prod.yml` nos mesmos jobs (cosmético — ordem já está correta).
- `reconcile_migrations.sh` com subcomandos `--list` e `--mark-applied` para emergências.
- Atualizar `migrations_guide.md` como fonte única.
- Atualizar seção de emergência em `OPERACAO_PRODUCAO.md` tornando `reconcile_migrations.sh --mark-applied` passo inseparável da execução manual.
- Atualizar `PRE_DEPLOY_CHECKLIST.md` referenciando o novo gate e o enforcer.
- Adicionar entrada em `ERRORS_SOLUTIONS.md` documentando o incidente recorrente e a solução.
- Documentar no `plan.md` a necessidade de ativar branch protection em `dev` e `main` exigindo check `enforce-migration-dir` (ação manual fora do código).

### Fora

- **Validação de checksum de migration** — requer coluna `checksum` em `schema_migrations` que não existe hoje; fase posterior.
- Migração do diretório canônico para `database/migrations/` — ADR futura.
- Rollback automático de schema (forward-only permanece — ADR-002).
- Migrar para ferramenta externa (Flyway, Prisma Migrate, Liquibase) — ADR futura.
- Criar UI para visualizar estado de migrations.
- Modificar processo de backup existente.

---

## 5. Dependências em artefatos existentes

- **`migrations_guide.md`**: vira fonte única. Reescrita parcial — documenta cabeçalho obrigatório, fluxo automatizado.
- **`OPERACAO_PRODUCAO.md`**: seção "GUIA COMPLETO DE MIGRATIONS" vira apêndice de emergência com obrigação explícita de reconciliação pós-execução. Seção 2 atualiza comando do script.
- **`PRE_DEPLOY_CHECKLIST.md`**: adicionar referência ao `preflight-prod` e ao enforcer na Fase 1.
- **`MAPA_DE_API.md`**: não afetado.
- **`ERRORS_SOLUTIONS.md`**: adicionar entrada nova.
- **`AGENTS.md`**: não editar direto.
- **`.github/workflows/deploy-beta.yml`**: refatoração estrutural (prioritário — corrige ordem).
- **`.github/workflows/deploy-prod.yml`**: refatoração cosmética (ordem já correta).
- **`.github/workflows/promote-to-prod.yml`**: refatoração cosmética (ordem já correta).
- **`scripts/deploy/apply_required_migrations.sh`**: reescrita eliminando listas paralelas.
- **Arquivos `.sql` existentes**: inventariar via T003, normalizar localização para `./database/`, adicionar cabeçalho.
- **Tabela `schema_migrations`**: migration adicionando coluna `applied_by` (não `checksum`).
- **GitHub repo settings**: branch protection em `dev` e `main` (ação manual, documentada).

---

## 6. Edge cases conhecidos

- **Beta e prod divergentes hoje entre si**: esperado. `preflight-prod` não compara beta contra prod; compara cada ambiente contra sua branch-alvo. Divergência beta↔prod vira relatório informativo no comentário, não bloqueio.
- **`main` à frente de `dev`** (cenário real atual): aceitável. Prod precisa estar em conformidade com `main`, beta com `dev`. Comparação entre os dois é informativa.
- **Migration já aplicada à mão sem registro**: resolvido por `reconcile_migrations.sh --mark-applied` que insere em `schema_migrations` sem reaplicar.
- **Número duplicado em PRs simultâneos**: step `validate` pega no PR — I4.
- **Backup de prod com nome diferente**: aceitar glob `/tmp/backup_*_pre_deploy.sql` mais recente se `PROD_BACKUP_FILE` não for passado.
- **Advisory lock travado por crash anterior**: timeout 30s; mensagem orientando `SELECT pg_advisory_unlock(...)`.
- **Script rodado localmente apontando para prod**: só permitir em prod se `$GITHUB_ACTIONS == "true"` OU `$FORCE_LOCAL_RUN == "true"`.
- **Migration com `BEGIN`/`COMMIT` explícitos**: script envelopa em transação; rejeitar migrations com `BEGIN`/`COMMIT`.
- **PostgreSQL version mismatch beta/prod**: `preflight-prod` reporta versões dos dois ambientes no comentário.
- **Tabela `schema_migrations` não existe**: bootstrap idempotente como primeira ação do script.
- **Migration com encoding não-UTF8**: validar encoding no step `validate`.
- **Migration antiga sem cabeçalho**: política definida em Clarify — T041 adiciona cabeçalho em todas retroativamente.
- **Arquivo em path legítimo fora do canônico**: allowlist cobre. Mudança no allowlist exige PR próprio.
- **Alguém faz `git push --force` em `dev`/`main`**: branch protection (fora do código) bloqueia. Sem ela, o gate processual cai — por isso item (c) da defesa em profundidade.

---

## 7. Clarifications

*(a ser preenchido por `/speckit.clarify`)*

Temas obrigatórios:

- Comportamento do `preflight-prod` se o SSH falhar (bloqueia o PR ou só posta comentário de aviso?).
- Quem autoriza `ALLOW_MANUAL_MIGRATIONS=true` em produção (todo mantenedor ou só owner?).
- Timeout do `pg_advisory_lock`: 30s ou 60s com warning em 30s.
- Política para migrations antigas sem cabeçalho: migration única de backfill ou edição manual de cada?
- Formato exato do comentário do `preflight-prod` (template).
- Paths iniciais do `.github/migration-dir-allowlist` (propostos: `./database/`, `./testes/deploy/fixtures/`, `./specs/**/fixtures/`).
- Ação quando `reconcile_migrations.sh --mark-applied` é invocado para `version` que já está em `schema_migrations` (idempotente silencioso ou erro?).

---

## 8. Review & Acceptance Checklist

- [ ] User stories claras
- [ ] Critérios em GEARS (ubíquo / evento / estado / indesejado)
- [ ] I1 (enforcer) como critério primário
- [ ] I2 (drift por conjunto contra branch-alvo) claro
- [ ] I8 (emergência sem reconciliação) como consequência desejada
- [ ] Escopo fora explícito (checksum, mudança de diretório, rollback automático)
- [ ] Dependências mapeadas
- [ ] Edge cases listados incluindo cenário `main` à frente de `dev`
- [ ] Defesa em profundidade do enforcer (a + b + c) documentada
- [ ] Clarifications resolvidas
- [ ] Aprovação explícita antes de `/speckit.plan`
