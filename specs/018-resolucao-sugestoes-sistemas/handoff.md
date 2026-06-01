# Handoff - Spec 018

## Proximo chat

Leia:

1. `.specify/memory/project-state.md`
2. `AGENTS.md`
3. `docs/agents/context-capsule.md`
4. `specs/018-resolucao-sugestoes-sistemas/spec.md`
5. `specs/018-resolucao-sugestoes-sistemas/plan.md`
6. `specs/018-resolucao-sugestoes-sistemas/tasks.md`

## Pedido esperado

Implementar fluxo de resolucao de sugestoes de sistemas para evitar redundancia no catalogo.

## Pontos criticos

- SDD Completo.
- Provavel migration.
- Permissao admin.
- API admin nova.
- Frontend deve normalizar respostas como `unknown`.
- Validacao funcional so apos deploy Beta e teste do mantenedor.

## Evidencia de origem

Mantenedor mostrou fila com sugestoes como:

- `Pokemon RPG`
- `On-Two-Six`
- `Demonio: A Queda`
- `D&D 5a edicao 2024`
- `CAIN 1.3`

Problema: "Aprovar/Rejeitar" nao cobre alias, nomes PT/EN, edicoes e duplicados.
