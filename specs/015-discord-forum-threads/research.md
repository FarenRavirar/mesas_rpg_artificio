# Research: Discord Forum Threads

**Feature**: 015 — Importacao de Posts de Foruns Discord  
**Data**: 2026-05-04

## Decisao 1 — Tipos de canal suportados

**Decision**: Suportar `GUILD_TEXT` (0), `GUILD_ANNOUNCEMENT` (5) e `GUILD_FORUM` (15). Nao implementar `GUILD_MEDIA` (16) nesta feature.

**Rationale**: A documentacao oficial de Channel Object lista `GUILD_FORUM` como canal que so contem threads e `GUILD_MEDIA` como similar, mas marca media channels como ainda em desenvolvimento ativo e recomenda evitar features nao documentadas. O prompt exige forum como escopo principal e deixa media como opcional apenas se a documentacao confirmar compatibilidade segura.

**Alternatives considered**:
- Incluir `GUILD_MEDIA` junto com forum: rejeitado por risco de API em desenvolvimento ativo.
- Manter apenas texto/anuncio: rejeitado porque nao resolve os anuncios reais em foruns.

## Decisao 2 — Enumeracao de posts/threads de forum

**Decision**: Para uma fonte de forum, listar threads ativas do servidor e filtrar por `parent_id` do forum; depois listar threads publicas arquivadas do proprio forum.

**Rationale**: A documentacao oficial de Threads define rotas de enumeracao: threads ativas por guild e threads publicas arquivadas por canal. Forums aparecem como canais onde posts sao threads. Isso cobre posts ativos e arquivados publicamente sem scraping ou gateway.

**Alternatives considered**:
- Buscar mensagens diretamente no canal de forum: rejeitado porque forum nao e canal textual comum.
- Usar scraping/export manual: rejeitado pelo prompt e pela governanca.

## Decisao 3 — Busca de mensagens

**Decision**: Reutilizar o comportamento de buscar mensagens por canal, chamando a rota de mensagens com o ID da thread para cada post/thread.

**Rationale**: Threads sao canais na API Discord. O fluxo existente ja persiste mensagens de um canal; a variacao necessaria e chamar a busca por thread e salvar metadados do forum pai.

**Alternatives considered**:
- Criar tabela nova de threads: rejeitado para MVP porque metadados de origem em `discord_import_messages` e tipo em `discord_import_sources` cobrem os requisitos sem entidade extra.

## Decisao 4 — Modelo de origem e deduplicacao

**Decision**: A fonte de forum mantem `channel_id` como ID do forum. Mensagens de forum usam `discord_channel_id` como ID da thread real, adicionam `discord_parent_channel_id` como ID do forum, `discord_thread_id` como ID da thread e `discord_thread_name` para exibicao.

**Rationale**: A constraint existente `UNIQUE (discord_channel_id, discord_message_id)` continua correta se `discord_channel_id` representar o canal real onde a mensagem vive. Para mensagens em threads, esse canal real e a thread. O vinculo com forum fica explicito por coluna adicional.

**Alternatives considered**:
- Gravar `discord_channel_id` como forum: rejeitado porque a URL e a deduplicacao de mensagens em threads ficariam menos precisas.
- Trocar constraint para tripla com forum/thread/mensagem: desnecessario se o canal real for a thread.

## Decisao 5 — Migration

**Decision**: Criar `database/migration_117_discord_forum_threads.sql` online-safe com `ADD COLUMN IF NOT EXISTS` para tipo da fonte e metadados forum/thread nas mensagens, alem de indices auxiliares.

**Rationale**: `migrations_guide.md` classifica `ADD COLUMN` sem restricao estrita como online-safe. Fontes existentes recebem default compativel com canais textuais.

**Alternatives considered**:
- Sem migration: rejeitado porque FR-006/FR-013 exigem origem consultavel.
- Tabelas novas: rejeitado por complexidade maior sem necessidade para o fluxo inicial.

## Decisao 6 — Erros e timeout

**Decision**: Centralizar chamadas REST Discord com `AbortController` manual e mapeamento de 401/403/404/429 para mensagens acionaveis sem incluir corpo bruto com token ou detalhes sensiveis.

**Rationale**: O prompt proibe `AbortSignal.timeout` e a governanca exige timeout explicito e logs sem segredos. O codigo de discovery ja usa `AbortController`; a ingestao atual ainda usa `AbortSignal.timeout` e deve ser ajustada nesta feature.

**Alternatives considered**:
- Propagar corpo bruto do Discord no erro: rejeitado para evitar exposicao acidental e UX ruim.
