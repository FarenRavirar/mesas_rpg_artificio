# 26-04-29_1_imagens-banners-placeholder.md

**Data:** 29/04/2026
**Objetivo:** Investigar como o sistema recebe, persiste e exibe imagens de mesas/mestres, com foco em links diretos que expiram e caem em placeholder. Planejar a centralização da lógica de banner/placeholder para página principal, catálogo, página do mestre e página da mesa.

## Vínculos
- **Sessão anterior:** `encerradas/26-04-26_2_atualizacao-readme-governanca.md`
- **Próxima sessão:** a definir

## Plano de execução
1. [x] Ler governança obrigatória inicial (`project-state.md`, `AGENTS.md`, `constitution.md`) e identificar sessão ativa.
2. [x] Fechar sessão anterior por autorização explícita do mantenedor.
3. [x] Abrir sessão dedicada para investigação de imagens/banners/placeholders.
4. [x] Executar `/speckit.specify` para registrar o escopo antes de leitura de código.
5. [x] Após aprovação da spec, investigar fluxo de recebimento, persistência, reupload e exibição de imagens.
6. [x] Mapear pontos duplicados de placeholder/banner nas telas afetadas.
7. [x] Produzir achados, riscos, proposta de refatoração e próximos passos.
8. [x] Implementar importação de URL externa para hospedagem durável e fallback centralizado de banners.
9. [x] Corrigir regressões encontradas em Beta no fluxo `Manter link direto`.
10. [x] Unificar o fluxo de edição de perfil do mestre para `/perfil?tab=mestre`.
11. [x] Enviar todos os arquivos aprovados para `dev` e acompanhar Deploy Beta.
12. [x] Aguardar teste funcional do mantenedor em janela anônima no Beta.

## O que vai fazer
- Fechar a sessão após confirmação de teste funcional do mantenedor em Beta.
- Atualizar `project-state.md`, `session-log.md`, `sessoes/index.md` e mover a sessão para `encerradas/`.
- Registrar o fechamento sem avançar para nova etapa técnica.

## O que precisa ser feito
- Executar fechamento documental desta sessão.
- Manter como pendência futura apenas promoção para produção se o mantenedor solicitar em outro momento.

