# Prompt de Sessão — Feature 015: Importação de Posts de Fóruns Discord

**Para usar:** cole este texto completo como primeira mensagem de um novo chat.

---

## Contexto do Projeto

Projeto **Mesas RPG Artifício** — portal colaborativo para anúncios de mesas de RPG.
Monorepo: `backend/` (Node.js + TypeScript + Express + Kysely + Zod 4.3.6) e `frontend/` (React + Vite + TypeScript + Tailwind).
Banco: PostgreSQL via Docker na VM Oracle Cloud. SSH: `ssh -F C:\projetos\config faren`.

**Ambientes:**
- Beta: `mesasbeta.artificiorpg.com` → branch `dev` → pasta `/opt/mesas-beta/`
- Produção: `mesas.artificiorpg.com` → branch `main` → pasta `/opt/mesas/`
- Fluxo: `feat/015-*` → PR para `dev` → deploy beta automático → aprovação → `main`

**Governança:** leia `AGENTS.md`, `.specify/memory/project-state.md` e `.specify/memory/constitution.md` no início da sessão antes de qualquer alteração técnica. Esses arquivos têm prioridade sobre qualquer outra instrução.

---

## Estado Atual

As Features 012, 013 e 014 estão em `dev`/Beta:

- **Feature 012**: pipeline de importação Discord por canais de texto, com staging em `discord_import_sources`, `discord_import_messages` e `discord_import_table_drafts`.
- **Feature 013**: token do bot configurável pelo painel admin, salvo cifrado em `discord_settings`.
- **Feature 014**: painel "Discord Sync" descobre servidores/canais pelo bot e permite cadastrar fonte sem copiar IDs manualmente.

**Problema descoberto em Beta:** os anúncios reais do servidor Discord usam **canais de texto e principalmente canais de fórum**. O pipeline atual usa `GET /channels/:channelId/messages`, que funciona para canais de texto, mas não importa posts de fórum corretamente.

No Discord, um canal de fórum contém **posts**, e cada post é uma **thread**. O conteúdo do anúncio fica na mensagem inicial da thread e/ou nas mensagens dentro da thread. Portanto, tratar fórum como canal normal não basta.

---

## Solução

Feature 015 — suporte completo a canais de fórum/threads no Discord Sync.

O painel deve permitir selecionar canais de fórum como fonte, e a ingestão deve:

1. Detectar se a fonte é canal de texto/anúncio ou fórum.
2. Para canais de texto/anúncio: manter fluxo existente.
3. Para canais de fórum: listar threads/posts ativos e arquivados públicos.
4. Para cada thread/post: buscar mensagens via `GET /channels/:threadId/messages`.
5. Salvar mensagens preservando a relação com o fórum e com a thread/post.
6. Deduplicar corretamente por thread/canal/mensagem.
7. Gerar URLs corretas para a mensagem/post.

---

## O Que Fazer

Execute a sequência SDD completa para a Feature 015:

1. Crie nova sessão em `sessoes/` seguindo `sessoes/index.md`.
2. Execute `/speckit.specify` para criar `specs/015-discord-forum-threads/`.
3. Execute `/speckit.plan`.
4. Execute `/speckit.tasks`.
5. Execute `/speckit.implement`.
6. Valide builds obrigatórios.
7. Abra PR para `dev`.
8. Após checks verdes e autorização, faça merge/deploy Beta.
9. Encerre com `/speckit.retro.run`.

---

## Pontos Técnicos Críticos

### Discord channel types

Incluir suporte ao menos para:

- `GUILD_TEXT` (`0`) — já suportado
- `GUILD_ANNOUNCEMENT` (`5`) — já suportado no discovery
- `GUILD_FORUM` (`15`) — novo escopo principal

Opcional, apenas se a documentação oficial confirmar compatibilidade com o mesmo fluxo:

- `GUILD_MEDIA` (`16`)

### Endpoints Discord relevantes

Usar documentação oficial do Discord antes de implementar:

- Channel Resource: `GET /channels/{channel.id}/messages`
- Guild Channels: `GET /guilds/{guild.id}/channels`
- Threads:
  - listar threads ativas
  - listar threads públicas arquivadas
  - buscar mensagens dentro de uma thread

