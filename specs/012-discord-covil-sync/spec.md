# Spec 012 — Pipeline de Importacao e Sincronizacao Covil do Lich

**Feature:** `012-discord-covil-sync`
**Data:** 2026-05-03
**Status:** Em especificacao
**Branch:** `feat/012-discord-covil-sync` (a criar ao iniciar implementacao)
**Base:** `dev`

---

## Contexto

O Covil do Lich e o principal servidor Discord de RPG do Brasil. Mestres anunciam mesas em canais dedicados com formato semi-estruturado. O site ja possui `is_covil`, `origin`, `source_id`, `source_url` e `imported_expires_at` na tabela `tables`, e o filtro `seal=covil-do-lich` ja e suportado no catalogo. A feature cria o pipeline que alimenta esses campos com dados reais vindos do Discord.

A feature **nao cria um novo tipo de mesa**. Ela cria uma camada de ingestao e staging entre o Discord e a tabela `tables` existente.

---

## Decisoes Arquiteturais Aprovadas

| Decisao | Valor |
|---|---|
| Origem de mesa importada | `origin = 'imported'` (sem criar `origin = 'discord'` neste ciclo) |
| Marcador Covil | `is_covil = true` |
| Idempotencia | `source_id = discord_message_id` — se ja existe mesa com esse source_id, atualizar em vez de criar |
| Staging obrigatorio | Mensagens brutas → drafts JSON → mesa real (nunca gravacao direta em `tables`) |
| Sincronizacao automatica | Somente para drafts com status `ready`; drafts `needs_review` exigem acao humana |
| Parser v1 | Deterministico, sem IA |
| Bot fase | Fase 7 (posterior); fases 1–6 funcionam sem bot ativo |
| Compatibilidade futura | Pipeline aceita duas origens: `discord_bot` e `discord_chat_exporter_json` |

---

## Requisitos Funcionais

### RF-001 — Gerenciamento de fontes (canais)
O admin deve poder cadastrar, editar, habilitar e desabilitar canais do Discord como fontes de importacao.

Campos obrigatorios: `guild_id`, `channel_id`.
Campos opcionais: `channel_name`, `enabled`, `auto_sync_enabled`.

### RF-002 — Ingestao de mensagens brutas
O backend deve buscar mensagens dos canais cadastrados e habilitados via REST API do Discord (usando bot token), salvando conteudo bruto, attachments, embeds e metadados em `discord_import_messages`.

Regra de deduplicacao: par `(discord_channel_id, discord_message_id)` deve ser unico. Mensagens ja existentes sao atualizadas se o conteudo mudou (hash diferente).

### RF-003 — Parsing de mensagem para draft
O backend deve parsear o conteudo bruto e gerar um JSON estruturado (DiscordTableDraft) salvo em `discord_import_table_drafts`.

O parser deve extrair, no minimo:
- `title` (nome da mesa)
- `system_name` (texto livre, ainda nao resolvido para UUID)
- `type` (campanha / one-shot / oneshot-serie / aberta)
- `modality` (online / presencial / hibrida)
- `price_type` (gratuita / paga)
- `price_value` (numerico, opcional)
- `slots_total`, `slots_filled`, `slots_open`
- `day_of_week`, `start_time`, `frequency`
- `description`
- `contact_discord`, `contact_url`
- `confidence` (0.0 a 1.0)
- `missing_fields` (lista de campos ausentes)

### RF-004 — Classificacao automatica de drafts
O sistema deve classificar drafts automaticamente:
- `ready`: todos os campos obrigatorios presentes e `system_id` resolvido.
- `needs_review`: campos obrigatorios ausentes OU system_name sem match no banco.

Campos obrigatorios para `ready`:
`title`, `system_id` resolvido, `type`, `modality`, `price_type`, (`slots_total` ou `slots_open`), pelo menos um contato.

