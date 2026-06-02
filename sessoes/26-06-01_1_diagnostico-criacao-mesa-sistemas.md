# Sessao 26-06-01_1 - Diagnostico criacao de mesa e sistemas

**Data:** 2026-06-01  
**Objetivo:** diagnosticar cinco problemas no fluxo de Nova Mesa, sugestoes de sistemas/cenarios e horario das sessoes; classificar risco/processo; propor plano curto antes de implementar fatias seguras.

## Vinculos

- Pedido do mantenedor em 2026-06-01.
- Governanca: `AGENTS.md`.
- Contexto minimo: `.specify/memory/project-state.md`, `docs/agents/context-capsule.md`.

## Problemas mapeados

1. `Nova Mesa > Descricao da Mesa`: editor rico com contraste ruim em tema escuro.
2. `Nova Mesa > sugestao/adicionar sistema`: sugestao redireciona para `/painel`; esperado manter fluxo de criacao.
3. Admin adicionando sistema: admin nao deve passar por sugestao/aprovacao; deve criar direto catalogo/arvore e disponibilizar no fluxo.
4. `Gestao Administrativa > Sugestoes de Sistemas/Cenarios`: tela limpa ha muito tempo; diagnosticar envio, listagem/filtro, API, tabela, permissao ou ausencia real de dados.
5. `Nova Mesa > horario das sessoes`: adicionar opcoes explicitas `dia da semana a definir` e `horario a definir`; verificar impacto frontend/backend/validacao/normalizacao/banco/API/exibicao publica.

## Modo e classificacao inicial

- Item 1: Sem SDD ou SDD Lite, conforme achado. Provavel ajuste visual localizado.
- Item 2: SDD Lite. Bug de fluxo/UX com impacto de produto.
- Item 3: SDD Completo se exigir permissao/backend/contrato; SDD Lite se ja existir endpoint admin seguro reaproveitavel sem contrato novo.
- Item 4: Diagnostico SDD Lite; SDD Completo se exigir write DB, migration, auth/permissao ou contrato API.
- Item 5: SDD Completo se exigir schema/API/contrato ou migration; SDD Lite se valores ja forem aceitos como texto livre normalizado e mudanca ficar no frontend/exibicao.

## Plano de execucao

- [ ] Mapear componentes/rotas do fluxo de criacao de mesa.
- [ ] Mapear APIs/backend de sistemas, cenarios e sugestoes.
- [ ] Localizar normalizadores/tipos de horario/dia.
- [ ] Reproduzir ou criar loops rapidos para cada bug antes de fix.
- [ ] Produzir hipoteses ranqueadas e plano curto por fatia.
- [ ] Implementar somente fatias seguras apos diagnostico registrado.
- [ ] Validar com testes/builds adequados.
- [ ] Atualizar `database/changelogs.json` antes de deploy se houver mudanca visivel.

## Arquivos provaveis

- `frontend/src/features/create-table/**`
- `frontend/src/components/**`
- `frontend/src/pages/**`
- `frontend/src/features/admin/**`
- `backend/src/routes/**`
- `backend/src/**systems**`
- `backend/src/**suggest**`
- `database/changelogs.json`
- Arquivos de testes relacionados.

## Criterio de conclusao explicito

- Cada item tem causa provavel ou causa confirmada registrada.
- Cada item tem processo definido: Sem SDD, SDD Lite ou SDD Completo.
- Fatias implementadas tem evidencia tecnica registrada.
- Busca final relevante confirma ausencia de padroes quebrados no escopo alterado.
- `database/changelogs.json` atualizado para mudancas visiveis antes de deploy.
- `.specify/memory/project-state.md` avaliado/atualizado se estado operacional mudar.
- `sessoes/index.md` atualizado com esta sessao.

## Evidencias

