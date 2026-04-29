# Implementation Plan: Revisão Visual e Responsiva do Catálogo

**Branch**: `008-catalogo-painel-ux-bugs` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-catalogo-painel-ux-bugs/spec.md`

**Note**: Este plano foi revisado como procedimento de IA `/speckit.plan`; nenhum comando shell Spec-Kit foi executado.

## Summary

Investigar e corrigir bugs visuais relacionados ao catálogo, com foco no problema de sobreposição de tela, revisão responsiva completa e padronização de menus e filtros com a linguagem visual da gestão de sistemas. A abordagem técnica é mapear primeiro as superfícies do catálogo, comparar o padrão visual existente com a gestão de sistemas e só então aplicar correções incrementais em estrutura, estilos, breakpoints e estados visuais.

## Technical Context

**Language/Version**: TypeScript estrito no frontend React + Vite  
**Primary Dependencies**: React, Vite, CSS/estilos existentes do projeto  
**Storage**: N/A  
**Testing**: build técnico do frontend e validação funcional/manual em Beta em janela anônima  
**Target Platform**: Web responsivo em desktop, tablet e mobile  
**Project Type**: Monorepo web app com frontend e backend separados  
**Performance Goals**: Catálogo deve permanecer fluido, escaneável e sem sobreposição em navegação e redimensionamento  
**Constraints**: Mudança mínima, sem alteração de banco, sem mudança de contrato, preservar busca/filtros atuais  
**Scale/Scope**: Página de catálogo, menus, filtros, cards e estados visuais relacionados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript estrito**: PASS — mudanças devem preservar tipagem atual.
- **Sem mudança de schema sem protocolo**: PASS — não há mudança de banco prevista.
- **Mudança mínima e reversível**: PASS — escopo restrito ao catálogo e seus controles visuais.
- **UX responsiva e Nielsen**: PASS — revisão deve cobrir visibilidade de estado, consistência, prevenção de erro visual, reconhecimento e flexibilidade.
- **Validação funcional em Beta**: PASS — obrigatória em janela anônima para desktop, tablet/mobile e estados do catálogo.

## Project Structure

### Documentation (this feature)

```text
specs/008-catalogo-painel-ux-bugs/
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
│   ├── pages/           # página do catálogo afetada
│   ├── components/      # menus, filtros, cards e estados do catálogo
│   ├── styles/          # estilos globais ou específicos, se aplicável
│   └── utils/           # apenas se houver utilitário visual já usado pelo catálogo
└── package.json
```

**Structure Decision**: A feature deve permanecer no frontend. Backend e banco ficam fora do escopo salvo descoberta documentada de dependência real durante a investigação.

## Phase 0: Research

Pesquisa consolidada em [research.md](./research.md):

- padrões modernos de catálogo e descoberta usados por produtos digitais maduros;
- padronização de menus e filtros com referência interna da gestão de sistemas;
- estratégia de investigação de bugs visuais relacionados antes de patches.

## Phase 1: Design & Contracts

Design consolidado em:

- [data-model.md](./data-model.md)
- [quickstart.md](./quickstart.md)

Não há novo contrato público previsto. O diretório `contracts/` documenta ausência de mudança de API.

## Post-Design Constitution Check

- **Investigação antes de patch**: PASS — tasks exigem mapeamento dos bugs visuais relacionados.
- **Responsivo completo**: PASS — quickstart exige validação em desktop, tablet e mobile.
- **Padronização visual interna**: PASS — gestão de sistemas é referência obrigatória.
- **Sem backend/schema**: PASS — plano não altera persistência.
- **Beta obrigatório**: PASS — validação funcional em Beta está no quickstart e nas tasks.

## Complexity Tracking

Sem violações constitucionais identificadas.
