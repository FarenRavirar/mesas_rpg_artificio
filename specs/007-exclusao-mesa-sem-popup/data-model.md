# Data Model: Exclusão de Mesa Sem Pop-up

## Entity: Mesa

**Fields used by this feature**
- `id`: identificador usado no endpoint de exclusão.
- `title`: nome exibido na confirmação inline.
- `status`: usado apenas para manter contexto nos cards/painéis existentes.

**Validation rules**
- `id` deve existir antes de acionar o endpoint.
- `title` deve ser exibido ao usuário antes da confirmação final.

## Entity: Mestre responsável

**Fields used by this feature**
- `user.role`: usado pelo fluxo existente para escolher endpoint administrativo ou do mestre.
- Sessão autenticada via cookie atual.

**Validation rules**
- A autorização continua sendo validada pelo backend.
- Usuário não autenticado não executa a ação.

## Entity: Confirmação de exclusão

**Type**: Estado temporário de UI.

**Fields**
- `isOpen`: indica que a confirmação inline está visível.
- `isProcessing`: indica que a exclusão está em andamento.
- `title`: nome da mesa afetada.

**State transitions**
- `idle` -> `confirming`: primeira ação em "Excluir".
- `confirming` -> `idle`: cancelamento.
- `confirming` -> `processing`: clique em "Excluir definitivamente".
- `processing` -> `success`: endpoint retorna sucesso; lista/página é atualizada.
- `processing` -> `error`: endpoint falha; confirmação pode ser fechada ou reaberta sem duplicar requisição.

**Invariants**
- A primeira ação nunca chama `DELETE`.
- Durante `processing`, botões de confirmação ficam desabilitados.
- A confirmação identifica a mesa antes da ação final.
