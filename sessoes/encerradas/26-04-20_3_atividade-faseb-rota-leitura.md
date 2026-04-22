# 26-04-20_3_atividade-faseb-rota-leitura.md

## Cabeçalho
- **Data:** 20/04/2026
- **Objetivo:** Executar a FASE B do `adm_atv.md`, implementando a rota `GET /api/v1/admin/activity` com filtros, cursor-based pagination e `filters_meta`, além do registro em `server.ts`.

## Vínculos
- **Sessão Anterior:** `26-04-20_2_atividade-fasea-fundacao-backend.md`
- **Próxima Sessão:** `26-04-20_4_*` (somente após fechamento dos gates desta sessão)
- **Documento-base da feature:** `sessoes\adm_atv.md`

## Plano de execução
1. Criar `backend/src/routes/activityLog.ts` com middleware admin e contrato de resposta da FASE B.
2. Implementar filtros (`action`, `actor_id`, `target_user_id`, `entity_type`, `search`, `date_from`, `date_to`) com validação de parâmetros.
3. Implementar paginação por cursor (`created_at`, `id`) com regra de desempate e `next_cursor`.
4. Implementar `filters_meta` em toda resposta (`actors`, `target_users`, `available_actions`).
5. Registrar rota em `backend/src/server.ts` na ordem canônica de rotas admin.
6. Validar build/typecheck backend e atualizar checklists da sessão + `adm_atv.md`.

## Checklist
- [x] Criar `backend/src/routes/activityLog.ts`.
- [x] Proteger rota com `router.use(authMiddleware, requireRole('admin'))`.
- [x] Suportar `action` como string e array (`?action=x&action=y`).
- [x] Implementar filtros por `actor_id`, `target_user_id`, `entity_type` e `search`.
- [x] Implementar filtros de data (`date_from`, `date_to`) com validação.
- [x] Implementar cursor-based pagination com busca prévia de `created_at` do cursor.
- [x] Ordenar por `created_at DESC, id DESC`.
- [x] Implementar hidratação de actor/target com JOIN em `users` + `profiles`.
- [x] Retornar `filters_meta` em toda resposta.
- [x] Registrar `activityLogRoutes` em `backend/src/server.ts` após as demais rotas admin.
- [x] Rodar `npx tsc --noEmit` no backend sem erros.
- [x] Atualizar checkboxes da FASE B em `sessoes/adm_atv.md`.
- [x] Registrar evidências técnicas da FASE B no `adm_atv.md` (seção de decisões).
- [x] Validar Gate B em beta com cookie admin (`curl -H "Cookie: $COOKIE" $BASE/api/v1/admin/activity | jq`) **dispensado por autorização explícita do usuário para avançar sem cookie**.
- [x] Atualizar RESUMO_EXECUCAO.md
- [x] Atualizar index.md

## Arquivos que serão modificados
- `backend/src/routes/activityLog.ts` (novo)
- `backend/src/server.ts`
- `sessoes/adm_atv.md`
- `sessoes/26-04-20_3_atividade-faseb-rota-leitura.md`
- `RESUMO_EXECUCAO.md` (ao concluir)
- `sessoes/index.md` (ao concluir)

## Critério de conclusão explícito
A sessão só estará concluída quando os itens da FASE B no `adm_atv.md` estiverem marcados e o Gate B estiver:
- evidenciado com retorno estruturado (`data`, `pagination`, `filters_meta`) **ou**
- formalmente dispensado por autorização explícita do usuário (registrado na sessão e no `adm_atv.md`).
