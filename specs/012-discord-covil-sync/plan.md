# Plan 012 — Pipeline de Importacao e Sincronizacao Covil do Lich

**Feature:** `012-discord-covil-sync`
**Data:** 2026-05-03
**Baseado em:** `spec.md` aprovado pelo mantenedor

---

## 1. Contexto Tecnico

### Estado atual aproveitado

| Artefato | Localizacao | Uso |
|---|---|---|
| `is_covil`, `origin`, `source_id`, `source_url`, `imported_expires_at` | `tables` (banco) | Campos ja existem; nao precisam de migration |
| `TableOrigin = 'manual' \| 'imported'` | `backend/src/db/types.ts:221` | Manter sem alteracao |
| `createTableSchema` | `backend/src/validators/tableValidators.ts:112` | Reaproveitar para validar payload antes de sync |
| `TableService.prepareTableData` | `backend/src/services/tableService.ts:124` | NAO reaproveitado — assinatura incompativel (requer `CreateTableInput` completo); `syncDiscordDraftToTable` constroi `Insertable<TablesTable>` diretamente |
| `TableRepository.createTableWithRelations` | `backend/src/repositories/tableRepository.ts:56` | Reaproveitar para criar mesa com relacoes |
| `authMiddleware` + `role === 'admin'` | `backend/src/routes/adminTables.ts` | Padrao de autorizacao a seguir |
| `server.ts` | `backend/src/server.ts:105` | Registro de rotas por modulo |
| `system_aliases` | `backend/src/db/types.ts:522` | Tabela disponivel para resolucao de sistema |
| OAuth Discord existente | `backend/src/routes/discord.ts` | Rota de vinculo de perfil — NAO conflita com bot |

### Dependencias novas

| Dependencia | Motivo |
|---|---|
| `discord.js` (npm) | Cliente HTTP/WebSocket para API Discord (Fase 7) |
| `tsx` (devDependency) | Execucao de scripts TypeScript em dev |

> Fases 0–6 nao requerem `discord.js` instalado para funcionar. A ingestao manual (Fase 3) usara `fetch` nativo ou `node-fetch` para REST API Discord.

---

## 2. Decisoes Tecnicas

### DT-001: Ingestao REST antes do bot
Fases 1–6 usam REST API do Discord (`GET /channels/:id/messages`) com bot token. Isso permite desenvolvimento e teste do pipeline completo sem bot WebSocket ativo.

### DT-002: content_hash para deduplicacao
Campo `content_hash` em `discord_import_messages` armazena SHA-256 do `content_raw`. Mensagens editadas sao detectadas por hash diferente e reprocessadas.

### DT-003: Pipeline de 3 camadas estanque
- Camada 1 (ingestao): grava mensagem bruta. Falha no parser nao impede gravacao.
- Camada 2 (parsing): gera draft JSON. Falha de normalizacao nao impede salvamento do draft.
- Camada 3 (sync): cria/atualiza mesa real. Requer draft `ready` ou acao manual do admin.

### DT-004: source_id como chave de idempotencia
`tables.source_id` = `discord_import_messages.discord_message_id`. Antes de criar mesa, verificar se ja existe `tables` com esse `source_id`. Se sim, atualizar.

### DT-005: ImportSourceKind para compatibilidade futura
Campo (ou metadata) `source_kind` em `discord_import_messages` para distinguir `discord_bot` de `discord_chat_exporter_json`. Permite importar JSON do ChatExporter pelo mesmo pipeline sem mudanca de schema.

### DT-006: Sistema resolvido via tabela system_aliases
Resolucao de `system_name` → `system_id` em ordem: `systems.name` → `systems.name_pt` → `systems.slug` → `system_aliases.alias`. Match case-insensitive. Ambiguidade = `needs_review`.

### DT-007: Rota propria por modulo
Nova rota `backend/src/routes/adminDiscordSync.ts` registrada em `/api/v1/admin/discord-sync` no `server.ts`, seguindo padrao de `adminTables.ts`.

### DT-009: Modulo Discord com fronteira explicita via index.ts
`backend/src/discord/index.ts` e a unica exportacao publica do modulo. Todo codigo fora de `discord/` (rotas, scripts, testes) importa exclusivamente de `'../discord'` — nunca de arquivos internos como `'../discord/parseDiscordAnnouncement'`. Arquivos dentro de `discord/` podem se importar diretamente entre si. Isso:
- Evita duplicacao de logica de ingestao/parsing em rotas e scripts.
- Permite reorganizar internos sem quebrar consumidores externos.
- Prepara o modulo para crescer (bot, ChatExporter, novas fontes) sem contaminar o resto do backend.

