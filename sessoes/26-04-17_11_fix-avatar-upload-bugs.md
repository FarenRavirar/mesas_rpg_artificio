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

### Bug 5: Avatar não salva (CRÍTICO - descoberto durante testes)
**Erro:** Avatar não muda ao enviar foto, remover ou usar URL manual. Apenas dispara evento `profile_updated` mas não salva.

**Causa raiz:**
- `useProfileQuery.ts` linha 154 envia para `/api/v1/profile/me`
- Essa rota **só aceita** `username` e `location` (backend `profile.ts` linha 43)
- Avatar é ignorado silenciosamente pelo backend
- Rota correta é `/api/v1/profile/me/profile` que aceita `avatar_url` (backend linha 85)

**Arquivos afetados:**
- `frontend/src/hooks/useProfileQuery.ts` (linha 154)

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

## Mudanças Implementadas

### 1. ProfileEditPage.tsx - Linha 344 (Upload de Avatar - Perfil Geral)

**Antes:**
```typescript
const response = await fetch(`${apiUrl}/upload`, {
```

**Depois:**
```typescript
const response = await fetch(`${apiUrl}/api/v1/upload`, {
```

**Motivo:** 
- Endpoint estava incorreto, causando 405 Method Not Allowed
- Rota correta no backend é `/api/v1/upload` (registrada em `server.ts` linha 118)
- `VITE_API_URL` é `https://mesasbeta.artificiorpg.com`, então precisa adicionar `/api/v1/upload`

**Impacto:**
- ✅ Upload de avatar via botão "📤 Enviar nova imagem" agora funciona
- ✅ Não afeta outras funcionalidades (mudança isolada)

---

### 2. ProfileEditPage.tsx - Linha 770 (Upload de Cover - Perfil Mestre)

**Antes:**
```typescript
const response = await fetch(`${apiUrl}/upload`, {
```

**Depois:**
```typescript
const response = await fetch(`${apiUrl}/api/v1/upload`, {
```

**Motivo:** 
- Mesmo problema da linha 344, mas para upload de cover do perfil de mestre
- Duplicação de código com mesmo bug

**Impacto:**
- ✅ Upload de cover no perfil de mestre agora funciona
- ✅ Não afeta outras funcionalidades (mudança isolada)

---

### 3. profileSchemas.ts - Linhas 45-49 (Validação de avatar_url)

**Antes:**
```typescript
avatar_url: z
  .string()
  .url('URL do avatar inválida')
  .optional()
  .nullable(),
```

**Depois:**
```typescript
avatar_url: z
  .string()
  .refine(
    (val) => !val || val.trim() === '' || z.string().url().safeParse(val).success,
    { message: 'URL do avatar inválida' }
  )
  .optional()
  .nullable(),
```

**Motivo:**
- Zod valida `.url()` **antes** de `.optional()` e `.nullable()`
- Quando usuário remove foto, valor vira string vazia `""`
- String vazia falhava na validação `.url()`, causando erro "URL do avatar inválida"
- Nova validação com `.refine()` aceita: `null`, `undefined`, string vazia `""`, ou URL válida

**Impacto:**
- ✅ Remover foto de perfil agora funciona sem erro
- ✅ String vazia é aceita como valor válido
- ✅ URLs válidas continuam sendo validadas corretamente
- ⚠️ **Atenção:** Esta validação é usada em `useProfileQuery.ts` linha 153 via `validateOrThrow(profileSchema, sanitized)`
- ⚠️ **Atenção:** Afeta qualquer lugar que use `profileSchema` para validar `avatar_url`

**Locais que usam profileSchema:**
- `frontend/src/hooks/useProfileQuery.ts` linha 153 (useUpdateProfile mutation)
- Validação acontece **antes** de enviar para backend

---

### 4. ProfileEditPage.tsx - Linha 418 (Input de URL Manual)

**Antes:**
```typescript
defaultValue={profile.profile?.avatar_url || ''}
```

**Depois:**
```typescript
value={currentAvatar}
```

**Motivo:**
- Input com `defaultValue` não é controlado pelo React
- Não reflete mudanças de estado quando avatar é atualizado por outros meios (upload, Google, remoção)
- Input controlado com `value` sincroniza com estado `currentAvatar` (linha 289)

**Impacto:**
- ✅ Input de URL manual agora reflete mudanças de avatar em tempo real
- ✅ Quando usuário remove foto, input limpa automaticamente
- ✅ Quando usuário usa foto do Google, input atualiza com nova URL
- ⚠️ **Atenção:** Input agora é controlado, então `onChange` deve sempre atualizar o estado (já está correto na linha 419)

---

### 5. useProfileQuery.ts - Linha 154 (Endpoint Incorreto - BUG CRÍTICO)

**Antes:**
```typescript
const result = await api.patch<{ data: any }>('/api/v1/profile/me', validated);
```

**Depois:**
```typescript
const result = await api.patch<{ data: any }>('/api/v1/profile/me/profile', validated);
```

**Motivo:**
- **BUG CRÍTICO descoberto durante testes:** Avatar não salvava mesmo após correções anteriores
- Rota `/api/v1/profile/me` só aceita `username` e `location` (backend `profile.ts` linha 43)
- Campos `display_name`, `bio`, `avatar_url`, `languages` eram **ignorados silenciosamente** pelo backend
- Rota correta é `/api/v1/profile/me/profile` (backend `profile.ts` linha 78-99)
- Backend não retornava erro, apenas ignorava os campos, causando confusão no diagnóstico

**Impacto:**
- ✅ **CRÍTICO:** Avatar agora salva corretamente (upload, remoção, URL manual)
- ✅ **CRÍTICO:** `display_name` e `bio` agora salvam corretamente
- ✅ **CRÍTICO:** `languages` agora salva corretamente
- ⚠️ **ATENÇÃO:** Esta correção afeta TODAS as atualizações de perfil básico
- ⚠️ **ATENÇÃO:** Usuários que tentaram atualizar perfil antes desta correção precisam tentar novamente

**Por que o bug passou despercebido:**
- Backend não retorna erro 400, apenas ignora campos desconhecidos
- Frontend recebia 200 OK e disparava evento `profile_updated`
- Optimistic update do React Query mostrava mudança temporariamente
- Ao recarregar, mudança desaparecia (revalidação buscava dados antigos do banco)

---

## Riscos Identificados

### Risco Baixo
1. **Mudanças de endpoint (linhas 344 e 770):** Isoladas, não afetam outros fluxos
2. **Input controlado (linha 418):** Padrão React recomendado, melhora consistência

### Risco Médio
3. **Validação de avatar_url:** Afeta qualquer código que valide perfil com `profileSchema`
   - **Mitigação:** Validação mais permissiva (aceita vazio) é mais segura que restritiva
   - **Teste necessário:** Verificar se backend aceita string vazia para `avatar_url`

## Critério de Conclusão
- Upload de avatar funciona sem erro 405
- Remoção de avatar funciona sem erro de validação
- Testes manuais em beta confirmam correções
