# Auditoria de Segurança Backend — 07/04/2026

## Objetivo
Correção cirúrgica de 6 problemas prioritários de segurança e integridade no backend, identificados em auditoria prévia.

---

## ✅ Bloco 1 — Correções Críticas de Autorização e Autenticação

### 1. Ownership em `removeUserSystem` (CRÍTICO)
**Problema:** Qualquer usuário autenticado podia remover `user_systems` de outro usuário.

**Arquivos corrigidos:**
- `src/services/profileService.ts` (linha 316-321)
- `src/routes/profile.ts` (linha 220)

**Correção:**
```typescript
// Antes: apagava só por id
deleteFrom('user_systems').where('id', '=', id)

// Depois: valida ownership
deleteFrom('user_systems')
  .where('id', '=', id)
  .where('user_id', '=', userId)
```

---

### 2. Contrato de Autenticação Quebrado (CRÍTICO)
**Problema:** Middleware tipa `req.user.userId`, mas rotas usavam `(req.user as any).id`, resultando em `undefined`.

**Arquivos corrigidos:**
- `src/routes/discord.ts` (linhas 12, 140, 166)
- `src/routes/vttPlatforms.ts` (linha 43)

**Correção:**
```typescript
// Antes
const userId = (req.user as any).id;

// Depois
const userId = req.user?.userId;
```

---

### 3. Admin Hardcoded (SEGURANÇA)
**Problema:** Email fixo no código promovia usuário para admin automaticamente.

**Arquivo corrigido:**
- `src/routes/auth.ts` (linhas 84-133)

**Correção:**
- Removida verificação `isMasterAdmin = userInfo.email === 'paulohenriquercc@gmail.com'`
- Todos os novos usuários começam como `'player'`
- Removida re-promoção automática em logins futuros

---

### 4. OAuth Frágil (SEGURANÇA)
**Problema:** Google OAuth sem state CSRF, token vazando por query string.

**Arquivo corrigido:**
- `src/routes/auth.ts` (linhas 22-188)

**Correção:**
- State assinado com JWT (expiração 10 minutos)
- Token enviado via `postMessage` em vez de query string
- Validação de state no callback

---

## ✅ Bloco 2 — Remoção Completa do Aggregator

**Arquivo corrigido:**
- `src/server.ts` (linhas 15-25)

**Ação:**
- Removidos imports comentados de `aggregator` e `aggregatorReview`
- Removidos `app.use` comentados
- Nenhuma referência textual restante

---

## ✅ Bloco 3 — Proteção Anti-Abuso de Métricas Públicas

### Problema
4 rotas públicas incrementavam métricas sem rate limit ou deduplicação:
- `POST /tables/:slug/view`
- `POST /tables/:id/click`
- `POST /tables/:id/contact`
- `POST /tables/:id/favorite`

### Solução Implementada

**1. Migration criada:**
- `src/db/migrations/migration_07_table_metric_events.sql`
- Tabela `table_metric_events` para registro de eventos
- Índices para deduplicação e limpeza

**2. Schema TypeScript atualizado:**
- `src/db/types.ts` (linhas 439, 461-475)
- Interface `TableMetricEventsTable`
- Type `TableMetricAction = 'view' | 'click' | 'contact' | 'favorite'`

**3. Helpers de anti-abuso:**
- `src/routes/gmPanel.ts` (linhas 5-69)
- `getClientIp()` — extrai IP considerando proxies
- `generateFingerprint()` — SHA256 de IP + User-Agent
- `shouldCountMetric()` — verifica janela de throttle

**4. Janelas de throttle:**
```typescript
view: 15 minutos
click: 5 minutos
contact: 30 minutos
favorite: 24 horas
```

**5. Fluxo de proteção (4 rotas):**
1. Valida que mesa existe
2. Gera fingerprint do cliente
3. Verifica se já existe evento recente na janela
4. Se duplicado → retorna 202 sem incrementar
5. Se novo → registra evento + incrementa métrica em transação

---

## Checklist de Deploy

```txt
[ ] 1. Executar migration_07_table_metric_events.sql no banco
[ ] 2. Compilar backend (npm run build)
[ ] 3. Testar chamadas repetidas nas 4 rotas de métricas
[ ] 4. Validar que segunda chamada dentro da janela retorna 202
[ ] 5. Validar que métricas não incrementam em duplicatas
```

---

## Arquivos Modificados

### Bloco 1 (Autorização/Autenticação)
- `src/routes/auth.ts`
- `src/routes/profile.ts`
- `src/routes/discord.ts`
- `src/routes/vttPlatforms.ts`
- `src/services/profileService.ts`

### Bloco 2 (Aggregator)
- `src/server.ts`

### Bloco 3 (Métricas)
- `src/routes/gmPanel.ts`
- `src/db/types.ts`
- `src/db/migrations/migration_07_table_metric_events.sql` (novo)

---

## Status Final

✅ **Todos os 6 problemas prioritários corrigidos**
✅ **Schema TypeScript atualizado**
✅ **Migration SQL criada**
⏳ **Aguardando deploy e validação em beta**
