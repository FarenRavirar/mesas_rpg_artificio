# Plan 024 - Triagem de Feedback

## Arquivos

Backend:
- `database/migration_126_dev_feedback_triage.sql` (novo): `archived_at`, `screenshot_public_id`, `merged_into`, `merged_sources` + indice.
- `backend/src/db/types.ts`: campos novos em `DevFeedbackTable` (`merged_sources` insert opcional via `ColumnType<unknown[], string|undefined, string>`).
- `backend/src/services/activityLogger.ts`: `dev_feedback.archived|deleted|merged`.
- `backend/src/services/devFeedbackMerge.ts` (novo): helper puro `buildMerge` (uniao+dedup+cap, snapshots) + `MAX_MERGE_SOURCES`/`MAX_MERGED_ERRORS`.
- `backend/src/routes/devFeedback.ts`: gravar `screenshot_public_id` no INSERT.
- `backend/src/routes/devFeedbackAdmin.ts`: GET filtro `archived`; PATCH aceita `archived`; DELETE (+Cloudinary); POST `/merge` (transacao).

Frontend:
- `frontend/src/features/dev-feedback/devFeedbackApi.ts`: tipos `archived_at`/`merged_into`/`merged_sources` + `DevFeedbackMergedSource`; normalizador; `fetchDevFeedback({archived})`; `archiveDevFeedback`/`deleteDevFeedback`/`mergeDevFeedback`.
- `frontend/src/modules/admin/dev-feedback/DevFeedbackPanel.tsx`: filtro arquivados, selecao+barra de mescla, arquivar/excluir, bloco "Integrados", badges.

Reuso: `deleteFromCloudinary` (cloudinary.ts), `InlineDeleteConfirmation` (components), `requireRole('admin')`, `resolveActorNames`.

## Mescla (transacao no POST /merge)

1. Carrega `primary` (nao arquivado) e `sources` (todos existentes, nao arquivados; != primary).
2. `buildMerge`: une console/network (dedup, cap 100); `merged_sources` = existentes + snapshot de cada source (id,kind,title,description,contact_email,screenshot_url,page_url,route_path,environment,created_at,console_errors,network_errors,merged_at).
3. Atualiza destino (arrays + merged_sources + updated_at).
4. Marca sources `archived_at=now()`, `merged_into=primary_id`.
5. `logActivity('dev_feedback.merged')`.

## Sequencia

1. Migration 126 + tipos.
2. Helper `buildMerge` TDD (RED->GREEN).
3. POST grava public_id.
4. Rotas admin (GET/PATCH/DELETE/merge).
5. API client + painel.
6. Builds/lint/tests.
7. Docs + commit/push/PR/deploy (com aprovacao).

## Validacao

- `npm --prefix backend test` (devFeedbackMerge GREEN) + `npm --prefix backend run build`.
- `npm --prefix frontend run build` + `tsc -b` + lint novos + `vitest run`.
- Migration 126 no gate Beta.
- Funcional Beta: arquivar/desarquivar; excluir (some + imagem Cloudinary); mesclar 2-3 num destino, conferir "Integrados" + secundarios arquivados.
