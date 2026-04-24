# Quickstart — 003-auditoria-workflows-actions

## Objetivo
Executar a auditoria e regularização dos workflows de forma incremental, com evidência literal por etapa.

## Pré-requisitos
- Repositório atualizado localmente.
- Acesso de leitura aos workflows em `.github/workflows/`.
- Acesso ao histórico de runs do GitHub Actions para coleta de evidências.
- Feature com artefatos `spec.md`, `plan.md`, `research.md`, `data-model.md` já presentes.

## Passo 1 — Inventário canônico
1. Listar os workflows raiz em `.github/workflows/`.
2. Classificar cada arquivo por responsabilidade operacional (`ci`, `deploy-beta`, `deploy-prod`, `promotion`, `governance`, `maintenance`).
3. Mapear gatilhos, filtros de paths/branches, `needs`, `uses` e `concurrency`.

### Critério de aceite
- 100% dos workflows canônicos inventariados com campos do `WorkflowInventoryItem`.

## Passo 2 — Diagnóstico por severidade
1. Detectar sobreposição de gatilhos para o mesmo contexto funcional.
2. Detectar risco de corrida operacional (locks, concorrência, runs simultâneos).
3. Detectar padrões de falha silenciosa (`|| true`, tolerância indevida, status enganoso).
4. Registrar cada achado como `Finding` com severidade, impacto e evidência.

### Critério de aceite
- Todo achado possui severidade + impacto + evidência literal.

## Passo 3 — Planejar regularização mínima
1. Converter cada `Finding` crítico/alto em `RegularizationAction`.
2. Definir escopo por arquivo e rollback explícito.
3. Validar dependências de workflows reutilizáveis antes de alterar contratos.

### Critério de aceite
- Ação sem rollback ou sem arquivo alvo não pode avançar para aplicada.

## Passo 4 — Executar validação operacional
1. Rodar cenários `happy-path` e `off-happy-path` para cada ação aplicada.
2. Em cenário adverso, confirmar falha explícita no status final.
3. Registrar `EvidenceRecord` com run/link + trecho literal de log.

### Critério de aceite
- Erro real deve resultar em status `failure` visível.
- Não pode haver divergência entre resultado observado e esperado.

## Passo 5 — Encerramento técnico da fase de plano
1. Confirmar presença dos artefatos:
   - `specs/003-auditoria-workflows-actions/plan.md`
   - `specs/003-auditoria-workflows-actions/research.md`
   - `specs/003-auditoria-workflows-actions/data-model.md`
   - `specs/003-auditoria-workflows-actions/quickstart.md`
   - `specs/003-auditoria-workflows-actions/contracts/workflow-audit.openapi.yaml`
2. Validar consistência entre requisitos FR-001..FR-012 e modelo/contrato.

### Critério de aceite
- Pacote de planejamento apto para execução de `/speckit.tasks`.

## Falhas bloqueantes
- Workflow fora do inventário.
- Finding sem severidade.
- Ação aplicada sem rollback.
- Evidência sem run/log literal.
