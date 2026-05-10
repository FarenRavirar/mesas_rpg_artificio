# Sessão 26-05-09_2 — Pipeline Discord, Fase 1 em diante

**Data:** 2026-05-09 (criada como base; data efetiva é da 1ª iteração do agente que retomar)
**Objetivo:** Executar o plan `specs/016-discord-pipeline-rebuild/plan.md` da Fase 1 até a Fase 5 (γ + δ + ε), respeitando E166 (evidência via `SELECT` no banco-alvo) e Constitution §9 (RED→GREEN, commits atômicos, sem placeholders).

**Sessão Anterior:** `sessoes/26-05-09_1_discord-pipeline-diagnostico.md` (entregou spec 016, BUG-004 corrigido, T-EXEC-1 GREEN).
**Próxima Sessão:** a definir após Fase 1 fechar.

**Branch alvo:** `feat/015-discord-draft-pipeline` (mantida por decisão do mantenedor — spec 016 §11.8). Nada de branch nova para 016.

---

## Estado de partida (medido no Beta em 09/05/2026 às 13:09 UTC)

```text
discord_import_messages       = 194  (parsed=189, ignored=5)
  com content_raw>0           = 189  (97,4%)
  embeds typeof=array         = 194  (100% — BUG-004 corrigido)

discord_import_table_drafts   = 189  (ready=111, needs_review=78)
  ready com missing≠[]         =   0  ← invariante OK pós-T-EXEC-1

discord_import_sources:
  📖┃campanhas (forum)         = 111 mensagens, 109 com body (98,2%)
  🎯┃one-shots (forum)         =  83 mensagens,  80 com body (96,4%)
```

Mesas publicadas (`tables.status='active'`): preservadas, sem efeito.

Parser (`parseDiscordAnnouncement`) entrega missing=[] em ~58% dos drafts atuais. O restante perde campos por:
- ausência de `Sistema:` explícito no body (cenário em vez de sistema no thread name);
- ausência de `Vagas`, `Dia` ou `Horário` declarados;
- ausência de `Contato` em formato reconhecível.

Esses são casos para Fases 3, 4 e 5.

---

## Plano de execução (resumo do plan 016)

### Fase 1 — Limpeza de invariantes (2 dias)

Garantir que `status='ready' ⇒ missing_fields=[]` seja **impossível por design**, não por convenção.

| Task | RED→GREEN |
|---|---|
| **T-F1-01** Migration `migration_118_discord_drafts_invariant.sql`: `CHECK CONSTRAINT discord_drafts_ready_requires_no_missing` em `discord_import_table_drafts` | `tsx`/`psql` valida que tentativa de UPDATE com `status='ready'` + `missing≠[]` é rejeitada por Postgres. |
| **T-F1-02** Teste backend: `PATCH /drafts/:id { status:'ready' }` em draft com `missing≠[]` retorna **422** | Vitest novo em `backend/src/routes/__tests__/`. |
| **T-F1-03** Implementar guard em `PATCH /drafts/:id` (validar antes do `update`) | Implementação em `backend/src/routes/adminDiscordSync.ts`. |
| **T-F1-04** Teste backend: parser **não cria draft** quando `body` E `embeds[*].description`/`fields` ambos vazios | Modificar `parseDiscordAnnouncement.test.ts`. |
| **T-F1-05** Implementar em `parseDiscordAnnouncement`: retornar `null` para `body=''` E embeds sem texto, mesmo em starter de fórum | Atualizar `backend/src/discord/parseDiscordAnnouncement.ts`. |
| **T-F1-06** Frontend: badge "Pronto" só quando `missing_fields.length===0`. Score numérico vira indicador secundário, sem competir com o status. | `DiscordDraftPreview.tsx`, `DiscordSyncPanel.tsx` (lista). |
| **T-F1-07** Aplicar migration 118 em Beta. Smoke teste pós-deploy. | Migration runner. |
| **T-F1-08** Re-rodar `parse-batch` no Beta após deploy; validar invariante via `SELECT`. | Conformidade E166. |
| **T-F1-09** **NOVO (lição BUG-004):** smoke test pós-deploy automatizado. Workflow CI passa antes do deploy app, mas adicionar step que executa `INSERT/SELECT/DELETE` de teste contra o banco-alvo (sem efeito real) para detectar bugs de serialização antes do canal ficar exposto. | `.github/workflows/_smoke-discord.yml` (novo). |

**Invariantes de fechamento Fase 1:**

