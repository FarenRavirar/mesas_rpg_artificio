# Project State — Mesas RPG Artifício

**Última atualização:** 2026-06-01T21:20:00-03:00
**Atualizado por:** sessão 26-06-01_2_resolucao-sugestoes-sistemas (spec 018 reformulação local do drawer aguardando deploy)
---

## Ambientes

| Ambiente | URL | Branch | Pasta | Status |
|---|---|---|---|---|
| Beta | `mesasbeta.artificiorpg.com` | `dev` | `/opt/mesas-beta/` | ✅ Ativo (deploy automático) |
| Produção | `mesas.artificiorpg.com` | `main` | `/opt/mesas/` | ✅ Ativo (gate de migration) |

---

## Estado Técnico Atual

**Spec 018 — Resolução de Sugestões de Sistemas (01/06/2026, em Beta):**
- Implementada e deployada em Beta. Commits `2ddb399` (feature) + `722f596` (fix migration online-safe) + `def29f2` (clareza de contexto no drawer) + `156cd4f` (base existente + edição recomenda `create_child`) em `origin/dev`.
- Backend: helper puro `systemSuggestionCandidates.ts` (normalizador + score, TDD 20/20), `GET /admin/system-suggestions/:id/candidates`, `POST /admin/system-suggestions/:id/resolve` (create_system com guard NFR-001/`force`, create_child com hierarquia e `parent_aliases` opcional/idempotente, create_alias idempotente, merge_existing, reject), relink de drafts Discord. Normalizador local reconhece base + edição/complemento sem dicionario hardcoded de sistemas; remove apenas sufixos estruturais conservadores (`RPG`/`TTRPG` e frase `Roleplaying Game`), preservando `Game` isolado como parte de titulo; traducao/sinonimo exige `name_pt` ou alias catalogado (ex.: `O Um Anel 2e` so casa automaticamente se `O Um Anel` estiver no catalogo como alias/nome PT). Drawer permite resolver manualmente e gravar alias de pai junto do filho; aguardando commit/deploy. `slugify`/`VALID_PARENT` exportados de `systems.ts`.
- DB: migration 123 adiciona colunas de auditoria em `system_suggestions` (`resolution_type` + CHECK, `resolved_system_id`, `created_system_id`, `created_alias_id`, `resolution_notes`, `resolution_payload`, `resolved_at`). **Online-safe sem DROP** (constraint via `IF NOT EXISTS`). Decisões: colunas em `system_suggestions`; status `approved`+`resolution_type`; alias idempotente; lote só rejeita.
- Frontend: ação primária **Resolver** (sistemas) com `SystemSuggestionResolutionDrawer` (candidatos com score/razões, forms por tipo, prévia, tratamento 409 SIMILAR_EXISTS). Drawer agora exibe nome canônico, path, tipo, nome PT, aliases e filhos/edições/variantes/subsistemas existentes em candidatos, seleção de alvo/pai, merge, alias e risco de sistema novo. Cenários mantêm Aprovar/Rejeitar.
- **Deploy Beta run `26788551455` GREEN** para `156cd4f` (validate, lint, enforce-dir, migrate, smoke-discord, deploy-app com etapa `Deploy App Containers`, smoke). CodeQL run `26788550756` GREEN. Deploy anterior de contexto visual: run `26787673936` GREEN. Deploy anterior da base 018: run `26778999597` GREEN. Run `26778729349` falhou no migrate (123 marcada online-safe com `DROP CONSTRAINT`); corrigido.
- Evidência E166 (SELECT no Beta pós-deploy): 7 colunas de auditoria presentes, constraint presente, `system_suggestions` = 37 (pending=33, approved=2, rejected=2). Health Beta root 200 / `/api/v1/health` ok+connected.
- **Pendente:** mantenedor validar em janela anônima resolvendo amostra real (alias/edição/mescla/sistema novo). T026 (teste unitário do drawer) opcional não adicionado.

**Sessão ativa atual (01/06/2026):** `sessoes/26-06-01_1_diagnostico-criacao-mesa-sistemas.md` — diagnóstico de cinco itens no fluxo Nova Mesa/sugestões/horários; fatias A-C implementadas localmente (contraste do editor, modais de sugestão fora do form pai, admin cria sistema direto, gestão lista sistemas + cenários). Fatia D (`dia/horário a definir`) classificada como SDD Completo por impacto em contrato/API/DB de `table_schedules`.

**Regra operacional reforçada (01/06/2026):** validação funcional de UI/fluxos reais não usa Browser plugin como evidência conclusiva; só conta após deploy em `dev`/Beta e análise do mantenedor em janela anônima. Ferramentas locais de browser/screenshot podem apoiar diagnóstico, mas não substituem o gate humano em Beta.

**Regra de aprovação reforçada (01/06/2026):** aprovação vale por ação, não por sessão. "Pode prosseguir"/"faça o deploy" autoriza só o bloco apresentado; não se estende a commits/pushes/correções seguintes (ex.: re-push após migration falhar, ou commit de docs/sessão pós-deploy). Pedir aprovação de novo a cada `git commit`/`git push`. Detalhe em `AGENTS.md` §"Aprovacao Obrigatoria" e `docs/agents/context-capsule.md`.

**Planejamento pronto para proximo chat:** `specs/018-resolucao-sugestoes-sistemas/` criado para resolver sugestoes de sistemas sem redundancia (alias, edicao, variante, subsistema, mescla ou sistema novo). Classificacao: SDD Completo por envolver possivel migration, API admin, permissao e catalogo canonico. Handoff: `specs/018-resolucao-sugestoes-sistemas/handoff.md`.

**Branch ativa:** `feat/015-discord-draft-pipeline` — spec 017 entregue no Beta sobre o pipeline Discord: parser refinado, extração de imagem, upload Cloudinary no sync/retry e UI de revisão de capas/vagas/frequência.
**Último commit em `origin/dev`:** `7a9647e` — `fix(discord): bloqueia sync com frequencia outra`

**Feature ativa de remediação:** `specs/017-parser-refinements-imagens/` (refinamento pós-Fase 1 do spec 016).
**Sessão ativa:** `sessoes/26-05-12_1_parser-refinements-imagens.md`.
**Sessão de diagnóstico (encerrável):** `sessoes/26-05-09_1_discord-pipeline-diagnostico.md`.

**Erros canônicos novos:** `E166` (evidência GREEN fabricada — regra anti-recorrência exige `SELECT` no banco-alvo após qualquer write em pipeline de import).

