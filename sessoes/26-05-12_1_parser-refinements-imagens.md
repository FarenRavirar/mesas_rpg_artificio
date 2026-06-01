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
- Fase C commitada e enviada para `origin/dev`: `0ed335f feat(discord): captura imagem do post no parser`.
- Deploy Beta `25678248548` GREEN para `0ed335f`; CodeQL `25678246848` GREEN.
- Iniciada Fase D: migration 122, upload Cloudinary no sync, retry cron e endpoints admin.
- T-F1-D-01 migration `migration_122_discord_image_upload_status.sql` criada com colunas auditáveis e validação `DO $$`.
- T-F1-D-02 `uploadDiscordImageToCloudinary` criado com fetch 10s, SHA-256 como `public_id`, folder `discord-imports/`, e testes unitários com mocks.
- T-F1-D-03 `syncDiscordDraftToTable` integra upload antes de criar/atualizar mesa; sucesso preenche `cover_url` e `banner_url`, falha não bloqueia sync e notifica admins.
- T-F1-D-04 `retryDiscordImageUploads.ts` criado e `cronRunner.ts` chama `discord:retry-image-uploads` a cada 1h.
- T-F1-D-05 endpoints `refresh-image` e `image-uploads/summary` adicionados e documentados em `MAPA_DE_API.md`.
- T-F1-D-06 validação local: `uploadDiscordImage` + `parseDiscordAnnouncement` GREEN, `npx tsc --noEmit` GREEN, `npm --prefix backend run build` GREEN.
- Fase D commitada e enviada para `origin/dev`: `be055c9 feat(discord): upload cloudinary para imagens importadas`.
- Deploy Beta `25679185718` GREEN para `be055c9`; CodeQL `25679182447` GREEN.
- Invariante Beta Fase D: migration 122 aplicada e `discord_cdn_tables=0`.
- Iniciada Fase E com autorização do mantenedor para writes no Beta e re-parse em massa.
- T-F1-E-01 identificou 5 mensagens legacy `content_raw = discord_thread_name` em vez das 3 estimadas no spec; todas `needs_review` e sem `table_id`.
- T-F1-E-02 transação Beta executada: `UPDATE 5`, `DELETE 5`, `UPDATE 184`, `DELETE 184`, `COMMIT`.
- T-F1-E-03 re-parse em massa executado: `processed=184`, `succeeded=184`, `failed=0`.
- Invariante Fase E detectou regressão residual: `A_slots_total_missing=15` por `Vagas: 0` ser tratado como ausente em checagem truthy.
- Correção pontual iniciada: `slots_total=0` e `slots_open=0` passam a ser valores explícitos no parser e normalizador.
- Correção `Vagas: 0` commitada e enviada para `origin/dev`: `c7db12f fix(discord): preserva vagas zero no parser`.
- Deploy Beta `25679981015` GREEN para `c7db12f`; CodeQL `25679977452` GREEN.
- Re-parse final da Fase E executado após deploy: `processed=184`, `succeeded=184`, `failed=0`.
- Invariantes finais Fase E GREEN: `A_slots_total_missing=2`, `A_oneshot_semanal=0`, `B_hint_parentese=0`, `C_com_imagem=184,C_com_source=184`, `D_discord_cdn_tables=0`, `E_legacy_parsed=0`.
- Iniciada Fase F: UI administrativa de revisão para imagem, vagas ambíguas e frequência.
- T-F1-F-01 tipos frontend adicionados para payload normalizado do Discord, incluindo capa, qualidade e ambiguidade.
- T-F1-F-02 preview de capa e thumbnail 40x40 implementados; substituir usa upload padrão `/api/v1/upload`, remover zera capa.
- T-F1-F-03 widget de desambiguação `X/Y` implementado, atualizando `slots_total`, `slots_open`, `slots_filled`, `_slots_ambiguity` e `missing_fields`.
- T-F1-F-04 frequência exposta como select com semanal, quinzenal, mensal, única e outra.
- T-F1-F-05 validação local: `npm --prefix frontend run build` GREEN (`tsc -b && vite build`).
- Pós-deploy Fase F: opção `outra` ajustada para manter draft em revisão, evitando sync com enum não suportado pelo backend.
- Fase F commits enviados para `origin/dev`: `da79df3 feat(discord): melhora revisão de capas e vagas` e `7a9647e fix(discord): bloqueia sync com frequencia outra`.
- Deploy Beta `25680850486` GREEN para `7a9647e`; CodeQL `25680848361` GREEN.
- Smokes externos: `https://mesasbeta.artificiorpg.com` HTTP 200 e `/api/v1/health` HTTP 200.
- API admin de drafts respondeu payloads com `cover_url_source`, `cover_quality` e `_slots_ambiguity`, confirmando dados disponíveis para a UI.
- Retomada pontual em 2026-06-01: investigar 404 de imagens `image.png`/`Capa_RPG.png` no Beta. Diagnóstico inicial: mesa Strahd usa Cloudinary, mas 8 mesas ativas ainda expõem `banner_url` de Discord CDN; corrigir resposta pública para cair em placeholder sem tentar carregar URL expirada e preparar saneamento do DB Beta mediante aprovação para `UPDATE`.
- Saneamento Beta aprovado pelo mantenedor e executado: `UPDATE 8` mesas ativas com `banner_url`/`cover_url` de Discord CDN para `NULL`; invariante pós-UPDATE `discord_cdn_tables=0`. Validação local do hotfix: `npm --prefix backend test -- publicImageUrl` GREEN e `npm --prefix backend run build` GREEN.
- Preparação de publicação em Produção solicitada em 2026-06-01: executar checklist pré-deploy, comparar `origin/dev` → `origin/main`, validar testes locais/CI/Beta/rotas críticas e só promover via PR `dev` → `main` após aprovação explícita do mantenedor.
- Checklist pré-deploy encontrou divergência E146: `deploy-beta.yml` tinha `cancel-in-progress: true`, mas `PRE_DEPLOY_CHECKLIST.md` exige `false`; corrigido em branch `feat/019-prod-readiness-checklist` antes de qualquer promoção para Produção.
- PR #149 mergeado em `dev`; Deploy Beta `26758832853` GREEN. PR #150 `dev` -> `main` criado; checks GREEN, preflight `ATTENTION` por 5 migrations pendentes em Produção (`115`, `116`, `117`, `118`, `122`), sem drift fatal e com todas já aplicadas no Beta.
- Validações pré-publicação: backend Jest 54/54 GREEN; backend build GREEN; frontend build GREEN; frontend Vitest 4/4 GREEN; Beta rotas `/`, `/health`, `/tables?limit=1`, `/systems?view=tree` e mesa Strahd HTTP 200; OAuth Beta/Prod HTTP 302 para Google; frontends Prod/Beta `healthy`; containers Beta ativos.
- Antes de promover Produção, reviews do PR #150 trouxeram 3 ajustes: salt criptográfico por valor em `settingsCrypto`, paginação de tópicos arquivados Discord e preservação de `systemHint` do título. Correções aplicadas em `feat/020-prod-review-fixes`; validação alvo `npm --prefix backend test -- ingestMessages settingsCrypto parseDiscordAnnouncement` GREEN (36/36) e backend build GREEN.
- Retomada solicitada em 2026-06-01: ler documentos mínimos e retornar o worktree ao branch Beta (`dev`). O que vai fazer: registrar esta intenção, conferir `git status`, buscar `origin/dev` e trocar para `dev` sem alterar código. O que precisa ser feito: garantir worktree limpo e branch local alinhado ao Beta. O que já foi feito: leitura mínima de retomada concluída e branch atual identificado como `feat/020-prod-review-fixes`.
- Lista de melhorias visuais para análise futura, item 1: no fluxo "Nova Mesa", campo "Descrição da Mesa" usa editor rico com área de texto branca e texto/seleção com contraste inadequado no tema escuro; ao adicionar mesa, o texto escrito fica da mesma cor ou muito próximo do background.
- Lista de melhorias visuais/fluxo para análise futura, item 2: ainda na tela de adicionar mesa, ao adicionar uma sugestão de sistema, o fluxo redireciona para `https://mesas.artificiorpg.com/painel` em vez de continuar o fluxo de adição/sugestão de sistema dentro da criação de mesa.
- Lista de melhorias de regra/permissão para análise futura, item 3: quando o usuário é admin e adiciona um novo sistema durante a criação de mesa, não faz sentido seguir o fluxo de sugestão/aguardar aprovação; o sistema deveria ser criado diretamente no catálogo/árvore e ficar disponível no próprio fluxo.
- Diagnóstico solicitado em 2026-06-01, item 4: verificar se sugestões de sistemas e cenários estão chegando, pois a aba administrativa de sugestões aparece limpa há muito tempo. Plano: localizar frontend/backend das sugestões, identificar tabelas/endpoints envolvidos, consultar somente leituras locais/remotas quando possível e separar se o problema está em envio, listagem/filtro ou ausência real de dados.
- Lista de melhorias de formulário/regra para análise futura, item 5: no cadastro de mesa, na área de horário das sessões, adicionar opções explícitas "dia da semana a definir" e "horário a definir".

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
14. [x] T-F1-C-04 — Build + commit + push Fase C.
15. [x] T-F1-D-01 — Migration 122.
16. [x] T-F1-D-02 — Função `uploadDiscordImageToCloudinary`.
17. [x] T-F1-D-03 — Integração no sync.
18. [x] T-F1-D-04 — Cron worker.
19. [x] T-F1-D-05 — Endpoints admin.
20. [x] T-F1-D-06 — Build + commit + push Fase D.
21. [x] T-F1-E-01 — Identificar drafts legacy.
22. [x] T-F1-E-02 — Marcar legacy como ignored + apagar drafts.
23. [x] T-F1-E-03 — Re-parse em massa.
24. [x] T-F1-E-04 — Sessão atualizada com evidência.
25. [x] T-F1-F-01 — Estender types frontend.
26. [x] T-F1-F-02 — Preview de capa + thumbnail.
27. [x] T-F1-F-03 — Widget de desambiguação de slots.
28. [x] T-F1-F-04 — Select de frequência.
29. [x] T-F1-F-05 — Build + commit Fase F.
30. [ ] T-F1-F-06 — Teste funcional Beta pelo mantenedor em janela anônima.

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

