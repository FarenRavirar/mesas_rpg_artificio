# Data Model: Verificação de Sugestões de Sistemas no Admin

## Sugestão de Sistema

**Purpose**: Pedido enviado por usuário para sugerir inclusão, ajuste ou revisão de um sistema de RPG.

**Key Attributes**:
- `id`: identificador da sugestão.
- `name`: nome do sistema sugerido.
- `description`: detalhe opcional da sugestão.
- `submittedBy`: usuário ou origem, quando aplicável.
- `status`: estado da sugestão.
- `createdAt`: data de envio.

**Validation Rules**:
- Sugestão válida deve ser registrável e rastreável.
- Dados incompletos devem receber tratamento claro.
- Envio não deve confirmar sucesso se registro falhar.

## Admin

**Purpose**: Usuário autorizado a consultar e tratar sugestões de sistemas.

**Key Attributes**:
- `id`: identificador do admin.
- `role`: permissão administrativa.
- `notificationAccess`: acesso à ferramenta de Notificações.
- `managementAccess`: acesso à gestão de sistemas.

**Validation Rules**:
- Apenas admins autorizados devem ver sugestões administrativas.
- Permissões devem ser preservadas no fluxo.

## Gestão de Sistemas

**Purpose**: Área administrativa onde sugestões podem ser consultadas e tratadas.

**Key Attributes**:
- `pendingSuggestions`: sugestões pendentes.
- `filters`: filtros de status ou busca, se existirem.
- `emptyState`: estado quando não há sugestões.
- `reviewActions`: ações administrativas existentes.

**Validation Rules**:
- Sugestões pendentes devem ser visíveis ou sinalizadas.
- Filtros não devem ocultar pendências sem indicação clara.
- Estado vazio deve ser explícito.

## Notificação Administrativa

**Purpose**: Alerta para admins sobre nova sugestão criada por usuário.

**Key Attributes**:
- `id`: identificador da notificação.
- `type`: tipo de alerta.
- `recipientRole`: papel destinatário.
- `message`: texto da notificação.
- `readState`: lida ou não lida.
- `createdAt`: data de criação.

**Validation Rules**:
- Deve ser criada para toda sugestão criada por usuário.
- Deve ser visível para admins autorizados.
- Não deve duplicar alertas sem necessidade.

## Status da Sugestão

**Purpose**: Estado operacional da sugestão.

**Known States**:
- Pendente.
- Analisada.
- Aprovada.
- Recusada.
- Estado equivalente já existente.

**Validation Rules**:
- Status deve permitir diferenciar sugestão nova de sugestão tratada.
- Gestão e Notificações devem representar o status de forma coerente.

## State Transitions

### Envio até gestão

1. Usuário preenche sugestão.
2. Frontend envia dados.
3. Backend valida payload.
4. Sistema persiste sugestão.
5. Gestão administrativa lista ou sinaliza sugestão pendente.
6. Admin consulta detalhes.

### Envio até notificação

1. Sugestão é registrada.
2. Sistema cria notificação administrativa como parte do fluxo obrigatório.
3. Notificação administrativa aponta para a gestão.
4. Admin acessa Notificações.
5. Admin identifica sugestão nova.

### Falha parcial

1. Usuário recebe confirmação.
2. Sugestão não aparece para admin.
3. Fluxo é classificado por camada de falha.
4. Correção é proposta na camada correta.
