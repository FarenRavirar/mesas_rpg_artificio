# 26-04-28_1_fix-publicacao-mesa-opcao.md

**Data:** 28/04/2026
**Objetivo:** Corrigir bug 400 ao publicar mesa no painel (`Invalid option: expected one of "gratuita"|"paga"`) seguindo rotina completa de bugfix SDD.

## Vínculos
- **Sessão anterior:** `sessoes/26-04-26_2_atualizacao-readme-governanca.md`
- **Próxima sessão:** a definir

## Plano de execução
1. [x] Executar triagem SDD do bug e registrar diagnóstico inicial.
2. [x] Executar `/speckit.bugfix.report` (registro do bug + rastreabilidade).
3. [x] Executar `/speckit.bugfix.patch` (ajuste de artefatos da feature).
4. [x] Executar `/speckit.bugfix.verify` (consistência entre artefatos).
5. [x] Implementar correção mínima no código (frontend/backend/integrado, conforme causa).
6. [x] Validar com evidências (comando, output literal, arquivos alterados).
7. [x] Atualizar `project-state.md` com status e próxima ação.
8. [x] Executar validação global solicitada: frontend + backend + VM remota + banco (somente leitura) para garantir ausência de novos conflitos de contrato.

## O que precisa ser feito
- Atualizar `project-state.md` com conclusão do BUG-003 e próxima ação operacional.
- Revisar alterações recentes relacionadas a `bug-ux-covil`, apontando riscos e melhorias sem alterar código.
- Retomar feature SDD `specs/005-runtime-workflows/` na US1, sem avançar para npm/Node ou workflows antes de validar o `mesas-cron`.
- Registrar T011 com aprovação operacional já dada pelo mantenedor para validar o `mesas-cron` na VM, mantendo rastreabilidade de ação/motivo/risco/rollback/comandos.
- Definir mecanismo seguro para levar a alteração de `backend/package.json` ao ambiente remoto, evitando hotpatch silencioso e sem usar commit/push até a etapa autorizada de teste.
- Executar T012 somente após confirmar o caminho de entrega e registrar logs/status remotos do `mesas-cron`.

