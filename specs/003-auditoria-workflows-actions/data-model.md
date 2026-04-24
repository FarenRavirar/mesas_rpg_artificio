# Data Model — 003-auditoria-workflows-actions

## 1) WorkflowInventoryItem

Representa um workflow auditável no diretório canônico `.github/workflows/`.

### Campos
- `id` (string, obrigatório): identificador estável (`wf-ci`, `wf-deploy-beta`).
- `file_path` (string, obrigatório): caminho relativo do arquivo YAML.
- `workflow_name` (string, obrigatório): valor da chave `name` do workflow.
- `trigger_types` (array<string>, obrigatório): eventos (`push`, `pull_request`, `schedule`, `workflow_dispatch`, `workflow_call`).
- `trigger_filters` (object, opcional): branches, paths, tags e filtros adicionais.
- `jobs` (array<string>, obrigatório): IDs dos jobs definidos no workflow.
- `uses_reusable` (array<string>, opcional): workflows chamados via `uses: ./.github/workflows/*.yml`.
- `called_by` (array<string>, opcional): consumidores conhecidos quando o workflow é `workflow_call`.
- `concurrency_group` (string, opcional): grupo de concorrência, quando existir.
- `cancel_in_progress` (boolean, opcional): política de cancelamento do grupo de concorrência.
- `operational_responsibility` (enum, obrigatório): `ci`, `deploy-beta`, `deploy-prod`, `promotion`, `governance`, `maintenance`.
- `criticality` (enum, obrigatório): `critical`, `high`, `medium`, `low`.

### Regras
- `file_path` deve apontar para `.github/workflows/*.yml` (raiz).
- `trigger_types` não pode ser vazio.
- `operational_responsibility` deve ser único por fluxo canônico principal.

---

## 2) Finding

Não conformidade detectada na auditoria de workflows.

### Campos
- `id` (string, obrigatório): ex. `FIND-003-001`.
- `workflow_id` (string, obrigatório): referência para `WorkflowInventoryItem.id`.
- `severity` (enum, obrigatório): `critical`, `high`, `medium`, `low`.
- `category` (enum, obrigatório): `redundancy`, `race-condition`, `silent-failure`, `trigger-overlap`, `contract-risk`, `observability-gap`.
- `title` (string, obrigatório).
- `technical_description` (string, obrigatório).
- `operational_impact` (string, obrigatório).
- `evidence_refs` (array<string>, obrigatório): IDs/URLs de runs, logs, trechos literais.
- `status` (enum, obrigatório): `open`, `triaged`, `in-remediation`, `resolved`, `accepted-risk`.

### Regras
- `severity` e `category` são obrigatórios antes de qualquer decisão de correção.
- `resolved` exige ao menos uma evidência pós-correção.

---

## 3) RegularizationAction

Ação mínima/reversível proposta ou aplicada para mitigar um `Finding`.

### Campos
- `id` (string, obrigatório): ex. `ACT-003-007`.
- `finding_id` (string, obrigatório): referência para `Finding.id`.
- `action_type` (enum, obrigatório): `yaml-adjustment`, `trigger-scope`, `concurrency-policy`, `failure-propagation`, `documentation-boundary`.
- `target_files` (array<string>, obrigatório): arquivos alterados.
- `change_scope` (enum, obrigatório): `atomic`, `multi-file-controlled`.
- `rollback_steps` (array<string>, obrigatório): passos de reversão.
- `risk_level` (enum, obrigatório): `low`, `medium`, `high`.
- `status` (enum, obrigatório): `planned`, `approved`, `applied`, `validated`, `rolled-back`.

### Regras
- `target_files` deve ficar dentro de escopo definido em `plan.md`.
- `rollback_steps` obrigatórios para qualquer ação `applied`.

---

## 4) ValidationScenario

Cenário de validação (incluindo off-happy-path) para confirmar comportamento operacional.

### Campos
- `id` (string, obrigatório): ex. `VAL-003-004`.
- `type` (enum, obrigatório): `happy-path`, `off-happy-path`.
- `trigger_event` (string, obrigatório): evento utilizado no teste.
- `preconditions` (array<string>, obrigatório).
- `expected_behavior` (string, obrigatório).
- `expected_status` (enum, obrigatório): `success`, `failure`.
- `executed_run_refs` (array<string>, opcional): run IDs/URLs após execução.
- `result_status` (enum, opcional): `pass`, `fail`, `blocked`.

### Regras
- Cenário `off-happy-path` deve validar propagação explícita de erro (`expected_status: failure`).
- `result_status: pass` exige `executed_run_refs` preenchido.

---

## 5) EvidenceRecord

Registro verificável vinculado a finding, ação e cenário.

### Campos
- `id` (string, obrigatório): ex. `EVD-003-012`.
- `run_reference` (string, obrigatório): URL ou ID de execução.
- `workflow_id` (string, obrigatório).
- `scenario_id` (string, obrigatório).
- `log_excerpt` (string, obrigatório): trecho literal sem truncamento.
- `observed_status` (enum, obrigatório): `success`, `failure`, `cancelled`, `skipped`.
- `recorded_at` (datetime ISO-8601, obrigatório).

### Regras
- `log_excerpt` deve ser literal e rastreável.
- `observed_status` deve ser coerente com `ValidationScenario.expected_status` para aprovação final.

---

## Relacionamentos

- `WorkflowInventoryItem` 1:N `Finding`
- `Finding` 1:N `RegularizationAction`
- `RegularizationAction` 1:N `ValidationScenario`
- `ValidationScenario` 1:N `EvidenceRecord`
- `WorkflowInventoryItem` 1:N `EvidenceRecord`

## Transições de Estado

### Finding
`open` → `triaged` → `in-remediation` → `resolved`

ou

`open` → `triaged` → `accepted-risk`

### RegularizationAction
`planned` → `approved` → `applied` → `validated`

ou

`applied` → `rolled-back`
