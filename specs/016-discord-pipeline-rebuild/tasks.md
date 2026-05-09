# Tasks 016 — Pipeline Discord Sync (execução incremental)

**Spec:** `specs/016-discord-pipeline-rebuild/spec.md`
**Plan:** `specs/016-discord-pipeline-rebuild/plan.md`
**Sessão:** `sessoes/26-05-09_1_discord-pipeline-diagnostico.md`
**Branch:** `feat/015-discord-draft-pipeline`

> **Regra de evidência (E166 + Constitution §9.2):** toda task GREEN exige (1) comando exato, (2) output literal, (3) query de invariante após write, (4) `git status`, (5) estado origem→destino. Sem isso a task é RED.

---

## Estado atual

- [x] Sessão aberta · Spec entregue · Plan entregue · E166 registrado.
- [ ] T-EXEC-1: Reingestão sem janela autorizada — **aguardando comando do mantenedor** para executar.
- [ ] Fase 0–5 conforme plan.

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

**Estado:** bloqueada por Fase 0.

### T-F1-01 — Migration check constraint

- [ ] Criar `database/migration_118_discord_drafts_invariant.sql`:
  ```sql
  ALTER TABLE discord_import_table_drafts
    ADD CONSTRAINT discord_drafts_ready_requires_no_missing
    CHECK (
      status <> 'ready'
      OR COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0) = 0
    );
  ```
- [ ] Aplicar localmente em DB de teste, validar migrate up/down.
- [ ] Adicionar entrada em `migrations_guide.md`.

### T-F1-02 — Teste RED para PATCH /drafts/:id

- [ ] Criar `backend/src/routes/__tests__/adminDiscordSync.drafts.patch.test.ts`:
  - `PATCH /drafts/:id { status: 'ready' }` em draft com `missing_fields=['day_of_week']` deve retornar **422**.
- [ ] Confirmar RED contra código atual (rota aceita).

### T-F1-03 — Implementação do guard no PATCH

- [ ] No handler `PATCH /drafts/:id`: se `parsed.data.status === 'ready'`, ler `missing_fields` do draft atual; se ≠ [], retornar 422 com mensagem clara.
- [ ] Re-rodar teste, observar GREEN.

### T-F1-04 — Teste RED para parser sem conteúdo

- [ ] Em `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts`:
  - Mensagem starter de fórum com `content_raw=''`, `embeds=[]`, `attachments=[]` → parser deve retornar `null`.

### T-F1-05 — Implementação no parser

- [ ] Em `parseDiscordAnnouncement`: se `body.trim() === ''` E `extractBodyFromEmbeds(embeds) === ''` → return `null`, mesmo para starters.
- [ ] Em `createOrUpdateDraftFromMessage`: quando parser retorna `null`, marcar mensagem com `status='ignored'` e adicionar futuro campo `empty_reason` (criado em Fase 2).

### T-F1-06 — Frontend: badge consistente

- [ ] Em `DiscordDraftPreview` e na lista (`DiscordSyncPanel`): badge "Pronto" só quando `missing_fields.length===0`. Caso contrário "Revisar". O número (44%) vira indicador secundário, não substitui o status.

### T-F1-07 — Migration + smoke

- [ ] Executar migration 118 em Beta.
- [ ] Smoke: rodar T-F0-05 novamente; constraint deve impedir inserção/atualização inválida.

### T-F1-08 — Validação final

- [ ] Rodar invariante Fase 1 (plan §6) — esperado: 0.

### Invariante Fase 1

```sql
SELECT count(*) FROM discord_import_table_drafts
 WHERE status='ready' AND COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0)>0;
-- Esperado: 0

SELECT count(*) FROM discord_import_messages m
 WHERE length(m.content_raw)=0 AND COALESCE(jsonb_typeof(m.embeds::jsonb),'object')='object'
   AND EXISTS (SELECT 1 FROM discord_import_table_drafts d WHERE d.discord_message_id=m.id);
-- Esperado: 0
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
