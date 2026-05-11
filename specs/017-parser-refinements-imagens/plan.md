# Plan 017 — Refinamento do parser Discord + extração de imagens

**Data:** 2026-05-11
**Spec de origem:** `specs/017-parser-refinements-imagens/spec.md`
**Branch alvo:** `feat/015-discord-draft-pipeline` (mantida — spec 016 §11.8)
**Decisões fechadas:** spec 017 §6 (D1–D7)

---

## 1. Contexto

Após revisão funcional pelo mantenedor de drafts pós-Fase 1 do spec 016, identificadas 9 categorias de bug do parser e ausência total de tratamento de imagem. Spec 017 catalogou; plan organiza execução em 6 fases sequenciais.

Decisões já fechadas (não perguntar de novo): D1 ambíguo, D2 sugestão, D3 ambos, D4 (a)+(c), D5 sem backfill, D6 só imagens, D7 captura+flag.

---

## 2. Ordem de execução

```
Fase A ──► Fase B ──► Fase C ──► Fase D ──► Fase E ──► Fase F
(parser    (parser    (parser    (sync+    (legacy    (frontend
 regex     parens     imagens    cron        +reparse) UX)
 slots+    sistemas)  attach)    upload)
 freq+
 host)
```

Cada fase tem entrega independente (commit + deploy). Fases A+B+C podem ser agrupadas em um deploy só (são só parser). Fase D introduz worker novo, deploy separado. Fase E é operação de banco (não código). Fase F é frontend.

**Estimativa total:** 9–14 dias úteis, com checkpoints entre fases.

---

## 3. Fases em detalhe

### Fase A — Parser: slots, frequência, host (1-2 dias)

**Arquivos:**
- `backend/src/discord/parseDiscordAnnouncement.ts` (`extractSlots`, função nova `extractHostDiscordId`, derivação de `frequency`)
- `backend/src/discord/normalizeDiscordTableDraft.ts` (propaga `_ambiguity` para `missing_fields`)
- `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts` (casos novos)
- `backend/src/discord/types.ts` ou similar (adicionar campos `host_discord_id`, `_slots_ambiguity` no `DiscordTableDraftTable`)

**RED → GREEN:** 8+ testes Jest novos:
- `Vagas Totais: 6` + `Vagas Disponíveis: 0` → total=6, open=0, sem ambiguidade
- `Vagas: 0/6` → total=6, open=null, ambiguity registrada
- `Vagas: 5/5` → total=5, open=null, ambiguity registrada (mesmo lotada)
- `Vagas: 4` (simples) → total=4, open=4
- `type=one-shot` → `frequency=null` mesmo com day_of_week presente
- `type=campanha` + `day_of_week=quarta` → `frequency='semanal'`
- `type=campanha` sem day_of_week → `frequency=null`
- `<@225275653333843970>` em linha "**Mestre:**" → `host_discord_id` extraído

### Fase B — Parser: sistemas com parênteses e versão (1 dia)

**Arquivos:**
- `backend/src/discord/parseDiscordAnnouncement.ts` (`extractLabelValue` para Sistema; `matchSystem` ganha estratégia "stripped")
- `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts`

**RED → GREEN:** casos novos:
- `Sistema: Pokémon RPG (Sistema próprio usando D&D...)` → `raw_system_hint='Pokémon RPG'` (sem parêntese)
- `Sistema: D&D 5.5 (com retrocompatibilidade)` → hint='D&D 5.5'; matcher tenta `D&D 5.5` e depois `D&D` → resolve para `Dungeons & Dragons`
- `Sistema: Starfinder 2e` → tenta `Starfinder 2e`, depois `Starfinder` → resolve para `Starfinder` (canônico) + flag `version_mismatch:2e` (informativo)

### Fase C — Parser: captura de imagem do post (1-2 dias)

**Arquivos:**
- `backend/src/discord/parseDiscordAnnouncement.ts` (lê `message.attachments[]`)
- `backend/src/discord/types.ts` (campos `cover_url_source`, `cover_quality` no `DiscordTableDraftTable`)
- `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts`

**RED → GREEN:**
- Attachment `image/jpeg` 1194×804, 550KB → `cover_url_source` set, `cover_quality='standard'`
- Attachment `image/png` 400×300, 30KB → `cover_url_source` set, `cover_quality='low'`
- Attachment `image/svg+xml` → ignorado, `cover_url_source=null`
- Attachment `application/pdf` → ignorado
- Sem attachments → `cover_url_source=null` sem erro

### Fase D — Upload Cloudinary no sync + cron retry (3-4 dias)

