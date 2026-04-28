# Correções de UX/UI: Selos e Placeholders (Bugfix)

**ID:** BUGFIX-UX  
**GUT:** 100 (Gravidade: 5, Urgência: 5, Tendência: 4)  
**Status:** ⏳ Especificação (Troubleshooting)  
**Dependências:** Feature legada de Reformulação do Mestre  

---

## Descrição

Trata-se de uma spec dedicada para rastreabilidade de dois bugs identificados no sistema de painel de mestre e renderização de cards:
1. **Covil do Lich (E157):** Correção previamente implementada na renderização de selos não reflete no ambiente de produção nem no de dev.
2. **Placeholder Indevido:** Mesas com imagens válidas em outros contextos (catálogo/detalhe) estão aparecendo com placeholder (imagem de preenchimento padrão) quando exibidas no painel do mestre.

## Contexto

Estes problemas afetam a experiência do mestre e a consistência visual do projeto:
- O E157 foi catalogado por falha no pipeline de queries e renderização, mas mesmo após correções no código, o comportamento em produção/beta permanece quebrado. Pode estar relacionado a cache, falha na entrega de estáticos ou pipeline build.
- O problema do placeholder indevido aparenta ser uma falha pontual de mapeamento de propriedades nos cards específicos do painel do mestre (`TableCardDashboard`), que ignoram as imagens corretas já validadas do backend.

---

## Requisitos e Critérios de Aceitação

- **REQ-01 (Sincronização Covil do Lich):** O selo de "Covil do Lich" e "DDAL" deve ser exibido corretamente nos cards para as mesas com a flag correspondente ativada, refletindo o comportamento já testado e corrigido no código fonte, visível tanto em dev quanto em produção. *(Clarification: Corrigir a injeção de is_covil no payload do GM Panel para garantir que o front-end renderize o selo corretamente)*
- **REQ-02 (Imagens no Painel do Mestre):** O card das mesas no painel do mestre (`TableCardDashboard`) deve renderizar a `banner_url` ou `avatar_url` reais quando existentes, sem recorrer indevidamente ao placeholder se a mesa possui capa válida no catálogo. *(Clarification: Alinhar o mapeamento de imagem do GM Panel para que consuma a mesma coluna validada do catálogo público, substituindo banner_url por cover_url se aplicável)*
- **REQ-03 (Visibilidade de Badges Independente de Overlay):** Badges de certificação (Covil do Lich, DDAL) devem ser visíveis na página de detalhes da mesa (`/mesas/:slug`) independente do estado do overlay visual. O componente `TableHero` deve renderizar badges mesmo quando `showOverlay={false}`, ajustando apenas o posicionamento visual. *(Clarification: Desacoplar renderização de badges do bloco condicional de overlay para garantir visibilidade em todos os contextos de uso)*

**Bugfix**: 2026-04-28 — [BUG-004] Adicionado REQ-03 para corrigir acoplamento indevido entre overlay e badges no TableHero.
**Bugfix**: 2026-04-24 — [BUG-001, BUG-002] Adicionados clarifications pós-diagnóstico de implementation drift no backend.

---

## Casos de Uso (Troubleshooting)

- **Caso E157:** Administrador observa que o código com a tag "Covil do Lich" está atualizado na branch, mas a UI não renderiza a tag no card.
- **Caso Placeholder:** Mestre observa suas próprias mesas no painel com placeholder, enquanto a mesma mesa na home pública possui banner visível. (Ex: mesas da "albuquerque" e "Forgotten Realms").

---

## Ações e Escopo Restrito

Esta feature atua **exclusivamente** nestes escopos reconciliados:
1. `backend/src/routes/gmPanel.ts`
2. `backend/src/routes/gm.ts`
3. `frontend/src/components/TableCard.tsx`
4. `frontend/src/components/TableCardDashboard.tsx`
5. `frontend/src/components/CertificationBadges.tsx`
6. `frontend/src/components/mestre/MestreFeaturedTable.tsx`
7. `frontend/src/features/create-table/utils/mapper.ts`
8. `frontend/src/features/create-table/hooks/useCreateTableForm.ts`
9. `frontend/src/features/table/components/TableHero.tsx`
10. `frontend/src/pages/PainelMestrePage.tsx`

Nenhum outro escopo ou feature funcional será alterado.
