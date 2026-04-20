# 26-04-17_7_instrumentacao-views-links-painel.md

## Cabeçalho
- **Data:** 17/04/2026
- **Objetivo:** Implementar os 2 próximos passos pós-V4: (1) instrumentação `POST /api/v1/gm/:slug/view` com dedupe por sessão no frontend; (2) integrar a UI de gestão de links no `PainelMestrePage` consumindo o CRUD já existente.

## Vínculos
- **Sessão anterior:** `26-04-17_6_execucao-v4-passo9-10.md`
- **Próxima sessão:** a definir

## Plano de execução
1. Criar estrutura de persistência para métricas de visualização de perfil de mestre.
2. Implementar endpoint `POST /api/v1/gm/:slug/view` em `backend/src/routes/gm.ts`.
3. Disparar tracking no `MestrePage.tsx` com dedupe por sessão (`sessionStorage`).
4. Integrar `LinksManager` no dashboard do `PainelMestrePage.tsx`.
5. Atualizar gate de migrations para incluir a nova migration automática.
6. Validar TypeScript (backend + frontend).
7. Atualizar registros operacionais da sessão.

## Checklist
- [ ] Criar migration idempotente de métricas de visualização do perfil do mestre
- [ ] Atualizar tipagem Kysely para nova tabela
- [ ] Implementar `POST /api/v1/gm/:slug/view`
- [ ] Implementar dedupe por sessão em `MestrePage.tsx`
- [ ] Integrar `LinksManager` no `PainelMestrePage.tsx`
- [ ] Incluir migration no `scripts/deploy/apply_required_migrations.sh`
- [ ] Atualizar changelog de mudanças visíveis (`database/changelogs.json`)
- [ ] Executar validação TypeScript backend
- [ ] Executar validação TypeScript frontend
- [ ] Atualizar `RESUMO_EXECUCAO.md`
- [ ] Atualizar `sessoes/index.md`

## Arquivos que serão modificados
- `database/migration_108_gm_profile_metrics.sql` (novo)
- `backend/src/db/types.ts`
- `backend/src/routes/gm.ts`
- `frontend/src/pages/MestrePage.tsx`
- `frontend/src/pages/PainelMestrePage.tsx`
- `scripts/deploy/apply_required_migrations.sh`
- `database/changelogs.json`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`
- `sessoes/26-04-17_7_instrumentacao-views-links-painel.md`

## Critério de conclusão explícito
- Endpoint `POST /api/v1/gm/:slug/view` funcional e compilando.
- `MestrePage.tsx` dispara tracking uma única vez por sessão para cada `slug`.
- Dashboard do mestre exibe a UI de gestão de links sem quebrar fluxo existente.
- Migration criada, tipagem atualizada, e gate de deploy incluindo a migration nova.
- Typecheck backend/frontend sem erros.
- Checklist desta sessão 100% `[x]`, com `RESUMO_EXECUCAO.md` e `sessoes/index.md` atualizados.
