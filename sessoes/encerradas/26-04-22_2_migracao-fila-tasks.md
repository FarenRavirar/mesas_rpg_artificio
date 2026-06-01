# 26-04-22_2_migracao-fila-tasks.md

**Data:** 22/04/2026  
**Objetivo:** Migrar FILA_IMPLEMENTACAO.md para tasks.md por feature (Fase 3 da migração Spec-Kit)

---

## Vínculos
- **Sessão Anterior:** `26-04-22_1_migracao-governanca-legacy.md`
- **Próxima Sessão:** N/A

---

## Plano de Execução

1. [ ] Ler `FILA_IMPLEMENTACAO.md` completo
2. [ ] Para cada feature criada na Fase 2, mapear itens da fila correspondentes
3. [ ] Gerar `tasks.md` para cada feature com:
   - Tasks com [ ] / [x] baseadas nos itens da fila
   - ID original da fila preservado como referência
   - Arquivos concretos a modificar por task
   - Dependências entre tasks
   - Status atual (pendente/concluído/descartado)
4. [ ] Identificar itens da fila SEM REQ correspondente
5. [ ] Criar feature `req-orphan/` com tasks.md para itens órfãos
6. [ ] Executar `/speckit.verify-tasks` para detectar phantom completions
7. [ ] Gerar relatório de tarefas fantasma
8. [ ] Atualizar RESUMO_EXECUCAO.md
9. [ ] Atualizar index.md

---

## Checklist de Execução

- [ ] `FILA_IMPLEMENTACAO.md` lido integralmente
- [ ] Mapeamento fila ↔ features concluído
- [ ] `tasks.md` gerados para todas as features
- [ ] Feature `req-orphan/` criada (se necessário)
- [ ] `/speckit.verify-tasks` executado
- [ ] Relatório de phantom completions gerado
- [ ] RESUMO_EXECUCAO.md atualizado
- [ ] index.md atualizado

---

## Início da Execução — 22/04/2026 15:15 BRT

**Passo 1:** Ler `FILA_IMPLEMENTACAO.md` para mapear itens técnicos.

---

## Arquivos que serão criados

- `.specify/features/req-29/tasks.md`
- `.specify/features/deb-06/tasks.md`
- `.specify/features/deb-08/tasks.md`
- `.specify/features/deb-09/tasks.md`
- `.specify/features/ops-06/tasks.md`
- `.specify/features/ops-07/tasks.md`
- `.specify/features/ops-08/tasks.md`
- `.specify/features/deb-01/tasks.md`
- `.specify/features/deb-02/tasks.md`
- `.specify/features/deb-03/tasks.md`
- `.specify/features/deb-04/tasks.md`
- `.specify/features/ops-01/tasks.md`
- `.specify/features/ops-02/tasks.md`
- `.specify/features/ops-03/tasks.md`
- `.specify/features/req-orphan/tasks.md` (se houver itens órfãos)

---

## Critério de Conclusão

- [ ] Cada `req-XX/` tem `tasks.md` gerado
- [ ] Relatório de tarefas fantasma gerado e revisado
- [ ] Itens órfãos da fila identificados e documentados
- [ ] RESUMO_EXECUCAO.md atualizado
- [ ] index.md atualizado

---

## Notas Técnicas

**Formato de task:**
```markdown
- [ ] T001 — Descrição da task (FILA ref: item 113)
  - **Arquivos:** `backend/src/routes/tables.ts`, `frontend/src/components/StepConfig.tsx`
  - **Dependências:** Nenhuma
  - **Status:** Pendente
```

**Itens concluídos na fila:**
```markdown
- [x] T001 — Descrição da task (FILA ref: item 084)
  - **Arquivos:** `frontend/src/components/StepConfig.tsx`
  - **Concluído em:** 16/04/2026
  - **Status:** Implementado
```

**Comando verify-tasks:**
```
/speckit.verify-tasks

Analise todos os tasks.md gerados.
Identifique tasks marcadas como [x] sem evidência de implementação no código.
Gere relatório de "tarefas fantasma" — marcadas como concluídas mas sem código correspondente.
NÃO alterar status automaticamente — apenas reportar para revisão manual.
```
