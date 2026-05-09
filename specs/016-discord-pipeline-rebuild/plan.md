# Plan 016 — Implementação do Pipeline Discord Sync (α + β + γ + δ + ε)

**Data:** 2026-05-09
**Spec de origem:** `specs/016-discord-pipeline-rebuild/spec.md`
**Sessão:** `sessoes/26-05-09_1_discord-pipeline-diagnostico.md`
**Branch alvo:** `feat/015-discord-draft-pipeline` (mantida por decisão do mantenedor)
**Errors registrados:** `E166` em `.specify/memory/errors.md`

---

## 1. Contexto

Decisão do mantenedor (spec 016 §11): executar α + β + γ + δ + ε como entrega contínua. Drafts existentes serão descartados após backfill autorizado. Reingestão sem janela está autorizada agora, antes da Fase 1.

Este plan organiza o trabalho em **6 fases sequenciais com pontos de checkpoint** entre elas. Cada fase define entregáveis, queries de invariante (Constitution §9.2 + E166), arquivos afetados e critério de aceitação derivado da spec §9.

A escolha do provedor LLM (δ) e o canal de negociação para template (ε) são **investigações documentais** que ocorrem em paralelo à Fase 0–2, registradas como `T-RES-*`.

---

## 2. Fases e ordem de execução

```
T-EXEC-1 ──► Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4 ──► Fase 5
(reingest)   (limpeza   (invariantes (parser    (sistema/ (score    (γ + δ + ε)
              de drafts) de status)  permissivo) cenário)  por campo)
                │
                └─ paralelo: T-RES-1 (LLM), T-RES-2 (template/canal Covil)
```

### T-EXEC-1 — Reingestão completa autorizada (operacional, antes da Fase 0)

**Estado:** autorizado pelo mantenedor (spec 016 §11.4). Pode rodar imediatamente.

**Comandos:**

```bash
# Reingestão sem janela em ambos os fóruns
curl -sS -X POST https://mesasbeta.artificiorpg.com/api/v1/admin/discord-sync/sources/<id-campanhas>/reingest-force \
     -H "Authorization: Bearer <admin-jwt>" -H "Content-Type: application/json" -d '{}'
curl -sS -X POST https://mesasbeta.artificiorpg.com/api/v1/admin/discord-sync/sources/<id-one-shots>/reingest-force \
     -H "Authorization: Bearer <admin-jwt>" -H "Content-Type: application/json" -d '{}'
```

**Alternativa via psql (read-only diagnóstico antes/depois):** queries listadas em §6.

**Critério de aceitação:**

- `count(*) FROM discord_import_messages WHERE length(content_raw)>0` aumenta em >100 (de 10 para >150).
- Posts que continuarem com `content_raw=''` ficam listados em uma query de telemetria; serão tratados em Fase 1 (T05) como `media_only_or_no_content`.

**Riscos:** rate limit Discord (mitigado: `ingestForumMessages` faz 1 request por thread; pausa entre threads não existe ainda — adicionar se rate limit estourar).

---

### Fase 0 — Reset de estado dos drafts (½ dia)

**Objetivo:** descartar drafts atuais conforme decisão §11.3, preservando mesas já sincronizadas.

**Tasks:**

| ID | Descrição | Tipo |
|---|---|---|
| T-F0-01 | Snapshot read-only do estado atual (queries de §6 antes da limpeza) | RED |
| T-F0-02 | Job/script SQL: `DELETE FROM discord_import_table_drafts WHERE status NOT IN ('synced','rejected')` | GREEN |
| T-F0-03 | Resetar `discord_import_messages.status` para `'pending'` para mensagens sem draft associado | GREEN |
| T-F0-04 | Snapshot pós-limpeza para confirmação | GREEN |
| T-F0-05 | Acionar `POST /admin/discord-sync/messages/parse-batch` para regerar drafts limpos | GREEN |

**Invariante:**
```sql
SELECT count(*) FROM discord_import_table_drafts WHERE status='ready'
  AND COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0)>0;
-- DEVE retornar 0
```

