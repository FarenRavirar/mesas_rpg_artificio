# Spec 017 — Refinamento do parser Discord + extração de imagens

**Data:** 2026-05-11
**Sessão de origem:** revisão funcional pelo mantenedor de drafts pós-Fase 1 do spec 016.
**Branch SDD associada:** `feat/015-discord-draft-pipeline` (mantida — spec 016 §11.8).
**Estado:** Diagnóstico e proposta — aguardando decisão do mantenedor para abertura de plan/tasks.
**Autor:** agente da sessão 26-05-09_2.

> Este spec foi escrito **depois** de queries reais no Beta sobre amostra de 78 drafts `needs_review` e 189 mensagens com body. Toda métrica tem origem em `SELECT` executado em 2026-05-11 contra `mesas-beta-db` (E166).

---

## 1. Resumo executivo

A Fase 1 do spec 016 entregou o que prometeu: o backend agora **se recusa** a marcar `status='ready'` em drafts com campos faltando, e a UI mostra "Revisar" para esses casos. Isso expôs uma realidade que estava escondida atrás de "Pronto N%" falsos: o **parser tem cobertura insuficiente** para a maioria dos posts reais do Covil do Lich, e a **imagem-banner** dos posts (presente em 97% dos casos) é completamente ignorada pelo pipeline.

O mantenedor revisou em 2026-05-11 o draft `3a4be761-87c7-4783-9962-308528555dcb` ("Estrada para Calabria") e identificou 4 categorias de problema. Investigação no Beta mostrou que esses problemas afetam volume relevante:

| Sintoma | Volume | % de needs_review |
|---|---|---|
| `slots_total` ausente (formato `0/6` ignorado) | 62 / 78 | **79%** |
| `system_name:unmatched_hint` (sistema fora do catálogo) | 21 / 78 | 27% |
| `contact_url` ausente | 8 / 78 | 10% |
| `day_of_week` ausente | 8 / 78 | 10% |
| `start_time` ausente | 7 / 78 | 9% |
| Posts com attachment de imagem ignorados | 184 / 189 | **97%** |

Este spec catalogua os bugs, mapeia todos os cenários conhecidos do Covil, propõe schema, plano de implementação em 6 fases, e lista decisões pendentes do mantenedor antes de qualquer código.

---

## 2. Cenários reais cobertos pela investigação

Todos os cenários abaixo foram observados no Beta após T-EXEC-1 (reingestão sem janela em 2026-05-09). Não são hipotéticos.

### S-01 — Post canônico Covil com campos separados (gold path)

Forum starter rico em conteúdo, segue template informal estabelecido pelo Covil do Lich:

```
▬ **Sistema:** Dungeons & Dragons 5e 2014
▬ **Nível:** 3 ao 20
▬ **Mestre:** <@186160570133643265>
▬ **Estilo/Temática:** Sandbox, sobrevivência
▬ **Local:** Discord + Foundry VTT
▬ **Data & Horários:** Quartas-feiras das 21h às 00h
▬ **Vagas Totais:** 6
▬ **Vagas Disponíveis:** 0
▬ **Mesa Paga:** R$ 35,00 por sessão
Caso se interesse pela aventura, basta enviar um ticket em <#1295552443337281576>
```

Parser **funciona bem** aqui:
- `Sistema:` matched → system_id resolvido
- `Vagas Totais:` + `Vagas Disponíveis:` → ambos extraídos
- `Mesa Paga: R$ 35,00` → price_type=paga, price_value=35
- `Quartas-feiras` → day_of_week=quarta
- `às 21h` → start_time=21:00
- `<#1295552443337281576>` em linha com "interesse" → contact_discord

Volume estimado no Beta: ~50% dos posts.

### S-02 — Post one-shot condensado (`Vagas: 0/6`)

Forum starter de one-shot, formato compacto:

```
▬ **Sistema:** Dungeons & Dragons 5e 2014
▬ **Nível:** 4
▬ **Mestre:** <@225275653333843970>
▬ **Estilo/Temática:** Pós apocalíptico
▬ **Data & Horário:** Dia 24/11, Segunda-feira das 20h às 00h
▬ **Vagas:** 0/6
▬ **Classificação Indicativa:** +18 anos

⚠️ **One-shot Gratuita** ⚠️
```

