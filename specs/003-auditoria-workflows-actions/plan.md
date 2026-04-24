# Implementation Plan: 003-auditoria-workflows-actions

**Branch**: `[003-auditoria-workflows-actions]` | **Date**: 2026-04-23 | **Spec**: `./spec.md`
**Input**: Feature specification from `/specs/003-auditoria-workflows-actions/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Automatizar uma auditoria completa dos workflows ativos em `.github/workflows/`, classificar achados com severidade e implementar regularizações mínimas/reversíveis para eliminar redundância de disparo, corrida operacional e falhas silenciosas, com validação explícita em cenários off-happy-path.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: YAML (GitHub Actions), Bash POSIX (runner Ubuntu), Node.js 22 (scripts auxiliares)
**Primary Dependencies**: GitHub Actions, `appleboy/ssh-action@v1.0.0`, `ludeeus/action-shellcheck@master`, `reviewdog/action-actionlint@v1`, `peter-evans/*`
**Storage**: Evidências de execução em logs/runs do GitHub Actions + artefatos markdown em `specs/003-auditoria-workflows-actions/` (sem novo banco)
**Testing**: actionlint, shellcheck, validação de DAG de jobs, disparos controlados (`workflow_dispatch`) e cenários induzidos de falha
**Target Platform**: GitHub-hosted runners (`ubuntu-latest`) + VM remota Oracle via SSH para passos de deploy
**Project Type**: Governança CI/CD e regularização operacional de workflows
**Performance Goals**: mesmo contexto de disparo deve resultar em exatamente 1 fluxo canônico; status final deve refletir erro real sem mascaramento
**Constraints**: mudança mínima e reversível; não remover workflow sem mapear consumidores; manter compatibilidade com gates/migrations existentes; sem alteração de contrato de produto
**Scale/Scope**: 9 workflows ativos no diretório raiz de `.github/workflows/` + 2 workflows reutilizáveis (`workflow_call`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Gate de escopo: auditoria limitada aos workflows já existentes em `.github/workflows/`.
- ✅ Gate de reversibilidade: toda correção planejada deve ser atômica e revertível por arquivo.
- ✅ Gate de evidência: nenhuma task avança sem output literal e referência de run/log.
- ✅ Gate de segurança operacional: sem bypass de falhas (`continue-on-error` em etapas críticas, `|| true` em validações críticas).
- ✅ Gate de responsabilidade: limites explícitos entre CI, deploy beta/prod e automações auxiliares.
- ✅ Re-check pós-design: sem violações constitucionais abertas nesta fase de planejamento.

## Project Structure

### Documentation (this feature)

```text
specs/003-auditoria-workflows-actions/
├── plan.md              # Este arquivo
├── research.md          # Decisões técnicas da Fase 0
├── data-model.md        # Entidades e relações da auditoria
├── quickstart.md        # Procedimento operacional de execução/validação
├── contracts/
│   └── workflow-audit.openapi.yaml
└── tasks.md             # Próxima fase (/speckit.tasks)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Adjust the structure below based on which modules this feature affects.
  Remove sections that are not relevant to this specific feature.
-->

```text
.github/
└── workflows/
    ├── ci.yml
    ├── deploy-beta.yml
    ├── deploy-prod.yml
    ├── promote-to-prod.yml
    ├── preflight-prod.yml
    ├── docker-cleanup.yml
    ├── sync-arquitetura.yml
    ├── _enforce-migration-dir.yml
    └── _lint-shell.yml

scripts/
└── deploy/
    └── preflight_prod.sh

sessoes/
└── 26-04-23_2_auditoria-workflows-github-actions.md
```

**Structure Decision**: Feature de governança operacional com impacto restrito em workflows de CI/CD. Não altera código de produto (frontend/backend) nesta fase; prioriza inventário, diagnóstico, regularização mínima e validação com evidência.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Nenhuma nesta fase | N/A | N/A |