Não usar scraping, automação de browser ou export manual como caminho principal.

### Schema / banco

Avaliar se a migration 115 é suficiente. Provavelmente será necessário criar migration nova para metadados de fórum/thread.

Possíveis abordagens:

1. Adicionar colunas em `discord_import_sources`:
   - `channel_type`
   - `parent_channel_id` ou `forum_channel_id` se necessário

2. Adicionar colunas em `discord_import_messages`:
   - `discord_thread_id`
   - `discord_parent_channel_id`
   - `discord_thread_name`

3. Ajustar constraint de deduplicação se necessário:
   - hoje: `UNIQUE (discord_channel_id, discord_message_id)`
   - para threads, avaliar se `discord_channel_id` deve ser o thread id, o fórum id ou ambos.

**Importante:** migration deve ser online-safe e seguir `migrations_guide.md`.

### Backend

Arquivos relevantes:

- `backend/src/discord/discovery.ts`
- `backend/src/discord/ingestMessages.ts`
- `backend/src/discord/types.ts`
- `backend/src/routes/adminDiscordSync.ts`
- `backend/src/db/types.ts`

Implementar separação clara:

- `ingestMessages` para canais textuais/anúncio existentes.
- Novo helper/serviço para fórum/threads, ou generalizar ingestão com tipo de fonte.
- Timeout com `AbortController` manual, não `AbortSignal.timeout`.
- Nunca logar token.
- Mensagens de erro acionáveis para permissões, rate limit e fórum sem posts visíveis.

### Frontend

Arquivos relevantes:

- `frontend/src/features/discord-sync/components/DiscordSourceList.tsx`
- `frontend/src/features/discord-sync/api/discordSyncApi.ts`
- `frontend/src/features/discord-sync/types.ts`
- `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx`

Atualizar UI:

- Discovery deve exibir canais de fórum com identificação visual clara, ex.: `Fórum`.
- Ao cadastrar fonte, salvar também o tipo do canal se o backend exigir.
- Lista de fontes deve diferenciar canal textual vs fórum.
- Ao buscar mensagens de fórum, feedback deve deixar claro que posts/threads estão sendo varridos.

### Contratos/API

Atualizar `MAPA_DE_API.md`.

Possíveis mudanças:

- `GET /api/v1/admin/discord-sync/discovery/guilds/:guildId/channels` passa a retornar `type` incluindo fórum.
- `POST /api/v1/admin/discord-sync/sources` pode aceitar `channel_type`.
- `POST /api/v1/admin/discord-sync/fetch` deve funcionar com fontes de texto/anúncio/fórum.

---

## Critérios de Aceite

- [ ] Admin consegue selecionar canal de fórum no painel.
- [ ] Fonte de fórum fica cadastrada com tipo/identificação clara.
- [ ] `POST /fetch` em fonte de fórum importa posts/threads do fórum.
- [ ] Mensagens importadas de fórum preservam URL correta para o Discord.
- [ ] Deduplicação funciona entre múltiplas threads.
- [ ] Canais de texto/anúncio continuam funcionando como antes.
- [ ] Erro de permissão/rate limit/token inválido aparece de forma acionável.
- [ ] Token nunca aparece em plaintext em resposta HTTP, log ou UI.
- [ ] `npm --prefix backend run build` GREEN.
- [ ] `npm --prefix frontend run build` GREEN.
- [ ] Deploy Beta GREEN.
- [ ] Teste funcional em janela anônima no Beta usando um fórum real.

---

## Fora do Escopo

- Parser semântico perfeito do conteúdo de anúncios.
- Suporte a threads privadas, se exigirem permissões/fluxos adicionais não disponíveis ao bot.
- Scraping ou automação do cliente Discord.
- Export manual via DiscordChatExporter como caminho principal.
- Rotina automática agendada de sync contínuo, exceto se já existir base pronta e for trivial conectar.

---

## Início Imediato

Comece lendo governança obrigatória, criando sessão nova e executando `/speckit.specify` para `specs/015-discord-forum-threads/`.

Trate a Feature 015 como continuação natural da 012–014: sem suporte a fóruns/threads, o fluxo de Discord Sync não cobre o uso real do servidor.
