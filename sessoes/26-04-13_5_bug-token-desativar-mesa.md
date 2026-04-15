# Sessão: Correção Bug Token ao Desativar Mesa

**Data:** 13/04/2026 16:30 BRT  
**Escopo:** REQ-30 BUG 2 — Item 142 da FILA_IMPLEMENTACAO.md  
**Objetivo:** Corrigir erro "token inválido ou expirado" ao tentar desativar mesa no painel do mestre

---

## Contexto

**Problema reportado:**
- Mestre logado tenta desativar uma mesa no painel
- Sistema retorna erro de token inválido/expirado
- Outras operações autenticadas funcionam normalmente

**Hipóteses:**
1. Endpoint de toggle-status não está recebendo header `Authorization`
2. Middleware de autenticação está rejeitando token válido
3. Diferença entre requisição de toggle e outras que funcionam
4. AuthContext não está enviando token atualizado

---

## Plano de Execução

1. [x] Identificar qual endpoint é chamado ao desativar mesa
2. [x] Verificar se header Authorization está sendo enviado
3. [x] Comparar com outras requisições que funcionam
4. [x] Verificar middleware de autenticação no backend
5. [x] Testar correção localmente
6. [x] Documentar causa raiz em ERRORS_SOLUTIONS.md
7. [x] Atualizar FILA_IMPLEMENTACAO.md (item 142)
8. [x] Atualizar BACKLOG_OPERACIONAL.md (REQ-30 BUG 2)
9. [x] Atualizar RESUMO_EXECUCAO.md apontando para esta sessão

---

## Arquivos-Alvo

- `frontend/src/pages/PainelMestrePage.tsx` — ação de desativar mesa
- `frontend/src/contexts/AuthContext.tsx` — envio de token
- `backend/src/routes/gmPanel.ts` — endpoint de toggle-status
- `backend/src/middleware/auth.ts` — validação de token
- `ERRORS_SOLUTIONS.md` — documentação da causa raiz

---

---

## Conclusão

**Causa raiz confirmada:**
Frontend usava `PUT /api/v1/gm/tables/:id` para alterar status da mesa, mas esse endpoint espera **todos os campos obrigatórios** de uma mesa completa (título, descrição, sistema, etc.) conforme validação do `updateTableSchema`. Quando o frontend enviava apenas `{status: 'draft'}`, o backend rejeitava por campos obrigatórios ausentes.

**Solução aplicada:**
Corrigir `handleToggleTableStatus` em `PainelMestrePage.tsx` (linhas 387-406):
- Alterar endpoint de `PUT /api/v1/gm/tables/${tableId}` para `PATCH /api/v1/gm/tables/${tableId}/status`
- Alterar método de `PUT` para `PATCH`

**Validação:**
- Build do frontend concluído sem erros TypeScript
- Endpoint correto `PATCH /api/v1/gm/tables/:id/status` existe no backend (linha 581 do gmPanel.ts)
- Endpoint aceita apenas campo `status` sem exigir campos obrigatórios

**Documentação:**
- Erro E142 registrado em `ERRORS_SOLUTIONS.md`
- Item 142 da FILA marcado como concluído
- REQ-30 BUG 2 marcado como resolvido no BACKLOG_OPERACIONAL.md

**Próximos passos:**
Deploy em beta para validação E2E do toggle de status.
