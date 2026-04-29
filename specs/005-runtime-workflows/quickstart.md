# Quickstart: Pacote Operacional Runtime e Workflows

## Objetivo

Executar a feature de forma incremental: corrigir `mesas-cron`, atualizar Node/npm para as versões aprovadas mais atuais e revisar workflows sem misturar causas ou aplicar ações de produção sem aprovação.

## Ordem Recomendada

1. Confirmar estado atual read-only:
   - branch ativa
   - `git status`
   - ponteiro `.specify/feature.json`
   - status dos containers relevantes via SSH
   - logs do `mesas-cron`

2. Corrigir `mesas-cron` no repositório:
   - ajustar scripts/comandos para produção não depender de `ts-node`
   - manter mudança mínima e reversível
   - validar build local do backend

3. Preparar validação do cron:
   - documentar comandos de deploy/rebuild necessários
   - solicitar aprovação explícita antes de qualquer restart/build remoto
   - validar saúde por janela mínima de 30 minutos após aplicação

4. Avaliar npm/Node:
   - registrar versões atuais da VM e containers
   - confirmar compatibilidade do npm candidato
   - aplicar Node.js 25.9.0 Current e npm 11.13.0 quando aprovado
   - validar serviços e builds após atualização

5. Revisar workflows:
   - CI
   - deploy beta
   - deploy produção break-glass
   - promoção beta → produção
   - registrar alinhado/divergente para cada um

## Comandos Read-Only Permitidos

```powershell
git status --short
git branch --show-current
ssh -F C:/projetos/config faren "docker ps"
ssh -F C:/projetos/config faren "docker logs --tail 80 mesas-cron 2>&1"
ssh -F C:/projetos/config faren "node -v && npm -v"
```

## Ações Que Exigem Aprovação Explícita

- `docker restart`, `docker stop`, `docker start`
- `docker compose build`
- `docker compose up -d --force-recreate`
- alteração de npm/Node na VM
- qualquer build no servidor
- qualquer push ou commit

## Evidência Mínima por Etapa

- Comando exato executado
- Output literal
- `git status --short`
- Ambiente afetado
- Resultado: `pass`, `fail` ou `blocked`

## Critério de Conclusão da Feature

- `mesas-cron` saudável por 30 minutos após correção
- Node.js atualizado para a baseline aprovada
- npm atualizado ou decisão documentada de não atualizar
- workflows revisados e divergências corrigidas ou registradas
- tasks 100% concluídas com evidência

## Evidências finais 2026-04-28

- `mesas-cron` foi recriado em produção após ajuste dos scripts `og:*` para `node dist/scripts/*.js` e permaneceu `Up` por mais de 30 minutos.
- VM validada com Node `v25.9.0` e npm `11.13.0`.
- `mesas-api`, `mesas-cron` e `mesas-beta-api` permanecem `Up`; APIs com healthcheck seguem `healthy`.
- Workflows atualizados para `actions/checkout@v5`, `actions/setup-node@v6` e `node-version: '25.9.0'`; Dockerfiles atualizados para `node:25.9.0-alpine` com npm `11.13.0`.
- Nenhuma correção de workflow foi necessária.
- Busca final por scripts antigos de produção (`"og:*": "ts-node`) retornou zero resultados; variantes `og:*:dev` continuam disponíveis para execução TypeScript em desenvolvimento.

## Comandos efetivamente usados

```powershell
ssh -F C:/projetos/config faren 'cd /opt/mesas && docker compose -f docker-compose.prod.yml up -d --no-deps --build --force-recreate mesas-cron'
ssh -F C:/projetos/config faren 'node -v && npm -v'
ssh -F C:/projetos/config faren 'sudo -H npx npm@11.13.0 install -g npm@11.13.0'
ssh -F C:/projetos/config faren 'sudo sed -i "s#https://deb.nodesource.com/node_22.x#https://deb.nodesource.com/node_25.x#g" /etc/apt/sources.list.d/nodesource.sources && sudo apt-get update && sudo apt-get install -y nodejs=25.9.0-1nodesource1'
ssh -F C:/projetos/config faren 'cd /opt/mesas && docker compose -f docker-compose.prod.yml ps mesas-api mesas-cron && cd /opt/mesas-beta && docker compose -f docker-compose.beta.yml ps mesas-beta-api'
rg -n '"og:(worker|cleanup|cron)": "ts-node' backend/package.json docker-compose.prod.yml docker-compose.beta.yml .github/workflows
```
