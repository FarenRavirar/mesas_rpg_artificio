# Validation Evidence: Beta Migration Gate Failure

## Cenário
**Objetivo:** Validar que o `_enforce-migration-dir.yml` atua como gate bloqueante efetivo em `deploy-beta.yml` caso haja um arquivo `migration_*.sql` fora dos caminhos canonicos aprovados.
**Ação:** Criado arquivo fictício `migration_9999_audit.sql` na raiz do repositório e forçado disparo de push no workflow `Deploy Beta`.

## Evidência de Execução
- **Workflow:** Deploy Beta (`deploy-beta.yml` invocando `_enforce-migration-dir.yml`)
- **Status Observado:** `completed failure`
- **Run ID:** 24864933063
- **Run URL:** https://github.com/FarenRavirar/mesas_rpg_artificio/actions/runs/24864933063

### Log Literal (Trecho)
```
Run set -euo pipefail
set -euo pipefail

if [ ! -f .github/migration-dir-allowlist ]; then
  echo "::error::Arquivo .github/migration-dir-allowlist nao encontrado"
  exit 1
fi
...
##[error]Arquivos migration_*.sql encontrados fora do diretorio canonico restrito:
./migration_9999_audit.sql
##[error]Process completed with exit code 1.
```

## Conclusão
O gate de proteção `_enforce-migration-dir.yml` isolou a falha no step inicial, rejeitando o commit instantaneamente e evitando a inicialização do job principal de migração no servidor de banco de dados (`migrate`). Não houve rollback acionado porque o deploy foi bloqueado de forma estática antes do servidor ser tocado, caracterizando proteção atômica precoce (shift-left validation) eficaz.
O critério de aceitação de T035 foi totalmente atendido.
