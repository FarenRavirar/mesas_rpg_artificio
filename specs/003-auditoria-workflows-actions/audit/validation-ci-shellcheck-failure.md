# Validation Evidence: Shellcheck Gate Failure

## Cenário
**Objetivo:** Validar que o job de linting (Shellcheck) em workflows CI/CD atua como gate bloqueante efetivo (status ❌) caso um erro crítico de sintaxe bash seja introduzido nos scripts operacionais.
**Ação:** Alterado `.github/workflows/ci.yml` para incorporar o lint (via `_lint-shell.yml`) e criado o arquivo `scripts/dummy_audit.sh` contendo um erro fatal de bash (`if` sem `fi`).

## Evidência de Execução
- **Workflow:** CI — Validação de PR (`ci.yml` invocando `_lint-shell.yml`)
- **Status Observado:** `completed failure`
- **Run ID:** 24865203711
- **Run URL:** https://github.com/FarenRavirar/mesas_rpg_artificio/actions/runs/24865203711

### Log Literal (Trecho)
```
./scripts/dummy_audit.sh:3:1: error: Couldn't find 'fi' for this 'if'. [SC1046]
./scripts/dummy_audit.sh:3:1: error: Couldn't parse this if expression. Fix to allow more checks. [SC1073]
./scripts/dummy_audit.sh:6:1: error: Expected 'fi' matching previously mentioned 'if'. [SC1047]
./scripts/dummy_audit.sh:6:1: error: Expected 'fi'. Fix any mentioned problems and try again. [SC1072]
##[group]Run exit 1
exit 1
##[error]Process completed with exit code 1.
```

## Conclusão
O gate de proteção `_lint-shell.yml` detectou corretamente os erros de sintaxe e quebrou a execução com exit code 1, impedindo que o workflow passasse. Isso garante que nenhum código bash defeituoso chegue à infraestrutura através de pipelines que consumam essa validação.
O critério de aceitação de T036 foi totalmente atendido.
