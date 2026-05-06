# Session Log

## 2026-05-05T18:20:00-03:00 — discord-draft-pipeline

**Tipo:** Bugfix SDD pós-diagnóstico Beta
**Feature:** `specs/015-discord-forum-threads/`
**Bug:** `specs/015-discord-forum-threads/bugs/BUG-003.md`
**Correção:** funil Discord forum → parser → draft → mesa em status `draft` implementado localmente; parser cobre starter de forum com `content_raw` vazio, conteúdo textual estruturado e reply vazio ignorado; normalizador classifica drafts como `ready` ou `needs_review`; rotas de parse/reparse salvam JSONB como objeto e deduplicam pelo UUID interno da mensagem.
**Evidências principais:** RED observado em `npm --prefix backend test -- parseDiscordAnnouncement`; depois GREEN 3/3; `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; `git diff --check` sem erros; busca final sem `NOT IMPLEMENTED: parser`, `Fase 5`, `JSON.stringify(parsed)`, `where('discord_message_id', '=', message.discord_message_id)` e `status: 'active'` no escopo Discord Sync.
**Risco residual:** validação funcional/manual ainda depende de commit/push, PR para `dev`, deploy Beta e teste do mantenedor em janela anônima com forum real.
**Sessão mantida aberta em:** `sessoes/26-05-04_1_discord-forum-threads.md`

## 2026-05-04T14:42:00-03:00 — discord-sync-apuracao-operavel

**Tipo:** Bugfix SDD pós-deploy Beta
**Feature:** `specs/015-discord-forum-threads/`
**Bug:** `specs/015-discord-forum-threads/bugs/BUG-002.md`
**Correção:** aba Mensagens passou a funcionar como painel mestre/detalhe visível em desktop comum, com seleção automática, contadores de fila, ações rápidas de status e fallback para mensagens sem texto bruto.
**Evidências principais:** `npm --prefix frontend run build` passou.
**Risco residual:** validação funcional/manual ainda depende de deploy Beta e teste do mantenedor em janela anônima.
**Sessão mantida aberta em:** `sessoes/26-05-04_1_discord-forum-threads.md`

## 2026-05-04T08:05:28-03:00 — discord-forum-threads

**Tipo:** Implementacao SDD
**Feature:** `specs/015-discord-forum-threads/`
**Tasks:** T001-T029 geradas; T001-T027 concluidas; T028/T029 executadas via atualizacao de estado e retrospectiva documental nesta sessao.
**Decisoes arquiteturais:** fontes Discord passam a ter `channel_type`; canais de forum (`GUILD_FORUM`, tipo 15) sao importados por posts/threads; mensagens de forum usam `discord_channel_id` como thread real e preservam `discord_parent_channel_id`, `discord_thread_id`, `discord_thread_name`; `GUILD_MEDIA` ficou fora do escopo inicial.
**Evidencias principais:** `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; busca final sem `AbortSignal.timeout`; busca de seguranca sem `console.log`/`console.error` com token.
**PR:** #145 — `feat/015-discord-forum-threads` -> `dev`; checks verdes em 2026-05-04T08:10:08-03:00; mergeado em `dev` com commit `13655dd` em 2026-05-04T08:51:12-03:00.
**Deploy Beta:** run `25317356143` GREEN; `migrate`, `deploy-app` e `smoke` passaram; health publico retornou HTTP 200.
**Risco residual:** validacao funcional depende de deploy Beta e teste do mantenedor em janela anonima usando forum real com permissoes do bot.
**Sessao mantida aberta em:** `sessoes/26-05-04_1_discord-forum-threads.md`

## 2026-05-03T17:35:00-03:00 — discord-channel-discovery

