# Feature Specification: Importacao de Posts de Foruns Discord

**Feature Branch**: `feat/015-discord-forum-threads`  
**Created**: 2026-05-04  
**Status**: Draft  
**Input**: User description: "suporte completo a canais de forum/threads no Discord Sync, permitindo selecionar foruns como fonte e importar posts/threads reais sem quebrar canais de texto/anuncio"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importar anuncios de um forum Discord (Priority: P1)

Como administrador, quero cadastrar um canal de forum do Discord como fonte e buscar seus posts, para que anuncios publicados em posts/threads sejam importados pelo fluxo do Discord Sync.

**Why this priority**: O uso real do servidor depende de foruns. Sem este fluxo, a importacao nao cobre os anuncios principais e a integracao Discord fica operacionalmente incompleta.

**Independent Test**: Com token valido e bot com acesso a um forum real, selecionar o forum no painel, cadastrar a fonte, executar a busca e confirmar que mensagens de posts/threads aparecem na area de mensagens importadas com origem reconhecivel.

**Acceptance Scenarios**:

1. **Given** o token do bot esta configurado e o bot consegue ver um canal de forum, **When** o admin seleciona esse forum e cadastra a fonte, **Then** a fonte fica salva com identificacao clara de que e um forum.
2. **Given** uma fonte de forum cadastrada possui posts visiveis, **When** o admin executa a busca de mensagens, **Then** o sistema importa mensagens dos posts/threads desse forum.
3. **Given** uma mensagem importada veio de um post/thread de forum, **When** o admin consulta sua origem, **Then** a relacao com forum e post/thread fica preservada de forma clara.

---

### User Story 2 - Preservar canais textuais existentes (Priority: P2)

Como administrador, quero que fontes de canais de texto e anuncio continuem funcionando, para que a melhoria de foruns nao interrompa o fluxo ja publicado em Beta.

**Why this priority**: A feature amplia o escopo da importacao, mas nao pode regredir o comportamento validado nas features 012 a 014.

**Independent Test**: Com uma fonte textual ou de anuncio ja cadastrada, executar a busca e confirmar que as mensagens continuam sendo importadas e deduplicadas como antes.

**Acceptance Scenarios**:

1. **Given** uma fonte de canal textual ja cadastrada, **When** o admin executa a busca, **Then** o sistema mantem a importacao desse canal.
2. **Given** uma fonte de canal de anuncio ja cadastrada, **When** o admin executa a busca, **Then** o sistema mantem a importacao desse canal.
3. **Given** a mesma mensagem ja foi importada antes, **When** a busca roda novamente, **Then** a mensagem nao gera duplicata.

---

### User Story 3 - Entender falhas em foruns e threads (Priority: P3)

Como administrador, quero receber mensagens acionaveis quando a busca em forum falhar, para corrigir permissoes, token ou disponibilidade do Discord sem expor segredos.

**Why this priority**: Foruns e threads dependem de permissoes e visibilidade externas. Sem diagnostico claro, o admin fica sem saber se o problema e token, permissao, forum vazio ou limite temporario.

**Independent Test**: Simular token invalido, falta de permissao ou forum sem posts visiveis e confirmar que a interface mostra orientacao clara sem revelar token.

**Acceptance Scenarios**:

1. **Given** o token salvo foi revogado, **When** o admin tenta buscar mensagens, **Then** o sistema informa que o bot precisa ser reconfigurado.
2. **Given** o bot nao tem permissao para ler posts/threads de um forum, **When** o admin tenta buscar mensagens, **Then** o sistema informa que as permissoes no Discord precisam ser revisadas.
3. **Given** um forum nao possui posts visiveis para o bot, **When** a busca termina, **Then** o sistema informa que nenhum post visivel foi encontrado sem tratar isso como falha inesperada.

### Edge Cases

