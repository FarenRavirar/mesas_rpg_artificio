# Spec 016 — Reconstrução do Pipeline Discord Sync

**Data:** 2026-05-09
**Sessão de origem:** `sessoes/26-05-09_1_discord-pipeline-diagnostico.md`
**Branch SDD anterior associada:** `feat/015-discord-draft-pipeline`
**Estado:** Diagnóstico e proposta — aguardando decisão do mantenedor.
**Autor:** agente da sessão atual (esta proposta substitui claims anteriores em `.specify/memory/project-state.md` que se mostraram fabricados).

> Este spec foi escrito **depois** de queries reais no Beta. Toda métrica abaixo tem origem em `SELECT` executado em 2026-05-09 contra `mesas-beta-db`. Onde a evidência é parcial, está marcada como tal.

---

## 1. Resumo executivo

O pipeline Discord Sync foi entregue ao longo das features 012, 013, 014 e 015. Hoje, no Beta, ele se comporta da seguinte forma:

- **180 mensagens** importadas de 2 canais de fórum do Covil do Lich.
- **170 (94,4%) chegaram ao banco com `content_raw` vazio.**
- O parser, quando recebe corpo de verdade, **funciona perfeitamente** (10/10 drafts ready, missing=[]).
- O parser, quando recebe corpo vazio, **gera draft mesmo assim** se a mensagem é starter de thread, e o classifica como `needs_review` (ou, em 2 casos, como `ready` em estado inconsistente).
- A UI promete **"Sincronizar todos prontos (5)"**, embora apenas drafts com `missing_fields=[]` sejam realmente sincronizáveis.

A principal causa do fracasso percebido pelo mantenedor é **operacional, não algorítmica**: a maioria das mensagens nunca chegou a ter corpo no banco, porque foram ingeridas antes de o Message Content Intent estar habilitado, e a reidratação posterior cobriu apenas uma janela de 7 dias. Há um conjunto secundário de defeitos de contrato e de UX que multiplicam a percepção de falha.

Este spec catalogua todos os defeitos, propõe cinco caminhos de solução (de patch mínimo a redesenho com LLM), e lista decisões que dependem do mantenedor antes de qualquer código.

---

## 2. Histórico relevante

| Data | Evento |
|---|---|
| 03/05/2026 | Feature 012 mergeada — esquema `discord_import_*`, painel admin, sem parser real. |
| 03/05/2026 | Feature 013 mergeada — settings cifrados, token Discord configurado pelo painel. |
| 03/05/2026 | Feature 014 mergeada — discovery de servidores e canais sem ID manual. |
| 04/05/2026 | Feature 015 mergeada — fórum como tipo de canal, ingestão por threads. |
| 04–05/05/2026 | BUG-001 e BUG-002 mergeados — janela de tempo, layout master/detail. |
| 05/05/2026 | BUG-003 reportado — fórum importado mas sem virar mesa publicável. |
| 06/05/2026 | Mantenedor habilitou **Message Content Intent**. Reidratação manual de 7 dias rebuscou 11 starters; backend foi atualizado para gerar drafts automáticos. |
| 06/05/2026 | Commit `68c379d` deployado em Beta. Sessão 26-05-04_1 declarou "11/11 ready missing=[]" como evidência GREEN. |
| 09/05/2026 | Mantenedor reporta `Bares Longínquos` aparecendo como `ready` com 6 campos faltando, descrição vazia, sistema "Sacramento" desconhecido. **A claim de 06/05 não cobria o estado real visível na UI.** |

A última afirmação é importante: a sessão anterior fechou como GREEN com base em parser rodando contra fixtures locais e contra um subconjunto de 11 mensagens reidratadas. Não fechou contra o estado completo do banco. Isso configura **evidência fabricada** no sentido de Constitution §9.2 e está catalogada como erro a ser registrado em `errors.md` ao final desta entrega.

---

## 3. Estado atual medido (Beta — 2026-05-09)

Todas as queries abaixo foram executadas via `ssh -F C:/projetos/config faren "docker exec mesas-beta-db psql -U admin -d mesas_rpg -c '...'"`. Output literal preservado.

### 3.1 Volumetria

```
discord_import_sources       = 2
  📖┃campanhas (forum)       = 103 mensagens, 10 com body
  🎯┃one-shots (forum)       =  77 mensagens,  0 com body
discord_import_messages      = 180
  status='parsed'            = 169
  status='ignored'           =  11
discord_import_table_drafts  = 169
  status='ready'             =  12  (10 limpos + 2 em drift)
  status='needs_review'      = 157
authors únicos               = 1  (covildolich)
source_kind='discord_bot'    = 180  (100%)
```

