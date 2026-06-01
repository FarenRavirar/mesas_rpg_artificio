# Contract: Inline Delete Confirmation

## Purpose

Definir o comportamento obrigatório do fluxo de exclusão de mesa sem pop-up.

## Component Contract

`InlineDeleteConfirmation` deve receber:

- `title: string` — nome da mesa afetada.
- `onConfirm: () => Promise<void> | void` — ação executada somente no clique final.
- `isProcessing?: boolean` — bloqueia confirmação duplicada.
- `disabled?: boolean` — desabilita abertura inicial quando necessário.
- `triggerLabel?: string` — texto do botão inicial.
- `confirmLabel?: string` — texto do botão final.

## Required Behavior

1. Renderizar um botão inicial de intenção destrutiva.
2. Ao clicar no botão inicial, mostrar uma confirmação inline no mesmo contexto visual.
3. Mostrar o título da mesa afetada.
4. Explicar em linguagem simples que a mesa será removida da plataforma.
5. Oferecer ação de cancelar.
6. Executar `onConfirm` somente no botão final.
7. Desabilitar o botão final enquanto `isProcessing` estiver ativo.
8. Não usar `window.confirm`, `prompt`, `alert`, `ConfirmDialog` ou portal/modal.

## Endpoint Contract

Os endpoints existentes permanecem canônicos:

- Mestre: `DELETE /api/v1/gm/tables/:id`
- Admin: `DELETE /api/v1/admin/tables/:id`

## Error Contract

Erros devem ser tratados na página com mensagem visível via padrão local (`toast.error`) e sem pop-up de browser.
