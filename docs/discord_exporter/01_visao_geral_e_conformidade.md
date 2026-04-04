# Visão geral e conformidade (DiscordChatExporter)

Este conjunto de documentos descreve como exportar mensagens do Discord com o DiscordChatExporter de forma organizada para uso no pipeline do projeto.

## Escopo

- Exportação manual por interface gráfica (GUI)
- Exportação por linha de comando (CLI)
- Agendamento no Linux com `cron`
- Obtenção de IDs (servidor e canal)
- Boas práticas de segurança com tokens

## Recomendação oficial para integração

Use **token de bot** (aplicação no Discord Developer Portal) para automações.

### Por quê?

- É o caminho suportado para integração via API.
- Evita risco de bloqueio por automação de conta pessoal.
- É mais estável para operação contínua.

## Política sobre conta pessoal (self-bot)

> [!CAUTION]
> Automação de conta de usuário (self-bot) pode violar os Termos do Discord e levar à suspensão/encerramento da conta.

A posição pública do Discord é:
- contas de bot foram criadas para automação;
- automação de conta pessoal é proibida fora do modelo OAuth2/bot.

## Segurança de token (obrigatório)

> [!WARNING]
> **Nunca compartilhe token.**
> Token dá acesso total à conta correspondente (equivalente a senha).

Boas práticas:
- não enviar token em chat;
- não commitar token em repositório;
- não salvar token em arquivo versionado;
- usar variável de ambiente/secret manager quando possível.

## Links relacionados

- [Token e IDs](./02_token_e_ids.md)
- [Guia GUI](./03_guia_gui.md)
- [Guia CLI](./04_guia_cli.md)
- [Linux Cron](./05_linux_cron.md)