## O que foi feito
- Sessão criada.
- Revisão solicitada em 28/04/2026: analisar diffs recentes contra o escopo `bug-ux-covil` e opinar sobre melhorias possíveis.
- Correção aplicada em `frontend/src/features/create-table/utils/mapper.ts` com normalização `paid/free` -> `paga/gratuita`.
- Busca de cobertura executada no frontend: envio para API passa por `formStateToPayload` chamado em `useCreateTableForm.ts`.
- Rastreabilidade formal regularizada com BUG-003 + patch em plan/tasks da feature `bug-ux-covil`.
- Validação de infraestrutura beta via VM: `mesas-beta-api`, `mesas-beta-frontend`, `mesas-beta-db` em estado healthy.
- Validação de banco (beta): tipo `price_type` confirmado com elementos `gratuita`, `paga`.
- Validação runtime publicação: `POST /api/v1/gm/tables` retornou `HTTP=201` com criação de mesa `id=98f9e6f1-97db-4b86-93aa-6de6471140fc` usando `price_type="gratuita"`.
- Revisão local das alterações recentes executada: diffs de `bug-ux-covil`, componentes de badges, artefatos SDD e `dist` analisados; builds locais `frontend` e `backend` passaram.
- Riscos apontados na revisão: sobreposição visual no card destacado do perfil do mestre, desalinhamento entre `spec.md`/`plan.md`/`tasks.md` e mudanças fora do escopo do bugfix misturadas no working tree.
- Melhorias solicitadas em 28/04/2026: corrigir findings da revisão sobre sobreposição de badges, escopo SDD inconsistente e alteração admin fora do bugfix.
- Findings corrigidos: badges do card destacado movidos para o canto superior direito; `spec.md` e `plan.md` reconciliados com a Phase 3; `backend/dist/server.js` removido do diff do bugfix.
- Validação pós-correção: `npm run build` em `frontend` concluído com sucesso; busca por `adminHydration` em `backend/dist/server.js` retornou zero resultados.
- Nova solicitação em 28/04/2026: verificar compatibilidade para atualização de Node.js/npm na VM, sem executar atualização.
- Compatibilidade Node/npm verificada sem atualização: VM e containers API usam Node `v22.22.2` + npm `10.9.7`; npm latest `11.13.0` declara suporte a Node `^20.17.0 || >=22.9.0`; Dockerfiles e GitHub Actions permanecem fixados em Node 22.
- Achado operacional separado: `mesas-cron` em produção está reiniciando com `sh: ts-node: not found` porque roda `npm run og:cron` em imagem com dependências dev omitidas; não é efeito de atualização Node/npm.
- `project-state.md` atualizado por pedido explícito do mantenedor com novo pacote operacional: revisão/correção do `mesas-cron`, atualização Node.js/npm e revisão dos workflows.
- `/speckit.specify` iniciado para o pacote operacional Runtime e Workflows.
- Hook obrigatório `speckit.git.feature` executado como procedimento do agente; resultado: branch `005-runtime-workflows`, feature num `005`.
- Spec criada em `specs/005-runtime-workflows/spec.md` com checklist de qualidade em `specs/005-runtime-workflows/checklists/requirements.md`.
- `project-state.md` atualizado para apontar `specs/005-runtime-workflows/` como feature ativa e registrar próximo passo SDD: aguardar aprovação da spec para `/speckit.plan`.
- Correção documental pós-validação: branch ativa do `project-state.md` atualizada para `005-runtime-workflows`.
- `/speckit.plan` iniciado após aprovação verbal do mantenedor para avançar; hook obrigatório `speckit.memorylint.load-agents` cumprido com `AGENTS.md` carregado.
- Setup oficial do plano executado: template copiado para `specs/005-runtime-workflows/plan.md`.
- `/speckit.plan` preenchido: `plan.md`, `research.md`, `data-model.md` e `quickstart.md` criados/atualizados; `AGENTS.md` apontado para o plano ativo entre marcadores SPECKIT.
- `/speckit.tasks` executado sem commit: `specs/005-runtime-workflows/tasks.md` criado com 27 tasks em 6 fases.
- Observação de working tree: `git status` mostra deleções preexistentes fora do escopo da feature; elas não foram revertidas nem tocadas por esta execução.
- T001-T006 concluídas: baseline read-only registrado. Evidência literal: `mesas-cron Restarting (127)`, logs com `sh: ts-node: not found`, VM `node v22.22.2`, `npm 10.9.7`, Dockerfiles/workflows em Node 22.
- T007-T008 concluídas: scripts `og:*` de produção em `backend/package.json` apontam para `node dist/scripts/*.js`; variantes `og:*:dev` preservam execução via `ts-node`.
- T009-T010 concluídas: `npm run build` no backend retornou sucesso (`tsc`); `backend/dist/scripts/cronRunner.js`, `processLinkMetadataJobs.js` e `cleanupLinkMetadataCache.js` existem após build.
- Higiene de escopo: `backend/dist/server.js` foi regenerado pelo build com rota admin fora da feature e limpo manualmente para não misturar alteração de hidratação.
- Confirmação do mantenedor: deleções em `.cline/`, `.clinerules/`, `.cursorrules*`, scripts antigos e `tmp/` foram realizadas intencionalmente pelo mantenedor após migração para Codex/GPT-5.5; não reverter.
- Retomada em 28/04/2026: leituras obrigatórias realizadas (`project-state.md`, `AGENTS.md`, `constitution.md`, `SESSION_FAILURES_REGISTRY.md`, `MAINTAINER_REVIEW_CHECKLIST.md`) e skill `speckit-implement` consultada para seguir `tasks.md`.
- Hook opcional `speckit.git.commit` de `before_implement` identificado, mas não executado porque o mantenedor pediu explicitamente para não commitar por enquanto.
- Aprovação operacional recebida no handoff: prosseguir com ação mutável na VM para validar/corrigir `mesas-cron`, preservando rastreabilidade antes dos comandos.
- T011 concluída: pedido/aprovação operacional registrado nesta sessão; `specs/005-runtime-workflows/tasks.md` atualizado para marcar T011.
- Estado antes da validação remota: branch local `005-runtime-workflows`; `backend/package.json` altera apenas scripts `og:*` para `node dist/scripts/*.js` e adiciona variantes `og:*:dev`; `mesas-cron` remoto observado como `Restarting (127)`.
- `git status --short` local antes da etapa remota registrou deleções intencionais do mantenedor em `.cline/`, `.clinerules/`, `.cursorrules*`, scripts antigos e `tmp/`, além de mudanças SDD/runtime desta feature; nada foi revertido.
- `git status --short` remoto em `/opt/mesas` mostrou arquivos não rastreados preexistentes (`.env.backup-*`, docs/guias, backups, `backend/package.json.bak`, `backend/package.json.v2.bak` etc.); esses arquivos não fazem parte da correção do cron e não serão tocados.
- T012 iniciada: patch transitório aplicado em `/opt/mesas/backend/package.json`, seguido de `docker compose -f docker-compose.prod.yml up -d --no-deps --build --force-recreate mesas-cron`.
- Resultado inicial pós-recreate: container `mesas-cron` saiu de `Restarting (127)` para `Up`; logs agora executam `node dist/scripts/cronRunner.js`, `node dist/scripts/processLinkMetadataJobs.js` e `node dist/scripts/cleanupLinkMetadataCache.js`.
- T012 concluída: após janela mínima de 30 minutos, `mesas-cron` permaneceu `Up 31 minutes`; logs mostram execuções recorrentes do worker via artefatos compilados e não repetem `ts-node: not found`.
- T013 concluída: versões atuais registradas para VM e containers (`v22.22.2` + npm `10.9.7` em VM, `mesas-api`, `mesas-cron` e `mesas-beta-api`).
- T014 concluída: `npm@11.13.0` confirmado como latest/candidato e compatível com Node `^20.17.0 || >=22.9.0`; decisão registrada em `specs/005-runtime-workflows/research.md`.
- T015 concluída: pedido de aprovação para atualização de npm na VM preparado; execução de T016 permanece bloqueada até aprovação explícita.
- Checagem final deste turno: `git diff --check` sem saída para os arquivos tocados; `mesas-cron` remoto segue `Up 33 minutes`; T016 permanece pendente.
- Aprovação explícita recebida em 28/04/2026 para executar T016: atualizar somente o npm global da VM de `10.9.7` para `11.13.0`, mantendo Node.js `v22.22.2`.
- T016 bloqueada na primeira tentativa: comando aprovado `npm install -g npm@11.13.0` falhou com `EACCES` ao tentar renomear `/usr/lib/node_modules/npm`; versão da VM permaneceu `v22.22.2` + npm `10.9.7`.
- Consulta a `.specify/memory/errors.md` por `EACCES|npm|permission|permiss|node_modules|sudo` não encontrou erro específico para atualização global de npm; retornou apenas registros gerais de permissão/SSH/build sem solução diretamente aplicável.
- Próxima ação segura: solicitar aprovação explícita para repetir a mesma atualização com `sudo npm install -g npm@11.13.0`.
- Pergunta do mantenedor: confirmar por que `config faren` não executou como root apesar de ser usuário administrador e verificar alternativa de comando.
- Diagnóstico read-only: `ssh -F C:/projetos/config faren` autentica como usuário `ubuntu`, que pertence aos grupos `sudo` e `docker`; `sudo -n true` retorna `SUDO_NOPASSWD_OK`. O npm global está em prefixo `/usr`, com `/usr/lib/node_modules/npm` pertencente a `root:root`, por isso `npm install -g` sem `sudo` falha com `EACCES`.
- Retomada após confirmação do mantenedor: iniciar atualização efetiva do npm com `sudo -H npm install -g npm@11.13.0`.
- Pendências restantes listadas ao mantenedor: T016 atualizar npm; T017 validar serviços; T018-T021 revisar workflows; T022-T023 corrigir/validar workflows se necessário; T024-T027 fechar documentação/status/busca final.
- T016 executada: `sudo -H npm install -g npm@11.13.0` falhou com `MODULE_NOT_FOUND: promise-retry`; alternativa conservadora `sudo -H npx npm@11.13.0 install -g npm@11.13.0` concluiu com sucesso.
- T017 concluída: VM validada com Node `v22.22.2` e npm `11.13.0`; `mesas-api`, `mesas-cron` e `mesas-beta-api` seguem `Up`, com APIs healthy onde há healthcheck.
- Observação T017: `docker compose` em `/opt/mesas-beta` emitiu warning read-only `The "PROD_DB_URL" variable is not set. Defaulting to a blank string.` durante `ps`, sem alterar estado dos containers.
- T018 concluída: `.github/workflows/ci.yml` usa `actions/setup-node@v4` com `node-version: '22'`, cache npm por lockfile, `npm ci` e `npm run build` para frontend/backend. Status: alinhado.
- T019 concluída: `.github/workflows/deploy-beta.yml` usa Node 22 para typecheck frontend e deploy remoto por Docker Compose; runtime final vem dos Dockerfiles `node:22-alpine`. Status: alinhado.
- T020 concluída: `.github/workflows/deploy-prod.yml` usa Node 22 para typecheck frontend e deploy remoto por Docker Compose; runtime final vem dos Dockerfiles `node:22-alpine`. Status: alinhado.
- T021 concluída: `.github/workflows/promote-to-prod.yml` usa Node 22 no typecheck e deploy remoto por Docker Compose; runtime final vem dos Dockerfiles `node:22-alpine`. Status runtime/npm: alinhado.
- T022 concluída sem patch: nenhuma divergência real de runtime/npm/deploy foi encontrada nos workflows revisados.
- T023 concluída: parse YAML dos quatro workflows retornou `YAML_OK`.
- T024 concluída: `specs/005-runtime-workflows/quickstart.md` atualizado com evidências finais e comandos efetivamente usados.
- T025 concluída: `.specify/memory/project-state.md` atualizado com progresso da feature 005, npm `11.13.0`, cron saudável e workflows alinhados.
- T026 concluída: sessão atualizada com outputs literais, arquivos alterados e próximo passo.
- T027 concluída: busca final específica por scripts antigos de produção (`"og:*": "ts-node`) retornou zero resultados; busca ampla ainda mostra `ts-node` apenas em scripts dev/importadores e devDependency.
- Próximo passo: revisar `git status`, manter sem commit até autorização do mantenedor, e reconciliar o dirty state transitório da VM via commit/deploy formal.
- Validação final local: `rg -n "^- \[ \]" specs/005-runtime-workflows/tasks.md` sem resultados; `git diff --check` sem saída após remover espaços finais tocados em `project-state.md`.
- Validação final remota: VM em Node `v22.22.2` e npm `11.13.0`; `mesas-api` healthy e `mesas-cron` `Up`; `/opt/mesas/backend/package.json` permanece modificado como hotpatch transitório a reconciliar.
- Autorização recebida do mantenedor para seguir com consolidação formal: executar validações, separar escopo da feature e commitar apenas arquivos relacionados a `005-runtime-workflows`/runtime, sem tocar nas deleções intencionais fora do escopo.
- Validação pré-commit executada: `npm run build` em `backend` passou com `tsc`.
- Commit local criado para consolidar a feature 005 com mensagem `fix(runtime): corrige cron e alinha Node npm`.
- Solicitação do mantenedor: fazer merge da branch `005-runtime-workflows` em `dev` e apagar a branch atual após unificação.
- Cuidado operacional: working tree contém deleções intencionais do mantenedor fora do escopo; preservar sem misturar no merge.
- Deleções intencionais fora do escopo preservadas temporariamente em stash `preserve maintainer deletions before runtime merge`.
- Merge local realizado em `dev` com commit `merge(runtime): integra workflows runtime`.
- Branch local `005-runtime-workflows` apagada após constar em `git branch --merged dev`.
- Stash temporário reaplicado e removido; deleções intencionais do mantenedor voltaram ao working tree em `dev`, sem stage.
- Confirmação do mantenedor: deleções em `.cline/`, `.clinerules/`, `.cursorrules*`, scripts legados e `tmp/` são intencionais e devem ser sincronizadas no `dev` local como limpeza de arquivos de outros agentes.
- Autorização explícita recebida para executar `git push origin dev`.
- Solicitação posterior: investigar o run GitHub Actions `25078908968` e explicar a origem dos muitos warnings sobre Node.js.
- Investigação do run `25078908968`: workflow `Deploy Beta`, conclusão `success`, branch `dev`, commit `f896325`.
- Origem principal dos warnings de Node.js: actions JavaScript ainda referenciadas como `actions/checkout@v4` e `actions/setup-node@v4`, que declaram runtime interno Node 20. Não é o Node do projeto nem a VM.
- O próprio job `deploy-app` mostra `actions/setup-node@v4` instalando Node `v22.22.2`; portanto o runtime do projeto no runner está correto.
- Origem secundária dos avisos com npm: builds Docker baseados em `node:22-alpine` ainda exibem `npm notice New major version of npm available! 10.9.7 -> 11.13.0`, porque a atualização global da VM não altera o npm embutido na imagem base Docker.
- Tags verificadas: `actions/checkout@v5`, `actions/setup-node@v5` e `actions/setup-node@v6` existem e seus `action.yml` declaram `runs.using: node24`.
- Green flag do mantenedor: atualizar tudo que estiver causando warning; interpretação inicial de manter Node 22 foi corrigida na sequência.
- Correção de escopo pelo mantenedor: atualizar para as versões mais atuais de Node e npm, não manter Node 22.
- Versões oficiais verificadas em 28/04/2026: Node `v25.9.0` no índice `https://nodejs.org/dist/index.json`; npm latest `11.13.0`.
- VM atualizada via NodeSource de `node_22.x` para `node_25.x`: `nodejs=25.9.0-1nodesource1`; npm ajustado para `11.13.0`.
- Workflows atualizados para `actions/checkout@v5`, `actions/setup-node@v6` e `node-version: '25.9.0'`.
- Dockerfiles atualizados para `node:25.9.0-alpine` e instalação de `npm@11.13.0` antes de `npm ci`.
- Validação VM pós-upgrade: `node v25.9.0`, `npm 11.13.0`; NodeSource passou a usar `node_25.x`; serviços `mesas-api`, `mesas-cron`, `mesas-beta-api`, `mesas-beta-frontend` seguem `Up`, com healthcheck saudável onde aplicável.
- Validação local: `npm run build` passou em `backend`; `npm run build` passou em `frontend` com warnings já conhecidos de chunk/plugin timing.
- Validação workflow/Docker: YAML parse OK para workflows alterados; `docker manifest inspect node:25.9.0-alpine` retornou manifesto com `linux/arm64`; busca por `checkout@v4`, `setup-node@v4`, `node-version: '22'`, `node:22-alpine` retornou apenas menção histórica rejeitada em `research.md`.

