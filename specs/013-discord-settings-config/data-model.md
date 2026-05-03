# Data Model 013 — Discord Settings Config

## Entity: DiscordSetting

| Campo | Tipo | Obrigatorio | Regras |
|---|---|---|---|
| `id` | UUID | sim | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `guild_id` | `VARCHAR(50)` | nao | `NULL` representa configuracao global |
| `key` | `VARCHAR(100)` | sim | Para esta feature, valor canonico `bot_token` |
| `value` | `TEXT` | sim | Ciphertext no formato `iv_hex:authTag_hex:ciphertext_base64` |
| `created_at` | `TIMESTAMPTZ` | sim | `DEFAULT NOW()` |
| `updated_at` | `TIMESTAMPTZ` | sim | Atualizado em todo `PUT` |

## Constraints

- `UNIQUE (guild_id, key)` para configuracoes por guild futuras.
- `UNIQUE (key) WHERE guild_id IS NULL` para impedir duplicidade do registro global.
- Indice `idx_discord_settings_key` para lookup rapido por `key`.

## Canonical Record

```text
guild_id = NULL
key = "bot_token"
```

## Validation

- Token de entrada: string, trim, comprimento minimo 50, sem whitespace.
- `JWT_SECRET` ausente: operacoes que cifram/decifram retornam 503.
- Ciphertext invalido: tratado como erro interno sem expor valor.

## State Transitions

```text
not_configured
  -> PUT /settings/bot-token
configured
  -> PUT /settings/bot-token (substitui valor cifrado e updated_at)
configured
  -> DELETE /settings/bot-token
not_configured
```
