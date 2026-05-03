# Fase 8 — Etapa 2: Validação de Workflows SDD

**Data:** 2026-04-22  
**Sessão:** `26-04-22_16-18_migracao-sdd-completa`  
**Escopo:** Validar 5 workflows principais do sistema SDD quanto a documentação, descoberta via `AGENTS.md`, clareza de fluxo e exemplos.

---

## 1) Workflow de Criação de Feature

**Fluxo esperado:** `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`

### Evidências
- Documentação em `docs/sdd/README.md`:
  - Sequência cronológica explícita (linhas 17-43)
  - Descrição individual de cada comando (linhas 20-43)
- Referência em `AGENTS.md`:
  - Tabela de comandos/extensões (linhas 417-433)
  - Comandos core listados (linhas 436-441)

### Validação de critérios
- [x] Documentação existe em `docs/sdd/README.md`
- [x] Referenciado em `AGENTS.md`
- [x] Cada comando tem descrição clara
- [x] Ordem de execução explícita
- [ ] Exemplo prático explícito de ponta a ponta

**Status:** ⚠️ **PARCIAL** (gap de exemplo prático explícito)

---

## 2) Workflow de Correção de Bugs

**Fluxo esperado:** `/speckit.bugfix.report` → `/speckit.bugfix.patch` → `/speckit.bugfix.verify`

### Evidências
- Documentação em `docs/sdd/BUGFIX_EXTENSION.md` (linhas 22-121, 136-152)
- Referência em `AGENTS.md`:
  - Tabela de extensões (linha 427)
  - Mapeamento de documentação (linha 470)
- Lookup obrigatório em `.specify/memory/errors.md`:
  - report (linha 29)
  - patch (linha 50)
- Fluxo `NEW_ERROR_PENDING_SYNC`:
  - patch (linhas 68-70)
  - verify (linha 110)
- Exemplo prático disponível:
  - `.specify/features/ops-08/bugs/BUG-001.md` (status `Patched`, lookup `E103`)

### Validação de critérios
- [x] Documentação existe em `docs/sdd/BUGFIX_EXTENSION.md`
- [x] Referenciado em `AGENTS.md`
- [x] Lookup obrigatório em `.specify/memory/errors.md` documentado
- [x] Fluxo `NEW_ERROR_PENDING_SYNC` claro
- [x] Exemplo prático disponível (BUG-001)

**Status:** ✅ **OK**

---

## 3) Workflow de Status Dinâmico

**Comando esperado:** `/speckit.status`

### Evidências
- Documentação em `docs/sdd/STATUS_EXTENSION.md` (linhas 25-127, 192-200)
- Referência em `AGENTS.md`:
  - Tabela de extensões (linha 428)
  - Mapeamento de documentação (linha 471)
- Dashboard de estado explicado em detalhes:
  - Estrutura do output (linhas 33-79)
  - Detecção de fase (linhas 118-127)

### Validação de critérios
- [x] Documentação existe em `docs/sdd/STATUS_EXTENSION.md`
- [x] Referenciado em `AGENTS.md`
- [ ] Geração de `.specify/memory/project-state.md` documentada explicitamente
- [x] Dashboard de estado explicado
- [ ] Quando usar no fim de sessão explicitamente documentado

**Status:** ⚠️ **PARCIAL** (faltam pontos de integração com memória dinâmica do projeto)

---

## 4) Workflow de Retrospectiva

**Comando esperado:** `/speckit.retro.run`

### Evidências
- Documentação em `docs/sdd/RETRO_EXTENSION.md` (linhas 105-141, 199-212)
- Referência em `AGENTS.md`:
  - Tabela de extensões (linha 432)
  - Mapeamento de documentação (linha 475)
- Quando usar está claro:
  - Pós-merge, fim de sprint/release, uso periódico (linhas 136-141, 201-207)

### Validação de critérios
- [x] Documentação existe em `docs/sdd/RETRO_EXTENSION.md`
- [x] Referenciado em `AGENTS.md`
- [ ] Atualização de `project-state.md` + `session-log.md` documentada
- [ ] Detecção de phantom completions explicada
- [x] Quando usar está claro

**Status:** ⚠️ **PARCIAL** (documentação local não cobre integrações esperadas pelo projeto)

---

## 5) Workflow de Reconciliação

**Comando esperado:** `/speckit.reconcile.run`

### Evidências
- Documentação em `docs/sdd/RECONCILE_EXTENSION.md`:
  - Objetivo de fechar drift (linhas 10-13)
  - Workflow em 5 steps (linhas 41-94)
  - Quando usar (linhas 136-142)
- Referência em `AGENTS.md`:
  - Tabela de extensões (linha 426)
  - Mapeamento de documentação (linha 469)

### Validação de critérios
- [x] Documentação existe em `docs/sdd/RECONCILE_EXTENSION.md`
- [x] Referenciado em `AGENTS.md`
- [x] Detecção de drift entre spec e implementação documentada
- [x] Quando usar está claro

**Status:** ✅ **OK**

---

## Matriz Consolidada

| Workflow | Docs Base | Referência em AGENTS | Clareza de Fluxo | Exemplo Prático | Status |
|---|---|---|---|---|---|
| Criação de Feature | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Correção de Bugs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Status Dinâmico | ✅ | ✅ | ✅ | N/A | ⚠️ |
| Retrospectiva | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Reconciliação | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Gaps Identificados

1. `docs/sdd/README.md` não traz um exemplo prático explícito de ponta a ponta para criação de feature (apenas descrição sequencial).
2. `docs/sdd/STATUS_EXTENSION.md` não documenta explicitamente a geração/atualização de `.specify/memory/project-state.md` no contexto deste projeto.
3. `docs/sdd/STATUS_EXTENSION.md` não explicita uso de `/speckit.status` no **fim de sessão**.
4. `docs/sdd/RETRO_EXTENSION.md` não documenta atualização de `.specify/memory/project-state.md` + `.specify/memory/session-log.md`.
5. `docs/sdd/RETRO_EXTENSION.md` não explica relação com detecção de phantom completions (via `verify-tasks`).

---

## Recomendações de Correção

1. **README.md (SDD):** incluir bloco "Exemplo rápido" com sequência completa para uma feature real do projeto.
2. **STATUS_EXTENSION.md:** adicionar seção "Integração com memória dinâmica local" cobrindo `project-state.md` e gatilhos de uso (início e fim de sessão).
3. **RETRO_EXTENSION.md:** adicionar seção "Integração operacional local" com atualização de `project-state.md` e `session-log.md`.
4. **RETRO_EXTENSION.md:** adicionar nota explícita de complementaridade com `/speckit.verify-tasks` para phantom completions.

---

## Conclusão da Etapa 2 (estado atual)

Checklist da etapa:
- [x] 5 workflows principais validados
- [x] Documentação de cada workflow verificada
- [x] Referências em `AGENTS.md` confirmadas
- [x] Gaps identificados e documentados
- [x] Relatório de validação criado
- [x] Sessão atualizada com fechamento final da etapa
