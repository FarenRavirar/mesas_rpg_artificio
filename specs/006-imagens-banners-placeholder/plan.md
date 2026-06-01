# Implementation Plan: Imagens, Banners e Placeholders

**Branch**: `006-imagens-banners-placeholder` | **Date**: 2026-04-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/006-imagens-banners-placeholder/spec.md`

## Summary

Investigar e corrigir o fluxo em que imagens informadas por link direto são salvas como URL final sem reupload para a hospedagem aprovada, causando expiração e fallback para placeholder. Centralizar a resolução de banner/placeholder para que página principal, catálogo, painel do mestre, perfil público do mestre e página da mesa usem a mesma decisão de imagem.

## Technical Context

**Language/Version**: TypeScript estrito; Node.js 25.9.0; React + Vite.  
**Primary Dependencies**: Express, Kysely, Zod, Multer, Cloudinary SDK, React, TanStack Query.  
**Storage**: PostgreSQL 16; campos relevantes em `tables.banner_url`, `tables.banner_crop_data`, `gm_profiles.avatar_url`, `gm_profiles.banner_url` e campos legados `cover_*`.  
**Testing**: `npm --prefix backend run build`, `npm --prefix backend test -- --runInBand`, `npm --prefix frontend run build`, testes frontend quando disponíveis. Validação funcional/manual das telas ocorre somente após deploy do branch `dev` para beta.  
**Target Platform**: Web app em beta/produção com backend na VM Oracle e Docker remoto.  
**Project Type**: Monorepo web app com backend, frontend e database.  
**Performance Goals**: Renderização de cards/listagens sem layout quebrado; reupload de URL externa sem bloquear desnecessariamente fluxo principal além do tempo normal de salvamento.  
**Constraints**: Upload real exclusivamente via backend; não expor deletehash; não hardcodar variáveis Cloudinary; mudança mínima e reversível; não tocar produção sem aprovação explícita.  
**Scale/Scope**: Fluxo de criação/edição de mesa, upload de perfil, catálogo público, home/listagens, página pública do mestre, painel do mestre e página de detalhe da mesa.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Gratuidade/privacidade**: passa; a feature preserva imagens e não amplia coleta de dados.
- **TypeScript estrito**: passa; qualquer helper novo deve ter tipos explícitos e sem `any` implícito.
- **Schema/migrations**: sem migration planejada inicialmente; se auditoria/backfill exigir novo campo, parar e aplicar `migrations_guide.md`.
- **Upload de imagem no backend**: passa com exigência forte; reupload de URL externa deve ocorrer no backend, não no frontend.
- **Cloudinary via env vars**: passa; usar configuração existente `CLOUDINARY_*`, sem hardcode.
- **Contratos públicos**: atenção; `GET /api/v1/gm/:slug` hoje diverge de `GET /api/v1/tables` ao retornar `t.cover_url` em vez de `t.banner_url AS cover_url`.
- **UX/Nielsen**: passa com validação obrigatória nas quatro superfícies afetadas.
- **Escopo estrito**: qualquer arquivo fora da Seção 3 deste plano exige parar e pedir autorização.

## Project Structure

### Documentation (this feature)

```text
specs/006-imagens-banners-placeholder/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── image-upload.md
│   └── banner-resolution.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/
├── routes/
│   ├── upload.ts                 # POST /api/v1/upload; adicionar suporte a URL externa se aprovado
│   ├── gmPanel.ts                # Criação/edição/listagem de mesas do mestre
│   ├── gm.ts                     # Perfil público do mestre; corrigir origem de banner das mesas
│   └── tables.ts                 # Catálogo e detalhe; manter contrato canônico banner_url -> cover_url
├── services/
│   ├── cloudinary.ts             # Upload Cloudinary; reutilizar para arquivo e URL externa
│   └── tableService.ts           # Persistência de banner_url em create/update
├── repositories/
│   └── tableRepository.ts        # Persistência transacional de mesas
└── validators/
    └── tableValidators.ts        # Validação de banner_url e possíveis metadados

frontend/src/
├── assets/
│   └── banner_placeholder.webp
├── components/
│   ├── AvatarUploader.tsx        # Perfil do usuário/mestre; opção "Manter link direto"
│   ├── ImageUploader.tsx         # Entrada de arquivo/URL manual
│   ├── TableCard.tsx             # Card público; consumir helper central
│   ├── TableCardDashboard.tsx    # Card do painel; consumir helper central
│   └── mestre/
│       ├── MestreFeaturedTable.tsx
│       └── MestreHero.tsx
├── features/
│   ├── create-table/
│   │   └── utils/mapper.ts       # Envio de banner_url
│   ├── master/
│   │   └── mappers/masterViewMapper.ts
│   └── table/
│       ├── components/TableHero.tsx
│       └── mappers/tableViewMapper.ts
└── utils/
    └── tableImage.ts             # Novo ponto canônico de resolução de imagem/fallback

database/
└── changelogs.json               # Atualizar se mudança visível for entregue
```

**Structure Decision**: A correção deve separar duas responsabilidades: backend garante que a fonte persistida de imagem seja durável; frontend centraliza somente a decisão de exibição/fallback, sem fazer upload real nem duplicar placeholder.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Nenhuma violação constitucional planejada | N/A | N/A |

## Phase 0: Research Summary

Ver [research.md](research.md). Achados principais:
- Upload por arquivo já vai ao Cloudinary via backend.
- URL manual é salva diretamente em `banner_url`, sem reupload.
- Perfil público do mestre busca `t.cover_url`, mas rotas públicas de mesas usam `t.banner_url AS cover_url`.
- Fallback do placeholder está duplicado em múltiplos componentes.

## Phase 1: Design Summary

Ver [data-model.md](data-model.md), [contracts/image-upload.md](contracts/image-upload.md), [contracts/banner-resolution.md](contracts/banner-resolution.md) e [quickstart.md](quickstart.md).

## Post-Design Constitution Check

- **Upload backend-only**: mantido; contrato novo exige backend para reupload de URL externa.
- **Exceção explícita para perfil**: permitida somente quando o usuário aciona "Manter link direto" de forma consciente; upload automático continua sendo o padrão.
- **Sem exposição de deletehash**: mantido; nenhum contrato público adiciona deletehash.
- **Mudança mínima**: mantida; correções focadas em origem de URL, helper de fallback e endpoint de upload.
- **Sem migration por padrão**: mantido; auditoria de dados existentes será read-only até autorização.