**Arquivos afetados:** nenhum código. Apenas estado do banco Beta. Escrita autorizada pelo mantenedor.

**Critério de aceitação:** zero drafts em drift; drafts regenerados refletem a versão atual do parser; drafts `synced` preservados intactos.

---

### Fase 1 — Limpeza de invariantes (2 dias)

**Objetivo:** garantir que `status='ready' ⇒ missing_fields=[]` seja **impossível de violar** pelo backend.

**Tasks:**

| ID | Descrição | Tipo |
|---|---|---|
| T-F1-01 | Criar migration `migration_118_discord_drafts_invariant.sql` com `CHECK CONSTRAINT` que valida o invariante | RED→GREEN |
| T-F1-02 | Teste backend (Vitest): asserta que `PATCH /drafts/:id` com `status='ready'` E missing≠[] retorna 422 | RED |
| T-F1-03 | Implementação: validador no schema Zod ou no handler antes de gravar | GREEN |
| T-F1-04 | Teste backend: parser **não cria draft** quando body vazio E embeds vazios — mensagem vai para `ignored` com motivo `'no_content'` | RED |
| T-F1-05 | Implementação: ajustar `parseDiscordAnnouncement` e `createOrUpdateDraftFromMessage` | GREEN |
| T-F1-06 | Frontend: badge "Pronto N%" deixa de existir; só "Pronto" quando missing=[]; resto é "Revisar" + score visual de progresso | GREEN |
| T-F1-07 | Migration aplicada no Beta + smoke teste | GREEN |
| T-F1-08 | Re-rodar parse-batch após Fase 0 e validar invariante via `SELECT` | GREEN |

**Invariante (executar como parte do retro):**
```sql
-- Drift detectável via constraint, mas validamos como SELECT também:
SELECT count(*) FROM discord_import_table_drafts
 WHERE status='ready'
   AND COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0)>0;
-- DEVE retornar 0

-- Mensagens sem corpo não geram draft:
SELECT count(*) FROM discord_import_messages m
 WHERE length(m.content_raw)=0
   AND EXISTS (SELECT 1 FROM discord_import_table_drafts d WHERE d.discord_message_id=m.id);
-- DEVE retornar 0 (todos drafts derivam de mensagens com algum conteúdo elegível)
```

**Arquivos afetados:**
- `database/migration_118_discord_drafts_invariant.sql` (novo)
- `backend/src/discord/parseDiscordAnnouncement.ts`
- `backend/src/discord/normalizeDiscordTableDraft.ts`
- `backend/src/routes/adminDiscordSync.ts` (validação de PATCH)
- `backend/src/discord/__tests__/*.test.ts` (testes RED→GREEN)
- `frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx`
- `frontend/src/features/discord-sync/components/DiscordDraftList.tsx` (ou equivalente)
- `MAPA_DE_API.md` (atualizar contrato de PATCH /drafts/:id)

**Critério de aceitação:** spec 016 §9 itens 1, 4 e 6.

---

### Fase 2 — Backfill auditável + telemetria (1 dia + observação)

**Objetivo:** garantir cobertura de body em ≥95% e tornar visível o que ficou de fora.

**Tasks:**

| ID | Descrição | Tipo |
|---|---|---|
| T-F2-01 | Adicionar coluna `discord_import_messages.empty_reason` (nullable enum) | GREEN |
| T-F2-02 | Migration `migration_119_discord_empty_reason.sql` | GREEN |
| T-F2-03 | Após reingest, marcar mensagens que retornaram da API Discord com `content=''` como `ignored` com `empty_reason='discord_returned_empty'` | GREEN |
| T-F2-04 | Endpoint `GET /admin/discord-sync/sources/:id/coverage` retorna `{ total, with_body, empty_with_reason: [...] }` | GREEN |
| T-F2-05 | Frontend: aba "Cobertura" no painel da fonte mostra % e lista de posts não-recuperáveis | GREEN |
| T-F2-06 | Reingestão final autorizada com Intent ON; comparar pré/pós | GREEN |