### 3.2 Conteúdo das mensagens

```
content_raw vazio (length=0)  = 170  (94,4%)
content_raw com texto         =  10  ( 5,6%)
embeds gravado como array     =  11
embeds gravado como object {} = 169
```

### 3.3 Quando o parser recebe corpo de verdade (10 mensagens em `📖┃campanhas`)

```
discord_thread_name                                  | confidence | missing | sistema resolvido
Crystal Heart™: O Último Manuscrito                  |   1.000    |   []    | Pathfinder 2e
Doomed Forgotten Realms™: Rise and Fall of Vecna     |   1.000    |   []    | Dungeons & Dragons
Dungeons & Dragons: Dragons Delves™                  |   1.000    |   []    | Dungeons & Dragons
Dungeons & Dragons™: Deicídio                        |   1.000    |   []    | Dungeons & Dragons
Dungeons & Dragons™: Wrath of the River King         |   1.000    |   []    | Dungeons & Dragons
Forgotten Realms™: Uma Campanha Sandbox              |   1.000    |   []    | Dungeons & Dragons 2024
Fundação 0: Lucro, Ossos e Reputação                 |   1.000    |   []    | One Two Six
Planescape™: Legends of the Outer Planes             |   1.000    |   []    | Dungeons & Dragons
Tormenta20™: A Libertação de Valkaria                |   1.000    |   []    | Tormenta
Waterdeep: Dragon Heist™ + Dungeon of the Mad Mage™  |   1.000    |   []    | Dungeons & Dragons 5e
```

**Diagnóstico parcial:** o parser **não é o gargalo** — quando alimentado, entrega 100%. O gargalo está antes dele.

### 3.4 Drift de status (drafts `ready` com `missing_fields≠[]`)

```
draft_id                                | thread                                          | clen | missing_n | confidence
1b6cdb60-85f0-4a49-94ec-47494a6ec56f    | Sacramento™: Bares Longínquos                   |   0  |     6     |   0.44
75a9df05-5e58-4f12-80f6-f41563124bbe    | One Two Six: Em busca do Símbolo de Wengaltaed… |   0  |     6     |   0.44
```

Em ambos: `created_at == updated_at == 2026-05-06 19:25:16` (delta 0,07s entre eles). Foram criados em sequência por uma rotina de parse após uma reingestão sem janela de tempo, no mesmo dia em que o spec 015 foi declarado GREEN. Nenhum PATCH humano envolvido.

---

## 4. Análise das causas raiz

### CR-1 — Backfill histórico nunca foi executado de forma completa

**Evidência:** 170/180 mensagens com `content_raw` vazio.

Antes de 2026-05-06 o bot estava no servidor sem o **Message Content Intent** habilitado. Em chamadas REST `GET /channels/.../messages` o Discord devolveu metadados, mas com `content` vazio. Esses dados foram persistidos e nunca substituídos.

Em 2026-05-06 o Intent foi habilitado e uma reidratação foi executada com janela de 7 dias (`since=2026-04-29`). Resultado: **apenas 11 starters foram rebuscados**. Os outros 169 continuaram com `content_raw=''` e `embeds={}` no banco.

A operação de reingestão existe (`POST /admin/discord-sync/sources/:id/reingest-force`) e aceita `since/until`, mas **nenhum operador chamou-a sem janela** depois do Intent habilitado. Nenhum job automático faz isso.

> Causa raiz secundária: a UI do Beta não oferece um botão "rebuscar TUDO" — só janelas pré-definidas (24h/7d/30d/90d/sem limite). "Sem limite" foi adicionado mas não foi acionado contra os fóruns inteiros após o Intent.

### CR-2 — Embeds gravados como objeto JSONB vazio

**Evidência:** 169/180 com `jsonb_typeof(embeds)='object'`. O conteúdo é `{}`.

`ingestMessages.persistMessages` grava `(msg.embeds ?? []) as unknown[]`. Se `msg.embeds` é `undefined` ou `null` em payload do Discord, vira `[]` que o Postgres serializa como array. Mas em 169 linhas o campo virou objeto vazio. Hipóteses:

