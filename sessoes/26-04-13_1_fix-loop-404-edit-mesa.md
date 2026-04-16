# Sessão — 13/04/2026 — Fix Bug: Loop Infinito GET /api/v1/tables/{id} 404

## Objetivo da sessão

Corrigir loop infinito de requisições 404 ao abrir edição de mesa.

## Causa raiz identificada

**4 bugs no `PainelMestrePage.tsx`:**

1. **Rota errada:** `useEffect` faz `fetch('/api/v1/tables/${editId}')` (rota pública, espera slug) com UUID → 404
2. **Variável errada:** usa `${editId}` no segundo `useEffect` mas `editId` é variável local do PRIMEIRO useEffect (fora do escopo)
3. **Loop:** `useEffect([searchParams])` usa objeto como dependência — `searchParams` é nova referência a cada render
4. **`useMemo` com `setState`:** abuso de `useMemo` para efeito colateral (deve ser `useEffect`)

**Rota correta para busca por UUID:** `/api/v1/gm/tables/:tableId` (requer auth, confirma propriedade)

## Plano de execução

1. [x] Branch: `feature/fix-loop-404-edit-mesa`
2. [x] Arquivo de sessão criado
3. [x] Corrigir `PainelMestrePage.tsx` (4 bugs)
4. [x] `npm run build`
5. [x] Atualizar RESUMO_EXECUCAO.md
6. [x] Commit + push + PR

## Checklist

- [x] Branch criada
- [x] Arquivo de sessão criado
- [x] Bug 1 corrigido: rota → `/api/v1/gm/tables/${editingTableId}`
- [x] Bug 2 corrigido: variável `${editId}` → `${editingTableId}`
- [x] Bug 3 corrigido: `useEffect([searchParams])` → usar `editIdFromUrl` (string)
- [x] Bug 4 corrigido: `useMemo` com setState → `useEffect`
- [x] Bug 5 (bonus): `removeLink` corrigido (usava variáveis inexistentes)
- [x] Bug 6 (bonus): imports corrigidos (`useCallback`, `useSearchParams` de `react-router`)
- [x] npm run build passa ✓
- [x] RESUMO_EXECUCAO.md atualizado
- [x] Commit + push + PR

## Arquivos modificados

- `frontend/src/pages/PainelMestrePage.tsx` — useEffects e useMemo

## Critério de conclusão

- Abrir `/painel?edit=<UUID>` faz fetch para `/api/v1/gm/tables/<UUID>` → 200
- Sem loop de requisições
- `npm run build` passa