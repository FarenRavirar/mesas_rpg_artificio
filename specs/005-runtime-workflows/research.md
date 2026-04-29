# Research: Pacote Operacional Runtime e Workflows

## Decision 1: Corrigir `mesas-cron` antes de atualizar runtime

**Decision**: A primeira entrega deve atacar a falha existente do `mesas-cron`, que reinicia com `sh: ts-node: not found`.

**Rationale**: A falha já existe antes de qualquer atualização de npm/Node. Corrigi-la primeiro evita atribuir regressões antigas à mudança de runtime e reduz risco operacional imediato.

**Alternatives considered**:
- Atualizar npm/Node primeiro: rejeitado porque mistura causa nova com falha preexistente.
- Ignorar `mesas-cron` até a revisão de workflows: rejeitado porque o container já está em loop de restart.

## Decision 2: Produção deve executar artefatos compilados, não `ts-node`

**Decision**: Scripts de produção usados por containers devem depender de código compilado ou de comando disponível em dependências de runtime.

**Rationale**: `backend/Dockerfile` executa `npm ci --omit=dev` na imagem de produção. `ts-node` está em `devDependencies`; portanto comandos que chamam `ts-node` não são confiáveis na imagem final.

**Alternatives considered**:
- Mover `ts-node` para `dependencies`: rejeitado por aumentar runtime e manter execução TypeScript em produção.
- Instalar devDependencies no container de produção: rejeitado por aumentar superfície e contrariar imagem enxuta.
- Criar imagem separada para cron: possível no futuro, mas mais amplo que a correção mínima.

## Decision 3: Atualizar para Node.js 25.9.0 Current

**Decision**: Atualizar a baseline operacional do projeto para Node.js 25.9.0 Current, a versão mais recente observada no índice oficial do Node em 2026-04-28.

**Rationale**: O mantenedor aprovou explicitamente sair da linha 22 LTS e usar a versão mais atual disponível. O índice oficial `https://nodejs.org/dist/index.json` retornou `v25.9.0` como release mais recente, com npm embarcado `11.12.1`. Para padronizar o npm latest, o projeto usa npm `11.13.0` após instalação do Node.

**Alternatives considered**:
- Manter Node 22 LTS: rejeitado após decisão explícita do mantenedor por "versão mais atual".
- Atualizar apenas host VM: rejeitado por gerar divergência com containers e CI.
- Usar tag flutuante `node:current-alpine`: rejeitado para manter rastreabilidade; `node:25.9.0-alpine` fixa a versão validada.

## Decision 4: npm 11.13.0 é o npm padrão da feature

**Decision**: Padronizar npm 11.13.0 na VM e nas imagens Docker baseadas em Node.

**Rationale**: `npm view npm version engines --json` retornou `version: 11.13.0` e `engines.node: ^20.17.0 || >=22.9.0`, compatível com Node 25.9.0.

**Validação 2026-04-28**: VM atualizada para Node `v25.9.0` e npm `11.13.0`. Dockerfiles atualizados para `node:25.9.0-alpine` com `npm install -g npm@11.13.0` antes de `npm ci`.

**Alternatives considered**:
- Não atualizar npm: seguro, mas não atende ao objetivo do pacote.
- Atualizar npm sem validação: rejeitado por risco operacional e falta de rollback.

## Decision 5: Workflows devem ser inventariados e ajustados apenas onde houver divergência

**Decision**: Revisar workflows canônicos (`ci.yml`, `deploy-beta.yml`, `deploy-prod.yml`, `promote-to-prod.yml`) e corrigir apenas inconsistências reais de runtime, instalação, build, smoke ou rollback.

**Rationale**: A auditoria anterior já consolidou workflows. Esta feature deve evitar refactor amplo e focar em coerência runtime/npm/containers.

**Alternatives considered**:
- Reescrever workflows: rejeitado por alto risco e escopo excessivo.
- Revisar somente CI: rejeitado porque deploy e promoção também executam build remoto e validação de saúde.

## Decision 6: Evidência de produção exige aprovação antes de ação mutável

**Decision**: Antes de restart, build remoto, deploy ou mudança de versão em produção, solicitar aprovação explícita seguindo AGENTS.md.

**Rationale**: O escopo toca containers e produção. Comandos read-only são permitidos; comandos mutáveis são bloqueantes sem autorização.

**Alternatives considered**:
- Aplicar correção diretamente na VM: rejeitado por risco e por regra pétrea.
- Validar apenas localmente: insuficiente para comprovar saúde de container remoto.
