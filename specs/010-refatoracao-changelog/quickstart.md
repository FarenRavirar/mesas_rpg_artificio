# Quickstart: Refatoração do Changelog

## Objetivo

Validar que o changelog foi consolidado, não possui duplicidade por data, não comunica correções obsoletas e usa linguagem adequada para usuários finais.

## Pré-condições

- Entradas atuais de `database/changelogs.json` inventariadas.
- Duplicidades por data e por assunto identificadas.
- Decisões de manter, consolidar, reescrever ou remover registradas.
- JSON final validado.

## Cenário 1: Agrupamento por data

1. Abrir `database/changelogs.json`.
2. Agrupar entradas publicadas por data de calendário.
3. Verificar se há mais de uma entrada publicada na mesma data.
4. Consolidar grupos duplicados.

**Resultado esperado**: nenhuma data possui mais de uma entrada publicada.

## Cenário 2: Correções reabertas ou refeitas

1. Identificar entradas que comunicam uma correção depois alterada novamente.
2. Comparar mensagens duplicadas ou contraditórias.
3. Reescrever a comunicação como mensagem final orientada ao benefício.

**Resultado esperado**: changelog não expõe tentativa intermediária como resultado final.

## Cenário 3: Linguagem para usuário final

1. Revisar títulos e corpos das entradas publicadas.
2. Remover jargões técnicos e termos proibidos.
3. Confirmar que o texto explica benefício ou mudança visível.

**Resultado esperado**: changelog claro, leigo e sem termos técnicos proibidos.

## Cenário 4: Validação estrutural

1. Validar que `database/changelogs.json` permanece JSON válido.
2. Confirmar IDs coerentes com datas.
3. Confirmar ordem cronológica preservada.
4. Confirmar que entradas administrativas internas não foram publicadas indevidamente.

**Resultado esperado**: arquivo válido e coerente para consumo pelo app.

## Evidências obrigatórias

- Lista de entradas duplicadas encontradas.
- Lista de entradas consolidadas, removidas, reescritas ou mantidas.
- Validação de JSON válido.
- Busca final sem termos proibidos.
- Verificação de uma única entrada publicada por data.
