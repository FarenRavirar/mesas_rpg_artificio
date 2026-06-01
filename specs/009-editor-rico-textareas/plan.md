# Implementation Plan: Editor Rico em Textareas

**Branch**: `dev` (sem branch dedicada, autorizado pelo mantenedor) | **Date**: 2026-05-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-editor-rico-textareas/spec.md`

## Summary

Mapear todos os pontos do frontend onde usuários inserem texto por `textarea` ou `RichTextArea`, classificar cada ocorrência e substituir por `MarkdownEditor` apenas os campos elegíveis. O componente canônico é `frontend/src/components/MarkdownEditor.tsx` (react-markdown-editor-lite v1.4.2 + markdown-it v14.1.1), confirmado pelo mantenedor. Campos que já usam `RichTextArea` também são candidatos à substituição. A abordagem exige inventário e classificação antes de qualquer patch, preservação de validações existentes, compatibilidade com conteúdo legado e validação responsiva.

## Technical Context

**Language/Version**: TypeScript estrito — frontend React + Vite (Node.js 25.9.0)
**Editor canônico**: `frontend/src/components/MarkdownEditor.tsx` — usa `react-markdown-editor-lite` v1.4.2 e `markdown-it` v14.1.1 (já instalados)
**Editor atual em Descrição da Mesa**: `RichTextArea` (custom, limitado) — candidato a substituição
**Primary Dependencies**: `react-markdown-editor-lite`, `markdown-it`, `@types/markdown-it` — todos presentes em `frontend/package.json`
**Storage**: Sem mudança prevista; conteúdo existente (string) permanece compatível — `MarkdownEditor` aceita e emite `string`
**Testing**: `npm --prefix frontend run build` + validação funcional/manual em Beta em janela anônima quando afetar fluxos reais
**Target Platform**: Web responsivo em desktop e mobile
**Project Type**: Monorepo web app com frontend e backend separados
**Performance Goals**: Editor deve carregar e operar sem degradar formulários afetados
**Constraints**: Inventário completo antes de substituição, preservar validações e limites, mudança mínima por campo
**Scale/Scope**: 10 `<textarea>` nus + 5 campos com `RichTextArea` — todos devem ser inventariados; substituição apenas dos elegíveis

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript estrito**: PASS — `MarkdownEditor` já está tipado; props de integração são `value: string` e `onChange: (text: string) => void`.
- **Normalização de dados de fronteira**: PASS — conteúdo legado (texto puro) é string válida para `MarkdownEditor` sem conversão.
- **Sem mudança de schema sem protocolo**: PASS — não há migration prevista; campos continuam armazenando `string`.
- **Mudança mínima e reversível**: PASS — cada substituição é pontual por campo; `RichTextArea` e `MarkdownEditor` têm interface compatível.
- **UX responsiva**: ATENÇÃO — `react-markdown-editor-lite` tem toolbar que pode quebrar em mobile; validação obrigatória por formulário alterado.
- **Validação funcional em Beta**: PASS — obrigatória quando fluxos reais forem afetados (criação/edição de mesa, perfil, painel).

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
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (arquivos afetados identificados)

```text
frontend/src/
├── components/
│   ├── MarkdownEditor.tsx              ← editor canônico (já existe, não tocar)
│   ├── RichTextArea.tsx                ← editor legado (candidato a desuso após substituição)
│   ├── form-steps/steps/
│   │   ├── StepBasic.tsx               ← description (RichTextArea → MarkdownEditor?)
│   │   └── StepFinal.tsx               ← billing_text, ddal_rules_notes (textarea nu)
│   │                                      rules_notes, synopsis, style_text,
│   │                                      technical_requirements (RichTextArea)
│   ├── SessionRepeater.tsx             ← notes (textarea nu)
│   ├── SystemSuggestionModal.tsx       ← description (textarea nu)
│   ├── ScenarioSuggestionModal.tsx     ← description (textarea nu)
│   └── mestre/
│       └── MestreContactForm.tsx       ← message (textarea nu)
└── pages/
    ├── ProfileEditPage.tsx             ← bio, bio_long (textarea nu)
    ├── PainelMestrePage.tsx            ← gm-bio (textarea nu)
    └── OnboardingPage.tsx              ← onboarding-bio (textarea nu)
```

## Phase 0: Research

Pesquisa consolidada em [research.md](./research.md):

- `MarkdownEditor` identificado como componente canônico (react-markdown-editor-lite, já instalado, não usado em lugar algum);
- `RichTextArea` é editor legado em Descrição da Mesa e outros campos — também candidato à substituição;
- 10 `<textarea>` nus inventariados com arquivo, linha, tela e finalidade;
- 5 campos com `RichTextArea` inventariados como candidatos a upgrade;
- interface de `MarkdownEditor` compatível com formulários React existentes.

## Phase 1: Design & Contracts

Design consolidado em:

- [data-model.md](./data-model.md)
- [quickstart.md](./quickstart.md)

Não há novo contrato público previsto. O diretório `contracts/` documenta ausência de mudança de API — campos continuam sendo `string` no payload.

### Agent context update

AGENTS.md atualizado para apontar `specs/009-editor-rico-textareas/plan.md` como plano ativo.

## Post-Design Constitution Check

- **Mapeamento antes de alteração**: PASS — tasks exigem inventário e classificação completos antes de qualquer patch.
- **Editor único reaproveitado**: PASS — `MarkdownEditor` existente; nenhum editor paralelo criado.
- **Compatibilidade legada**: PASS — quickstart exige salvar/reabrir conteúdo existente.
- **Sem backend/schema por padrão**: PASS — contratos documentam ausência de mudança de API.
- **Beta obrigatório quando fluxo real afetado**: PASS — quickstart e tasks exigem validação.
- **Responsividade**: ATENÇÃO registrada — tasks incluem validação mobile obrigatória por formulário.

## Complexity Tracking

Sem violações constitucionais identificadas. Ponto de atenção: responsividade de `react-markdown-editor-lite` em mobile — mitigado por validação obrigatória por formulário alterado.
