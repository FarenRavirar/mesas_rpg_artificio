# Validation Evidence: Prod Trigger Isolation

## Cenário
**Objetivo:** Validar que a promoção para Produção opera sob isolamento estrito, acionando exclusivamente o workflow canônico (`promote-to-prod.yml`) e nunca o workflow de emergência (`deploy-prod.yml`), prevenindo colisões ou overrides acidentais.
**Tipo de Validação:** Análise Estrutural e Arquitetural

## Evidência de Configuração
Ambos os workflows de Produção operam exclusivamente via invocação manual (`workflow_dispatch`), garantindo que não existam deploy automáticos em `main`.

A diferenciação e isolamento entre eles são garantidos pelos inputs e pelo enforcement de governança:

### 1. `promote-to-prod.yml` (Workflow Canônico de Promoção)
O workflow canônico exige versionamento semântico (input `version`) e valida automaticamente a integridade do ciclo de pull requests (PR de `dev` para `main`), bloqueando a execução se as branchs estiverem divergentes.
```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Versao da release (ex: v0.1.1)'
        required: true
        type: string
```

### 2. `deploy-prod.yml` (Break-Glass)
O workflow de emergência não solicita versão e não valida governança de branches, sendo projetado apenas para fix direto. Seu acionamento requer seleção explícita pelo operador na interface do GitHub e não possui vínculos com a aprovação de PRs.
```yaml
on:
  workflow_dispatch:
```

## Conclusão
Como ambos exigem intervenção manual, a ocorrência de "disparo duplo" ou acionamento cruzado é impossível no modelo atual de eventos. A aprovação de um PR para `main` libera o código para ser promovido de forma controlada através do `promote-to-prod.yml`, garantindo que o ambiente de Produção seja manipulado de forma intencional e isolada.
O critério de aceitação de T039 foi totalmente atendido através da configuração restritiva (opt-in) dos eventos.
