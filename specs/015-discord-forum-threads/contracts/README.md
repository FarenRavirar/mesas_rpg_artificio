# Contracts: Discord Forum Threads

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
