# Research: Imagens, Banners e Placeholders

## Decision: `tables.banner_url` é a fonte canônica de banner de mesa

**Rationale**: `.specify/arquiteture.md` define `banner_url` como URL canônica da imagem da mesa. As rotas públicas `GET /api/v1/tables` e `GET /api/v1/tables/:slug` já expõem `t.banner_url AS cover_url`, então o frontend público moderno espera `cover_url` como alias de `banner_url`.

**Alternatives considered**:
- Voltar a usar `cover_url` legado como fonte primária: rejeitado porque contraria o contrato atual e explica placeholders em telas que leem o campo legado.
- Manter cada rota com regra própria: rejeitado por produzir inconsistência entre catálogo, mestre e detalhe.

## Decision: URLs manuais externas precisam ser reupadas no backend

**Rationale**: O endpoint atual `POST /api/v1/upload` recebe apenas arquivo multipart e envia ao Cloudinary. O campo manual de `ImageUploader` apenas altera `bannerUrl`; `formStateToPayload` envia `banner_url` e `TableService.prepareTableData` persiste o valor direto. Assim, URLs temporárias continuam como origem final e podem expirar.

**Alternatives considered**:
- Fazer reupload no frontend: rejeitado porque a governança exige upload exclusivamente no backend.
- Bloquear toda URL manual não Cloudinary: rejeitado como medida inicial porque impediria reaproveitamento assistido; melhor aceitar URL e persistir cópia durável.
- Resolver somente via fallback visual: rejeitado porque não preserva a arte original.

## Decision: Centralizar fallback visual no frontend

**Rationale**: `TableCard`, `TableCardDashboard`, `MestreFeaturedTable` e `TableHero` importam `banner_placeholder.webp` e repetem `onError` com `dataset.fallbackApplied`. A mesma regra deve estar em um utilitário/componente canônico para evitar regressões por tela.

**Alternatives considered**:
- Manter duplicação com pequenos patches: rejeitado por repetir o problema já visto em badges antes da centralização.
- Resolver fallback só no backend: rejeitado porque falhas de carregamento do navegador ainda precisam de fallback local.

## Decision: Corrigir perfil público do mestre para usar alias canônico

**Rationale**: `backend/src/routes/gm.ts` seleciona `t.cover_url` para mesas do mestre. Como mesas criadas pelo fluxo atual persistem `banner_url`, a página do mestre pode receber `cover_url` nulo e exibir placeholder mesmo com banner real.

**Alternatives considered**:
- Ajustar apenas `MestreFeaturedTable` para tentar `banner_url`: rejeitado porque o contrato da rota deve entregar a mesma estrutura esperada por `TableCard`/`mapTableToView`.
- Copiar `banner_url` para `cover_url` no banco: rejeitado sem migration/backfill aprovado; alias em query é mais reversível.

## Decision: Auditoria de dados existentes deve ser read-only primeiro

**Rationale**: Há mesas publicadas com URLs externas já persistidas. A primeira etapa segura é listar quantas usam URL não Cloudinary e quais aparecem nulas por divergência `cover_url`/`banner_url`, sem alterar banco.

**Alternatives considered**:
- Backfill imediato: rejeitado porque envolve escrita em banco e pode depender de baixar imagens externas; exige autorização e plano separado.
