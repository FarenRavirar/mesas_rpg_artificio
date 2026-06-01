# Tasks 016 — Pipeline Discord Sync (execução incremental)

**Spec:** `specs/016-discord-pipeline-rebuild/spec.md`
**Plan:** `specs/016-discord-pipeline-rebuild/plan.md`
**Sessão:** `sessoes/26-05-09_1_discord-pipeline-diagnostico.md`
**Branch:** `feat/015-discord-draft-pipeline`

> **Regra de evidência (E166 + Constitution §9.2):** toda task GREEN exige (1) comando exato, (2) output literal, (3) query de invariante após write, (4) `git status`, (5) estado origem→destino. Sem isso a task é RED.

---

## Estado atual

- [x] Sessão aberta · Spec entregue · Plan entregue · E166 registrado.
- [x] T-EXEC-1: Reingestão sem janela — **GREEN** em 2026-05-09 (194 msgs, 189 com body).
- [x] **Fase 0**: BUG-004 corrigido, parse-batch regenerou drafts limpos.
- [x] **Fase 1**: GREEN em 2026-05-11 (Deploy Beta `25674367757`; ready_dirty=0; constraint ativa).
- [ ] Fases 2–5 conforme plan.

---

## T-EXEC-1 — Reingestão completa autorizada (operacional)

**Estado:** NOT STARTED · autorizado · pode iniciar quando o mantenedor pedir.

- [ ] Identificar IDs das fontes `📖┃campanhas` e `🎯┃one-shots` via `SELECT id, channel_name FROM discord_import_sources;`
- [ ] Snapshot pré-reingest:
  ```sql
  SELECT count(*) AS total,
         count(*) FILTER (WHERE length(content_raw)>0) AS with_body
  FROM discord_import_messages;
  ```
- [ ] Executar `POST /admin/discord-sync/sources/<id-campanhas>/reingest-force` com body `{}`
- [ ] Executar `POST /admin/discord-sync/sources/<id-one-shots>/reingest-force` com body `{}`
- [ ] Snapshot pós-reingest com a mesma query.
- [ ] **Critério:** `with_body` aumenta significativamente OU posts sem corpo ficam catalogados em T-F2-03.

---

## Fase 0 — Reset de drafts (½ dia)

**Estado:** bloqueada por T-EXEC-1.

### T-F0-01 — Snapshot read-only do estado atual

- [ ] Rodar queries de §3.1, §3.2, §3.4 do spec e colar output na sessão.

### T-F0-02 — Limpar drafts não-sincronizados

- [ ] Confirmar com mantenedor antes de DELETE.
- [ ] Executar:
  ```sql
  BEGIN;
  DELETE FROM discord_import_table_drafts
   WHERE status NOT IN ('synced','rejected');
  -- Conferir count antes de COMMIT
  SELECT count(*) FROM discord_import_table_drafts;
  COMMIT;
  ```
- [ ] Output literal colado.

### T-F0-03 — Resetar status de mensagens órfãs

- [ ] Executar:
  ```sql
  UPDATE discord_import_messages
     SET status='pending', parse_error=NULL, updated_at=NOW()
   WHERE status NOT IN ('synced','ignored')
     AND id NOT IN (SELECT discord_message_id FROM discord_import_table_drafts);
  ```

### T-F0-04 — Snapshot pós-limpeza

- [ ] Re-rodar §3.1 e §3.2 do spec.

### T-F0-05 — Regerar drafts limpos

- [ ] `POST /admin/discord-sync/messages/parse-batch` (existente)
- [ ] Verificar resultado:
  ```sql
  SELECT status, count(*) FROM discord_import_table_drafts GROUP BY status;
  ```

### Invariante Fase 0

```sql
SELECT count(*) FROM discord_import_table_drafts
 WHERE status='ready'
   AND COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0)>0;
-- Esperado: 0
```

---

## Fase 1 — Limpeza de invariantes (2 dias)

**Estado:** **DONE** em 2026-05-11. Deploy Beta run `25674367757` GREEN; constraint aplicada; invariantes validados via `SELECT` no banco-alvo (E166).

