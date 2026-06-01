# Data Model: Descoberta de Canais Discord

## DiscordDiscoveredGuild

Representa um servidor onde o bot está presente.

Campos:
- `id`: snowflake do servidor.
- `name`: nome do servidor.
- `icon`: hash opcional do ícone.
- `approximate_member_count`: contagem aproximada opcional quando retornada pelo Discord.

Validações:
- `id` e `name` obrigatórios.
- Dados são transitórios, não persistidos nesta feature.

## DiscordDiscoveredChannel

Representa um canal selecionável para importação.

Campos:
- `id`: snowflake do canal.
- `guild_id`: snowflake do servidor.
- `name`: nome do canal.
- `type`: tipo numérico Discord.
- `position`: posição opcional para ordenação.
- `parent_id`: categoria opcional.
- `parent_name`: nome da categoria opcional.

Validações:
- Apenas tipos textuais compatíveis são retornados no fluxo principal.
- `id`, `guild_id`, `name` e `type` obrigatórios.

## DiscordImportSource

Entidade existente em `discord_import_sources`.

Uso nesta feature:
- Fonte criada a partir de guild/canal descobertos preenche `guild_id`, `channel_id` e `channel_name`.
- Unicidade por `channel_id` continua sendo aplicada pelo backend existente.

## Estado e transições

```text
Token configurado -> Descobrir servidores -> Selecionar servidor -> Descobrir canais -> Selecionar canal -> Criar fonte
```

Falhas acionáveis:
- Sem token -> orientar configurar token.
- Token inválido -> orientar resetar/salvar token.
- Sem guilds -> orientar convidar bot para servidor.
- Sem canais -> orientar revisar permissões/canal.
