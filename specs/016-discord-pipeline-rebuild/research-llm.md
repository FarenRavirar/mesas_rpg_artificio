# T-RES-1 — Pesquisa: provedor LLM para extração estruturada (Fase 5.δ)

**Data:** 2026-05-09
**Decisão (mantenedor, 09/05/2026):** **9router** rodando na VM Oracle, primários `gpt-5.4` e `gemini-3.1-pro-preview`.
**Status:** Concluído (decisão registrada). Tasks de implementação ficam em `plan.md` §Fase 5.δ.

---

## 1. Objetivo da pesquisa

Spec 016 §11 decisão 5 ("investigar, registrar e implementar γ + δ + ε") combinada com decisão 7 ("o que tiver melhor resultado") exige investigação de provedor LLM para extração estruturada de drafts a partir de mensagens Discord livres ou semi-estruturadas.

A decisão de produto pré-fechada pelo mantenedor (09/05) é **9router** — este documento registra o **porquê**, o **como integrar** e os **trade-offs** que ficam em aberto.

---

## 2. O que é 9router

Roteador local de requisições LLM em formato OpenAI-compatible (`/v1/chat/completions`). Repositório: <https://github.com/decolua/9router>.

Características relevantes para este projeto:

- **API local:** roda em `localhost:20128` (configurável). Backend chama HTTP local; sem dependência direta da rede pública para cada chamada.
- **OpenAI-compatible:** endpoint `/v1/chat/completions` aceita `model`, `messages`, `stream`, `tools`. Permite usar mesmo cliente que SDK OpenAI/Anthropic.
- **Fallback 3-tier automático:** subscription → cheap ($0.20–0.60/1M tokens) → free. Se quota do primário esgota, roteia para o próximo sem mudança no chamador.
- **Combos nomeados:** ex. `discord-extract` = chain `gpt-5.4` (subscription) → `gemini-3.1-pro-preview` (vertex/free) → `claude-haiku-4-5` (subscription baixa). Configurado uma vez, reutilizado por nome.
- **40+ providers:** OpenAI, Anthropic, Gemini/Vertex, GitHub Copilot, Cursor, GLM, MiniMax, Kimi, DeepSeek, Groq, xAI, Mistral, Perplexity, OpenRouter, etc.
- **RTK (token compression):** comprime payloads tipo `tool_result`, `git diff`, `grep`, `tree` em 20–40%. Para mensagens Discord não muda muito (texto humano), mas não atrapalha.
- **Storage:** JSON em `${DATA_DIR}/db.json` (LowDB). Sem Postgres adicional.
- **Auth:** Bearer token gerado por endpoint no dashboard.

### Modelos primários decididos

| Posição | Modelo | Provedor 9router | Tier | Notas |
|---|---|---|---|---|
| 1 | `gpt-5.4` | `cx/gpt-5.4` (Codex) ou `gh/gpt-5.4` (GitHub Copilot) | Subscription | Melhor relação custo/qualidade para extração estruturada com schema |
| 2 | `gemini-3.1-pro-preview` | `vertex/gemini-3.1-pro-preview` ou `gh/gemini-3.1-pro-preview` | Free/Subscription | Fallback rápido; bom em contexto longo |
| 3 | `claude-haiku-4-5` | `cc/claude-haiku-4-5-20251001` (Claude Code) | Subscription | Backup com baixa latência se 1 e 2 indisponíveis |

---

## 3. Por que 9router (decisão do mantenedor)

Critérios apresentados em spec 016 §7:

| Critério | 9router |
|---|---|
| Múltiplos provedores | ✅ 40+ |
| Fallback automático | ✅ 3 tiers |
| Auto-hospedável | ✅ Docker, VPS, npm |
| OpenAI-compatible | ✅ direto |
| Custo previsível | ✅ subscription primária + cheap tier ~ $0.20/1M |
| Privacidade | ⚠️ payload sai da VM para o provedor escolhido pelo router; log local opcional |
| Modelos definidos pelo mantenedor | ✅ `gpt-5.4` e `gemini-3.1-pro-preview` disponíveis |

Critério extra do mantenedor: **rodar na própria VM**. 9router atende. Deploy alinhado com o restante do stack (`/opt/mesas-beta/`).

---

## 4. Plano de integração técnica

### 4.1 Provisionamento

Adicionar serviço `9router` em `docker-compose` da VM:

```yaml
services:
  9router:
    image: 9router/9router:latest         # ou build local do repo
    container_name: mesas-9router
    restart: unless-stopped
    ports:
      - "127.0.0.1:20128:20128"            # exposto só para localhost da VM
    environment:
      - JWT_SECRET=${ROUTER_JWT_SECRET}
      - INITIAL_PASSWORD=${ROUTER_PASSWORD}
      - DATA_DIR=/var/lib/9router
      - PORT=20128
      - HOSTNAME=0.0.0.0
      - NODE_ENV=production
      - REQUIRE_API_KEY=true
      - ENABLE_REQUEST_LOGS=true           # auditoria de payloads enviados
    volumes:
      - 9router-data:/var/lib/9router
    networks:
      - mesas-beta_default                 # mesma rede do backend
volumes:
  9router-data:
```

Backend acessa via `http://9router:20128/v1` (DNS interno da rede Docker) ou `http://localhost:20128/v1` (host network).

### 4.2 Endpoint nomeado / combo

No dashboard do 9router (após primeiro login):

```
Combo Name: discord-extract
Models (priority order):
  1. cx/gpt-5.4              (subscription primary)
  2. vertex/gemini-3.1-pro-preview  (free/cheap fallback)
  3. cc/claude-haiku-4-5-20251001   (final fallback)
RTK: enabled
Stream: false (extração é one-shot)
```

