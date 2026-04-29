# Quickstart: Exclusão de Mesa Sem Pop-up

## Pré-condições

1. Estar autenticado como mestre com pelo menos uma mesa própria.
2. Para fluxo administrativo, estar autenticado como admin.

## Cenário 1: Painel do Mestre

1. Abrir `/painel`.
2. Em uma mesa publicada, clicar em `Excluir`.
3. Verificar que a mesa não é excluída imediatamente.
4. Verificar que aparece confirmação inline com o nome da mesa.
5. Clicar em `Cancelar` e confirmar que a mesa permanece.
6. Reabrir a confirmação e clicar em `Excluir definitivamente`.
7. Verificar feedback de sucesso e atualização da lista.

## Cenário 2: Página/preview da Mesa

1. Abrir uma mesa própria em contexto que exibe ações de gerenciamento.
2. Clicar em `Excluir permanentemente`.
3. Verificar confirmação inline, sem `confirm`, `prompt`, `alert` ou modal.
4. Confirmar a exclusão.
5. Verificar feedback e navegação clara para o painel.

## Cenário 3: Gestão Administrativa

1. Abrir `/gestao` como admin.
2. Entrar no CRUD de mesas.
3. Clicar no botão de exclusão de uma mesa.
4. Verificar confirmação inline associada à linha da mesa.
5. Cancelar e confirmar que nada muda.
6. Confirmar e verificar atualização da lista.

## Validação Técnica

```powershell
npm --prefix frontend run build
rg -n "confirm\\([^\\n]*(Deletar|deletar|Excluir|excluir)|prompt\\([^\\n]*(exclus|mesa)|alert\\([^\\n]*(exclu|mesa exclu)|handleDelete\\b|window\\.confirm" frontend/src/components/TableCardDashboard.tsx frontend/src/pages/PainelMestrePage.tsx frontend/src/pages/GestaoPage.tsx frontend/src/features/table/components/TableActionPanel.tsx frontend/src/features/table/utils/uiHelpers.ts
```

## Validação Funcional

Após merge/deploy em `dev`, testar em janela anônima no Beta (`https://mesasbeta.artificiorpg.com`).
