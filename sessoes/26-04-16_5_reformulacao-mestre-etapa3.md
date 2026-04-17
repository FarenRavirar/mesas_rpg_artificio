# 26-04-16_5_reformulacao-mestre-etapa3.md

## Cabeçalho
- **Data:** 16/04/2026
- **Objetivo:** Iniciar a Etapa 3 da reformulação do perfil público de mestre com foco em backend/contrato da rota pública e rastreabilidade documental.

## Vínculos
- **Sessão anterior:** `26-04-16_4_reformulacao-mestre-etapa2.md`
- **Próxima sessão:** a definir

## Plano de execução
1. Abrir sessão da Etapa 3 e registrar escopo operacional.
2. Consolidar diagnóstico do delta técnico (API/contrato/dados) já implementado vs pendente.
3. Validar se existe ajuste de backend estritamente necessário para contrato público (`/api/v1/gm/:slug` e `/api/v1/gm/:slug/insights`).
4. Aplicar apenas ajustes mínimos claramente definidos no diagnóstico.
5. Validar impacto em consumidores ativos (especialmente `MestrePage` e `PainelMestrePage`).
6. Atualizar documentação impactada por delta (`MAPA_DE_API.md`, `docs/Reformulacao_mestre.md`, `RESUMO_EXECUCAO.md`).
7. Atualizar `sessoes/index.md`.

## Checklist
- [x] Abrir `sessoes/26-04-16_5_reformulacao-mestre-etapa3.md`
- [x] Consolidar diagnóstico inicial do delta técnico
- [ ] Confirmar escopo exato de implementação da Etapa 3
- [ ] Implementar ajustes mínimos de backend/contrato (se houver pendência real)
- [ ] Validar consumidores do contrato público (visitante/owner/admin)
- [ ] Atualizar `MAPA_DE_API.md` (apenas se houver delta real)
- [ ] Atualizar `docs/Reformulacao_mestre.md`
- [ ] Atualizar `RESUMO_EXECUCAO.md`
- [ ] Atualizar `sessoes/index.md`

## Arquivos que serão modificados
- `sessoes/26-04-16_5_reformulacao-mestre-etapa3.md`
- `backend/src/routes/gm.ts` (somente se diagnóstico confirmar pendência)
- `backend/src/routes/gmPanel.ts` (somente se diagnóstico confirmar pendência)
- `MAPA_DE_API.md` (somente se diagnóstico confirmar pendência)
- `docs/Reformulacao_mestre.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`

## Critério de conclusão explícito
- Delta técnico da Etapa 3 fechado com evidência em código e contrato.
- Nenhuma pendência de backend/contrato público de mestre permanece sem classificação.
- Documentação impactada sincronizada com o estado real.
- Sessão registrada e indexada com checklist 100% concluída.

## Diagnóstico do delta técnico (inicial)

### Estado confirmado como já implementado
- `backend/src/routes/gm.ts` já usa `optionalAuth` em `GET /api/v1/gm/:slug`.
- Payload público já expõe `viewer_context` (`is_owner`, `is_admin`) sem expor `user_id` bruto.
- `GET /api/v1/gm/:slug` já remove métricas sensíveis de `tables` e mantém contrato público sem `metrics_*`.
- `GET /api/v1/gm/:slug/insights` já existe com `authMiddleware` e gate de permissão (owner/admin).
- Contrato de links públicos já retorna campos completos (`type`, `description`, `embed_url`, `thumbnail_url`, `sort_order`).
- `database/migration_107_gm_public_profile_v2.sql` já existe com colunas de suporte (`tagline`, `selling_points`, `promo_badge_text`, `closed_group_*`, `tables.features`, `user_links.embed_url`, índice de ordenação).
- `backend/src/routes/gmPanel.ts` (`GET /api/v1/gm/tables`) já retorna `metrics_*`, preservando consumo do `PainelMestrePage`.
- `MAPA_DE_API.md` já registra `GET /:slug` com `viewer_context` e `GET /:slug/insights` como em uso.

### Delta pendente identificado para Etapa 3
- **Pendente 1 (documentação):** `docs/Reformulacao_mestre.md` ainda contém trechos de planejamento/auditoria em aberto e precisa sincronização explícita para estado de implementação real da Etapa 3.
- **Pendente 2 (rastreabilidade):** registrar no ciclo atual o fechamento do diagnóstico e o que efetivamente exigirá ou não patch em backend/contrato.
- **Pendente 3 (decisão técnica):** confirmar se haverá patch de código nesta etapa ou se a Etapa 3 será tratada como fechamento documental/contratual por já estar implementada no código.

### Risco observado antes de qualquer patch
- Hook local de pre-commit com `git add -A` automático aumenta risco de stage acidental fora de escopo. Operação deve permanecer com mudança mínima e controle estrito de arquivos tocados.