## Aprovação necessária — T016 atualização npm na VM
- **Ação:** atualizar somente o npm global da VM de `10.9.7` para `11.13.0`, mantendo Node.js em `v22.22.2`.
- **Motivo:** `npm@11.13.0` é o latest observado e declara compatibilidade com Node `^20.17.0 || >=22.9.0`; a VM está dentro da baseline Node 22.
- **Risco:** mudança no gerenciador global pode alterar comportamento de comandos `npm` executados diretamente no host em deploys manuais ou scripts remotos; containers já construídos não mudam automaticamente.
- **Rollback:** reinstalar npm `10.9.7` globalmente na VM e verificar `node -v && npm -v`; se algum fluxo falhar, manter containers atuais e não recriar serviços por causa desta etapa.
- **Comandos propostos:**
  1. `ssh -F C:/projetos/config faren 'node -v && npm -v'`
  2. `ssh -F C:/projetos/config faren 'npm install -g npm@11.13.0'`
  3. `ssh -F C:/projetos/config faren 'node -v && npm -v'`
  4. `ssh -F C:/projetos/config faren 'cd /opt/mesas && docker compose -f docker-compose.prod.yml ps mesas-api mesas-cron && cd /opt/mesas-beta && docker compose -f docker-compose.beta.yml ps mesas-beta-api'`

