# Data Model: Discord Forum Threads

## DiscordImportSource

Representa uma fonte cadastrada para importacao Discord.

### Campos novos

- `channel_type`: tipo normalizado da fonte. Valores: `text`, `announcement`, `forum`.

### Regras

- Fontes existentes sem tipo devem ser tratadas como `text`.
- `channel_id` continua sendo o canal selecionado pelo admin. Para forum, e o ID do forum.
- `channel_name` continua nome legivel exibido no painel.

## DiscordImportMessage

Representa uma mensagem bruta importada do Discord.

### Campos novos

- `discord_parent_channel_id`: ID do canal pai quando a mensagem veio de thread/post; para forum, ID do forum.
- `discord_thread_id`: ID da thread/post quando aplicavel.
- `discord_thread_name`: nome legivel da thread/post quando disponivel.

### Regras

- Para canais textuais/anuncio: campos de thread ficam `null`.
- Para forum: `discord_channel_id` guarda o ID da thread real, `discord_parent_channel_id` guarda o ID do forum e `discord_thread_id` repete o ID da thread para consulta explicita.
- Deduplicacao continua por `(discord_channel_id, discord_message_id)`.
- URL de mensagem de forum usa guild, thread e mensagem.

## DiscordDiscoveredChannel

Representa canal retornado ao painel na descoberta.

### Campos

- `id`
- `guild_id`
- `name`
- `type`
- `kind`: `text`, `announcement`, `forum`
- `position`
- `parent_id`
- `parent_name`

### Regras

- Apenas canais compativeis com importacao aparecem na lista.
- Forum deve ser identificado visualmente antes de salvar.

## IngestResult

Resumo de uma busca manual.

### Campos

- `inserted`
- `updated`
- `total`
- `newestMessageId`
- `threadsScanned`
- `sourceKind`

### Regras

- `threadsScanned` e zero para canal textual/anuncio.
- Para forum, `total` soma as mensagens avaliadas nas threads varridas.
