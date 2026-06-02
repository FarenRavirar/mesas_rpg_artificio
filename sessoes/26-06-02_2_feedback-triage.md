# Sessao 26-06-02_2 - Triagem de Feedback (Spec 024)

**Data:** 2026-06-02
**Objetivo:** adicionar arquivar, excluir e mesclar (inteligente) na aba Desenvolvimento (Spec 022). SDD Completo `specs/024-feedback-triage/`.

## Vinculos
- Spec/plan/tasks: `specs/024-feedback-triage/{spec,plan,tasks}.md`.
- Base: Spec 022 (feedback de desenvolvimento), em Beta.
- Governanca: `AGENTS.md`, `.specify/memory/project-state.md`.

## Decisoes do mantenedor (02/06)
- C1 secundarios da mescla: arquivados (nao excluidos), `merged_into` no destino.
- C2 mesclar integra TUDO (descricao, console+rede, screenshots, contato/e-mail, rota).
- C3 arquivar: coluna `archived_at` (preserva status).
- C4 excluir: apaga screenshot do Cloudinary (`screenshot_public_id`).

## Implementacao (concluida local)
- Migration 126 (online-safe): archived_at, screenshot_public_id, merged_into, merged_sources + indice.
- `db/types.ts`: campos novos; `activityLogger`: archived/deleted/merged.
- Helper puro `devFeedbackMerge.ts` (`buildMerge`) com TDD (5/5).
- POST publico grava `screenshot_public_id`.
- Rotas admin: GET filtro archived; PATCH archived; DELETE (+Cloudinary); POST /merge (transacao).
- Frontend: `devFeedbackApi` (tipos/normalizador/funcoes), `DevFeedbackPanel` (filtro arquivados, selecao+mescla com destino, arquivar/excluir, bloco Integrados, badges).

## Validacao local (provas)
- Backend: `npm run build` GREEN; `npx jest` 13 suites / 104 testes GREEN (merge 5/5).
- Frontend: `npm run build` GREEN; `tsc -b` GREEN; lint dos arquivos novos limpo; `vitest run` 13/13.

## Criterio de conclusao explicito
- Arquivar/desarquivar, excluir (com remocao de screenshot) e mesclar (integra tudo + arquiva secundarios) funcionando.
- Builds/lint/testes GREEN; migration 126 aplicada no gate Beta.
- Validacao funcional do mantenedor em janela anonima pos-deploy.

## Pendente
- Commit/push/PR/merge dev (aprovacao) -> Deploy Beta.
- Mantenedor validar arquivar/excluir/mesclar em Beta.
