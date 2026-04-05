# Sessão: Correção de Bugs Críticos E120 e E121

**Data:** 05/04/2026  
**Objetivo:** Corrigir 2 bugs críticos reportados no beta: JWT expirando em 15min e bulk delete falhando com 500

---

## Contexto

**Bugs reportados pelo usuário:**
1. Token JWT expira em 15 minutos forçando relogin frequente
2. Deleção em lote de candidatos falha com 500 (deleção individual funciona)

---

## Plano de Execução

### BUG 1: E120 - JWT expira em 15 minutos

- [x] **Diagnóstico:** `JWT_EXPIRES_IN=15m` hardcoded em `docker-compose.beta.yml` e `docker-compose.prod.yml` (linha 51)
- [x] **Solução:** Substituir por `JWT_EXPIRES_IN=${JWT_EXPIRES_IN}` para usar valor do `.env` (7d)
- [x] **Validação:** Build backend e frontend sem erros

### BUG 2: E121 - Bulk delete falha com 500

- [x] **Diagnóstico:** Linha 268 de `candidateService.ts` acessava `result[0]?.numDeletedRows` (array inexistente)
- [x] **Causa raiz:** Kysely retorna `DeleteResult.numDeletedRows` diretamente, não array
- [x] **Solução aplicada:**
  - Corrigir acesso: `result?.numDeletedRows` com `.executeTakeFirst()`
  - Adicionar validação UUID (regex) antes da query
  - Retornar objeto `{deleted, invalid}` ao invés de `number`
  - Atualizar rota para incluir campo `invalid` na resposta
  - Frontend trata 4 cenários de mensagem
- [x] **Validação:** Build backend e frontend sem erros

### Auditorias Realizadas

- [x] **Auditoria 1:** Backend/Arquitetura - Nenhum débito encontrado
- [x] **Auditoria 2:** Frontend/UX - Nenhum débito encontrado
- [x] **Auditoria 3:** Conflitos/Interações - Nenhum débito encontrado

### Documentação

- [x] **ERRORS_SOLUTIONS.md:** E120 e E121 adicionados
- [x] **RESUMO_EXECUCAO.md:** Estado atual e próxima ação atualizados
- [x] **TODO_OPERACIONAL.md:** Nenhuma alteração necessária
- [x] **FILA_IMPLEMENTACAO.md:** Nenhuma alteração necessária

---

## Arquivos Modificados

| Arquivo | Mudança | Linhas |
|---------|---------|--------|
| `backend/src/services/aggregator/candidateService.ts` | Validação UUID + retorno estruturado | +15 |
| `backend/src/routes/aggregatorReview.ts` | Resposta com campo `invalid` | +8 |
| `frontend/src/pages/GestaoPage.tsx` | Tratamento de IDs inválidos | +14 |
| `docker-compose.beta.yml` | `JWT_EXPIRES_IN=${JWT_EXPIRES_IN}` | 1 |
| `docker-compose.prod.yml` | `JWT_EXPIRES_IN=${JWT_EXPIRES_IN}` | 1 |

---

## Validações Concluídas

- ✅ Backend build sem erros TypeScript
- ✅ Frontend build sem erros TypeScript
- ✅ Lógica de validação UUID testada
- ✅ Tratamento de todos os cenários de UX
- ✅ Nenhum conflito com código existente

---

## Próximos Passos

1. Commit das correções (E120 + E121)
2. Push para `dev`
3. Deploy no beta com restart de containers
4. Validação pós-deploy:
   - Aguardar 20 minutos e verificar se sessão permanece ativa
   - Testar deleção em lote de 5+ candidatos

---

## Critério de Conclusão

✅ **Sessão concluída** - Todos os arquivos corrigidos, builds validados, documentação atualizada. Aguardando autorização para commit e deploy.
