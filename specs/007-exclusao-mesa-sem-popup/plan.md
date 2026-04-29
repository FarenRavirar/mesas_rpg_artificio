# Implementation Plan: Exclusão de Mesa Sem Pop-up

**Branch**: `feat/007-exclusao-mesa-sem-popup` | **Date**: 2026-04-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/007-exclusao-mesa-sem-popup/spec.md`

## Summary

Substituir os fluxos de exclusão de mesa baseados em `confirm`, `prompt` e `alert` por confirmação inline integrada à página. A solução manterá os endpoints e permissões existentes, exigirá uma segunda ação consciente, mostrará a mesa afetada, bloqueará confirmação duplicada durante processamento e exibirá sucesso/erro via feedback de página já usado no app.

## Technical Context

**Language/Version**: TypeScript estrito; Node.js 25.9.0; React + Vite.  
**Primary Dependencies**: React, react-hot-toast, lucide-react, Express/Kysely existentes no backend.  
**Storage**: PostgreSQL 16, sem alteração de schema.  
**Testing**: `npm --prefix frontend run build`; busca final por `confirm`, `prompt` e `alert` nos fluxos de exclusão de mesa alterados; validação funcional real após deploy do branch `dev` para Beta.  
**Target Platform**: Web app em desktop/mobile, Beta e Produção por fluxo `feat/*` -> `dev` -> `main`.  
**Project Type**: Monorepo web app com backend, frontend e database.  
**Performance Goals**: Interação instantânea sem navegação intermediária; confirmação inline sem deslocamento incoerente de layout em cards/listas.  
**Constraints**: Sem pop-up/modal para confirmação de exclusão de mesa; sem alterar regras de permissão; sem migration; feedback dentro da página; mudança mínima e reversível.  
**Scale/Scope**: Fluxos de exclusão de mesa no painel do mestre, detalhe/preview da mesa e gestão administrativa de mesas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Gratuidade/privacidade**: passa; não amplia coleta de dados.
- **TypeScript estrito**: passa; componente novo deve usar props tipadas sem `any`.
- **Schema/migrations**: passa; nenhuma alteração de banco planejada.
- **Permissões atuais**: passa; endpoints `DELETE` existentes serão preservados.
- **UX/Nielsen**: passa com atenção a prevenção de erro, visibilidade de status, controle/cancelamento e mensagens claras.
- **Escopo estrito**: qualquer arquivo fora da Seção 3 exige parar e pedir autorização.

## Project Structure

### Documentation (this feature)

```text
specs/007-exclusao-mesa-sem-popup/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── inline-delete-confirmation.md
├── tasks.md
└── pr-description.md
```

### Source Code (repository root)

```text
frontend/src/
├── components/
│   ├── InlineDeleteConfirmation.tsx       # Novo componente compartilhado de confirmação inline
│   └── TableCardDashboard.tsx             # Usar confirmação inline no card do painel
├── features/table/
│   ├── components/TableActionPanel.tsx    # Substituir util de pop-up por confirmação inline na página da mesa
│   └── utils/uiHelpers.ts                 # Remover handler de exclusão baseado em confirm/prompt/alert
└── pages/
    ├── PainelMestrePage.tsx               # Adaptar estado/handler de exclusão para confirmação inline
    └── GestaoPage.tsx                     # Substituir confirmação de exclusão de mesa administrativa por inline

database/
└── changelogs.json                        # Atualizar por mudança visível para mestres/usuários finais
```

**Structure Decision**: Centralizar a confirmação visual em `InlineDeleteConfirmation.tsx` e manter cada tela responsável apenas pelo endpoint atual e pelo refresh pós-sucesso. Backend não muda porque a feature substitui a camada de confirmação, não a autorização nem a remoção real.

## Phase 0: Research Summary

Ver [research.md](research.md). Decisões principais:
- Usar confirmação inline expansível junto ao botão destrutivo, sem `window.confirm`, `prompt`, `alert` ou modal.
- Exigir segunda ação explícita no botão final "Excluir definitivamente".
- Manter `toast` como feedback de página para sucesso/erro, por já ser padrão local.
- Preservar endpoints `DELETE /api/v1/gm/tables/:id` e `DELETE /api/v1/admin/tables/:id`, selecionando a rota conforme o contexto que habilitou a gestão na tela.

**Bugfix**: 2026-04-29 — BUG-001 `TableActionPanel` recebe o escopo da exclusão para usar endpoint GM quando o usuário é dono da mesa e endpoint admin quando a ação vem de usuário administrador.

## Phase 1: Design Summary

Ver [data-model.md](data-model.md), [contracts/inline-delete-confirmation.md](contracts/inline-delete-confirmation.md) e [quickstart.md](quickstart.md).

## Post-Design Constitution Check

- **Sem pop-up**: passa; contrato proíbe `confirm`, `prompt`, `alert` e modal no fluxo de exclusão de mesa.
- **Segurança contra clique acidental**: passa; a primeira ação apenas abre a confirmação, a segunda executa o `DELETE`.
- **Permissões preservadas**: passa; endpoints existentes continuam sendo a barreira de autorização.
- **Mobile/desktop**: passa; confirmação inline usa layout responsivo e ações empilháveis em telas estreitas.
- **Sem migration**: passa; estado de confirmação é temporário no frontend.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Nenhuma violação constitucional planejada | N/A | N/A |
