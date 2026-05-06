# Contracts: Discord Forum Threads

## Contrato externo Discord usado pela ingestao

- Base: Discord REST API v10.
- Autenticacao: header `Authorization: Bot <token>`, conforme API Reference oficial.
- Mensagem: `GET /channels/{channel.id}/messages/{message.id}` retorna um Message Object quando o bot tem acesso ao canal/thread.
- Permissoes exigidas em canais de servidor: `VIEW_CHANNEL` e `READ_MESSAGE_HISTORY`.
- Intent exigido para dados completos: `MESSAGE_CONTENT`. Sem ele, `content`, `embeds`, `attachments` e `components` podem vir vazios mesmo quando o post tem corpo no Discord.
- Application Commands nao fazem parte do fluxo de ingestao historica. Eles continuam sendo apenas uma opcao futura de interacao manual, nao uma fonte para hidratar posts ja publicados.

Referencias oficiais:
- <https://docs.discord.com/developers/resources/message>
- <https://docs.discord.com/developers/reference>
- <https://docs.discord.com/developers/interactions/application-commands>

## GET /api/v1/admin/discord-sync/discovery/guilds/:guildId/channels

Retorna canais importaveis do servidor selecionado.

### Response `200`

```json
{
  "data": [
    {
      "id": "123",
      "guild_id": "456",
      "name": "anuncios",
      "type": 15,
      "kind": "forum",
      "position": 10,
      "parent_id": null,
      "parent_name": null
    }
  ]
}
```

`kind` pode ser `text`, `announcement` ou `forum`.

## POST /api/v1/admin/discord-sync/sources

Cria fonte Discord.

### Request

```json
{
  "guild_id": "456",
  "channel_id": "123",
  "channel_name": "anuncios",
  "channel_type": "forum"
}
```

`channel_type` e opcional para compatibilidade; quando ausente, o backend assume `text`.

## GET /api/v1/admin/discord-sync/sources

Fontes passam a incluir `channel_type`.

```json
{
  "data": [
    {
      "id": "uuid",
      "guild_id": "456",
      "channel_id": "123",
      "channel_name": "anuncios",
      "channel_type": "forum",
      "enabled": true,
      "auto_sync_enabled": false,
      "last_message_id": null,
      "last_synced_at": null,
      "created_at": "2026-05-04T00:00:00.000Z",
      "updated_at": "2026-05-04T00:00:00.000Z"
    }
  ]
}
```

## POST /api/v1/admin/discord-sync/fetch

Executa busca da fonte. Para fontes de forum, o backend varre posts/threads visiveis.

### Request

```json
{
  "source_id": "uuid",
  "limit": 50,
  "before_message_id": "123"
}
```

### Response `200`

```json
{
  "data": {
    "inserted": 3,
    "updated": 1,
    "total": 20,
    "newestMessageId": "999",
    "threadsScanned": 4,
    "sourceKind": "forum"
  }
}
```

Regra operacional: se o Discord retornar mensagem existente sem corpo (`content_raw` vazio) e sem `embeds`/`attachments`, o item deve permanecer diagnosticavel e nao deve ser tratado como draft pronto. Depois de habilitar `MESSAGE_CONTENT`, uma reidratacao deve rebuscar o corpo antes do parse.

## GET /api/v1/admin/discord-sync/messages

Mensagens de forum incluem metadados de thread quando disponiveis.

```json
{
  "data": [
    {
      "id": "uuid",
      "source_id": "uuid",
      "discord_message_id": "999",
      "discord_channel_id": "thread-id",
      "discord_parent_channel_id": "forum-id",
      "discord_thread_id": "thread-id",
      "discord_thread_name": "Mesa de domingo",
      "discord_message_url": "https://discord.com/channels/guild-id/thread-id/message-id",
      "content_raw": "texto do anuncio"
    }
  ]
}
```

## PATCH /api/v1/admin/discord-sync/messages/:id

Atualiza o status de triagem de uma mensagem importada.

```json
{
  "status": "needs_review"
}
```

## POST /api/v1/admin/discord-sync/fetch

Aceita janela temporal opcional para qualquer fonte Discord.

```json
{
  "source_id": "uuid",
  "limit": 50,
  "since": "2026-04-27T12:00:00.000Z",
  "until": "2026-05-04T12:00:00.000Z"
}
```

## POST /api/v1/admin/discord-sync/messages/:id/diagnose-content

Executa diagnostico read-through de uma mensagem importada contra a API Discord, sem expor token. Uso principal: diferenciar registro antigo hidratado sem corpo de falha de permissao/intent.

### Response `200`

```json
{
  "data": {
    "discord_message_id": "1499747163977027634",
    "discord_channel_id": "1499747163977027634",
    "discord_thread_name": "Forgotten Realms™: Uma Campanha Sandbox",
    "db_content_length": 0,
    "api_content_length": 2125,
    "api_attachments_count": 1,
    "api_embeds_count": 0,
    "api_content_preview": "▬ Sistema: Dungeons & Dragons 2024®",
    "likely_missing_message_content_intent": false,
    "diagnosis": "API Discord retornou corpo; reidrate a mensagem antes de parsear."
  }
}
```

### Response `502`

Usado quando o Discord retorna erro inesperado ou payload fora do contrato esperado. A resposta deve continuar sem token e sem payload bruto sensivel.

## Parser e sugestoes de sistema

Regra de contrato entre parser, draft e gestao:

- `Sistema:` no corpo do post tem prioridade sobre o nome da thread.
- Nome da thread so serve como fallback de sistema quando nao ha corpo estruturado.
- Se o sistema extraido do corpo nao existir em `systems`/`system_aliases`, o draft deve manter `raw_system_hint` com esse valor e status `needs_review`.
- Nesse caso, o backend cria uma entrada pendente em `system_suggestions` com `name = raw_system_hint`.
- Nomes de cenario/campanha/titulo nao devem gerar sugestoes automaticas quando o corpo ja trouxe sistema explicito.

## PATCH /api/v1/admin/system-suggestions/:id/reject

Rejeita uma sugestao de sistema. `reason` e opcional para manter a triagem administrativa rapida.

```json
{}
```

ou:

```json
{
  "reason": "Duplicado"
}
```

## Fluxo frontend de sugestoes

A tela de gestao deve permitir:

- Selecionar uma sugestao pendente por checkbox.
- Selecionar todas as pendentes visiveis.
- Descartar selecionadas em lote sem prompt obrigatorio de motivo.