### DT-008: Exportacao WhatsApp no frontend
`formatTableForWhatsapp` e funcao pura em `frontend/src/features/discord-sync/utils/formatWhatsappExport.ts`, sem dependencia de componente React. Recebe `TableDetail` e retorna string.

---

## 3. Arquivos a Criar

### Backend — banco de dados
```
database/migration_115_discord_import.sql
```

### Backend — tipos
```
backend/src/db/types.ts          (alterar: adicionar 3 novas tabelas)
```

### Backend — discord (modulo isolado com fronteira publica)
```
backend/src/discord/index.ts                                   ← fronteira publica do modulo
backend/src/discord/config.ts
backend/src/discord/types.ts                                   ← tipos internos do modulo
backend/src/discord/ingestMessages.ts
backend/src/discord/parseDiscordAnnouncement.ts
backend/src/discord/normalizeDiscordTableDraft.ts
backend/src/discord/syncDiscordDraftToTable.ts
backend/src/discord/client.ts                                  ← Fase 7 (bot WebSocket)
backend/src/discord/importers/discordBotMessageImporter.ts
backend/src/discord/importers/discordChatExporterJsonImporter.ts
```

Regra de importacao:
- Fora do modulo: `import { ... } from '../discord'`
- Dentro do modulo: `import { ... } from './parseDiscordAnnouncement'` (direto)

### Backend — rotas administrativas
```
backend/src/routes/adminDiscordSync.ts
```

### Backend — scripts
```
backend/src/scripts/syncDiscordChannels.ts
```

### Frontend — feature
```
frontend/src/features/discord-sync/api/discordSyncApi.ts
frontend/src/features/discord-sync/types.ts
frontend/src/features/discord-sync/utils/formatWhatsappExport.ts
frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx
frontend/src/features/discord-sync/components/DiscordSourceList.tsx
frontend/src/features/discord-sync/components/DiscordDraftReviewTable.tsx
frontend/src/features/discord-sync/components/DiscordDraftPreview.tsx
frontend/src/features/discord-sync/components/WhatsappExportModal.tsx
```

### Testes unitarios
```
backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts
```

---

## 4. Arquivos a Alterar

| Arquivo | Mudanca |
|---|---|
| `backend/src/server.ts` | Registrar `adminDiscordSync` em `/api/v1/admin/discord-sync` |
| `backend/src/db/types.ts` | Adicionar tipos para `DiscordImportSourcesTable`, `DiscordImportMessagesTable`, `DiscordImportTableDraftsTable` e extender `DB` |
| `backend/package.json` | Adicionados scripts `discord:sync`, `discord:sync:dev` (Fases 1–6); `discord:bot`/`discord:bot:dev` somente na Fase 7 |
| `frontend/src/pages/GestaoPage.tsx` (ou equivalente admin) | Adicionar rota/link para tela `DiscordSyncPanel` |
| `MAPA_DE_API.md` | Adicionar as 12 novas rotas de `/api/v1/admin/discord-sync/` |
| `database/changelogs.json` | Entrada somente quando tela for deployada e visivel para admins |

---

## 5. Schema das Novas Tabelas (migration_115)

### discord_import_sources
```sql
id uuid primary key default gen_random_uuid()
guild_id text not null
channel_id text not null unique
channel_name text
enabled boolean not null default true
auto_sync_enabled boolean not null default false
last_message_id text
last_synced_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

### discord_import_messages
```sql
id uuid primary key default gen_random_uuid()
source_id uuid not null references discord_import_sources(id) on delete cascade
discord_message_id text not null
discord_channel_id text not null
discord_guild_id text not null
discord_author_id text
discord_author_name text
discord_message_url text
content_raw text not null
attachments jsonb not null default '[]'
embeds jsonb not null default '[]'
message_created_at timestamptz
message_edited_at timestamptz
content_hash text not null
source_kind text not null default 'discord_bot'
status text not null default 'pending'
parse_error text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(discord_channel_id, discord_message_id)
```

Status validos: `pending`, `parsed`, `needs_review`, `synced`, `ignored`, `error`
source_kind validos: `discord_bot`, `discord_chat_exporter_json`

### discord_import_table_drafts
```sql
id uuid primary key default gen_random_uuid()
discord_message_id uuid not null references discord_import_messages(id) on delete cascade
table_id uuid references tables(id) on delete set null
parsed_payload jsonb not null
normalized_payload jsonb
confidence numeric(4,3)
status text not null default 'draft'
review_notes text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Status validos: `draft`, `ready`, `needs_review`, `synced`, `rejected`

