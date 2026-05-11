# Tasks 017 — Parser refinements + extração de imagens

**Spec:** `specs/017-parser-refinements-imagens/spec.md`
**Plan:** `specs/017-parser-refinements-imagens/plan.md`
**Branch:** `feat/015-discord-draft-pipeline`
**Decisões fechadas:** spec 017 §6 (D1–D7)

> **Regra de evidência (E166 + Constitution §9.2):** toda task GREEN exige (1) comando exato, (2) output literal, (3) query de invariante pós-write, (4) `git status`, (5) estado origem→destino. Sem isso a task é RED.

> **Eficiência de commits (AGENTS.md §"Eficiência de commits"):** documentação relacionada (sessão, project-state, tasks.md, etc.) vai no MESMO commit do código que motivou. Commits docs-only são proibidos por padrão.

---

## Estado atual

- [x] Spec entregue · Plan entregue · Decisões 1–7 fechadas pelo mantenedor.
- [x] **Fase A** — Parser regex: slots, frequência, host (RED→GREEN).
- [x] **Fase B** — Parser regex: sistemas com parênteses e versão.
- [x] **Fase C** — Parser: captura de imagem (`cover_url_source`, `cover_quality`).
- [ ] **Fase D** — Upload Cloudinary + cron retry + migration 122.
- [ ] **Fase E** — Limpeza de 3 legacy + re-parse em massa.
- [ ] **Fase F** — Frontend (preview, widget de desambiguação, select de frequência).

---

## Fase A — Parser regex: slots, frequência, host

### T-F1-A-01 — Estender tipo `DiscordTableDraftTable`

- [x] Em `backend/src/discord/types.ts` (ou onde fica `DiscordTableDraftTable`), adicionar:
  - `host_discord_id: string | null`
  - `_slots_ambiguity: { first: number; second: number; source: 'x_slash_y' } | null` (campo interno do payload, audit)
- [x] Atualizar imports e default em `parseDiscordAnnouncement`.

### T-F1-A-02 — Testes RED para `extractSlots` reescrito

- [x] Em `parseDiscordAnnouncement.test.ts`, adicionar 4 casos:
  - `Vagas Totais: 6` + `Vagas Disponíveis: 0` → `total=6, open=0, _slots_ambiguity=null`
  - `▬ **Vagas:** 0/6` (sem palavra após) → `total=6, open=null, _slots_ambiguity={ first:0, second:6, source:'x_slash_y' }`
  - `▬ **Vagas:** 5/5` (lotada) → `total=5, open=null, _slots_ambiguity={ first:5, second:5, ... }`
  - `Vagas: 4` (simples) → `total=4, open=4`
- [x] Rodar Jest, observar RED real: 2 falhas nos casos `Vagas: X/Y` (os casos canônico e simples já passavam no comportamento antigo).

### T-F1-A-03 — Implementar `extractSlots` reescrito

- [x] Reescrever em `parseDiscordAnnouncement.ts` cobrindo os 3 padrões em prioridade.
- [x] Rodar Jest, observar GREEN.

### T-F1-A-04 — Testes RED + GREEN para `frequency` por `type`

- [x] Testes:
  - `type=one-shot` + body com `Segunda-feira` → `frequency=null`
  - `type=campanha` + day_of_week → `frequency='semanal'`
  - `type=campanha` sem day_of_week → `frequency=null`
  - `type=aberta` → `frequency=null`
- [x] Substituir linha `frequency: dayOfWeek ? 'semanal' : null` por lógica condicional ao `type`.
- [x] GREEN.

### T-F1-A-05 — Testes RED + GREEN para `extractHostDiscordId`

- [x] Teste: body com linha `▬ **Mestre:** <@225275653333843970>` → `host_discord_id='225275653333843970'`
- [x] Teste: body com `▬ **GM:** <@99999>` → `host_discord_id='99999'`
- [x] Teste: body sem linha de mestre → `host_discord_id=null`
- [x] Implementar função, GREEN.

