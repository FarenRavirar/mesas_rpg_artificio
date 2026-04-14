# RESUMO_EXECUCAO.md

**Última atualização:** 14/04/2026 02:36 BRT

---

## Estado Atual do Projeto

**Ambiente Beta:** `mesasbeta.artificiorpg.com` — deploy automático por `dev`  
**Ambiente Produção:** `mesas.artificiorpg.com` — sem alteração de workflow nesta etapa  
**Branch ativa:** `dev`

**Estado técnico da habilitação local (`localhost`):**
- CORS do backend com allowlist dinâmica por `FRONTEND_URLS`.
- OAuth backend com validação de `frontend_redirect` por allowlist de origens.
- Cookie de sessão preparado para fluxo cross-origin com `COOKIE_SAME_SITE=none`.
- Frontend local enviando `frontend_redirect=window.location.origin` no início do login Google.
- Integração Cloudinary no formulário existente com `ImageUploader` + fallback visual mantido.
- Preload de banner no formulário de edição corrigido para contrato real do endpoint (`banner_url ?? image_url`).
- **Migration 18 aplicada em beta (14/04/2026):** removidos campos legados imgur (avatar_deletehash, avatar_imgur_id, banner_deletehash, banner_imgur_id, cover_deletehash, cover_imgur_id) + tabela/tipo legado.
- **Changelog adicionado:** nova experiência de upload de banner com Cloudinary.

**Gate de garantia real aplicado no alvo correto (`dev`/beta):**
- Workflow atualizado: `.github/workflows/deploy-beta.yml`
- Validação externa obrigatória pós-deploy:
  - `https://mesasbeta.artificiorpg.com` deve responder HTTP 200
  - `https://mesasbeta.artificiorpg.com/api/v1/health` deve conter `"status":"ok"`
- Se falhar, workflow tenta **1 recuperação automática** e falha o job se continuar ruim.

**Gate de garantia real aplicado no alvo correto (`dev`/beta):**
- Workflow atualizado: `.github/workflows/deploy-beta.yml`
- Validação externa obrigatória pós-deploy:
  - `https://mesasbeta.artificiorpg.com` deve responder HTTP 200
  - `https://mesasbeta.artificiorpg.com/api/v1/health` deve conter `"status":"ok"`
- Se falhar, workflow tenta **1 recuperação automática** e falha o job se continuar ruim.

---

## Próxima Ação

1. ~~Executar validação dos cenários A/B/C/D do `CLOUDINARY_INTEGRATION_GUIDE.md`~~ (executado manualmente pelo responsável)
2. Revalidar login local (`localhost:5173`) com sessão ativa em `GET /api/v1/me`.

---

## Última Sessão

**Data:** 14/04/2026 03:40 BRT  
**Tipo:** Resolução de bloqueadores de deploy  
**O que foi feito:** Aplicada `migration_18_drop_imgur_legacy.sql` no banco beta (campos imgur removidos de gm_profiles e tables, tabela/tipo legado removidos); adicionado changelog para nova experiência de upload; atualizado `CLOUDINARY_INTEGRATION_GUIDE.md` para refletir que campos legados foram removidos.  
**Status:** ✅ Concluído — 3/4 bloqueadores resolvidos (B1 executado manualmente).  
**Arquivo:** `sessoes/resumo_14-04_bloqueadores-deploy.md`

**Data:** 14/04/2026 03:15 BRT  
**Tipo:** Resolução de bloqueadores de deploy  
**O que foi feito:** Renomeada `migration_17_drop_imgur_legacy.sql` para `migration_18_drop_imgur_legacy.sql` (resolução de conflito de numeração); criada sessão de trabalho para resolver 4 bloqueadores (validação A/B/C/D em beta, changelog ausente, guia contraditório).  
**Status:** Em andamento — execução de validações em beta necessária.  
**Arquivo:** `sessoes/resumo_14-04_bloqueadores-deploy.md`

---

## Se der incidente e você precisar abrir novo chat

Abrir o novo chat já apontando estes arquivos, nesta ordem:
1. `RESUMO_EXECUCAO.md` (estado mais recente)
2. `.github/workflows/deploy-beta.yml` (gate ativo de deploy beta)
3. `OPERACAO_PRODUCAO.md` (§10.5 validação pós-deploy)
4. `ERRORS_SOLUTIONS.md` (buscar por `E144`, `E145`, `E146`, `E147`)
5. `sessoes/resumo_14-04_auditoria-docs-oauth-cloudinary.md` (linha de execução detalhada)