# Sessão 11 — Correção de Bugs: Upload e Remoção de Avatar

**Data:** 17/04/2026 17:30 BRT  
**Objetivo:** Corrigir 3 bugs identificados no fluxo de upload e remoção de avatar no perfil geral.

## Vínculos
- **Sessão Anterior:** `26-04-17_10_pendencias-reformulacao-v4.md`
- **Próxima Sessão:** (a definir)

## Diagnóstico

### Bug 1: 405 Method Not Allowed ao enviar foto
**Erro:** `POST https://mesasbeta.artificiorpg.com/upload 405 (Method Not Allowed)`

**Causa raiz:**
- `ProfileEditPage.tsx` linhas 344 e 770 usam `${apiUrl}/upload`
- Deveria ser `${apiUrl}/api/v1/upload`
- Rota correta no backend: `/api/v1/upload` (registrada em `server.ts` linha 118)

**Arquivos afetados:**
- `frontend/src/pages/ProfileEditPage.tsx` (linhas 344 e 770)

### Bug 2: Erro ao remover foto de perfil
**Erro:** `Uncaught (in promise) Error: URL do avatar inválida`

**Causa raiz:**
- `profileSchemas.ts` linha 47: `.url('URL do avatar inválida')` valida antes de `.optional()` e `.nullable()`
- Quando usuário remove foto, valor vira string vazia `""`
- Zod valida `.url()` primeiro e falha com string vazia

**Arquivos afetados:**
- `frontend/src/schemas/profileSchemas.ts` (linhas 45-49)

### Bug 3: Analytics event
**Não é bug:** Apenas log de evento de analytics funcionando corretamente.

## Plano de Execução

1. Corrigir endpoint de upload no `ProfileEditPage.tsx` (2 ocorrências)
2. Corrigir validação de `avatar_url` no `profileSchemas.ts` para aceitar string vazia
3. Validar correções localmente
4. Atualizar documentação se necessário

## Checklist

- [x] Corrigir linha 344 do ProfileEditPage.tsx
- [x] Corrigir linha 770 do ProfileEditPage.tsx
- [x] Corrigir validação de avatar_url no profileSchemas.ts
- [ ] Testar upload de avatar
- [ ] Testar remoção de avatar
- [ ] Testar URL manual
- [ ] Atualizar RESUMO_EXECUCAO.md
- [ ] Atualizar index.md

## Arquivos que serão modificados
- `frontend/src/pages/ProfileEditPage.tsx`
- `frontend/src/schemas/profileSchemas.ts`

## Critério de Conclusão
- Upload de avatar funciona sem erro 405
- Remoção de avatar funciona sem erro de validação
- Testes manuais em beta confirmam correções