**Arquivos:**
- `backend/src/discord/uploadDiscordImage.ts` (novo) — função `uploadDiscordImageToCloudinary`
- `backend/src/discord/syncDiscordDraftToTable.ts` (chamar upload antes do INSERT em `tables`)
- `backend/src/scripts/retryDiscordImageUploads.ts` (novo) — script do cron
- `database/migration_122_discord_image_upload_status.sql` — coluna `image_upload_status` em `discord_import_table_drafts` (enum textual)
- `docker-compose.beta.yml` e `docker-compose.prod.yml` — adicionar entrada cron `discord:retry-image-uploads` se for via cron file
- `backend/package.json` — script `discord:retry-image-uploads` para `node dist/scripts/retryDiscordImageUploads.js`
- `backend/src/routes/adminDiscordSync.ts` — endpoint `POST /drafts/:id/refresh-image` + rota `GET /image-uploads/summary`
- Testes: smoke local de upload e fluxo de falha (mockar fetch e Cloudinary)

**Invariantes:** ver spec §6.4 e §7 item 4.

### Fase E — Limpeza de legacy + re-parse em massa (½ dia)

**Tasks (sem alteração de código além de SQL ad-hoc):**
1. `SELECT` para identificar drafts patológicos (S-05) por `content_raw = discord_thread_name`.
2. `UPDATE discord_import_messages SET status='ignored', parse_error='legacy_content_equals_thread_name' WHERE ...`
3. `DELETE FROM discord_import_table_drafts` correspondentes (não-`synced`, não-`rejected`).
4. `POST /admin/discord-sync/messages/parse-batch` para regerar drafts limpos sob a nova lógica de Fases A+B+C.
5. Validar com `SELECT` que os 62 needs_review de slots caem para ≤10 + ~23 novos com flag de ambiguidade.

### Fase F — Frontend (2 dias)

**Arquivos:**
- `frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx` — campo Capa + thumbnail + badge low quality + widget de desambiguação de slots + select de frequência
- `frontend/src/features/discord-sync/components/DiscordDraftReviewTable.tsx` — thumbnail 40×40 na lista
- `frontend/src/features/discord-sync/types.ts` — refletir novos campos `cover_url_source`, `cover_quality`, `_slots_ambiguity`, `host_discord_id`
- Testes manuais em janela anônima do Beta após deploy

---

## 4. Dependências e checkpoints

```
Fase A ─── checkpoint: jest+tsc GREEN, re-parse Beta amostra-controlada
   │
   ▼
Fase B ─── checkpoint: jest+tsc GREEN, raw_system_hint sem parênteses
   │
   ▼
Fase C ─── checkpoint: cover_url_source populado em ≥95% dos drafts com image
   │
   ▼
Fase D ─── checkpoint: cron worker rodando, ao menos 1 upload sucesso no Beta
   │
   ▼
Fase E ─── checkpoint: 3 drafts legacy zerados, re-parse em massa GREEN
   │
   ▼
Fase F ─── checkpoint: mantenedor valida em janela anônima
```

Cada checkpoint exige:
1. Query de invariante com output literal.
2. Build verde + testes verdes.
3. Aprovação explícita do mantenedor.

---

## 5. Estimativa total

| Fase | Estimativa |
|---|---|
| A — slots+freq+host | 1–2 dias |
| B — sistema parens | 1 dia |
| C — image capture | 1–2 dias |
| D — Cloudinary+cron | 3–4 dias |
| E — re-parse | ½ dia |
| F — frontend | 2 dias |
| **Total** | **8,5–11,5 dias** |

---

## 6. Compromissos do agente (reforço E166)

Toda task GREEN entrega:
1. Comando exato (curl, psql, npm)
2. Output literal
3. Query de invariante pós-write
4. `git status` dos arquivos
5. Estado origem → destino

Sem isso, RED. Sem PARTIAL.

---

## 7. Queries de invariante consolidadas

### Fase A
```sql
SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'missing_fields' @> '["slots_total"]';
-- Esperado: ≤10

SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'table'->>'type'='one-shot'
   AND normalized_payload->'table'->>'frequency'='semanal';
-- Esperado: 0
```

### Fase B
```sql
SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'table'->>'raw_system_hint' LIKE '%(%';
-- Esperado: 0
```

### Fase C
```sql
SELECT
  count(*) FILTER (WHERE m.attachments::text ~* '(png|jpg|jpeg|webp|gif)') AS posts_com_imagem,
  count(*) FILTER (WHERE m.attachments::text ~* '(png|jpg|jpeg|webp|gif)'
                     AND (d.normalized_payload->'table'->>'cover_url_source') IS NOT NULL) AS com_cover_source
FROM discord_import_table_drafts d
JOIN discord_import_messages m ON m.id = d.discord_message_id;
-- Esperado: com_cover_source >= 0,95 × posts_com_imagem
```

### Fase D
```sql
SELECT image_upload_status, count(*) FROM discord_import_table_drafts
 WHERE cover_url_source IS NOT NULL GROUP BY 1;
-- Esperado: success >> pending; permanent_fail próximo de 0
```

### Fase E
```sql
SELECT count(*) FROM discord_import_messages
 WHERE content_raw = discord_thread_name AND status = 'parsed';
-- Esperado: 0
```

---

## 8. Estado e próximo passo imediato

**Estado:** plan aceito (decisões fechadas).
**Próximo passo:** gerar `tasks.md`, autorizar Fase A.