- Retomada minima lida em ordem: `.specify/memory/project-state.md`, `AGENTS.md`, `docs/agents/context-capsule.md`.
- `git status --short --branch`: branch `dev`, diff existente em `sessoes/26-05-12_1_parser-refinements-imagens.md` preservado sem alteracao.
- Branch/status inicial: `dev...origin/dev`; arquivos modificados antes desta sessao: `sessoes/26-05-12_1_parser-refinements-imagens.md`.
- Sessao nova aberta por escopo dedicado; sessoes antigas de Discord/governanca preservadas.
- Item 1 mapeado em `frontend/src/components/MarkdownEditor.tsx` usado por `StepBasic`. CSS define texto branco, mas editor de markdown herda areas internas claras da lib; faltam regras fortes para background/caret/selection da area `.sec-md`/`.input`.
- Item 2 mapeado: `CreateTableForm` renderiza um `<form>` externo e `StepSystem` renderiza `SystemSuggestionModal`/`ScenarioSuggestionModal`, cada um com outro `<form>` dentro. HTML nao suporta form aninhado; submit da sugestao pode vazar para o submit da mesa e acionar `refreshData()`, que troca URL para `/painel`.
- Item 3 mapeado: backend ja tem criacao admin direta em `POST /api/v1/systems/admin` e `POST /api/v1/scenarios/admin`; modal de sistema sempre chama `POST /api/v1/system-suggestions`, mesmo quando `user.role === 'admin'`.
- Item 4 mapeado: `GestaoPage` busca somente `/api/v1/admin/system-suggestions`; nao busca nem renderiza `/api/v1/admin/scenario-suggestions`.
- Item 4 SELECT read-only Beta: `system_suggestions` tem 37 linhas (`pending=35`, `approved=2`); `scenario_suggestions` tem 0.
- Item 4 SELECT read-only Producao: `system_suggestions=0`, `scenario_suggestions=0`.
- Item 5 mapeado: frontend exige dia/horario em `SessionRepeater` e `validation.ts`; backend `tableValidators.ts` exige `day_of_week` enum e `start_time` regex; DB `table_schedules` tem `day_of_week TEXT NOT NULL` com CHECK e `start_time TIME NOT NULL`. Opcao "a definir" exige decisao de contrato/dados.

## Hipoteses ranqueadas

1. Item 2: form aninhado causa submit involuntario da mesa; mover modais para portal fora do form pai deve eliminar redirecionamento.
2. Item 1: CSS incompleto do `react-markdown-editor-lite` deixa subarea clara; regras especificas para `.sec-md`, `.input`, `textarea`, `::selection` devem corrigir contraste.
3. Item 4: tela limpa em Producao e real para dados de Producao; Beta tem sistemas pendentes, mas UI nao inclui cenarios. Se mantenedor testa Beta e nao ve sistemas, investigar aba/filtro/auth.
4. Item 3: backend suporta criacao direta de sistema, mas UX nao ramifica por admin; precisa usar endpoint admin e atualizar arvore/selecionar novo sistema.
5. Item 5: sem migration/contrato novo, "a definir" so caberia como ausencia de schedule, mas UI/backend atuais exigem um schedule completo; implementacao correta e SDD Completo.

## Plano por fatia

- Fatia A (SDD Lite, segura): corrigir contraste do `MarkdownEditor`; mover modais de sugestao para portal fora do form pai; validar build frontend e, se possivel, teste/browser.
- Fatia B (SDD Lite, moderada): para admin no modal de sistema, criar direto via `POST /api/v1/systems/admin`, atualizar arvore e selecionar o novo sistema se retorno trouxer `id`; avaliar backend aceitar `description`.
- Fatia C (SDD Lite, moderada): `GestaoPage` listar sistemas e cenarios, com filtros por status e acoes por tipo; corrigir rejeicao de cenarios sem motivo se UX exigir descarte rapido igual sistemas.
- Fatia D (SDD Completo): definir modelo de `dia a definir`/`horario a definir` antes de editar DB/API. Opcoes: permitir schedule parcial com colunas nullable + status explicito, ou modelar disponibilidade como enum separado sem criar `table_schedules` incompleto.