## O que foi feito
- Sessão anterior localizada como ativa/incompleta.
- Governança inicial e documentos SDD obrigatórios lidos para esta frente.
- Sessão nova criada exclusivamente para imagens, banners e placeholders.
- Hook obrigatório `speckit.git.feature` executado; branch criada: `006-imagens-banners-placeholder`.
- `/speckit.specify` executado; spec criada em `specs/006-imagens-banners-placeholder/spec.md`.
- Checklist de qualidade criado em `specs/006-imagens-banners-placeholder/checklists/requirements.md` e marcado como aprovado.
- Spec aprovada pelo mantenedor em 29/04/2026.
- Início de `/speckit.plan`: gate obrigatório `speckit.memorylint.load-agents` satisfeito com `AGENTS.md` carregado para o planejamento.
- `/speckit.plan` executado: `plan.md`, `research.md`, `data-model.md`, `quickstart.md` e contratos iniciais criados.
- Achado de investigação incorporado ao plano: URL manual do banner é persistida diretamente em `tables.banner_url`, sem reupload automático.
- Achado de investigação incorporado ao plano: perfil público do mestre (`GET /api/v1/gm/:slug`) selecionava `t.cover_url`, enquanto catálogo/detalhe usam `t.banner_url AS cover_url`; isso explicava placeholder na página do mestre quando `cover_url` estava nulo.
- Decisão de produto adicionada pelo mantenedor: para imagens de perfil, haverá opção explícita `Manter link direto`, com tooltip avisando que a imagem não será copiada para a hospedagem e pode deixar de aparecer se o link expirar.
- `/speckit.tasks` executado; tarefas geradas em `specs/006-imagens-banners-placeholder/tasks.md`.
- Implementação autorizada pelo mantenedor para executar cada frente do plano.
- Endpoint autenticado `POST /api/v1/upload/url` criado, com validação de URL pública, MIME e limite de 5 MB antes do envio ao Cloudinary.
- `ImageUploader` passou a importar links externos automaticamente ao sair do campo e depois recebeu opção `Manter link direto` para o banner da mesa.
- `AvatarUploader` recebeu o controle `Manter link direto` para preservar URL manual quando essa exceção for explicitamente escolhida.
- `backend/src/routes/gm.ts` passou a retornar `t.banner_url AS cover_url` para mesas no perfil público do mestre.
- `backend/src/routes/gmPanel.ts` passou a priorizar `banner_url` antes de `cover_url` no alias `image_url`.
- Fallback de banner centralizado em `frontend/src/utils/tableImage.ts` e aplicado em `TableCard`, `TableCardDashboard`, `MestreFeaturedTable` e `TableHero`.
- Changelog de 29/04/2026 criado/consolidado em `database/changelogs.json` com linguagem leiga sobre imagens mais confiáveis, opção de link direto e estabilidade do perfil.
- Validação executada: `npm --prefix backend run build` passou.
- Validação executada: `npm --prefix backend test -- --runInBand` passou com 3 suites e 7 testes.
- Validação executada: `npm --prefix frontend run build` passou; Vite reportou apenas aviso de chunk acima de 500 kB.
- Validação executada: `git diff --check` passou; avisos observados foram apenas normalização LF/CRLF do Git no Windows.
- Busca final em `TableCard.tsx`, `TableCardDashboard.tsx`, `MestreFeaturedTable.tsx` e `TableHero.tsx` por `banner_placeholder|fallbackApplied` retornou zero resultados, confirmando centralização do fallback nas superfícies alvo.
- `.specify/memory/project-state.md` atualizado via procedimento equivalente a `/speckit.status`, registrando a feature ativa, implementação local e validações executadas.
- Esclarecimento do mantenedor: testes funcionais/manuais do projeto são realizados após deploy do branch `dev` para beta. Portanto, validações locais/automatizadas são pré-deploy e não substituem teste real das telas afetadas.
- Governança permanente atualizada em `AGENTS.md`: validação funcional/manual só conta após deploy de `dev` no Beta; checks locais são pré-deploy e não substituem teste real.
- Bug encontrado em Beta pelo mantenedor: ao inserir imagem com link direto no banner da mesa, a opção `Manter link direto` não aparecia. Causa identificada: a opção havia sido implementada em `AvatarUploader`, mas o banner da mesa usa `ImageUploader`.
- Correção aplicada: `ImageUploader` agora exibe `Manter link direto` e respeita a flag antes de importar URL externa automaticamente.
- Validação local da correção: `npm --prefix frontend run build` passou; `git diff --check` passou com avisos apenas de LF/CRLF.
- Bug persistente encontrado em Beta: no fluxo `profile_updated {section: 'general'}`, a tela usa inputs próprios em `ProfileEditPage.tsx`, não `AvatarUploader`.
- Correção aplicada: inputs de URL manual da aba Geral e da aba Mestre em `ProfileEditPage.tsx` agora exibem `Manter link direto`; quando desligado, importam a URL via `/api/v1/upload/url`; quando ligado, preservam o link direto.
- Correção arquitetural solicitada pelo mantenedor: unificar o fluxo de URL manual/importação/erro/flag em todos os uploads de imagem, em vez de replicar lógica por tela.
- Implementação aplicada: criado `frontend/src/hooks/useImageUrlImport.ts`; `ImageUploader`, `AvatarUploader` e `ProfileEditPage` passam a usar o mesmo fluxo canônico.
- Investigação adicional solicitada antes do commit: erro em `/painel` ao editar perfil do mestre com `selling_points` legado em formato não-array.
- Achado: `EditGmProfileForm.tsx` inicializava o estado com `(profile.selling_points ?? []).map(...)`; quando a API devolvia string/objeto legado, a tela quebrava antes de abrir o formulário.
- Correção aplicada: `EditGmProfileForm.tsx` passou temporariamente a normalizar `selling_points`, `languages`, `specialties` e `closed_group_systems` antes de chamar `.map`, tolerando JSON string legado, lista ou valor inválido.
- Correção aplicada: hooks de importação de imagem em `ProfileEditPage.tsx` foram movidos para antes dos retornos condicionais, e o campo manual de avatar do mestre passou a ser controlado para o importador ler a URL atual.
- Validação local após correções adicionais: `npm --prefix frontend run build` passou; `git diff --check` passou com avisos apenas de LF/CRLF.
- Documentação atualizada: `tasks.md` recebeu T032 para o crash do painel; `database/changelogs.json` consolidou a nota de estabilidade no objeto único de 29/04/2026.
- Commit criado e enviado para `origin/dev`: `8abeb81 fix(006): unifica importacao de imagens do perfil`.
- Deploy Beta executado pelo GitHub Actions: run `25113443831` concluída com sucesso, incluindo `validate`, `enforce-dir`, `lint`, `migrate`, `deploy-app` e `smoke`.
- Nova falha de fluxo apontada pelo mantenedor: o botão `Editar perfil` do painel abria uma tela própria (`EditGmProfileForm`) com campos e UX diferentes da aba padrão `Mestre` em `/perfil`.
- Decisão de correção: registrar diretiva permanente em `AGENTS.md` para normalização obrigatória de dados de fronteira antes de uso iterável e mudar o botão do painel para navegar diretamente para `/perfil?tab=mestre`, evitando duas telas concorrentes para o mesmo fluxo.
- Correção aplicada: `AGENTS.md` recebeu diretiva de normalização obrigatória para dados de fronteira antes de `.map`, `.filter`, `.reduce`, `.forEach`, spread de array, `.length` sem semântica validada ou acesso aninhado assumido.
- Correção aplicada: botão `Editar perfil` do painel e botão do perfil público do mestre agora navegam para `/perfil?tab=mestre`; `ProfileEditPage` sincroniza a aba ativa com o parâmetro `tab` da URL.
- Correção aplicada: removida a tela duplicada `frontend/src/pages/Painel/EditGmProfileForm.tsx`, eliminando a experiência divergente e o caminho que podia quebrar com `selling_points` legado.
- Correção aplicada: removido o editor inline legado de URL de avatar em `MasterActions`; ações de edição/troca de foto do dono agora levam ao fluxo canônico da aba Mestre.
- Validação local após unificação do destino de edição: `npm --prefix frontend run build` passou; `git diff --check` passou com avisos apenas de LF/CRLF.
- Busca de controle: `rg "EditGmProfileForm|edit-profile|masters/me/avatar|Cole a URL da imagem"` não encontrou fluxos legados; restaram apenas os controles canônicos de URL manual/`Manter link direto`.
- Solicitação do mantenedor: fazer o deploy dos arquivos que faltavam para `dev` para permitir teste funcional em Beta.
- Aprovação explícita recebida do mantenedor: incluir todos os arquivos pendentes para `dev`; todos estavam aprovados.
- Stage executado com todos os arquivos aprovados; conferência via `git diff --cached --stat` retornou 11 arquivos (incluindo remoção de `EditGmProfileForm.tsx` e adição de `specs/005-runtime-workflows/pr-description.md`).
- Commit executado em `dev`: `9258999` com mensagem `fix(006): unifica fluxo de edicao do perfil mestre`.
- Push executado: `origin/dev` atualizado de `8abeb81` para `9258999`.
- Deploy Beta acionado automaticamente pelo push: workflow `Deploy Beta`, run `25114445001`.
- Deploy Beta concluído com sucesso no run `25114445001`: jobs `validate`, `lint`, `enforce-dir`, `migrate`, `deploy-app` e `smoke` passaram; `headSha=9258999c9d066bf04b59e5b7807f3ab87764e286`.
- Investigação de atualização da sessão executada em 29/04/2026 11:30 BRT: `tasks.md` da feature 006 mostra T001-T027 e T029-T034 concluídas; T028 permanece pendente por depender do teste funcional do mantenedor em Beta.
- Investigação Git executada: `dev`, `origin/dev` e `HEAD` apontam para `9258999`; `git status --short` mostra apenas esta sessão modificada após o deploy.
- Teste funcional em Beta confirmado pelo mantenedor em 29/04/2026 11:32 BRT; T028 marcada como concluída em `specs/006-imagens-banners-placeholder/tasks.md`.

