# PR Description: Pacote Operacional Runtime e Workflows

## Sumário Executivo

Esta feature estabiliza o pacote operacional de runtime e workflows. O `mesas-cron` deixou de depender de `ts-node` em imagem de produção, a baseline aprovada foi atualizada para Node.js 25.9.0 Current com npm 11.13.0, e os workflows/Dockerfiles foram alinhados para usar a mesma linha de runtime.

## Mudanças por Fase/Componente

- `mesas-cron`: scripts `og:worker`, `og:cleanup` e `og:cron` passam a executar `node dist/scripts/*.js` em produção; variantes `:dev` preservam `ts-node` para uso local.
- Runtime: VM atualizada para Node.js `v25.9.0` e npm `11.13.0`.
- Docker: `backend/Dockerfile` e `frontend/Dockerfile` atualizados para `node:25.9.0-alpine` com instalação explícita de `npm@11.13.0`.
- GitHub Actions: workflows atualizados para `actions/checkout@v5`, `actions/setup-node@v6` e `node-version: '25.9.0'`.
- Lint de workflows: `_enforce-migration-dir.yml` passou a montar argumentos do `find` com array Bash, removendo o aviso ShellCheck `SC2086`.
- Governança SDD: spec, plan, research, quickstart, tasks, constitution, project-state e sessão foram atualizados com decisões e evidências.

## Testing Evidence

- `backend`: `npm run build` concluído com sucesso.
- `frontend`: `npm run build` concluído com sucesso, mantendo apenas warnings conhecidos de chunk/plugin timing.
- VM: `node -v` retornou `v25.9.0`; `npm -v` retornou `11.13.0`.
- Produção: `mesas-cron` validado `Up` por janela superior a 30 minutos, sem recorrência de `ts-node: not found`.
- Beta: Deploy Beta `25079585177` concluído com sucesso após atualização de runtime.
- Beta: Deploy Beta `25080459429` concluído com sucesso após correção do lint `SC2086`.
- Logs do run `25080459429`: sem `SC2086`, sem `shellcheck reported issue` e sem annotation `actionlint` relacionada ao aviso corrigido.

## Checklist Pós-Merge

- Confirmar que `dev` permanece verde após deploy automático.
- Validar promoção para `main` por PR/fluxo aprovado, sem checkout manual entre `dev` e `main`.
- Monitorar `mesas-cron` em produção após promoção formal para garantir continuidade dos jobs OpenGraph.
- Reavaliar a permanência em Node.js Current antes de janelas críticas, já que Node 25 não é LTS.
