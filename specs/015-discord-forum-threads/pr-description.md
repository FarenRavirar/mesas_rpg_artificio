# PR — Feature 015: Discord Forum Threads

## Sumario executivo

Adiciona suporte a canais de forum no Discord Sync. Admins passam a cadastrar foruns como fonte e o backend varre posts/threads para importar mensagens, mantendo canais de texto/anuncio funcionando como antes.

## Mudancas por componente

- Backend: discovery inclui `GUILD_FORUM`; fontes registram `channel_type`; fetch escolhe canal comum ou forum; ingestao de forum lista threads ativas/publicas arquivadas e salva metadados de origem.
- Database: migration 117 adiciona tipo da fonte e metadados de thread/forum em mensagens importadas.
- Frontend: UI identifica foruns, salva o tipo da fonte, mostra feedback de varredura de posts e exibe nome/ID da thread em mensagens.
- Docs: `MAPA_DE_API.md` atualizado para os contratos do Discord Sync.

## Testing evidence

- `npm --prefix backend run build` GREEN.
- `npm --prefix frontend run build` GREEN.
- Busca final contra `AbortSignal.timeout` retornou zero ocorrencias em `backend/src/discord` e `backend/src/routes/adminDiscordSync.ts`.
- Busca de seguranca nao encontrou `console.log`/`console.error` expondo token.

## Checklist pos-merge

- Deploy Beta verde em `dev`.
- Admin testa em janela anonima no Beta com um forum real.
- Confirmar que canais textuais/anuncio continuam importando mensagens.
- Confirmar que reexecutar busca de forum nao duplica mensagens.