---

## 6. Rotas Novas (adminDiscordSync)

```
GET    /api/v1/admin/discord-sync/sources
POST   /api/v1/admin/discord-sync/sources
PATCH  /api/v1/admin/discord-sync/sources/:id
DELETE /api/v1/admin/discord-sync/sources/:id

POST   /api/v1/admin/discord-sync/fetch
GET    /api/v1/admin/discord-sync/messages
GET    /api/v1/admin/discord-sync/drafts
GET    /api/v1/admin/discord-sync/drafts/:id
PATCH  /api/v1/admin/discord-sync/drafts/:id
POST   /api/v1/admin/discord-sync/drafts/:id/reparse
POST   /api/v1/admin/discord-sync/drafts/:id/sync
POST   /api/v1/admin/discord-sync/sync-ready
```

Todas: `authMiddleware` + verificacao `role === 'admin'`.

---

## 7. Tipo DiscordTableDraft (parser output)

```ts
type DiscordTableDraft = {
  source: {
    guild_id: string;
    channel_id: string;
    message_id: string;
    message_url: string;
    author_id?: string;
    author_name?: string;
  };
  table: {
    title: string | null;
    system_name: string | null;
    system_id: string | null;
    type: 'campanha' | 'one-shot' | 'oneshot-serie' | 'aberta' | null;
    modality: 'online' | 'presencial' | 'hibrida' | null;
    price_type: 'gratuita' | 'paga' | null;
    price_value: number | null;
    slots_total: number | null;
    slots_filled: number | null;
    slots_open: number | null;
    day_of_week: string | null;
    start_time: string | null;
    frequency: 'semanal' | 'quinzenal' | 'mensal' | 'avulsa' | null;
    description: string | null;
    contact_discord: string | null;
    contact_url: string | null;
  };
  confidence: number;
  missing_fields: string[];
};
```

---

## 8. Fluxo de Sincronizacao para `tables`

```
draft.ready (ou admin forcando draft.needs_review via POST /drafts/:id/sync)
  └─ verificar source_id em tables
      ├─ existe → UPDATE (transacao direta; nao usa updateTableWithRelations pois gm_id pode ser null)
      └─ nao existe → INSERT via TableRepository.createTableWithRelations com:
           origin = 'imported'
           is_covil = true
           source_id = discord_message_id
           source_url = discord_message_url
           publisher_role = 'announcer'
           status = 'active'
  └─ criar/atualizar table_contacts
  └─ criar/atualizar table_schedules
  └─ atualizar discord_import_table_drafts.status = 'synced'
  └─ atualizar discord_import_messages.status = 'synced'
```

---

## 9. Variaveis de Ambiente (backend)

```env
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_COVIL_INVITE_URL=
DISCORD_SYNC_ENABLED=false
DISCORD_SYNC_INTERVAL_MINUTES=15
DISCORD_SYNC_ALLOWED_CHANNEL_IDS=
DISCORD_IMPORT_DEFAULT_GM_ID=
```

Todas opcionais para boot da API (lazy-load conforme regra constitucional 11.1).

---

## 10. Riscos e Mitigacoes

| Risco | Probabilidade | Mitigacao |
|---|---|---|
| Parser nao extrai campos de anuncio real | Alta | Testes com 8–12 anuncios reais antes de PR |
| `system_name` sem match no banco | Media | Classificar como `needs_review`; resolver manualmente |
| Discord rate limit na ingestao | Baixa | Respeitar `Retry-After`; ingestao e manual no inicio |
| Mesa duplicada por source_id diferente (mensagem editada) | Media | Deduplicacao por content_hash + update em vez de insert |
| Bot token exposto | Alta (se vazado) | DISCORD_BOT_TOKEN exclusivamente via env var; nunca em codigo |

---

## 11. Gates Constitucionais

- [ ] Nenhuma alteracao em migration existente.
- [ ] `TableOrigin` nao alterado (`'manual' | 'imported'`).
- [ ] Nenhuma rota sem `authMiddleware` + verificacao de role.
- [ ] Sem `any` implicito no TypeScript.
- [ ] `npm --prefix backend run build` GREEN antes de PR.
- [ ] `npm --prefix frontend run build` GREEN antes de PR.
- [ ] Testes unitarios do parser GREEN antes de PR.
