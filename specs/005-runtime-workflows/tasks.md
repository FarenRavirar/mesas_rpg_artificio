# Tasks: Pacote Operacional Runtime e Workflows

**Input**: Design artifacts from `specs/005-runtime-workflows/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`

## Phase 1: Setup

- [x] T001 Registrar baseline read-only de `mesas-cron`, Node.js e npm em `sessoes/26-04-28_1_fix-publicacao-mesa-opcao.md`
- [x] T002 Confirmar arquivos candidatos e working tree antes de alterações em `specs/005-runtime-workflows/plan.md`

## Phase 2: Foundational

- [x] T003 [P] Inventariar scripts npm de rotinas em `backend/package.json`
- [x] T004 [P] Inventariar comandos de cron em `backend/src/scripts/cronRunner.ts`
- [x] T005 [P] Inventariar runtime Docker em `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.prod.yml` e `docker-compose.beta.yml`
- [x] T006 [P] Inventariar runtime de workflows em `.github/workflows/ci.yml`, `.github/workflows/deploy-beta.yml`, `.github/workflows/deploy-prod.yml` e `.github/workflows/promote-to-prod.yml`

## Phase 3: User Story 1 - Cron Operacional Confiável (P1)

**Goal**: `mesas-cron` não depender de `ts-node` em imagem de produção e parar de reiniciar continuamente.

**Independent Test**: Build backend local passa; comando de cron aponta para artefato compilado; validação remota só ocorre após aprovação explícita.

- [x] T007 [US1] Atualizar scripts `og:worker`, `og:cleanup` e `og:cron` em `backend/package.json` para usar artefatos compilados em `dist/scripts/`
- [x] T008 [US1] Preservar comandos de desenvolvimento TypeScript em `backend/package.json` quando necessário para uso local/manual
- [x] T009 [US1] Validar build backend com `npm run build` em `backend/package.json`
- [x] T010 [US1] Verificar que `backend/dist/scripts/cronRunner.js`, `backend/dist/scripts/processLinkMetadataJobs.js` e `backend/dist/scripts/cleanupLinkMetadataCache.js` são gerados após build
- [x] T011 [US1] Preparar pedido de aprovação para rebuild/recreate remoto do `mesas-cron` em `sessoes/26-04-28_1_fix-publicacao-mesa-opcao.md`
- [x] T012 [US1] Após aprovação explícita, validar `mesas-cron` remoto por logs/status e janela de 30 minutos

## Phase 4: User Story 2 - Runtime Atualizado com Segurança (P2)

**Goal**: Atualização de npm/Node é avaliada e aplicada para a versão mais atual aprovada.

**Independent Test**: Versões antes/depois registradas; builds continuam passando; CI, VM e Dockerfiles apontam para Node 25.9.0/npm 11.13.0.

- [x] T013 [US2] Registrar versões atuais de Node.js/npm da VM e containers em `sessoes/26-04-28_1_fix-publicacao-mesa-opcao.md`
- [x] T014 [US2] Confirmar compatibilidade do npm candidato e registrar decisão em `specs/005-runtime-workflows/research.md`
- [x] T015 [US2] Preparar pedido de aprovação para atualização de npm na VM sem alterar Node major
- [x] T016 [US2] Após aprovação explícita, aplicar atualização npm na VM e registrar output literal
- [x] T017 [US2] Validar serviços principais após atualização npm via comandos read-only remotos

## Phase 5: User Story 3 - Workflows Coerentes com o Runtime (P3)

**Goal**: Workflows relevantes permanecem alinhados a Node 25.9.0/npm 11.13.0 e aos comandos de build/deploy.

**Independent Test**: Cada workflow relevante tem status alinhado/divergente registrado; correções mínimas aplicadas quando necessárias.

- [x] T018 [P] [US3] Revisar `.github/workflows/ci.yml` e registrar status runtime/npm
- [x] T019 [P] [US3] Revisar `.github/workflows/deploy-beta.yml` e registrar status runtime/npm/deploy
- [x] T020 [P] [US3] Revisar `.github/workflows/deploy-prod.yml` e registrar status runtime/npm/deploy
- [x] T021 [P] [US3] Revisar `.github/workflows/promote-to-prod.yml` e registrar status runtime/npm/deploy
- [x] T022 [US3] Aplicar correções mínimas de workflow somente se divergência real for encontrada
- [x] T023 [US3] Validar sintaxe/consistência dos workflows alterados

## Phase 6: Polish & Cross-Cutting

- [x] T024 Atualizar `specs/005-runtime-workflows/quickstart.md` com evidências finais e comandos efetivamente usados
- [x] T025 Atualizar `.specify/memory/project-state.md` com progresso da feature 005
- [x] T026 Atualizar `sessoes/26-04-28_1_fix-publicacao-mesa-opcao.md` com outputs literais, arquivos alterados e próximo passo
- [x] T027 Executar busca final por `ts-node` em caminhos de produção e registrar resultado

## Dependencies

- Phase 1 antes de qualquer alteração.
- Phase 2 antes das user stories.
- US1 antes de US2 para não misturar falha preexistente com atualização npm/Node.
- US2 antes de US3 quando houver alteração efetiva de npm.
- T012 e T016 exigem aprovação explícita do mantenedor antes de comandos mutáveis remotos.

## Parallel Execution Examples

- T003, T004, T005 e T006 podem rodar em paralelo por serem inventários independentes.
- T018, T019, T020 e T021 podem rodar em paralelo por workflow.

## Implementation Strategy

1. Entregar MVP com US1: `mesas-cron` sem dependência de `ts-node` em produção.
2. Validar Node 25.9.0 e npm 11.13.0 em VM, Dockerfiles e workflows.
3. Revisar workflows e ajustar apenas divergências comprovadas.
