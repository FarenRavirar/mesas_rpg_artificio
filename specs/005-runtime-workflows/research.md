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

## Decision 3: Manter Node.js 22 LTS como baseline

**Decision**: O pacote deve manter Node.js 22 LTS como linha suportada. Atualização major para Node 24 fica fora de escopo sem aprovação específica.

**Rationale**: `constitution.md` define Node.js 22 LTS. Dockerfiles usam `node:22-alpine`; workflows usam `node-version: '22'`; VM e containers API já estão em `v22.22.2`.

**Alternatives considered**:
- Atualizar tudo para Node 24: rejeitado por violar baseline atual e exigir validação maior.
- Atualizar apenas host VM para Node 24: rejeitado por gerar divergência com containers e CI.

## Decision 4: npm 11.13.0 é candidato compatível, mas deve ser validado por ambiente

**Decision**: Avaliar npm 11.13.0 como atualização compatível dentro da linha Node atual, registrando versões antes/depois e evidência de build/saúde.

**Rationale**: npm 11.13.0 declara suporte a Node `^20.17.0 || >=22.9.0`, e o ambiente observado está em Node `22.22.2`.

**Validação 2026-04-28**: `npm view npm version engines --json` retornou `version: 11.13.0` e `engines.node: ^20.17.0 || >=22.9.0`. VM, `mesas-api`, `mesas-cron` e `mesas-beta-api` foram observados em Node `v22.22.2` com npm `10.9.7`, portanto o candidato é compatível com a baseline Node 22 atual.

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