## Execucao

- Ajuste de governanca solicitado pelo mantenedor em 2026-06-01: deixar claro nos documentos core que Browser plugin/Playwright local nao contam como validacao funcional de UI; fluxo correto e publicar em `dev`/Beta e aguardar analise do mantenedor.
- Fatia A iniciada: `MarkdownEditor`, `SystemSuggestionModal`, `ScenarioSuggestionModal` e teste frontend dedicado.
- Fatia A validada: `npm --prefix frontend test -- suggestionModals` GREEN; `npm --prefix frontend run build` GREEN; `database/changelogs.json` atualizado e JSON valido.
- Fatia B iniciada: admin deve criar sistema direto pelo endpoint admin existente e manter o fluxo de Nova Mesa.
- Fatia B validada: `SystemSuggestionModal` usa `POST /api/v1/systems/admin` para `user.role === 'admin'`, retorna `id` para selecionar no fluxo e backend preserva `description`; `npm --prefix frontend test -- suggestionModals` GREEN; `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN.
- Fatia C implementada: `GestaoPage` busca e normaliza `system_suggestions` e `scenario_suggestions`, mistura ambas na fila administrativa e usa endpoint correto para aprovar/rejeitar por tipo; backend de cenarios aceita rejeicao sem motivo, alinhado a sistemas.
- Fatia C validada: `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; `database/changelogs.json` valido; `git diff --check` sem erro (apenas avisos de EOL).
- Fatia D nao implementada nesta rodada: exige SDD Completo por contrato/API/DB de `table_schedules`.
- Deploy Beta autorizado pelo mantenedor em 2026-06-01: comando "faca o deploy" deve ser tratado como aprovacao explicita para commit e `git push origin dev` neste contexto operacional.
- Planejamento solicitado para proximo chat em 2026-06-01: criar SDD Completo `specs/018-resolucao-sugestoes-sistemas/` para fluxo saudavel de resolucao de sugestoes, evitando redundancia por alias/edicao/mescla.

## Retomada 2026-06-02 - Fatia D + 500 Resolver

- Retomada minima lida em ordem: `.specify/memory/project-state.md`, `AGENTS.md`, `docs/agents/context-capsule.md`.
- Preflight SDD Completo lido: `.specify/memory/constitution.md`, `docs/sdd/SESSION_FAILURES_REGISTRY.md`, `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md`.
- Erros conhecidos consultados por sintomas `system-suggestions`, `resolve`, `500`; nenhum erro especifico para `POST /admin/system-suggestions/:id/resolve` encontrado. Padroes relevantes: E043/E127/E128 para 500 por constraint/DB e E166 para evidencias com SELECT no banco-alvo quando houver pipeline/write.
- Skill `diagnose` usada para o 500: reproduzir via log/rota, formular hipoteses, testar uma por vez, corrigir com regressao.
- Skill `caveman` em modo ultra solicitada pelo mantenedor; respostas ao mantenedor devem ficar comprimidas.
- `git status --short --branch`: `dev...origin/dev`; alteracoes preexistentes preservadas em `.specify/memory/project-state.md` e `sessoes/26-06-01_2_resolucao-sugestoes-sistemas.md`.

Plano desta retomada:
- [x] Diagnosticar 500 em `POST /api/v1/admin/system-suggestions/4c1efb7e-3c1f-4e09-8c04-029e12131342/resolve` com logs Beta read-only e codigo local.
- [x] Corrigir somente se houver fix seguro local e regressao tecnica.
- [x] Abrir/retomar artefatos SDD Completo da Fatia D para `dia da semana a definir` e `horario a definir`.
- [x] Propor contrato/modelo de dados sem quebrar `table_schedules`: ausencia de horario definido nao deve gerar linha incompleta em `table_schedules`; dados indefinidos devem ser representados no contrato de mesa como flag/estado de agenda, mantendo `table_schedules` apenas para sessoes com `day_of_week` e `start_time` validos.
- [x] Implementar fatia segura end-to-end local: frontend Nova Mesa, validacao, mapper, backend validators/API, exibicao publica, testes/builds.
- [ ] Registrar evidencias tecnicas e atualizar changelog se houver mudanca visivel.