```sql
-- Drift impossível
SELECT count(*) FROM discord_import_table_drafts
 WHERE status='ready' AND COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0)>0;
-- Esperado: 0   (constraint impede)

-- Drafts vazios não criados
SELECT count(*) FROM discord_import_messages m
 WHERE length(m.content_raw)=0
   AND NOT EXISTS (
     SELECT 1 FROM jsonb_array_elements(m.embeds::jsonb) AS e
     WHERE jsonb_typeof(e->'description')='string' OR jsonb_typeof(e->'fields')='array'
   )
   AND EXISTS (SELECT 1 FROM discord_import_table_drafts d WHERE d.discord_message_id=m.id);
-- Esperado: 0   (parser não gera draft sem matéria-prima)
```

---

### Fase 2 — Backfill auditável + telemetria (1 dia + observação)

| Task | Foco |
|---|---|
| **T-F2-01..03** Migration 119: coluna `discord_import_messages.empty_reason` (enum: `discord_returned_empty`, `media_only`, `deleted_in_discord`, `not_announcement`) | Diferenciar "vazio porque API Discord não devolve" de "ignorado por design". |
| **T-F2-04** Endpoint `GET /admin/discord-sync/sources/:id/coverage` retorna `{ total, with_body, empty_reasons: { reason: count }, missing_examples: [...] }` | Operador vê o gap. |
| **T-F2-05** Aba "Cobertura" no painel da fonte | Visibilidade. |
| **T-F2-06** Reingestão final autorizada com Intent ON; comparar pré/pós | E166. |

---

### Fase 3 — Separação sistema × cenário (3 dias)

**Decisão pendente do mantenedor:** lista canônica inicial de cenários. Sugestão (precisa validação):

```
Forgotten Realms, Waterdeep, Eberron, Ravenloft, Planescape, Sigil,
Doomed Forgotten Realms, Dark Sun, Dragonlance, Greyhawk, Mystara,
Sacramento, Vecna (settings derivados de D&D);
Glorantha (Runequest); Symbaroum; Golarion (Pathfinder); Eora (Pillars);
[mantenedor adiciona/remove]
```

| Task | Foco |
|---|---|
| **T-F3-02** Migration 120: tabela `settings` com `id, name, name_pt, aliases jsonb, system_id_default uuid nullable references systems(id)` | Schema. |
| **T-F3-03** Seed `database/seeds/settings.sql` com lista validada pelo mantenedor | Catálogo. |
| **T-F3-04..05** Parser usa `matchSetting` antes de `matchSystem` para hint do thread name | Algoritmo. |
| **T-F3-06** Cenário detectado **não** gera `system_suggestion` automática | Contrato. |
| **T-F3-07** UI do draft: campo "Cenário" separado de "Sistema" | UX. |
| **T-F3-08** Re-parsear todos drafts pendentes | Backfill. |

**Invariante:**
```sql
SELECT count(*) FROM system_suggestions
 WHERE status='pending'
   AND EXISTS (SELECT 1 FROM settings s WHERE s.name = system_suggestions.name);
-- Esperado: 0
```

---

### Fase 4 — Score por campo + UX revisada (2–3 dias)

Substituir o binário ready/needs_review por gradiente útil ao operador.

| Task | Foco |
|---|---|
| **T-F4-01** Schema do `normalized_payload.table` ganha `_meta[campo] = { value, source: 'body'\|'thread'\|'embed'\|'inferred', confidence_field: 0..1 }` | Contrato. |
| **T-F4-02** Parser preenche `_meta` para cada campo | Algoritmo. |
| **T-F4-03** UI mostra cada campo com fonte + confiança | UX. |
| **T-F4-04** Lista de drafts ordenável por "% pronto" calculado a partir do `_meta` | Painel. |
| **T-F4-05** **Decisão pendente:** limiar de campos com `confidence_field >= θ` para sincronizar; default proposto `θ=0.7` | Mantenedor. |
| **T-F4-06** Botão "Sincronizar todos prontos" usa novo gate | Sync. |

---

### Fase 5 — γ + δ + ε

#### Fase 5.γ — Classificador (3–5 dias)

Para canais não-fórum onde nem toda mensagem é anúncio.

| Task | Foco |
|---|---|
| **T-F5γ-01** Definir features (R$, dia, vagas, mention contato, comprimento, ratio palavras/total) | Heurística. |
| **T-F5γ-02** `isAnnouncementCandidate(message): { score: number, breakdown: ... }` | Função. |
| **T-F5γ-03** Aplicar antes do parser em fontes com `channel_type ≠ forum` | Pipeline. |
| **T-F5γ-04** Métricas precision/recall sobre amostra rotulada | Validação. |
| **T-F5γ-05** Toggle por fonte: `auto_classifier_enabled` | Opt-in. |