**Invariante:**
```sql
SELECT
  count(*) FILTER (WHERE length(content_raw)>0) * 100.0 / count(*) AS pct_with_body
FROM discord_import_messages WHERE source_kind='discord_bot';
-- DEVE ser >= 95.0 OU os ausentes têm empty_reason explícito
```

**Arquivos afetados:**
- `database/migration_119_discord_empty_reason.sql`
- `backend/src/db/types.ts`
- `backend/src/discord/ingestMessages.ts`
- `backend/src/routes/adminDiscordSync.ts`
- `frontend/src/features/discord-sync/components/DiscordSourceList.tsx`
- `MAPA_DE_API.md`

**Critério de aceitação:** spec 016 §9 itens 2 e 7.

---

### Fase 3 — Separação sistema × cenário (3 dias)

**Objetivo:** eliminar D-04 (cenário tratado como sistema). Lista canônica de cenários definida pelo mantenedor.

**Tasks:**

| ID | Descrição | Tipo |
|---|---|---|
| T-F3-01 | Reunião documental com mantenedor: lista inicial de cenários canônicos (Forgotten Realms, Waterdeep, Planescape, Eberron, Sigil, etc.) | RES |
| T-F3-02 | Migration `migration_120_settings_table.sql`: tabela `settings` com FK opcional `system_id` | RED→GREEN |
| T-F3-03 | Seed inicial em `database/seeds/settings.sql` | GREEN |
| T-F3-04 | Estender `SystemEntry` para `SystemOrSettingEntry` com `kind: 'system'\|'setting'` | GREEN |
| T-F3-05 | Parser: nova função `matchSetting` separada; thread name "X: Y" testa primeiro contra `settings`, depois contra `systems` | RED→GREEN |
| T-F3-06 | Quando hint bate em setting, **não** gerar `system_suggestion`; em vez disso, populate `setting_id` no draft | GREEN |
| T-F3-07 | UI do `DiscordDraftPreview`: campo "Cenário" separado de "Sistema" | GREEN |
| T-F3-08 | Backfill: re-parsear todos drafts pendentes e atualizar | GREEN |

**Invariante:**
```sql
SELECT count(*) FROM system_suggestions
 WHERE name IN ('Forgotten Realms','Waterdeep','Planescape','Eberron','Sigil','Sacramento','Doomed Forgotten Realms')
   AND status='pending';
-- DEVE ser 0 (cenários canônicos não geram sugestão de sistema)
```

**Arquivos afetados:**
- `database/migration_120_settings_table.sql`
- `database/seeds/settings.sql`
- `backend/src/discord/parseDiscordAnnouncement.ts`
- `backend/src/db/types.ts`
- `frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx`
- `frontend/src/types/systems.ts` (ou novo `settings.ts`)
- `MAPA_DE_API.md`

**Critério de aceitação:** spec 016 §9 item 5.

---

### Fase 4 — Score por campo + UX revisada (2–3 dias)

**Objetivo:** acabar com binário ready/needs_review e dar gradiente útil ao operador.

**Tasks:**

| ID | Descrição | Tipo |
|---|---|---|
| T-F4-01 | Schema do `normalized_payload.table` ganha `_meta[campo] = { value, source: 'body'\|'thread'\|'embed'\|'inferred', confidence_field: 0..1 }` | GREEN |
| T-F4-02 | Parser preenche `_meta` para cada campo extraído | GREEN |
| T-F4-03 | UI mostra cada campo com indicador de confiança e fonte | GREEN |
| T-F4-04 | Lista de drafts ordenável por "% pronto" calculado a partir do meta | GREEN |
| T-F4-05 | Decisão de produto: limiar de campos com `confidence_field >= θ` para considerar draft sincronizável; default `θ=0.7` | RES |
| T-F4-06 | Botão "Sincronizar todos prontos" só seleciona drafts que passem do limiar | GREEN |