### T-F1-A-06 — Propagação de `_slots_ambiguity` no normalizador

- [x] Em `normalizeDiscordTableDraft.ts`: quando `parsed.table._slots_ambiguity` presente, adicionar `'slots_open:ambiguous_x_of_y'` a `missing_fields`.
- [x] Teste de regressão: draft com ambiguidade tem o flag no missing.
- [x] GREEN.

### T-F1-A-07 — Build + commit Fase A

- [x] `npx tsc --noEmit` backend GREEN.
- [x] `npm --prefix backend test -- parseDiscordAnnouncement` GREEN.
- [ ] Commit atômico (mensagem: `feat(discord): parser extractSlots + frequency por type + host_discord_id (T-F1-A-01..07)`).
- [ ] Inclui no mesmo commit: atualização desta tasks.md marcando T-F1-A-01..07 como `[x]` com evidência colada.

#### Evidência local Fase A — RED/GREEN

Estado: NOT STARTED → RED → GREEN técnico local. O commit ainda aguarda autorização explícita.

Comandos executados:
```powershell
npm --prefix backend test -- parseDiscordAnnouncement
npx tsc --noEmit
npm --prefix backend test -- parseDiscordAnnouncement
git status --short
```

Outputs literais relevantes:
```text
RED slots:
Test Suites: 1 failed, 1 total
Tests:       2 failed, 11 passed, 13 total
Falhas: Expected slots_total 6/5, Received null para casos Vagas: 0/6 e Vagas: 5/5.

RED frequency:
Test Suites: 1 failed, 1 total
Tests:       2 failed, 15 passed, 17 total
Falhas: Expected frequency null, Received "semanal" para one-shot e aberta.

RED host:
Test Suites: 1 failed, 1 total
Tests:       3 failed, 18 passed, 21 total
Falhas: Expected host_discord_id "225275653333843970", "99999", "186160570133643265"; Received null.

RED normalizer:
Test Suites: 1 failed, 1 total
Tests:       1 failed, 21 passed, 22 total
Falha: Expected missing_fields to contain "slots_open:ambiguous_x_of_y"; Received [].

GREEN Jest final:
> backend@1.0.0 test
> jest parseDiscordAnnouncement

(node:10528) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        2.426 s, estimated 3 s
Ran all test suites matching parseDiscordAnnouncement.

GREEN TypeScript:
npx tsc --noEmit
<sem output; exit code 0>
```

Invariantes SQL: não executadas nesta etapa local. Conforme esta seção, os valores corretos dependem de deploy + re-parse em massa na Fase E.

### Invariante Fase A (pós-deploy)

```sql
SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'missing_fields' @> '["slots_total"]';
-- Esperado: ≤10

SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'table'->>'type'='one-shot'
   AND normalized_payload->'table'->>'frequency'='semanal';
-- Esperado: 0

SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'missing_fields' @> '["slots_open:ambiguous_x_of_y"]';
-- Esperado: ≈23 (são os X/Y que aguardam desambiguação UI na Fase F)
```

> Validar **APÓS** Fase E executar o re-parse em massa. Não esperar valores corretos antes disso.

---

## Fase B — Parser: sistemas com parênteses e versão

### T-F1-B-01 — Testes RED

- [x] `Sistema: Pokémon RPG (Sistema próprio usando D&D como base, em fase d)` → `raw_system_hint='Pokémon RPG'`
- [x] `Sistema: D&D 5.5 (com retrocompatibilidade)` → `system_id` resolvido para `Dungeons & Dragons`; `raw_system_hint=null`
- [x] `Sistema: Starfinder 2e` → `system_id` resolvido para `Starfinder`; campo informativo (não bloqueante) registra `version_mismatch:2e` em `normalized_payload.table._notes`

### T-F1-B-02 — Implementação

