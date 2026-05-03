# Plan 013 — Configuracao de Credenciais Discord via Painel Admin

**Feature:** `013-discord-settings-config`
**Branch:** `feat/013-discord-settings-config`
**Data:** 2026-05-03
**Spec:** `specs/013-discord-settings-config/spec.md`
**Input:** Feature specification from `specs/013-discord-settings-config/spec.md`

---

## Summary

Adicionar configuracao administrativa do token do bot Discord pelo painel web, persistindo o valor cifrado em `discord_settings` e mantendo fallback para `process.env.DISCORD_BOT_TOKEN`. A entrega inclui migration 116, criptografia AES-256-GCM derivada de `JWT_SECRET`, tres rotas admin sob `/api/v1/admin/discord-sync`, ajuste da ingestao para buscar token em DB primeiro, e nova aba "Configuracao" no painel Discord Sync.

---

## Technical Context

**Language/Version:** TypeScript estrito; Node.js 25.9.0; React + Vite.
**Primary Dependencies:** Express, Kysely, Zod 4.3.6, `node:crypto`, React, Tailwind.
**Storage:** PostgreSQL 16 via migration em `database/`.
**Testing:** `npm --prefix backend run build`, `npm --prefix frontend run build`, validacao SQL via migration idempotente.
**Target Platform:** Backend Node em Docker na VM Oracle; frontend Vite servido por deploy automatizado.
**Project Type:** Monorepo web app (`backend/`, `frontend/`, `database/`).
**Performance Goals:** Leitura do token executa uma consulta pequena por ingestao manual; sem cache obrigatorio nesta feature para permitir troca sem restart.
**Constraints:** Token nunca em plaintext em resposta HTTP ou log; dados de fronteira normalizados com Zod; endpoints admin com `authMiddleware` + `role === 'admin'`; ausencia de `JWT_SECRET` retorna 503 nas operacoes de cifra/decifra.
**Scale/Scope:** Um registro global canonico (`guild_id IS NULL`, `key = 'bot_token'`); schema preparado para futuro por guild, sem UI por guild neste escopo.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Gratuidade, sem anuncios e coleta minima preservadas.
- [x] Google OAuth permanece unico login; Discord segue como integracao opcional.
- [x] TypeScript estrito, sem `any` novo planejado.
- [x] Mudanca de schema passa por migration em `database/` com header obrigatorio.
- [x] Segredos via env/DB cifrado; nenhum segredo hardcoded.
- [x] Feature opcional usa lazy-load e nao bloqueia boot da API.
- [x] Rotas novas externas validam input e retornam status HTTP adequado.
- [x] UI usa confirmacao inline para remover token, sem popup nativo.
- [x] Nenhum arquivo fora desta Secao 3 sera tocado sem atualizar o plano e registrar na sessao.

**Resultado do gate:** PASS. Sem violacoes constitucionais conhecidas.

---

## Project Structure

### Documentation (this feature)

```text
specs/013-discord-settings-config/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── README.md
├── tasks.md
└── pr-description.md
```

### Source Code (repository root)

```text
database/
└── migration_116_discord_settings.sql

backend/src/
├── db/types.ts
├── discord/config.ts
├── discord/ingestMessages.ts
├── discord/settingsCrypto.ts
└── routes/adminDiscordSync.ts

frontend/src/features/discord-sync/
├── api/discordSyncApi.ts
├── components/DiscordSettingsPanel.tsx
├── components/DiscordSyncPanel.tsx
└── types.ts

MAPA_DE_API.md
AGENTS.md
```

---

## File Scope

### Arquivos a criar

| Arquivo | Motivo |
|---|---|
| `database/migration_116_discord_settings.sql` | Criar tabela `discord_settings` com unicidade global/por guild e validacao final. |
| `backend/src/discord/settingsCrypto.ts` | Isolar cifra/decifra AES-256-GCM e evitar vazamento em rotas HTTP. |
| `frontend/src/features/discord-sync/components/DiscordSettingsPanel.tsx` | Primeira aba do painel admin para salvar/remover token. |
| `specs/013-discord-settings-config/research.md` | Decisoes tecnicas do plan. |
| `specs/013-discord-settings-config/data-model.md` | Modelo de dados e validacoes. |
| `specs/013-discord-settings-config/contracts/README.md` | Contratos HTTP da feature. |
| `specs/013-discord-settings-config/quickstart.md` | Cenários de validacao tecnica/manual. |
| `specs/013-discord-settings-config/tasks.md` | Checklist executavel por user story. |
| `specs/013-discord-settings-config/pr-description.md` | Corpo executivo do PR. |

### Arquivos a alterar