### T-F1-01 — Migration check constraint — **DONE**

- [x] `database/migration_118_discord_drafts_invariant.sql` criada com bloco `DO $$` consultando `pg_constraint` (idempotente; CHECK não aceita `IF NOT EXISTS` nativo).
- [x] Header validado por `bash testes/deploy/header_contract.sh` (após correção `requires-backup=false` para coerência com `class=online-safe`).
- [x] Entrada L03 adicionada em `migrations_guide.md` documentando o padrão idempotente.
- [x] Migration aplicada no Beta via `apply_required_migrations.sh` no Deploy Beta run `25674237745` job `migrate` GREEN; presença confirmada em `pg_constraint`.

**Commits:** `4f2bcee` (migration + guia), `9c2c0a1` (fix header requires-backup).
**Evidência GREEN:** `SELECT count(*) FROM pg_constraint WHERE conname='discord_drafts_ready_requires_no_missing'` → `1`.

### T-F1-02 — Teste para validação de `ready` transition — **DONE**

- [x] `backend/src/discord/__tests__/draftValidation.test.ts` criado com 7 casos (status undefined, ready com missing=[], ready bloqueado, fallback para current, null payload, truncamento de preview, payload não-array defensivo).
- [x] **Evidência RED no banco-alvo (E166)**: `BEGIN; UPDATE drift WHERE missing≠[]; ROLLBACK;` aceitou o UPDATE antes da migration — `UPDATE 1`, `ready_dirty_in_tx=1` (sessão `26-05-09_2_*` log de 14:21 UTC).

**Commit:** `f70f5d2`.
**Evidência GREEN:** `npx jest --testPathPatterns 'discord/__tests__'` — 16/16 tests passed, 2 suites.

### T-F1-03 — Implementação do guard no PATCH — **DONE**

- [x] Função pura `assertDraftReadyTransition({ patchStatus, patchPayloadMissing, currentPayloadMissing })` em `backend/src/discord/draftValidation.ts`; patch payload tem precedência sobre estado atual.
- [x] Handler `PATCH /admin/discord-sync/drafts/:id` em `backend/src/routes/adminDiscordSync.ts` agora lê o draft atual (404 se ausente), invoca a função, e retorna `422 { error, details: { missing_fields } }` quando bloqueado.

**Commit:** `f70f5d2`.
**Evidência GREEN no banco-alvo (E166)**: pós-migration, `UPDATE drift` em transação ROLLBACK foi rejeitado com `ERROR: new row for relation "discord_import_table_drafts" violates check constraint "discord_drafts_ready_requires_no_missing"` (run manual via ssh às 13:50 UTC de 2026-05-11). Mesmo draft `db3d7c89` que aceitou em RED.

### T-F1-04 — Teste para parser sem conteúdo — **DONE**

- [x] Em `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts`:
  - Caso novo "returns null for forum starters without body and without text in embeds" (T-F1-04).
  - Caso novo "still extracts a draft when body is empty but embeds carry text" (T-F1-05 — garante que `extractBodyFromEmbeds` continua sendo respeitado).
  - Caso batch atualizado: 12 starters reais do Covil com `content_raw=''` e `embeds=[]` agora esperam `null` em vez de drafts fabricados.

**Commit:** `bc86070`.
**Evidência GREEN:** jest 16/16.

### T-F1-05 — Implementação no parser — **DONE**

- [x] Em `parseDiscordAnnouncement.ts`: substituído `if (!body.trim() && !isThreadStarter(message)) return null;` por `if (!body.trim()) return null;`. Função `isThreadStarter` removida (sem mais usos).
- [x] **Não foi necessário** modificar `createOrUpdateDraftFromMessage` para `status='ignored'` nesta fase — o handler atual já trata `parsed === null` como ignorado por design da feature 015. Fase 2 introduzirá `empty_reason` na coluna conforme `plan.md`.

**Commit:** `bc86070`.
**Evidência GREEN:** mesmos 16 testes; tsc --noEmit GREEN.

### T-F1-06 — Frontend: badge consistente — **DONE**