### RF-005 — Resolucao de sistema
O normalizador deve tentar resolver `system_name` (texto livre) para `system_id` (UUID) via:
1. Match em `systems.name`
2. Match em `systems.name_pt`
3. Match em `systems.slug`
4. Match em `system_aliases.alias`

Resultado:
- Match unico → `system_id` preenchido, draft pode ser `ready`.
- Match ambiguo ou sem match → draft fica `needs_review`.

### RF-006 — Sincronizacao de draft para mesa
O admin deve poder sincronizar um draft `ready` ou `needs_review` (apos revisao) para uma mesa real em `tables`, com:
- `is_covil = true`
- `origin = 'imported'`
- `source_id = discord_message_id`
- `source_url = discord_message_url`
- `publisher_role = 'announcer'`
- `status = 'active'`

A sincronizacao deve criar registros em `table_contacts` e `table_schedules` a partir dos dados do draft.

### RF-007 — Idempotencia de sincronizacao
Reexecutar sincronizacao para o mesmo `source_id` deve atualizar a mesa existente, nao criar duplicata.

### RF-008 — Painel administrativo
O admin deve ter tela com:
1. Listagem de canais monitorados com botoes CRUD.
2. Botao "Buscar mensagens agora" (dispara ingestao manual).
3. Listagem de mensagens importadas com status.
4. Visualizacao do JSON parseado (draft).
5. Edicao de campos antes de sincronizar.
6. Botao "Sincronizar mesa" (individual).
7. Botao "Sincronizar todas prontas".
8. Indicador de erro de parsing.
9. Filtro por status.

### RF-009 — Exportacao para WhatsApp
O painel deve oferecer botao "Copiar WhatsApp" que gera texto formatado a partir do `TableDetail` da mesa ja sincronizada.

### RF-010 — Compatibilidade com DiscordChatExporter
O sistema deve aceitar importacao de JSON no formato do DiscordChatExporter (estrutura com `guild`, `channel`, `messages[]`) pelo mesmo pipeline de staging, sem alterar o restante do fluxo.

---

## Requisitos Nao Funcionais

- **RNF-001:** Toda rota do modulo e admin-only (`role = 'admin'` + `authMiddleware`).
- **RNF-002:** Parser deterministico — sem dependencia de LLM externo na Fase 1.
- **RNF-003:** Ingestao idempotente — rodar duas vezes o mesmo canal nao duplica mensagens.
- **RNF-004:** Staging isolado — falha no parser nao impede ingestao da mensagem bruta.
- **RNF-005:** `origin` em `tables` permanece `'manual' | 'imported'` neste ciclo. Sem alteracao de tipo.
- **RNF-006:** Sem refactor massivo de codigo existente.
- **RNF-007:** Sem alterar migrations antigas.
- **RNF-008:** Testes unitarios do parser com 8–12 anuncios reais do Covil.

---

## Criterios de Aceite

1. O admin cadastra canais do Covil no painel.
2. O backend busca mensagens desses canais via API Discord.
3. Cada mensagem importada fica salva com conteudo bruto e hash.
4. O parser gera JSON estruturado por mensagem.
5. Drafts incompletos nao viram mesa automaticamente (ficam em `needs_review`).
6. Drafts validos viram mesa com `is_covil = true`.
7. Reexecutar sync nao duplica mesa (idempotencia por `source_id`).
8. Mesa sincronizada aparece no catalogo com filtro `seal=covil-do-lich`.
9. Mesa pode ser exportada para WhatsApp via botao no painel.
10. JSON do DiscordChatExporter pode entrar no mesmo pipeline (estrutura aceita, nao precisa de bot ativo).

---

## Fora de Escopo (neste ciclo)

- `origin = 'discord'` como novo valor de enum — fica para ciclo futuro.
- Sincronizacao automatica periodica (cron) — Fase 7, posterior.
- Bot Discord ativo lendo mensagens em tempo real — Fase 7, posterior.
- Interface publica de mesas do Covil (ja existe via `is_covil` + catalogo).
- Parsing com IA/LLM.