- [x] Refinar `extractLabelValue('sistema')` para cortar em `(` ou quebra de linha.
- [x] Em `matchSystem`: se nome literal não casa, strip sufixo de versão (`5e`, `5.5`, `5.5e`, `2e`, `3e`) e tenta de novo.
- [x] GREEN.

### T-F1-B-03 — Build + commit Fase B

- [x] `tsc` + `jest` GREEN.
- [x] Commit atômico (`d3e2410`) e push para `dev`; Deploy Beta `25677665779` GREEN.

#### Evidência local Fase B — RED/GREEN

Estado: NOT STARTED → RED → GREEN técnico local. Commit e push serão feitos em seguida por autorização do mantenedor para executar todo o plano.

Comandos executados:
```powershell
npm --prefix backend test -- parseDiscordAnnouncement
npx tsc --noEmit
git status --short
```

Outputs literais relevantes:
```text
RED inicial:
Test Suites: 1 failed, 1 total
Tests:       3 failed, 22 passed, 25 total
Falhas:
- Expected raw_system_hint "Pokémon RPG"; Received "Pokémon RPG (Sistema próprio usando D&D como base, em fase de desenvolvimento)"
- Expected system_id "dnd"; Received null
- Expected _notes to contain "version_mismatch:2e"; Received []

GREEN Jest final:
> backend@1.0.0 test
> jest parseDiscordAnnouncement

(node:15580) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        3.168 s
Ran all test suites matching parseDiscordAnnouncement.

GREEN TypeScript:
npx tsc --noEmit
<sem output; exit code 0>
```

### Invariante Fase B

```sql
SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'table'->>'raw_system_hint' LIKE '%(%';
-- Esperado: 0
```

---

## Fase C — Parser: captura de imagem

### T-F1-C-01 — Estender tipo `DiscordTableDraftTable`

- [x] Adicionar `cover_url_source: string | null` e `cover_quality: 'standard' | 'low' | null`.

### T-F1-C-02 — Testes RED para captura de attachment

- [x] Attachment `{ content_type:'image/jpeg', width:1194, height:804, size:550698, url:'https://cdn.discordapp.com/...' }` → `cover_url_source` set, `cover_quality='standard'`
- [x] Attachment `image/png` 400×300 30KB → `cover_url_source` set, `cover_quality='low'`
- [x] Attachment `image/svg+xml` → `cover_url_source=null`
- [x] Attachment `application/pdf` → ignorado
- [x] Mensagem sem attachments → `cover_url_source=null`
- [x] Mensagem com 2 attachments image: pega o primeiro

### T-F1-C-03 — Implementação

- [x] Função `extractCoverFromAttachments(attachments: unknown[]): { url: string; quality: 'standard'|'low' } | null` em `parseDiscordAnnouncement.ts`.
- [x] Lógica de quality conforme D7: `width >= 800 AND size >= 50000` → standard; senão → low. (`size` em bytes.)
- [x] Em `parseDiscordAnnouncement`, popular `table.cover_url_source` e `table.cover_quality`.
- [x] GREEN.

### T-F1-C-04 — Build + commit Fase C

- [x] Build + jest GREEN.
- [ ] Commit atômico.

#### Evidência local Fase C — RED/GREEN

Estado: NOT STARTED → RED → GREEN técnico local. Commit e push serão feitos em seguida por autorização do mantenedor para executar a Fase C.

Comandos executados:
```powershell
npm --prefix backend test -- parseDiscordAnnouncement
npx tsc --noEmit
git status --short
```

