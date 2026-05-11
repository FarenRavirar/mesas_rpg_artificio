# Sessão 26-05-12_1 — Parser refinements + imagens

**Data:** 2026-05-12  
**Objetivo:** Iniciar o spec 017 (`specs/017-parser-refinements-imagens/`) com foco inicial na Fase A: refinamento do parser Discord para vagas, frequência e `host_discord_id`, seguindo RED → GREEN com Jest local e evidência completa.

**Sessão Anterior:** `sessoes/26-05-09_2_discord-pipeline-fase-1-em-diante.md` (spec 016 Fase 1 fechada em 2026-05-11).  
**Próxima Sessão:** a definir após checkpoint da Fase A/B/C ou saturação de contexto.

**Branch/worktree:** `claude/flamboyant-mcnulty-9d2c44` em `C:\projetos\mesas_rpg_artificio\.claude\worktrees\flamboyant-mcnulty-9d2c44`.  
**Destino operacional:** `feat/015-discord-draft-pipeline` / `dev`, conforme decisões do spec 016 e spec 017.

---

## Governança lida antes de qualquer código

- [x] `.specify/memory/project-state.md` — Fase 1 do spec 016 GREEN em 2026-05-11; Beta com 194 mensagens, 189 drafts e constraint ativa.
- [x] `AGENTS.md` — inclui "Eficiência de commits — documentação vai com código"; commits docs-only proibidos por padrão.
- [x] `.specify/memory/constitution.md` — §9 evidências/TDAD/commits; §10 infra VM Oracle; §11 anti-padrões.
- [x] `.specify/memory/errors.md` — E166 e E167 consultados.
- [x] `migrations_guide.md` — L03 consultado para CHECK CONSTRAINT idempotente via `pg_constraint`.
- [x] `specs/017-parser-refinements-imagens/spec.md` — 9 defeitos, 9 cenários, D1-D7 fechadas.
- [x] `specs/017-parser-refinements-imagens/plan.md` — fases A-F e arquivos por fase.
- [x] `specs/017-parser-refinements-imagens/tasks.md` — checklist executável e invariantes.
- [x] `sessoes/26-05-09_2_discord-pipeline-fase-1-em-diante.md` — sessão ativa anterior, Fase 1 fechada.
- [x] `docs/sdd/MAINTAINER_REVIEW_CHECKLIST.md`, headers de `docs/sdd/SESSION_FAILURES_REGISTRY.md`, `docs/sdd/README.md` e skill `speckit-implement`.

---

## O que vai fazer

1. Atualizar `.specify/feature.json` para `specs/017-parser-refinements-imagens`.
2. Executar T-F1-A-01 a T-F1-A-07 na ordem.
3. Começar por leitura direcionada dos arquivos da Fase A após esta sessão estar registrada.
4. Adicionar testes RED para slots, frequência, host e ambiguidade antes do GREEN correspondente.
5. Implementar mudança mínima em parser, types e normalizador.
6. Rodar Jest e TypeScript local.
7. Atualizar `tasks.md` e esta sessão com evidência literal antes de qualquer commit.

## O que precisa ser feito

- Tipar `host_discord_id` e `_slots_ambiguity`.
- Reescrever `extractSlots` com prioridade: campos canônicos, `Vagas: X/Y` ambíguo, `Vagas: N`.
- Derivar `frequency` por `type`, evitando `semanal` em one-shot.
- Extrair `<@user>` de linhas "Mestre", "GM", "Narrador" ou "DM".
- Propagar `_slots_ambiguity` para `missing_fields` como `slots_open:ambiguous_x_of_y`.
- Validar com testes locais e registrar evidências.

## O que foi feito