1. Em algum ponto da história, uma migration ou script administrativo escreveu `'{}'::jsonb` como default.
2. Versões antigas do código gravavam JSON `string` com `JSON.stringify(msg.embeds)`, e quando `msg.embeds` era `null`/`undefined` virava `'null'`/`'undefined'` — não bate com o sintoma `{}`, então essa hipótese está descartada.
3. Mais provável: a migration 117 ou anterior define `embeds JSONB DEFAULT '{}'::jsonb`, e quando o código grava sem a coluna ela permanece `{}`. Precisa ser confirmado lendo `database/migration_117_discord_forum_threads.sql`.

A função de leitura `parseJsonField` no [adminDiscordSync.ts:88-100](backend/src/routes/adminDiscordSync.ts:88) já contorna o problema: para `{}`, `Object.values({})=[]`. O sintoma observado pelo parser é "embed array vazio" e o fallback `extractBodyFromEmbeds` retorna string vazia. O bug não impede o pipeline; mas é um cheiro de schema imprecisamente especificado.

### CR-3 — Status do draft pode persistir como `ready` com campos faltando

**Evidência:** 2 drafts com `status='ready'` e `missing_fields` com 6 itens.

Há dois caminhos de escrita de status no backend:

1. **`createOrUpdateDraftFromMessage` / `parsePendingMessagesForSource`** ([adminDiscordSync.ts:193-271](backend/src/routes/adminDiscordSync.ts:193)) — usa `status: normalized.status` derivado do normalizador. Esse caminho **não** deveria produzir drift.
2. **`PATCH /admin/discord-sync/drafts/:id`** ([adminDiscordSync.ts:940-962](backend/src/routes/adminDiscordSync.ts:940)) — aceita `status: 'ready'` literalmente, sem revalidar contra `missing_fields`. Esse caminho **pode** produzir drift, mas só por intervenção humana.

Como ambos drafts com drift têm `created_at==updated_at` (sem PATCH posterior), a hipótese (2) está descartada. Ou seja, **o caminho automatizado também produz drift em alguma condição**. Hipóteses ativas:

- (a) Existe uma versão da rota deployada no Beta (commit `68c379d`) onde o status era persistido a partir de `parsed.confidence` em vez de `normalized.status`. Precisa ser confirmado lendo o `dist/` deployado na VM.
- (b) O `existingDraft.status` em algum estado intermediário não dispara nem o ramo `update` nem o ramo `insert`, e o draft é criado com `status='ready'` por default da coluna. Precisa ser confirmado lendo a migration.
- (c) O `parsedPayload.confidence` foi confundido com o status em alguma versão anterior do código que persistiu drafts.

A causa exata é menos importante do que o fato de que o **contrato "status='ready' implica draft sincronizável" foi violado em produção**. Em qualquer redesenho, o status precisa ser **derivado em runtime** ou uma constraint precisa garanti-lo.

### CR-4 — Cenário/setting tratado como sistema RPG

**Evidência:** `Sacramento` e `One Two Six` foram extraídos de `splitThreadName(thread_name)` quando `body` estava vazio. O parser preserva o hint em `raw_system_hint` e cria `system_suggestion` automática (`ensureSystemSuggestionForDraft`).

O parser tem uma proteção quando há corpo: prioriza `Sistema:` no body e **só** cai para o nome da thread se body estiver vazio. O bug só aparece em mensagens sem body, que é justamente o caso de 94,4% do banco. Quando o pipeline de body for corrigido, este sintoma diminui drasticamente — mas não some, porque mesmo posts ricos em conteúdo às vezes não declaram `Sistema:` explícito.

Adicionalmente: a lista canônica do projeto não distingue **sistema** de **cenário/setting**. Nem aliases nem schema separam "Forgotten Realms é setting de D&D" de "Pathfinder é sistema". O parser hoje confunde as duas categorias.

### CR-5 — `missing_fields` é a única âncora de validação

**Evidência:** [normalizeDiscordTableDraft.ts:38-48](backend/src/discord/normalizeDiscordTableDraft.ts:38) e [parseDiscordAnnouncement.ts:354-363](backend/src/discord/parseDiscordAnnouncement.ts:354).

O sistema atual depende de `missing_fields.length === 0` para considerar um draft pronto. Isso tem três consequências:

