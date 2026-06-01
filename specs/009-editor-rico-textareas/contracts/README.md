# API Contracts: Editor Rico em Textareas

## Contract Decision

Esta feature não cria novos endpoints públicos e não altera contratos existentes de API por padrão.

## Existing Contract Expectations

- Campos que já recebem texto devem continuar aceitando conteúdo salvo pelo formulário.
- A substituição de entrada por editor rico não deve alterar autenticação, permissão ou propriedade dos dados.
- Qualquer descoberta de incompatibilidade de payload deve parar a implementação e exigir revisão de spec/plan.

## Data Compatibility Expectations

- Conteúdo legado em texto puro deve continuar aceito.
- Campos com validação ou limite existente devem preservar a regra atual.
- Não há migration prevista.

## Non-Goals

- Não criar novo endpoint.
- Não alterar autenticação.
- Não alterar permissões.
- Não migrar dados em lote.
- Não criar editor rico paralelo ao já usado em Descrição da Mesa.
