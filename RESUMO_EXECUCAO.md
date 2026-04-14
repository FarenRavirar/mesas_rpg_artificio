# RESUMO_EXECUCAO.md

**Última atualização:** 14/04/2026 16:40 BRT

---

## Estado Atual do Projeto

**Ambiente Beta:** `mesasbeta.artificiorpg.com` — deploy automático por `dev`  
**Ambiente Produção:** `mesas.artificiorpg.com` — sem alteração de workflow nesta etapa  
**Branch ativa:** `dev`

**Implementação de Crop Visual (CSS) - CONCLUÍDA:**
- Crop é apenas visual via CSS `object-position`, não recorta a imagem no upload
- Imagem completa armazenada no Cloudinary (resize 1200x650)
- Coordenadas de crop salvas em `banner_crop_data` (JSONB)
- Usuário pode voltar e refazer o crop visual posteriormente
- Proporção do banner: 1200x650 (1.85:1 - widescreen)

**Upload de Avatar via Cloudinary - CONCLUÍDO:**
- Novo componente `AvatarUploader.tsx` com upload signed para Cloudinary
- Upload direto via backend (rota POST /api/v1/upload)
- Same state `gmAvatarUrl` usado no formulário de criação de mesa e perfil do mestre
- Suporta URL manual como fallback
- Limite de 2MB, formatos JPG/PNG/WEBP

**Implementado nesta sessão:**
- Backend: removido código de crop de cloudinary.ts e upload.ts
- Frontend: adicionado estado bannerCropData no useCreateTableForm e props no StepFinal
- Backend: criação de migration_101_add_banner_crop_data.sql (já aplicada no beta)
- Backend: adicionado campo banner_crop_data em types.ts, validators.ts e tableService.ts
- Backend: retornado cover_crop_data nas queries de tables.ts
- Frontend: adicionado coverCropData no TableViewModel e mapper
- Frontend: implementado CSS object-position no TableHero para display do crop
- Frontend: adicionado AvatarUploader.tsx para upload de foto de perfil via Cloudinary
- Frontend: adicionado gm_avatar_url no payload e validador do backend

---

## Próxima Ação

- Validar funcionamento do upload de avatar no beta: criar/editar mesa com foto de perfil via Cloudinary

---

## Última Sessão

**Data:** 14/04/2026 16:40 BRT  
**Tipo:** Implementação de upload de avatar via Cloudinary  
**O que foi feito:** Criado componente AvatarUploader.tsx para upload de foto de perfil via Cloudinary (mesma rota /api/v1/upload). Mesmo estado gmAvatarUrl usado no formulário de criação de mesa e no perfil do mestre. Adicionado gm_avatar_url no payload e validador do backend. Atualizada documentação (ARQUITETURA_PROJETO.md, RESUMO_EXECUCAO.md).

**Status:** ✅ Concluído

---

**Data:** 14/04/2026 15:50 BRT  
**Tipo:** Implementação de crop visual via CSS  
**O que foi feito:** Sistema de upload onde crop é apenas visual (CSS object-position), não recorta a imagem no backend. Imagem completa enviada ao Cloudinary, coordenadas salvas em banner_crop_data para display posterior. Criada migration 101, atualizados tipos e validators, implementado display no TableHero.  
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