### Evidência T-F1-D-06 — GREEN técnico local

Estado: NOT STARTED -> GREEN técnico local

Comandos:
```powershell
npm --prefix backend test -- uploadDiscordImage parseDiscordAnnouncement
npx tsc --noEmit
npm --prefix backend run build
git status --short
```

Output literal:
```text
> backend@1.0.0 test
> jest uploadDiscordImage parseDiscordAnnouncement

(node:6284) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
(node:21104) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 2 passed, 2 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        6.495 s
Ran all test suites matching uploadDiscordImage|parseDiscordAnnouncement.

npx tsc --noEmit
<sem output; exit code 0>

> backend@1.0.0 build
> tsc
```

Invariantes SQL da Fase D após Deploy Beta:
```text
image_upload_attempts:integer:NO
image_upload_last_at:timestamp with time zone:YES
image_upload_last_error:text:YES
image_upload_status:text:YES
discord_cdn_tables=0
```

### Evidência T-F1-E-01/T-F1-E-03 — Operação Beta

Estado: NOT STARTED -> PARTIAL por regressão residual corrigida em código antes do re-parse final

Comandos:
```powershell
SELECT m.id, m.discord_thread_name, length(m.content_raw) ...
BEGIN; UPDATE ...; DELETE ...; UPDATE ...; DELETE ...; COMMIT;
POST /api/v1/admin/discord-sync/messages/parse-batch
SELECT invariantes A/B/C/D/E ...
```

