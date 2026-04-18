# 26-04-16_3_reformulacao-mestre-etapa1.md

## Cabeçalho
- **Data:** 16/04/2026
- **Objetivo:** Iniciar a Etapa 1 da reformulação completa da página pública do mestre com foco em base técnica, segurança de dados e estabilização de contrato API antes do redesign visual completo.

## Vínculos
- **Sessão anterior:** `26-04-16_2_req21-faixa-etaria-dropdown.md`
- **Próxima sessão:** `26-04-16_4_reformulacao-mestre-etapa2.md`

## Plano de execução
1. Validar o passo preventivo de contrato (`metrics_*`) para evitar quebra no `PainelMestrePage.tsx` antes de alterar `/api/v1/gm/:slug`.
2. Confirmar e ajustar (se necessário) o consumo de métricas do painel para endpoint autenticado (`/api/v1/gm/tables`).
3. Criar migração idempotente de base da reformulação (`gm_public_profile_v2`) com campos novos em `gm_profiles`, `tables.features`, `user_links.embed_url` e índice de ordenação por destaque.
4. Refatorar `backend/src/routes/gm.ts` para:
   - aplicar `optionalAuth` em `GET /api/v1/gm/:slug`;
   - remover `metrics_*` do payload público;
   - retornar `viewer_context` (`is_owner`, `is_admin`);
   - completar contrato de links públicos.
5. Criar endpoint protegido `GET /api/v1/gm/:slug/insights` com regra de acesso (owner/admin).
6. Atualizar `MAPA_DE_API.md` com os contratos alterados e nova rota de insights.
7. Validar comportamento base (segurança + contrato) sem iniciar ainda a etapa de redesign visual/componentização extensa.
8. Após concluir a etapa, atualizar `docs/Reformulacao_mestre.md` com o status da Etapa 1 e pendências para a etapa seguinte.

## Checklist
- [x] Mapear todos os consumidores de `metrics_*` no frontend
- [x] Garantir origem autenticada de métricas para o painel
- [x] Criar migration idempotente `gm_public_profile_v2`
- [x] Refatorar `GET /api/v1/gm/:slug` com `optionalAuth` e `viewer_context`
- [x] Remover `metrics_*` do endpoint público
- [x] Corrigir payload de `links` no endpoint público
- [x] Criar `GET /api/v1/gm/:slug/insights` com controle de acesso
- [x] Atualizar `MAPA_DE_API.md`
- [x] Validar cenários: visitante, dono e admin
- [x] Atualizar `docs/Reformulacao_mestre.md` ao final da etapa
- [x] Atualizar RESUMO_EXECUCAO.md
- [x] Atualizar index.md

## Apontamentos de revisão (16/04/2026)
- **[R1] Typo em patch de sync:** token incompleto `plataform` no trecho de autenticação. Ação: validar e manter `plataforma` no `ARQUITETURA_PROJETO.md` (§6).
- **[R2] Truncamento em patch de sync:** linha de tabela interrompida em `| `PO` no bloco de rotas de mesas. Ação: validar e manter a tabela completa de `## 12. Contratos de API` sem linha truncada.

## Arquivos que serão modificados
- `backend/src/routes/gm.ts`
- `backend/src/routes/gmPanel.ts` (se necessário após validação do passo preventivo)
- `backend/src/db/migrations/<timestamp>_gm_public_profile_v2.sql`
- `frontend/src/pages/PainelMestrePage.tsx` (se necessário para migração de consumo)
- `MAPA_DE_API.md`
- `docs/Reformulacao_mestre.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`

## Critério de conclusão explícito
- O endpoint público `/api/v1/gm/:slug` não retorna `metrics_*` e retorna `viewer_context` corretamente.
- O endpoint `/api/v1/gm/:slug/insights` existe, está protegido e só responde para owner/admin.
- O contrato de `links` públicos inclui os campos esperados pelo frontend.
- O painel continua funcional sem depender de métricas no endpoint público.
- `docs/Reformulacao_mestre.md` atualizado ao final da etapa com status e continuidade.
- Checklist da sessão 100% marcado.

## Evidência de validação funcional
- Confirmação do usuário: tela pública de mestre refeita e comportamento de insights validado em runtime.
- Verificação de código: `MestrePage.tsx` condiciona consumo de `/api/v1/gm/:slug/insights` por `viewer_context` (`is_owner`/`is_admin`) e usa `credentials: 'include'`.