Outputs literais relevantes:
```text
RED inicial:
Test Suites: 1 failed, 1 total
Tests:       3 failed, 28 passed, 31 total
Falhas:
- Expected cover_url_source "https://cdn.discordapp.com/attachments/1/banner.jpg?ex=abc"; Received null
- Expected cover_url_source "https://cdn.discordapp.com/attachments/1/small.png?ex=abc"; Received null
- Expected cover_url_source "https://cdn.discordapp.com/attachments/1/first.jpg?ex=abc"; Received null

GREEN Jest final:
> backend@1.0.0 test
> jest parseDiscordAnnouncement

(node:9464) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       31 passed, 31 total
Snapshots:   0 total
Time:        4.038 s
Ran all test suites matching parseDiscordAnnouncement.

GREEN TypeScript:
npx tsc --noEmit
<sem output; exit code 0>
```

### Invariante Fase C (pós Fase E re-parse)

```sql
SELECT
  count(*) FILTER (WHERE m.attachments::text ~* '(png|jpg|jpeg|webp|gif)') AS posts_com_image,
  count(*) FILTER (WHERE m.attachments::text ~* '(png|jpg|jpeg|webp|gif)'
                     AND (d.normalized_payload->'table'->>'cover_url_source') IS NOT NULL) AS com_cover_source
FROM discord_import_table_drafts d
JOIN discord_import_messages m ON m.id = d.discord_message_id;
-- Esperado: com_cover_source / posts_com_image >= 0,95
```

---

## Fase D — Upload Cloudinary + cron retry

### T-F1-D-01 — Migration 122: coluna `image_upload_status`

- [x] `database/migration_122_discord_image_upload_status.sql`:
  ```sql
  ALTER TABLE discord_import_table_drafts
    ADD COLUMN IF NOT EXISTS image_upload_status TEXT NULL,
    ADD COLUMN IF NOT EXISTS image_upload_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS image_upload_last_error TEXT NULL,
    ADD COLUMN IF NOT EXISTS image_upload_last_at TIMESTAMPTZ NULL;
  ```
- [x] Validação `DO $$` checa colunas criadas.
- [x] Header `online-safe` + `requires-backup=false` (lição L03).

### T-F1-D-02 — Função `uploadDiscordImageToCloudinary`

- [x] Criar `backend/src/discord/uploadDiscordImage.ts` com:
  - `fetch(url, { signal: AbortSignal.timeout(10000) })` → blob
  - `cloudinary.uploader.upload_stream` com folder `discord-imports/`
  - `public_id` = SHA-256 dos bytes (idempotência)
  - Retorno categorizado: `{ status: 'success'|'expired_url'|'network'|'cloudinary', url?: string, error?: string }`
- [x] Exportar em `backend/src/discord/index.ts`.
- [x] Teste com fetch mock e Cloudinary mock.

### T-F1-D-03 — Integrar upload em `syncDiscordDraftToTable`

- [x] Antes do INSERT em `tables`:
  - Se `draft.normalized_payload.table.cover_url_source` e ainda não há `cover_url` Cloudinary:
    - Chama `uploadDiscordImageToCloudinary`
    - **Sucesso:** `cover_url = banner_url = url_cloudinary`; persiste `image_upload_status='success'`, `image_upload_attempts++`, `image_upload_last_at=NOW()`
    - **Falha:** `cover_url = banner_url = null` no `tables`; persiste status categorizado no draft; cria notificação admin
- [x] Adicionar cobertura unitária do helper de upload e validar integração por TypeScript/build; não havia suite existente de `syncDiscordDraftToTable` no módulo.

### T-F1-D-04 — Cron worker `discord:retry-image-uploads`

- [x] `backend/src/scripts/retryDiscordImageUploads.ts`:
  - Lê drafts com `image_upload_status IN ('expired_url','network','cloudinary')` AND `image_upload_attempts < 5`
  - Para cada, tenta upload novamente
  - Sucesso: atualiza `tables.cover_url` E `tables.banner_url` da mesa correspondente (se já existe `table_id`), e `discord_import_table_drafts` (`image_upload_status='success'`)
  - Falha 5×: `image_upload_status='permanent_fail'`
