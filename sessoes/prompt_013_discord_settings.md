# Prompt de Sessão — Feature 013: Configuração do Bot Discord via Painel Admin

**Para usar:** cole este texto completo como primeira mensagem de um novo chat.

---

## Contexto do Projeto

Projeto **Mesas RPG Artifício** — portal colaborativo para anúncios de mesas de RPG.
Monorepo: `backend/` (Node.js + TypeScript + Express + Kysely + Zod 4.3.6) e `frontend/` (React + Vite + TypeScript + Tailwind).
Banco: PostgreSQL via Docker na VM Oracle Cloud. SSH: `ssh -F C:\projetos\config faren`.

**Ambientes:**
- Beta: `mesasbeta.artificiorpg.com` → branch `dev` → pasta `/opt/mesas-beta/`
- Produção: `mesas.artificiorpg.com` → branch `main` → pasta `/opt/mesas/`
- Fluxo: `feat/013-*` → PR para `dev` → deploy beta automático → aprovação → `main`

**Governança:** leia `AGENTS.md` e `.specify/memory/constitution.md` no início da sessão antes de qualquer alteração técnica. Esses arquivos têm prioridade sobre qualquer outra instrução.

---

## Estado Atual

A **Feature 012** (pipeline de importação Discord) foi mergeada em `dev` e está deployada no Beta. O painel "Discord Sync" já existe em `/gestao` (admin only).

**Problema:** o `DISCORD_BOT_TOKEN` é lido apenas de `process.env`. Isso exige acesso SSH à VM para configurar o token — tornando o onboarding de canais dependente de intervenção técnica. O painel Discord Sync no Beta está bloqueado porque o token não está no `/opt/mesas-beta/.env`.

**Solução:** Feature 013 — configuração do bot token diretamente pelo painel web, sem acesso SSH.

---

## O Que Fazer

Execute a sequência SDD completa para a Feature 013:

1. Crie a sessão `sessoes/26-05-03_4_discord-settings-config.md` (ou a data/número correto conforme `sessoes/index.md`)
2. Execute `/speckit.plan` para `specs/013-discord-settings-config/` (a spec já está criada — veja abaixo)
3. Execute `/speckit.tasks`
4. Execute `/speckit.implement`
5. Abra PR para `dev`
6. Encerre a sessão com `/speckit.retro.run`

---

## Spec Já Criada (não recriar)

`specs/013-discord-settings-config/spec.md` — leia o arquivo completo antes de planejar.

Resumo dos pontos críticos:

### Nova tabela: `discord_settings` (migration_116)
```sql
CREATE TABLE discord_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id    VARCHAR(50),
  key         VARCHAR(100) NOT NULL,
  value       TEXT NOT NULL,  -- AES-256-GCM ciphertext em base64
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guild_id, key)
);
```
Registro canônico: `guild_id = NULL, key = 'bot_token'`.

### API (rotas admin, já existe prefixo `/api/v1/admin/discord-sync/` em `adminDiscordSync.ts`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/admin/discord-sync/settings` | Retorna `{ bot_token: { is_set, preview, updated_at } }` |
| `PUT` | `/api/v1/admin/discord-sync/settings/bot-token` | Body: `{ token }` → salva criptografado |
| `DELETE` | `/api/v1/admin/discord-sync/settings/bot-token` | Remove o token (204) |

**NUNCA retornar o token em plaintext.** Preview = `MTQ5...k8kQ` (4 chars + "..." + 4 chars do final).

### Criptografia
- Algoritmo: `AES-256-GCM` via `node:crypto` (sem dependência externa)
- Chave: derivada de `JWT_SECRET` via `scryptSync(secret, 'discord-settings', 32)`
- Se `JWT_SECRET` não estiver no env → endpoint retorna 503
- Formato do valor cifrado no banco: `iv_hex:authTag_hex:ciphertext_base64`

### Fallback de leitura do token
`ingestMessages.ts` deve ler o token nesta ordem:
1. `discord_settings` onde `guild_id IS NULL AND key = 'bot_token'` → decifrar e usar
2. `process.env.DISCORD_BOT_TOKEN` (fallback para deploys sem configuração no banco)

### Frontend — `DiscordSettingsPanel`
Novo componente como **primeira aba** em `DiscordSyncPanel` (antes de "Fontes").

Exibe:
- Badge: `✅ Bot configurado` com preview mascarado, ou `⚠️ Token não configurado`
- Data da última atualização (se configurado)
- Campo de senha para inserir novo token (não pré-preenchido — RF-002)
- Botão "Salvar token" com feedback de validação
- Botão "Remover token" com confirmação inline (sem popup nativo)
- Aviso em texto: _"Se nenhum token estiver configurado aqui, o sistema usa a variável de ambiente `DISCORD_BOT_TOKEN`."_

