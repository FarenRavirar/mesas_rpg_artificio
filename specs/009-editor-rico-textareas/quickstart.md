# Quickstart: Editor Rico em Textareas

## Objetivo

Validar que todos os `textarea` do frontend foram mapeados, classificados e que os campos elegíveis passaram a usar a mesma ferramenta de edição da Descrição da Mesa.

## Pré-condições

- Inventário de `textarea` concluído.
- Campos classificados como elegíveis ou não elegíveis.
- Feature implementada no frontend.
- Build técnico do frontend executado com sucesso.
- Teste funcional em Beta quando fluxos reais forem afetados.

## Cenário 1: Conferir mapeamento

1. Abrir o mapeamento produzido durante a implementação.
2. Confirmar que cada ocorrência de `textarea` tem arquivo, tela, finalidade e classificação.
3. Confirmar que campos não elegíveis têm justificativa.

**Resultado esperado**: 100% dos `textarea` foram classificados.

## Cenário 2: Campo elegível com editor rico

1. Abrir formulário com campo classificado como elegível.
2. Confirmar que ele usa a mesma ferramenta da Descrição da Mesa.
3. Inserir conteúdo com formatação permitida.
4. Salvar.
5. Reabrir o formulário.

**Resultado esperado**: conteúdo continua editável e comportamento permanece consistente.

## Cenário 3: Conteúdo legado

1. Abrir campo elegível que já possuía texto puro salvo.
2. Confirmar que o conteúdo aparece sem perda.
3. Editar o conteúdo no editor rico.
4. Salvar e reabrir.

**Resultado esperado**: conteúdo legado permanece íntegro e editável.

## Cenário 4: Campo não elegível

1. Abrir formulário com campo classificado como não elegível.
2. Confirmar que ele permanece texto puro.
3. Confirmar que a justificativa existe no mapeamento.

**Resultado esperado**: campo não elegível mantém comportamento original.

## Cenário 5: Responsividade

1. Abrir cada formulário alterado em desktop.
2. Repetir em tela pequena/mobile.
3. Interagir com barra de ferramentas, foco, digitação e salvamento.

**Resultado esperado**: editor não quebra layout e permanece utilizável.

## Evidências obrigatórias

- Lista de ocorrências de `textarea` mapeadas.
- Lista de campos elegíveis substituídos.
- Lista de campos não elegíveis com justificativa.
- Resultado do build técnico do frontend.
- Validação funcional dos formulários alterados.
- Registro de teste em Beta/janela anônima quando aplicável.