- Leitura obrigatória de sessão concluída no worktree correto.
- E166/E167 confirmados como regras ativas para validação.
- Identificada regra de eficiência de commits: documentação será agrupada ao commit funcional correspondente.
- Sessão nova criada para spec 017.
- `.specify/feature.json` atualizado para apontar para spec 017.
- `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` executado e bloqueado pelo nome do branch do worktree (`claude/flamboyant-mcnulty-9d2c44`), apesar de o mantenedor ter autorizado explicitamente este worktree. Continuação feita pela checklist aprovada de `tasks.md`.
- Arquivos de Fase A localizados via `rg` antes de abrir trechos de código.
- T-F1-A-01 iniciado: `DiscordTableDraftTable` recebeu `host_discord_id` e `_slots_ambiguity`, com defaults nulos no parser.
- T-F1-A-02 RED observado para `Vagas: X/Y`.
- T-F1-A-03 GREEN: `extractSlots` agora cobre campos canônicos, `Vagas: X/Y` ambíguo e `Vagas: N`.
- T-F1-A-04 GREEN: `frequency='semanal'` só é inferido para `type='campanha'` com `day_of_week`.
- T-F1-A-05 GREEN: `host_discord_id` extraído de linhas `Mestre`, `GM`, `Narrador` e `DM`, inclusive com mention na linha seguinte.
- T-F1-A-06 GREEN: normalizador adiciona `slots_open:ambiguous_x_of_y` quando `_slots_ambiguity` existe.
- T-F1-A-07 validação local: Jest 22/22 GREEN; `npx tsc --noEmit` GREEN. Commit pendente por exigir autorização explícita.
- Fase A commitada e enviada para `origin/dev`: `61f6cd5 feat(discord): parser extractSlots + frequency por type + host_discord_id`.
- Deploy Beta `25677246299` GREEN para `61f6cd5`; CodeQL `25677243221` GREEN.
- Iniciada Fase B: sistemas com parênteses e versões.
- T-F1-B-01 RED observado: parênteses preservados em hint desconhecido, `D&D 5.5` não resolvido e `Starfinder 2e` sem `_notes`.
- T-F1-B-02 GREEN: `extractLabelValue` corta a partir de `(` e `matchSystem` tenta versão stripped antes do match amplo; `_notes` registra `version_mismatch:<versao>`.
- T-F1-B-03 validação local: Jest 25/25 GREEN; `npx tsc --noEmit` GREEN.
- Fase B commitada e enviada para `origin/dev`: `d3e2410 feat(discord): refina match de sistemas com versao`.
- Deploy Beta `25677665779` GREEN para `d3e2410`; CodeQL `25677663420` GREEN.
- Iniciada Fase C: captura de imagem do post apenas no payload do parser, sem persistir em `tables`.
- T-F1-C-01 tipos `cover_url_source` e `cover_quality` adicionados.
- T-F1-C-02 RED observado: JPEG/PNG não preenchiam `cover_url_source`; SVG/PDF/sem attachments permaneciam nulos.
- T-F1-C-03 GREEN: `extractCoverFromAttachments` lê `attachments: unknown[]`, ignora SVG e não-imagens, usa primeira imagem válida, e marca `standard`/`low`.
- T-F1-C-04 validação local: Jest 31/31 GREEN; `npx tsc --noEmit` GREEN.

### Evidência T-F1-A-02 — RED

Estado: NOT STARTED -> RED

Comando:
```powershell
npm --prefix backend test -- parseDiscordAnnouncement
```

Output literal:
```text
> backend@1.0.0 test
> jest parseDiscordAnnouncement

(node:14228) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
FAIL src/discord/__tests__/parseDiscordAnnouncement.test.ts
  ● parseDiscordAnnouncement › keeps slash slots ambiguous when Covil writes Vagas: 0/6 (spec 017 T-F1-A-02)

    expect(received).toBe(expected) // Object.is equality

    Expected: 6
    Received: null

  ● parseDiscordAnnouncement › keeps slash slots ambiguous even when both numbers match (spec 017 T-F1-A-02)

    expect(received).toBe(expected) // Object.is equality

    Expected: 5
    Received: null

Test Suites: 1 failed, 1 total
Tests:       2 failed, 11 passed, 13 total
Snapshots:   0 total
Time:        3.754 s, estimated 12 s
Ran all test suites matching parseDiscordAnnouncement.
```

---

## Plano de execução