## Evidência literal — T016 / tentativa sem sudo bloqueada
```text
ssh -F C:/projetos/config faren 'node -v && npm -v'
v22.22.2
10.9.7
```

```text
ssh -F C:/projetos/config faren 'whoami; id; echo SUDO_CHECK; sudo -n true && echo SUDO_NOPASSWD_OK || echo SUDO_NEEDS_PASSWORD_OR_DENIED; echo NPM_PATH; command -v npm; readlink -f $(command -v npm); echo NPM_PREFIX; npm config get prefix; echo NODE_MODULES_PERMS; ls -ld /usr/lib /usr/lib/node_modules /usr/lib/node_modules/npm 2>/dev/null'
ubuntu
uid=1001(ubuntu) gid=1001(ubuntu) groups=1001(ubuntu),4(adm),20(dialout),24(cdrom),25(floppy),27(sudo),29(audio),30(dip),44(video),46(plugdev),119(netdev),120(lxd),121(docker)
SUDO_CHECK
SUDO_NOPASSWD_OK
NPM_PATH
/usr/bin/npm
/usr/lib/node_modules/npm/bin/npm-cli.js
NPM_PREFIX
/usr
NODE_MODULES_PERMS
drwxr-xr-x 77 root root 4096 Apr 22 06:27 /usr/lib
drwxr-xr-x  4 root root 4096 Apr  7 10:43 /usr/lib/node_modules
drwxr-xr-x  7 root root 4096 Apr  7 10:43 /usr/lib/node_modules/npm
```

```text
ssh -F C:/projetos/config faren 'sudo -H npm install -g npm@11.13.0'
npm error code MODULE_NOT_FOUND
npm error Cannot find module 'promise-retry'
npm error Require stack:
npm error - /usr/lib/node_modules/npm/node_modules/@npmcli/arborist/lib/arborist/rebuild.js
npm error - /usr/lib/node_modules/npm/node_modules/@npmcli/arborist/lib/arborist/index.js
npm error - /usr/lib/node_modules/npm/node_modules/@npmcli/arborist/lib/index.js
npm error - /usr/lib/node_modules/npm/node_modules/libnpmfund/lib/index.js
npm error - /usr/lib/node_modules/npm/lib/utils/reify-output.js
npm error - /usr/lib/node_modules/npm/lib/utils/reify-finish.js
npm error - /usr/lib/node_modules/npm/lib/commands/install.js
npm error - /usr/lib/node_modules/npm/lib/npm.js
npm error - /usr/lib/node_modules/npm/lib/cli/entry.js
npm error - /usr/lib/node_modules/npm/lib/cli.js
npm error - /usr/lib/node_modules/npm/bin/npm-cli.js
npm error A complete log of this run can be found in: /root/.npm/_logs/2026-04-28T21_17_40_922Z-debug-0.log
```

```text
ssh -F C:/projetos/config faren 'sudo -H npx npm@11.13.0 install -g npm@11.13.0'

removed 57 packages, and changed 92 packages in 2s

15 packages are looking for funding
  run `npm fund` for details
npm warn exec The following package was not found and will be installed: npm@11.13.0
```

```text
ssh -F C:/projetos/config faren 'node -v && npm -v && sudo -H npm -v'
v22.22.2
11.13.0
11.13.0
```

```text
ssh -F C:/projetos/config faren 'cd /opt/mesas && docker compose -f docker-compose.prod.yml ps mesas-api mesas-cron && cd /opt/mesas-beta && docker compose -f docker-compose.beta.yml ps mesas-beta-api'
NAME         IMAGE              COMMAND                  SERVICE      CREATED             STATUS                PORTS
mesas-api    mesas-mesas-api    "docker-entrypoint.s…"   mesas-api    4 days ago          Up 4 days (healthy)   3000/tcp
mesas-cron   mesas-mesas-cron   "docker-entrypoint.s…"   mesas-cron   About an hour ago   Up About an hour      3000/tcp
NAME             IMAGE                       COMMAND                  SERVICE          CREATED       STATUS                 PORTS
mesas-beta-api   mesas-beta-mesas-beta-api   "docker-entrypoint.s…"   mesas-beta-api   2 hours ago   Up 2 hours (healthy)   3000/tcp
time="2026-04-28T18:19:01-03:00" level=warning msg="The \"PROD_DB_URL\" variable is not set. Defaulting to a blank string."
```