1. **Confidence é cosmético.** `confidence=0.44` aparece como "44% Pronto" na UI, mas o gate é binário (missing=[] ou não).
2. **Não há policy de campos toleráveis.** Se um post não tem `slots_total` mas tem todo o resto, ele é `needs_review` — mesmo que para o operador uma mesa "drop-in sem cap" seja válida.
3. **Não há gradiente.** Drafts "98% prontos" se misturam com drafts "5% prontos" sob o mesmo rótulo `needs_review`.

### CR-6 — UX premete sincronização que o backend nega

**Evidência:** botão "Sincronizar todos prontos (5)" no painel; gate em `syncDiscordDraftToTable` (descrito em `MAPA_DE_API.md`) que rejeita 422 se algum campo obrigatório faltar.

Os dois drafts em drift (CR-3) seriam selecionados pelo botão `POST /sync-ready` e devolveriam erro. O botão promete o que não cumpre. Isso não corrompe dados (o gate está lá), mas degrada a confiança do operador.

### CR-7 — Reidratação não comunica falha por mensagem

**Evidência:** rota `POST /sources/:sourceId/reingest-force` retorna `{ deleted, inserted, updated, total, parse: { processed, succeeded, ignored, failed } }`. Não retorna a lista de IDs de mensagens cuja API Discord respondeu sem corpo. Operador não sabe quais posts ainda precisam de atenção manual.

### CR-8 — Heurísticas de regex são frágeis para texto livre

**Evidência:** o parser opera com regex específicas (`R$ 50`, `vagas: 5`, `sexta-feira`, `às 19h`). Funciona porque o Covil do Lich segue um template informal. **Não generaliza** para canais sem template, que é exatamente o próximo passo do projeto (importar mesas anunciadas em chat livre).

---

## 5. Cenários cobertos e cenários abertos

### 5.1 Cenário Atual A — Fórum estruturado, body presente

- Mensagem: starter de thread em fórum, com body de 1500–3000 chars seguindo template do Covil.
- Hoje: parser entrega `confidence=1.0`, `missing=[]`, draft pronto para sync.
- Diagnóstico: **funciona quando a ingestão entrega o corpo**.
- Volume no Beta: 10/180 mensagens.

### 5.2 Cenário Atual B — Fórum estruturado, body ausente

- Mensagem: starter de thread em fórum, mas `content_raw=''` e `embeds={}`.
- Hoje: draft criado com 4 campos (title, type=campanha, modality=online, price_type=gratuita), `missing` com 6 itens, status `needs_review` (ou `ready` se cair na CR-3).
- Diagnóstico: causa raiz CR-1.
- Volume no Beta: **170/180 mensagens (94,4%)**.

### 5.3 Cenário Futuro C — Canal de anúncio formal (announcement)

- Mensagem: post único em canal `GUILD_ANNOUNCEMENT`, sem thread, com formatação tipo "**Mesa**: ...".
- Hoje: ingestor existe (`ingestMessages` para canal text/announcement), parser pode rodar, mas **nunca foi exercitado em produção**.
- Risco: se o post não tem template, o parser regex extrai pouco. CR-8.

### 5.4 Cenário Futuro D — Canal de chat casual

- Mensagem: "ei pessoal, vou rodar uma de vampiro sexta às 20h, 4 vagas, chama no DM" em meio a 50 mensagens não relacionadas.
- Hoje: parser **não distingue mensagem-anúncio de mensagem-conversa**. Geraria draft para qualquer mensagem.
- Risco: explosão de drafts inválidos. Bloqueador. CR-8.

### 5.5 Cenário Futuro E — Canal misto com anúncios e chat

- Mensagem: mistura de C e D no mesmo canal.
- Hoje: mesma situação que D.

### 5.6 Cenário operacional F — Sync automático sem operador

- Hoje: existe coluna `auto_sync_enabled` em `discord_import_sources`, mas nenhum job a consulta. Sync é sempre manual.
- Decisão de produto pendente: o objetivo final é zero intervenção, ou triagem humana segue obrigatória?

---

## 6. Defeitos catalogados (consolidação)

