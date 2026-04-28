# Data Model: Pacote Operacional Runtime e Workflows

## Serviço de Rotinas Agendadas

**Descrição**: Representa o container/serviço responsável por executar rotinas recorrentes de metadados e limpeza.

**Atributos**
- `name`: nome operacional do serviço (`mesas-cron`)
- `environment`: ambiente em que roda (`production`; beta se aplicável futuramente)
- `command`: comando configurado para iniciar rotinas
- `status`: `not_checked`, `failing`, `healthy`, `blocked`
- `last_error`: erro literal observado quando houver falha
- `validation_window_minutes`: tempo mínimo de observação para considerar saudável
- `rollback_plan`: procedimento para retornar ao estado anterior

**Estados**
- `not_checked` → `failing`: logs/status confirmam falha
- `failing` → `healthy`: correção aplicada e janela de validação concluída
- `failing` → `blocked`: ação mutável necessária sem aprovação ou dependência indisponível
- `healthy` → `failing`: regressão detectada em logs/status

## Baseline de Runtime

**Descrição**: Representa o conjunto de versões suportadas e observadas para Node.js/npm no projeto.

**Atributos**
- `node_baseline`: linha suportada pela governança
- `node_observed_vm`: versão observada no host remoto
- `node_observed_containers`: versões observadas nos containers relevantes
- `npm_current`: versão atual
- `npm_candidate`: versão candidata
- `compatibility_status`: `compatible`, `incompatible`, `needs_validation`
- `major_runtime_change_allowed`: booleano controlado por aprovação explícita

**Regras**
- Node major fora da baseline não pode ser aplicado sem escopo separado.
- npm candidato só avança com compatibilidade e validação registradas.

## Workflow Operacional

**Descrição**: Representa cada workflow ou fluxo de deploy relevante para runtime e containers.

**Atributos**
- `path`: caminho do workflow
- `purpose`: CI, deploy beta, deploy produção ou promoção
- `runtime_declared`: versão de Node configurada quando aplicável
- `install_command`: comando de instalação relevante
- `build_command`: comando de build relevante
- `remote_actions`: ações SSH/Docker relevantes
- `status`: `aligned`, `divergent`, `needs_change`, `not_applicable`
- `finding`: divergência encontrada, se houver
- `rollback_plan`: como desfazer mudança proposta

## Evidência de Validação

**Descrição**: Registro mínimo de prova para cada transição de estado.

**Atributos**
- `scope`: cron, runtime/npm, workflow ou serviço
- `environment`: local, beta, produção, CI
- `command`: comando exato executado
- `literal_output`: saída literal observada
- `files_changed`: arquivos alterados segundo `git status`
- `result`: `pass`, `fail`, `blocked`
- `timestamp`: data/hora da observação

**Regras**
- Transições RED/GREEN/DONE exigem evidência literal.
- Outputs não podem ser resumidos quando usados como prova de estado.