Evidencias desta retomada:
- Log Beta read-only (`docker logs mesas-beta-api`) mostrou 500 no `resolve` com constraint `systems_slug_key` durante `create_child` para sugestao `4c1efb7e-3c1f-4e09-8c04-029e12131342`.
- SELECT Beta read-only confirmou `slug='2e'` existente em `The One Ring Roleplaying Game/2e` e sugestao pendente `Starfinder 2e`.
- Diagnostico: helper recomendava `create_child` quando havia base+edicao, mas nao elevava para `merge_existing` quando a edicao ja existia sob o mesmo pai; backend tambem nao prevenia colisao global legada de `systems.slug` ao criar filho com slug comum (`2e`).
- Correcao local 500: `scoreSystemCandidates` agora recomenda `merge_existing` quando encontra filho equivalente sob o pai; frontend rotula `existing_child_match`; backend `create_child` usa `path_slug` canonico por pai e gera `slug` interno unico quando ha colisao global, evitando 23505.
- RED observado: `npm --prefix backend test -- systemSuggestionCandidates` falhou no novo caso `D&D 2024` porque retornava `dd5e` em vez de `dd2024`.
- GREEN observado: `npm --prefix backend test -- systemSuggestionCandidates` passou com 21/21.
- Fatia D SDD: `specs/019-agenda-a-definir/{spec,plan,tasks}.md` criados.
- Modelo Fatia D: `table_schedules` continua apenas para sessoes completas; `tables` recebe `schedule_day_status`, `schedule_time_status`, `schedule_day_hint`, `schedule_time_hint`.
- Implementacao Fatia D: migration 124 aditiva, tipos/validators/backend create/update/public route, `SessionRepeater`, mapper/hidratacao, review e `TableSchedules` publico.
- Changelog atualizado com entrada `2026-06-02-agenda-a-definir`.
- `npm --prefix backend run build`: GREEN.
- `npm --prefix frontend run build`: GREEN (aviso nao bloqueante de chunk >500 kB).
- `database/changelogs.json | ConvertFrom-Json`: GREEN (15 entradas).
- Rodada final apos ajuste de hints: `npm --prefix backend run build` GREEN; `npm --prefix frontend run build` GREEN; `git diff --check` sem erros (apenas avisos EOL CRLF/LF).

## Validacao pre-deploy da fila Beta de sugestoes de sistemas (02/06)

Pedido do mantenedor: antes de deploy, buscar fila pendente no banco Beta e testar a saida do resolvedor com o codigo local atual.

Plano:
- [x] SELECT read-only no `mesas-beta-db` para `system_suggestions` pendentes, `systems` e `system_aliases`.
- [x] Rodar `scoreSystemCandidates` local sobre cada sugestao.
- [x] Listar recomendacao, melhor candidato, score, razoes e analise.
- [x] Identificar casos onde a saida ainda sugere criacao nova indevida ou nao detecta edicao existente.

