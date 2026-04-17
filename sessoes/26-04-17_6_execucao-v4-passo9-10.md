# 26-04-17_6_execucao-v4-passo9-10.md

## Cabeçalho
- **Data:** 17/04/2026
- **Objetivo:** Executar os Passos 9 e 10 da V4 (`docs/Reformulacao_mestre_v4.md`): infraestrutura de Open Graph e formulário de edição de perfil do mestre no painel.

## Vínculos
- **Sessão anterior:** `26-04-17_5_execucao-v4-passo8.md`
- **Próxima sessão:** `26-04-17_7_*` (somente após conclusão integral e autorização)

## Plano de execução
1. Implementar rota de OG no backend (`backend/src/routes/og.ts`) e registrar no `server.ts`.
2. Ajustar `frontend/nginx.conf` para proxy condicional de crawler para `/og/*`.
3. Ajustar `docker-compose.beta.yml` e `docker-compose.prod.yml` com volume compartilhado do `index.html` buildado e variáveis de ambiente do OG.
4. Aplicar meta tags base no `frontend/index.html`.
5. Criar `EditGmProfileForm.tsx` e integrar no `PainelMestrePage.tsx`.
6. Validar TypeScript backend e frontend.
7. Atualizar documentação operacional (`RESUMO_EXECUCAO.md` e `sessoes/index.md`).

## Checklist
- [x] Ler Passos 9 e 10 no documento V4
- [x] Rota OG criada e registrada
- [x] Nginx com detecção de crawler aplicado
- [x] Compose beta/prod ajustados para volume compartilhado + env do OG
- [x] Meta tags base adicionadas em `frontend/index.html`
- [x] Formulário `EditGmProfileForm` implementado
- [x] Integração do formulário no `PainelMestrePage`
- [x] Validação TypeScript backend executada
- [x] Validação TypeScript frontend executada
- [x] Atualizar `RESUMO_EXECUCAO.md`
- [x] Atualizar `sessoes/index.md`

## Arquivos que serão modificados
- `backend/src/routes/og.ts` (novo)
- `backend/src/server.ts`
- `frontend/nginx.conf`
- `docker-compose.beta.yml`
- `docker-compose.prod.yml`
- `frontend/index.html`
- `frontend/src/pages/Painel/EditGmProfileForm.tsx` (novo)
- `frontend/src/pages/PainelMestrePage.tsx`
- `backend/src/routes/gmPanel.ts`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`

## Critério de conclusão explícito
- Rota `/og/mestre/:slug` servindo HTML com metadados OG via backend.
- Nginx com proxy condicional para crawler ativo sem quebrar fallback SPA.
- Backend acessando `index.html` via volume compartilhado no compose beta/prod.
- `frontend/index.html` com metadados base (title/description/OG/Twitter).
- Painel com botão/visão de edição de perfil e submit funcional para `PUT /api/v1/gm/profile`.
- Typecheck backend/frontend sem erros.
- Sessão, resumo e índice atualizados.

## Execução incremental

### Em andamento
- Passos 9 e 10 concluídos tecnicamente e validados com TypeScript.

### Pendências
- Atualizar `RESUMO_EXECUCAO.md`.
- Atualizar `sessoes/index.md`.
