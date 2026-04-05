# Sessão: REQ-20 — Implantação Completa

**Data:** 05/04/2026  
**Task:** REQ-20 — Integração de Mídia, Covil do Lich e Retenção (Fases 2.A a 2.H)

---

## Objetivo da Sessão

Implementar as Fases 2.A a 2.H do REQ-20 conforme plano documentado em `sessoes/resumo_05-04_3_parsing_inteligente.md`, incluindo:
- Migration 10 (is_covil + imported_expires_at)
- Backend: persistência dos novos campos no aceite de candidato
- Frontend mapper: gm_avatar_url, is_covil, banner_url prioritário
- Frontend formulário: preview de banner, avatar circular, checkbox Covil
- Frontend listagem: badge "🏰 Covil do Lich" em GestaoPage
- Frontend AdminDevTools: feedback jsonrepair, barra de progresso, seção retenção
- Validação integrada end-to-end e atualização de documentação

---

## Plano de Execução

1. Criar arquivo de sessão (este arquivo)
2. Criar `database/migration_10_covil_and_expiration.sql`
3. Modificar `backend/src/services/aggregator/candidateService.ts` — adicionar is_covil e imported_expires_at no INSERT
4. Verificar tipos backend (CreateTableInput / db/types)
5. Modificar `frontend/src/utils/candidateToFormData.ts` — gm_avatar_url, is_covil, banner_url prioritário
6. Modificar `frontend/src/pages/PainelMestrePage.tsx` (CreateTableForm) — preview banner, avatar, bloco Covil
7. Modificar `frontend/src/pages/GestaoPage.tsx` — badge Covil na listagem e no modal
8. Modificar `frontend/src/pages/AdminDevToolsPage.tsx` — sanitizeDiscordExporterJson melhorado, barra de progresso, seção retenção
9. Verificar build frontend (npm run build)
10. Atualizar documentação (FILA, RESUMO, AMBIENTE, TODO)

---

## Task List

- [x] Criar arquivo de sessão (`sessoes/resumo_05-04_req20-implantacao.md`)
- [x] **Fase 2.A** — Criar `database/migration_10_covil_and_expiration.sql`
- [x] **Fase 2.B** — Modificar `backend/src/db/types.ts` (is_covil, imported_expires_at na TablesTable)
- [x] **Fase 2.B** — Modificar `backend/src/routes/gmPanel.ts` (is_covil no POST /tables)
- [x] **Fase 2.B** — Modificar `candidateService.ts` (is_covil, imported_expires_at no INSERT + returning)
- [x] **Fase 2.C** — Modificar `candidateToFormData.ts` (gm_avatar_url, is_covil, banner_url prioritário via enrichedFields)
- [x] **Fase 2.D** — Modificar `CreateTableForm` (preview banner + placeholder, avatar circular, bloco Covil, is_covil no payload)
- [x] **Fase 2.E** — Modificar `GestaoPage.tsx` (badge Covil na listagem e no modal; placeholder no preview de banner)
- [x] **Fase 2.F** — Modificar `AdminDevToolsPage.tsx` (jsonrepair feedback melhorado, barra de progresso, seção retenção)
- [x] Verificar build frontend — `npm run build` ✅ Exit code: 0
- [x] **Fase 2.H** — Atualizar documentos relevantes

---

## Arquivos-Alvo

```
database/migration_10_covil_and_expiration.sql          [CRIADO]
backend/src/db/types.ts                                 [MODIFICADO]
backend/src/routes/gmPanel.ts                           [MODIFICADO]
backend/src/services/aggregator/candidateService.ts     [MODIFICADO]
frontend/src/utils/candidateToFormData.ts               [MODIFICADO]
frontend/src/pages/PainelMestrePage.tsx                 [MODIFICADO]
frontend/src/pages/GestaoPage.tsx                       [MODIFICADO]
frontend/src/pages/AdminDevToolsPage.tsx                [MODIFICADO]
```

---

## Decisões Arquiteturais (inegociáveis)

| Decisão | Escolha |
|---|---|
| `gm_avatar_url` no banco | **NÃO** — apenas visual no formulário, URL Discord não sobe para Imgur |
| `is_covil` no banco | **SIM** — boolean persistido, similar a `is_ddal` |
| `imported_expires_at` no banco | **SIM** — campo TIMESTAMPTZ calculado no aceite |
| Padrão de expiração | 30 dias quando não há configuração específica |
| `sanitizeDiscordExporterJson()` | Retorna `{ json, wasRepaired, repairFailed }` |
| `banner_placeholder.webp` | Usado como fallback visual em formulário e modal |

---

## Critério de Conclusão

- [x] migration_10 criada localmente
- [x] Backend persiste is_covil e imported_expires_at no aceite
- [x] candidateToFormData mapeia gm_avatar_url, is_covil, banner_url via enrichedFields
- [x] CreateTableForm exibe preview de banner (com placeholder fallback) e avatar circular
- [x] GestaoPage exibe badge "🏰 Covil do Lich" em candidatos com is_covil=true
- [x] AdminDevTools exibe banners de feedback de jsonrepair (amarelo/vermelho) + seção retenção
- [x] Build frontend sem erros TypeScript
- [x] Documentação atualizada

---

## Registro de Progresso

**Início:** 05/04/2026 04:12 BRT
**Conclusão:** 05/04/2026 04:27 BRT
**Status:** ✅ CONCLUÍDO