**Spec 017 — Parser refinements + imagens (11/05/2026):**
- Fases A-F implementadas e publicadas em `origin/dev` / Beta.
- Parser: `Vagas: X/Y` gera ambiguidade revisável, `Vagas: 0` é valor explícito, one-shots não inferem `frequency='semanal'`, `host_discord_id` captura `<@user>` de Mestre/GM/Narrador/DM, sistemas com parênteses/versão não contaminam `raw_system_hint`.
- Imagens: `cover_url_source` e `cover_quality` extraídos de attachments; SVG/mídia não imagem descartados; migration 122 adicionou status auditável de upload; sync/retry passa imagem do Discord por Cloudinary antes de preencher `tables.cover_url`/`banner_url`.
- Operação Beta Fase E: 5 legacies `content_raw=discord_thread_name` marcados `ignored`, 184 mensagens reparseadas com sucesso.
- Evidência E166 pós re-parse final no Beta:
  - `A_slots_total_missing=2` (limite ≤10), `A_oneshot_semanal=0`, `B_hint_parentese=0`.
  - `C_com_imagem=184,C_com_source=184` (100% dos posts com imagem).
  - `D_discord_cdn_tables=0`, `E_legacy_parsed=0`.
  - Drafts: `ready=124`, `needs_review=60`; mensagens: `parsed=184`, `ignored=10`.
- Frontend: painel de revisão mostra thumbnail 40x40, preview de capa, upload/remover capa, badge de baixa qualidade, widget de desambiguação `X/Y`, e select de frequência com proteção para `outra` não sincronizar.
- Deploys finais GREEN: `25680850486` (Deploy Beta) e `25680848361` (CodeQL) para `7a9647e`. Smokes externos root e `/api/v1/health` HTTP 200.
- Pendência operacional: mantenedor validar visualmente a Fase F em janela anônima no Beta (`mesasbeta.artificiorpg.com`), conforme T-F1-F-06.

**Reset estrutural do pipeline Discord (09/05/2026):**
- Diagnóstico via `SELECT` no Beta revelou 170/180 mensagens com `content_raw` vazio, 169/180 `embeds` gravados como objeto vazio, 2 drafts `ready` em drift.
- Spec 016 entregue (`spec.md`, `plan.md`, `tasks.md`, `research-llm.md`, `research-template.md`).
- BUG-004 catalogado e corrigido em `backend/src/discord/ingestMessages.ts` (helper `asJsonbArray` com `sql<unknown[]>` e cast `::jsonb`). Anteriormente `persistMessages` enviava arrays JS para colunas JSONB; pg convertia para literal de array Postgres `'{a,b,c}'` (inválido para JSONB).
- Deploy Beta run `25629337251` GREEN. Health Beta HTTP 200.
- T-EXEC-1 (reingestão sem janela) GREEN nos dois fóruns:
  - `📖┃campanhas`: 111 mensagens, 109 com body (98,2%), 109 drafts criados, 2 ignored, 0 falhas.
  - `🎯┃one-shots`: 83 mensagens, 80 com body (96,4%), 80 drafts criados, 3 ignored, 0 falhas.
- **Snapshot de invariantes (09/05 13:09 UTC, via `SELECT` literal):**
  - `discord_import_messages` = 194 (parsed=189, ignored=5)
  - `discord_import_table_drafts` = 189 (ready=111, needs_review=78)
  - `ready_dirty (status=ready AND missing≠[])` = **0** ← invariante OK
  - `embeds typeof = array` para 194/194 mensagens
