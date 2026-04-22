# Implementation Plan: 002-fixit-extension (Retroativo)

**Branch**: `[002-fixit-extension]` | **Date**: 2026-04-22 | **Spec**: `./spec.md`  
**Input**: Feature specification from `/specs/002-fixit-extension/spec.md`

## Summary

Formalizar retroativamente a integração da extensão Spec-Kit Fixit já implementada no repositório, consolidando decisões técnicas e evidências de execução para Windows (PowerShell + Git Bash nativo, sem WSL), com aderência à governança SDD local.

## Technical Context

**Language/Version**:
- Bash 5+ (Git for Windows)
- PowerShell 5.1+ / PowerShell 7+

**Primary Dependencies**:
- Scripts shell nativos do repositório
- Git for Windows (`bash.exe`)
- Estrutura Spec Kit (`.specify/extensions/*`, `specs/*`)

**Storage**: N/A (feature de automação/script)

**Testing**:
- Execução real dos runners com bug descritivo em modo não destrutivo
- Verificação de pré-requisitos (`tasks.md` com `[x]`)

**Target Platform**: Windows (ambiente oficial do mantenedor)

**Project Type**: Extensão de automação para workflow SDD

**Performance Goals**:
- Inicialização do fluxo sem bloqueios de parser
- Mensagens de erro explícitas em pré-requisitos

**Constraints**:
- Sem WSL como dependência operacional
- Sem hooks de commit automático
- Sem prompts interativos obrigatórios no fluxo padrão

**Scale/Scope**:
- Escopo limitado à extensão `.specify/extensions/fixit/`
- Formalização documental da feature 002 em `specs/002-fixit-extension/`

## Constitution Check

- ✅ Mudança mínima e reversível
- ✅ Sem alteração de contrato público de API do produto
- ✅ Sem mudança em banco, deploy ou infra de produção
- ✅ Governança local preservada (sem automação de commit)
- ✅ Execução validada com ferramentas do ambiente oficial

## Project Structure

### Documentation (this feature)

```text
specs/002-fixit-extension/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
.specify/extensions/fixit/
├── commands/
│   └── speckit.fixit.run.md
├── extension.yml
├── README.md
└── scripts/
    ├── bash/
    │   ├── fixit-run.sh
    │   ├── check-prerequisites.sh
    │   ├── load-context.sh
    │   ├── map-bug-to-spec.sh
    │   ├── locate-files.sh
    │   ├── propose-fix.sh
    │   └── apply-fix.sh
    └── powershell/
        ├── fixit-run.ps1
        └── fixit-common.ps1
```

**Structure Decision**:
- Manter layout nativo da extensão em `.specify/extensions/fixit/`.
- Usar `specs/002-fixit-extension/` exclusivamente para trilha SDD retroativa.

## Implementação Retroativa Consolidada

1. **Paridade Bash/PowerShell**
   - Pipeline de execução equivalente entre `fixit-run.sh` e `fixit-run.ps1`.
   - Etapas: pré-requisitos → contexto → mapeamento → localização de arquivos → histórico → proposta → auto-approval → aplicação.

2. **Compatibilidade Windows sem WSL**
   - Runner PowerShell com resolução explícita de `bash.exe` do Git for Windows.
   - Validação Bash executada com `& 'C:\Program Files\Git\bin\bash.exe' ...`.

3. **Hardening do runner PowerShell**
   - Correção de estrutura `try/catch` no Step 8 (erro de parser eliminado).
   - Definição de `$BashDir` estabilizada para localizar scripts Bash auxiliares.

4. **Governança local de operação**
   - Fluxo não interativo via `FIXIT_AUTO_APPROVE`.
   - README sem hooks de commit automático.
   - Scripts alinhados para não incentivar commit automático.

5. **Guard de pré-requisitos SDD**
   - Execução bloqueada sem `spec.md`/`tasks.md` válidos.
   - Exige ao menos um `- [x]` em `tasks.md`.

## Validation Evidence (Retroativo)

### Execução PowerShell (real)

```powershell
$env:FIXIT_AUTO_APPROVE='no'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".specify/extensions/fixit/scripts/powershell/fixit-run.ps1" "bug teste governanca"
```

Resultado observado: execução sem erro de parser; bloqueio funcional em pré-requisito quando `tasks.md` não tinha itens concluídos.

### Execução Bash (Git for Windows, sem WSL)

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& 'C:\Program Files\Git\bin\bash.exe' '.specify/extensions/fixit/scripts/bash/fixit-run.sh' 'bug teste governanca'"
```

Resultado observado: execução via Git Bash nativo, com bloqueio funcional igual de pré-requisito (`No completed tasks in tasks.md`) no estado anterior à formalização da feature 002.

## Risks

- **R1**: Feature directory incorreta ser selecionada no fallback por ordenação.
  - **Mitigação**: manter diretório `specs/002-fixit-extension` com artefatos completos e tasks concluídas.

- **R2**: Divergência futura entre runner Bash e PowerShell.
  - **Mitigação**: validar ambos runners em cada manutenção relevante.

- **R3**: Falhas mascaradas por cache de diagnóstico da IDE.
  - **Mitigação**: usar execução real via terminal como fonte de verdade.

## Out of Scope

- Criar novas estratégias de correção automática além das já existentes.
- Alterar workflow de deploy, CI/CD ou banco de dados.
- Expandir escopo da feature para além da formalização e estabilização do runner.
