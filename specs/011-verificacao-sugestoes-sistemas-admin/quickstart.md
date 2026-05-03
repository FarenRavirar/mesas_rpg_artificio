# Quickstart: Verificação de Sugestões de Sistemas no Admin

## Objetivo

Validar se sugestões criadas por usuários são enviadas, registradas e chegam ao admin pela gestão e pela ferramenta de Notificações.

## Pré-condições

- Fluxo de sugestão mapeado.
- Usuário capaz de enviar sugestão no Beta.
- Admin autorizado disponível para consulta.
- Canal administrativo definido: gestão para tratamento e Notificações para alerta obrigatório.

## Cenário 1: Envio de sugestão

1. Abrir o fluxo de sugestão de sistemas no Beta.
2. Enviar sugestão válida com dados rastreáveis.
3. Confirmar resposta da interface.
4. Verificar se houve registro persistido.

**Resultado esperado**: sugestão registrada e sem confirmação falsa de sucesso.

## Cenário 2: Consulta na gestão administrativa

1. Acessar a área admin de gestão de sistemas.
2. Procurar a sugestão enviada.
3. Verificar status, dados exibidos e filtros aplicados.
4. Confirmar estado vazio quando não houver sugestões.

**Resultado esperado**: admin consegue identificar sugestão pendente ou entender claramente que não há sugestões.

## Cenário 3: Notificações

1. Após enviar sugestão, acessar a ferramenta de Notificações como admin.
2. Verificar se há alerta correspondente.
3. Repetir para sugestões de sistema, cenário e plataforma VTT quando possível.

**Resultado esperado**: toda sugestão criada por usuário gera notificação para admin.

## Cenário 4: Falha parcial

1. Enviar sugestão.
2. Confirmar se usuário recebeu sucesso.
3. Verificar se admin recebeu pela gestão ou Notificações.
4. Se não recebeu, classificar falha por camada.

**Resultado esperado**: nenhuma falha fica sem severidade, camada e correção proposta.

## Evidências obrigatórias

- Mapa de telas, rotas, persistência e notificações envolvidas.
- Resultado de envio real no Beta.
- Resultado de consulta pela gestão administrativa.
- Resultado de consulta em Notificações ou decisão de canal oficial.
- Lista de falhas encontradas com camada e severidade.