- [x] Script `discord:retry-image-uploads` em `backend/package.json`: `node dist/scripts/retryDiscordImageUploads.js`
- [x] Configurar `mesas-cron` para chamar a cada 1h via `cronRunner.ts`; `docker-compose.prod.yml` recebeu envs Cloudinary para o container existente.

### T-F1-D-05 — Endpoints admin

- [x] `POST /admin/discord-sync/drafts/:id/refresh-image` — força re-upload imediato, ignora contador.
- [x] `GET /admin/discord-sync/image-uploads/summary` — agrega `image_upload_status`.
- [x] Atualizar `MAPA_DE_API.md`.

### T-F1-D-06 — Build + commit Fase D

- [x] tsc + jest GREEN; smoke de upload local (mock).
- [ ] Commit atômico por sub-task ou um único commit cobrindo migration+upload+cron+endpoints (decisão: agrupar para reduzir overhead de deploys).

#### Evidência local Fase D — GREEN técnico

Estado: NOT STARTED → GREEN técnico local. Invariantes SQL dependem do deploy Beta aplicar a migration 122 e de sincronização real com imagem.

Comandos executados:
```powershell
npm --prefix backend test -- uploadDiscordImage parseDiscordAnnouncement
npx tsc --noEmit
npm --prefix backend run build
git status --short
```

Outputs literais:
```text
> backend@1.0.0 test
> jest uploadDiscordImage parseDiscordAnnouncement

(node:6284) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
(node:21104) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 2 passed, 2 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        6.495 s
Ran all test suites matching uploadDiscordImage|parseDiscordAnnouncement.

npx tsc --noEmit
<sem output; exit code 0>

> backend@1.0.0 build
> tsc
```

### Invariante Fase D (pós-deploy + alguma execução real)

```sql
SELECT count(*) FROM tables t
  JOIN discord_import_table_drafts d ON d.table_id = t.id
 WHERE t.cover_url LIKE '%discord%' OR t.cover_url LIKE '%discordapp%'
    OR t.banner_url LIKE '%discord%' OR t.banner_url LIKE '%discordapp%';
-- Esperado: 0

SELECT image_upload_status, count(*) FROM discord_import_table_drafts
 WHERE (normalized_payload->'table'->>'cover_url_source') IS NOT NULL GROUP BY 1;
-- Esperado: success >> pending; permanent_fail próximo de 0
```

---

## Fase E — Limpeza de legacy + re-parse em massa

### T-F1-E-01 — Identificar drafts legacy (body == thread_name)

- [x] Query:
  ```sql
  SELECT m.id, m.discord_thread_name, length(m.content_raw)
    FROM discord_import_messages m
    JOIN discord_import_table_drafts d ON d.discord_message_id = m.id
   WHERE m.content_raw = m.discord_thread_name
     AND m.status='parsed';
  ```
- [x] Colar output literal na sessão. Observado em Beta: 5 linhas (todas `needs_review`, sem `table_id`); spec estimava 3.

### T-F1-E-02 — Marcar legacy como ignored + apagar draft

- [x] Em transação:
  ```sql
  BEGIN;
  UPDATE discord_import_messages
     SET status='ignored', parse_error='legacy_content_equals_thread_name', updated_at=NOW()
   WHERE content_raw = discord_thread_name AND status='parsed';

  DELETE FROM discord_import_table_drafts
   WHERE discord_message_id IN (
     SELECT id FROM discord_import_messages WHERE parse_error='legacy_content_equals_thread_name'
   ) AND status NOT IN ('synced','rejected');
  COMMIT;
  ```
- [x] Validação: `SELECT count(*) FROM discord_import_messages WHERE content_raw=discord_thread_name AND status='parsed'` → 0.

### T-F1-E-03 — Re-parse em massa

- [x] Resetar mensagens parsed não-legacy:
  ```sql
  UPDATE discord_import_messages
     SET status='pending', parse_error=NULL
   WHERE status='parsed'
     AND id NOT IN (SELECT discord_message_id FROM discord_import_table_drafts WHERE status IN ('synced','rejected'));

  DELETE FROM discord_import_table_drafts
   WHERE status NOT IN ('synced','rejected');
  ```
