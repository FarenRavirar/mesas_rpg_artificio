# Session Log

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
