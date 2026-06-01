# Contracts: Descoberta de Canais Discord

Prefixo existente: `/api/v1/admin/discord-sync`

Todas as rotas exigem admin autenticado e nunca retornam token em plaintext.

## GET `/discovery/guilds`

Lista servidores onde o bot configurado está presente.

Resposta 200:

```json
{
  "data": [
    {
      "id": "123",
      "name": "Covil do Lich",
      "icon": null,
      "approximate_member_count": null
    }
  ]
}
```

Erros:
- 422: token do bot não configurado.
- 502: token inválido, Discord indisponível ou erro de API externa.
- 503: segredo de cifra indisponível.

## GET `/discovery/guilds/:guildId/channels`

Lista canais textuais/announcement do servidor selecionado.

Resposta 200:

```json
{
  "data": [
    {
      "id": "456",
      "guild_id": "123",
      "name": "anuncios-de-mesas",
      "type": 0,
      "position": 3,
      "parent_id": "789",
      "parent_name": "Mesas"
    }
  ]
}
```

Erros:
- 400: `guildId` inválido.
- 403: bot sem acesso/permissão ao servidor.
- 404: servidor não encontrado para o bot.
- 422: token do bot não configurado.
- 502: token inválido, rate limit ou Discord indisponível.
- 503: segredo de cifra indisponível.

## POST `/sources`

Contrato existente preservado. O frontend passa a chamar esta rota com dados vindos da descoberta:

```json
{
  "guild_id": "123",
  "channel_id": "456",
  "channel_name": "anuncios-de-mesas"
}
```

Resposta e erros permanecem compatíveis com a Feature 012.