- [x] `POST /admin/discord-sync/messages/parse-batch` para regerar todos os drafts sob a nova lógica.
- [x] Validar com queries de Fase A e C que `slots_total` cai e `cover_url_source` aparece em ≥95% dos com imagem.
  - Primeiro re-parse observou `processed=184`, `succeeded=184`, `failed=0`, mas `slots_total` ficou em 15 por regressão `Vagas: 0` tratado como missing. Correção pontual adicionada antes do re-parse final.
  - Re-parse final após deploy do fix: `processed=184`, `succeeded=184`, `failed=0`; `slots_total` missing = 2; `cover_url_source` = 184/184 com imagem.

### T-F1-E-04 — Sessão atualizada com evidência

- [x] Output literal de cada `SELECT` colado na sessão.
- [x] Commit (com docs no mesmo commit, sem código novo — exceção legítima: atualização de sessão e tasks.md).

---

## Fase F — Frontend

### T-F1-F-01 — Estender types frontend

- [ ] `frontend/src/features/discord-sync/types.ts`: adicionar `cover_url_source`, `cover_quality`, `host_discord_id`, `_slots_ambiguity` na interface `DiscordDraft.normalized_payload.table`.

### T-F1-F-02 — Preview de capa + thumbnail

- [ ] `DiscordDraftPreview.tsx`: novo campo "Capa". Exibe `cover_url` (Cloudinary) se presente, senão `cover_url_source` (Discord CDN — pode estar expirado). Botão "Substituir" abre input padrão de upload; "Remover" zera ambos. Badge âmbar quando `cover_quality='low'`.
- [ ] `DiscordDraftReviewTable.tsx`: thumbnail 40×40 ao lado do título; placeholder cinza quando sem capa.

### T-F1-F-03 — Widget de desambiguação de slots (D1 c)

- [ ] No `DiscordDraftPreview`, quando `missing_fields` inclui `'slots_open:ambiguous_x_of_y'`:
  - Bloco destacado com label "Como interpretar `X/Y` deste post?"
  - 2 rádios mostrando interpretações ("X = inscritos / Y = total" e "X = disponíveis / Y = máximo")
  - Exibe valores reais (lê do `_slots_ambiguity`)
  - Botão "Confirmar" dispara PATCH `{ normalized_payload: { ... slots_open, slots_filled, missing_fields atualizado } }`

### T-F1-F-04 — Select de frequência

- [ ] Substituir input text por `<select>` com `semanal`, `quinzenal`, `mensal`, `única`, `outra`.

### T-F1-F-05 — Build + commit Fase F

- [ ] `npx tsc --noEmit` frontend GREEN.
- [ ] Commit atômico.

### T-F1-F-06 — Teste funcional Beta

- [ ] Mantenedor abre painel em janela anônima após deploy:
  - Confirma thumbnail aparece em ≥95% dos drafts
  - Confirma widget de desambiguação aparece nos drafts com `X/Y`
  - Confirma badge "baixa qualidade" quando aplicável
  - Confirma select de frequência

---

## Pré-requisitos antes de qualquer Fase

- [ ] Mantenedor revisou e aprovou `spec.md` e `plan.md` (decisões D1–D7 fechadas).
- [ ] Worktree atual: `C:\projetos\mesas_rpg_artificio\.claude\worktrees\flamboyant-mcnulty-9d2c44` (branch `claude/flamboyant-mcnulty-9d2c44` → destino `feat/015-discord-draft-pipeline` → push para `dev`).
- [ ] Branch `feat/015-discord-draft-pipeline` continua sendo a destinação.

---

## Critério de fechamento global

Spec 017 §7 itens 1–9 atendidos; queries de invariante GREEN no Beta; mantenedor confirma em janela anônima.
