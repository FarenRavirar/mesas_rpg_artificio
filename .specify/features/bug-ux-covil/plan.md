# Implementation Plan: Bugfix Covil e Placeholders

## Contexto Técnico
Esta alteração corrige o drift entre os componentes UI do mestre (`TableCardDashboard.tsx`) e a API que os alimenta (`gmPanel.ts`).

1. **BUG-001 (Covil e DDAL):** A rota atual de back-office do mestre pode estar omitindo os campos reais `is_covil` e `is_ddal` ou injetando nullish values. A correção no back-end precisará assegurar que as flags sejam lidas corretamente da tabela `tables` e repassadas fielmente no payload da rota de listagem de mesas do painel do mestre.
2. **BUG-002 (Placeholders de imagem):** A query principal extrai `t.banner_url as image_url`. A correção garantirá a consistência de mapeamento entre o catálogo público e o GM Panel, utilizando a propriedade de imagem correta e real da base de dados (seja `cover_url` ou via fallback) para que o `TableCardDashboard.tsx` renderize a capa adequadamente.
3. **BUG-003 (Enum de preço no publish):** O frontend pode carregar/manter valores legados (`free`/`paid`) para `price_type`, enquanto o backend valida `gratuita`/`paga`. A correção deve normalizar o payload final em create/edit para o enum canônico aceito pela API.
4. **BUG-004 (Badges ocultos na página da mesa):** O componente `TableHero` acopla a renderização de badges ao estado do overlay visual. Quando `showOverlay={false}` (usado na MesaPage para banner limpo), todos os badges (Covil do Lich, DDAL) são ocultados. A correção deve desacoplar badges do overlay, renderizando-os sempre e ajustando apenas o posicionamento baseado no estado do overlay.

## Escopo Modificado
- `backend/src/routes/gmPanel.ts`
- `backend/src/routes/gm.ts`
- `frontend/src/components/TableCard.tsx`
- `frontend/src/components/TableCardDashboard.tsx`
- `frontend/src/components/CertificationBadges.tsx`
- `frontend/src/components/mestre/MestreFeaturedTable.tsx`
- `frontend/src/features/create-table/utils/mapper.ts`
- `frontend/src/features/create-table/hooks/useCreateTableForm.ts`
- `frontend/src/features/table/components/TableHero.tsx` (BUG-004)

**Bugfix**: 2026-04-28 — [BUG-004] Desacoplamento de badges do overlay no TableHero para garantir visibilidade em MesaPage.
**Bugfix**: 2026-04-28 — [BUG-003] Normalização de contrato `price_type` no payload (create/edit) + validação de cobertura de origem.
**Bugfix**: 2026-04-24 — [BUG-001, BUG-002] Refatorado após análise via spec-kit. Scope creep das métricas removido da spec e do plano.