- Forum possui posts ativos e arquivados publicamente.
- Forum possui muitos posts; a busca deve limitar trabalho por execucao e continuar previsivel para o admin.
- Post/thread nao possui mensagem inicial visivel para o bot.
- A mesma mensagem aparece em mais de uma execucao de busca.
- Discord retorna limite temporario, indisponibilidade ou permissao negada durante parte da busca.
- Fonte criada antes desta feature nao possui tipo de canal salvo.
- Canais de texto/anuncio e foruns coexistem na mesma lista de fontes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir canais de forum na descoberta de canais Discord quando o bot tiver acesso a eles.
- **FR-002**: O sistema MUST permitir cadastrar uma fonte Discord a partir de um canal de forum selecionado.
- **FR-003**: O sistema MUST distinguir visualmente fontes de forum das fontes de canal textual ou de anuncio.
- **FR-004**: O sistema MUST detectar o tipo da fonte durante a busca e escolher o comportamento adequado para canais textuais, canais de anuncio e foruns.
- **FR-005**: Para fontes de forum, o sistema MUST buscar posts/threads visiveis ao bot e importar mensagens desses posts/threads.
- **FR-006**: O sistema MUST preservar, para mensagens vindas de forum, a origem do forum e do post/thread de forma consultavel.
- **FR-007**: O sistema MUST gerar referencias corretas para abrir no Discord a mensagem ou post/thread importado.
- **FR-008**: O sistema MUST deduplicar mensagens importadas de forum mesmo quando a busca roda mais de uma vez ou percorre multiplos posts/threads.
- **FR-009**: O sistema MUST manter sem regressao a importacao de canais textuais e canais de anuncio ja existentes.
- **FR-010**: O sistema MUST apresentar mensagens acionaveis para token ausente, token invalido, falta de permissao, limite temporario, forum inacessivel e forum sem posts visiveis.
- **FR-011**: O sistema MUST NOT expor o token do bot em respostas, logs ou interface.
- **FR-012**: O sistema MUST restringir descoberta, cadastro de fontes e busca de mensagens a administradores autenticados.
- **FR-013**: O sistema MUST registrar tipo e origem suficientes para que futuras etapas de parser saibam se uma mensagem veio de canal comum ou de forum.

### Key Entities *(include if feature involves data)*

- **Fonte Discord**: origem cadastrada por administrador para importacao; passa a poder representar canal textual, canal de anuncio ou forum.
- **Forum Discord**: canal organizado por posts/threads, selecionavel como fonte quando visivel ao bot.
- **Post/Thread Discord**: unidade de conversa dentro de um forum; contem mensagens que podem representar anuncios.
- **Mensagem Importada Discord**: mensagem capturada de canal textual/anuncio ou post/thread de forum, com identificadores de origem e referencia para o Discord.

## Database Migrations *(if feature modifies schema)*

Migration planejada para registrar metadados de tipo de canal e origem de forum/thread nas tabelas existentes do Discord Sync, mantendo compatibilidade com fontes ja cadastradas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador consegue cadastrar um forum como fonte em ate 60 segundos apos o bot ja ter acesso ao servidor.
- **SC-002**: Uma busca em fonte de forum importa mensagens de posts/threads visiveis em uma unica acao do admin.
- **SC-003**: Rodar a mesma busca de forum duas vezes consecutivas nao cria mensagens duplicadas.
- **SC-004**: Fontes textuais e de anuncio existentes continuam importando mensagens apos a entrega da feature.
- **SC-005**: Em falhas comuns de token, permissao ou limite temporario, o admin recebe uma orientacao acionavel na propria interface.
- **SC-006**: O token completo do bot nunca aparece em telas, respostas HTTP ou logs durante descoberta, cadastro ou busca.

## Assumptions

- O token do bot continua sendo configurado pelo painel administrativo existente.
- O bot possui permissoes do Discord suficientes para ver canais, posts/threads e mensagens que devem ser importados.
- Threads privadas ou conteudo invisivel ao bot ficam fora do escopo inicial.
- O parser semantico perfeito de anuncios continua fora do escopo; esta feature foca a captura e a origem das mensagens.
- Rotina automatica recorrente de sync continuo permanece fora do escopo, salvo reaproveitamento de fluxo ja existente.
