# 26-04-20_6_atividade-predeploy-dev.md

## Cabeçalho
- **Data:** 20/04/2026
- **Objetivo:** Executar os bloqueios técnicos e documentais restantes para liberar deploy em dev (beta) da feature de atividade administrativa.

## Vínculos
- **Sessão Anterior:** `26-04-20_5_atividade-fasee-documentacao.md`
- **Próxima Sessão:** `26-04-20_7_*` (somente após fechamento desta)
- **Documento-base:** `sessoes/adm_atv.md`

## Plano de execução
1. Atualizar regra canônica de changelog em `AGENTS.md` para isentar mudanças exclusivas do admin.
2. Executar validação funcional do Gate C no beta com evidência SQL read-only dos eventos exigidos.
3. Revalidar backend/frontend no estado atual (`npx tsc --noEmit`, `npm run build`).
4. Atualizar `sessoes/adm_atv.md` com decisão do usuário sobre T1–T13 pós-deploy dev e status dos bloqueios.
5. Atualizar documentação operacional (`RESUMO_EXECUCAO.md` e `sessoes/index.md`).

## Checklist
- [x] Atualizar regra de changelog em `AGENTS.md`.
- [ ] Validar Gate C funcional no beta (evidência de `user.registered`, `table.*`, `system_suggestion.*`, `scenario_suggestion.*`).
- [x] Validar backend (`backend> npx tsc --noEmit`).
- [x] Validar frontend (`frontend> npm run build`).
- [x] Atualizar `sessoes/adm_atv.md` com status real dos bloqueios e decisão de T1–T13 pós-deploy.
- [x] Atualizar `RESUMO_EXECUCAO.md`.
- [x] Atualizar `sessoes/index.md`.
- [x] Publicar para `dev` e concluir deploy beta.
- [x] Aplicar rate limit em `GET /api/v1/admin/activity`.
- [x] Aplicar botão "Todos" no filtro de tipo de evento como padrão visual inicial.

## Arquivos que serão modificados
- `AGENTS.md`
- `sessoes/adm_atv.md`
- `sessoes/26-04-20_6_atividade-predeploy-dev.md`
- `RESUMO_EXECUCAO.md`
- `sessoes/index.md`
- `backend/src/routes/activityLog.ts`
- `frontend/src/modules/admin/activity/components/ActivityFilters.tsx`

## Critério de conclusão explícito
A sessão só estará concluída quando:
- regra de changelog estiver atualizada no canônico;
- Gate C funcional estiver evidenciado em beta;
- validações backend/frontend estiverem concluídas sem erro;
- checklist desta sessão estiver 100% `[x]`.

## Evidências executadas (20/04)
- Gate C (read-only, beta):
  - SQL em `activity_log` para `user.registered`, `table.*`, `system_suggestion.*`, `scenario_suggestion.*`.
  - Resultado: `(0 rows)`.
  - Severidade: **BLOQUEANTE** (sem evidência funcional ponta a ponta até o momento).
- Backend: `npx tsc --noEmit` (exit code 0).
- Frontend: `npm run build` (exit code 0).
- `activity_log` existente no banco e com `total_logs = 0` no momento da checagem.
- Deploy beta após push em `dev`:
  - Workflow `Deploy Beta` run `24664678833` concluído com `success`.
  - SHA publicado: `13cccac19afe8d700d6ce10ddbf3dda962a34a0a`.
- Verificações pós-deploy:
  - `GET /api/v1/health` → status ok (beta + db connected).
  - `GET /api/v1/tables?limit=1` → HTTP 200.
- Ajustes técnicos aplicados pós-deploy:
  - `backend/src/routes/activityLog.ts`: `authRateLimiter` antes de `authMiddleware`/`requireRole('admin')`.
  - `frontend/src/modules/admin/activity/components/ActivityFilters.tsx`: chip "Todos" (`activity-group-all`) ativo por padrão quando `actions=[]`.
  - Validação técnica: backend `npx tsc --noEmit` e frontend `npx tsc --noEmit` sem erros.