Parser **falha** em:
1. `Vagas: 0/6` → slots_total=null, slots_open=null (regex atual não cobre `X/Y` sem palavra "vagas" depois)
2. `frequency='semanal'` → incorreto; one-shot não tem frequência semanal (deveria ser `null`, ou `'única'` se quisermos um valor textual)
3. `Mestre: <@225275653333843970>` → host real do post ignorado (parser só caça `<#channel>` em linha com "contato")

Volume estimado no Beta: ~30% dos posts (one-shots semanais).

### S-03 — Post com sistema fora do catálogo

```
▬ **Sistema:** CAIN
▬ **Vagas Totais:** 5
...
```

CAIN é um sistema indie famoso (Tom Bloom, 2024), mas o banco `systems` do Artifício não tem entrada. Parser hoje:
- Identifica hint `CAIN` mas falha em `matchSystem` → `system_name:unmatched_hint`
- Cria `system_suggestion` automática (rota `ensureSystemSuggestionForDraft`) → admin recebe notificação

**Está parcialmente correto** — o admin precisa decidir se o sistema entra no catálogo ou se a mesa fica como "needs_review" para sempre.

Sistemas não-reconhecidos encontrados no Beta:
- CAIN (4 ocorrências)
- Starfinder 2e (4 — existe `Starfinder` no banco, mas matching de versão falha)
- Cosmere RPG, Pokerole 3.0, Mutantes & Malfeitores 3e, Cultos Inomináveis, Malditos Goblins (1 cada)

Volume estimado: ~27% dos needs_review tem essa raiz.

### S-04 — Post com sistema entre parênteses

```
▬ **Sistema:** Pokémon RPG (Sistema próprio usando D&D como base, em fase de desenvolvimento)
```

```
▬ **Sistema:** D&D 5.5 (com retrocompatibilidade)
```

Parser captura **a string inteira** incluindo o parêntese e quebra de linha subsequente como `raw_system_hint`. Isso gera `system_suggestion.name = "D&D 5.5 (com retrocompatibilidade)"` que nunca casa com `Dungeons & Dragons` real.

### S-05 — Post legacy: body == thread_name

3 drafts no Beta têm `content_raw` literal igual ao `discord_thread_name`. Origem: foram ingeridos antes do Message Content Intent estar habilitado (06/05/2026); o Discord retornou body vazio e algum patch antigo populou com o título do tópico.

Exemplo:
- `discord_thread_name`: `"Dungeons & Dragons: Tomb of Annihilation"`
- `content_raw`: `"Dungeons & Dragons: Tomb of Annihilation"`

Parser hoje cria draft com **todos os campos missing** (`["system_name", "day_of_week", "start_time", "slots_total", "contact_url"]`). Pós-Fase 1 esses 3 ficam como ruído permanente no painel.

### S-06 — Post sem attachment de imagem

5 / 189 mensagens (3%) não têm imagem. Volume baixo, mas precisa ser tratado: ausência **não é erro**, é estado válido. Mesa fica com `cover_url=null`.

### S-07 — Post com attachment de imagem (97% dos casos)

```json
{
  "id": "1496987566694727842",
  "url": "https://cdn.discordapp.com/attachments/.../Call_of_CthulhuTM_Heranca_de_Carcosa.jpg?ex=6a01a290&is=6a005110&hm=d62308c772d4945138382446176340174611348e9b936ff7fba46f98d830750b&",
  "proxy_url": "https://media.discordapp.net/attachments/...",
  "filename": "Call_of_CthulhuTM_Heranca_de_Carcosa.jpg",
  "content_type": "image/jpeg",
  "width": 1194,
  "height": 804,
  "size": 550698
}
```

**Problema crítico:** as URLs Discord CDN têm parâmetros `?ex=` e `?is=` que são **assinaturas temporárias**. Elas expiram em aproximadamente 24h. Se o sync persistir `tables.cover_url` apontando para o CDN Discord, a imagem **quebra no dia seguinte**.

Solução: download da URL Discord no momento do sync + re-upload para Cloudinary (que já é a infraestrutura padrão de imagens do Artifício; ver `backend/src/services/cloudinary.ts`). URL final em `tables.cover_url` aponta para Cloudinary, estável.

### S-08 — Post com múltiplos attachments

