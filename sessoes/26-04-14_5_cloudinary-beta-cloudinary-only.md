# Sessão 14-04 — Fechamento Cloudinary-only em beta

## Objetivo da sessão
Fechar a integração Cloudinary no fluxo de banner com injeção obrigatória de `VITE_CLOUDINARY_*` no build/deploy, remover legado operacional de Imgur no escopo afetado e executar validação A/B/C/D apenas no beta.

## Plano de execução
1. Ajustar build frontend e compose para injeção de variáveis Cloudinary.
2. Adicionar fail-fast nos workflows de deploy quando variáveis Cloudinary estiverem ausentes.
3. Remover referência operacional de `IMGUR_CLIENT_ID` onde conflita com fluxo Cloudinary de banner.
4. Executar validações técnica e funcional (A/B/C/D) no beta.
5. Atualizar documentação operacional e resumo de execução.

## Task list
- [x] Criar arquivo de sessão com plano e checklist
- [x] Ajustar `frontend/Dockerfile` para `VITE_CLOUDINARY_*`
- [x] Ajustar `docker-compose.beta.yml`
- [x] Ajustar `docker-compose.prod.yml`
- [x] Ajustar `.github/workflows/deploy-beta.yml` com fail-fast Cloudinary
- [x] Ajustar `.github/workflows/deploy-prod.yml` com fail-fast Cloudinary
- [x] Atualizar `OPERACAO_PRODUCAO.md` (Cloudinary-only no fluxo de banner)
- [x] Atualizar `FILA_IMPLEMENTACAO.md` (item 153)
- [x] Validar build frontend
- [ ] Validar cenários A/B/C/D no beta (ou registrar bloqueio objetivo)
- [x] Atualizar `implementation_plan.md.resolved` com progresso real
- [ ] Atualizar checklist final desta sessão
- [ ] Atualizar `RESUMO_EXECUCAO.md` apontando para esta sessão

## Arquivos-alvo
- `frontend/Dockerfile`
- `docker-compose.beta.yml`
- `docker-compose.prod.yml`
- `.github/workflows/deploy-beta.yml`
- `.github/workflows/deploy-prod.yml`
- `OPERACAO_PRODUCAO.md`
- `FILA_IMPLEMENTACAO.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/resumo_14-04_cloudinary-beta-cloudinary-only.md`
- `C:\Users\paulo\.gemini\antigravity\brain\20af951a-69fa-4815-9b12-452bfe85f2cd\implementation_plan.md.resolved`

## Critério de conclusão
- Build frontend com `VITE_CLOUDINARY_*` injetado por Dockerfile + compose.
- Workflow falha explicitamente quando `VITE_CLOUDINARY_*` ausentes.
- Nenhuma dependência operacional de `IMGUR_CLIENT_ID` no fluxo de banner em beta/prod.
- Cenários A/B/C/D validados em beta ou bloqueio registrado com evidência objetiva.
- `RESUMO_EXECUCAO.md` apontando para esta sessão.