- [x] `DiscordDraftReviewTable.tsx`: helper `isReady(draft)` cruza `status='ready'` com `missing_fields=[]`. Badge da lista mostra "Revisar" para drafts em drift (defensivo, mesmo com constraint o backend pode emitir status desatualizado durante reload). `readyCount` do botão "Sincronizar todos prontos (N)" usa o mesmo gate.
- [x] `DiscordDraftPreview.tsx`: cabeçalho mostra "Pronto" só quando `canSync === true`; drafts em drift recebem badge âmbar `({n} pendência{s})`. Confidence numérica continua presente como indicador secundário.

**Commit:** `41fa8bd`.
**Evidência GREEN:** `npx tsc --noEmit` frontend GREEN; build dependency satisfeito no Deploy Beta job `deploy-app` (TypeScript check passou).

### T-F1-07 — Migration + smoke deploy — **DONE**

- [x] Constraint efetivamente aplicada via CI: Deploy Beta run `25674237745` job `migrate` GREEN. Job posterior do smoke detectou um bug do próprio smoke (content_hash NOT NULL omitido), corrigido em `bc8a9f0`. Re-deploy run `25674367757` GREEN em todos os jobs.
- [x] Workflow `_smoke-discord.yml` agora ativo entre `migrate` e `deploy-app`, validando JSONB roundtrip (BUG-004) e presença da constraint (E166).

**Commits:** `9f7861c` (smoke workflow inicial), `bc8a9f0` (fix content_hash).
**Evidência GREEN:** Deploy Beta `25674367757` — todos os jobs verdes; constraint presente; smoke discord verde.

### T-F1-08 — Validação final no banco-alvo (E166) — **DONE**

- [x] Snapshot pós-deploy executado via `ssh ... docker exec mesas-beta-db psql ...` em 2026-05-11 13:54 UTC.

**Evidência GREEN (output literal):**

```
ready_dirty                                = 0
constraint discord_drafts_ready_requires_no_missing  presente (contype='c')
msgs_total=194 | with_body=189 | parsed=189 | ignored=5
drafts: ready=111 | needs_review=78
embeds: array=194 (100%)
Beta root: HTTP 200
Beta /api/v1/health: HTTP 200
```

### T-F1-09 — Smoke test workflow pós-deploy automatizado — **DONE**

- [x] `.github/workflows/_smoke-discord.yml` criado como `workflow_call` reusável.
- [x] Validações ativas:
  1. INSERT em transação ROLLBACK com `embeds=[obj]` e `attachments=[obj]` — anti-regressão BUG-004 (serialização JSONB).
  2. `pg_constraint` confirma presença da constraint da migration 118.
  3. UPDATE drift em transação ROLLBACK exercita a constraint quando há draft candidato.
- [x] `deploy-beta.yml` atualizado: `deploy-app: needs: [migrate, smoke-discord]`. Falha do smoke bloqueia deploy.

**Commits:** `9f7861c`, `bc8a9f0`.
**Evidência GREEN:** Deploy Beta `25674367757` job `smoke-discord` verde em 9s.

### Invariante Fase 1 — todos GREEN

```sql
SELECT count(*) FROM discord_import_table_drafts
 WHERE status='ready' AND COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0)>0;
-- Output literal: 0

SELECT conname FROM pg_constraint
 WHERE conname='discord_drafts_ready_requires_no_missing';
-- Output literal: discord_drafts_ready_requires_no_missing
```

---

## Fases 2–5

Detalhadas em `plan.md`. Tarefas serão expandidas para tasks executáveis após cada checkpoint de fase anterior.

---

## Pré-requisitos antes de qualquer Fase

- [ ] Mantenedor revisou e aprovou `spec.md`.
- [ ] Mantenedor revisou e aprovou `plan.md`.
- [ ] Mantenedor autorizou execução de T-EXEC-1.
- [ ] Worktree atual: `C:\projetos\mesas_rpg_artificio\.claude\worktrees\cool-rhodes-e2a4c3` (branch `claude/cool-rhodes-e2a4c3` — destino final dos commits é `feat/015-discord-draft-pipeline`).
