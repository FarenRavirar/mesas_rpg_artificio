# Sessão: Correção de Segurança Backend (Bloco 1)
**Data:** 07-04-2026  
**Objetivo:** Corrigir 6 problemas críticos de segurança e autorização no backend

---

## Status: ✅ Bloco 1 Concluído

### Problemas Corrigidos

#### 1. ✅ Falha de Ownership em `removeUserSystem`
**Arquivos:** `profileService.ts`, `profile.ts`  
**Problema:** Qualquer usuário autenticado podia remover `user_systems` de outro usuário  
**Correção:** Adicionado parâmetro `userId` e validação `WHERE user_id = ...` no DELETE

#### 2. ✅ Contrato de Auth Quebrado (`req.user.id` vs `req.user.userId`)
**Arquivos:** `discord.ts` (3 rotas), `vttPlatforms.ts`  
**Problema:** Rotas usavam `(req.user as any).id` mas middleware expõe `userId`  
**Correção:** Substituído por `req.user?.userId` + guards explícitos para TypeScript

#### 3. ✅ Admin Hardcoded no OAuth
**Arquivo:** `auth.ts`  
**Problema:** Email fixo `paulohenriquercc@gmail.com` virava admin automaticamente  
**Correção:** Removido verificação de email em criação e re-promoção de usuários

#### 4. ✅ OAuth Frágil (CSRF + Token na URL)
**Arquivo:** `auth.ts`  
**Problemas:**
- Google OAuth sem `state` → vulnerável a CSRF
- Token JWT na query string → vazamento por histórico/logs
- Discord com `state = userId` puro → sem assinatura

**Correções:**
- Google: `state` assinado com JWT (10min expiry)
- Token enviado via `postMessage` ao invés de URL
- Validação de `state` no callback

---

## Arquivos Modificados

```
backend/src/routes/auth.ts          → OAuth seguro + remoção admin hardcoded
backend/src/routes/profile.ts       → Ownership em removeUserSystem
backend/src/routes/discord.ts       → Contrato auth + guards TypeScript
backend/src/routes/vttPlatforms.ts  → Contrato auth
backend/src/services/profileService.ts → Ownership validation
```

---

## Próximos Blocos

### Bloco 2 — Remover Aggregator/Candidate
- [ ] `server.ts` — descomentar e remover imports
- [ ] `routes/aggregator.ts` — deletar arquivo
- [ ] `routes/aggregatorReview.ts` — deletar arquivo
- [ ] `db/aggregator.ts` — deletar arquivo
- [ ] `scripts/importDiscordExport.ts` — deletar arquivo

### Bloco 3 — Revisar Superfícies Públicas
- [ ] `routes/tables.ts` — métricas públicas (view, click, contact, favorite)
- [ ] `routes/gm.ts` — perfil público
- [ ] `routes/tableSchedules.ts` — agenda pública

### Bloco 4 — Apoio de Perfil e Links
- [ ] `routes/me.ts`
- [ ] `routes/links.ts`
- [ ] `services/linkService.ts`
- [ ] `routes/adminProfile.ts`

### Bloco 5 — Schema e Base
- [ ] `db/types.ts`
- [ ] `db/index.ts`
- [ ] `migrations/migration_06_rename_gm_bio.sql`

---

## Observações Técnicas

### Discord OAuth State
O Discord ainda usa `state = userId` puro (linha 31 de `discord.ts`). Isso deve ser corrigido em iteração futura com state assinado similar ao Google.

### Frontend Impact
A mudança de token via postMessage requer ajuste no frontend para escutar `message` events ao invés de ler query params.

### Compilação
Após merge, executar `npm run build` no backend para atualizar `dist/`.
