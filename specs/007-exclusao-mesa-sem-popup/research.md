# Research: Exclusão de Mesa Sem Pop-up

## Decision: Confirmação inline expansível

**Rationale**: A confirmação precisa acontecer dentro da página, visualmente associada à mesa afetada. Um bloco inline aberto após a primeira ação atende a FR-001, FR-002, FR-004 e FR-005 sem recorrer a pop-up, modal ou navegação.

**Alternatives considered**:
- `window.confirm`: rejeitado por ser exatamente o comportamento a remover.
- Modal customizado `ConfirmDialog`: rejeitado porque continua sendo uma sobreposição/pop-up, ainda que estilizada.
- Excluir imediatamente com toast de desfazer: rejeitado porque FR-002 exige que a primeira ação não remova a mesa.

## Decision: Segunda ação em botão destrutivo final

**Rationale**: Um botão final explícito "Excluir definitivamente" dentro do painel aberto é suficiente para prevenir clique acidental e mantém a ação rápida em desktop/mobile.

**Alternatives considered**:
- Digitar o nome da mesa: rejeitado nesta iteração por aumentar fricção e porque a spec exige segunda ação consciente, não digitação obrigatória.
- Checkbox adicional: rejeitado por criar mais um controle sem ganho claro sobre o botão final, desde que a mesa afetada esteja identificada.

## Decision: Feedback via `react-hot-toast`

**Rationale**: As telas já usam `toast.success` e `toast.error` para feedback de operações. O toast não é confirmação e mantém o retorno dentro da experiência da página sem bloquear o usuário.

**Alternatives considered**:
- `alert`: rejeitado por ser pop-up.
- Mensagem persistente em estado local em cada tela: rejeitada por aumentar duplicação sem benefício imediato, já que o app tem padrão consolidado de toast.

## Decision: Backend inalterado

**Rationale**: FR-010 exige preservar permissões atuais. As rotas `DELETE /api/v1/gm/tables/:id` e `DELETE /api/v1/admin/tables/:id` já validam autorização no backend; a feature altera a camada de intenção/UX.

**Alternatives considered**:
- Novo endpoint de pré-confirmação: rejeitado porque não há requisito de mudança de autorização ou auditoria adicional.
- Soft delete/schema novo: rejeitado porque a spec assume sem mudança de banco.

## Decision: Remover util de exclusão com browser dialogs

**Rationale**: `frontend/src/features/table/utils/uiHelpers.ts` concentra um handler de exclusão com `confirm`, `prompt` e `alert`. O fluxo da página da mesa deve migrar para componente React com estado local para cumprir FR-001, FR-007 e FR-009.

**Alternatives considered**:
- Manter util e só trocar por `ConfirmDialog`: rejeitado por ainda ser pop-up/modal.
- Adaptar util para receber callbacks de UI: rejeitado por complexidade maior que mover o fluxo para o componente onde o estado visual existe.
