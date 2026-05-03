# Contracts 013 — Discord Settings Config

Base path: `/api/v1/admin/discord-sync`

Todas as rotas exigem `authMiddleware` e usuario com `role === 'admin'`.

## GET `/settings`

Retorna status sem expor plaintext.

```json
{
  "data": {
    "bot_token": {
      "is_set": true,
      "preview": "MTQ5...k8kQ",
      "updated_at": "2026-05-03T10:00:00.000Z"
    }
  }
}
```

Quando nao configurado:

```json
{
  "data": {
    "bot_token": {
      "is_set": false,
      "preview": null,
      "updated_at": null
    }
  }
}
```

## PUT `/settings/bot-token`

Request:

```json
{ "token": "discord-bot-token-com-no-minimo-50-caracteres" }
```

Success `200`:

```json
{
  "data": {
    "is_set": true,
    "preview": "MTQ5...k8kQ",
    "updated_at": "2026-05-03T10:00:00.000Z"
  }
}
```

Errors:

- `400` quando `token` e invalido, curto ou contem espacos.
- `403` quando usuario nao e admin.
- `503` quando `JWT_SECRET` nao esta configurado.
- `500` para falha inesperada de persistencia/cifra.

## DELETE `/settings/bot-token`

Success: `204 No Content`.

Errors:

- `403` quando usuario nao e admin.
- `500` para falha inesperada de persistencia.