```text
ssh -F C:/projetos/config faren 'cd /opt/mesas && docker logs --tail 40 mesas-cron 2>&1'
[CronRunner] Executando: npm run og:worker às 2026-04-28T20:55:52.977Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T21:00:53.019Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T21:05:53.119Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T21:10:53.140Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T21:15:53.156Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.
```

## Evidência literal — T018-T023 / workflows
```text
Select-String -Path .github/workflows/ci.yml,.github/workflows/deploy-beta.yml,.github/workflows/deploy-prod.yml,.github/workflows/promote-to-prod.yml -Pattern 'node-version|setup-node|npm ci|npm run build|docker compose|npm install|node:|NODE|npm|ssh|build|up -d|promote|checkout' -CaseSensitive:$false
.github\workflows\ci.yml:25:      - name: Setup Node
.github\workflows\ci.yml:26:        uses: actions/setup-node@v4
.github\workflows\ci.yml:28:          node-version: '22'
.github\workflows\ci.yml:33:        run: cd frontend && npm ci
.github\workflows\ci.yml:36:        run: cd frontend && npm run build
.github\workflows\ci.yml:43:      - name: Setup Node
.github\workflows\ci.yml:44:        uses: actions/setup-node@v4
.github\workflows\ci.yml:46:          node-version: '22'
.github\workflows\ci.yml:51:        run: cd backend && npm ci
.github\workflows\ci.yml:54:        run: cd backend && npm run build
.github\workflows\deploy-beta.yml:107:      - name: Setup Node.js
.github\workflows\deploy-beta.yml:108:        uses: actions/setup-node@v4
.github\workflows\deploy-beta.yml:110:          node-version: '22'
.github\workflows\deploy-beta.yml:114:        run: npm ci
.github\workflows\deploy-beta.yml:146:            docker compose -f docker-compose.beta.yml build --no-cache
.github\workflows\deploy-beta.yml:148:            docker compose -f docker-compose.beta.yml up -d --force-recreate
.github\workflows\deploy-prod.yml:47:      - name: Setup Node.js
.github\workflows\deploy-prod.yml:48:        uses: actions/setup-node@v4
.github\workflows\deploy-prod.yml:50:          node-version: '22'
.github\workflows\deploy-prod.yml:55:        run: npm ci
.github\workflows\deploy-prod.yml:101:            docker compose -f docker-compose.prod.yml build --no-cache
.github\workflows\deploy-prod.yml:131:            docker compose -f docker-compose.prod.yml up -d --force-recreate
.github\workflows\promote-to-prod.yml:46:      - name: Setup Node.js
.github\workflows\promote-to-prod.yml:47:        uses: actions/setup-node@v4
.github\workflows\promote-to-prod.yml:49:          node-version: '22'
.github\workflows\promote-to-prod.yml:54:        run: npm ci
.github\workflows\promote-to-prod.yml:137:            docker compose -f docker-compose.prod.yml build --no-cache
.github\workflows\promote-to-prod.yml:169:            docker compose -f docker-compose.prod.yml up -d --force-recreate
```

```text
Select-String -Path backend/Dockerfile,frontend/Dockerfile,docker-compose.prod.yml,docker-compose.beta.yml -Pattern 'FROM node|npm ci|npm run build|command: npm run og:cron|mesas-cron|node:22|npm install' -CaseSensitive:$false
backend\Dockerfile:7:FROM node:22-alpine AS builder
backend\Dockerfile:12:RUN npm ci
backend\Dockerfile:20:RUN npm run build
backend\Dockerfile:24:FROM node:22-alpine AS production
backend\Dockerfile:32:RUN npm ci --omit=dev
frontend\Dockerfile:7:FROM node:22-alpine AS builder
frontend\Dockerfile:24:RUN npm ci
frontend\Dockerfile:28:RUN npm run build
docker-compose.prod.yml:88:  mesas-cron:
docker-compose.prod.yml:92:    container_name: mesas-cron
docker-compose.prod.yml:106:    command: npm run og:cron
```

```text
python - <<'PY'
import yaml
for name in ['.github/workflows/ci.yml','.github/workflows/deploy-beta.yml','.github/workflows/deploy-prod.yml','.github/workflows/promote-to-prod.yml']:
    with open(name, 'r', encoding='utf-8') as fh:
        yaml.safe_load(fh)
    print(f'YAML_OK {name}')
PY
YAML_OK .github/workflows/ci.yml
YAML_OK .github/workflows/deploy-beta.yml
YAML_OK .github/workflows/deploy-prod.yml
YAML_OK .github/workflows/promote-to-prod.yml
```

## Evidência literal — T024-T027 / fechamento
```text
ssh -F C:/projetos/config faren 'node -v && npm -v && cd /opt/mesas && docker compose -f docker-compose.prod.yml ps mesas-cron'
v22.22.2
11.13.0
NAME         IMAGE              COMMAND                  SERVICE      CREATED             STATUS             PORTS
mesas-cron   mesas-mesas-cron   "docker-entrypoint.s…"   mesas-cron   About an hour ago   Up About an hour   3000/tcp
```

```text
rg -n '"og:(worker|cleanup|cron)": "ts-node' backend/package.json docker-compose.prod.yml docker-compose.beta.yml .github/workflows
```

```text
rg -n '"og:(worker|cleanup|cron)": "node dist/scripts' backend/package.json
17:    "og:worker": "node dist/scripts/processLinkMetadataJobs.js",
18:    "og:cleanup": "node dist/scripts/cleanupLinkMetadataCache.js",
19:    "og:cron": "node dist/scripts/cronRunner.js",
```