**Tipo:** Implementacao SDD
**Feature:** `specs/014-discord-channel-discovery/`
**Tasks:** T001-T022 concluidas no artefato de tasks da feature.
**Decisoes arquiteturais:** discovery sob demanda via REST Discord com Bot token; `GET /users/@me/guilds` lista servidores do bot; `GET /guilds/:id/channels` lista canais; UI usa seletores como caminho principal e mantem modo manual avancado; sem nova migration.
**Evidencias principais:** `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; busca de seguranca sem logs de token; rotas admin documentadas em `MAPA_DE_API.md`.
**PR:** ainda nao aberto; aguardando autorizacao explicita para commit/push/PR.
**Risco residual:** validacao funcional depende de deploy Beta e bot com permissoes de ver canal/ler historico.
**Sessao mantida aberta em:** `sessoes/26-05-03_4_discord-settings-config.md`

## 2026-05-04T12:15:00-03:00 — discord-sync-triagem-tempo

**Tipo:** Bugfix SDD pós-deploy Beta
**Feature:** `specs/015-discord-forum-threads/`
**Bug:** `specs/015-discord-forum-threads/bugs/BUG-001.md`
**Correção:** `POST /fetch` aceita janela temporal para qualquer fonte Discord; aba Fontes permite escolher período antes da busca; aba Mensagens abre detalhe de apuração com conteúdo completo, link para Discord e edição de status via `PATCH /messages/:id`.
**Evidências principais:** `npm --prefix backend run build` passou; `npm --prefix frontend run build` passou; MAPA_DE_API, contratos, tasks, project-state e changelog atualizados.
**Deploy:** commit `8825e2d` em `origin/dev`; Deploy Beta `25333281806` GREEN; CodeQL `25333281042` GREEN; health Beta HTTP 200 com DB conectado.
**Risco residual:** validação funcional/manual ainda depende de teste do mantenedor em janela anônima.
**Sessão mantida aberta em:** `sessoes/26-05-04_1_discord-forum-threads.md`

## 2026-05-04T09:30:00-03:00 — discord-selects-unificados

**Tipo:** Correção UX pós-Feature 015
**Escopo:** todos os menus `<select>` atuais do frontend.
**Correção:** estilo canônico do seletor de servidor do Discord Sync consolidado como `.app-select` em `frontend/src/index.css`, com fallback global para opções de selects, e aplicado aos selects existentes.
**Evidências principais:** `npm --prefix frontend run build` passou; busca por `<select>` sem `.app-select` retornou zero; `database/changelogs.json` validado sem duplicidade de data/ID e sem termos bloqueados.
**Risco residual:** validação funcional/manual ainda depende de commit, push/deploy para `dev` e teste do mantenedor em janela anônima no Beta.
**Sessão mantida aberta em:** `sessoes/26-05-04_1_discord-forum-threads.md`

## 2026-05-03T16:36:45-03:00 — discord-settings-config

**Tipo:** Implementacao SDD
**Feature:** `specs/013-discord-settings-config/`
**Tasks:** T001-T025 concluidas no artefato de tasks da feature.
**Decisoes arquiteturais:** token do bot salvo em `discord_settings` cifrado com AES-256-GCM; registro global usa `guild_id IS NULL`; indice unico parcial evita duplicidade global; leitura da ingestao prioriza DB e usa `DISCORD_BOT_TOKEN` como fallback sem cache obrigatorio.
**Evidencias principais:** `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; busca de seguranca sem logs de token; rotas admin documentadas em `MAPA_DE_API.md`.
**PR:** #142 — `feat/013-discord-settings-config` -> `dev` (draft).
**Risco residual:** validacao funcional depende de checks, merge em `dev`, deploy Beta e teste em janela anonima pelo mantenedor.
**Sessao mantida aberta em:** `sessoes/26-05-03_4_discord-settings-config.md`

## 2026-04-29T14:20:00-03:00 — exclusao-mesa-sem-popup BUG-001

**Tipo:** Bugfix SDD pós-deploy Beta
**Feature:** `specs/007-exclusao-mesa-sem-popup/`
**Bug:** `specs/007-exclusao-mesa-sem-popup/bugs/BUG-001.md`
**Tasks concluídas:** 20/20
**Causa raiz:** `MesaPage` habilitava gestão para owner ou admin, mas `TableActionPanel` usava sempre `DELETE /api/v1/gm/tables/:id`; para admin em mesa de outro mestre, o backend retornava `404 Mesa não encontrada`.
**Correção:** `TableActionPanel` recebeu `deleteEndpointScope`; `MesaPage` passa `admin` quando `user.role === 'admin'`; rota administrativa usa `DELETE /api/v1/admin/tables/:id` e redireciona para `/gestao`.
**Evidências principais:** `npm --prefix frontend run build` passou; busca final por pop-ups de exclusão retornou zero ocorrências; `database/changelogs.json` validado com `ConvertFrom-Json`.
**Risco residual:** validação funcional/manual ainda depende de novo deploy do patch para Beta e teste em janela anônima.

## 2026-04-29T13:55:00-03:00 — exclusao-mesa-sem-popup

**Tipo:** Implementação SDD
**Feature:** `specs/007-exclusao-mesa-sem-popup/`
**Tasks concluídas:** 18/18
**Decisões arquiteturais:** confirmação de exclusão centralizada em componente inline reutilizável; endpoints e permissões existentes preservados; feedback por toast mantido como padrão local de página.
**Evidências principais:** busca direcionada por pop-ups de exclusão de mesa retornou zero ocorrências; `npm --prefix frontend run build` passou; `database/changelogs.json` validado com `ConvertFrom-Json`.
**Risco residual:** validação funcional/manual ainda depende de deploy do branch `dev` para Beta e teste em janela anônima.
**Sessão mantida aberta em:** `sessoes/26-04-29_3_exclusao-mesa-sem-popup.md`

## 2026-04-29T11:32:00-03:00 — imagens-banners-placeholder

