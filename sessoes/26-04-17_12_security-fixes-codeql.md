# Sessão 12 — Correções de Segurança: Alertas CodeQL

**Data:** 17/04/2026 17:52 BRT  
**Objetivo:** Corrigir todos os alertas de segurança identificados pelo GitHub Advanced Security (CodeQL) no PR #90.

## Vínculos
- **Sessão Anterior:** `26-04-17_11_fix-avatar-upload-bugs.md`
- **Próxima Sessão:** (a definir)

## Alertas Identificados (13 total)

### 1. Missing rate limiting (3 ocorrências) - RISCO MÉDIO
- `backend/src/routes/gm.ts` linha ~145: `GET /:slug` (perfil público)
- `backend/src/routes/gm.ts` linha ~350: `GET /:slug/insights` (insights protegidos)
- `backend/src/routes/profile.ts` linha ~413: `POST /me/google-picture`

### 2. Incomplete URL substring sanitization (6 ocorrências) - RISCO BAIXO
- `backend/src/routes/gm.ts` linha ~130: `googleusercontent.com` (avatar)
- `backend/src/routes/gm.ts` linha ~133: `googleusercontent.com` (banner)
- `backend/src/routes/og.ts` linha ~155: `googleusercontent.com` (OG image)
- `backend/src/services/linkService.ts` linha ~63: `whatsapp.com`
- `backend/src/services/linkService.ts` linha ~63: `api.whatsapp.com`

### 3. Use of externally-controlled format string (1 ocorrência) - RISCO BAIXO
- `backend/src/routes/og.ts` linha ~180: `console.error(\`[GET /og/${type}/:slug]\`, error)`

### 4. Insecure randomness (1 ocorrência) - RISCO BAIXO
- `frontend/src/pages/MestrePage.tsx` linha ~35: `Math.random()` fallback para sessionId

### 5. Missing await (1 ocorrência) - RISCO MÉDIO (Logic Error)
- `backend/src/services/linkService.ts`: Promise ignorado em `getUserLinks`

### 6. Missing environment variable validation (1 ocorrência) - RISCO ALTO
- `backend/src/routes/profile.ts` linha ~432: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` não validados

## Plano de Execução

1. Instalar `express-rate-limit`
2. Criar middleware de rate limiting
3. Aplicar rate limiting nas 3 rotas
4. Corrigir validação de URL (usar `new URL()` e verificar hostname)
5. Corrigir format string no log
6. Corrigir randomness inseguro
7. Adicionar await no update de links
8. Validar variáveis de ambiente do Google OAuth
9. Testar localmente
10. Deploy para dev

## Checklist

- [ ] Instalar express-rate-limit
- [ ] Criar middleware de rate limiting
- [ ] Aplicar rate limiting em gm.ts (2 rotas)
- [ ] Aplicar rate limiting em profile.ts (1 rota)
- [ ] Corrigir URL sanitization (6 lugares)
- [ ] Corrigir format string no log
- [ ] Corrigir insecure randomness
- [ ] Adicionar await em linkService
- [ ] Validar env vars do Google OAuth
- [ ] Testar correções
- [ ] Deploy para dev
- [ ] Atualizar RESUMO_EXECUCAO.md
- [ ] Atualizar index.md

## Arquivos que serão modificados
- `backend/package.json`
- `backend/src/middleware/rateLimit.ts` (novo)
- `backend/src/routes/gm.ts`
- `backend/src/routes/profile.ts`
- `backend/src/routes/og.ts`
- `backend/src/services/linkService.ts`
- `frontend/src/pages/MestrePage.tsx`

## Critério de Conclusão
- Todos os 13 alertas do CodeQL resolvidos
- Testes manuais confirmam funcionalidade
- Deploy para dev bem-sucedido