```text
rg -n "^- \[ \]" specs/005-runtime-workflows/tasks.md
```

```text
git diff --check -- backend/package.json specs/005-runtime-workflows/research.md specs/005-runtime-workflows/quickstart.md specs/005-runtime-workflows/tasks.md .specify/memory/project-state.md sessoes/26-04-28_1_fix-publicacao-mesa-opcao.md
```

```text
ssh -F C:/projetos/config faren 'node -v && npm -v && cd /opt/mesas && docker compose -f docker-compose.prod.yml ps mesas-api mesas-cron && git status --short backend/package.json'
v22.22.2
11.13.0
NAME         IMAGE              COMMAND                  SERVICE      CREATED             STATUS                PORTS
mesas-api    mesas-mesas-api    "docker-entrypoint.s…"   mesas-api    4 days ago          Up 4 days (healthy)   3000/tcp
mesas-cron   mesas-mesas-cron   "docker-entrypoint.s…"   mesas-cron   About an hour ago   Up About an hour      3000/tcp
 M backend/package.json
```

```text
cd backend && npm run build

> backend@1.0.0 build
> tsc
```

```text
ssh -F C:/projetos/config faren 'npm install -g npm@11.13.0'
npm error code EACCES
npm error syscall rename
npm error path /usr/lib/node_modules/npm
npm error dest /usr/lib/node_modules/.npm-qUIFSsiV
npm error errno -13
npm error Error: EACCES: permission denied, rename '/usr/lib/node_modules/npm' -> '/usr/lib/node_modules/.npm-qUIFSsiV'
npm error     at async Object.rename (node:internal/fs/promises:784:10)
npm error     at async moveFile (/usr/lib/node_modules/npm/node_modules/@npmcli/fs/lib/move-file.js:30:5)
npm error     at async Promise.allSettled (index 0)
npm error     at async [reifyPackages] (/usr/lib/node_modules/npm/node_modules/@npmcli/arborist/lib/arborist/reify.js:334:11)
npm error     at async Arborist.reify (/usr/lib/node_modules/npm/node_modules/@npmcli/arborist/lib/arborist/reify.js:149:5)
npm error     at async Install.exec (/usr/lib/node_modules/npm/lib/commands/install.js:150:5)
npm error     at async Npm.exec (/usr/lib/node_modules/npm/lib/npm.js:207:9)
npm error     at async module.exports (/usr/lib/node_modules/npm/lib/cli/entry.js:74:5) {
npm error   errno: -13,
npm error   code: 'EACCES',
npm error   syscall: 'rename',
npm error   path: '/usr/lib/node_modules/npm',
npm error   dest: '/usr/lib/node_modules/.npm-qUIFSsiV'
npm error }
npm error
npm error The operation was rejected by your operating system.
npm error It is likely you do not have the permissions to access this file as the current user
npm error
npm error If you believe this might be a permissions issue, please double-check the
npm error permissions of the file and its containing directories, or try running
npm error the command again as root/Administrator.
npm error A complete log of this run can be found in: /home/ubuntu/.npm/_logs/2026-04-28T21_12_52_190Z-debug-0.log
```

```text
ssh -F C:/projetos/config faren 'node -v && npm -v'
v22.22.2
10.9.7
```

## Evidência literal — T011 / pré-validação remota
```text
git branch --show-current
005-runtime-workflows
```

```text
git diff -- backend/package.json
diff --git a/backend/package.json b/backend/package.json
index be5a37e..ff9f86f 100644
--- a/backend/package.json
+++ b/backend/package.json
@@ -14,9 +14,12 @@
     "systems:import-json": "ts-node src/scripts/importSistemas.ts",
     "scenarios:import": "ts-node src/scripts/importCenarios.ts",
     "metrics:cleanup": "ts-node src/scripts/cleanupMetricEvents.ts",
-    "og:worker": "ts-node src/scripts/processLinkMetadataJobs.ts",
-    "og:cleanup": "ts-node src/scripts/cleanupLinkMetadataCache.ts",
-    "og:cron": "ts-node src/scripts/cronRunner.ts"
+    "og:worker": "node dist/scripts/processLinkMetadataJobs.js",
+    "og:cleanup": "node dist/scripts/cleanupLinkMetadataCache.js",
+    "og:cron": "node dist/scripts/cronRunner.js",
+    "og:worker:dev": "ts-node src/scripts/processLinkMetadataJobs.ts",
+    "og:cleanup:dev": "ts-node src/scripts/cleanupLinkMetadataCache.ts",
+    "og:cron:dev": "ts-node src/scripts/cronRunner.ts"
   },
   "keywords": [],
   "author": "",
```

```text
ssh -F C:/projetos/config faren "cd /opt/mesas && git status --short && docker ps --filter name=mesas-cron --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'"
?? .env.backup-
?? .env.backup-20260408-233629
?? .env.backup_20260414_2325
?? .env.backup_20260415_023159
?? .env.backup_20260415_024259
?? .env.backup_20260415_025550
?? .env.backup_20260415_030206
?? .env.backup_20260415_030212
?? .env.example
?? .github/.env.exemple
?? .github/workflows/deploy-production.yml
?? .kiro/
?? .postman/
?? GIT_WORKFLOW.md
?? GUIA_RAPIDO_OPERACIONAL.md
?? PRE-FLIGHT_CHECKLIST.md
?? PRIORIDADES_OBVIAS.MD
?? Plano_reestruturacao.md
?? "admin inline criation.md"
?? backend/package.json.bak
?? backend/package.json.v2.bak
?? backups/
?? postman/
?? teste.json
NAMES        STATUS                            IMAGE
mesas-cron   Restarting (127) 11 seconds ago   mesas-mesas-cron
```