Validação mínima no frontend antes de enviar: campo não vazio, sem espaços.
Validação no backend: comprimento mínimo 50 chars, sem espaços (Discord bot tokens têm ~72 chars).

---

## Arquivos Relevantes (base de referência)

### Backend — já existentes (não recriar):
- `backend/src/routes/adminDiscordSync.ts` — rotas admin do Discord Sync; **adicionar** as 3 novas rotas aqui
- `backend/src/discord/ingestMessages.ts` — **modificar** para leitura do token com fallback
- `backend/src/discord/config.ts` — leitura centralizada de config; pode extrair helper de leitura do token aqui
- `backend/src/routes/index.ts` — já registra `adminDiscordSync` com prefixo correto

### Backend — criar:
- `backend/src/discord/settingsCrypto.ts` — funções `encrypt(plaintext)` e `decrypt(ciphertext)` com AES-256-GCM
- `database/migration_116_discord_settings.sql` — migration da nova tabela

### Frontend — já existente:
- `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx` — adicionar primeira aba com `DiscordSettingsPanel`
- `frontend/src/features/discord-sync/api/discordSyncApi.ts` — adicionar funções `getDiscordSettings`, `saveDiscordBotToken`, `deleteDiscordBotToken`

### Frontend — criar:
- `frontend/src/features/discord-sync/components/DiscordSettingsPanel.tsx`

---

## Padrões Técnicos Obrigatórios

**Zod 4.3.6:** usar `z.record(z.string(), z.unknown())` com dois argumentos (mudança de API da v4).

**Kysely:** tipos gerados em `backend/src/db.d.ts`. Após criar a migration, rode `npm --prefix backend run generate-types` para gerar o tipo `DiscordSettings`.

**`Insertable<T>` / `Updateable<T>`** do Kysely para operações de escrita.

**Normalização de dados de fronteira:** todo payload da API deve passar por parser/schema Zod antes de entrar em estado React ou props.

**Build verde obrigatório antes de commit:**
```
npm --prefix backend run build
npm --prefix frontend run build
```

---

## Sequência de Migration

Verificar número da última migration antes de criar:
```bash
ls database/migration_*.sql | sort | tail -5
```
A próxima deve ser `migration_116_discord_settings.sql`.

Para aplicar no Beta após merge:
```bash
ssh -F C:\projetos\config faren
docker exec mesas-beta-db psql -U admin -d mesas_rpg -f /opt/mesas-beta/database/migration_116_discord_settings.sql
```
(Isso ocorre automaticamente via workflow de deploy se a migration estiver no path correto.)

---

## Critérios de Aceite

- [ ] Admin salva token via painel → ingestão passa a funcionar sem reiniciar o servidor
- [ ] `GET /settings` retorna `is_set: true` e preview mascarado quando token salvo
- [ ] Token nunca aparece em plaintext em nenhuma resposta HTTP ou log
- [ ] Token removido → fallback para `process.env.DISCORD_BOT_TOKEN`
- [ ] `npm --prefix backend run build` GREEN
- [ ] `npm --prefix frontend run build` GREEN
- [ ] Validação de token inválido retorna 400 com mensagem clara
- [ ] Migration 116 aplicada sem erro

---

## Contexto de Sessão

- **Sessão anterior:** `sessoes/encerradas/26-05-03_3_discord-covil-sync.md`
- **Próxima sessão a criar:** `sessoes/26-05-03_4_discord-settings-config.md` (ou data atual se diferente)
- **Branch a criar:** `feat/013-discord-settings-config` a partir de `dev`
- **Feature ativa atual em `.specify/feature.json`:** verificar e atualizar para `specs/013-discord-settings-config`
- **`AGENTS.md` bloco SPECKIT:** atualizar para apontar `specs/013-discord-settings-config/plan.md` após criar o plan

---

## Fora do Escopo desta Feature

- Suporte a múltiplos bots por guild (o schema `discord_settings` já permite via `guild_id`, mas a UI por guild não é parte desta feature)
- Rotação automática de tokens
- Histórico de alterações com `admin_id`
- Cifra de outras credenciais além do `bot_token`

---

## Início Imediato

Comece criando a sessão, lendo `AGENTS.md` e `constitution.md`, depois execute `/speckit.plan` para `specs/013-discord-settings-config/`. A spec está completa — o plan pode ser gerado diretamente com base nela e no mapeamento dos arquivos listados acima.