- **Decisão LLM (T-RES-1):** 9router (https://github.com/decolua/9router) na VM Oracle, primários `gpt-5.4` e `gemini-3.1-pro-preview`. Detalhes em `specs/016-discord-pipeline-rebuild/research-llm.md`.
- **Decisão template Discord (T-RES-2):** Forum Guidelines + bot validador. Detalhes em `specs/016-discord-pipeline-rebuild/research-template.md`. Negociação com admin do Covil ainda pendente.
- **Status:** Fase 0 (reset/backfill) **DONE**. **Fase 1 (limpeza de invariantes) DONE em 2026-05-11.** Fase 2 (backfill auditável + telemetria) **READY**.

**Fase 1 — Limpeza de invariantes (11/05/2026):**
- Migration 118 criada com `CHECK CONSTRAINT discord_drafts_ready_requires_no_missing` (idempotente via `DO $$` + `pg_constraint`); padrão documentado como L03 em `migrations_guide.md`.
- Guard `PATCH /admin/discord-sync/drafts/:id` retorna 422 com `details.missing_fields` quando status='ready' é incoerente com `missing_fields≠[]` (`backend/src/discord/draftValidation.ts` + 7 casos Jest GREEN).
- Parser `parseDiscordAnnouncement` retorna `null` quando body e embeds estão ambos sem texto, mesmo para starters de fórum (`isThreadStarter` removida; 3 testes atualizados).
- Frontend: `DiscordDraftReviewTable` e `DiscordDraftPreview` mostram "Pronto" apenas quando `status='ready' AND missing_fields=[]`; drafts em drift exibem "Revisar" com pendências em destaque âmbar; `readyCount` do botão "Sincronizar todos prontos (N)" reflete contagem real.
- CI: workflow reusável `.github/workflows/_smoke-discord.yml` invocado entre `migrate` e `deploy-app` no Deploy Beta — anti-regressão BUG-004 (INSERT JSONB roundtrip em transação ROLLBACK) + presença da constraint (E166).
- Deploy Beta run `25674367757` GREEN em todos os jobs (`enforce-dir`, `lint`, `validate`, `migrate`, `smoke-discord`, `deploy-app`, `smoke`).
- **Evidência GREEN no banco-alvo (E166), 2026-05-11 13:50–13:54 UTC:**
  - `UPDATE drift` em transação ROLLBACK rejeitado com `23514 check_violation discord_drafts_ready_requires_no_missing` (mesmo draft `db3d7c89` que aceitou drift no RED de 2026-05-10).
  - `ready_dirty=0` / 189 drafts (`ready=111`, `needs_review=78`).
  - Constraint presente em `pg_constraint` (`contype='c'`).
  - `with_body=189/194` (97,4%); `embeds=array` em 194/194 (anti-regressão BUG-004 estável).
  - HTTP Beta root: 200; `/api/v1/health`: 200.
- **Commits Fase 1 em `origin/dev`:** `4f2bcee`, `f70f5d2`, `bc86070`, `41fa8bd`, `9f7861c`, `9c2c0a1`, `bc8a9f0`.

**Decisões já fechadas (não perguntar de novo):**
- Escopo α + β + γ + δ + ε
- Drafts antigos descartados, não corrigidos in-place
- Reingestão sem janela autorizada (e executada)
- Branch `feat/015-discord-draft-pipeline` mantida
- LLM via 9router, modelos primários definidos

**Decisões abertas (registradas em `sessoes/26-05-09_2_*` §"Decisões abertas"):**
- Lista canônica de cenários (antes da Fase 3)
- Limiar `θ` de confidence_field (antes da Fase 4, default proposto 0.7)
- Quem provisiona o 9router (antes da Fase 5.δ)
- Limite mensal de custo LLM
- Canal de comunicação com admin do Covil do Lich (antes da Fase 5.ε)

**BUG-003 — Fórum importado vira draft publicável (05–06/05/2026):**
- Reportado pelo mantenedor: o lançamento não resolveu o objetivo principal porque mensagens vindas do Discord não estavam virando drafts de mesa publicáveis.
- Diagnóstico Beta read-only: 2 fontes `forum`, 182 mensagens importadas, 1 draft; todas as 182 mensagens com `status='error'` e `parse_error='Erro no parse em lote'`; 171 mensagens eram starters de thread e `content_raw` estava vazio nos registros amostrados.
- `/speckit.bugfix.report` e `/speckit.bugfix.patch` executados proceduralmente: `BUG-003.md` criado e `spec.md`, `plan.md`, `tasks.md`, `MAPA_DE_API.md` atualizados.
- Teste RED criado antes do patch em `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts`; RED observado com 2 falhas reais de semântica.
- Implementação local: parser prioriza conteúdo estruturado, usa `discord_thread_name` para starters vazios, ignora replies vazios, normalizador classifica `ready`/`needs_review`, rotas salvam JSONB como objeto e deduplicam drafts pelo UUID interno da mensagem.
- `syncDiscordDraftToTable` agora cria/atualiza `tables.status='draft'`, preservando revisão/publicação manual.
- Dry-run dos últimos 7 dias nos dois fóruns Beta: 12 mensagens/threads avaliadas; 11 drafts gerados como `needs_review`, 1 reply vazio ignorado, 0 `ready`; evidência confirmou ausência real de descrição, vagas, contato, dia/horário e alguns sistemas.
- Gate adicional aplicado antes de qualquer deploy: backend bloqueia sync se o draft não estiver `ready` ou se faltar título, descrição, sistema, tipo, modalidade, preço, vagas, contato, dia ou horário.
- Frontend: `DiscordDraftPreview` agora possui editor estruturado de campos, seletor real de sistemas via `/api/v1/systems?view=tree`, validação local e botão de sync desabilitado enquanto o draft estiver incompleto.
- Validação técnica: `npm --prefix backend test -- parseDiscordAnnouncement` GREEN (3/3); `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; `git diff --check` sem erros; busca final sem fallback "Mesa Sem Título" ou sync de `needs_review` no escopo alterado.
- Reidratacao Beta apos ativacao do Message Content Intent: 11 starters reais de forum com corpo completo; 1 reply com PDF marcada `ignored` por nao ser post.
- Parser corrigido: prioriza `Sistema:` do corpo sobre titulo/cenario da thread; sistema explicito inedito fica `needs_review` e cria `system_suggestion`; nomes como Forgotten Realms, Waterdeep, Vecna e Planescape nao viram sugestoes de sistema quando o corpo informa outro sistema.
- Gestao de sugestoes: rejeicao sem motivo permitida; checkboxes por sugestao, selecao de todas pendentes e descarte em lote adicionados.
- Evidencia atual: `npm --prefix backend test -- parseDiscordAnnouncement` GREEN (8/8); `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; changelog JSON validado; `git diff --check` sem erros.
- **Status:** aguardando commit/push autorizado para `dev`, Deploy Beta e teste funcional em janela anonima.

**Correção UX — Menus de seleção unificados (04/05/2026):**
- Retomada solicitada pelo mantenedor após identificação visual de dropdown com fundo/opções inconsistentes no Discord Sync.
- Estilo canônico do select "Selecione um servidor" consolidado como `.app-select` em `frontend/src/index.css`.
- Fallback global adicionado para `select option` e `select optgroup`, reduzindo risco de novos menus abrirem com contraste incorreto.
- Todos os `<select>` atuais em `frontend/src` foram atualizados para usar `.app-select`, incluindo Discord Sync, catálogo, perfil, cadastro de mesa, sugestão/árvore de sistemas, filtros de atividade admin e inspector admin.
- `database/changelogs.json` recebeu entrada de 04/05/2026 para a mudança visível.
- Validação técnica: `npm --prefix frontend run build` GREEN; busca final por `<select>` sem `.app-select` retornou zero resultados; validação do changelog sem IDs/datas duplicadas e sem termos bloqueados.
- **Status:** implementação local pronta para revisão/teste em dev; commit/push/deploy Beta dependem de autorização explícita.

**BUG-001 — Triagem e janela de tempo no Discord Sync (04/05/2026):**
- Reportado pelo mantenedor após deploy Beta: backend importou mensagens, mas a aba Mensagens não permitia visualizar conteúdo completo, apurar, editar status ou organizar próximos passos.
- Escopo ajustado pelo mantenedor: a janela de tempo deve existir para qualquer fonte Discord, não apenas fóruns.
- `specs/015-discord-forum-threads/bugs/BUG-001.md` criado e artefatos `spec.md`, `plan.md`, `tasks.md` e contratos atualizados.
- Backend: `POST /admin/discord-sync/fetch` aceita `since`/`until`; ingestão filtra mensagens fora da janela; `PATCH /admin/discord-sync/messages/:id` atualiza status de triagem.
- Frontend: aba Fontes permite escolher janela (`24h`, `7d`, `30d`, `90d`, `sem limite`) antes de buscar; aba Mensagens permite selecionar mensagem, ler conteúdo completo, abrir no Discord e alterar status.
- Validação técnica: `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN.
- **Commit/deploy:** commit `8825e2d` enviado para `origin/dev`; Deploy Beta run `25333281806` GREEN em 2026-05-04.
- **Deploy Beta:** jobs `validate`, `enforce-dir`, `lint`, `migrate`, `deploy-app` e `smoke` passaram.
- **CodeQL dev:** run `25333281042` GREEN.
- **Health Beta:** `https://mesasbeta.artificiorpg.com/` retornou HTTP 200 e `/api/v1/health` retornou `status=ok`, `environment=beta`, `db=connected`.
- **Status:** disponível em Beta para teste funcional do mantenedor em janela anônima.

**BUG-002 — Apuração visível e operável (04/05/2026):**
- Reportado pelo mantenedor após testar o BUG-001 em Beta: o botão "Apurar" apenas selecionava a linha; em viewport desktop comum o painel de detalhe ficava abaixo da lista e parecia não existir.
- `specs/015-discord-forum-threads/bugs/BUG-002.md` criado e `tasks.md` recebeu T034.
- Frontend atualizado: aba Mensagens agora seleciona automaticamente o primeiro item, usa layout mestre/detalhe em `lg`, mantém painel de apuração visível/sticky, adiciona contadores de fila e ações rápidas de status.
- Mensagens sem `content_raw` exibem fallback com nome do post/thread para evitar linhas vazias.
- Validação técnica: `npm --prefix frontend run build` GREEN.
- **Status:** pronto para commit/push/deploy Beta.

**Feature 015 — Importação de Posts de Fóruns Discord (04/05/2026):**
- Sessão `26-05-04_1_discord-forum-threads` aberta a partir do prompt 015.
- Branch `feat/015-discord-forum-threads` criada a partir de `origin/dev`, já contendo a PR #144.
- `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` e `/speckit.implement` executados proceduralmente para `specs/015-discord-forum-threads/`.
- Pesquisa oficial Discord incorporada: canais de fórum (`GUILD_FORUM`, tipo 15) são importados por posts/threads; `GUILD_MEDIA` ficou fora do escopo inicial por estar em desenvolvimento ativo na documentação.
- Migration 117 criada: adiciona `channel_type` em `discord_import_sources` e metadados `discord_parent_channel_id`, `discord_thread_id`, `discord_thread_name` em `discord_import_messages`.
- Backend implementado: discovery inclui fóruns, fontes persistem tipo do canal, fetch diferencia canal textual/anúncio vs fórum, ingestão de fórum lista threads ativas e públicas arquivadas e busca mensagens por thread com timeout manual via `AbortController`.
- Frontend implementado: seleção e cadastro de fórum, badges de tipo de fonte, feedback de varredura de posts e exibição de metadados da thread em mensagens importadas.
- Documentação: `MAPA_DE_API.md`, contratos, data-model, quickstart e `pr-description.md` atualizados.
- Validação técnica: `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; busca final sem `AbortSignal.timeout`; busca de segurança sem logs de token.
- **PR:** #145 — https://github.com/FarenRavirar/mesas_rpg_artificio/pull/145
- **Checks PR #145:** GREEN em 2026-05-04T08:10:08-03:00 (`build-backend`, `build-frontend`, CodeQL actions/javascript-typescript/python).
- **Autorização:** mantenedor solicitou em 2026-05-04T08:48:45-03:00 atualizar documentações e realizar o próximo passo para testar em `dev`.
- **Merge:** PR #145 mergeada em `dev` em 2026-05-04T08:51:12-03:00; merge commit `13655dd`.
- **Deploy Beta:** GREEN no run `25317356143` em 2026-05-04; jobs `lint`, `validate`, `enforce-dir`, `migrate`, `deploy-app` e `smoke` passaram.
- **CodeQL dev:** GREEN no run `25317355526`.
- **Health Beta:** `https://mesasbeta.artificiorpg.com/api/v1/health` retornou HTTP 200.
- **Status:** disponível em Beta para teste funcional do mantenedor em janela anônima com fórum real.

**Feature 012 — Pipeline Discord Covil Sync (03/05/2026):**
- T001–T017 implementados e mergeados via PR #141.
- Migration 115 aplicada em Beta: `discord_import_sources`, `discord_import_messages`, `discord_import_table_drafts`.
- Painel "Discord Sync" disponível em `/gestao` (admin only).
- Correções pós-revisão: N+1 queries, hash incompleto, cursor não persistido, SQL injection em filtros, URL sanitization, deduplicação de contatos, tipo de retorno frontend.
- `backend/dist/` rastreado pelo git; `/.claire` adicionado ao `.gitignore`.
- Branches limpas: apenas `dev` e `main` locais e remotas.
- **Status:** mergeado e deployado em Beta. Bloqueado para teste por falta de `DISCORD_BOT_TOKEN` no Beta.

**Feature 013 — Discord Settings Config:**
- Spec, plan, research, data-model, contracts, quickstart, tasks e pr-description criados.
- Migration 116 criada: `discord_settings` com `guild_id` (NULL=global), `key`, `value` cifrado, constraint por guild e índice único parcial para registro global.
- Backend implementado: AES-256-GCM via `node:crypto`, chave derivada de `JWT_SECRET`, rotas GET/PUT/DELETE de settings e fallback DB → `process.env.DISCORD_BOT_TOKEN` na ingestão.
- Frontend implementado: `DiscordSettingsPanel` como primeira aba em `DiscordSyncPanel`, salvar token, status mascarado e remoção com confirmação inline.
- Validação técnica: `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN.
- PR #142 mergeado em `dev` e Deploy Beta verde.
- Validação funcional inicial em Beta: token salvo pelo painel e status mascarado exibido (`Bot configurado`).
- **Status:** concluída em `dev`; desbloqueou configuração do bot sem SSH.

**Feature 014 — Descoberta de Canais Discord (03/05/2026):**
- Sessão 013 retomada a pedido do mantenedor para eliminar cadastro manual rígido de `guild_id`/`channel_id`.
- Branch `feat/014-discord-channel-discovery` criada a partir de `dev`.
- `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` e `/speckit.implement` executados proceduralmente para `specs/014-discord-channel-discovery/`.
- Backend implementado: cliente REST Discord em `backend/src/discord/discovery.ts`, rotas admin `GET /discovery/guilds` e `GET /discovery/guilds/:guildId/channels`, filtro de canais textuais/anúncios e erros acionáveis sem expor token.
- Frontend implementado: aba Fontes agora descobre servidores/canais pelo bot, cadastra fonte por seleção e mantém modo manual como opção avançada.
- Documentação: `MAPA_DE_API.md` atualizado e `pr-description.md` criado.
- Validação técnica: `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; busca final sem logs de token.
- **Status:** implementação local concluída; aguardando autorização explícita para commit/push/PR.

**Feature 010 — Refatoração do Changelog (03/05/2026):**
- Sessão nova aberta a pedido explícito do mantenedor, sem branch dedicada; trabalho direto em `dev`.
- Sessões `26-05-03_1_verificacao-sugestoes-sistemas-admin.md` e `26-05-01_1_editor-rico-textareas.md` encerradas e movidas para `sessoes/encerradas/`.
- `.specify/feature.json` e `AGENTS.md` atualizados para apontar `specs/010-refatoracao-changelog`.
- Spec tratado como hipótese: inventário real de `database/changelogs.json` encontrou 11 entradas totais/publicadas e zero datas duplicadas.
- `specs/010-refatoracao-changelog/changelog-inventory.md` criado com decisões por entrada, grupos por data e evidências.
- `database/changelogs.json` revisado editorialmente em 4 entradas (03/05, 29/04, 18/04 e 08/04), sem remover ou despublicar histórico.
- `tasks.md` atualizado: referências de sessão antiga corrigidas e T001-T021 concluídas.
- Validação: JSON válido; busca final sem `sidebar vertical`, `migration`, `refactor`, `placeholder`, `performance`, `otimizados`, `Q1`, `Q4`, `administrativa`, `arvore administrativa`, `admin`; zero datas publicadas duplicadas.
- **Status:** Spec 010 executado localmente; pronto para revisão/commit quando solicitado.

**Feature 011 — Verificação de Sugestões e Notificações Admin (03/05/2026):**
- Sessão nova aberta a pedido explícito do mantenedor, sem branch dedicada; trabalho direto em `dev`.
- `.specify/feature.json` e `AGENTS.md` atualizados para apontar `specs/011-verificacao-sugestoes-sistemas-admin`.
- Decisão de produto incorporada: toda sugestão criada por usuário deve gerar notificação para administradores.
- Implementação aplicada:
  - `backend/src/routes/systemSuggestions.ts`: sugestões de sistemas criam notificação admin na mesma transação.
  - `backend/src/routes/scenarioSuggestions.ts`: sugestões de cenários criam notificação admin na mesma transação.
  - `backend/src/routes/vttPlatforms.ts`: sugestões de plataformas VTT criam notificação admin na mesma transação.
  - `frontend/src/components/SystemSuggestionModal.tsx`: confirmação de envio após sucesso real do POST.
- Documentação atualizada: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/README.md`, `tasks.md`, `flow-map.md` e `database/changelogs.json`.
- Validação técnica: `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN.
- **Status:** pronto para commit e deploy em `dev`; validação funcional em Beta após deploy.

**Feature 009 — Editor Rico em Textareas (01/05/2026):**
- Sessão `26-05-01_1_editor-rico-textareas` aberta a pedido explícito do mantenedor.
- Sem branch dedicada — autorizado pelo mantenedor; trabalho direto em `dev`.
- `/speckit.specify` executado: `spec.md` validado (checklist 15/15 itens ✅); `.specify/feature.json` atualizado para `specs/009-editor-rico-textareas`.
- `/speckit.plan` executado com pesquisa real do código: `MarkdownEditor` (react-markdown-editor-lite v1.4.2) confirmado como editor canônico pelo mantenedor; 10 `<textarea>` nus e 5 campos com `RichTextArea` inventariados; `research.md` e `plan.md` atualizados.
- `/speckit.tasks` executado: `tasks.md` regenerado com 22 tasks, caminhos reais, sessão correta; `AGENTS.md` aponta plano ativo para feature 009.
- **Status:** Spec kit concluído; aguardando comando do mantenedor para iniciar `/speckit.implement`.

**Feature 008 — Catálogo e Painel UX Bugs (29/04/2026):**
- Sessão dedicada aberta a pedido explícito do mantenedor.
- Branch `feat/008-catalogo-painel-ux-bugs` criada pelo fluxo equivalente ao hook obrigatório `speckit.git.feature`.
- `/speckit.specify` retomado para `specs/008-catalogo-painel-ux-bugs/` sem sobrescrever artefatos existentes.
- `spec.md` e `checklists/requirements.md` validados: sem placeholders de template, sem marcadores `[NEEDS CLARIFICATION]` ativos e sem itens abertos no checklist.
- `.specify/feature.json` atualizado para apontar a feature 008.
- Artefatos existentes detectados: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md` e `contracts/README.md`.
- `/speckit.plan` executado após autorização do mantenedor, tratando a spec como hipótese e validando escopo contra o código.
- Código consultado para planejamento: catálogo público, drawer/chips/cards, gestão de sistemas e seletor de sistemas compartilhado com painel.
- Achado técnico incorporado: `SystemTreeSelector` afeta catálogo e painel; o bloco de variantes em `singleSelect` deve ser tratado como risco/bug do escopo 008.
- Artefatos de planejamento atualizados: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/README.md`; `AGENTS.md` aponta o plano ativo para a feature 008.
- `/speckit.tasks` executado após aprovação do mantenedor: `tasks.md` regenerado com 30 tarefas, caminhos reais, sessão atual e fases independentes por user story.
- Validação de tarefas: 30/30 tarefas seguem formato obrigatório; zero referências à sessão antiga `26-04-29_2`; zero placeholders de template ou `NEEDS CLARIFICATION`.
- Implementação aplicada e publicada no Beta:
  - Rebase interrompido em `dev` corrigido após conflito em `TableCard.tsx` e `CatalogoPage.tsx`.
  - Commit local preservado/reaplicado sobre `origin/dev` como `8fc37ed fix: refina cards e badges do catalogo`.
  - `git push origin dev` concluído com sucesso.
  - Deploy Beta `25124747594` concluído com sucesso para `8fc37ed`: lint, enforce-dir, validate, migrate, deploy-app e smoke passaram.
  - Topo/filtros do catálogo aprovados pelo mantenedor; cards ajustados para evitar título, vagas e preço comprimidos.
- **Status:** Feature 008 publicada em Beta; aguardando teste funcional manual do mantenedor em janela anônima no Beta.

**Feature 007 — Exclusão de Mesa Sem Pop-up (29/04/2026):**
- `/speckit.plan` concluído para `specs/007-exclusao-mesa-sem-popup/` com `plan.md`, `research.md`, `data-model.md`, `quickstart.md` e contrato de confirmação inline.
- `/speckit.tasks` concluído: `tasks.md` finalizado com 20/20 tarefas concluídas após BUG-001.
- `/speckit.implement` aplicado:
  - `InlineDeleteConfirmation` criado para confirmação integrada à página.
  - Painel do mestre, página/preview da mesa e gestão administrativa usam confirmação inline antes do `DELETE`.
  - Handler antigo de exclusão com `confirm`/`prompt`/`alert` removido.
  - Changelog de 29/04/2026 consolidado com a melhoria visível.
- BUG-001 pós-deploy Beta corrigido:
  - Causa raiz: página/preview da mesa habilitava gestão para `owner || admin`, mas `TableActionPanel` chamava sempre `DELETE /api/v1/gm/tables/:id`.
  - Correção: `TableActionPanel` agora recebe `deleteEndpointScope` e usa `DELETE /api/v1/admin/tables/:id` quando a ação vem de admin.
- Validação técnica e Beta:
  - Busca direcionada por pop-ups de exclusão de mesa retornou zero ocorrências.
  - `npm --prefix frontend run build` concluído com sucesso.
  - `database/changelogs.json` validado como JSON válido.
  - Deploy Beta `25121700376` concluído com sucesso em `dev`.
  - Pós-deploy: frontend `200`, `/api/v1/health` conectado, `/api/v1/tables?limit=1` `200`.
- **Status:** Feature 007 concluída em Beta; aguardando apenas teste funcional manual em janela anônima pelo mantenedor.

**Progresso da feature 003 (24/04/2026 00:15 BRT):**
- `/speckit.specify` concluído: `spec.md` gerado com FR-001..FR-012 e SC-001..SC-005
- `/speckit.plan` concluído: artefatos de planejamento completos
  - `plan.md` (92 linhas) — contexto técnico, gates constitucionais, estrutura de escopo
  - `research.md` (44 linhas) — 6 decisões técnicas com justificativas
  - `data-model.md` (131 linhas) — 5 entidades, relacionamentos e transições de estado
  - `quickstart.md` (63 linhas) — procedimento operacional incremental
  - `contracts/workflow-audit.openapi.yaml` (321 linhas) — contrato OpenAPI completo
- `/speckit.tasks` concluído: `tasks.md` gerado com 45 tasks (7 fases, 15 parallelizáveis)
- **Phase 1 (Setup) concluída:** Branch criada, estrutura de auditoria preparada, baseline documentado
- **Phase 2 (Inventário Canônico) concluída:** 9 workflows inventariados (T004-T013)
  - 8 inventários individuais criados (ci, deploy-beta, deploy-prod, promote-to-prod, preflight-prod, docker-cleanup, sync-arquitetura, reusable)
  - Inventário consolidado com dependency map e 7 findings críticos
  - Cobertura 100% de FR-001, FR-002 e SC-001
- **Phase 3 (Diagnóstico por Severidade) concluída:** 7 findings classificados (T014-T020)
  - 5 findings individuais criados (deploy-overlap, beta-concurrency, silent-failures, prod-race, reusable-contract-risk)
  - Findings consolidados: 1 CRITICAL, 4 HIGH, 2 MEDIUM
  - Todos os findings críticos/altos têm ações de regularização definidas
  - Cobertura 100% de FR-003, FR-004, FR-005, FR-006 e SC-002
- **Phase 4 (Planejamento de Regularização) concluída:** 5 ações planejadas (T021-T027)
  - 5 planos de ação criados (prod-separation, beta-concurrency, failure-propagation, boundaries, reusable versioning)
  - Plano consolidado com rollback explícito para todas as ações
  - Validação confirmada: nenhum workflow será removido
  - Cobertura 100% de FR-007, FR-008 e FR-009
  - Decisões do usuário incorporadas: concurrency (cancelar obsoletos), break-glass (safeguards), rollback (snapshot 60s/90s), versioning (aprovado)
- **Phase 5 (Aplicação de Correções) concluída:** 7 tasks executadas com rollback validado (T028-T034)
  - Validação T034 atestou sucesso do processo de Rollback Automático após falha de Nginx no Beta
- Validação de qualidade: 0 placeholders de template, 0 marcadores `NEEDS CLARIFICATION`
- Inventário técnico atualizado: 8 workflows canônicos em `.github/workflows/` (2 reutilizáveis + 6 operacionais)
- **Phase 6 (Validação Off-Happy-Path) concluída:** 7 tasks executadas e isolamentos comprovados (T035-T041)
  - Evidências consolidadas documentando `failure` bloqueante em shellcheck, migrations gate e preflight
  - Prova de isolamento entre deploys de Beta vs Produção via modelo opt-in (`workflow_dispatch`)
- **Phase 7 (Finalização e Fechamento) concluída:** Relatório final (`audit-report.md`) e `pr-description.md` gerados. Tarefas T042-T045 concluídas.
- **Investigação forense da promoção concluída:** causa da falha `fatal: ambiguous argument 'v1.2.3'` confirmada no run `24867211797` (job `release`, step `Montar resumo executivo`).
- **Patch mínimo aplicado em produção pipeline:** `.github/workflows/promote-to-prod.yml` atualizado para usar `TARGET_REF` com fallback em `origin/main` quando `${VERSION}` não existe como revisão Git no runner.
- **Validação local pós-patch:** sintaxe YAML do workflow validada (`YAML_PARSE_OK`) e cálculo de range validado sem erro de revisão ambígua.

**Progresso Bugfix-UX (Covil e Placeholders + BUG-003 price_type):**
- `/speckit.bugfix.report` concluído para BUG-003 em `.specify/features/bug-ux-covil/bugs/BUG-003.md`.
- `/speckit.bugfix.patch` concluído com atualização de `plan.md` e `tasks.md` (T004/T005/T006).
- Implementação aplicada em `frontend/src/features/create-table/utils/mapper.ts` com normalização `free/paid` -> `gratuita/paga`.
- `/speckit.bugfix.verify` concluído com consistência entre artefatos e código alterado.
- **Validação global em beta concluída:**
  - Infra VM: `mesas-beta-api`, `mesas-beta-frontend`, `mesas-beta-db` saudáveis.
  - DB enum: `price_type` contém `gratuita`, `paga`.
  - Runtime endpoint: `POST /api/v1/gm/tables` com `price_type="gratuita"` retornou `HTTP 201`, criando `id=98f9e6f1-97db-4b86-93aa-6de6471140fc`.
- **Status atual:** Bugfix validado em dev/beta.
- **Próxima ação:** executar retro/status de fechamento da sessão e manter monitoramento pós-correção no painel.

---

## Migrations

**Total em disco:** 47 migrations (`database/migration_*.sql`)  
**Status de drift:** Beta: 47 aplicadas (migration_115 via feature 012). Produção: 46 aplicadas (migration_115 pendente).

**Migrations especiais:**
- `migration_105` — reclassificada para `manual-risk` (contém `DROP CONSTRAINT`)
- `migration_114` — aplicada manualmente (bootstrap `applied_by`)

---

## Features Ativas

**Total de features:** 16 diretórios em `.specify/features/`

**Condição atual dos artefatos:**
- `spec.md`: 16/16 presentes
- `tasks.md`: 15/16 presentes
- `plan.md`: 15/16 presentes (**0 pendências**)

| Feature | Tasks Concluídas | Plan.md | Status |
|---|---|---|---|
| bug-ux-covil | 6/6 (100%) | ✅ | Validado (inclui BUG-003) |
| deb-01 | 0/3 (0%) | ✅ | Pendente |
| deb-02 | 0/6 (0%) | ✅ | Pendente |
| deb-03 | 0/6 (0%) | ✅ | Pendente |
| deb-04 | 0/6 (0%) | ✅ | Pendente |
| deb-06 | 0/6 (0%) | ✅ | Pendente |
| deb-08 | 0/11 (0%) | ✅ | Pendente |
| deb-09 | 0/8 (0%) | ✅ | Pendente |
| ops-01 | 0/7 (0%) | ✅ | Pendente |
| ops-02 | 0/6 (0%) | ✅ | Pendente |
| ops-03 | 0/5 (0%) | ✅ | Pendente |
| ops-06 | 0/4 (0%) | ✅ | Pendente |
| ops-07 | 0/5 (0%) | ✅ | Pendente |
| ops-08 | 0/7 (0%) | ✅ | Pendente (GUT 100) |
| req-29 | 0/8 (0%) | ✅ | Pendente |
| req-orphan | 0/15 (0%) | ✅ | Pendente |

**Feature com maior GUT pendente:** ops-08 (GUT 100, 0% concluído).

---

## Próxima Ação

**Spec 016 — Reconstrução do Pipeline Discord Sync (lidera roadmap):**

1. ✅ **Fase 0 entregue (09/05/2026):** spec/plan/tasks/research, BUG-004 corrigido, T-EXEC-1 GREEN. Snapshot validado por `SELECT` (E166 obediente).
2. ✅ **Fase 1 entregue (11/05/2026):** migration 118 + guard PATCH + parser null + frontend badge + smoke CI; Deploy Beta `25674367757` GREEN; invariantes via `SELECT` no banco-alvo confirmados.
3. **Próximo passo — Fase 2 (backfill auditável + telemetria):** sessão nova `26-05-12_1_*` a abrir quando mantenedor autorizar; tasks detalhadas em `plan.md` §"Fase 2":
   - Migration 119 com coluna `discord_import_messages.empty_reason` (enum).
   - Marcar mensagens sem body como `ignored` + `empty_reason='discord_returned_empty'` quando API Discord retornar vazio.
   - Endpoint `GET /admin/discord-sync/sources/:id/coverage` agregando cobertura.
   - Aba "Cobertura" no painel da fonte.
   - Reingestão final autorizada (anti-regressão E166).
4. **Validação manual recomendada antes da Fase 2:**
   - Mantenedor revisa amostra de 5–10 dos 111 drafts ready no painel admin Beta em janela anônima.
   - Confirma que UI mostra "Pronto" só para drafts realmente prontos.
   - Confirma que tentativa de PATCH ready em draft drift recebe 422 com mensagem clara.
5. **Critério de fechamento Fase 2:** spec 016 §9 itens 2 e 7 atendidos; cobertura ≥95% ou empty_reason explícito.

**Feature 015 — Importação de Posts de Fóruns Discord (status pré-016):**
1. ✅ **Spec/plan/tasks/implement concluídos:** `specs/015-discord-forum-threads/` com implementação backend/frontend local.
2. ✅ **Bugs catalogados:** BUG-001, BUG-002, BUG-003 todos patched; **BUG-004** (incidente de serialização JSONB) corrigido em 09/05/2026 (sessão 26-05-09_1).
3. **Status:** feature 015 entrega operacional do pipeline; refinamento estrutural ocorre via spec 016.

**Feature 014 — Descoberta de Canais Discord:**
1. ✅ **Spec/plan/tasks/implement concluídos:** `specs/014-discord-channel-discovery/` com implementação backend/frontend local.
2. ✅ **Validação técnica:** builds backend e frontend verdes.
3. **Próximo passo:** se autorizado, commitar, fazer push da branch e abrir PR para `dev`.
4. **Critério de desbloqueio:** após merge/deploy em Beta, admin seleciona servidor/canal sem copiar IDs e cadastra fonte pelo painel.

**Feature 013 — Discord Settings Config:**
1. ✅ **Mergeado e deployado:** PR #142 em `dev`.
2. ✅ **Validação funcional inicial:** token salvo via painel no Beta com preview mascarado.
3. **Próximo passo funcional:** usar Feature 014 para cadastrar fonte sem IDs manuais e buscar mensagens.

**Feature 012 — Pipeline Discord Covil Sync:**
1. ✅ **Mergeado e deployado:** PR #141 em `dev`; Beta com migration_115 aplicada.
2. ✅ **Painel disponível:** `/gestao` → aba "Discord Sync" (admin only).
3. **Bloqueador:** `DISCORD_BOT_TOKEN` não configurado no Beta. Feature 013 resolve.
4. **Parser pendente (T018–T021):** `parseDiscordAnnouncement.ts` + `normalizeDiscordTableDraft.ts` aguardam fixtures reais de anúncios do Covil do Lich.

---

**Feature 008 — Catálogo e Painel UX Bugs:**
1. ✅ **Sessão aberta:** `sessoes/26-04-29_4_catalogo-painel-ux-bugs.md` criada para retomar a feature 008.
2. ✅ **Spec ativa:** `.specify/feature.json` aponta para `specs/008-catalogo-painel-ux-bugs`.
3. ✅ **Validação de spec:** `spec.md` e checklist de qualidade estão sem pendências de `/speckit.specify`.
4. ✅ **Plan concluído:** `/speckit.plan` gerou plano crítico baseado em pesquisa de código, sem considerar a spec como plenamente validada.
5. ✅ **Tasks concluído:** `tasks.md` regenerado com 30 tarefas, organizado por user story e validado contra o plano revisado.
6. **Próximo passo SDD:** aguardar comando do mantenedor para iniciar `/speckit.implement`.

**Feature 007 — Exclusão de Mesa Sem Pop-up:**
1. ✅ **Implementação concluída:** confirmação de exclusão de mesa ocorre dentro da página, sem pop-up, com segunda ação explícita e bloqueio durante processamento.
2. ✅ **BUG-001 corrigido após deploy Beta:** exclusão administrativa pela página/preview agora usa endpoint admin em vez do endpoint de mestre.
3. ✅ **Validação técnica concluída:** busca direcionada sem ocorrências, build frontend verde e changelog JSON válido.
4. ✅ **Deploy Beta concluído:** workflow `Deploy Beta` run `25121700376` verde; health público e rota crítica de mesas retornaram sucesso.
5. **Próximo passo funcional:** mantenedor testar o fluxo em janela anônima no Beta (`mesasbeta.artificiorpg.com`).

**Sessão 26-04-29_2 — Lançamento de itens SDD:**
1. ✅ **Itens esgotados pelo mantenedor:** sessão encerrada documentalmente em 29/04/2026 13:02 BRT.
2. ✅ **Artefatos preparados:** itens 007, 008, 009, 010 e 011 registrados em `specs/` com documentação SDD conforme escopo de cada item.
3. ✅ **Sem implementação técnica nos itens:** a sessão preparou specs/plans/tasks e não iniciou correções de produto.
4. ✅ **Índice de sessões atualizado:** `sessoes/index.md` aponta esta sessão como mais recente.
5. **Próximo passo autorizado:** publicar/deployar a sessão documental para `dev` conforme pedido explícito do mantenedor.

**Bugfix UX (Covil/Placeholders/PriceType):**
1. ✅ **Concluído:** Diagnóstico, patch, implementação, verify e validação global do BUG-003 em beta.
2. **Próximo passo:** manter registro histórico; sem ação imediata nesta sessão.

**Pacote operacional — Runtime e Workflows (novo):**
1. ✅ **US1 concluída:** `mesas-cron` corrigido para executar scripts compilados (`node dist/scripts/*.js`) em produção; container recriado e validado `Up` por mais de 30 minutos, sem `ts-node: not found`.
2. ✅ **US2 concluída:** Node.js da VM atualizado para `v25.9.0`; npm global da VM atualizado para `11.13.0`; serviços principais continuam saudáveis.
3. ✅ **US3 concluída:** workflows atualizados para `actions/checkout@v5`, `actions/setup-node@v6` e `node-version: '25.9.0'`; Dockerfiles atualizados para `node:25.9.0-alpine` com npm `11.13.0`.
4. ✅ **Lint de workflow concluído:** `_enforce-migration-dir.yml` corrigido para remover `SC2086`; Deploy Beta `25080459429` concluiu verde sem annotation `actionlint` relacionada ao aviso.
5. ✅ **Fechamento SDD concluído:** `pr-description.md`, `tasks.md`, `project-state.md`, `session-log.md` e índice de sessões atualizados; sessão movida para `sessoes/encerradas/`.
6. **Próximo passo:** se aprovado, promover `dev` para `main` por PR/fluxo controlado; não há próxima ação técnica pendente desta feature em `dev`.

**Feature 003 — Auditoria de Workflows GitHub Actions:**
1. ✅ **Concluído:** A auditoria dos workflows (Feature 003) alcançou 100% de integridade com a erradicação do vazamento documental (Phase 7 concluída).
2. O branch `dev` está completamente blindado e validado off-happy-path.
3. **Próximo passo imediato:** Executar novo `workflow_dispatch` de `promote-to-prod.yml` para validar job `release` GREEN.e blindado e validado off-happy-path.
3. **Próximo passo imediato:** Iniciar preparação e execução do deploy para Produção (`dev` → `main`) seguindo rigorosamente as diretrizes.

**Hidratação Beta (Refatoração Semântica via JSON):**
1. ✅ **Concluído:** Resolução de E160-E163 (infraestrutura, auth, ON CONFLICT, schema).
2. **Próximo passo:** Abrir nova sessão para refatorar `backend/src/routes/adminHydration.ts` para arquitetura semântica via JSON. Decisão arquitetural: import por slug/email em vez de id direto. Permite reuso futuro pra import via Discord bot.
3. **Critério de início:** Sessão nova com plano completo (export → JSON intermediário → import semântico).

**Artefatos da Phase 4:**
- 5 planos de ação em `specs/003-auditoria-workflows-actions/audit/action-*.md`
- Plano consolidado: 1 CRITICAL, 3 HIGH, 1 MEDIUM
- Rollback explícito documentado para todas as ações
- Validação: nenhum workflow será removido

**Comandos disponíveis:**
- `/speckit.status` — dashboard de estado SDD
- `/speckit.plan` — gerar `plan.md` para feature específica
- `/speckit.tasks` — gerar/ajustar `tasks.md`
- `/speckit.retro.run` — análise retrospectiva de sprint
- `/speckit.bugfix.*` — correção estruturada de bugs
- `/speckit.reconcile.run` — reconciliação de drift
- `/speckit.archive.run` — arquivamento pós-merge
- `/speckit.doctor` — diagnóstico de saúde do projeto
- `/speckit.verify-tasks` — detecção de phantom completions
- `/speckit.memorylint.run` — auditoria de governança

---

## Bloqueios Ativos

**Bloqueios/pendências ativos:**
- E164 (hidratação beta): IDs divergentes prod vs beta + transaction abortada após FK violation. Endpoint /api/v1/admin/sync/hydrate retorna 500. Decisão: refatoração arquitetural via JSON em sessão futura.


---

## Identidade

**Repositório:** `mesas_rpg_artificio`  
**SSH:** `ssh -F C:\projetos\config faren`  
**VM Oracle:** acesso via `gh` autenticado  
**Banco de dados:** `mesas_rpg` (PostgreSQL via Docker)

**Credenciais de acesso:**
```bash
# Beta
docker exec mesas-beta-db psql -U admin -d mesas_rpg

# Produção
docker exec mesas-db psql -U admin -d mesas_rpg
```
