# Sessao 26-05-03_4 - Discord Settings Config

**Data**: 2026-05-03
**Objetivo**: Executar o fluxo SDD completo da Feature 013, permitindo configurar o token do bot Discord pelo painel admin sem acesso SSH.

**Sessao Anterior**: `sessoes/encerradas/26-05-03_3_discord-covil-sync.md`
**Proxima Sessao**: a definir

---

## Plano de Execucao

1. Registrar esta sessao e atualizar o indice antes de alteracoes tecnicas.
2. Criar branch `feat/013-discord-settings-config` a partir de `dev`.
3. Executar `/speckit.plan` para `specs/013-discord-settings-config/`.
4. Executar `/speckit.tasks`.
5. Executar `/speckit.implement` seguindo `tasks.md`.
6. Validar backend e frontend com builds obrigatorios.
7. Preparar commit, push da branch e PR para `dev`.
8. Encerrar com `/speckit.retro.run` e atualizar estado do projeto.

---

## Checklist de Fechamento

- [x] Executar `/speckit.retro.run`
- [x] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
- [x] Atualizar `.specify/memory/session-log.md`
- [x] Atualizar `sessoes/index.md`
- [ ] Mover sessao para encerradas/ quando autorizado

---

## Arquivos que serao modificados

- `sessoes/26-05-03_4_discord-settings-config.md`
- `sessoes/index.md`
- `.specify/feature.json`
- `AGENTS.md`
- `specs/013-discord-settings-config/plan.md`
- `specs/013-discord-settings-config/research.md`
- `specs/013-discord-settings-config/data-model.md`
- `specs/013-discord-settings-config/quickstart.md`
- `specs/013-discord-settings-config/contracts/README.md`
- `specs/013-discord-settings-config/tasks.md`
- `specs/013-discord-settings-config/pr-description.md`
- `database/migration_116_discord_settings.sql`
- `backend/src/db/types.ts`
- `backend/src/discord/settingsCrypto.ts`
- `backend/src/discord/config.ts`
- `backend/src/discord/ingestMessages.ts`
- `backend/src/routes/adminDiscordSync.ts`
- `frontend/src/features/discord-sync/api/discordSyncApi.ts`
- `frontend/src/features/discord-sync/components/DiscordSyncPanel.tsx`
- `frontend/src/features/discord-sync/components/DiscordSettingsPanel.tsx`
- `frontend/src/features/discord-sync/types.ts`
- `MAPA_DE_API.md`
- `.specify/memory/project-state.md`
- `.specify/memory/session-log.md`

---

## Criterio de Conclusao Explicito

Sessao concluida quando a Feature 013 tiver plan, tasks, implementacao, builds backend/frontend verdes, PR aberto para `dev`, `project-state.md` e `session-log.md` atualizados, sem plaintext do token em resposta HTTP ou log, e a sessao registrada no indice.

---

## Progresso

- [x] `.specify/memory/project-state.md` lido.
- [x] `AGENTS.md` lido.
- [x] `.specify/memory/constitution.md` lido.
- [x] Sessao criada a pedido explicito do mantenedor.
- [x] `sessoes/index.md` atualizado para esta sessao.
- [x] `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md` lido.
- [x] `docs/sdd/README.md` lido.
- [x] `.specify/extensions.yml` lido; hooks obrigatorios identificados.
- [x] Cabecalhos de `docs/sdd/SESSION_FAILURES_REGISTRY.md` lidos.
- [x] Branch `feat/013-discord-settings-config` criada.
- [x] Ponteiro `.specify/feature.json` atualizado para `specs/013-discord-settings-config`.
- [x] Setup inicial do plan detectou ponteiro antigo e alterou temporariamente `specs/012-discord-covil-sync/plan.md`; alteracao acidental restaurada antes de prosseguir.
- [x] `/speckit.plan` executado.
- [x] `plan.md`, `research.md`, `data-model.md`, `contracts/README.md`, `quickstart.md` criados/atualizados.
- [x] `/speckit.tasks` executado.
- [x] `tasks.md` criado com 25 tarefas em fases Setup, Foundational, US1, US2, US3 e Validation.
- [x] T001 concluida. Evidencia:
  - Estado: NOT STARTED -> DONE
  - Comando: `Get-ChildItem -LiteralPath database -Filter 'migration_*.sql' | ForEach-Object { if ($_.Name -match '^migration_(\d+)') { [pscustomobject]@{Number=[int]$matches[1];Name=$_.Name} } } | Sort-Object Number,Name | Select-Object -Last 8`
  - Output literal:
    ```text
    Number Name
    ------ ----
       108 migration_108_gm_profile_metrics.sql
       108 migration_108_systems_logo_website.sql
       109 migration_109_links_og_metadata_cache.sql
       111 migration_111_gm_preferred_vtt_platforms.sql
       112 migration_112_gm_contact_info.sql
       113 migration_113_benchmark_snapshots.sql
       114 migration_114_add_applied_by.sql
       115 migration_115_discord_import.sql
    ```