## Evidência literal — T012 / aplicação inicial na VM
```text
ssh -F C:/projetos/config faren 'cd /opt/mesas && node -e "...patch backend/package.json..." && git diff -- backend/package.json && docker compose -f docker-compose.prod.yml up -d --no-deps --build --force-recreate mesas-cron && docker compose -f docker-compose.prod.yml ps mesas-cron'
REMOTE_PACKAGE_JSON_PATCHED
diff --git a/backend/package.json b/backend/package.json
index 577ccad..ec1d9c1 100644
--- a/backend/package.json
+++ b/backend/package.json
@@ -14,9 +14,12 @@
     "systems:import-json": "ts-node src/scripts/importSistemas.ts",
     "scenarios:import": "ts-node src/scripts/importCenarios.ts",
     "metrics:cleanup": "ts-node src/scripts/cleanupMetricEvents.ts",
-    "og:worker": "ts-node src/scripts/processLinkMetadataJobs.ts",
-    "og:cleanup": "ts-node src/scripts/cleanupLinkMetadataCache.ts",
-    "og:cron": "ts-node src/scripts/cronRunner.ts"
+    "og:worker": "node dist/scripts/processLinkMetadataJobs.js",
+    "og:cleanup": "node dist/scripts/cleanupLinkMetadataCache.js",
+    "og:cron": "node dist/scripts/cronRunner.js",
+    "og:worker:dev": "ts-node src/scripts/processLinkMetadataJobs.ts",
+    "og:cleanup:dev": "ts-node src/scripts/cleanupLinkMetadataCache.ts",
+    "og:cron:dev": "ts-node src/scripts/cronRunner.ts"
   },
   "keywords": [],
   "author": "",
#23 writing image sha256:eea59c051e90e0d3b21a77e136f4023fdb18cf2c4644f5f6025b3599ee8273bd done
#23 naming to docker.io/library/mesas-mesas-cron done
NAME         IMAGE              COMMAND                  SERVICE      CREATED        STATUS                  PORTS
mesas-cron   mesas-mesas-cron   "docker-entrypoint.s…"   mesas-cron   1 second ago   Up Less than a second   3000/tcp
 mesas-mesas-cron  Built
 Container mesas-cron  Recreate
 Container mesas-cron  Recreated
 Container mesas-cron  Starting
 Container mesas-cron  Started
```

```text
ssh -F C:/projetos/config faren 'cd /opt/mesas && docker compose -f docker-compose.prod.yml ps mesas-cron && docker logs --tail 80 mesas-cron 2>&1 && git status --short backend/package.json'
NAME         IMAGE              COMMAND                  SERVICE      CREATED          STATUS         PORTS
mesas-cron   mesas-mesas-cron   "docker-entrypoint.s…"   mesas-cron   11 seconds ago   Up 9 seconds   3000/tcp

> backend@1.0.0 og:cron
> node dist/scripts/cronRunner.js

[CronRunner] Iniciado com sucesso. Agendamentos registrados.
[CronRunner] Executando: npm run og:worker às 2026-04-28T20:15:52.416Z
[CronRunner] Executando: npm run og:cleanup às 2026-04-28T20:15:52.422Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] STDOUT (npm run og:cleanup):
> backend@1.0.0 og:cleanup
> node dist/scripts/cleanupLinkMetadataCache.js

[MetadataCleanup] Iniciando rotina de manutenção...
[MetadataCleanup] 0 links inativos purgados (> 30 dias secos).
[MetadataCleanup] 0 links marcados para revalidação (> 60 dias obsoletos).

 M backend/package.json
```

## Evidência literal — T013/T014 / runtime npm
```text
ssh -F C:/projetos/config faren 'echo VM && node -v && npm -v && echo PROD_API && docker exec mesas-api node -v && docker exec mesas-api npm -v && echo PROD_CRON && docker exec mesas-cron node -v && docker exec mesas-cron npm -v && echo BETA_API && docker exec mesas-beta-api node -v && docker exec mesas-beta-api npm -v'
VM
v22.22.2
10.9.7
PROD_API
v22.22.2
10.9.7
PROD_CRON
v22.22.2
10.9.7
BETA_API
v22.22.2
10.9.7
```

```text
npm view npm@11.13.0 version engines --json
{
  "version": "11.13.0",
  "engines": {
    "node": "^20.17.0 || >=22.9.0"
  }
}
```

```text
npm view npm version engines --json
{
  "version": "11.13.0",
  "engines": {
    "node": "^20.17.0 || >=22.9.0"
  }
}
```

```text
git diff --check -- backend/package.json specs/005-runtime-workflows/research.md specs/005-runtime-workflows/tasks.md sessoes/26-04-28_1_fix-publicacao-mesa-opcao.md
```

```text
ssh -F C:/projetos/config faren 'cd /opt/mesas && docker compose -f docker-compose.prod.yml ps mesas-cron && docker logs --tail 20 mesas-cron 2>&1 | tail -20 && git status --short backend/package.json'
NAME         IMAGE              COMMAND                  SERVICE      CREATED          STATUS          PORTS
mesas-cron   mesas-mesas-cron   "docker-entrypoint.s…"   mesas-cron   33 minutes ago   Up 33 minutes   3000/tcp

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T20:40:52.794Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T20:45:52.868Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

 M backend/package.json
```

```text
Start-Sleep -Seconds 1800; ssh -F C:/projetos/config faren 'cd /opt/mesas && date -u && docker compose -f docker-compose.prod.yml ps mesas-cron && docker logs --tail 120 mesas-cron 2>&1 && git status --short backend/package.json'
Tue Apr 28 20:46:57 UTC 2026
NAME         IMAGE              COMMAND                  SERVICE      CREATED          STATUS          PORTS
mesas-cron   mesas-mesas-cron   "docker-entrypoint.s…"   mesas-cron   31 minutes ago   Up 31 minutes   3000/tcp

> backend@1.0.0 og:cron
> node dist/scripts/cronRunner.js

[CronRunner] Iniciado com sucesso. Agendamentos registrados.
[CronRunner] Executando: npm run og:worker às 2026-04-28T20:15:52.416Z
[CronRunner] Executando: npm run og:cleanup às 2026-04-28T20:15:52.422Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] STDOUT (npm run og:cleanup):
> backend@1.0.0 og:cleanup
> node dist/scripts/cleanupLinkMetadataCache.js

[MetadataCleanup] Iniciando rotina de manutenção...
[MetadataCleanup] 0 links inativos purgados (> 30 dias secos).
[MetadataCleanup] 0 links marcados para revalidação (> 60 dias obsoletos).

[CronRunner] Executando: npm run og:worker às 2026-04-28T20:20:52.501Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T20:25:52.572Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T20:30:52.668Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T20:35:52.725Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T20:40:52.794Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

[CronRunner] Executando: npm run og:worker às 2026-04-28T20:45:52.868Z
[CronRunner] STDOUT (npm run og:worker):
> backend@1.0.0 og:worker
> node dist/scripts/processLinkMetadataJobs.js

[MetadataWorker] Acordando por gatilho...
[MetadataWorker] Nenhum job pendente.

 M backend/package.json
```

