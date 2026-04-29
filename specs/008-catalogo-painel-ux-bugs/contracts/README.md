# API Contracts: Revisão Visual e Responsiva do Catálogo

## Contract Decision

Esta feature não cria novos endpoints públicos e não altera contratos existentes de API.

## Existing Contract Expectations

### Catálogo

- A interface deve consumir os dados atuais de mesas sem exigir mudança de schema.
- A revisão visual deve preservar busca, filtros e navegação existentes.
- Bugs visuais relacionados devem ser tratados no frontend, salvo descoberta documentada em contrário.

## Non-Goals

- Não alterar autenticação.
- Não alterar permissões.
- Não criar migration.
- Não alterar semântica pública dos payloads.
- Não alterar fluxos fora do catálogo.
