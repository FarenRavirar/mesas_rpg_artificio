# Tasks: 002-fixit-extension (Retroativo)

**Input**: Documentos retroativos em `/specs/002-fixit-extension/`  
**Prerequisites**: `spec.md` (criado), `plan.md` (criado)

**Organização**: Checklist retroativa baseada no que foi efetivamente executado durante integração e estabilização da extensão Fixit.

## Fase 1: Levantamento e Auditoria

- [x] T001 Auditar estrutura da extensão em `.specify/extensions/fixit/` (manifesto, comando, runners e scripts auxiliares)
- [x] T002 Verificar alinhamento com governança local (sem hook de commit automático, sem prompt obrigatório)

---

## Fase 2: Correção Técnica do Runner PowerShell

- [x] T003 Diagnosticar falha de parser em `.specify/extensions/fixit/scripts/powershell/fixit-run.ps1`
- [x] T004 Corrigir fechamento de blocos `try/catch` no Step 8 em `fixit-run.ps1`
- [x] T005 Garantir resolução explícita de `bash.exe`/`$BashDir` para Windows + Git Bash

---

## Fase 3: Validação de Execução Real

- [x] T006 Revalidar execução PowerShell em modo não destrutivo (`FIXIT_AUTO_APPROVE=no`)
- [x] T007 Revalidar execução Bash via Git for Windows (`C:\Program Files\Git\bin\bash.exe`, sem WSL)
- [x] T008 Confirmar comportamento de bloqueio por pré-requisito quando `tasks.md` não possuía tarefas concluídas

---

## Fase 4: Formalização SDD Retroativa (Feature 002)

- [x] T009 Criar `specs/002-fixit-extension/spec.md` retroativo
- [x] T010 Criar `specs/002-fixit-extension/plan.md` retroativo
- [x] T011 Criar `specs/002-fixit-extension/tasks.md` retroativo

---

## Fase 5: Rastreabilidade da Sessão

- [x] T012 Atualizar `sessoes/26-04-22_6_documentacao-retroativa-fixit.md` com evidências finais
- [x] T013 Atualizar `RESUMO_EXECUCAO.md` apontando a sessão 6 como última sessão
- [x] T014 Atualizar `sessoes/index.md` registrando a sessão 6

---

## Dependências e ordem

1. Fase 1 e 2 devem preceder validações finais.
2. Fase 3 valida estabilidade operacional dos runners.
3. Fase 4 formaliza documentação obrigatória SDD.
4. Fase 5 fecha rastreabilidade documental do ciclo.
