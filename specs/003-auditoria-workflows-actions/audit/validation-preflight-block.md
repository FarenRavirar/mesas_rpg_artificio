# Validation Evidence: Preflight Prod Gate Block

## Cenário
**Objetivo:** Validar que uma falha no script `preflight_prod.sh` (drift detectado ou falha de infra) resulta em status `failure` bloqueando a aprovação do workflow de `Preflight Prod Gate`.
**Ação:** Alterado `.github/workflows/preflight-prod.yml` para disparar via push na branch de teste e induzido um `exit 1` prematuro antes da execução do script original.

## Evidência de Execução
- **Workflow:** Preflight Prod Gate (`preflight-prod.yml`)
- **Status Observado:** `completed failure`
- **Run ID:** 24865309858
- **Run URL:** https://github.com/FarenRavirar/mesas_rpg_artificio/actions/runs/24865309858

### Log Literal (Trecho)
```
##[group]Run echo "Induzindo falha preflight (T037)" && exit 1
echo "Induzindo falha preflight (T037)" && exit 1
bash scripts/deploy/preflight_prod.sh
##[endgroup]
Induzindo falha preflight (T037)
##[error]Process completed with exit code 1.

...

##[group]Run peter-evans/create-or-update-comment@v4
with:
  body: Script preflight_prod.sh falhou antes de gerar relatorio ou relatorio nao foi encontrado.
# :stop_sign: BLOCKED
```

## Conclusão
O step de checagem falhou imediatamente e o workflow capturou adequadamente o status `failure`. Adicionalmente, o passo subsequente de geração de relatório (`Read Report`) operou conforme esperado (`always()`), identificando que não havia um report de sucesso e formatou a mensagem de erro (BLOCKED) para o PR, reforçando que qualquer quebra impede promoção de código de forma irrefutável.
O critério de aceitação de T037 foi totalmente atendido.
