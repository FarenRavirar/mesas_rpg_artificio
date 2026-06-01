# Research 013 — Discord Settings Config

## Decision: usar `discord_settings` com indice unico parcial para global

**Rationale:** `UNIQUE (guild_id, key)` nao impede multiplos registros com `guild_id NULL` em PostgreSQL. O registro canonico global (`guild_id IS NULL`, `key = 'bot_token'`) precisa de `CREATE UNIQUE INDEX ... ON discord_settings (key) WHERE guild_id IS NULL`.

**Alternatives considered:** Apenas `UNIQUE (guild_id, key)` foi rejeitado porque permitiria duplicidade global; `guild_id = 'global'` foi rejeitado porque a spec define `NULL` como semantica global.

## Decision: AES-256-GCM via `node:crypto`

**Rationale:** Atende a spec sem dependencia externa. `scryptSync(JWT_SECRET, 'discord-settings', 32)` deriva chave estavel por ambiente; GCM fornece autenticidade via auth tag.

**Alternatives considered:** Plaintext foi rejeitado por RNF-001; servico externo de secrets foi rejeitado por escopo e dependencia operacional.

## Decision: leitura DB -> env sem cache

**Rationale:** O criterio principal e permitir configurar/remover token sem restart. Uma consulta por ingestao manual e aceitavel no volume atual e evita invalidacao de cache.

**Alternatives considered:** Cache em memoria foi rejeitado por exigir invalidacao; env-only foi rejeitado porque mantem o bloqueio atual.

## Decision: atualizar `backend/src/db/types.ts` manualmente

**Rationale:** O repositorio atual nao tem `backend/src/db.d.ts` nem script `generate-types`; Kysely types vivem em `backend/src/db/types.ts`. A validacao sera feita por build TypeScript.

**Alternatives considered:** Criar script novo de geracao foi rejeitado por estar fora do escopo da feature.

## Decision: rotas de settings no modulo `adminDiscordSync.ts`

**Rationale:** O prefixo `/api/v1/admin/discord-sync` ja existe e todas as rotas seguem o mesmo padrao de `authMiddleware` + role admin.

**Alternatives considered:** Novo router separado foi rejeitado por adicionar wiring desnecessario.

## Decision: normalizacao no cliente API

**Rationale:** A regra de fronteira do projeto exige tratar payload externo como `unknown` antes de entrar em estado React. O parser fica em `discordSyncApi.ts` para centralizar o contrato.

**Alternatives considered:** Tipar `res.json()` diretamente foi rejeitado por violar governanca de fronteira.
