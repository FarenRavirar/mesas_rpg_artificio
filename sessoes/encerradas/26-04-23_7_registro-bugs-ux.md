# 23-04-2026 — Registro de Bugs: Covil do Lich e Placeholder de Mestre

**Objetivo:** Registrar formalmente 2 erros técnicos reportados (Covil do Lich em dev/produção e placeholder indevido no perfil do mestre) via workflow `speckit.bugfix.report`, para avaliação e diagnóstico futuro, garantindo rastreabilidade SDD.
**Sessão Anterior:** [26-04-23_6_investigacao-forense-promocao-producao.md](26-04-23_6_investigacao-forense-promocao-producao.md)
**Próxima Sessão:** A definir

## Plano de execução
1. [x] Criar e inicializar arquivo da sessão atual.
2. [x] Inicializar diretório de spec para a feature de Correções UX/UI (`specs/bug-ux-covil/`).
3. [x] Criar arquivo `spec.md` base via `/speckit.specify` para suportar as correções dos componentes `PainelMestrePage`, `TableCard` e rotas correspondentes, baseando-se no problema reportado (E157 já conhecido).
4. [x] Executar `/speckit.bugfix.report` para documentar o problema 1 (Covil do Lich: fix não refletido).
5. [x] Executar `/speckit.bugfix.report` para documentar o problema 2 (Placeholder indevido no perfil do mestre).
6. [x] Atualizar o catálogo de memória `.specify/memory/errors.md` se existirem desdobramentos adicionais do E157.
7. [x] Atualizar índice de sessões (`sessoes/index.md`).
8. [x] Atualizar `.specify/memory/project-state.md` refletindo os bug reports criados.

## Checklist de fechamento
- [x] Especificação base criada.
- [x] Relatórios de erro gerados via `speckit.bugfix.report` para os 2 problemas.
- [x] Rastreabilidade garantida contra o E157 ou novos IDs documentados.
- [x] `sessoes/index.md` atualizado.
- [x] `project-state.md` atualizado.
- [x] `[ ] Atualizar .specify/memory/project-state.md via /speckit.status`
- [ ] `[ ] Mover sessão para encerradas/ (quando autorizado)`
- [x] `[ ] Atualizar index.md`

## Arquivos que serão modificados
- `sessoes/26-04-23_7_registro-bugs-ux.md`
- `sessoes/index.md`
- `.specify/memory/project-state.md`
- `.specify/features/004-bugfixes-ux/spec.md` (ou diretório correspondente criado via `speckit.specify`)
- `.specify/features/004-bugfixes-ux/bugs/BUG-001.md`
- `.specify/features/004-bugfixes-ux/bugs/BUG-002.md`

## Critério de conclusão explícito
Os 2 erros técnicos devem estar registrados oficialmente como BUG reports em uma estrutura de spec válida, devidamente rastreáveis e mapeados no projeto, sem iniciar a resolução no código.