**Invariante:**
```sql
-- Todo draft sincronizável passa pelo gate de confidence_field
SELECT count(*) FROM discord_import_table_drafts d
 WHERE d.status='ready'
   AND EXISTS (
     SELECT 1 FROM jsonb_each(d.normalized_payload->'table'->'_meta') AS f
     WHERE (f.value->>'confidence_field')::numeric < 0.7
   );
-- Deve ser 0 OU haver flag explícita 'manual_override' no draft
```

**Arquivos afetados:**
- `backend/src/discord/parseDiscordAnnouncement.ts`
- `backend/src/discord/normalizeDiscordTableDraft.ts`
- `backend/src/discord/syncDiscordDraftToTable.ts`
- `frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx`
- `frontend/src/features/discord-sync/components/DraftFieldIndicator.tsx` (novo)

**Critério de aceitação:** spec 016 §9 itens 3 e 4.

---

### Fase 5 — γ + δ + ε (escopo expansivo)

#### Fase 5.γ — Classificador de mensagem-anúncio (3–5 dias)

| ID | Descrição |
|---|---|
| T-F5γ-01 | Definir features do classificador heurístico (presença de R$, dia da semana, vagas, mention, comprimento) |
| T-F5γ-02 | Implementar `isAnnouncementCandidate(message): boolean` |
| T-F5γ-03 | Aplicar antes do parser em canais não-fórum |
| T-F5γ-04 | Métricas: precision/recall manual sobre amostra rotulada do Covil |
| T-F5γ-05 | Toggle por fonte: `auto_classifier_enabled` |

#### Fase 5.δ — LLM extraction via 9router (7–10 dias)

