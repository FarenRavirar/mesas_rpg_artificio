# 26-04-17_3_execucao-v4-passo4-5.md

## Cabeçalho
- **Data:** 17/04/2026
- **Objetivo:** Executar os Passos 4 e 5 da V4 (`docs/Reformulacao_mestre_v4.md`) sem pular a ordem canônica, aplicando novos componentes e reescritas.

## Vínculos
- **Sessão anterior:** `26-04-17_2_execucao-v4-passo1-3.md`
- **Próxima sessão:** `26-04-17_4_execucao-v4-passo6-7.md` (somente após conclusão + autorização)

## Plano de execução
1. Passo 4: criar os 5 novos componentes (`MestreBio`, `MestreSellingPoints`, `MestreFeaturedTable`, `MestreTablesGrid`, `MestreClosedGroupSection`).
2. Passo 5: reescrever os 7 componentes/página (`MestreHero`, `MestreInsightsSection`, `MestreRecommendationsSection`, `MestreFinalCta`, `MestreSkeleton`, `MestreTablesSection`, `MestrePage`).
3. Ajustar tipagem mínima necessária no contrato de `useMestre.ts` para os campos V4 consumidos pelos novos componentes.
4. Validar frontend por TypeScript (`npx tsc -b --noEmit`).
5. Atualizar `RESUMO_EXECUCAO.md` e `sessoes/index.md`.

## Checklist
- [x] Ler patches da V4 para Passos 4 e 5
- [x] Passo 4 concluído (5 componentes novos)
- [x] Passo 5 concluído (7 arquivos reescritos)
- [x] Contrato `useMestre.ts` compatível com V4
- [x] Validação frontend executada e registrada
- [x] Atualizar `RESUMO_EXECUCAO.md`
- [x] Atualizar `sessoes/index.md`

## Arquivos que serão modificados
- `frontend/src/components/mestre/MestreBio.tsx` (novo)
- `frontend/src/components/mestre/MestreSellingPoints.tsx` (novo)
- `frontend/src/components/mestre/MestreFeaturedTable.tsx` (novo)
- `frontend/src/components/mestre/MestreTablesGrid.tsx` (novo)
- `frontend/src/components/mestre/MestreClosedGroupSection.tsx` (novo)
- `frontend/src/components/mestre/MestreHero.tsx`
- `frontend/src/components/mestre/MestreInsightsSection.tsx`
- `frontend/src/components/mestre/MestreRecommendationsSection.tsx`
- `frontend/src/components/mestre/MestreFinalCta.tsx`
- `frontend/src/components/mestre/MestreSkeleton.tsx`
- `frontend/src/components/mestre/MestreTablesSection.tsx`
- `frontend/src/pages/MestrePage.tsx`
- `frontend/src/hooks/useMestre.ts`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`

## Critério de conclusão explícito
- Patches 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15 e 17 aplicados.
- Frontend validado via TypeScript sem erro.
- Sessão, resumo e índice atualizados.

## Execução incremental

### Concluído
- **Passo 4 (novos componentes):** criados `MestreBio.tsx`, `MestreSellingPoints.tsx`, `MestreFeaturedTable.tsx`, `MestreTablesGrid.tsx` e `MestreClosedGroupSection.tsx` conforme patches 6/7/8/9/11.
- **Passo 5 (reescritas):** reescritos `MestreHero.tsx`, `MestreInsightsSection.tsx`, `MestreRecommendationsSection.tsx`, `MestreFinalCta.tsx`, `MestreSkeleton.tsx`, `MestreTablesSection.tsx` e `MestrePage.tsx` conforme patches 5/3/4/12/17/10/15.
- **Contrato frontend ajustado:** `useMestre.ts` atualizado com `tagline`, `selling_points`, `promo_badge_text` e `closed_group` para compatibilidade de tipagem com os novos componentes.
- **Validação técnica:** `npx tsc -b --noEmit` em `frontend/` sem erros.

### Pendências
- Nenhuma pendência técnica desta sessão. Próximo lote (Passos 6 e 7) depende de autorização.
