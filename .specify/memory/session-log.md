# Session Log

## 2026-04-29T14:20:00-03:00 — exclusao-mesa-sem-popup BUG-001

**Tipo:** Bugfix SDD pós-deploy Beta
**Feature:** `specs/007-exclusao-mesa-sem-popup/`
**Bug:** `specs/007-exclusao-mesa-sem-popup/bugs/BUG-001.md`
**Tasks concluídas:** 20/20
**Causa raiz:** `MesaPage` habilitava gestão para owner ou admin, mas `TableActionPanel` usava sempre `DELETE /api/v1/gm/tables/:id`; para admin em mesa de outro mestre, o backend retornava `404 Mesa não encontrada`.
**Correção:** `TableActionPanel` recebeu `deleteEndpointScope`; `MesaPage` passa `admin` quando `user.role === 'admin'`; rota administrativa usa `DELETE /api/v1/admin/tables/:id` e redireciona para `/gestao`.
**Evidências principais:** `npm --prefix frontend run build` passou; busca final por pop-ups de exclusão retornou zero ocorrências; `database/changelogs.json` validado com `ConvertFrom-Json`.
**Risco residual:** validação funcional/manual ainda depende de novo deploy do patch para Beta e teste em janela anônima.

## 2026-04-29T13:55:00-03:00 — exclusao-mesa-sem-popup

**Tipo:** Implementação SDD
**Feature:** `specs/007-exclusao-mesa-sem-popup/`
**Tasks concluídas:** 18/18
**Decisões arquiteturais:** confirmação de exclusão centralizada em componente inline reutilizável; endpoints e permissões existentes preservados; feedback por toast mantido como padrão local de página.
**Evidências principais:** busca direcionada por pop-ups de exclusão de mesa retornou zero ocorrências; `npm --prefix frontend run build` passou; `database/changelogs.json` validado com `ConvertFrom-Json`.
**Risco residual:** validação funcional/manual ainda depende de deploy do branch `dev` para Beta e teste em janela anônima.
**Sessão mantida aberta em:** `sessoes/26-04-29_3_exclusao-mesa-sem-popup.md`

## 2026-04-29T11:32:00-03:00 — imagens-banners-placeholder

**Tipo:** Retrospectiva e fechamento SDD
**Feature:** `specs/006-imagens-banners-placeholder/`
**Tasks concluídas:** 34/34
**Decisões arquiteturais:** centralizar fallback de banner em `frontend/src/utils/tableImage.ts`; centralizar importação de URL manual e opção `Manter link direto` em `frontend/src/hooks/useImageUrlImport.ts`; unificar edição do perfil do mestre no fluxo canônico `/perfil?tab=mestre`; eliminar o formulário duplicado `EditGmProfileForm`.
**Evidências principais:** backend build, backend tests, frontend build e `git diff --check` passaram durante a sessão; Deploy Beta `25114445001` verde; teste funcional do mantenedor em janela anônima no Beta confirmado em 29/04/2026 11:32 BRT.
**Risco residual:** promoção para produção não executada nesta sessão; deve ser tratada apenas por solicitação explícita do mantenedor.
**Sessão encerrada:** `sessoes/encerradas/26-04-29_1_imagens-banners-placeholder.md`

## 2026-04-28T12:28:00-03:00 — bug-ux-covil

**Tipo:** Retrospectiva
**Tasks concluídas:** 5/6 (conforme tasks.md atual)
**Tasks iniciadas mas não concluídas:** T006
**Decisões arquiteturais:** normalização canônica de `price_type` no mapper (`free/paid` -> `gratuita/paga`)
**Phantom completions detectadas:** 1 potencial inconsistência documental (evidência runtime existe, task T006 ainda marcada como pendente)
**Relatório:** [retro-2026-04-28T12-28-00-03-00.md](file:///c:/projetos/mesas_rpg_artificio/.specify/features/bug-ux-covil/retros/retro-2026-04-28T12-28-00-03-00.md)

## 2026-04-28T19:35:00-03:00 — runtime-workflows

**Tipo:** Retrospectiva e fechamento SDD
**Feature:** `specs/005-runtime-workflows/`
**Tasks concluídas:** 28/28
**Decisões operacionais:** corrigir `mesas-cron` antes de alterar runtime; atualizar runtime para Node.js `25.9.0` Current por decisão explícita do mantenedor; padronizar npm `11.13.0`; alinhar workflows para `actions/checkout@v5`, `actions/setup-node@v6` e `node-version: '25.9.0'`.
**Evidências principais:** Deploy Beta `25079585177` verde após atualização de runtime; Deploy Beta `25080459429` verde após correção do lint `SC2086`; VM validada com `node v25.9.0` e `npm 11.13.0`; `mesas-cron` validado sem `ts-node: not found`.
**Risco residual:** Node 25 é linha Current, não LTS; reavaliar antes de promoção para produção se a política de estabilidade mudar.
**Sessão encerrada:** `sessoes/encerradas/26-04-28_1_fix-publicacao-mesa-opcao.md`