| ID | Defeito | Causa raiz | Severidade | Frequência |
|---|---|---|---|---|
| D-01 | 94% das mensagens sem body no banco | CR-1 | crítica | 170/180 |
| D-02 | Embeds gravados como `{}` em vez de `[]` | CR-2 | baixa | 169/180 (não bloqueia, mas degrada) |
| D-03 | `status='ready'` com `missing_fields≠[]` | CR-3 | crítica | 2/180 (mas permite invariante quebrado a qualquer momento) |
| D-04 | Setting/cenário tratado como sistema RPG | CR-4 | alta | qualquer post sem `Sistema:` explícito |
| D-05 | Confidence não distingue 50% útil de 5% útil | CR-5 | média | toda revisão manual |
| D-06 | Botão "Sincronizar todos prontos" promete o que o backend nega | CR-6 | alta | sempre que houver D-03 |
| D-07 | Reidratação não reporta posts vazios | CR-7 | média | toda reidratação |
| D-08 | Parser regex não generaliza para chat livre | CR-8 | crítica para escopo futuro | 100% dos cenários D/E |
| D-09 | UI mostra "Pronto 44%" — rótulo binário, número contínuo | CR-5+CR-6 | baixa (UX) | sempre |
| D-10 | Mensagens sem body geram drafts mesmo assim | CR-1 + parser permissivo | alta | 170/180 |

---

## 7. Opções de solução

Cinco caminhos viáveis, do mais conservador ao mais ambicioso. Não são mutuamente exclusivos; podem ser combinados.

### Opção α — Patch operacional mínimo (1–2 dias)

**Escopo:**
1. Rodar reingestão sem janela em ambos os canais de fórum, com Intent habilitado, agora que ele está ativo.
2. Adicionar guard no parser: **se body está vazio E não há embeds com texto → não criar draft, marcar mensagem como `media_only` ou `ignored`**.
3. Recompute status de todos drafts existentes via job único: `status = missing_fields.length === 0 ? 'ready' : 'needs_review'`. Resolve D-03.
4. Endurece `PATCH /drafts/:id`: rejeitar `status='ready'` quando `missing_fields≠[]`.

**Resolve:** D-01 (parcial — só posts atuais), D-03, D-10.
**Não resolve:** D-04, D-05, D-08.
**Risco:** baixo. Tudo dentro do schema atual.
**Custo:** 1–2 dias.

### Opção β — Reforma de extração estruturada (5–7 dias)

**Escopo de α, mais:**
5. Separar `system_id` de `setting_id` (cenário). Migration nova: tabela `settings` com lista canônica (Forgotten Realms, Waterdeep, Sacramento se for cenário, Planescape, etc.).
6. Parser ganha matcher de cenário separado. Quando hint do thread name bate em cenário, NÃO cria sugestão de sistema.
7. Substituir `confidence` (atualmente proporção de campos preenchidos) por **score por campo**: cada campo tem `value`, `source` (body/thread/embed/inferred) e `confidence_field` (0–1). UI mostra pendências ranqueadas.
8. Adicionar fixture com 20 posts reais de cada canal e teste de regressão por campo.

**Resolve:** D-04, D-05, D-09, parte de D-08.
**Não resolve:** D-08 para chat livre.
**Risco:** médio. Migrations + refactor de parser.
**Custo:** 5–7 dias.

### Opção γ — Detecção de mensagem-anúncio antes de parsear (3–5 dias)

**Escopo:** introduz um **classificador**, antes do parser, que decide se a mensagem **é um anúncio de mesa** ou ruído.

- Para fórum: starter de thread sempre é anúncio. Replies são ruído (já parcialmente tratado).
- Para canal text: classificador heurístico baseado em features (tem `R$`, tem dia da semana, tem `vagas`, tem mention de canal contato, comprimento mínimo). Mensagem que falha o classificador é ignorada antes do parse.

**Resolve:** habilita cenário D/E sem explosão de drafts. Mitiga D-08.
**Não resolve:** ainda usa regex; texto muito livre derruba precisão.
**Risco:** médio. Classificador heurístico inicial pode ter falsos negativos.
**Custo:** 3–5 dias.

### Opção δ — Extração estruturada via LLM através de 9router (7–14 dias)

