# Sessão 26-04-22_5 — Correções Fixit (Integração Specify)

**Data:** 2026-04-22  
**Objetivo:** Corrigir inconsistências da extensão Fixit entre Bash/PowerShell/README e alinhar ao fluxo atual do Specify e às regras de governança do projeto.

## Vínculos
- **Sessão Anterior:** `26-04-22_4_investigacao-selos-ddal-covil.md`
- **Próxima Sessão:** (a definir)

## O que vai fazer
1. Corrigir execução PowerShell (`fixit-run.ps1`) para localizar scripts Bash corretos e remover trava interativa.
2. Corrigir utilitário PowerShell (`fixit-common.ps1`) para uso via dot-source sem erro de módulo.
3. Sincronizar documentação (`README.md`) com o comportamento atual (sem hooks de commit + auto-approval).
4. Remover sugestão proibida de commit em `propose-fix.sh`.
5. Ajustar regex de borda de palavra em `typo-fixer.sh` para compatibilidade prática no ambiente alvo.

## O que precisa ser feito
- Validar que os arquivos estão consistentes entre si:
  - `extension.yml`
  - `commands/speckit.fixit.run.md`
  - scripts Bash/PowerShell
  - `README.md`
- Garantir que o fluxo não contradiz regra local de não sugerir commit sem pedido explícito.

## O que foi feito
- Leitura de governança obrigatória concluída:
  - `RESUMO_EXECUCAO.md`
  - `AGENTS.md`
  - `.specify/memory/constitution.md`
  - `docs/sdd/SESSION_FAILURES_REGISTRY.md`
  - `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md`
- Diagnóstico técnico consolidado dos pontos críticos de integração fixit.

## Plano de Execução
1. Ajustar `fixit-run.ps1` (paths + aprovação + aplicação)
2. Ajustar `fixit-common.ps1` (remover export de módulo inadequado)
3. Ajustar `README.md` (hooks/documentação de aprovação)
4. Ajustar `propose-fix.sh` (remover menção de commit)
5. Ajustar `typo-fixer.sh` (regex)
6. Revisar consistência final entre manifest/comando/scripts/docs
7. Atualizar `RESUMO_EXECUCAO.md`
8. Atualizar `sessoes/index.md`

## Checklist de Execução
- [x] Ajustar `fixit-run.ps1`
- [x] Ajustar `fixit-common.ps1`
- [x] Ajustar `README.md`
- [x] Ajustar `propose-fix.sh`
- [x] Ajustar `typo-fixer.sh`
- [x] Validar consistência final da extensão Fixit
- [x] Atualizar RESUMO_EXECUCAO.md
- [x] Mover sessão para encerradas/ (quando autorizado)
- [x] Atualizar index.md

## Arquivos que serão modificados
- `.specify/extensions/fixit/scripts/powershell/fixit-run.ps1`
- `.specify/extensions/fixit/scripts/powershell/fixit-common.ps1`
- `.specify/extensions/fixit/README.md`
- `.specify/extensions/fixit/scripts/bash/propose-fix.sh`
- `.specify/extensions/fixit/scripts/bash/fix-strategies/typo-fixer.sh`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`
- `sessoes/26-04-22_5_correcoes-fixit-integracao-specify.md`

## Critério de conclusão
- Todos os arquivos-alvo corrigidos e coerentes entre si.
- Nenhuma referência residual a hooks fixit removidos ou aprovação interativa antiga.
- Checklist da sessão 100% marcado como `[x]`.
- `RESUMO_EXECUCAO.md` e `sessoes/index.md` atualizados com a sessão atual.

## Log de Progresso
### 2026-04-22 08:37 UTC-3
- Sessão criada para execução das correções aprovadas pelo usuário.
- Aguardando início dos patches técnicos.

### 2026-04-22 08:42 UTC-3
- `fixit-run.ps1` corrigido: paths para `scripts/bash`, remoção de prompt interativo, aprovação via `FIXIT_AUTO_APPROVE=yes` e aplicação real com `apply-fix.sh`.

### 2026-04-22 08:43 UTC-3
- `fixit-common.ps1` corrigido: removido `Export-ModuleMember` para compatibilidade com carregamento via dot-source.

### 2026-04-22 08:45 UTC-3
- `README.md` atualizado: removida tabela de hooks de commit e alinhado fluxo de execução para auto-approval não interativo.

### 2026-04-22 08:46 UTC-3
- `propose-fix.sh` ajustado: removida menção a commit no plano sugerido.
- `typo-fixer.sh` ajustado: regex de borda de palavra alterada para `\<` e `\>`.

### 2026-04-22 08:58 UTC-3
- `fixit-run.ps1` reforçado: resolução explícita de `bash.exe` do Git for Windows para evitar fallback em WSL.
- `fixit-common.ps1` reforçado: mensagens de status em ASCII e simplificação de `ConvertTo-JsonEscape` para estabilidade de parser.
- Validação executada: `fixit-run.ps1` em `FIXIT_AUTO_APPROVE=no` carregou corretamente e bloqueou por pré-requisito funcional esperado (`No completed tasks in tasks.md`).
- Verificação textual final: sem ocorrências de `before_fixit`, `after_fixit`, `Read-Host`, `read -p` ou `Commit changes` na extensão fixit.

### 2026-04-22 09:00 UTC-3
- Recebidos problemas atuais do IDE para `fixit-run.ps1` (bloco Step 8 / try-catch e warning de variável).
- Iniciada correção pontual no bloco de aplicação para eliminar falsos positivos de parser e remover warning de variável não usada.

### 2026-04-22 09:04 UTC-3
- `fixit-run.ps1` ajustado no Step 8: removida variável intermediária `$ApplyOutput` e execução do `apply-fix.sh` mantida de forma direta.
- Validação de parser PowerShell: `PARSE_OK_FIXIT_RUN`.
- Execução funcional em modo seguro (`FIXIT_AUTO_APPROVE=no`) preservada, bloqueando corretamente por pré-requisito esperado de tarefas não concluídas.

### 2026-04-22 09:05 UTC-3
- Persistência de erros no IDE reportada pelo usuário (`missing }`, `try sem catch`, `ApplyOutput unused`).
- Iniciada nova correção cirúrgica no Step 8 para remover possíveis ambiguidades de parser do editor (estrutura explícita de atribuição/if/try-catch).

### 2026-04-22 09:07 UTC-3
- `fixit-run.ps1` Step 8 reescrito: removido bloco `try/catch` local, substituído por estrutura linear explícita.
- Atribuição de `$FixType` expandida em `if` explícito (sem operador ternário inline).
- Variável `$ApplyOutput` completamente removida do arquivo (confirmado por grep: zero ocorrências).
- Validação funcional: execução em `pwsh` e `powershell.exe` bem-sucedida até bloqueio esperado de pré-requisito.
- Sessão 26-04-22_5 concluída: extensão Fixit integrada ao Specify com paridade Bash/PowerShell, governança SDD respeitada, e compatibilidade Windows/Git Bash garantida.

### 2026-04-22 10:31 UTC-3
- Checklist atualizado retroativamente com item de arquivamento conforme protocolo revisado em `AGENTS.md`.
- Autorização de arquivamento recebida do usuário.
- Sessão movida para `sessoes/encerradas/`.
