# Implementation Plan: Verificação de Sugestões de Sistemas no Admin

**Branch**: `dev` (sem branch dedicada, por autorização do mantenedor em 2026-05-03) | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-verificacao-sugestoes-sistemas-admin/spec.md`

**Note**: Este plano foi gerado como procedimento de IA `/speckit.plan`; nenhum comando shell Spec-Kit foi executado.

## Summary

Verificar ponta a ponta se sugestões criadas por usuários são enviadas, registradas e disponibilizadas para administradores. A decisão de produto de 2026-05-03 tornou Notificações canal obrigatório para toda sugestão criada por usuário; a gestão administrativa permanece como superfície de consulta e tratamento.

## Technical Context

**Language/Version**: TypeScript no frontend e backend Node/TypeScript, conforme arquitetura atual  
**Primary Dependencies**: React, API backend existente, autenticação/admin existente, ferramenta de Notificações existente  
**Storage**: Persistência existente de sugestões/notificações, a confirmar no mapeamento  
**Testing**: validação funcional no Beta com envio real e consulta por admin; build técnico se houver implementação  
**Target Platform**: Web app e painel administrativo  
**Project Type**: Monorepo web app com frontend/backend/database separados  
**Performance Goals**: N/A  
**Constraints**: preservar permissões administrativas, não criar canal paralelo sem decisão, não confirmar falso sucesso ao usuário  
**Scale/Scope**: Fluxos de sugestão de sistemas, cenários e plataformas VTT, gestão administrativa e Notificações relacionadas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Mapeamento antes de correção**: PASS — plano exige fluxo ponta a ponta antes de patch.
- **Permissões administrativas**: PASS — qualquer listagem/notificação deve respeitar admin existente.
- **Normalização de dados de fronteira**: PASS — payloads de sugestão/notificação devem ser tratados com validação antes de uso.
- **Sem alteração de schema sem protocolo**: PASS — migration só será considerada se investigação provar necessidade.
- **Validação em Beta**: PASS — envio real e consulta admin são critérios obrigatórios.

## Project Structure

### Documentation (this feature)

```text
specs/011-verificacao-sugestoes-sistemas-admin/
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
│   ├── pages/           # telas de sugestão, gestão e notificações
│   ├── components/      # formulários, listas e notificações
│   ├── services/        # cliente de API
│   └── types/           # tipos de sugestão/notificação

backend/
├── src/
│   ├── routes/          # rotas de sugestão, admin e notificações
│   ├── services/        # lógica de sugestão/notificação
│   ├── repositories/    # persistência
│   └── validators/      # validação de payload

database/
└── migrations/ ou arquivos existentes # somente se investigação provar necessidade
```

**Structure Decision**: A feature é inicialmente investigativa e pode afetar frontend, backend e integração com Notificações. Alteração de banco não é assumida.

## Phase 0: Research

Pesquisa consolidada em [research.md](./research.md):

- fluxo ponta a ponta de sugestão;
- decisão entre gestão como canal oficial e Notificações como alerta obrigatório;
- classificação de falhas por camada;
- validação funcional com usuário e admin.

## Phase 1: Design & Contracts

Design consolidado em:

- [data-model.md](./data-model.md)
- [quickstart.md](./quickstart.md)
- [contracts/README.md](./contracts/README.md)

Contratos podem precisar ser documentados após mapeamento das rotas existentes. Se houver alteração de contrato, spec/plan devem ser atualizados antes de implementação.

## Post-Design Constitution Check

- **Fluxo mapeado antes de patch**: PASS — tasks exigem inventário de telas, rotas, persistência e permissões.
- **Admin autorizado**: PASS — quickstart exige validação com admin.
- **Notificações definidas**: PASS — Notificações são obrigatórias para toda sugestão criada por usuário.
- **Beta obrigatório**: PASS — quickstart exige envio real no Beta.

## Complexity Tracking

Sem violações constitucionais identificadas.
