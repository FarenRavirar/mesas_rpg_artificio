# Tasks 024 - Triagem de Feedback

## Fase 1 - Banco e tipos
- [x] T001 `database/migration_126_dev_feedback_triage.sql` (archived_at, screenshot_public_id, merged_into, merged_sources, indice).
- [x] T002 `DevFeedbackTable` += campos (merged_sources insert opcional); `ActivityAction` += archived/deleted/merged.

## Fase 2 - Mescla (TDD)
- [x] T003 (RED->GREEN) `devFeedbackMerge.test.ts` (uniao/dedup/cap, snapshot, append, multi). 5/5 GREEN.
- [x] T004 Helper puro `devFeedbackMerge.ts` (`buildMerge`, MAX_MERGE_SOURCES, MAX_MERGED_ERRORS).

## Fase 3 - Backend rotas
- [x] T005 POST publico grava `screenshot_public_id`.
- [x] T006 GET admin filtro `archived` (default esconde).
- [x] T007 PATCH admin aceita `archived` (seta/zera archived_at).
- [x] T008 DELETE admin (UUID guard, apaga Cloudinary nao-fatal, logActivity).
- [x] T009 POST `/merge` (transacao: integra + arquiva secundarios + logActivity).
- [x] T010 `npm run build` backend GREEN; jest 13 suites / 104 testes GREEN.

## Fase 4 - Frontend
- [x] T011 `devFeedbackApi`: tipos + normalizador merged_sources + archive/delete/merge + archived param.
- [x] T012 `DevFeedbackPanel`: filtro arquivados, selecao+mescla, arquivar/excluir (InlineDeleteConfirmation), bloco Integrados, badges.
- [x] T013 build + `tsc -b` + lint novos limpo + `vitest run` 13/13 GREEN.

## Fase 5 - Docs e Beta
- [x] T014 specs 024 + sessao + index.
- [ ] T015 Commit/push/PR/merge dev (aprovacao) -> Deploy Beta + migrate 126.
- [ ] T016 Mantenedor valida em janela anonima (arquivar/excluir/mesclar).

## Criterio de Conclusao
- Arquivar/excluir/mesclar funcionam; mescla integra tudo e arquiva secundarios; excluir remove screenshot.
- Builds/lint/testes GREEN; migration aplicada no Beta.
- Validacao funcional do mantenedor pos-deploy.