## Checklist de fechamento
- [x] Executar `/speckit.retro.run`
- [x] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
- [x] Mover sessão para `encerradas/` (quando autorizado)
- [x] Atualizar `sessoes/index.md`

## Arquivos modificados nesta sessão
- `AGENTS.md`
- `backend/src/routes/gm.ts`
- `backend/src/routes/gmPanel.ts`
- `backend/src/routes/upload.ts`
- `backend/src/services/cloudinary.ts`
- `database/changelogs.json`
- `frontend/src/components/AvatarUploader.tsx`
- `frontend/src/components/ImageUploader.tsx`
- `frontend/src/components/TableCard.tsx`
- `frontend/src/components/TableCardDashboard.tsx`
- `frontend/src/components/mestre/MestreFeaturedTable.tsx`
- `frontend/src/features/master/MasterProfilePage.tsx`
- `frontend/src/features/master/components/MasterActions.tsx`
- `frontend/src/features/table/components/TableHero.tsx`
- `frontend/src/hooks/useImageUrlImport.ts`
- `frontend/src/pages/Painel/EditGmProfileForm.tsx` (removido)
- `frontend/src/pages/PainelMestrePage.tsx`
- `frontend/src/pages/ProfileEditPage.tsx`
- `frontend/src/utils/tableImage.ts`
- `sessoes/26-04-29_1_imagens-banners-placeholder.md`
- `specs/005-runtime-workflows/pr-description.md`
- `specs/005-runtime-workflows/tasks.md`
- `specs/006-imagens-banners-placeholder/tasks.md`

## Critério de conclusão explícito
Sessão fechada após confirmação do teste funcional pelo mantenedor em janela anônima no Beta, T028 marcada como concluída, `project-state.md` atualizado, `session-log.md` atualizado, índice ajustado e sessão movida para `sessoes/encerradas/` por autorização explícita.