Evidencia:
- SELECT Beta read-only retornou 20 sugestoes pendentes, 1280 sistemas e 423 aliases.
- Primeira rodada do helper local apontou acoes: `create_child=1`, `create_system=13`, `create_alias=4`, `merge_existing=2`.
- Achados ruins: `Meio Sangues` recomendava alias/Marvel e `Curse of Strahd` recomendava alias/Changeling por colisao de acronimo (`ms`/`cos`) gerada por aliases `Marvel SAGA` e `Changeling: o sonhar`.
- Correcao aplicada: `buildMatchKeys` agora so gera acronimo quando ha sinal explicito (`and`/`&`) ou token de uma letra. Teste novo cobre `Curse of Strahd` nao casando com `Changeling: o sonhar`.
- `npm --prefix backend test -- systemSuggestionCandidates`: GREEN (22/22).
- `npm --prefix backend run build`: GREEN.
- Segunda rodada do helper local com dados Beta: `create_child=1`, `create_system=15`, `create_alias=2`, `merge_existing=2`; falsos positivos Marvel/Changeling removidos.
- Casos especiais da fila:
  - `Starfinder 2e` -> `create_child`, pai `Starfinder Roleplaying Game`, filho `2e`, score 0.85 (`base_plus_edition`).
  - `Starfinder` -> `create_alias`, alvo `Starfinder Roleplaying Game`, score 0.9 (`base_match`).
  - `Pokémon` -> `create_alias`, alvo `Pokémon RPG`, score 0.9 (`base_match`).
  - `Cosmere` -> `merge_existing`, alvo `Cosmere RPG`, score 1 (`name_pt_exact`).
  - `CAIN` -> `merge_existing`, alvo `CAIN`, score 1 (`name_exact`).
  - 15 itens continuam `create_system` sem candidato automatico: `Waterdeep`, `Vecna`, `Tormenta20`, `Ravenloft`, `Planescape`, `Phandelver and Below`, `Meio Sangues`, `Icewind Dale`, `Fundação 0`, `Doomed Forgotten Realms`, `Curse of Strahd`, `Cultos Inomináveis`, `Scum & Villainy`, `Baldur's Gate`, `Forgotten Realms`.
- `git diff --check`: sem erros; apenas avisos EOL CRLF/LF.

## Deploy Beta autorizado e executado (02/06)

- Aprovacao do mantenedor recebida para o bloco: `git status`, stage especifico, commit, `git switch dev`, `git merge --ff-only feat/019-agenda-a-definir`, `git push origin dev`, listar/acompanhar Deploy Beta.
- Stage conferido por `git status --short --branch` e `git diff --cached --stat`; `.specify/memory/project-state.md` e `sessoes/26-06-01_2_resolucao-sugestoes-sistemas.md` ficaram fora do commit por serem docs preexistentes/fora do escopo imediato.
- Commit criado em `feat/019-agenda-a-definir`: `b3abe3e fix(019): suporta agenda a definir`.
- `git switch dev`: OK; `git merge --ff-only feat/019-agenda-a-definir`: OK; `git push origin dev`: OK (`61d136d..b3abe3e`).
- Deploy Beta run `26827258562`: GREEN.
  - `validate`: GREEN.
  - `lint`: GREEN.
  - `enforce-dir`: GREEN.
  - `migrate`: GREEN.
  - `smoke-discord`: GREEN.
  - `deploy-app`: GREEN, incluindo `Deploy App Containers`.
  - `smoke`: GREEN.
- Pós-deploy read-only:
  - `https://mesasbeta.artificiorpg.com/`: HTTP 200.
  - `https://mesasbeta.artificiorpg.com/api/v1/health`: `{"status":"ok","environment":"beta","db":"connected","usersSampled":true}`.
  - SELECT Beta confirmou colunas `schedule_day_status`, `schedule_time_status`, `schedule_day_hint`, `schedule_time_hint` em `tables`.
  - SELECT Beta confirmou constraints `tables_schedule_day_status_check`, `tables_schedule_time_status_check`, `tables_schedule_day_hint_check`, `tables_schedule_tbd_hint_check`.
- `.specify/memory/project-state.md` atualizado localmente com estado Beta. Commit/push desta documentacao pos-deploy exigem nova aprovacao explicita.

## Promocao para Producao v1.2.5 (02/06)

Pedido do mantenedor: evoluir Beta para Producao como `Production v1.2.5`.