| Arquivo | Mudanca |
|---|---|
| `.specify/feature.json` | Apontar feature ativa para `specs/013-discord-settings-config`. |
| `AGENTS.md` | Atualizar bloco SPECKIT para `specs/013-discord-settings-config/plan.md`. |
| `sessoes/26-05-03_4_discord-settings-config.md` | Registro continuo da sessao. |
| `sessoes/index.md` | Registrar sessao ativa. |
| `backend/src/db/types.ts` | Adicionar tipos Kysely `DiscordSettingsTable` e entrada em `Database`. |
| `backend/src/discord/config.ts` | Expor helper lazy de leitura do bot token DB -> env. |
| `backend/src/discord/ingestMessages.ts` | Aceitar token opcional e resolver por helper quando ausente. |
| `backend/src/routes/adminDiscordSync.ts` | Adicionar GET/PUT/DELETE de settings e usar helper em `/fetch`. |
| `frontend/src/features/discord-sync/api/discordSyncApi.ts` | Adicionar chamadas e parsers de fronteira para settings. |
| `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx` | Inserir aba "Configuracao" antes de "Fontes". |
| `frontend/src/features/discord-sync/types.ts` | Tipos do contrato de settings. |
| `MAPA_DE_API.md` | Registrar tres endpoints novos de admin Discord Sync. |
| `.specify/memory/project-state.md` | Atualizar estado ao fechar via `/speckit.status`. |
| `.specify/memory/session-log.md` | Atualizar retrospectiva ao fechar via `/speckit.retro.run`. |

---

## Design Decisions

### DT-001 — `discord_settings` como tabela independente
Token do bot e uma credencial de integracao, nao uma fonte/canal. A tabela independente evita acoplamento com `discord_import_sources` e permite evolucao por `guild_id` sem quebrar o registro global.

### DT-002 — Constraint parcial para `guild_id IS NULL`
PostgreSQL trata `NULL` como distinto em `UNIQUE (guild_id, key)`. Para garantir apenas um `bot_token` global, a migration usara um indice unico parcial em `key WHERE guild_id IS NULL`, alem de `UNIQUE (guild_id, key)` para escopos por guild.

### DT-003 — Cifra isolada com `node:crypto`
`settingsCrypto.ts` encapsula `scryptSync(JWT_SECRET, 'discord-settings', 32)`, `randomBytes(12)`, AES-256-GCM e formato `iv_hex:authTag_hex:ciphertext_base64`. Rotas nunca retornam plaintext.

### DT-004 — Leitura DB -> env sem cache obrigatorio
`getDiscordBotToken()` consulta o DB para o registro global e decifra quando existir; se ausente, usa `discordConfig.botToken`. Isso permite salvar/remover token sem restart.

### DT-005 — Kysely types manuais no arquivo real do repo
O prompt menciona `backend/src/db.d.ts` e `npm --prefix backend run generate-types`, mas o repo atual usa `backend/src/db/types.ts` e `backend/package.json` nao possui script `generate-types`. A implementacao atualizara `backend/src/db/types.ts` manualmente e validara com build backend.

### DT-006 — Normalizacao de fronteira no frontend
`discordSyncApi.ts` normalizara respostas de settings antes de entregar dados ao componente. Arrays e objetos vindos da API continuam sem entrar em estado React sem parser/fallback.

---

## API Contracts

```text
GET    /api/v1/admin/discord-sync/settings
PUT    /api/v1/admin/discord-sync/settings/bot-token
DELETE /api/v1/admin/discord-sync/settings/bot-token
```

Todas as rotas usam `authMiddleware` + `role === 'admin'`.

---

## Validation Plan

1. Validar migration por leitura e idempotencia estrutural (`CREATE TABLE IF NOT EXISTS`, indices `IF NOT EXISTS`, bloco DO final).
2. Rodar `npm --prefix backend run build`.
3. Rodar `npm --prefix frontend run build`.
4. Busca final por vazamentos diretos: `DISCORD_BOT_TOKEN`, `token`, `plaintext`, logs sensiveis nos arquivos alterados.
5. Após PR/merge/deploy em `dev`, validar funcionalmente em janela anonima no Beta.

---

## Post-Design Constitution Check

- [x] Scope de arquivos definido e fechado.
- [x] Schema novo nao usa comandos destrutivos.
- [x] Rotas admin novas autenticadas/autorizadas.
- [x] Payloads backend validados com Zod 4 (`z.record(z.string(), z.unknown())` quando aplicavel).
- [x] Frontend nao renderiza payload externo sem normalizador/fallback.
- [x] Sem dependencia externa nova para criptografia.

**Resultado:** PASS.

---

## Complexity Tracking

Nenhuma violacao constitucional identificada.
