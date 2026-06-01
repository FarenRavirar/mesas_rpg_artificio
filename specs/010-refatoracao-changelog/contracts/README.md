# API Contracts: Refatoração do Changelog

## Contract Decision

Esta feature não cria novos endpoints públicos e não altera contratos existentes de API.

## Existing Contract Expectations

- `database/changelogs.json` deve continuar no formato consumido atualmente pelo app.
- Cada entrada deve preservar os campos esperados: `id`, `title`, `body`, `type`, `published` e `created_at`.
- A consolidação não deve exigir mudança no componente visual do changelog.

## Content Compatibility Expectations

- Entradas publicadas devem ser compreensíveis para usuários finais.
- Deve haver no máximo uma entrada publicada por data de calendário.
- Mudanças visíveis ao usuário podem ser unificadas em uma mesma entrada do dia.

## Non-Goals

- Não criar novo endpoint.
- Não alterar componente visual do changelog por padrão.
- Não alterar schema do JSON.
- Não publicar log técnico interno.