Preflight inicial read-only:
- Branch local: `dev...origin/dev`.
- Arquivos locais sujos apenas documentais: `.specify/memory/project-state.md`, esta sessao e `sessoes/26-06-01_2_resolucao-sugestoes-sistemas.md`.
- `origin/dev` esta a frente de `origin/main`, incluindo `b3abe3e fix(019): suporta agenda a definir`.
- `origin/main` tambem tem commits proprios; promocao deve ser por PR GitHub `dev -> main`, sem checkout/merge local entre branches.
- Nao ha PR aberto `dev -> main`.
- Ultimo Deploy Beta para `b3abe3e`: run `26827258562`, GREEN.
- Migration 124: `@class: online-safe`, `@requires-backup: false`, aditiva em `tables`; `table_schedules` intacta.

Proximo passo controlado:
- Criar PR `dev -> main` com titulo `Production v1.2.5`.
- Aguardar `Preflight Prod Gate` no PR e confirmar comentario/status `GO` antes de qualquer merge.
- Merge do PR e disparo do workflow canonico `Promote Beta to Production (CANONICAL)` exigem aprovacoes separadas.

Execucao autorizada:
- PR #152 criado: `Production v1.2.5` (`dev -> main`) com release notes cobrindo agenda a definir, resolver de sugestoes de sistemas, anti-duplicacao de edicoes/aliases, notificacoes admin, melhorias no fluxo Nova Mesa, sugestoes de cenarios e migrations 123/124.
- Preflight Prod Gate run `26828139171`: job GREEN. Comentario do PR marcou `ATTENTION` porque Prod tinha `migration_123_system_suggestion_resolution.sql` e `migration_124_table_schedule_tbd.sql` pendentes; sem drift fatal/BLOCKED. As duas migrations sao `online-safe`.
- Aprovacao separada recebida para merge PR #152, workflow canonico `v1.2.5`, acompanhamento e validacoes.
- PR #152 mergeado via GitHub, sem checkout/merge local.
- Workflow `Promote Beta to Production (CANONICAL)` disparado com `version=v1.2.5`: run `26828267450`, GREEN.
  - `typecheck`: GREEN.
  - `lint`: GREEN.
  - `enforce-dir`: GREEN.
  - `governance_gate`: GREEN.
  - `deploy`: GREEN.
  - `release`: GREEN.
- Release publicada: `Production v1.2.5`, tag `v1.2.5`.

Validacao pos-producao:
- Producao root `https://mesas.artificiorpg.com/`: HTTP 200.
- Producao health: `{"status":"ok","environment":"production","db":"connected","usersSampled":true}`.
- Beta root `https://mesasbeta.artificiorpg.com/`: HTTP 200.
- Beta health: `{"status":"ok","environment":"beta","db":"connected","usersSampled":true}`.
- Rotas criticas:
  - Producao `/api/v1/tables?limit=1`: HTTP 200.
  - Producao `/api/v1/systems?view=tree`: HTTP 200.
  - Producao `/auth/google`: HTTP 302 para Google OAuth.
  - Beta `/api/v1/tables?limit=1`: HTTP 200.
  - Beta `/api/v1/systems?view=tree`: HTTP 200.
  - Beta `/auth/google`: HTTP 302 para Google OAuth.
- SELECT Producao confirmou `schema_migrations` com `migration_123_system_suggestion_resolution.sql` e `migration_124_table_schedule_tbd.sql`.
- SELECT Producao confirmou colunas `schedule_day_status`, `schedule_time_status`, `schedule_day_hint`, `schedule_time_hint` em `tables`.
- SELECT Producao confirmou constraints `tables_schedule_day_status_check`, `tables_schedule_time_status_check`, `tables_schedule_day_hint_check`, `tables_schedule_tbd_hint_check`.
- `docker inspect` read-only: `mesas-api`, `mesas-app`, `mesas-beta-api`, `mesas-beta-frontend` com health `healthy`.

Pendente:
- Commit/push das atualizacoes documentais locais exigem aprovacao separada por acao.
- Validacao funcional humana em janela anonima continua sendo gate de UX/fluxo real, conforme AGENTS.md.