## Aprovação operacional registrada para T011
- **Ação:** levar a correção de scripts `og:*` para um teste controlado do serviço `mesas-cron` na VM e recriar/reiniciar apenas o serviço necessário para validar a saída do loop `ts-node: not found`.
- **Motivo:** o container de produção está reiniciando porque a imagem roda com `npm ci --omit=dev` e não possui `ts-node`; os scripts de produção agora apontam para `dist/scripts/*.js`.
- **Risco:** indisponibilidade temporária do processamento de metadados OpenGraph enquanto o cron é recriado; risco de dirty state se a alteração for aplicada direto na VM sem reconciliação posterior no repo.
- **Rollback:** restaurar o comando/script anterior a partir do estado Git remoto e recriar o serviço `mesas-cron`; se necessário, parar a validação e manter o serviço no estado anterior até deploy formal.
- **Comandos candidatos:** conferir `/opt/mesas`, `git status --short`, branch/remotes, diff de `backend/package.json`, estado/logs do `mesas-cron`; só então escolher entre entrega via branch/commit de teste ou aplicação transitória documentada.

## Evidências literais
- Enum DB: `public | price_type | ... | Elements | gratuita + paga`
- Runtime publish: `HTTP=201`
- Response body: `{"data":{"id":"98f9e6f1-97db-4b86-93aa-6de6471140fc","slug":"mesa-teste-bug003-moir1e9t","title":"Mesa teste bug003","status":"active"...}}`

## Retro da sessão (`/speckit.retro.run`)
- [x] Retro executada como **procedimento do agente** (não CLI).
- Referência aplicada: `docs/sdd/RETRO_EXTENSION.md` (comando principal, posição no workflow, output esperado e troubleshooting).
- Evidências usadas na retro desta sessão:
  - Histórico git recente coletado (`git log --oneline -n 20`) com commit do bugfix `79ca32a`.
  - Artefatos da feature presentes em `.specify/features/bug-ux-covil/` (`spec.md`, `plan.md`, `tasks.md`, `validation-report.md`, `bugs/`).
- Resultado da retro (sessão atual):
  - Acerto: correção de contrato `price_type` com validação runtime `HTTP 201` em beta.
  - Falha processual: confusão entre slash command e shell no meio da sessão.
  - Ação preventiva consolidada: regra explícita no `AGENTS.md` proibindo tratar `/speckit.*` como comando de terminal.

## Checklist de fechamento (ordem fixa)
- [x] Atualizar `.specify/memory/project-state.md` via `/speckit.status`
- [x] `/speckit.retro.run`
- [x] Atualizar `.specify/memory/session-log.md`
- [x] Atualizar `sessoes/index.md`
- [x] Mover sessão para `encerradas/` (autorizado pelo mantenedor em 2026-04-28)

## Arquivos que serão modificados
- `sessoes/encerradas/26-04-28_1_fix-publicacao-mesa-opcao.md`
- `sessoes/index.md`
- `.specify/features/bug-ux-covil/bugs/BUG-003.md`
- `.specify/features/bug-ux-covil/plan.md`
- `.specify/features/bug-ux-covil/tasks.md`
- `frontend/src/features/create-table/utils/mapper.ts`
- `backend/package.json`
- `specs/005-runtime-workflows/tasks.md`
- `specs/005-runtime-workflows/quickstart.md`
- `specs/005-runtime-workflows/pr-description.md`
- `.specify/memory/project-state.md`

## Critério de conclusão explícito
Publicação de mesa no painel beta concluindo sem 400 por enum inválido, com consistência entre spec/plan/tasks e validação global (frontend/backend/VM/DB) registrada.

[2026-04-28 19:12:42 -03:00] Correção solicitada: limpar aviso ShellCheck SC2086 em .github/workflows/_enforce-migration-dir.yml, preservando a validação de diretório canônico de migrations.
[2026-04-28 19:13:31 -03:00] Correção aplicada: removido eval e expansão textual de FIND_EXCLUDES; find agora recebe array Bash com argumentos preservados. Validação YAML OK; shellcheck/actionlint local indisponível; git diff --check sem erros.
[2026-04-28 19:14:29 -03:00] Aprovação recebida: commitar e enviar correção do lint para origin/dev, disparando Deploy Beta.
[2026-04-28 19:35:00 -03:00] Fechamento SDD autorizado: `pr-description.md` criado para `specs/005-runtime-workflows/`; T028 adicionada e concluída; project-state, session-log e index atualizados; sessão autorizada para arquivamento em `sessoes/encerradas/`.

## Retro final da feature 005 (`/speckit.retro.run`)
- [x] Retro executada como procedimento do agente, não CLI.
- Resultado: feature `005-runtime-workflows` concluída em `dev` com US1, US2 e US3 validadas.
- Evidências:
  - Commit `549cd3e` atualizou Node/npm/actions/Dockerfiles e documentação.
  - Commit `bf1eb29` corrigiu lint `SC2086` em workflow reutilizável.
  - Deploy Beta `25079585177` concluiu verde após atualização de runtime.
  - Deploy Beta `25080459429` concluiu verde após correção de lint, sem `SC2086`.
  - VM validada com Node `v25.9.0` e npm `11.13.0`.
  - `mesas-cron` validado sem recorrência de `ts-node: not found`.
- Risco residual: Node 25 é Current, não LTS; promoção para produção deve continuar por PR/gate aprovado.
