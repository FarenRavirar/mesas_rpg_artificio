# Research: Descoberta de Canais Discord

## Decision 1: Usar endpoints REST com Bot token

**Decision**: Implementar discovery com chamadas REST autenticadas por `Authorization: Bot <token>`.

**Rationale**: O projeto já usa REST para buscar mensagens e não mantém conexão Gateway persistente. Isso preserva lazy-load e evita serviço residente novo.

**Alternatives considered**:
- Gateway Discord: rejeitado por maior complexidade operacional e necessidade de ciclo de conexão.
- OAuth2 do usuário admin: rejeitado porque exigiria novo fluxo de autorização e escopo `guilds`.

## Decision 2: Listar servidores via `GET /users/@me/guilds`

**Decision**: Usar o token do bot para listar guilds do usuário bot.

**Rationale**: A documentação oficial do Discord descreve `Get Current User Guilds` como retorno de guilds do requester. Para bot token, o requester é o bot, portanto a lista representa servidores onde o bot está presente.

**Alternatives considered**:
- Pedir `guild_id` manual: rejeitado como caminho principal por manter a fricção original.
- Persistir guilds localmente: rejeitado para v1; discovery pode ser sob demanda.

## Decision 3: Listar canais via `GET /guilds/{guild.id}/channels`

**Decision**: Após selecionar servidor, buscar canais desse servidor e filtrar tipos compatíveis.

**Rationale**: A documentação oficial lista `Get Guild Channels` como rota que retorna canais do servidor sem incluir threads. Isso cobre canais textuais e de anúncio para importação atual.

**Alternatives considered**:
- Buscar canais por tentativa em IDs informados: rejeitado como manual e frágil.
- Descobrir threads neste momento: fora do escopo; importação atual mira canais principais.

## Decision 4: Filtrar canais textuais e anúncios

**Decision**: Expor apenas tipos `GUILD_TEXT` e `GUILD_ANNOUNCEMENT` na seleção principal.

**Rationale**: O importador lê histórico de mensagens de canal. Canais de voz, categorias e stages não servem ao fluxo atual.

**Alternatives considered**:
- Expor todos os canais: rejeitado por confundir o admin e permitir seleção sem utilidade.

## Decision 5: Erros acionáveis por status Discord

**Decision**: Mapear erros de token/configuração/permissão/rate limit para mensagens específicas no backend.

**Rationale**: O mantenedor precisa resolver onboarding pelo painel, sem SSH. Mensagens genéricas inviabilizam isso.

**Alternatives considered**:
- Encaminhar corpo bruto do Discord: rejeitado por UX ruim e possível vazamento de detalhes desnecessários.