API key gerada para uso pelo backend, armazenada em `discord_settings` (tabela já existe, criptografia AES-256-GCM derivada de `JWT_SECRET`).

### 4.3 Wrapper no backend (`backend/src/discord/extractDraftViaLLM.ts`)

Esqueleto:

```ts
import { z } from 'zod';
import { requireRouterApiKey, requireRouterUrl } from './config';
import type { DiscordRawMessage, DiscordTableDraft } from './types';

const llmDraftSchema = z.object({
  is_announcement: z.boolean(),
  table: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    system_name: z.string().nullable(),
    setting_name: z.string().nullable(),
    type: z.enum(['campanha','one-shot','aberta']).nullable(),
    modality: z.enum(['online','presencial','hibrida']).nullable(),
    price_type: z.enum(['gratuita','paga']).nullable(),
    price_value: z.number().nullable(),
    slots_total: z.number().int().nullable(),
    day_of_week: z.string().nullable(),
    start_time: z.string().nullable(),
    contact_url: z.string().nullable(),
    contact_discord: z.string().nullable(),
  }).nullable(),
  field_confidence: z.record(z.number().min(0).max(1)),
});

export async function extractDraftViaLLM(message: DiscordRawMessage): Promise<DiscordTableDraft | null> {
  const apiKey = await requireRouterApiKey();
  const url    = requireRouterUrl();

  const response = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'discord-extract',  // combo nomeado
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_PT_BR },
        { role: 'user', content: buildUserPrompt(message) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) throw new Error(`LLM router returned ${response.status}`);
  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  const parsed = llmDraftSchema.safeParse(JSON.parse(content));
  if (!parsed.success) return null;
  if (!parsed.data.is_announcement || !parsed.data.table) return null;

  return assembleDraft(message, parsed.data);
}
```

### 4.4 Cache (`migration_121_discord_llm_extractions.sql`)

```sql
CREATE TABLE discord_llm_extractions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash    VARCHAR(64) NOT NULL UNIQUE,
  message_id      UUID REFERENCES discord_import_messages(id) ON DELETE SET NULL,
  model_used      VARCHAR(120) NOT NULL,
  tokens_in       INTEGER,
  tokens_out      INTEGER,
  cost_usd        NUMERIC(10,6),
  prompt_payload  JSONB,
  raw_response    JSONB,
  parsed_result   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discord_llm_extractions_hash ON discord_llm_extractions(content_hash);
```

Lookup antes de chamar o router; se hit, reusa `parsed_result`.

### 4.5 Estratégia híbrida regex + LLM

```
para cada message pendente:
  1. roda parser regex
  2. se confidence >= 0.85 E missing_fields = [] → usa só regex
  3. senão, e fonte tem llm_extraction_enabled=true → roda LLM
  4. resultado LLM tem prioridade sobre regex se confidence_field maior
  5. cache content_hash sempre
```

---

## 5. Custo modelado

Volume atual: ~200 mensagens. Crescimento esperado: até 50 mensagens/semana por canal × N canais.

| Cenário | Tokens médios | Mensagens | Custo (cheap tier $0.40/1M) | Custo (subscription) |
|---|---|---|---|---|
| Backfill atual | 1.5k in + 0.5k out | 200 | ~$0.16 | $0 |
| 1 mês 4 canais | 1.5k + 0.5k | 800 | ~$0.64 | $0 |
| 1 ano operação | 1.5k + 0.5k | ~10k | ~$8 | $0 |

Com cache por `content_hash`, reprocessamentos custam $0.

> Conclusão: custo desprezível enquanto subscription estiver ativa. Mesmo no pior cenário (subscription esgotada → cheap tier), está sob $10/ano para o volume previsto.

---

## 6. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| 9router fora do ar | Fallback automático para parser regex (`extractDraftViaLLM` joga, wrapper captura, regex assume) |
| Provedor primário (gpt-5.4) muda contrato | 9router abstrai; combo se mantém estável; mantenedor reordena prioridade no dashboard |
| Latência alta (>3s/mensagem) | Bloqueia ingestão? Não — extração roda fora do path crítico de fetch; em job dedicado |
| Output malformado do LLM | Schema Zod estrito + retry com `temperature=0` + fallback regex |
| Vazamento de payload em log | `ENABLE_REQUEST_LOGS=true` mas logs ficam apenas na VM; rota admin protegida por `authMiddleware` |
| Custo dispara | Telemetria (`T-F5δ-07`) alerta se custo/30d cruza limite definido pelo mantenedor |
| 9router não suporta versão exata `gpt-5.4` ou `gemini-3.1-pro-preview` | Pesquisa do README confirmou ambos no catálogo `cx/gpt-5.4` e `vertex/gemini-3.1-pro-preview` em 09/05/2026 |

---

## 7. Próximos passos (deslocados para Fase 5.δ no plan.md)

1. T-F5δ-01 — provisionar serviço 9router no compose Beta.
2. T-F5δ-02 — adicionar env vars cifradas.
3. T-F5δ-03..10 — wrapper, migration, cache, telemetria, testes.

Esta investigação fecha aqui. Decisões arquiteturais residuais (rotacionar API keys, definir limite de custo mensal, política de retenção de logs do router) ficam para o `plan.md` da Fase 5.δ no momento da implementação.

---

## 8. Referências

- 9router README — <https://github.com/decolua/9router> (consultado 09/05/2026)
- Site oficial — <https://9router.com>
- Spec 016 §7 (Opção δ) — <../spec.md>
- Constitution §10 (infraestrutura na VM Oracle) — <../../../.specify/memory/constitution.md>
