# Sessão 26-05-09_1 — Diagnóstico e Spec do Pipeline Discord

**Data**: 2026-05-09
**Objetivo**: Produzir spec completo do redesenho do pipeline Discord Sync após relato do mantenedor de que drafts de fórum estão chegando vazios e marcados como `ready` indevidamente. Investigação read-only no Beta + leitura do código deployado, sem alterações de runtime nem deploy.

**Sessão Anterior**: `sessoes/26-05-04_1_discord-forum-threads.md`
**Próxima Sessão**: a definir após aprovação do spec.

---

## Plano de execução

1. Registrar sessão e atualizar índice antes de qualquer escrita.
2. Reler parser, normalizer, rotas admin e ingestor para mapear o fluxo deployado em commit `68c379d`.
3. Executar `SELECT` no Beta para medir: distribuição de status de mensagem/draft, posts com/sem body, formato JSONB de embeds, drift de status, draft específico do screenshot.
4. Cruzar evidência observada com claims registrados em `project-state.md` (sessão 26-05-04_1).
5. Escrever `specs/016-discord-pipeline-rebuild/spec.md` cobrindo diagnóstico, cenários, opções de solução, riscos, decisões abertas.
6. Atualizar `sessoes/index.md` apontando esta sessão.
7. Aguardar aprovação do mantenedor antes de qualquer `/speckit.plan`, código ou deploy.

---

## Checklist de fechamento

- [ ] Spec aprovado pelo mantenedor
- [ ] `/speckit.retro.run` ao encerrar
- [ ] Atualizar `.specify/memory/project-state.md` via `/speckit.status` (somente após aprovação)
- [ ] Atualizar `.specify/memory/session-log.md`
- [ ] Atualizar `sessoes/index.md`
- [ ] Mover sessão para `encerradas/` quando autorizado

---

## Arquivos modificados nesta sessão

- `sessoes/26-05-09_1_discord-pipeline-diagnostico.md` (novo)
- `sessoes/index.md` (atualizado)
- `specs/016-discord-pipeline-rebuild/spec.md` (novo)

Nenhum arquivo de código, schema, deploy ou state canônico será tocado nesta sessão.

---

## Critério de conclusão explícito

Sessão concluída quando:

1. Spec 016 estiver entregue com diagnóstico baseado em queries reais ao Beta (não em fixtures).
2. Mantenedor tiver pelo menos 3 caminhos de solução comparáveis lado a lado.
3. Decisões abertas estiverem listadas como decisões do mantenedor, não do agente.
4. Nenhuma alteração de código tiver sido feita neste worktree.

---

## Progresso

- [x] AGENTS.md, constitution.md, project-state.md, sessão ativa anterior lidos.
- [x] Parser, normalizer, ingestMessages, adminDiscordSync e DiscordDraftPreview lidos.
- [x] SELECTs read-only executados no Beta DB.
- [x] Achados consolidados em `specs/016-discord-pipeline-rebuild/spec.md`.
- [x] Decisões do mantenedor (09/05) registradas em spec §11.
- [x] `E166` registrado em `.specify/memory/errors.md` (evidência fabricada da sessão 26-05-04_1).
- [x] `specs/016-discord-pipeline-rebuild/plan.md` entregue (T-EXEC-1 + Fases 0–5).
- [x] `specs/016-discord-pipeline-rebuild/tasks.md` entregue (Fase 0 + Fase 1 detalhadas).
- [ ] Aguardando aprovação para iniciar T-EXEC-1 (reingestão sem janela).

### Evidências coletadas (read-only Beta — 2026-05-09)

```
discord_import_messages.status  → parsed=169  ignored=11
discord_import_table_drafts     → needs_review=157  ready=12
ready_clean (missing=[])        = 10
ready_dirty (missing≠[])        = 2
content_raw vazio               = 170 / 180   (94,4%)
content_raw com texto           = 10 / 180    (5,6%)
embeds gravado como object {}   = 169 / 180
embeds gravado como array       = 11 / 180
canal 📖┃campanhas              = 103 msgs, 10 com body
canal 🎯┃one-shots              = 77 msgs,  0 com body
```

Drafts em drift identificados (status=ready com missing≠[]):
- `1b6cdb60-…-47494a6ec56f` — `Sacramento™: Bares Longínquos` (post original 2025-12-15, body=0)
- `75a9df05-…-f41563124bbe` — `One Two Six: Em busca do Símbolo de Wengaltaedhel` (body=0)

Quando a mensagem possui corpo (10 casos), o parser gera draft com `confidence=1.0`, `missing_fields=[]`, todos os campos preenchidos.
