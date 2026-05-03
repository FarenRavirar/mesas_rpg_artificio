# Sessão 26-04-24_1: Correção do Bug UX - Covil e Placeholders

**Data:** 24/04/2026  
**Objetivo:** Diagnosticar e aplicar patch para os bugs UX relatados na feature `bug-ux-covil` (BUG-001 Covil não refletido, BUG-002 Placeholder indevido).

**Sessão Anterior:** 26-04-23_7_registro-bugs-ux.md
**Próxima Sessão:** 

## Plano de Execução

1. [x] Revisar sessões antigas, movê-las para `encerradas/` e limpar o `index.md`.
2. [x] Atualizar o `.specify/memory/project-state.md` ativando a feature `bug-ux-covil` e a nova sessão `26-04-24_1`.
3. [ ] Investigar runtime e componentes `TableCardDashboard.tsx` e backend `gmPanel.ts` para a falha do Covil e Placeholder.
4. [ ] Aplicar correções via `/speckit.bugfix.patch` ou via edição com evidências na feature `bug-ux-covil`.
5. [ ] Atualizar status e finalizar o ciclo.

## Critério de Conclusão
- Causas dos dois bugs localizadas e documentadas.
- Código alterado e testado.
- `project-state.md` atualizado via `/speckit.status` ou equivalente.
- Nenhuma pendência na checklist e nenhum arquivo modificado parcialmente.

## Auditoria de Governança (/speckit.bugfix.verify)

**RESULTADO: ⚠️ BLOCKED - Falha Crítica de Arquitetura e Governança**

Foram identificadas violações de governança entre os artefatos de spec, plano, tasks e reports de bug:
1. **Status dos Bug Reports**: `BUG-001.md` e `BUG-002.md` continuam abertos e sem `**Status**: Patched` ou data.
2. **Scope Creep em Tasks e Plano**: Inclusão de correção de "Métricas Zeradas" no `plan.md` e `T003` sem a respectiva exigência originária na `spec.md`.
3. **Conflito de Escopo**: `spec.md` define 4 arquivos a serem alterados (incluindo três `.tsx`), mas `plan.md` contradiz afirmando categoricamente que arquivos `.tsx` não serão tocados.
4. **Violação Constitucional (9.5)**: A `spec.md` possui Clarifications geradas por inferência autônoma (ex: "possivelmente de gm_profiles"), o que é estritamente proibido. Decisões de contrato pertencem ao mantenedor.

**Ação:** Sessão travada aguardando revisão e refatoração manual do mantenedor.

## Fechamento
- [ ] Checklist completa
- [ ] Atualizar `.specify/memory/project-state.md`
- [ ] Mover sessão para `encerradas/` (quando autorizado)
- [ ] Atualizar `index.md`
