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
5. [ ] Após aprovação da spec, investigar fluxo de recebimento, persistência, reupload e exibição de imagens.
6. [ ] Mapear pontos duplicados de placeholder/banner nas telas afetadas.
7. [ ] Produzir achados, riscos, proposta de refatoração e próximos passos.

## O que vai fazer
- Criar uma spec SDD focada no problema de imagens e banners.
- Investigar depois da spec como links diretos entram no sistema, quando deveriam ser reenviados ao serviço de upload e onde a UI decide usar placeholder.
- Mapear duplicação de lógica de banner/placeholder para propor centralização semelhante ao trabalho dos badges DDAL/Covil do Lich.

## O que precisa ser feito
- Confirmar o escopo funcional na spec.
- Evitar alteração técnica antes da spec ativa.
- Preservar alterações locais já existentes e não relacionadas.

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
- Achado de investigação incorporado ao plano: perfil público do mestre (`GET /api/v1/gm/:slug`) seleciona `t.cover_url`, enquanto catálogo/detalhe usam `t.banner_url AS cover_url`; isso explica placeholder na página do mestre quando `cover_url` está nulo.
- Decisão de produto adicionada pelo mantenedor: para imagens de perfil, haverá opção explícita `Manter link direto`, com tooltip avisando que a imagem não será copiada para a hospedagem e pode deixar de aparecer se o link expirar.
- `/speckit.tasks` executado; tarefas geradas em `specs/006-imagens-banners-placeholder/tasks.md`.
- Implementação autorizada pelo mantenedor para executar cada frente do plano.
- Implementação em andamento: criado endpoint autenticado `POST /api/v1/upload/url`, com validação de URL pública, MIME e limite de 5 MB antes do envio ao Cloudinary.
- Implementação em andamento: `ImageUploader` importa links externos automaticamente ao sair do campo; `AvatarUploader` faz o mesmo, exceto quando `Manter link direto` está ativo.
- Implementação em andamento: `backend/src/routes/gm.ts` passou a retornar `t.banner_url AS cover_url` para mesas no perfil público do mestre.
- Implementação em andamento: `backend/src/routes/gmPanel.ts` passou a priorizar `banner_url` antes de `cover_url` no alias `image_url`.
- Implementação em andamento: fallback de banner centralizado em `frontend/src/utils/tableImage.ts` e aplicado em `TableCard`, `TableCardDashboard`, `MestreFeaturedTable` e `TableHero`.
- Changelog de 29/04/2026 criado em `database/changelogs.json` com linguagem leiga sobre imagens mais confiáveis e opção de link direto no perfil.
- Validação executada: `npm --prefix backend run build` passou.
- Validação executada: `npm --prefix backend test -- --runInBand` passou com 3 suites e 7 testes.
- Validação executada: `npm --prefix frontend run build` passou; Vite reportou apenas aviso de chunk acima de 500 kB.
- Validação executada: `git diff --check` passou; avisos observados foram apenas normalização LF/CRLF do Git no Windows.
- Busca final em `TableCard.tsx`, `TableCardDashboard.tsx`, `MestreFeaturedTable.tsx` e `TableHero.tsx` por `banner_placeholder|fallbackApplied` retornou zero resultados, confirmando centralização do fallback nas superfícies alvo.
- `.specify/memory/project-state.md` atualizado via procedimento equivalente a `/speckit.status`, registrando a feature ativa, implementação local e validações executadas.
- Esclarecimento do mantenedor: testes funcionais/manuais do projeto são realizados após deploy do branch `dev` para beta. Portanto, as validações acima são locais/automatizadas; validação real das telas afetadas permanece pendente até deploy beta.
- Governança permanente atualizada em `AGENTS.md`: validação funcional/manual só conta após deploy de `dev` no Beta; checks locais são pré-deploy e não substituem teste real.
- Bug encontrado em beta pelo mantenedor: ao inserir imagem com link direto no banner da mesa, a opção `Manter link direto` não aparece. Causa: a opção havia sido implementada em `AvatarUploader`, mas o banner da mesa usa `ImageUploader`.
- Correção aplicada localmente: `ImageUploader` agora exibe `Manter link direto` e respeita a flag antes de importar URL externa automaticamente.
- Validação local da correção: `npm --prefix frontend run build` passou; `git diff --check` passou com avisos apenas de LF/CRLF.

## Checklist de fechamento
- [ ] Executar `/speckit.retro.run`
- [ ] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
- [ ] Mover sessão para `encerradas/` (quando autorizado)
- [ ] Atualizar `sessoes/index.md`

## Arquivos que serão modificados
- `sessoes/26-04-29_1_imagens-banners-placeholder.md`
- `sessoes/index.md`
- `.specify/memory/project-state.md`
- `specs/006-imagens-banners-placeholder/spec.md`
- `specs/006-imagens-banners-placeholder/checklists/requirements.md`
- `.specify/feature.json`

## Critério de conclusão explícito
Investigação documentada com fluxo de recebimento/persistência/exibição de imagens, causa provável dos links expirados caindo em placeholder, pontos de duplicação de banner/placeholder mapeados e proposta de centralização pronta para planejamento.
