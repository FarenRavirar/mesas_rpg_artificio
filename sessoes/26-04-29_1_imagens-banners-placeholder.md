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
- Bug persistente encontrado em beta: no fluxo `profile_updated {section: 'general'}`, a tela usa inputs próprios em `ProfileEditPage.tsx`, não `AvatarUploader`.
- Correção aplicada localmente: inputs de URL manual da aba Geral e da aba Mestre em `ProfileEditPage.tsx` agora exibem `Manter link direto`; quando desligado, importam a URL via `/api/v1/upload/url`; quando ligado, preservam o link direto.
- Correção arquitetural solicitada pelo mantenedor: unificar o fluxo de URL manual/importação/erro/flag em todos os uploads de imagem, em vez de replicar lógica por tela.
- Implementação local: criado `frontend/src/hooks/useImageUrlImport.ts`; `ImageUploader`, `AvatarUploader` e `ProfileEditPage` passam a usar o mesmo fluxo canônico.
- Investigação adicional solicitada antes do commit: erro em `/painel` ao editar perfil do mestre com `selling_points` legado em formato não-array.
- Achado: `EditGmProfileForm.tsx` inicializava o estado com `(profile.selling_points ?? []).map(...)`; quando a API devolve string/objeto legado, a tela quebra antes de abrir o formulário.
- Ajuste em andamento: normalizar `selling_points` defensivamente no formulário de edição e corrigir hooks de importação de imagem em `ProfileEditPage.tsx` para não ficarem condicionais.
- Correção aplicada localmente: `EditGmProfileForm.tsx` agora normaliza `selling_points`, `languages`, `specialties` e `closed_group_systems` antes de chamar `.map`, tolerando JSON string legado, lista ou valor inválido.
- Correção aplicada localmente: hooks de importação de imagem em `ProfileEditPage.tsx` foram movidos para antes dos retornos condicionais, e o campo manual de avatar do mestre passou a ser controlado para o importador ler a URL atual.
- Validação local após correções adicionais: `npm --prefix frontend run build` passou; `git diff --check` passou com avisos apenas de LF/CRLF.
- Documentação atualizada: `tasks.md` recebeu a tarefa T032 para o crash do painel; `database/changelogs.json` consolidou a nota de estabilidade no objeto único de 29/04/2026.
- Commit criado e enviado para `origin/dev`: `8abeb81 fix(006): unifica importacao de imagens do perfil`.
- Deploy Beta executado pelo GitHub Actions: run `25113443831` concluída com sucesso, incluindo `validate`, `enforce-dir`, `lint`, `migrate`, `deploy-app` e `smoke`.
- Nova falha de fluxo apontada pelo mantenedor: o botão `Editar perfil` do painel abre uma tela própria (`EditGmProfileForm`) com campos e UX diferentes da aba padrão `Mestre` em `/perfil`.
- Decisão de correção: registrar diretiva permanente em `AGENTS.md` para normalização obrigatória de dados de fronteira antes de uso iterável e mudar o botão do painel para navegar diretamente para `/perfil?tab=mestre`, evitando duas telas concorrentes para o mesmo fluxo.
- Correção aplicada localmente: `AGENTS.md` recebeu diretiva de normalização obrigatória para dados de fronteira antes de `.map`, `.filter`, `.reduce`, `.forEach`, spread de array, `.length` sem semântica validada ou acesso aninhado assumido.
- Correção aplicada localmente: botão `Editar perfil` do painel e botão do perfil público do mestre agora navegam para `/perfil?tab=mestre`; `ProfileEditPage` sincroniza a aba ativa com o parâmetro `tab` da URL.
- Correção aplicada localmente: removida a tela duplicada `frontend/src/pages/Painel/EditGmProfileForm.tsx`, eliminando a experiência divergente e o caminho que podia quebrar com `selling_points` legado.
- Correção aplicada localmente: removido o editor inline legado de URL de avatar em `MasterActions`; ações de edição/troca de foto do dono agora levam ao fluxo canônico da aba Mestre.
- Validação local após unificação do destino de edição: `npm --prefix frontend run build` passou; `git diff --check` passou com avisos apenas de LF/CRLF.
- Busca de controle: `rg "EditGmProfileForm|edit-profile|masters/me/avatar|Cole a URL da imagem"` não encontrou fluxos legados; restaram apenas os controles canônicos de URL manual/`Manter link direto`.
- Solicitação atual do mantenedor: fazer o deploy dos arquivos que faltam para `dev` para permitir teste funcional em Beta.
- Próxima ação operacional: verificar estado local, identificar arquivos pendentes, preparar envio controlado para `dev` e acompanhar deploy Beta até evidência de conclusão.
- Aprovação explícita recebida do mantenedor: incluir todos os arquivos pendentes para `dev`; todos estão aprovados.
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
