# Sessão: 26-04-23_3_auditoria-workflows-github-actions-phase6

## Cabeçalho
- **Data:** 23/04/2026
- **Objetivo:** Executar Phase 6 (Validação Off-Happy-Path) da feature 003-auditoria-workflows-actions. Forçar quebras nos workflows, confirmar propagação de falha e coletar Run URLs literais como evidência.
- **Sessão Anterior:** 26-04-23_2_auditoria-workflows-github-actions.md (encerrada)
- **Próxima Sessão:** (A definir)

## Plano de execução
1. [x] **T035:** Preparar cenário e induzir erro em migration gate de `deploy-beta.yml`. Validar status ❌ e salvar evidência.
2. [x] **T036:** Preparar cenário e induzir erro em shellcheck de `ci.yml`. Validar status ❌ e salvar evidência.
3. [x] **T037:** Preparar cenário e induzir erro em preflight de `preflight-prod.yml`. Validar bloqueio de promoção e salvar evidência.
4. [x] **T038:** Validar isolamento de push para dev (somente `deploy-beta.yml` roda).
5. [x] **T039:** Validar isolamento de PR aprovado para main (somente `promote-to-prod.yml` roda).
6. [x] **T040:** Consolidar validações em `validation-evidence.md`.
7. [x] **T041:** Validar SC-003 e SC-004.

## Arquivos que serão modificados
- `.github/workflows/*` (temporariamente, para causar falhas controladas e depois reverter)
- `specs/003-auditoria-workflows-actions/audit/validation-beta-migration-failure.md`
- `specs/003-auditoria-workflows-actions/audit/validation-ci-shellcheck-failure.md`
- `specs/003-auditoria-workflows-actions/audit/validation-preflight-block.md`
- `specs/003-auditoria-workflows-actions/audit/validation-beta-trigger-isolation.md`
- `specs/003-auditoria-workflows-actions/audit/validation-prod-trigger-isolation.md`
- `specs/003-auditoria-workflows-actions/audit/validation-evidence.md`
- `specs/003-auditoria-workflows-actions/tasks.md`

## Critério de conclusão explícito
- Todas as tasks de T035 a T041 devem estar marcadas como concluídas em `tasks.md`.
- Cada validação off-happy-path e isolamento deve possuir documento próprio contendo evidência **literal** (Run URL e trecho de log/status).

## Checklist Base
[ ] Atualizar .specify/memory/project-state.md via /speckit.status (ao final)
[ ] Mover sessão para encerradas/ (quando autorizado)
[ ] Atualizar index.md
