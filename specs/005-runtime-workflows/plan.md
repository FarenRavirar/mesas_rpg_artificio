# Implementation Plan: Pacote Operacional Runtime e Workflows

**Branch**: `005-runtime-workflows` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/005-runtime-workflows/spec.md`

## Summary

Corrigir a falha operacional do `mesas-cron`, atualizar a baseline para Node.js 25.9.0 Current, padronizar npm 11.13.0 e revisar workflows para garantir que CI, Docker e VM usam a mesma linha de runtime. A abordagem é incremental: primeiro resolver o cron que já está quebrado, depois validar runtime/npm, por fim revisar e ajustar workflows quando necessário.

## Technical Context

**Language/Version**: TypeScript 5.x; Node.js 25.9.0 Current; npm 11.13.0
**Primary Dependencies**: Node.js, npm, Docker Compose, GitHub Actions, backend Express/Kysely, scripts operacionais em TypeScript  
**Storage**: PostgreSQL 16 em containers remotos (`mesas-db`, `mesas-beta-db`)  
**Testing**: `npm run build` no backend/frontend; validação read-only de containers via SSH; healthchecks Docker; logs do `mesas-cron`; smoke checks HTTP existentes nos workflows  
**Target Platform**: VM Oracle Cloud Ubuntu 24.04; containers Docker `node:25.9.0-alpine` e `nginx:alpine`; GitHub Actions `ubuntu-latest`
**Project Type**: Monorepo web app + API + operação Docker/CI  
**Performance Goals**: `mesas-cron` saudável por pelo menos 30 minutos; builds locais e CI sem regressão; workflows sem divergência de runtime  
**Constraints**: Ações que reiniciem containers, executem build no servidor ou alterem produção exigem aprovação explícita; Docker/Postgres vivem exclusivamente na VM remota; runtime deve permanecer alinhado entre VM, Dockerfiles e workflows
**Scale/Scope**: 1 serviço cron em produção, containers API/frontend beta/prod, Dockerfiles backend/frontend, workflows CI/deploy/promoção e scripts npm relacionados a rotinas operacionais

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Stack travada**: PASS. Plano atualiza a stack travada para Node.js 25.9.0 Current com aprovação explícita do mantenedor.
- **Aprovação explícita para produção**: PASS. Plano separa alterações documentais/código de qualquer ação operacional em produção; restart/build/deploy só com aprovação.
- **Docker e banco na VM remota**: PASS. Toda validação Docker/Postgres será via SSH para a VM, nunca Docker local.
- **Escopo estrito**: PASS. Arquivos candidatos ficam limitados a scripts cron, package scripts, Docker/compose, workflows e artefatos SDD desta feature.
- **Evidência obrigatória**: PASS. Tasks futuras devem registrar comando, output literal e `git status` para transições de estado.
- **Sem migrations/schema**: PASS. Não há mudança de banco planejada.
- **Sem decisão de produto**: PASS. Escopo é operacional, sem alteração de comportamento de mestres/jogadores.

## Project Structure

### Documentation (this feature)

```text
specs/005-runtime-workflows/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── Dockerfile
├── package.json
├── package-lock.json
└── src/scripts/
    ├── cronRunner.ts
    ├── processLinkMetadataJobs.ts
    └── cleanupLinkMetadataCache.ts

frontend/
├── Dockerfile
├── package.json
└── package-lock.json

.github/workflows/
├── ci.yml
├── deploy-beta.yml
├── deploy-prod.yml
└── promote-to-prod.yml

docker-compose.beta.yml
docker-compose.prod.yml
```

**Structure Decision**: Manter a correção centrada em operação/runtime. A implementação pode alterar scripts ou comandos para que rotinas agendadas usem artefatos compilados em produção, enquanto CI/Docker/workflows continuam alinhados em Node 25.9.0.

## Phase 0: Research

Completed in [research.md](./research.md).

## Phase 1: Design

Completed in [data-model.md](./data-model.md) and [quickstart.md](./quickstart.md).

No external API contract is introduced by this feature; `/contracts` is intentionally omitted.

## Post-Design Constitution Check

- **Stack travada**: PASS. Design usa Node 25.9.0 Current.
- **Aprovação explícita para produção**: PASS. Quickstart separa validação local/read-only de ações que exigem aprovação.
- **Docker remoto**: PASS. Validações de containers usam SSH para VM.
- **Escopo estrito**: PASS. Lista de arquivos candidatos está documentada.
- **Evidência obrigatória**: PASS. Quickstart define evidências mínimas para avançar.
- **Sem migrations/schema**: PASS.
- **Sem produto**: PASS.

## Complexity Tracking

Nenhuma violação constitucional identificada.
