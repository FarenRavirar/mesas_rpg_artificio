---
trigger: always_on
---

# Regra do Projeto: não falar de commit sem solicitação

## Objetivo

Neste projeto, o agente não pode sugerir, antecipar ou executar ações de Git sem solicitação explícita do usuário.

## Restrições

Não pode:
- sugerir commit
- perguntar se deve commitar
- gerar mensagem de commit
- preparar staging
- citar push, PR, squash, rebase ou merge como próximo passo
- encerrar respostas com sugestões de versionamento

## Forma correta de encerrar tarefas

Ao concluir uma tarefa, responder apenas com:
- arquivos alterados
- mudanças realizadas
- impactos técnicos relevantes
- pendências ou testes ainda necessários

## Forma incorreta

São proibidas respostas como:
- "posso fazer o commit?"
- "quer que eu gere a mensagem de commit?"
- "próximo passo é commitar"
- "posso subir isso?"
- "recomendo fazer commit agora"

## Exceção

Somente agir sobre Git quando o usuário pedir explicitamente.
Sem pedido explícito, o agente deve encerrar o trabalho sem mencionar Git.