Output literal:
```text
8ed103ec-1e21-4220-b89b-f5cd1b9ac369|Dungeons & Dragons: Tomb of Annihilation|40
20f9e951-3074-4b6e-ae63-d72e2f57ea94|Dungeons & Dragons™: A Queda do Conquistador - Aventura em Galea|64
9294486a-936a-4e4a-bdee-230252c7c5c9|Forgotten Realms™: Uma Campanha Sandbox|39
364bf4e7-4450-4869-a9ae-4179cd23f85c|Dungeons & Dragons™: Goblin Trouble - Terras Marginais|54
7dc7482f-99eb-4014-8513-1182e36ccb05|Ordem Paranormal™: Fortuna e Loucura!|37

BEGIN
UPDATE 5
DELETE 5
UPDATE 184
DELETE 184
COMMIT

{"data":{"processed":184,"succeeded":184,"failed":0}}

A_slots_total_missing=15
A_oneshot_semanal=0
B_hint_parentese=0
C_com_imagem=184,C_com_source=184
D_discord_cdn_tables=0
E_legacy_parsed=0
draft_status_needs_review=70
draft_status_ready=114
message_status_ignored=10
message_status_parsed=184
image_status_none=184
```

Re-parse final após deploy do fix `c7db12f`:
```text
BEGIN
UPDATE 184
DELETE 184
COMMIT

{"data":{"processed":184,"succeeded":184,"failed":0}}

A_slots_total_missing=2
A_oneshot_semanal=0
B_hint_parentese=0
C_com_imagem=184,C_com_source=184
D_discord_cdn_tables=0
E_legacy_parsed=0
draft_status_needs_review=60
draft_status_ready=124
message_status_ignored=10
message_status_parsed=184
image_status_none=184
```

