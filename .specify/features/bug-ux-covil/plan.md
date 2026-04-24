# Implementation Plan: Bugfix Covil e Placeholders

## Contexto Técnico
Esta alteração corrige o drift entre os componentes UI do mestre (`TableCardDashboard.tsx`) e a API que os alimenta (`gmPanel.ts`). 

1. **BUG-001 (Covil e DDAL):** A rota atual de back-office do mestre pode estar omitindo os campos reais `is_covil` e `is_ddal` ou injetando nullish values. A correção no back-end precisará assegurar que as flags sejam lidas corretamente da tabela `tables` e repassadas fielmente no payload da rota de listagem de mesas do painel do mestre.
2. **BUG-002 (Placeholders de imagem):** A query principal extrai `t.banner_url as image_url`. A correção garantirá a consistência de mapeamento entre o catálogo público e o GM Panel, utilizando a propriedade de imagem correta e real da base de dados (seja `cover_url` ou via fallback) para que o `TableCardDashboard.tsx` renderize a capa adequadamente.

## Escopo Modificado
- `backend/src/routes/gmPanel.ts`
- `frontend/src/components/TableCardDashboard.tsx`

**Bugfix**: 2026-04-24 — [BUG-001, BUG-002] Refatorado após análise via spec-kit. Scope creep das métricas removido da spec e do plano.
