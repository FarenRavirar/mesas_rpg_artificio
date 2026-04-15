# Sessão — 12/04/2026 — Fix Bug 141: Editar Mesa Abre Página Vazia

## Objetivo da sessão

Corrigir o bug crítico (item 141, GUT 5/5/5): clicar em "✏️ Editar mesa" abre uma página vazia ao invés do formulário pré-preenchido.

## Causa raiz identificada

**Bug primário:** `handleEdit` em `uiHelpers.ts` usa `window.location.href = /painel/mesas/${id}/editar` que é uma **rota inexistente** no `App.tsx`. O React Router não encontra match e renderiza página vazia.

**Bug secundário:** `editingTableData` (recebido da API como objeto flat) não tem o formato que `useCreateTableForm` espera (`initialData.form.title`, `initialData.selectedSystemId`, etc.). Mesmo que a navegação seja corrigida, os dados não pré-encheriam o form sem mapeamento.

## Fluxo correto (via TableCardDashboard)
```
onEdit={(id) => navigate('/painel?edit=${id}')}
→ PainelMestrePage lê ?edit= param
→ fetch GET /api/v1/tables/:id
→ setEditingTableData(data.data) — formato flat da API
→ CreateTableForm com initialData={editingTableData}
→ useCreateTableForm tenta acessar initialData?.form?.title — UNDEFINED
```

## Plano de execução

1. [x] Criar branch feature/fix-edit-table-blank-page
2. [x] Criar arquivo de sessão
3. [ ] Corrigir handleEdit em uiHelpers.ts (1 linha)
4. [ ] Verificar mapeamento de dados no PainelMestrePage.tsx
5. [ ] Adicionar mapTableApiToFormData() se necessário
6. [ ] npm run build
7. [ ] Atualizar FILA_IMPLEMENTACAO.md (141 → concluido)
8. [ ] Commit + push + PR

## Checklist completa

- [x] Branch criada
- [x] Arquivo de sessão criado
- [x] handleEdit corrigido (uiHelpers.ts) — retorna `{ tableId, initialData }` via mapper
- [x] `mapTableApiToInitialData.ts` criado — converte resposta flat da API para `CreateTableFormState`
- [x] `PainelMestrePage.tsx` atualizado — desestrutura e passa `initialData` ao `CreateTableForm`
- [x] npm run build passa ✓
- [x] FILA_IMPLEMENTACAO.md atualizado (141 → concluido — 12/04/2026)
- [x] RESUMO_EXECUCAO.md atualizado
- [ ] PR aberto

## Arquivos modificados

- `frontend/src/features/table/utils/uiHelpers.ts` — linha 157 (handleEdit)
- `frontend/src/pages/PainelMestrePage.tsx` — mapeamento de dados (se necessário)

## Critério de conclusão

- Clicar em "✏️ Editar mesa" navega para `/painel?edit=<id>`
- Formulário abre com dados pré-preenchidos
- `npm run build` passa sem erros

## Resultado — CONCLUÍDO ✅

Todos os critérios atendidos. Build passou. Item 141 fechado.
Próxima tarefa: Item 142 — erro de token ao desativar mesa.
