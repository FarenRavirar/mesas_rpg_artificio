# Feature Specification: Integração da Extensão Spec-Kit Fixit (Backfill Retroativo)

**Feature Branch**: `[002-fixit-extension]`  
**Created**: 2026-04-22  
**Status**: Retroativo (implementação já realizada)  
**Input**: User description: "Formalizar retroativamente a integração do spec-kit-fixit com paridade Bash/PowerShell no Windows e governança SDD"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Executar correção orientada à spec no Windows sem WSL (Priority: P1)

Como mantenedor, quero executar o fluxo de fix (`speckit.fixit.run`) em Windows usando PowerShell + Git Bash nativo, sem dependência de WSL, para corrigir bugs com contexto de spec em ambiente local real.

**Why this priority**: É o caminho crítico para uso diário da extensão pelo mantenedor no ambiente oficial do projeto (Windows).

**Independent Test**: Pode ser testado isoladamente executando o runner PowerShell e o runner Bash (Git for Windows) no mesmo bug descritivo e validando saída de pré-requisitos/contexto.

**Acceptance Scenarios**:

1. **Given** Windows com Git for Windows instalado, **When** `fixit-run.ps1` é executado, **Then** o script resolve `bash.exe` válido e não gera erro de parser.
2. **Given** execução via `bash.exe` do Git for Windows, **When** `fixit-run.sh` é iniciado, **Then** o fluxo de pré-requisitos roda sem invocar WSL.
3. **Given** `tasks.md` sem tarefas concluídas, **When** o fluxo inicia, **Then** a execução é bloqueada com mensagem explícita `No completed tasks in tasks.md`.

---

### User Story 2 - Operar de forma não interativa e aderente à governança local (Priority: P1)

Como mantenedor, quero que o Fixit rode sem prompts interativos e sem automação de commit, para cumprir as regras locais de governança e automação segura.

**Why this priority**: Interatividade e hook de commit entram em conflito direto com a governança petrea do projeto.

**Independent Test**: Pode ser testado isoladamente validando ausência de prompts e comportamento por variável `FIXIT_AUTO_APPROVE`.

**Acceptance Scenarios**:

1. **Given** `FIXIT_AUTO_APPROVE` diferente de `yes`, **When** o fluxo chega ao passo de aplicação, **Then** o script encerra sem aplicar alterações e sem prompt interativo.
2. **Given** documentação da extensão, **When** o mantenedor consulta README e scripts, **Then** não encontra instruções/hook de commit automático.
3. **Given** execução com `FIXIT_AUTO_APPROVE=yes`, **When** estratégias de correção estão disponíveis, **Then** aplicação ocorre sem prompt de confirmação.

---

### User Story 3 - Rastreabilidade SDD retroativa da feature já implementada (Priority: P2)

Como auditor, quero os artefatos `spec.md`, `plan.md` e `tasks.md` da feature 002 preenchidos retroativamente, para garantir trilha SDD completa e auditável.

**Why this priority**: Sem os artefatos, o histórico de decisão e execução fica incompleto, e o próprio pré-requisito operacional do Fixit pode bloquear.

**Independent Test**: Pode ser testado isoladamente confirmando presença dos três arquivos em `specs/002-fixit-extension/` e pelo menos uma task marcada como concluída em `tasks.md`.

**Acceptance Scenarios**:

1. **Given** diretório `specs/002-fixit-extension/`, **When** auditor verifica conteúdo, **Then** encontra `spec.md`, `plan.md` e `tasks.md` coerentes com implementação real.
2. **Given** `check-prerequisites.sh`, **When** processa a feature 002, **Then** encontra spec e tasks válidos com checklist concluída.

---

### Edge Cases

- Runner PowerShell encontra múltiplos caminhos possíveis para `bash.exe` (Program Files e Program Files (x86)).
- `tasks.md` existe, mas sem nenhuma linha `- [x]`.
- Feature directory não é encontrada por branch atual e fallback precisa localizar a mais recente.
- `locate-files.sh` não identifica candidatos em `tasks.md` e fluxo deve seguir com aviso explícito.
- Estratégias de fix não alteram arquivos e fluxo precisa concluir sem erro destrutivo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar o comando `speckit.fixit.run` via `.specify/extensions/fixit/commands/speckit.fixit.run.md`.
- **FR-002**: O runner Bash MUST executar o pipeline em 8 etapas (pré-requisitos, contexto, mapeamento, localização de arquivos, histórico, proposta, auto-approval, aplicação).
- **FR-003**: O runner PowerShell MUST manter paridade funcional com o runner Bash para o mesmo fluxo.
- **FR-004**: O runner PowerShell MUST resolver `bash.exe` do Git for Windows e evitar dependência de WSL para o ambiente padrão do projeto.
- **FR-005**: O fluxo MUST bloquear quando `tasks.md` não possuir nenhuma tarefa concluída (`- [x]`).
- **FR-006**: O fluxo MUST operar sem prompts interativos quando `FIXIT_AUTO_APPROVE` estiver ausente ou diferente de `yes`.
- **FR-007**: A extensão MUST não registrar hooks de commit automático.
- **FR-008**: O contexto MUST carregar, quando disponíveis, `spec.md/specs.md`, `tasks.md`, `plan.md`, `constitution.md`, `SESSION_FAILURES_REGISTRY.md`, sessões e cabeçalhos de `AGENTS.md`/`ARQUITETURA_PROJETO.md`.
- **FR-009**: O `apply-fix.sh` MUST criar backup antes de tentar aplicar estratégias de correção.
- **FR-010**: A feature 002 MUST possuir trilha SDD retroativa com `spec.md`, `plan.md` e `tasks.md` no diretório da feature.

### Key Entities *(include if feature involves data)*

- **Fixit Command Contract**: Descritor do comando (`speckit.fixit.run`) com pré-requisitos e forma de execução por shell.
- **Fixit Runners**: Scripts de orquestração em Bash e PowerShell (`fixit-run.sh`, `fixit-run.ps1`) que coordenam o pipeline.
- **Feature Artifacts (SDD)**: `spec.md`, `plan.md` e `tasks.md` associados à feature ativa usada como contexto de correção.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Execução PowerShell do runner conclui parsing sem erro de bloco (`MissingEndCurlyBrace` ausente).
- **SC-002**: Execução Bash via `C:\Program Files\Git\bin\bash.exe` roda sem acionar WSL.
- **SC-003**: Pré-requisito de tasks incompletas bloqueia de forma explícita e reprodutível quando aplicável.
- **SC-004**: Diretório `specs/002-fixit-extension/` contém os três artefatos obrigatórios SDD preenchidos.
- **SC-005**: `tasks.md` da feature 002 possui ao menos uma tarefa marcada como concluída (`- [x]`) para compatibilidade com o guard de pré-requisito.

## Assumptions

- O ambiente de execução oficial do mantenedor continua sendo Windows com PowerShell e Git for Windows.
- O uso de WSL não é requisito operacional para esta extensão neste repositório.
- O fluxo de fix automático permanece controlado por `FIXIT_AUTO_APPROVE` e não por prompts.
- A formalização retroativa descreve implementação já existente, sem redefinir escopo de produto novo.