#### Fase 5.δ — LLM via 9router (7–10 dias)

Decisão registrada em `specs/016-discord-pipeline-rebuild/research-llm.md`.
Modelos primários: `gpt-5.4` + `gemini-3.1-pro-preview`. 9router na VM Oracle.

| Task | Foco |
|---|---|
| **T-F5δ-01** Provisionar `mesas-9router` no compose Beta. Porta interna 20128. | Infra. |
| **T-F5δ-02** Env vars cifradas em `discord_settings`: `LLM_ROUTER_URL`, `LLM_ROUTER_API_KEY`. | Config. |
| **T-F5δ-03** Wrapper `backend/src/discord/extractDraftViaLLM.ts` com schema Zod estrito. | Código. |
| **T-F5δ-04** Migration 121: tabela `discord_llm_extractions` (cache por `content_hash`, `model_used`, `tokens_in/out`, `cost_usd`). | Cache. |
| **T-F5δ-05** Estratégia híbrida: regex 1º; se confidence<0.6 e fonte tem `llm_extraction_enabled`, dispara LLM; cache hit pula. | Pipeline. |
| **T-F5δ-06** Toggle por fonte. | Opt-in. |
| **T-F5δ-07** Telemetria: `GET /admin/discord-sync/llm/usage` retorna agregado 30d. | Custo. |
| **T-F5δ-08** Endpoint admin pra ver payload enviado (audit). | Privacidade. |
| **T-F5δ-09** Fallback automático para parser regex se LLM 5xx/timeout. | Resiliência. |
| **T-F5δ-10** Testes: schema rejeita output malformado; cache hit não chama API. | RED→GREEN. |

#### Fase 5.ε — Template Discord (negociação + suporte técnico)

Decisão registrada em `specs/016-discord-pipeline-rebuild/research-template.md`.

| Task | Foco |
|---|---|
| **T-F5ε-01** Mantenedor contata admin Covil; combina conteúdo de Forum Guidelines | Negociação. |
| **T-F5ε-02** Bot publica template como sticky | Operação. |
| **T-F5ε-03** Validador automático: posts fora do template recebem reply do bot com instrução | UX no Discord. |
| **T-F5ε-04** Operador pode forçar parse mesmo de posts fora do template | Override. |

---

## Checklist de fechamento desta sessão

- [ ] `/speckit.retro.run` ao final
- [ ] `.specify/memory/project-state.md` atualizado por fase fechada
- [ ] `.specify/memory/session-log.md` atualizado
- [ ] `sessoes/index.md` atualizado a cada nova sessão
- [ ] Mover esta sessão para `encerradas/` quando autorizado pelo mantenedor

---

## Arquivos por fase (referência rápida)

**Fase 1:**
- `database/migration_118_discord_drafts_invariant.sql` (novo)
- `backend/src/discord/parseDiscordAnnouncement.ts`
- `backend/src/discord/normalizeDiscordTableDraft.ts`
- `backend/src/routes/adminDiscordSync.ts`
- `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts`
- `backend/src/routes/__tests__/adminDiscordSync.drafts.patch.test.ts` (novo)
- `frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx`
- `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx`
- `MAPA_DE_API.md`
- `migrations_guide.md`
- `.github/workflows/_smoke-discord.yml` (novo)

**Fase 2:** `database/migration_119_*`, `backend/src/db/types.ts`, `ingestMessages.ts`, `adminDiscordSync.ts`, `DiscordSourceList.tsx`.

**Fase 3:** `database/migration_120_settings_table.sql`, `database/seeds/settings.sql`, `parseDiscordAnnouncement.ts`, `db/types.ts`, `DiscordDraftPreview.tsx`, `frontend/src/types/settings.ts`, `MAPA_DE_API.md`.

**Fase 4:** `parseDiscordAnnouncement.ts`, `normalizeDiscordTableDraft.ts`, `syncDiscordDraftToTable.ts`, `DiscordDraftPreview.tsx`, `DraftFieldIndicator.tsx` (novo).

**Fase 5.γ:** `backend/src/discord/isAnnouncementCandidate.ts` (novo), `backend/src/discord/__tests__/`, `db/types.ts`, `adminDiscordSync.ts`.

