# PR: Exclusão de Mesa Sem Pop-up

## Sumário executivo

Substitui a confirmação de exclusão de mesa baseada em pop-up por uma confirmação inline dentro da própria página. O fluxo agora exige uma primeira ação para abrir a confirmação e uma segunda ação explícita para excluir definitivamente, identificando a mesa afetada antes de chamar o endpoint.

## Mudanças por componente

- `frontend/src/components/InlineDeleteConfirmation.tsx`: novo componente compartilhado de confirmação inline.
- `frontend/src/components/TableCardDashboard.tsx`: card do painel passa a abrir confirmação inline antes de excluir.
- `frontend/src/pages/PainelMestrePage.tsx`: handler de exclusão deixa de usar `confirm` e só executa após confirmação inline.
- `frontend/src/pages/GestaoPage.tsx`: fluxo administrativo de exclusão de mesa também passa a usar confirmação inline.
- `frontend/src/features/table/components/TableActionPanel.tsx`: página/preview da mesa remove o handler antigo com `confirm`/`prompt`/`alert`.
- `frontend/src/features/table/utils/uiHelpers.ts`: removido o handler de exclusão por diálogos do navegador.
- `database/changelogs.json`: entrada de 29/04/2026 consolidada com a melhoria visível.

## Testing evidence

```powershell
rg -n "confirm\([^\n]*(Deletar|deletar|Excluir|excluir)|prompt\([^\n]*(exclus|mesa)|alert\([^\n]*(exclu|mesa exclu)|handleDelete\b|window\.confirm" frontend/src/components/TableCardDashboard.tsx frontend/src/pages/PainelMestrePage.tsx frontend/src/pages/GestaoPage.tsx frontend/src/features/table/components/TableActionPanel.tsx frontend/src/features/table/utils/uiHelpers.ts
```

Resultado: zero ocorrências.

```powershell
npm --prefix frontend run build
```

Resultado: build concluído com sucesso.

```powershell
Get-Content -LiteralPath database/changelogs.json -Raw | ConvertFrom-Json | Out-Null; Write-Output 'CHANGELOG_JSON_OK'
```

Resultado: `CHANGELOG_JSON_OK`.

## Checklist pós-merge

- Publicar/deployar o branch `dev` no Beta.
- Testar em janela anônima no Beta (`https://mesasbeta.artificiorpg.com`).
- Validar no painel do mestre: abrir confirmação, cancelar, reabrir e confirmar exclusão.
- Validar na página/preview da mesa: confirmação inline e navegação de sucesso.
- Validar em mobile que a confirmação não sobrepõe nem quebra ações vizinhas.