- [x] T002 concluida: `database/migration_116_discord_settings.sql` criada com header online-safe, tabela, constraint, indice unico parcial para `guild_id IS NULL` e bloco de validacao.
- [x] T003 concluida: `backend/src/db/types.ts` atualizado com tipos Kysely de `discord_settings`.
- [x] T004 concluida: `backend/src/discord/settingsCrypto.ts` criado com AES-256-GCM, `scryptSync(JWT_SECRET, 'discord-settings', 32)` e formato `iv_hex:authTag_hex:ciphertext_base64`.
- [x] T005 concluida: `backend/src/discord/config.ts` agora resolve token por DB -> env sem bloquear boot.
- [x] T006 concluida: `backend/src/discord/ingestMessages.ts` aceita `botToken` opcional e usa fallback lazy quando ausente.
- [x] T007-T010 concluidas: rotas `GET /settings`, `PUT /settings/bot-token` e leitura centralizada no `/fetch` implementadas em `adminDiscordSync.ts`.
- [x] T015 concluida: `DELETE /settings/bot-token` implementado com retorno 204.
- [x] T011-T014 concluidas: tipos, parsers de fronteira, `DiscordSettingsPanel` e aba "Configuracao" implementados no frontend.
- [x] T016-T017 concluidas: remocao do token conectada ao frontend com confirmacao inline.
- [x] T018 concluida: `MAPA_DE_API.md` atualizado com as rotas de settings.
- [x] T019 concluida: `specs/013-discord-settings-config/pr-description.md` criado.
- [x] T020 concluida. Evidencia:
  - Estado: NOT STARTED -> GREEN
  - Comando: `npm --prefix backend run build`
  - Output literal:
    ```text
    > backend@1.0.0 build
    > tsc
    ```
- [x] T021 concluida. Evidencia:
  - Estado: NOT STARTED -> GREEN
  - Comando: `npm --prefix frontend run build`
  - Output literal:
    ```text
    > frontend_temp@0.0.0 build
    > tsc -b && vite build

    vite v8.0.3 building client environment for production...
    transforming...✓ 2152 modules transformed.
    rendering chunks...
    computing gzip size...
    dist/index.html                                     1.91 kB │ gzip:   0.71 kB
    dist/assets/banner_placeholder-yIcJpBb9.webp       25.98 kB
    dist/assets/vendor-react-W1ZBun6d.css              29.75 kB │ gzip:  11.52 kB
    dist/assets/index-Db4b5rdQ.css                    147.91 kB │ gzip:  22.40 kB
    dist/assets/rolldown-runtime-Dw2cE7zH.js            0.68 kB │ gzip:   0.41 kB
    dist/assets/mapTableApiToInitialData-BetHjCM2.js    2.34 kB │ gzip:   0.96 kB
    dist/assets/vendor-react-DwK20lzO.js              347.12 kB │ gzip: 109.37 kB
    dist/assets/index-N_uKomvR.js                     660.73 kB │ gzip: 177.62 kB

    ✓ built in 7.14s
    [PLUGIN_TIMINGS] Warning: Your build spent significant time in plugins.
    [plugin builtin:vite-reporter] (!) Some chunks are larger than 500 kB after minification.
    ```
- [x] T022 concluida. Busca de seguranca:
  - Comando: `rg -n "console\\.(log|error).*token|plaintext|botToken|DISCORD_BOT_TOKEN" backend/src/discord backend/src/routes/adminDiscordSync.ts frontend/src/features/discord-sync --glob "*.ts" --glob "*.tsx"`
  - Resultado: zero ocorrencias de `console.log`/`console.error` com token; ocorrencias restantes sao schema/helper, fallback `DISCORD_BOT_TOKEN`, texto de UI e variaveis internas de cifra.
- [x] T023 concluida: `tasks.md` atualizado com T001-T023 concluidas.
- [x] T024 concluida: `.specify/memory/project-state.md` atualizado via procedimento `/speckit.status`.
- [x] T025 concluida: `.specify/memory/session-log.md` atualizado via procedimento `/speckit.retro.run`.
- [x] `/speckit.implement` executado.
- [x] Builds obrigatorios executados.
- [x] PR aberto para `dev`: https://github.com/FarenRavirar/mesas_rpg_artificio/pull/142
- [x] `/speckit.retro.run` executado.
- [x] Atualizar `AGENTS.md` para permitir merge de PR pelo agente quando houver autorizacao explicita do mantenedor.
