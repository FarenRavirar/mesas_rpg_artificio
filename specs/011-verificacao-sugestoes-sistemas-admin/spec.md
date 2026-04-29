# Feature Specification: Verificação de Sugestões de Sistemas no Admin

**Feature Branch**: `011-verificacao-sugestoes-sistemas-admin`  
**Created**: 2026-04-29  
**Status**: Draft  
**Input**: User description: "Verificar se o sistema de sugestão de sistemas está realmente funcionando e está chegando no admin, seja proativamente pelo admin na parte da gestão onde mostra as sugestões ou com a ferramenta de notificação que tem em 'Notificações'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirmar envio de sugestão de sistema (Priority: P1)

Como usuário, quero enviar uma sugestão de sistema e receber confirmação clara de que ela foi registrada, para saber que minha contribuição chegou à plataforma.

**Why this priority**: Se a sugestão não é registrada, o restante do fluxo administrativo não tem como funcionar.

**Independent Test**: Enviar uma sugestão pelo fluxo público/usuário e confirmar que ela fica registrada em fonte consultável pelo admin.

**Acceptance Scenarios**:

1. **Given** que o usuário envia uma sugestão válida, **When** conclui o envio, **Then** o sistema deve registrar a sugestão com dados suficientes para análise administrativa.
2. **Given** que o envio falha, **When** o usuário tenta sugerir um sistema, **Then** a interface deve informar falha de forma clara sem fingir sucesso.
3. **Given** que o usuário envia sugestão duplicada ou incompleta, **When** o sistema valida a entrada, **Then** deve aplicar o comportamento esperado já existente ou definir tratamento claro.

---

### User Story 2 - Admin visualiza sugestões na gestão (Priority: P1)

Como administrador, quero acessar a área de gestão e ver sugestões de sistemas recebidas, para analisar e decidir o que fazer com cada sugestão.

**Why this priority**: O usuário pediu verificar se a sugestão chega ao admin de forma proativa na gestão. Essa é a superfície principal de análise administrativa.

**Independent Test**: Enviar uma sugestão e confirmar que ela aparece na área administrativa de gestão de sugestões/sistemas.

**Acceptance Scenarios**:

1. **Given** que há sugestão pendente, **When** o admin abre a gestão, **Then** a sugestão deve aparecer com status e informações necessárias.
2. **Given** que não há sugestões, **When** o admin abre a gestão, **Then** a tela deve mostrar estado vazio claro.
3. **Given** que uma sugestão já foi analisada, **When** o admin consulta a gestão, **Then** o estado deve refletir que ela não está mais pendente, se esse fluxo existir.

---

### User Story 3 - Admin recebe ou consulta notificação de sugestão (Priority: P1)

Como administrador, quero ser avisado em Notificações quando uma sugestão de sistema chegar, ou ter confirmação explícita de que a gestão é o canal oficial, para não depender de busca manual incerta.

**Why this priority**: O pedido inclui a ferramenta de Notificações como canal possível. É necessário verificar se ela participa do fluxo ou se o produto deve definir apenas a gestão como canal oficial.

**Independent Test**: Enviar sugestão e verificar se Notificações recebe alerta; se não receber, registrar decisão de produto e garantir que a gestão supre a necessidade.

**Acceptance Scenarios**:

1. **Given** que uma nova sugestão é enviada, **When** o admin abre Notificações, **Then** deve haver uma notificação se esse canal for definido como obrigatório.
2. **Given** que Notificações não é o canal escolhido, **When** o admin precisa acompanhar sugestões, **Then** a gestão deve indicar pendências de modo proativo e claro.
3. **Given** que há falha entre sugestão e notificação, **When** o fluxo é validado, **Then** a falha deve ser classificada como bug de integração.

---

### User Story 4 - Mapear o fluxo ponta a ponta antes de corrigir (Priority: P1)

Como mantenedor, quero mapear o fluxo completo da sugestão até o admin, para saber se o problema é frontend, backend, persistência, permissão ou notificação.