**Decisão (09/05/2026):** o roteamento será feito por **[9router](https://github.com/decolua/9router)** rodando na própria VM Oracle (`localhost:20128`). Modelos primários: **`gpt-5.4`** (Codex) e **`gemini-3.1-pro-preview`** (Vertex/GitHub). 9router expõe API OpenAI-compatible, faz fallback automático em 3 tiers (subscription → cheap → free), e aplica compressão RTK que reduz 20–40% dos tokens.

**Escopo:** substituir o parser regex por chamada a modelo via 9router com schema JSON tipado e few-shot prompt baseado em fixtures reais.

- Cada mensagem-candidata vai pro 9router com prompt: "extraia campos canônicos da seguinte mensagem; se não for anúncio de mesa, retorne `null`".
- Output JSON valida contra Zod schema.
- Cache por `content_hash` em tabela nova `discord_llm_extractions`.
- Heurística regex permanece como **fallback offline** quando 9router/upstream indisponível.
- Combo nomeado no 9router (ex: `discord-extract-primary`) com chain `gpt-5.4` → `gemini-3.1-pro-preview` → `claude-haiku-4-5` para resiliência.

**Resolve:** D-04, D-05, D-08 (incluindo cenários C/D/E), parcialmente D-09.
**Não resolve:** D-01 isoladamente — ainda precisa de body.
**Risco:** médio (reduzido pelo 9router gerenciar quota/fallback). Latência adicional (~1–3s por mensagem). Mensagens enviadas ao roteador são logadas localmente; payload sai da VM apenas para o provedor escolhido pelo 9router. Política de privacidade aceita pelo mantenedor com critério "melhor resultado".
**Custo:** 7–14 dias + custo de tokens (subscription dos modelos primários quando ativa, cheap tier $0.20–0.60/1M quando esgotada).

> Estimativa de custo para o volume atual: ~200 mensagens × ~1.5k tokens × $0.0005/1k ≈ $0.15 por full-rebuild no tier cheap; gratuito enquanto subscription estiver ativa. RTK do 9router pode reduzir ainda mais.

### Opção ε — Templates obrigatórios no Discord (0 dias técnicos, prazo organizacional)

**Escopo:** combinar com administradores dos servidores parceiros (começando pelo Covil do Lich) que toda nova mesa siga **template fixo** publicado no canal. Forum guidelines do Discord suportam isso.

**Resolve:** elimina ambiguidade de extração. CR-8 não é mais problema porque o input é estruturado por contrato humano.
**Não resolve:** posts antigos (D-01); canais terceiros que recusem o template.
**Risco:** baixo técnico, alto político. Depende da boa vontade do parceiro.
**Custo:** zero técnico; tempo de negociação.

### Combinações recomendadas (sugestão do agente — decisão é do mantenedor)

- **Curto prazo (esta semana):** α + reidratação completa.
- **Médio prazo (mês):** α + γ + ε.
- **Longo prazo (quando houver volume):** α + γ + δ como camada premium para canais sem template.

Independente da combinação escolhida, é necessário fazer α primeiro: sem isso, todo benefício posterior fica oculto pelo dado sujo já no banco.

---

## 8. Plano de implementação proposto (Opção α + β como primeira fase)

> Esta seção é uma **proposta**, não uma decisão. Depende da resposta às perguntas em §11.

### Fase 1 — Limpeza de invariantes (2 dias)

- T01. RED: teste backend asserta que `status='ready'` ⇒ `missing_fields=[]`. Falha no Beta atual.
- T02. GREEN: rota `PATCH /drafts/:id` valida `status` contra `missing_fields` antes de gravar.
- T03. GREEN: job admin único `POST /admin/discord-sync/drafts/recompute-status` que recalcula status para todos drafts não-`synced` e não-`rejected`. Roda uma vez no Beta.
- T04. RED→GREEN: parser **não cria draft** quando body vazio E embeds vazios — marca mensagem como `ignored` com motivo `'media_only_or_no_content'`.
- T05. Frontend: badge "Pronto" só aparece quando `missing.length===0`; "Pronto 44%" deixa de existir.

Critério de aceitação Fase 1: após rodar, no Beta, `count(*) FILTER (WHERE status='ready' AND missing_fields≠[]) = 0`. Botão "Sincronizar todos prontos" reflete contagem real.

### Fase 2 — Backfill completo de body (1 dia operacional + observação)

- T06. Rodar `POST /sources/:id/reingest-force` em ambos os fóruns **sem janela**, com Intent ON, registrando contagem antes/depois.
- T07. Diagnose-content em **todas** as mensagens que continuarem com `content_raw=''` após T06. Resultado: lista de posts genuinamente sem texto (image-only/PDF). Marcar essas como `ignored` com motivo `'discord_returned_empty'`.
- T08. Adicionar telemetria: rota retorna `{ posts_without_body: [{id, thread_name, reason}] }` para o operador atuar.

Critério de aceitação Fase 2: nenhuma mensagem com `status='parsed'` E `content_raw=''`. Operador tem lista clara do que não foi recuperável.

### Fase 3 — Separar sistema de cenário (3 dias)

- T09. Migration: tabela `settings` (FK opcional `system_id` para sistemas que herdam dele).
- T10. Seed inicial: cenários óbvios (Forgotten Realms, Waterdeep, Planescape, Eberron, Sacramento se for cenário, Sigil, Vecna, Doomed Forgotten Realms, etc.). Lista revisada pelo mantenedor.
- T11. Parser: prioridade `Sistema:` no body > matcher de cenário em thread name > matcher de sistema em thread name. Cenário vira `setting_hint`, não system_hint.
- T12. UI do draft preview: campo `Cenário` separado do campo `Sistema`.

### Fase 4 — Score por campo + UX revisada (2–3 dias)

- T13. Schema do `normalized_payload.table` ganha `_meta` por campo: `{ value, source, confidence_field }`.
- T14. UI mostra pendências ordenadas, e diferencia "Pronto" de "Pronto com avisos" de "Precisa revisão".
- T15. Botão de sync exige `missing===[]` E pelo menos N campos com `confidence_field >= θ`.

### Fase 5 — Posicionar opções γ/δ/ε (decisão do mantenedor)

- T16. **Decisão de produto:** quando partir para classificador (γ), LLM (δ) ou negociar template (ε)?
- T17. Sem decisão, congelar o pipeline em α+β e entregar canais textuais como cenário aberto.

### Fora de escopo desta spec

- Re-arquivamento de drafts antigos como `synced` retroativos.
- Importação de canais GIFs/mídia.
- Gateway WebSocket (hoje só REST). Mantido para feature futura.

---

## 9. Critérios de aceitação globais

A entrega só é considerada bem sucedida se:

1. **Invariantes de banco:** zero drafts em estado inconsistente (`ready` com `missing≠[]`).
2. **Cobertura de body:** mais de 95% das mensagens em fóruns canônicos (campanhas, one-shots) têm `content_raw>0` ou estão explicitamente marcadas como `ignored` com motivo.
3. **Parser:** taxa de extração total (`missing=[]`) em mensagens com body real ≥ 90% no Covil.
4. **UX:** zero promessas no frontend que o backend nega. Botão "Sincronizar todos prontos (N)" sincroniza N mesas, ou rola back todas com motivo claro.
5. **Cenário/sistema:** nenhuma sugestão automática de sistema gerada por nome de cenário canônico (Forgotten Realms, Waterdeep, etc.).
6. **Auditoria:** `errors.md` recebe entrada explicando o gap entre evidência GREEN da sessão 26-05-04_1 e estado real do Beta.
7. **Telemetria:** operador consegue, em uma única chamada/painel, ver quantas mensagens estão "sem corpo" e por que.

---

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Reingestão sem janela esgota rate limit do bot | Pausa de 1s entre chamadas; loop respeita `Retry-After` em 429 |
| Migration de `settings` quebra catálogo existente | Migration aditiva, sem renomear colunas; rollback documentado |
| LLM (se Opção δ) vaza dados de mensagens privadas | Restringir a canais `public` declarados pelo Discord. Logar payload enviado. |
| Patch de status muda comportamento de drafts existentes | Job de recompute roda em transação; dump de tabela antes |
| 170 posts antigos podem ter sido editados/deletados no Discord | Tratar 404 da API como `ignored: 'deleted_in_discord'` |
| Mantenedor decide template (Opção ε) e parceiro recusa | Manter α+β como linha base; opções γ/δ disponíveis |

---

## 11. Decisões do mantenedor (registradas em 2026-05-09)

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Escopo | **α + β** — correção operacional + reforma estrutural na primeira entrega |
| 2 | Cenário/sistema | **Sim, separar `settings` de `systems`** — começa do zero, lista canônica vem do mantenedor durante Fase 3 |
| 3 | Drafts atuais com drift | **Apagar e regerar** — não corrigir in-place |
| 4 | Reingestão sem janela | **Autorizada agora**, antes de Fase 1 (ambiente é Beta) |
| 5 | Direção pós α+β | **Investigar, registrar e implementar γ + δ + ε** — não escolher um, fazer os três |
| 6 | Template no Discord (ε) | Decisão 5 implica que ε também entra; canal/parceiro a definir |
| 7 | Privacidade vs LLM (δ) | **"O que tiver melhor resultado"** — LLM autorizado se for o caminho mais eficaz; provedor a definir na investigação |
| 8 | Branch | **Manter `feat/015-discord-draft-pipeline`** — não abrir branch nova para 016 |
| 9 | Prioridade | (não respondida diretamente; assumir que esta feature lidera o roadmap até estabilização) |
| 10 | Registrar evidência fabricada | **Sim** — entrada `E166` criada em `.specify/memory/errors.md` |

### Implicações operacionais imediatas

- Spec 016 é a **fonte da verdade** mesmo que o trabalho continue na branch `feat/015-discord-draft-pipeline`. O número da spec é apenas catalogação documental; não exige nova branch.
- A combinação adotada é: **α (limpeza) → β (refatoração) → γ (classificador) → δ (LLM) → ε (template)**, executada como fases sequenciais ou paralelas conforme determinar o `plan.md`.
- A reingestão sem janela em ambos os fóruns está autorizada e será executada como T-EXEC-1 antes da Fase 1.
- Drafts existentes (12 ready + 157 needs_review) serão **descartados** ao final do backfill. Mesas já sincronizadas (`status='synced'`) **não** são afetadas.

### Decisão pendente que precisa fechar antes da Fase 5

- Qual provedor LLM (δ): Claude Haiku 4.5 (default natural deste projeto), OpenAI gpt-4o-mini, ou modelo local? Investigação registrada como T-RES-1 no plan.

---

## 12. Compromissos do agente

Para o resto desta entrega, valem os seguintes compromissos, derivados do que falhou no ciclo anterior:

1. **Toda alegação de GREEN será acompanhada de query SQL com output literal.** Nada de "11/11 ready" baseado em parser local.
2. **Nenhum deploy sem auditoria explícita do estado pós-deploy** medido com SELECT no banco-alvo (Beta ou Prod).
3. **Status drift detectado em CR-3 será impossível por design**, não por convenção. Migration ou check constraint, não comentário em código.
4. **Sessão sempre atualizada antes do código.** Constitution §F15 deixa de ser aspiracional.
5. **Spec é fonte da verdade.** Mudanças de escopo voltam aqui antes de virar código. Inferência de Clarification nova é proibida.

---

## 13. Anexos

### 13.1 Queries usadas no diagnóstico

```sql
-- 3.1 Volumetria
SELECT status, count(*) FROM discord_import_messages GROUP BY status;
SELECT status, count(*) FROM discord_import_table_drafts GROUP BY status;
SELECT s.channel_name, s.channel_type, count(m.id) AS msgs,
       count(*) FILTER (WHERE length(m.content_raw)>0) AS with_body
FROM discord_import_sources s
LEFT JOIN discord_import_messages m ON m.source_id=s.id
GROUP BY s.id, s.channel_name, s.channel_type;

-- 3.2 Body e embeds
SELECT count(*) FILTER (WHERE length(content_raw)=0) AS empty,
       count(*) FILTER (WHERE length(content_raw)>0) AS non_empty,
       count(*) FILTER (WHERE jsonb_typeof(embeds::jsonb)='object') AS embeds_obj,
       count(*) FILTER (WHERE jsonb_typeof(embeds::jsonb)='array')  AS embeds_arr
FROM discord_import_messages;

-- 3.4 Drift
SELECT count(*) FILTER (WHERE status='ready'
       AND COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0)=0) AS ready_clean,
       count(*) FILTER (WHERE status='ready'
       AND COALESCE(jsonb_array_length(normalized_payload->'missing_fields'),0)>0) AS ready_dirty
FROM discord_import_table_drafts;
```

### 13.2 Arquivos lidos

- [backend/src/discord/parseDiscordAnnouncement.ts](../../backend/src/discord/parseDiscordAnnouncement.ts)
- [backend/src/discord/normalizeDiscordTableDraft.ts](../../backend/src/discord/normalizeDiscordTableDraft.ts)
- [backend/src/discord/ingestMessages.ts](../../backend/src/discord/ingestMessages.ts)
- [backend/src/routes/adminDiscordSync.ts](../../backend/src/routes/adminDiscordSync.ts)
- [frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx](../../frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx)

### 13.3 Não lidos nesta sessão (referências para Plan)

- `database/migration_117_discord_forum_threads.sql` — confirmar default `embeds JSONB`
- `backend/dist/` na VM — confirmar versão deployada
- `MAPA_DE_API.md` — atualizar contratos quando o plan virar código
- `.specify/memory/errors.md` — entrada do drift e da evidência fabricada

---

**Fim do spec.** Aguarda decisão do mantenedor em §11 antes de qualquer plan/task/código.
