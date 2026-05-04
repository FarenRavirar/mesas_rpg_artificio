# Implementation Plan: Descoberta de Canais Discord

**Branch**: `feat/014-discord-channel-discovery` | **Date**: 2026-05-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/014-discord-channel-discovery/spec.md`

## Summary

Administradores devem cadastrar fontes Discord escolhendo servidor e canal em listas descobertas pelo bot configurado. A implementação adiciona uma pequena camada de cliente REST para a API do Discord, expõe rotas admin de discovery e atualiza a aba Fontes para usar seletores como caminho principal, preservando cadastro manual como modo avançado.

## Technical Context

**Language/Version**: Node.js 25.9.0, TypeScript, React + Vite + TypeScript  
**Primary Dependencies**: Express, Kysely, Zod 4.3.6, React, Tailwind; `fetch` nativo do Node  
**Storage**: PostgreSQL existente; sem nova migration  
**Testing**: `npm --prefix backend run build`, `npm --prefix frontend run build`, validação funcional em Beta  
**Target Platform**: API Node na VM Oracle e frontend Vite em Beta/Produção  
**Project Type**: Monorepo web app com backend/frontend/database  
**Performance Goals**: Descoberta de servidores/canais em uma ação perceptivelmente rápida para uso administrativo  
**Constraints**: Não expor token em plaintext; usar timeout em chamadas Discord; mensagens de erro acionáveis; manter fallback manual  
**Scale/Scope**: Admin interno, poucos servidores/canais por operação; sem cache persistente nesta feature

## Constitution Check

- **Gratuidade/privacidade**: PASS — não amplia coleta de dados além de metadados mínimos de servidores/canais acessíveis ao bot.
- **TypeScript estrito**: PASS — novos payloads passam por tipos e Zod nos limites.
- **Migrations**: PASS — sem alteração de schema.
- **Segredos**: PASS — token só sai de `discord_settings`/env para header Authorization; nunca retorna em HTTP/log.
- **Lazy-load de feature opcional**: PASS — discovery só resolve token e chama Discord em ação admin.
- **Normalização de fronteira**: PASS — respostas Discord e API frontend serão normalizadas antes de estado React.

## Project Structure

### Documentation (this feature)

```text
specs/014-discord-channel-discovery/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/README.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/discord/
├── discovery.ts
├── config.ts
└── index.ts

backend/src/routes/
└── adminDiscordSync.ts

frontend/src/features/discord-sync/
├── api/discordSyncApi.ts
├── components/DiscordSourceList.tsx
└── types.ts

MAPA_DE_API.md
```

**Structure Decision**: Reusar o módulo `backend/src/discord/` como fronteira de integração Discord e manter as rotas dentro de `adminDiscordSync.ts`, que já centraliza o painel Discord Sync.

## Complexity Tracking

Nenhuma violação constitucional identificada.
