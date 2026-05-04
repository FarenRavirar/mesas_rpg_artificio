# Tasks: 014-discord-channel-discovery

**Input**: Design documents from `specs/014-discord-channel-discovery/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/README.md`, `quickstart.md`
**Tests**: Build backend/frontend obrigatório; validação funcional final em Beta após PR/merge/deploy.

## Phase 1: Setup

- [x] T001 Atualizar sessão `sessoes/26-05-03_4_discord-settings-config.md` com início da Feature 014 e evidência de branch/spec.
- [x] T002 Criar artefatos SDD `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/README.md`, `quickstart.md` e `tasks.md` em `specs/014-discord-channel-discovery/`.

## Phase 2: Foundational

- [x] T003 Criar tipos e cliente REST Discord em `backend/src/discord/discovery.ts`.
- [x] T004 Exportar discovery em `backend/src/discord/index.ts`.
- [x] T005 Adicionar tipos frontend de discovery em `frontend/src/features/discord-sync/types.ts`.
- [x] T006 Adicionar schemas/parsers e métodos de discovery em `frontend/src/features/discord-sync/api/discordSyncApi.ts`.

## Phase 3: User Story 1 — Escolher canal por lista assistida (P1)

**Goal**: Admin cadastra fonte selecionando servidor e canal descobertos pelo bot.
**Independent Test**: Com token válido e bot instalado, abrir Fontes, selecionar servidor/canal e salvar fonte sem digitar IDs.

- [x] T007 [US1] Implementar `GET /discovery/guilds` em `backend/src/routes/adminDiscordSync.ts`.
- [x] T008 [US1] Implementar `GET /discovery/guilds/:guildId/channels` em `backend/src/routes/adminDiscordSync.ts`.
- [x] T009 [US1] Atualizar `DiscordSourceList.tsx` para carregar servidores ao abrir o formulário.
- [x] T010 [US1] Atualizar `DiscordSourceList.tsx` para carregar canais ao selecionar servidor.
- [x] T011 [US1] Atualizar criação de fonte por seleção em `DiscordSourceList.tsx` preenchendo `guild_id`, `channel_id` e `channel_name`.

## Phase 4: User Story 2 — Entender falhas de descoberta (P2)

**Goal**: Admin recebe mensagens claras sobre token, instalação do bot, permissões e Discord indisponível.
**Independent Test**: Simular token ausente/inválido ou guild inacessível e confirmar mensagem acionável na UI.

- [x] T012 [US2] Mapear erros Discord para status/mensagens acionáveis em `backend/src/discord/discovery.ts`.
- [x] T013 [US2] Tratar erros de discovery em `backend/src/routes/adminDiscordSync.ts` sem expor token.
- [x] T014 [US2] Exibir estados vazio/erro/carregando em `DiscordSourceList.tsx`.

## Phase 5: User Story 3 — Manter modo manual como escape avançado (P3)

**Goal**: Admin avançado ainda consegue cadastrar por IDs quando necessário.
**Independent Test**: Abrir modo manual, preencher IDs e salvar fonte como antes.

- [x] T015 [US3] Reposicionar campos manuais em área avançada de `DiscordSourceList.tsx`.
- [x] T016 [US3] Manter validação e submit manual existentes em `DiscordSourceList.tsx`.

## Phase 6: Validation

- [x] T017 Atualizar `MAPA_DE_API.md` com rotas de discovery.
- [x] T018 Criar `specs/014-discord-channel-discovery/pr-description.md` com sumário, mudanças, testing evidence e checklist pós-merge.
- [x] T019 Rodar `npm --prefix backend run build` e registrar output literal em sessão.
- [x] T020 Rodar `npm --prefix frontend run build` e registrar output literal em sessão.
- [x] T021 Executar busca final contra vazamento de token/plaintext nos arquivos alterados e registrar evidência em sessão.
- [x] T022 Marcar tasks concluídas em `specs/014-discord-channel-discovery/tasks.md`.

## Dependencies

- Phase 1 bloqueia todas as demais.
- Phase 2 bloqueia US1, US2 e US3.
- US1 entrega o MVP.
- US2 depende dos endpoints de US1.
- US3 pode ser finalizada após o formulário de US1 existir.
- Validation ocorre após US1, US2 e US3.

## Parallel Opportunities

- T003 e T005 podem ser feitos em paralelo após SDD.
- T007 e T008 dependem de T003.
- T009-T011 devem ser sequenciais no mesmo componente.
- T017 e T018 podem ocorrer em paralelo após endpoints implementados.

## Implementation Strategy

1. Entregar cliente Discord + endpoints de discovery.
2. Trocar o formulário principal por seleção assistida.
3. Preservar modo manual como avançado.
4. Fechar docs, builds e busca de segurança.
