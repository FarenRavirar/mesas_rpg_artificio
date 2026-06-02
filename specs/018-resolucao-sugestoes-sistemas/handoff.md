# Handoff - Spec 018

## Proximo chat

Leia:

1. `.specify/memory/project-state.md`
2. `AGENTS.md`
3. `docs/agents/context-capsule.md`
4. `specs/018-resolucao-sugestoes-sistemas/spec.md`
5. `specs/018-resolucao-sugestoes-sistemas/plan.md`
6. `specs/018-resolucao-sugestoes-sistemas/tasks.md`

## Estado atual

Spec 018 ja foi implementada e deployada em Beta na base. Ha uma reformulacao local pendente de commit/deploy para alinhar contratos/opcoes do drawer `Resolver sugestao`.

## Pontos criticos

- Base original foi SDD Completo por migration/API admin/permissao.
- Ajuste atual e SDD Lite: sem migration; muda contrato admin aditivo (`analysis`, `parent_aliases`) e UI do drawer.
- Frontend deve normalizar respostas como `unknown`.
- Validacao funcional so apos deploy Beta e teste do mantenedor.
- Nao inferir traducao/sinonimo por dicionario hardcoded. Traducao automatica so via `name_pt` ou alias catalogado; casos sem dado devem ser resolvidos manualmente no drawer.

## Evidencia de origem

Mantenedor mostrou fila com sugestoes como:

- `Pokemon RPG`
- `On-Two-Six`
- `Demonio: A Queda`
- `D&D 5a edicao 2024`
- `CAIN 1.3`

Problema: "Aprovar/Rejeitar" nao cobre alias, nomes PT/EN, edicoes e duplicados.

## Contratos atuais relevantes

- `GET /api/v1/admin/system-suggestions/:id/candidates`: retorna `suggestion`, `candidates`, `recommended_action` e `analysis`.
- `POST /api/v1/admin/system-suggestions/:id/resolve`:
  - `create_alias`: `target_system_id`, `alias`, `notes`.
  - `create_child`: `node_type`, `parent_id`, `name`, `name_pt`, `description`, `aliases`, `parent_aliases`, `notes`.
  - `create_system`: `name`, `name_pt`, `description`, `aliases`, `edition_name`, `force`, `notes`.
  - `merge_existing`: `target_system_id`, `notes`.
  - `reject`: `reason`.