**Fase 5.δ:** `docker-compose.beta.yml`, `backend/src/discord/extractDraftViaLLM.ts` (novo), `database/migration_121_*`, `db/types.ts`, `adminDiscordSync.ts`.

**Fase 5.ε:** `backend/src/discord/forumTemplateValidator.ts` (novo), `bot script no canal Discord (config externa)`.

---

## Critério de conclusão explícito desta sessão

Sessão concluída quando:

1. Fases 1, 2, 3 e 4 entregues com queries de invariante GREEN no Beta.
2. Fase 5 com 5.γ + 5.δ entregues; 5.ε no estado que a negociação permitir.
3. Spec 016 §9 (7 critérios) atendidos integralmente:
   - Invariantes de banco; cobertura ≥95%; parser ≥90%; UI sem promessas falsas; zero sugestão de sistema por cenário; E166 cumprido; telemetria operacional.
4. Mesas publicadas via fluxo Discord ≥ 1 por canal-fonte. Mantenedor confirma manualmente em janela anônima.
5. Todos os commits atômicos, com evidência colada em `tasks.md` por task.

---

## Riscos abertos

| Risco | Mitigação |
|---|---|
| Discord rate limit em reingestões grandes | Adicionar pausa entre threads em `ingestForumMessages` (ainda não implementado) |
| 9router indisponível no provisionamento Beta | Fallback automático para parser regex; deploy escalonado |
| Lista de cenários incompleta gera falsos negativos na Fase 3 | Mantenedor revisa amostra após seed; processo iterativo |
| Mudança de schema Postgres impacta dump/restore | Cada migration tem rollback documentado em `migrations_guide.md` |
| Custo LLM dispara | Telemetria T-F5δ-07 + threshold definido em variáveis Beta |
| Fechamento incorreto de drafts antigos via constraint | Fase 1 começa com job que recompute todos antes de criar a constraint |

---

## Decisões já fechadas (não perguntar de novo ao mantenedor)

| # | Decisão | Origem |
|---|---|---|
| 1 | Escopo α + β + γ + δ + ε | spec 016 §11 |
| 2 | Drafts antigos descartados, não corrigidos in-place | spec 016 §11 |
| 3 | Reingestão sem janela autorizada (já executada com sucesso 09/05) | spec 016 §11 + sessão 26-05-09_1 |
| 4 | LLM via 9router na VM, primários `gpt-5.4` e `gemini-3.1-pro-preview` | research-llm.md |
| 5 | Branch única `feat/015-discord-draft-pipeline` | spec 016 §11 |
| 6 | E166 vinculante: claim de GREEN exige `SELECT` no banco-alvo | errors.md E166 |

## Decisões abertas para o mantenedor (precisa fechar antes da fase indicada)

| Antes de | Decisão |
|---|---|
| Fase 3 | Lista canônica de cenários para `settings` |
| Fase 4 | Limiar `θ` de `confidence_field` para sincronização (default proposto: 0.7) |
| Fase 5.δ | Quem provisiona o 9router — agente via SSH ou mantenedor via console? |
| Fase 5.δ | Limite mensal de custo LLM (ex.: $20/mês) com bloqueio automático |
| Fase 5.ε | Quem é o canal de comunicação com admin do Covil do Lich |
| Fase 5.ε | Texto exato das Forum Guidelines (mantenedor revisa proposta em research-template.md) |

---

## Pré-requisitos antes de iniciar Fase 1

- [ ] Mantenedor revisou spec 016, plan 016 e tasks 016 (todos commitados em `feat/015-discord-draft-pipeline`).
- [ ] Mantenedor revisou snapshot pós-T-EXEC-1 e validou amostra (5–10 drafts ready) na UI.
- [ ] Worktree atual ou nova: definida.
- [ ] Backup leve do banco Beta antes da migration 118 (rollback fácil).

---

## Progresso

- [ ] Sessão aberta e índice atualizado
- [ ] Pré-requisitos validados
- [ ] Fase 1 iniciada
- [ ] Fase 1 fechada
- [ ] Fase 2 iniciada
- [ ] Fase 2 fechada
- [ ] Fase 3 iniciada
- [ ] Fase 3 fechada
- [ ] Fase 4 iniciada
- [ ] Fase 4 fechada
- [ ] Fase 5.γ iniciada
- [ ] Fase 5.γ fechada
- [ ] Fase 5.δ iniciada
- [ ] Fase 5.δ fechada
- [ ] Fase 5.ε iniciada
- [ ] Fase 5.ε fechada
