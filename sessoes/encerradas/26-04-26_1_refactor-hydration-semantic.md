# Sessão 26-04-26_1_refactor-hydration-semantic

**Data:** 26/04/2026  
**Status:** Em andamento

## Objetivo

Refatorar `backend/src/routes/adminHydration.ts` para arquitetura semântica via JSON intermediário. Resolver E164 (FK violation por IDs divergentes entre prod e beta).

## Vínculos

- **Sessão anterior:** `sessoes/26-04-25_3_fix-mismatch-userid.md`
- **Bugs relacionados:** E164 (errors.md)
- **Feature SDD:** A ser criada via `/speckit.specify`

## Contexto técnico

**Problema atual:**
- Prod e beta foram seedados independentemente com `gen_random_uuid()`
- Entidades de catálogo (communication_platforms, vtt_platforms, etc.) têm IDs diferentes para mesma entidade semântica (ex: "Discord")
- Mesas vindas da prod referenciam IDs inexistentes no beta
- FK violation → transaction abort (25P02) → endpoint retorna 500

**Decisão arquitetural:**
- Export de prod → JSON intermediário com identificadores semânticos (slug, email, composite keys)
- Import no beta → match por slug/email em vez de ID direto
- Permite reuso futuro para import via Discord bot

## Plano de execução

1. [x] Executar `/speckit.specify` para criar spec da refatoração
2. [x] Executar `/speckit.plan` para gerar plano de implementação
   - [x] plan.md criado com contexto técnico e constitution check
   - [x] research.md criado com 6 decisões técnicas (D1-D6)
   - [x] data-model.md criado com entidades e relacionamentos
   - [x] quickstart.md criado com procedimento incremental
3. [x] Executar `/speckit.tasks` para gerar tasks executáveis
   - [x] tasks.md criado com 22 tasks organizadas em 5 phases
   - [x] MVP scope definido (US1 apenas)
   - [x] Rollback plan documentado
4. [x] Executar `/speckit.implement` para implementar
   - [x] T001-T013 concluídas (implementação backend + build local verde)
   - [x] T014 concluída (deploy para dev executado)
   - [x] Diagnóstico do 500 concluído: erro 23514 em `table_contacts_discord_server_only`
   - [x] Hotfix aplicado e deployado em dev: sanitização condicional de `discord_server_url` por `channel`
   - [x] T015-T018 concluídas (dry-run + real com sucesso em beta)
5. [x] Validar endpoint retorna 200 em beta
6. [x] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
7. [x] Catalogar E161-E164 em `errors.md` (se ainda não catalogados)
8. [x] Atualizar `index.md` com esta sessão
9. [ ] Mover sessão para encerradas/ (quando autorizado)

## Critério de conclusão explícito

- [x] Endpoint `/api/v1/admin/sync/hydrate` retorna 200 quando admin clica "Executar sincronização"
- [x] Nenhum FK violation nos logs
- [x] Dados exclusivos do beta preservados (2 mesas, 1 usuário, user_systems)
- [x] E164 marcado como resolvido em `errors.md`

## Arquivos que serão modificados

- `backend/src/routes/adminHydration.ts` (refatoração completa)
- Possível criação de `backend/src/services/hydrationService.ts` (lógica de export/import)
- Possível criação de `backend/src/types/hydration.ts` (tipos do JSON intermediário)