## Review externo pos-prod sobre schedule hints (02/06)

Anexo do mantenedor: review `Production v1.2.5 Review` alegando "inverted logic" em migration 124, validators e `TableService`.

Diagnostico:
- O review descreve corretamente o contrato desejado: quando `*_status='to_define'`, o respectivo `*_hint` deve ser `NULL`; quando `*_status='defined'`, hint e opcional/permitido.
- A implementacao atual ja segue esse contrato:
  - Migration 124: `(schedule_day_status = 'defined' OR schedule_day_hint IS NULL)` permite hint quando status e `defined` e exige `NULL` quando `to_define`.
  - Validators: rejeitam `to_define + hint`; aceitam `defined + hint`.
  - `TableService`/`gmPanel`: preservam hint quando status e `defined`; gravam `NULL` quando status e `to_define`.
- A sugestao automatica do review (`status='to_define' OR hint IS NOT NULL`) e incorreta: permitiria `to_define + hint` e exigiria hint quando `defined`, quebrando o contrato.

Evidencia:
- Truth table SQL read-only em Producao:
  - `defined + NULL`: constraint atual OK, sugestao FAIL.
  - `defined + quarta`: constraint atual OK, sugestao OK.
  - `to_define + NULL`: constraint atual OK, sugestao OK.
  - `to_define + quarta`: constraint atual FAIL, sugestao OK.
- `updateTableSchema.safeParse` via `ts-node`:
  - `defined null=true`
  - `defined hint=true`
  - `to_define null=true`
  - `to_define hint=false`

Conclusao:
- Nao aplicar o patch sugerido pelo review. Ele e regressivo.
- Possivel melhoria futura: adicionar teste unitario dedicado para travar esse contrato e evitar reabrir a duvida.

## Review Codex PR #152 - notificacoes dentro de transacao (02/06)

Comentario recebido:
- `backend/src/services/adminNotifications.ts`: `notifyAdmins` captura erro mesmo quando chamado com `trx`.
- Risco real: erro SQL dentro de transacao Postgres deixa a transacao em estado abortado; engolir `catch` nao torna a operacao nao-fatal.

Diagnostico:
- `notifyAdmins` aceita `trx?: Transaction<Database>` e usa `executor = trx ?? db`.
- Callers transacionais confirmados:
  - `systemSuggestions.ts`: cria sugestao e chama `notifyAdmins(..., trx)`.
  - `scenarioSuggestions.ts`: cria sugestao e chama `notifyAdmins(..., trx)`.
  - `auth.ts`: cria usuario/profile/log e chama `notifyAdmins(..., trx)`.
- Como a intencao documentada e "nao-fatal", a notificacao nao deve participar da transacao principal.

Plano de hotfix local:
- Remover parametro `trx` de `notifyAdmins` e sempre usar `db`.
- Mover chamadas de sistema/cenario/novo membro para depois do commit da transacao.
- Validar com build backend e busca final por `notifyAdmins(..., trx)`.

Implementacao local:
- Branch `feat/021-notificacoes-fora-transacao` criada a partir de `dev`.
- `notifyAdmins` nao aceita mais `trx` e usa `db` direto.
- `systemSuggestions.ts`: cria sugestao dentro da transacao, notifica admins depois do commit.
- `scenarioSuggestions.ts`: cria sugestao dentro da transacao, notifica admins depois do commit.
- `auth.ts`: cria usuario/profile/log dentro da transacao, captura `newUserId` e notifica admins depois do commit.
- `backend/dist/*` atualizado pelo build para os arquivos correspondentes.

Evidencia:
- `npm --prefix backend run build`: GREEN.
- Busca final `rg "notifyAdmins\([^\)]*,\s*trx\)" backend/src backend/dist -n`: zero resultados.
- `git diff --check`: sem erros; apenas avisos EOL esperados.