**Decisão de provedor:** [9router](https://github.com/decolua/9router) na VM Oracle, primários `gpt-5.4` e `gemini-3.1-pro-preview`. Detalhes em [`research-llm.md`](research-llm.md).

| ID | Descrição |
|---|---|
| T-RES-1 | ✅ **Concluído.** Investigação consolidada em `research-llm.md`: 9router escolhido, modelos primários e fallbacks definidos, custo modelado. |
| T-F5δ-01 | Provisionar 9router na VM Oracle (`docker compose service` na mesma stack do backend, porta interna 20128); criar endpoint nomeado `discord-extract` com combo `gpt-5.4` → `gemini-3.1-pro-preview` → `claude-haiku-4-5` |
| T-F5δ-02 | Adicionar env vars no backend: `LLM_ROUTER_URL=http://9router:20128/v1`, `LLM_ROUTER_API_KEY=…` (cifrado em `discord_settings` ou via env-vars Docker) |
| T-F5δ-03 | Implementar wrapper `backend/src/discord/extractDraftViaLLM.ts`: chama `/v1/chat/completions` com schema Zod estrito; aceita `model: 'discord-extract'` (combo do 9router) |
| T-F5δ-04 | Migration `migration_121_discord_llm_extractions.sql`: tabela de cache por `content_hash`, com `model_used`, `tokens_in`, `tokens_out`, `extraction_cost_estimated` |
| T-F5δ-05 | Estratégia híbrida: parser regex roda primeiro; se `confidence < 0.6` ou body é livre, dispara LLM; cache hit pula chamada |
| T-F5δ-06 | Toggle por fonte: coluna `discord_import_sources.llm_extraction_enabled` (default false; opt-in por canal) |
| T-F5δ-07 | Telemetria: rota `GET /admin/discord-sync/llm/usage` retorna custo agregado e taxa de fallback dos últimos 30d |
| T-F5δ-08 | Observação de privacidade: log do payload enviado fica acessível ao admin via `GET /admin/discord-sync/llm/extractions/:id` (rate-limited, audit-logged) |
| T-F5δ-09 | Fallback explícito quando 9router devolve 5xx ou timeout: cair para parser regex sem perder ingestão |
| T-F5δ-10 | Testes RED: schema Zod rejeita output malformado do LLM; cache hit não chama API |

#### Fase 5.ε — Template no Discord (negociação + suporte técnico)

| ID | Descrição |
|---|---|
| T-RES-2 | **Investigação documental:** mapear processo Discord para Forum Guidelines / Bot prompt no canal Covil. Negociar com administradores. Resultado em `specs/016-discord-pipeline-rebuild/research-template.md`. |
| T-F5ε-01 | Bot publica template como sticky no canal de fórum |
| T-F5ε-02 | Validador automático rejeita posts que não seguem template e responde com instruções (em vez de criar draft) |
| T-F5ε-03 | Operador pode forçar parse mesmo de posts fora do template via UI |

**Critério de aceitação Fase 5 global:** spec 016 §9 — todos os 7 critérios continuam atendidos com canais novos (anúncio formal, chat livre).

---

## 3. Dependências e checkpoints

```
T-EXEC-1
   │
   ▼
Fase 0 ─── checkpoint mantenedor (drafts limpos) ───┐
                                                    ▼
                                                 Fase 1 ─── checkpoint deploy beta
                                                    │
                                                    ▼
                                                 Fase 2 ─── checkpoint cobertura ≥95%
                                                    │
                                                    ▼
                                                 Fase 3 ─── checkpoint cenários
                                                    │
                                                    ▼
                                                 Fase 4 ─── checkpoint UX
                                                    │
                                                    ▼
                                          ┌────── Fase 5 ──────┐
                                          ▼         ▼          ▼
                                       5.γ      5.δ        5.ε
                                       (paralelizáveis após T-RES-1 e T-RES-2)
```

Cada checkpoint exige:
1. Query de invariante executada com output literal.
2. Build verde + testes verdes.
3. Aprovação explícita do mantenedor antes de seguir.

---

## 4. Estimativa total

| Bloco | Estimativa |
|---|---|
| T-EXEC-1 | 1h (operacional) |
| Fase 0 | 0,5 dia |
| Fase 1 | 2 dias |
| Fase 2 | 1 dia + observação |
| Fase 3 | 3 dias |
| Fase 4 | 2–3 dias |
| Fase 5.γ | 3–5 dias |
| Fase 5.δ | 7–14 dias |
| Fase 5.ε | dependente de negociação |
| **Total mínimo** | **~18 dias úteis** sem ε |
| **Total realista** | **3–4 semanas** com checkpoints |

---

## 5. Compromissos do agente (reforço de E166)

Para todo task GREEN deste plan, o agente DEVE entregar:

1. **Comando exato executado** (curl, psql, npm, etc.).
2. **Output literal** colado na sessão e/ou tasks.md.
3. **Query de invariante** executada após o write, com output.
4. **Lista de arquivos modificados** via `git status`.
5. **Estado de origem → destino** no formato Constitution §9.1.

Sem os 5 itens, a task fica RED. Não existe PARTIAL.

---

## 6. Queries de invariante por fase

### Fase 0
```sql
-- Snapshot pré-limpeza
SELECT status, count(*) FROM discord_import_table_drafts GROUP BY status;
-- Snapshot pós-limpeza
SELECT count(*) FROM discord_import_table_drafts WHERE status NOT IN ('synced','rejected');
-- Esperado: 0 antes do parse-batch, depois >0 mas todos coerentes
```

### Fase 1
```sql
SELECT count(*) FROM discord_import_table_drafts
 WHERE status='ready' AND COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0)>0;
-- Esperado: 0
```

### Fase 2
```sql
SELECT count(*) FILTER (WHERE length(content_raw)>0) * 100.0 / count(*) AS pct
FROM discord_import_messages;
-- Esperado: >= 95.0 ou empty_reason set
```

### Fase 3
```sql
SELECT count(*) FROM system_suggestions
 WHERE status='pending'
   AND name IN (SELECT name FROM settings);
-- Esperado: 0
```

### Fase 4
```sql
-- Implementada quando schema _meta existir
```

### Fase 5
```sql
-- Específicas por sub-fase, definidas em research-llm.md e research-template.md
```

---

## 7. Estado e próximo passo imediato

**Estado:** plan aceito (após review do mantenedor).
**Próximo passo:** gerar `tasks.md` para Fase 0 + Fase 1, depois aguardar autorização para executar T-EXEC-1.