1. [x] T-F1-A-01 — Estender tipo `DiscordTableDraftTable`.
2. [x] T-F1-A-02 — Testes RED para `extractSlots`.
3. [x] T-F1-A-03 — Implementar `extractSlots`.
4. [x] T-F1-A-04 — Testes RED + GREEN para `frequency`.
5. [x] T-F1-A-05 — Testes RED + GREEN para `extractHostDiscordId`.
6. [x] T-F1-A-06 — Propagação de `_slots_ambiguity` no normalizador.
7. [ ] T-F1-A-07 — Build + Jest concluídos; commit pendente de autorização explícita.
8. [x] T-F1-B-01 — Testes RED para sistemas com parênteses e versão.
9. [x] T-F1-B-02 — Implementação de `extractLabelValue`/`matchSystem`.
10. [x] T-F1-B-03 — Build + commit + push Fase B.
11. [x] T-F1-C-01 — Estender tipo `DiscordTableDraftTable`.
12. [x] T-F1-C-02 — Testes RED para captura de attachment.
13. [x] T-F1-C-03 — Implementação de `extractCoverFromAttachments`.
14. [ ] T-F1-C-04 — Build concluído; commit + push Fase C em andamento.

### Evidência T-F1-B-03 — GREEN local

Estado: RED -> GREEN técnico local

Comandos:
```powershell
npm --prefix backend test -- parseDiscordAnnouncement
npx tsc --noEmit
git status --short
```

Output literal:
```text
> backend@1.0.0 test
> jest parseDiscordAnnouncement

(node:15580) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        3.168 s
Ran all test suites matching parseDiscordAnnouncement.

npx tsc --noEmit
<sem output; exit code 0>
```

### Evidência T-F1-C-04 — GREEN local

Estado: RED -> GREEN técnico local

Comandos:
```powershell
npm --prefix backend test -- parseDiscordAnnouncement
npx tsc --noEmit
git status --short
```

Output literal:
```text
> backend@1.0.0 test
> jest parseDiscordAnnouncement

(node:9464) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       31 passed, 31 total
Snapshots:   0 total
Time:        4.038 s
Ran all test suites matching parseDiscordAnnouncement.

npx tsc --noEmit
<sem output; exit code 0>
```

### Evidência T-F1-A-07 — GREEN local

Estado: RED -> GREEN técnico local

Comandos:
```powershell
npx tsc --noEmit
npm --prefix backend test -- parseDiscordAnnouncement
git status --short
```

Output literal:
```text
npx tsc --noEmit
<sem output; exit code 0>

> backend@1.0.0 test
> jest parseDiscordAnnouncement

(node:10528) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        2.426 s, estimated 3 s
Ran all test suites matching parseDiscordAnnouncement.
```

---

## Arquivos que serão modificados

- `.specify/feature.json`
- `sessoes/26-05-12_1_parser-refinements-imagens.md`
- `sessoes/index.md`
- `specs/017-parser-refinements-imagens/tasks.md`
- `backend/src/discord/types.ts`
- `backend/src/discord/parseDiscordAnnouncement.ts`
- `backend/src/discord/normalizeDiscordTableDraft.ts`
- `backend/src/discord/__tests__/parseDiscordAnnouncement.test.ts`

## Critério de conclusão explícito

Fase A só será considerada GREEN quando:

- Jest local de `parseDiscordAnnouncement` passar com os novos casos.
- TypeScript backend passar.
- `git status` listar somente arquivos esperados.
- `tasks.md` e esta sessão registrarem estado origem → destino, comando exato e output literal.
- Invariantes SQL da Fase A ficarem registradas como pendentes de re-parse em massa na Fase E, conforme `tasks.md`.

---

## Checklist de fechamento

- [ ] `/speckit.retro.run` ao final da sessão.
- [ ] Atualizar `.specify/memory/project-state.md` via `/speckit.status`.
- [ ] Mover sessão para `encerradas/` quando autorizado.
- [ ] Atualizar `sessoes/index.md`.

---

## Restrições ativas

- Sem push para `origin/dev` sem autorização explícita.
- Sem writes em banco sem autorização explícita no formato da Constitution §9.2.
- Sem restart de containers.
- Sem alteração fora do escopo do plan 017 §3 sem parar e perguntar.
- Sem adicionar sistemas ao seed.
- Sem persistir Discord CDN em `tables.cover_url` ou `tables.banner_url`.