**Why this priority**: O pedido é uma verificação funcional. Corrigir sem mapear pode atacar o ponto errado e deixar o canal administrativo quebrado.

**Independent Test**: Documentar cada etapa do fluxo e marcar evidência de funcionamento ou falha por camada.

**Acceptance Scenarios**:

1. **Given** que a investigação começa, **When** o fluxo é mapeado, **Then** deve haver lista de telas, rotas, persistência e canais administrativos envolvidos.
2. **Given** que uma etapa falha, **When** ela é identificada, **Then** deve ser classificada com severidade e correção proposta.
3. **Given** que o fluxo funciona, **When** a verificação termina, **Then** deve haver evidência de ponta a ponta e critério de monitoramento futuro.

---

### Edge Cases

- Sugestão enviada por usuário autenticado e não autenticado, se ambos forem permitidos.
- Sugestão duplicada.
- Sugestão com texto muito curto, muito longo ou caracteres especiais.
- Admin sem permissão adequada tentando ver sugestões.
- Sugestão registrada mas não exibida por filtro/status.
- Notificação criada mas não marcada como visível para admin.
- Gestão mostra dados antigos por cache ou estado local.
- Falha parcial: envio confirma sucesso, mas admin não recebe.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O fluxo de sugestão de sistemas MUST ser mapeado ponta a ponta antes de qualquer correção técnica.
- **FR-002**: A investigação MUST identificar onde a sugestão é enviada, validada, persistida, listada para admin e notificada, se aplicável.
- **FR-003**: O sistema MUST permitir verificar se uma sugestão enviada chega à gestão administrativa.
- **FR-004**: O sistema MUST definir se Notificações é canal obrigatório para sugestões de sistemas ou se a gestão administrativa é o canal oficial.
- **FR-005**: Se Notificações for canal obrigatório, novas sugestões MUST gerar notificação visível para admins autorizados.
- **FR-006**: Se a gestão for o canal oficial, ela MUST sinalizar sugestões pendentes de forma clara para o admin.
- **FR-007**: Falhas encontradas MUST ser classificadas por camada: frontend, backend, persistência, permissão, integração ou notificação.
- **FR-008**: A validação MUST cobrir envio real de sugestão e consulta real pelo admin no Beta.
- **FR-009**: O fluxo MUST preservar permissões administrativas existentes.
- **FR-010**: A UI MUST evitar confirmar sucesso ao usuário se a sugestão não foi registrada.

### Key Entities *(include if feature involves data)*

- **Sugestão de Sistema**: Pedido enviado por usuário para incluir ou revisar um sistema de RPG.
- **Admin**: Usuário com permissão para consultar e tratar sugestões.
- **Gestão de Sistemas**: Área administrativa onde sugestões podem ser vistas ou processadas.
- **Notificação Administrativa**: Alerta exibido em Notificações para chamar atenção do admin.
- **Status da Sugestão**: Estado operacional da sugestão, como pendente, analisada, aprovada, recusada ou equivalente existente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O fluxo ponta a ponta de sugestão de sistemas está documentado com todas as etapas e arquivos/rotas afetados.
- **SC-002**: Uma sugestão enviada no Beta aparece para admin na gestão ou gera notificação administrativa conforme canal definido.
- **SC-003**: 100% das falhas encontradas no fluxo são classificadas com severidade e camada responsável.
- **SC-004**: O admin consegue identificar sugestões pendentes sem depender de inspeção técnica.
- **SC-005**: O usuário não recebe confirmação falsa de sucesso quando a sugestão não chega ao sistema.

## Assumptions

- Já existe algum fluxo de sugestão de sistemas no produto.
- Já existe área administrativa de gestão de sistemas e ferramenta de Notificações.
- O escopo inicial é investigação e especificação de correção, não alteração de permissões administrativas.
- A validação funcional precisa ocorrer no Beta em janela anônima/fluxo real quando houver implementação.