Não encontrado no Beta hoje, mas Discord permite até 10 attachments por mensagem. Exemplo hipotético: banner + handout PDF. Decisão de produto: pegar **apenas o primeiro attachment image/***, ignorar os demais.

### S-09 — Post com horário em formato exótico

Body do post "Estrada para Calabria" tem `"das 20h às 00h"`. Parser hoje:
- Primeira regex `(\d{1,2})[hH:](\d{0,2})` pega `20h` → start_time=20:00 ✓
- Mas se body for `"20:00 às 23:00"` (sem `h`), regex pega `20:00` corretamente
- Se body for `"das 8 da noite às 11"` (linguagem natural pura), parser falha → `start_time` missing

7 drafts no Beta com start_time missing — provavelmente linguagem natural pura.

---

## 3. Defeitos catalogados (consolidação)

| ID | Defeito | Causa raiz | Severidade | Frequência |
|---|---|---|---|---|
| B-01 | `extractSlots` não reconhece `Vagas: X/Y` (sem palavra "vagas" depois) | regex `(\d+)\s*\/\s*(\d+)\s*vagas?` espera vagas DEPOIS do par; Covil põe ANTES | crítica | 23+ posts (~30%) |
| B-02 | `frequency='semanal'` para `type='one-shot'` | `parseDiscordAnnouncement.ts:379` heurística simplista `dayOfWeek ? 'semanal' : null` | alta | todos os one-shots |
| B-03 | `contact_discord` não captura `<@user>` mention da linha "Mestre:" | `extractContactDiscord` busca palavras-chave de contato (`contato\|ticket\|interesse`), Mestre usa outra palavra | média (cosmético — contact_url já existe na maioria) | ~80% dos posts têm `<@user>` no Mestre |
| B-04 | Cover image / banner ignorado completamente | parser nunca lê `message.attachments`; schema do draft não tem `cover_url` | alta (feature) | 184/189 (97%) |
| B-05 | Sistemas indie/recém-lançados não-reconhecidos | seed `systems` desatualizado; matcher de versão (`5e`, `2e`) inflexível | alta (UX) | 21/78 (27%) |
| B-06 | Sistema com parênteses captura texto extra | `extractLabelValue` lê toda a string até quebra de linha; não para em `(` | média | 3+ posts |
| B-07 | Drafts gerados de body == thread_name (legacy) | mensagens ingeridas pré-Intent têm `content_raw` igual ao título do tópico | baixa | 3 drafts |
| B-08 | start_time em linguagem natural (`8 da noite`) não captura | regex exige formato numérico (`20h`, `20:00`) | baixa | 7 drafts |
| B-09 | Discord CDN URL expira em ~24h | `?ex=` e `?is=` são assinaturas temporárias da Discord; persistir o link direto quebra a imagem da mesa | crítica (se B-04 for resolvido sem upload) | 100% dos posts com imagem |

---

## 4. Schema impactado

### 4.1 Já existe em `tables` (sem migration)

- `cover_url text` — URL pública da imagem de capa (alvo do sync de B-04)
- `banner_url text` — URL pública do banner (separado da capa, decisão de produto: usar mesmo do cover ou ignorar?)
- `banner_crop_data jsonb` — metadados de crop (não relevante para Discord; deixar null)
- `frequency text` (não-enum) — aceita texto livre; permite `'semanal'`, `'única'`, `null` etc.

### 4.2 Precisa de extensão em `discord_import_table_drafts`

`normalized_payload.table` ganha campos novos:
- `cover_url string | null` — URL Cloudinary final, após upload
- `cover_url_source string | null` — URL Discord CDN original (auditoria; também serve como cache key)
- `host_discord_id string | null` — `<@user>` extraído da linha "Mestre:" (B-03; é metadado adicional, não substitui `contact_*`)

Sem migration estrutural — apenas atualização do contrato JSON.

### 4.3 `tables` recebe via sync

`syncDiscordDraftToTable` passa a setar:
- `cover_url = result_of(upload(draft.normalized_payload.table.cover_url || draft.normalized_payload.table.cover_url_source))`
- `frequency = draft.normalized_payload.table.frequency`

---

## 5. Solução proposta (opção D — Tudo)

Plano de 6 fases ordenadas; cada fase tem entrega independente, queries de invariante (E166) e critério de aceitação.

### Fase A — Parser regex: vagas, frequência, host (1-2 dias)

**Tasks:**
1. Reescrever `extractSlots` para 3 padrões em prioridade, refletindo D1 (c):
   - **(canônico)** `Vagas Totais: N` + `Vagas Disponíveis: M` → `total=N`, `open=M`, sem ambiguidade.
   - **(condensado ambíguo)** `Vagas: X/Y` (sem palavra após):
     - `total = max(X, Y)`
     - `open = null`, `slots_filled = null` (parser **não decide** qual é qual)
     - Retorna metadado `_ambiguity = { first: X, second: Y, source: 'x_slash_y' }` para o normalizador
   - **(simples)** `Vagas: N` (um número) → `total=N`, `open=N`, sem ambiguidade.
2. `normalizeDiscordTableDraft` recebe o `_ambiguity` e adiciona `missing_fields: ['slots_open:ambiguous_x_of_y']` quando presente. UI da Fase F lê esse flag e mostra widget de desambiguação.
3. Mudar `frequency`: derivar de `type`:
   - `type='one-shot'` → `frequency=null`
   - `type='campanha'` → `frequency='semanal'` se `day_of_week` presente, senão `null`
   - `type='aberta'` → `frequency=null`
4. Adicionar `extractHostDiscordId`: caçar `<@user>` em linha contendo "mestre", "gm", "narrador", "dm" → preenche `host_discord_id` (campo novo em `normalized_payload.table`).
5. Testes Jest novos cobrindo cada padrão, especialmente o ambíguo.

**Invariante:**
```sql
-- Após re-parse, slots_total ausente cai de 62 para perto de 0
SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'missing_fields' @> '["slots_total"]';
-- Esperado: ≤10

-- Drafts com X/Y ambíguo agora pedem desambiguação
SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'missing_fields' @> '["slots_open:ambiguous_x_of_y"]';
-- Esperado: ≈23 (volume estimado de posts com X/Y)
```

**Critério de aceitação:** `slots_total` em missing cai para ≤10; novo flag `slots_open:ambiguous_x_of_y` aparece em ~23 drafts (esperado, vai ser resolvido pela UI da Fase F).

### Fase B — Parser regex: sistemas com parênteses e versões (1 dia)

**Tasks:**
1. `extractLabelValue('sistema')` retorna a string até `(` exclusive (descarta parêntese e tudo depois) OU até quebra de linha — o que vier primeiro.
2. `matchSystem` ganha estratégia "stripped": se nome literal não casa, tenta sem versão final (`5e`, `5.5`, `2e`, `3e`) e tenta de novo.
3. Testes cobrindo: `Pokémon RPG (Sistema próprio...)`, `D&D 5.5 (com retrocompatibilidade)`, `Starfinder 2e` → todos resolvem para sistema canônico ou geram hint limpo.

**Invariante:**
```sql
-- Após re-parse, hints de sistema não têm parêntese
SELECT DISTINCT normalized_payload->'table'->>'raw_system_hint'
  FROM discord_import_table_drafts
 WHERE normalized_payload->'table'->>'raw_system_hint' LIKE '%(%';
-- Esperado: 0 linhas
```

### Fase C — Captura de imagem do post (2-3 dias)

**Tasks:**
1. Em `parseDiscordAnnouncement`: ler `message.attachments[]`; pegar primeiro com `content_type LIKE 'image/%'` (excluindo `image/svg+xml`); popular `table.cover_url_source` com `attachment.url`.
2. Calcular `table.cover_quality` baseado em D7 (c):
   - `width >= 800 AND size >= 50000` → `'standard'`
   - Caso contrário → `'low'`
3. **NÃO** persistir nenhuma dessas URLs em `tables.cover_url` ainda — Discord CDN expira em 24h. Persistência só na Fase D.
4. UI `DiscordDraftPreview` (Fase F): novo campo "Capa (preview do Discord)" exibe a imagem inline; admin pode aceitar, substituir por upload manual, ou remover.
5. Badge âmbar "Imagem em baixa qualidade" quando `cover_quality='low'`.

**Invariante:**
```sql
-- Após re-parse, drafts derivados de posts com imagem têm cover_url_source
SELECT count(*) FROM discord_import_table_drafts d
  JOIN discord_import_messages m ON m.id = d.discord_message_id
 WHERE jsonb_array_length(m.attachments) > 0
   AND m.attachments::text ~* '(png|jpg|jpeg|webp|gif)'
   AND (d.normalized_payload->'table'->>'cover_url_source') IS NULL;
-- Esperado: 0

-- Distribuição de cover_quality
SELECT normalized_payload->'table'->>'cover_quality' AS q, count(*)
  FROM discord_import_table_drafts
 GROUP BY 1 ORDER BY 2 DESC;
-- Esperado: 'standard' >> 'low'; null para posts sem imagem
```

### Fase D — Upload Cloudinary no sync + cron retry (3-4 dias)

**Tasks:**
1. Função `uploadDiscordImageToCloudinary(sourceUrl: string): Promise<{ url: string, public_id: string }>`:
   - `fetch(sourceUrl)` com timeout 10s → blob
   - `cloudinary.uploader.upload_stream(...)` → URL final
   - Folder `discord-imports/`
   - Idempotência: usar SHA-256 do arquivo como `public_id`
   - Falhas categorizadas: `expired_url` (HTTP 404 ou body vazio), `network` (timeout/dns), `cloudinary` (rejeição da API)
2. Em `syncDiscordDraftToTable`, conforme D3 (b) e D4 (a)+(c):
   - Se `draft.normalized_payload.table.cover_url_source && draft.normalized_payload.table.cover_url IS NULL`:
     - Tenta upload (uma vez no momento do sync)
     - **Sucesso:** persiste `cover_url` no draft (audit) E `tables.cover_url = url` E `tables.banner_url = url` (mesma URL — D3 b)
     - **Falha:** mesa publica sem imagem (`cover_url = banner_url = null` em `tables`); registra erro em `discord_import_table_drafts.image_upload_status` (novo campo: `pending|success|expired_url|network|cloudinary|permanent_fail`); admin recebe notificação via tabela `notifications` existente
3. Cron worker novo `discord:retry-image-uploads` em `mesas-cron` (1×/hora):
   - Lê drafts/mesas com `image_upload_status IN ('expired_url','network','cloudinary')` e `cover_url IS NULL`
   - Re-tenta upload. Sucesso → atualiza ambos `tables.cover_url` e `tables.banner_url`. Falha → incrementa tentativas
   - Stop condition: 5 tentativas com falha → `image_upload_status='permanent_fail'`; cron para de tocar
4. Endpoint admin `POST /admin/discord-sync/drafts/:id/refresh-image` — força re-upload imediato, ignorando contador
5. Telemetria: nova rota `GET /admin/discord-sync/image-uploads/summary` retorna `{ pending, success, expired_url, network, cloudinary, permanent_fail }`

**Invariante:**
```sql
-- Após sync, mesas oriundas de Discord têm cover_url e banner_url Cloudinary, não Discord CDN
SELECT count(*) FROM tables t
  JOIN discord_import_table_drafts d ON d.table_id = t.id
 WHERE t.cover_url LIKE '%discord%' OR t.cover_url LIKE '%discordapp%'
    OR t.banner_url LIKE '%discord%' OR t.banner_url LIKE '%discordapp%';
-- Esperado: 0

-- Conjunto vazio ou poucos uploads em permanent_fail
SELECT image_upload_status, count(*) FROM discord_import_table_drafts
 WHERE cover_url_source IS NOT NULL
 GROUP BY 1;
-- Esperado: success >> tudo; permanent_fail próximo de 0
```

### Fase E — Limpeza de legacy + re-parse em massa (½ dia)

**Tasks:**
1. SQL único: marca como `ignored` com `empty_reason='content_equals_thread_name'` os 3 drafts patológicos (S-05). (Depende da Fase 2 do spec 016 que cria a coluna `empty_reason`; até lá, marcar com `status='ignored'` e `parse_error='legacy_content_equals_thread_name'`.)
2. **Sem alteração no seed `systems.sql`** — D2 fechou em "sugestão para todos". Sistemas não-reconhecidos seguem gerando `system_suggestion` pendente para revisão manual no painel.
3. Re-rodar parse-batch em todos os drafts não-`synced` e não-`rejected` para aplicar Fases A+B+C. Snapshot antes/depois via `SELECT`.

**Invariante:**
```sql
-- Legacy patológicos não geram mais draft em status parsed
SELECT count(*) FROM discord_import_messages
 WHERE content_raw = discord_thread_name
   AND status = 'parsed';
-- Esperado: 0

-- system_name:unmatched_hint NÃO é alvo da redução (D2 — fila de revisão de catálogo)
SELECT count(*) FROM discord_import_table_drafts
 WHERE normalized_payload->'missing_fields' @> '["system_name:unmatched_hint"]';
-- Esperado: ainda ~21; sistemas novos aparecerão como sugestão para revisão admin
```

### Fase F — Frontend (2 dias)

**Tasks:**
1. `DiscordDraftPreview`: novo campo "Capa" mostra preview da imagem (`cover_url_source` se ainda Discord CDN, senão `cover_url` Cloudinary); botão "Substituir" abre upload manual padrão; botão "Remover" zera ambos.
2. Badge âmbar "Imagem em baixa qualidade" quando `cover_quality='low'` (D7 c).
3. Lista `DiscordDraftReviewTable`: thumbnail (40×40) da capa ao lado do título.
4. Quando draft tem `cover_url_source` mas não `cover_url`, exibe selo "Upload pendente" — clarifica que a imagem só vai estabilizar depois do sync.
5. **Widget de desambiguação de vagas (D1 c):** quando `missing_fields` inclui `'slots_open:ambiguous_x_of_y'`, mostra bloco destacado com rádio: "O `X/Y` da mesa significa:" → "(•) `X` inscritos / `Y` total"   "( ) `X` disponíveis / `Y` máximo" + botão "Confirmar". Salvar dispara PATCH com `slots_open` e `slots_filled` derivados; missing remove o flag.
6. Editor de campo `frequency` com select (`semanal`, `quinzenal`, `mensal`, `única`, `outra`) em vez de texto livre.

---

## 6. Decisões fechadas do mantenedor (2026-05-11)

Todas as 7 decisões abaixo foram tomadas pelo mantenedor antes de plan/tasks. Resolução congelada.

### 6.1 Convenção `Vagas: X/Y` — **D1 (c): depende**

Não há convenção única no Covil. Alguns mestres escrevem `X/Y` como `preenchidas/total`, outros como `disponíveis/máximo`. O parser **não pode assumir** sem perguntar.

**Implementação obrigatória:**
- Captura ambos os números: `total = max(X, Y)` (assume que o maior é o total)
- Quando `total > 0` mas vem do padrão `X/Y` (não dos campos canônicos `Vagas Totais` + `Vagas Disponíveis`):
  - `slots_total = max(X, Y)` (preenchido)
  - `slots_open`, `slots_filled` = **null**
  - `missing_fields` ganha `'slots_open:ambiguous_x_of_y'` (novo flag específico)
  - `normalized_payload.table._slots_ambiguity = { first: X, second: Y }` (auditoria do que veio do post)
- UI mostra widget de desambiguação na aba de edição: rádio "X representa: ☐ inscritos ☐ vagas disponíveis"; após admin escolher, draft sai de missing.

**Fora de escopo:** detecção contextual ("se X=0 provavelmente é (a)") — frágil demais; admin decide sempre.

### 6.2 Sistemas faltantes — **D2: sugestão para todos**

Nenhum sistema novo entra no catálogo `systems` agora. Todos os 7 hints (CAIN, Starfinder 2e, Cosmere RPG, Pokerole 3.0, Mutantes & Malfeitores 3e, Cultos Inomináveis, Malditos Goblins) continuam gerando `system_suggestion` pendente.

**Implementação:**
- Sem alteração no seed `systems.sql`
- Re-parse pós-Fases A+B continua gerando `system_suggestion` para hints não-reconhecidos
- Admin/mantenedor decide individualmente no painel já existente de gestão de sugestões
- Drafts com `system_name:unmatched_hint` permanecem em `needs_review` até admin agir

**Critério revisado:** spec 017 não tenta reduzir os 21 `unmatched_hint`. Eles persistem como fila de revisão de catálogo. (Fase 3 do spec 016 separa `settings` × `systems` e pode mudar isso depois.)

### 6.3 Cover × banner em `tables` — **D3 (b): ambos**

A imagem extraída do Discord popula **`cover_url` E `banner_url`** com a mesma URL Cloudinary.

- `tables.cover_url = <url_cloudinary>`
- `tables.banner_url = <url_cloudinary>` (mesma URL)
- `tables.banner_crop_data = null` (parser não decide crop; admin pode editar depois)

Admin pode subir banner diferente manualmente após o sync se quiser.

### 6.4 Falha de upload Cloudinary — **D4 (a) + (c)**

Falha de download/upload **não bloqueia** publicação da mesa.

**Implementação:**
- **(a) Sync prossegue sem imagem:** `tables.cover_url` e `tables.banner_url` ficam null; admin recebe notificação ("Mesa X publicada sem imagem; URL Discord expirou ou upload falhou").
- **(c) Cron periódico re-tenta:** worker já existente (`mesas-cron`) ganha task nova `discord:retry-image-uploads` que roda a cada 1h. Lê drafts/mesas com `cover_url_source` populado mas `cover_url` null, tenta upload, registra resultado. Stop condition: 5 tentativas com fail → marca como `upload_failed_permanent` e para de tentar.
- Endpoint manual `POST /admin/discord-sync/drafts/:id/refresh-image` continua disponível para admin forçar.

### 6.5 Backfill retroativo — **D5: confirmado, sem backfill**

Zero mesas foram sincronizadas via pipeline Discord até a data deste spec. Toda a feature 015/016 ainda está em fase de implementação; nenhuma mesa em produção/Beta foi criada via Discord Sync. **Sem backfill necessário.**

§6.5 removida do escopo de validação. Critério §7 item 4 (95% de cobertura) aplica-se apenas a sincronizações **a partir desta feature**.

### 6.6 Tipos de mídia além de imagem — **D6: apenas imagens**

Parser ignora qualquer attachment com `content_type` que não comece com `image/`. PDFs (handouts), vídeos, áudios são silenciosamente descartados. Sem campo `handout_url` agora; feature futura se demanda aparecer.

### 6.7 Validação mínima da imagem — **D7 (c): captura tudo + flag de qualidade**

Toda imagem `content_type LIKE 'image/%'` é capturada como `cover_url_source`, **independente de tamanho**. Mas o parser adiciona uma flag para o admin revisar.

**Implementação:**
- Sempre popular `cover_url_source` se há attachment image (sem filtro `image/svg+xml`, que pode ser malicioso)
- Calcular `cover_quality` baseado em `width × height`:
  - `width >= 800 AND size >= 50000` (bytes) → `cover_quality = 'standard'`
  - Caso contrário → `cover_quality = 'low'`
- `normalized_payload.table.cover_quality` populado pelo parser
- UI mostra badge âmbar "Imagem em baixa qualidade" quando `cover_quality='low'`, sugerindo upload manual
- Não bloqueia sync — flag é informativa

---

## 7. Critérios de aceitação globais

A entrega só é bem sucedida se, após todas as 6 fases:

1. **Cobertura de slots:** ≤ 10 drafts (de 78) com `slots_total` em missing após re-parse. ~23 drafts ficam com flag novo `slots_open:ambiguous_x_of_y` aguardando desambiguação UI (esperado).
2. **Frequência correta:** zero drafts com `type='one-shot'` e `frequency='semanal'`.
3. **Imagem capturada:** ≥ 95% dos drafts derivados de posts com attachment image têm `cover_url_source` populado.
4. **Imagem persistida:** ≥ 95% das mesas sincronizadas via Discord pós-feature têm `tables.cover_url` E `tables.banner_url` em domínio Cloudinary (D3 b).
5. **Sistemas com parênteses:** zero hints com `(` em `raw_system_hint` (Fase B). Sistemas hoje não-reconhecidos seguem como `system_suggestion` pendente para admin (D2).
6. **Legacy:** zero drafts com `content_raw === discord_thread_name` em status `parsed`.
7. **UX:** preview de capa no painel admin; thumbnail na lista; widget de desambiguação de slots; select de frequência sem texto livre; badge "baixa qualidade" quando `cover_quality='low'`.
8. **Telemetria de imagens:** rota `GET /admin/discord-sync/image-uploads/summary` retorna distribuição de `image_upload_status`; cron `discord:retry-image-uploads` ativo em `mesas-cron`.
9. **E166 cumprido:** toda task GREEN tem `SELECT` no banco-alvo com output literal colado.

---

## 8. Riscos

| Risco | Mitigação |
|---|---|
| Re-parse em massa altera 78 drafts; alguns podem regredir (B-05 introduzido por bug novo) | Snapshot pré-parse via `pg_dump` parcial; comparar antes/depois em transação |
| Cloudinary rate limit em upload em massa | Throttling no sync; cron re-tenta espaçado |
| Convenção `X/Y` errada vira 78 mesas com vagas invertidas | Decisão 6.1 do mantenedor antes de Fase A |
| URLs Discord expiram entre parse e sync | Cron re-upload automático; endpoint manual de refresh |
| Sistemas novos colidem com nomes existentes (Starfinder × Starfinder 2e) | Migration aditiva; aliases dedicados; matcher prioriza nome mais específico |
| Mantenedor adiciona sistema indevido ao catálogo | Decisões 6.2 explicitamente listadas; aprovação por sistema |
| Cover image de baixa qualidade (low-res) vira capa da mesa | Validar `width≥800` no parser; rejeitar abaixo disso |
| Cloudinary cobra por egress se imagem viralizar | Mesma infraestrutura já usada para uploads manuais; sem mudança de orçamento |

---

## 9. Compromissos do agente (reforço E166)

Para todo task GREEN desta feature:

1. Comando exato executado (curl, psql, npm, etc.)
2. Output literal colado na sessão e/ou tasks.md
3. Query de invariante executada após o write, com output
4. Lista de arquivos modificados via `git status`
5. Estado origem → destino (Constitution §9.1)

Sem os 5 itens, a task fica RED.

---

## 10. Fora de escopo (não fazer aqui)

- Importação de PDF/vídeo/áudio (só imagem na Fase C)
- Crop manual da capa (admin usa imagem como veio)
- Múltiplas imagens por mesa (galeria) — Discord post tem 1 banner; gallery é feature de produto separada
- Watermark / overlay automático
- Detecção de imagem ofensiva (moderation) — confia no Covil
- OCR da imagem para extrair texto adicional (rabbit hole)

---

## 11. Anexos

### 11.1 Queries usadas no diagnóstico

```sql
-- Distribuição de missing_fields (foi a base para §1 e §3)
SELECT field, count(*) FROM (
  SELECT jsonb_array_elements_text(normalized_payload->'missing_fields') AS field
    FROM discord_import_table_drafts
   WHERE status='needs_review'
) AS x GROUP BY field ORDER BY 2 DESC;

-- Volume de attachments image
SELECT
  count(*) FILTER (WHERE jsonb_array_length(attachments) > 0) AS msgs_com_attach,
  count(*) FILTER (WHERE attachments::text ~ '(png|jpg|jpeg|gif|webp)') AS msgs_com_attach_img,
  count(*) AS total
FROM discord_import_messages WHERE status='parsed';

-- Schema tables (colunas de imagem já existentes)
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_name='tables'
   AND (column_name LIKE '%image%' OR column_name LIKE '%cover%' OR column_name LIKE '%banner%');

-- Formatos reais de Vagas no body
SELECT regexp_matches(content_raw, '(?i)vagas[:\s]*([^\n]{1,40})', 'g') AS vagas_match, count(*)
  FROM discord_import_messages WHERE status='parsed' AND content_raw ~* 'vagas'
 GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
```

### 11.2 Arquivos lidos durante a investigação

- `backend/src/discord/parseDiscordAnnouncement.ts` (regex completos de extração)
- `backend/src/discord/normalizeDiscordTableDraft.ts` (status binário)
- `backend/src/discord/syncDiscordDraftToTable.ts` (sync para `tables`)
- `frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx` (UI atual sem campo de imagem)
- Schema `discord_import_messages`, `discord_import_table_drafts`, `tables` (via `\d` no Beta)

### 11.3 Referências cruzadas

- Spec 016 §11 — decisões fechadas (LLM via 9router, branch única, drafts antigos descartados)
- E166 — evidência GREEN fabricada (regra obriga `SELECT` no banco-alvo)
- BUG-004 — serialização JSONB (lição: smoke test em deploy)
- L03 (migrations_guide.md) — CHECK CONSTRAINT idempotente
- E167 — smoke test/fixture sem schema check

---

**Fim do spec.** Aguarda decisão do mantenedor nas 6 perguntas da §6 antes de qualquer `plan.md` / `tasks.md` / código.
