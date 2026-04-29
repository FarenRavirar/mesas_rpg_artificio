# API Contracts: Verificação de Sugestões de Sistemas no Admin

## Contract Decision

Esta feature começa como investigação do contrato existente. Nenhum novo endpoint deve ser criado sem confirmação de que o fluxo atual não atende ao requisito.

## Existing Contract Expectations

### Envio de sugestão

- Deve existir fluxo capaz de receber sugestão de sistema.
- O envio deve retornar sucesso apenas quando a sugestão for registrada.
- Payload inválido deve gerar erro claro.

### Consulta administrativa

- Admin autorizado deve conseguir consultar sugestões pendentes pela gestão, se esse for o canal oficial.
- Filtros e status não devem ocultar sugestões pendentes sem indicação.

### Notificações

- Se Notificações for canal obrigatório, nova sugestão deve gerar alerta visível para admin autorizado.
- Se Notificações não for canal obrigatório, a gestão deve ser documentada como canal oficial.

## Contract Risks to Verify

- Rota de envio existe mas não persiste.
- Persistência existe mas gestão filtra status errado.
- Notificação é criada para destinatário incorreto.
- Admin não possui permissão para consultar a sugestão.
- Frontend mostra sucesso mesmo com falha no backend.

## Non-Goals

- Não alterar autenticação.
- Não expor sugestões para usuários sem permissão.
- Não criar canal paralelo sem decisão de produto.
- Não assumir necessidade de migration antes do mapeamento.