**Tipo:** Retrospectiva e fechamento SDD
**Feature:** `specs/006-imagens-banners-placeholder/`
**Tasks concluídas:** 34/34
**Decisões arquiteturais:** centralizar fallback de banner em `frontend/src/utils/tableImage.ts`; centralizar importação de URL manual e opção `Manter link direto` em `frontend/src/hooks/useImageUrlImport.ts`; unificar edição do perfil do mestre no fluxo canônico `/perfil?tab=mestre`; eliminar o formulário duplicado `EditGmProfileForm`.
**Evidências principais:** backend build, backend tests, frontend build e `git diff --check` passaram durante a sessão; Deploy Beta `25114445001` verde; teste funcional do mantenedor em janela anônima no Beta confirmado em 29/04/2026 11:32 BRT.
**Risco residual:** promoção para produção não executada nesta sessão; deve ser tratada apenas por solicitação explícita do mantenedor.
**Sessão encerrada:** `sessoes/encerradas/26-04-29_1_imagens-banners-placeholder.md`

## 2026-04-28T12:28:00-03:00 — bug-ux-covil

**Tipo:** Retrospectiva
**Tasks concluídas:** 5/6 (conforme tasks.md atual)
**Tasks iniciadas mas não concluídas:** T006
**Decisões arquiteturais:** normalização canônica de `price_type` no mapper (`free/paid` -> `gratuita/paga`)
**Phantom completions detectadas:** 1 potencial inconsistência documental (evidência runtime existe, task T006 ainda marcada como pendente)
**Relatório:** [retro-2026-04-28T12-28-00-03-00.md](file:///c:/projetos/mesas_rpg_artificio/.specify/features/bug-ux-covil/retros/retro-2026-04-28T12-28-00-03-00.md)

## 2026-04-28T19:35:00-03:00 — runtime-workflows

**Tipo:** Retrospectiva e fechamento SDD
**Feature:** `specs/005-runtime-workflows/`
**Tasks concluídas:** 28/28
**Decisões operacionais:** corrigir `mesas-cron` antes de alterar runtime; atualizar runtime para Node.js `25.9.0` Current por decisão explícita do mantenedor; padronizar npm `11.13.0`; alinhar workflows para `actions/checkout@v5`, `actions/setup-node@v6` e `node-version: '25.9.0'`.
**Evidências principais:** Deploy Beta `25079585177` verde após atualização de runtime; Deploy Beta `25080459429` verde após correção do lint `SC2086`; VM validada com `node v25.9.0` e `npm 11.13.0`; `mesas-cron` validado sem `ts-node: not found`.
**Risco residual:** Node 25 é linha Current, não LTS; reavaliar antes de promoção para produção se a política de estabilidade mudar.
**Sessão encerrada:** `sessoes/encerradas/26-04-28_1_fix-publicacao-mesa-opcao.md`

## 2026-05-05T19:05:00-03:00 — discord-draft-readiness-gate

**Tipo:** Bugfix SDD pre-deploy
**Feature:** `specs/015-discord-forum-threads/`
**Bug:** `specs/015-discord-forum-threads/bugs/BUG-003.md`
**Correção:** backend bloqueia sync de draft Discord sem status `ready` e sem campos obrigatorios completos; frontend adiciona editor estruturado com seletor real de sistemas, validacao local e sync desabilitado ate o draft estar pronto.
**Evidencias principais:** dry-run 7d nos dois foruns gerou 11 drafts `needs_review`, 1 reply vazio ignorado e 0 `ready`; `npm --prefix backend test -- parseDiscordAnnouncement` passou; `npm --prefix backend run build` passou; `npm --prefix frontend run build` passou; `git diff --check` sem erros.
**Risco residual:** validacao funcional/manual ainda depende de commit, PR, deploy Beta e teste do mantenedor em janela anonima.
**Sessao mantida aberta em:** `sessoes/26-05-04_1_discord-forum-threads.md`

## 2026-05-06T17:55:00-03:00 — discord-parser-system-suggestions

**Tipo:** Bugfix SDD com deploy dev autorizado
**Feature:** `specs/015-discord-forum-threads/`
**Bug:** `specs/015-discord-forum-threads/bugs/BUG-003.md`
**Correção:** reidratacao Beta confirmou corpos reais dos posts; parser passa a priorizar `Sistema:` do corpo e nao titulo/cenario de thread; sistemas ineditos geram sugestao automatica correta; replies de forum nao viram posts; gestao de sugestoes permite selecao individual, selecionar todas pendentes e descarte em lote sem motivo obrigatorio.
**Evidencias principais:** 11 starters reais reidratados no Beta; parser local com sistemas reais do Beta retornou 11/11 `ready` no estado atual; teste unitario cobre sistema inedito sem cadastro; `npm --prefix backend test -- parseDiscordAnnouncement` passou com 8 testes; backend build, frontend build, changelog JSON e `git diff --check` passaram.
**Risco residual:** validacao funcional em Beta apos deploy deve reprocessar os 11 starters pendentes e conferir a aba Sugestoes de Sistemas em janela anonima.
**Sessao mantida aberta em:** `sessoes/26-05-04_1_discord-forum-threads.md`