### Evidência T-F1-F-05 — GREEN local

Estado: NOT STARTED -> GREEN técnico local

Comandos:
```powershell
npm --prefix frontend run build
git diff --check
```

Output literal:
```text
> frontend_temp@0.0.0 build
> tsc -b && vite build

vite v8.0.3 building client environment for production...
✓ 2152 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                     1.91 kB │ gzip:   0.71 kB
dist/assets/banner_placeholder-yIcJpBb9.webp       25.98 kB
dist/assets/vendor-react-W1ZBun6d.css              29.75 kB │ gzip:  11.52 kB
dist/assets/index-BzxZ0YsM.css                    152.60 kB │ gzip:  23.54 kB
dist/assets/rolldown-runtime-Dw2cE7zH.js            0.68 kB │ gzip:   0.41 kB
dist/assets/mapTableApiToInitialData-BetHjCM2.js    2.34 kB │ gzip:   0.96 kB
dist/assets/vendor-react-CFloVu4Z.js              346.39 kB │ gzip: 109.08 kB
dist/assets/index-BvEOhJ2O.js                     692.47 kB │ gzip: 186.14 kB
✓ built in 1.01s

(!) Some chunks are larger than 500 kB after minification.

git diff --check
<sem erro; apenas avisos CRLF>
```

### Evidência correção `Vagas: 0` — GREEN local

Estado: RED observado em Beta -> GREEN técnico local

Comandos:
```powershell
npm --prefix backend test -- parseDiscordAnnouncement
npx tsc --noEmit
git diff --check
```

Output literal:
```text
> backend@1.0.0 test
> jest parseDiscordAnnouncement

(node:11600) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       32 passed, 32 total
Snapshots:   0 total
Time:        3.96 s, estimated 4 s
Ran all test suites matching parseDiscordAnnouncement.

npx tsc --noEmit
<sem output; exit code 0>

git diff --check
<sem erro; apenas avisos CRLF>
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

Spec 017 será considerado tecnicamente GREEN quando:

- Jest local de `parseDiscordAnnouncement` e `uploadDiscordImage` passar.
- TypeScript/backend/frontend passar.
- `git status` listar somente arquivos esperados.
- `tasks.md` e esta sessão registrarem estado origem → destino, comando exato e output literal.
- Invariantes SQL A-E forem executadas no Beta após re-parse em massa.
- Deploy Beta e CodeQL ficarem GREEN.
- T-F1-F-06 permanecer explicitamente como validação funcional do mantenedor em janela anônima.

---

## Checklist de fechamento

- [ ] `/speckit.retro.run` ao final da sessão.
- [x] Atualizar `.specify/memory/project-state.md` via `/speckit.status`.
- [ ] Mover sessão para `encerradas/` quando autorizado.
- [x] Atualizar `sessoes/index.md`.

---

## Restrições ativas

- Sem push para `origin/dev` sem autorização explícita.
- Sem writes em banco sem autorização explícita no formato da Constitution §9.2.
- Sem restart de containers.
- Sem alteração fora do escopo do plan 017 §3 sem parar e perguntar.
- Sem adicionar sistemas ao seed.
- Sem persistir Discord CDN em `tables.cover_url` ou `tables.banner_url`.
