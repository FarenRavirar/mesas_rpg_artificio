# Research — 003-auditoria-workflows-actions

## Decisão 1: Escopo canônico de workflows auditáveis
- **Decision**: Considerar como escopo executável apenas os 9 arquivos no nível raiz de `.github/workflows/` e os 2 reutilizáveis (`workflow_call`).
- **Rationale**: GitHub Actions só carrega workflows no diretório raiz de `.github/workflows/`; arquivos em subpastas como `COPIA/` não são executados automaticamente.
- **Alternatives considered**:
  - Auditar também `COPIA/` como ativos: rejeitado por gerar falso positivo operacional.
  - Ignorar `workflow_call`: rejeitado por risco de quebrar consumidores (`deploy-beta`, `deploy-prod`, `promote-to-prod`).

## Decisão 2: Separação explícita de responsabilidades de produção
- **Decision**: Manter `promote-to-prod.yml` como fluxo canônico de promoção regular e restringir `deploy-prod.yml` a uso excepcional (break-glass), com fronteira operacional explícita.
- **Rationale**: Hoje ambos executam lógica de deploy muito semelhante em produção, o que aumenta risco de deriva e execução redundante.
- **Alternatives considered**:
  - Remover `deploy-prod.yml` de imediato: rejeitado por risco operacional alto sem janela de migração.
  - Manter ambos sem distinção: rejeitado por ambiguidade de operação e rastreabilidade.

## Decisão 3: Política de concorrência para evitar backlog de deploy beta
- **Decision**: Revisar `deploy-beta.yml` para evitar execução de commits obsoletos em fila (priorizar commit mais recente quando apropriado ao processo).
- **Rationale**: `cancel-in-progress: false` em `push` para `dev` pode produzir fila longa e tempos inconsistentes para contexto equivalente.
- **Alternatives considered**:
  - Manter fila completa de todos os commits: rejeitado quando objetivo é estado final estável e não replay completo.
  - Cancelar qualquer execução sempre: rejeitado sem validar impacto em migrações críticas encadeadas.

## Decisão 4: Falhas não podem ser mascaradas em etapas críticas
- **Decision**: Eliminar/justificar padrões tolerantes em trechos críticos (`|| true`, comandos com fallback permissivo) e exigir falha explícita quando pré-condição não é atendida.
- **Rationale**: A feature exige coerência entre erro real e status final do workflow.
- **Alternatives considered**:
  - Preservar tolerância em etapas de validação: rejeitado por risco de falso verde.
  - Falhar tudo indiscriminadamente: rejeitado para etapas puramente informativas (ex.: comentário em PR).

## Decisão 5: Tratar workflows reutilizáveis como contratos
- **Decision**: `_enforce-migration-dir.yml` e `_lint-shell.yml` serão tratados como contratos compartilhados; qualquer ajuste precisa mapear impacto nos três consumidores.
- **Rationale**: Mudança no reusable pode causar regressão simultânea em beta, produção e promoção.
- **Alternatives considered**:
  - Duplicar lógica em cada workflow consumidor: rejeitado por drift e manutenção.
  - Ignorar rastreio de consumidores: rejeitado por violar gate de consistência de contrato.

## Decisão 6: Evidência mínima obrigatória de validação
- **Decision**: Cada cenário de validação deve registrar: evento de disparo, workflow esperado, run URL/ID, resultado observado e critério de aceite.
- **Rationale**: A aprovação da feature depende de evidência literal e auditável, não percepção subjetiva.
- **Alternatives considered**:
  - Relato textual sem run/link: rejeitado por não auditável.
  - Apenas status final (✅/❌): rejeitado por falta de causalidade e rastreabilidade.
