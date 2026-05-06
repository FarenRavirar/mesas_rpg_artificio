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

## Decisao 7 — Message Content Intent como pre-condicao de dados utilizaveis

**Decision**: Tratar `MESSAGE_CONTENT` como pre-condicao obrigatoria para diagnostico e ingestao funcional de posts de forum. Se a API Discord retornar mensagem existente com `content`, `embeds`, `attachments` e `components` vazios, o sistema deve expor diagnostico acionavel em vez de considerar o post como valido para draft.

**Rationale**: A documentacao oficial de Message Resource informa que apps sem `MESSAGE_CONTENT` configurado/aprovado recebem valores vazios em `content`, `embeds`, `attachments` e `components` no objeto de mensagem. O mesmo documento define `Get Channel Message` como retorno de um Message Object e exige `VIEW_CHANNEL` e `READ_MESSAGE_HISTORY` em canais de servidor. A API Reference oficial tambem define autenticacao por header `Authorization: Bot ...`, que e o formato usado pelo backend. Referencias: <https://docs.discord.com/developers/resources/message> e <https://docs.discord.com/developers/reference>.

**Evidence 2026-05-06**: Antes do intent, chamadas reais para posts do Covil retornavam `contentLength=0`, `embedsLength=0` e `attachmentsLength=0`. Apos ativacao do Message Content Intent, os mesmos posts retornaram corpos reais pela API: Forgotten Realms (`2125` chars), Deicidio (`1878`), Tormenta20 (`1826`), Planescape (`2748`) e Mage one-shot (`1293`), todos com anexo.

**Alternatives considered**:
- Usar apenas `discord_thread_name` como fallback permanente: rejeitado porque o objetivo da feature e criar draft completo; titulo isolado nao contem descricao, vagas, preco, horario e contato.
- Usar Application Commands para recuperar dados historicos: rejeitado. Application Commands servem para interacoes acionadas por usuario (`CHAT_INPUT`, `USER`, `MESSAGE`, `PRIMARY_ENTRY_POINT`) e nao substituem leitura REST de mensagens historicas de forum. Referencia: <https://docs.discord.com/developers/interactions/application-commands>.

## Decisao 8 — Resolucao de sistema deve evitar aliases genericos

**Decision**: O parser deve preferir nome/nome_pt e candidatos mais especificos antes de aliases curtos ou genericos. Aliases curtos como `D&D` nao podem vencer nomes especificos nem causar match em sistemas derivados sem relacao direta com o anuncio.

**Rationale**: Teste real com a lista de sistemas do banco mostrou que aliases genericos podem estar associados a sistemas derivados, causando draft pronto com `system_id` incorreto. O parser agora ignora aliases curtos genericos e aceita sufixos numericos de versao no nome do sistema, permitindo `Tormenta20` casar com `Tormenta` sem transformar `D&D` em `Gamma World`.

**Evidence 2026-05-06**: Com conteudo real da API Discord e sistemas reais do banco Beta, os posts testados geraram: Forgotten Realms -> `Dungeons & Dragons 2024`, Deicidio -> `Dungeons & Dragons`, Tormenta20 -> `Tormenta`, Planescape -> `Dungeons & Dragons`, Mage one-shot -> `Mage`, todos com status `ready` e `missing=[]`.

## Decisao 9 — Apenas starter de thread representa post/anuncio

**Decision**: Para forum Discord, apenas a mensagem starter (`discord_message_id = discord_thread_id`) deve ser candidata automatica a draft de mesa. Replies dentro da thread podem ser material auxiliar, conversa ou anexos e nao devem ser tratadas como post/anuncio.

**Rationale**: Teste real do Covil confirmou que uma reply com PDF dentro da thread `Fundação 0: Lucro, Ossos e Reputação` nao era o anuncio. O anuncio verdadeiro era o starter da thread, que a API retornou com 1632 caracteres e imagem. Considerar replies como posts inflaria contagem, criaria falsos pendentes e poderia gerar drafts incorretos.

**Evidence 2026-05-06**: `Fundação 0` tinha dois registros importados: starter `1498453714988433519` (`discord_message_id = discord_thread_id`) com corpo completo apos reidratacao, e reply `1499419708359971008` (`discord_message_id != discord_thread_id`) com PDF e sem texto. A reply foi marcada `ignored`; o starter virou candidato a draft e ficou `needs_review` apenas porque `One Two Six (Sistema Inédito)` ainda nao existe no cadastro de sistemas.

## Decisao 10 — Sistema vem do corpo estruturado, nao do titulo/cenario

**Decision**: Quando o post possui corpo estruturado, a resolucao de sistema deve usar primeiro o valor explicito do campo `Sistema:`. O nome da thread so pode ser usado como fallback quando nao ha corpo textual suficiente. Nomes como Forgotten Realms, Waterdeep, Planescape, Vecna ou Ravenloft nao devem virar sugestao automatica de sistema se o corpo informa outro sistema.

**Rationale**: Posts profissionais do Covil normalmente usam o titulo para campanha, aventura, cenario ou produto, enquanto o sistema aparece no corpo. Promover titulo/cenario para sistema polui a fila de sugestoes e pode gerar drafts com sistema incorreto.

**Evidence 2026-05-06**: Reteste com 11 starters reais reidratados no Beta e parser local corrigido retornou 11/11 `ready` no estado atual do banco. Forgotten Realms e Planescape resolveram para Dungeons & Dragons, Waterdeep para Dungeons & Dragons 5e, Tormenta20 para Tormenta, e One Two Six para o cadastro existente no Beta. O teste unitario cobre o caso inedito: se `Sistema: One Two Six (Sistema Inédito)` nao existir no banco, a sugestao criada usa esse valor, nao `Forgotten Realms`.
