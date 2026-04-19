# Sessão 26-04-19_1 — Validação Manual, Correção de Bugs e Ajustes (Etapa 1)

**Data:** 19/04/2026 03:18 BRT  
**Objetivo:** Executar validação manual online pós-deploy da Etapa 1, registrar bugs com severidade, corrigir regressões e fechar os ajustes pendentes da auditoria de sistemas.

---

## Vínculos

**Sessão Anterior:** `26-04-18_1_auditoria-sistemas-etapa-1.md`  
**Próxima Sessão:** `26-04-19_2_pos-validacao-fechamento-etapa-1.md` (se necessário, para pendências residuais após rodada de correções)

---

## Plano de Execução

1. Validar runtime no ambiente `dev` dos fluxos críticos de sistemas/cenários no `/gestao`.
2. Executar teste E2E manual do fluxo de aprovação de sugestão (`PATCH /api/v1/admin/system-suggestions/:id/approve`).
3. Registrar cada bug encontrado com severidade, evidência, rota afetada e hipótese de causa raiz.
4. Corrigir bugs priorizados (CRÍTICO/ALTO primeiro), com patch mínimo e sem refactor amplo.
5. Revalidar manualmente os fluxos corrigidos + validar TypeScript/build local.
6. Atualizar documentação operacional da rodada (sessão, resumo executivo e índice).

---

## Checklist de Execução

### Preparação
- [ ] Confirmar ambiente beta/dev ativo e acessível (`mesasbeta.artificiorpg.com`)
- [ ] Abrir `docs/auditoria_sistemas_claude.md` na seção de checklist operacional (via grep + range)
- [ ] Definir lista de fluxos de teste antes da execução (sem pular etapas)

### Validação Manual — Gate 4 (Regressão)
- [ ] Acessar `/gestao` logado como admin e validar carregamento sem erro de rota
- [ ] Testar busca por sistema (nome, slug e alias)
- [ ] Testar filtro por tipo (`system`, `edition`, `subsystem`, `variant`)
- [ ] Testar criação de sistema raiz
- [ ] Testar criação de filho via árvore (`+` em node)
- [x] Testar edição no inspector lateral
- [ ] Testar deleção com aviso contextual (`tables_count` e `children_count`)
- [ ] Testar fluxo de cenários na aba correspondente
- [ ] Validar que outras abas não regrediram (Plataformas, Mesas, Sugestões)

### Validação Manual — Fluxo de Aprovação de Sugestão
- [ ] Criar/selecionar sugestão elegível para aprovação
- [ ] Executar aprovação via UI admin
- [ ] Confirmar criação efetiva do sistema no catálogo (`systems`)
- [ ] Confirmar ausência de erro de contrato na resposta

### Triagem e Correção de Bugs
- [x] Registrar bugs encontrados com severidade (CRÍTICO/ALTO/MÉDIO/BAIXO)
- [x] Corrigir bugs CRÍTICO/ALTO na mesma sessão
- [ ] Corrigir bugs MÉDIO quando houver segurança de baixo risco de regressão
- [ ] Documentar explicitamente bugs não corrigidos (motivo + impacto + próximo passo)

### Validação Técnica Pós-Correção
- [ ] `backend`: `npx tsc --noEmit`
- [x] `frontend`: `npx tsc --noEmit`
- [ ] `frontend`: `npm run build`
- [ ] Revalidar no navegador os fluxos impactados pelas correções

### Governança e Fechamento
- [ ] Atualizar esta sessão com evidências (bugs, correções, validações)
- [ ] Atualizar `RESUMO_EXECUCAO.md`
- [ ] Atualizar `sessoes/index.md`

---

## Matriz de Bugs da Sessão (preencher durante execução)

| ID | Severidade | Fluxo afetado | Evidência | Causa raiz (hipótese) | Status |
|---|---|---|---|---|---|
| BUG-001 | ALTO | `/gestao` (CRUD > Sistemas) | Seleção de item em lista longa mantinha inspector preso no topo da viewport | Altura/scroll do workspace sem fallback consistente para header e sem foco de rolagem adequado entre colunas | [x] |
| BUG-002 | ALTO | `/gestao` (CRUD > Sistemas) | Após ajuste inicial, a árvore de sistemas ficou sem rolagem vertical | Container da árvore com `overflow-hidden` bloqueando scroll da lista | [x] |
| BUG-003 | | | | | [ ] |

---

## Arquivos que serão modificados

### Código (conforme bugs encontrados)
- `frontend/src/pages/SystemsAdminView.tsx`
- `frontend/src/features/admin/components/CatalogToolbar.tsx`
- `frontend/src/features/admin/components/EntityInspector.tsx`
- `frontend/src/features/admin/components/CommandPalette.tsx`
- `frontend/src/modules/admin/systems/useSystems.ts`
- `backend/src/routes/systems.ts`
- `backend/src/routes/systemSuggestionsAdmin.ts`

### Documentação e Governança
- `sessoes/26-04-19_1_validacao-manual-bugs-ajustes-etapa-1.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`

---

## Critério de Conclusão

A sessão só pode ser encerrada quando:

1. Todos os itens críticos do Gate 4 estiverem validados manualmente com evidência.
2. Fluxo `approve` estiver validado manualmente com criação efetiva no catálogo.
3. Bugs CRÍTICO/ALTO identificados nesta rodada estiverem corrigidos ou bloqueados com justificativa explícita.
4. TypeScript e build frontend/backend estiverem sem erro.
5. Checklist desta sessão estiver 100% atualizado.
6. `RESUMO_EXECUCAO.md` e `sessoes/index.md` estiverem atualizados.

---
