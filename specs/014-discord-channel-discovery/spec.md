# Feature Specification: Descoberta de Canais Discord

**Feature Branch**: `feat/014-discord-channel-discovery`  
**Created**: 2026-05-03  
**Status**: Draft  
**Input**: User description: "facilitar e automatizar sem gambiarras: o painel deve descobrir servidores e canais do Discord automaticamente, em vez de exigir cadastro manual de IDs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escolher canal por lista assistida (Priority: P1)

Como administrador, quero ver os servidores onde o bot está instalado e selecionar um canal disponível em uma lista, para cadastrar uma fonte de importação sem copiar IDs manualmente.

**Why this priority**: É o caminho principal de onboarding. Sem isso, a configuração ainda depende de passos técnicos e continua frágil para uso operacional.

**Independent Test**: Com token válido e bot instalado em ao menos um servidor, abrir a aba Fontes, escolher servidor e canal em seletores, salvar e ver a fonte cadastrada na lista.

**Acceptance Scenarios**:

1. **Given** o token do bot está configurado e o bot participa de servidores, **When** o admin abre o formulário de adicionar canal, **Then** o painel exibe uma lista de servidores descobertos.
2. **Given** o admin selecionou um servidor, **When** a lista de canais é carregada, **Then** o painel exibe canais textuais compatíveis para importação.
3. **Given** o admin selecionou um canal, **When** clica em salvar, **Then** a fonte é criada com `guild_id`, `channel_id` e nome do canal preenchidos automaticamente.

---

### User Story 2 - Entender falhas de descoberta (Priority: P2)

Como administrador, quero mensagens claras quando o bot não consegue listar servidores ou canais, para corrigir token, instalação ou permissões sem precisar inspecionar logs.

**Why this priority**: A descoberta depende do estado externo do Discord. Erros claros reduzem tentativa e erro e evitam diagnósticos por SSH.

**Independent Test**: Com token ausente, inválido ou bot sem acesso ao servidor/canal, abrir o fluxo de descoberta e observar uma mensagem acionável.

**Acceptance Scenarios**:

1. **Given** nenhum token está configurado, **When** o admin tenta descobrir servidores, **Then** o painel informa que é preciso configurar o token antes.
2. **Given** o bot não está em nenhum servidor acessível, **When** o admin tenta descobrir servidores, **Then** o painel informa que o bot precisa ser convidado para o servidor.
3. **Given** o bot não tem permissão para ler canais do servidor selecionado, **When** o admin tenta carregar canais, **Then** o painel informa que as permissões do bot no Discord precisam ser revisadas.

---

### User Story 3 - Manter modo manual como escape avançado (Priority: P3)

Como administrador avançado, quero ainda poder informar IDs manualmente, para lidar com casos em que a API do Discord esteja indisponível ou a descoberta automática não retorne um canal esperado.

**Why this priority**: O caminho principal deve ser automático, mas o modo manual preserva operação em casos extremos e reduz risco de bloqueio.

**Independent Test**: Abrir opção avançada, informar servidor/canal manualmente e salvar como fonte sem usar descoberta.

**Acceptance Scenarios**:

1. **Given** a descoberta automática falhou, **When** o admin abre o modo manual, **Then** os campos de `guild_id`, `channel_id` e nome opcional continuam disponíveis.
2. **Given** o admin preenche IDs válidos manualmente, **When** salva, **Then** a fonte é cadastrada como antes.

### Edge Cases

- Token salvo no banco existe, mas foi revogado no Discord.
- Bot está instalado em servidor, mas nenhum canal textual está visível para ele.
- Servidor tem muitos canais; a lista deve continuar legível e ordenada.
- Canal já cadastrado é selecionado novamente.
- Discord retorna rate limit ou indisponibilidade temporária.
- O formulário é aberto antes da configuração do token.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que administradores descubram servidores Discord acessíveis ao bot configurado.
- **FR-002**: O sistema MUST permitir que administradores descubram canais textuais compatíveis de um servidor selecionado.
- **FR-003**: O sistema MUST permitir cadastrar uma fonte de importação a partir de servidor e canal selecionados, sem digitar IDs manualmente.
- **FR-004**: O sistema MUST preencher automaticamente o nome legível do canal ao cadastrar via descoberta.
- **FR-005**: O sistema MUST manter o cadastro manual de fonte como modo avançado.
- **FR-006**: O sistema MUST restringir descoberta e cadastro de fontes a administradores autenticados.
- **FR-007**: O sistema MUST apresentar mensagens acionáveis para token ausente, token inválido, bot sem servidor, servidor inacessível, canal inacessível e falha temporária do Discord.
- **FR-008**: O sistema MUST NOT expor o token do bot em respostas, logs ou interface.
- **FR-009**: O sistema MUST filtrar a descoberta para canais adequados à leitura/importação de mensagens, priorizando canais textuais e de anúncios.
- **FR-010**: O sistema MUST impedir duplicidade de fonte para canal já cadastrado e explicar o motivo ao admin.

### Key Entities *(include if feature involves data)*

- **Servidor Discord Descoberto**: servidor em que o bot está presente; contém identificador, nome e metadados mínimos para seleção.
- **Canal Discord Descoberto**: canal disponível dentro de um servidor; contém identificador, nome, tipo, posição e categoria quando disponível.
- **Fonte de Importação Discord**: fonte já existente que vincula servidor e canal cadastrados para ingestão.

## Database Migrations *(if feature modifies schema)*

Não há migration planejada. A feature usa a tabela existente `discord_import_sources` e o token já salvo em `discord_settings`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador consegue cadastrar uma nova fonte Discord em até 60 segundos após o bot já estar instalado no servidor.
- **SC-002**: O cadastro principal de fonte não exige copiar nem digitar IDs do Discord.
- **SC-003**: Erros de token/permissão aparecem na interface com orientação clara em até uma ação do usuário.
- **SC-004**: O token completo do bot nunca aparece em telas, respostas HTTP ou logs durante o fluxo de descoberta.

## Assumptions

- O bot já foi criado e o token já foi salvo pela Feature 013.
- A descoberta lista servidores onde o bot está instalado; instalar o bot em novos servidores continua ocorrendo pelo Discord.
- O fluxo de ingestão existente continua usando fontes cadastradas em `discord_import_sources`.
- Canais textuais e de anúncios são suficientes para a importação atual de mensagens.
- O modo manual é secundário e deve ser visualmente tratado como opção avançada.
