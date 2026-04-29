# Implementation Plan: Editor Rico em Textareas

**Branch**: `009-editor-rico-textareas` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-editor-rico-textareas/spec.md`

**Note**: Este plano foi gerado como procedimento de IA `/speckit.plan`; nenhum comando shell Spec-Kit foi executado.

## Summary

Mapear todos os pontos do frontend onde usuários inserem texto por `textarea`, classificar cada ocorrência e substituir por editor rico apenas os campos elegíveis, usando como referência a ferramenta já existente em Descrição da Mesa. A abordagem técnica exige inventário antes de patch, preservação de validações existentes, compatibilidade com conteúdo legado e validação responsiva.

## Technical Context

**Language/Version**: TypeScript estrito no frontend React + Vite  
**Primary Dependencies**: React, Vite, editor rico já usado em Descrição da Mesa  
**Storage**: Sem mudança prevista; conteúdo existente deve permanecer compatível  
**Testing**: build técnico do frontend e validação funcional/manual em Beta em janela anônima quando afetar fluxos reais  
**Target Platform**: Web responsivo em desktop e mobile  
**Project Type**: Monorepo web app com frontend e backend separados  
**Performance Goals**: Editor deve carregar e operar sem degradar formulários afetados  
**Constraints**: Mapeamento completo antes de substituição, preservar validações e limites, mudança mínima por campo  
**Scale/Scope**: Todos os usos de `textarea` no frontend, com substituição apenas dos elegíveis

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript estrito**: PASS — componentes e props devem permanecer tipados.
- **Normalização de dados de fronteira**: PASS — conteúdo legado deve ser tratado sem assumir formato novo não validado.
- **Sem mudança de schema sem protocolo**: PASS — não há migration prevista.
- **Mudança mínima e reversível**: PASS — cada substituição deve ser rastreável por campo.
- **UX responsiva**: PASS — editor deve funcionar em desktop e mobile.
- **Validação funcional em Beta**: PASS — obrigatória quando fluxos reais forem afetados.

## Project Structure

### Documentation (this feature)

```text
specs/009-editor-rico-textareas/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/      # editor rico existente, inputs e formulários
│   ├── pages/           # páginas com formulários contendo textareas
│   ├── features/        # módulos de domínio com campos longos
│   ├── hooks/           # hooks de formulário, se aplicável
│   ├── types/           # tipos de conteúdo e props do editor
│   └── utils/           # normalização/conversão se necessária
└── package.json
```

**Structure Decision**: A feature deve reaproveitar o editor existente de Descrição da Mesa. Criar editor paralelo é fora de escopo salvo justificativa documentada.

## Phase 0: Research

Pesquisa consolidada em [research.md](./research.md):

- inventário obrigatório de `textarea` antes da substituição;
- critérios de elegibilidade para editor rico;
- compatibilidade com conteúdo legado e validações existentes;
- responsividade e UX do editor em múltiplos formulários.

## Phase 1: Design & Contracts

Design consolidado em:

- [data-model.md](./data-model.md)
- [quickstart.md](./quickstart.md)

Não há novo contrato público previsto. O diretório `contracts/` documenta ausência de mudança de API por padrão.

## Post-Design Constitution Check

- **Mapeamento antes de alteração**: PASS — tasks exigem inventário completo.
- **Editor único reaproveitado**: PASS — plano impede editor paralelo sem justificativa.
- **Compatibilidade legada**: PASS — quickstart exige salvar/reabrir conteúdo existente.
- **Sem backend/schema por padrão**: PASS — contratos documentam ausência de mudança.
- **Beta obrigatório quando fluxo real afetado**: PASS — quickstart e tasks exigem validação.

## Complexity Tracking

Sem violações constitucionais identificadas.
