# PR — Feature 014: Descoberta de canais Discord no painel

## Sumário executivo

Esta feature remove a necessidade de copiar `guild_id` e `channel_id` manualmente para cadastrar fontes do Discord Sync. Com o token do bot já configurado pela Feature 013, o painel passa a descobrir servidores e canais acessíveis ao bot, permitindo cadastrar a fonte por seleção assistida.

## Mudanças por componente

### Backend

- Adiciona cliente REST de discovery em `backend/src/discord/discovery.ts`.
- Adiciona rotas admin:
  - `GET /api/v1/admin/discord-sync/discovery/guilds`
  - `GET /api/v1/admin/discord-sync/discovery/guilds/:guildId/channels`
- Filtra canais compatíveis com importação atual: texto e anúncios.
- Mapeia erros de token/permissão/rate limit para mensagens acionáveis.
- Mantém o token sempre fora de respostas HTTP e logs.

### Frontend

- Atualiza a aba Fontes para carregar servidores e canais automaticamente.
- Permite cadastrar fonte com servidor/canal selecionados.
- Mantém cadastro manual como modo avançado.
- Normaliza payloads de API com Zod antes de entrar em estado React.

### Documentação

- Atualiza `MAPA_DE_API.md`.
- Adiciona artefatos SDD completos em `specs/014-discord-channel-discovery/`.

## Testing evidence

- `npm --prefix backend run build`
- `npm --prefix frontend run build`
- Busca final por vazamento de token/plaintext nos arquivos alterados.

## Checklist pós-merge

- Confirmar Deploy Beta verde.
- Em janela anônima no Beta, acessar `/gestao` → Discord Sync → Fontes.
- Abrir adicionar canal e confirmar que servidores aparecem.
- Selecionar servidor/canal, salvar e buscar mensagens.
- Se servidor/canal não aparecer, revisar se o bot foi convidado e tem permissão de ver canal e ler histórico.
