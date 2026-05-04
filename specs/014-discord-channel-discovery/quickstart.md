# Quickstart: Descoberta de Canais Discord

## Pré-condições

1. Bot Discord criado e convidado para o servidor.
2. Token salvo em `/gestao` → Discord Sync → Configuração.
3. Bot com permissão de ver canal e ler histórico de mensagens no canal alvo.

## Cenário principal

1. Acesse `https://mesasbeta.artificiorpg.com`.
2. Entre como admin.
3. Abra `/gestao`.
4. Abra Discord Sync → Fontes.
5. Clique em adicionar canal.
6. Selecione o servidor descoberto.
7. Selecione o canal desejado.
8. Salve.
9. Confira a fonte cadastrada na lista.
10. Clique em buscar mensagens.

Resultado esperado:
- Nenhum ID precisa ser copiado manualmente.
- Fonte aparece com nome do canal.
- Mensagens começam a ser importadas se o bot tiver permissão.

## Cenários de erro

### Sem token

1. Remova o token salvo.
2. Abra Fontes e tente descobrir servidores.

Resultado esperado:
- Painel orienta configurar o token antes.

### Bot sem servidor

1. Use token válido de bot que não foi convidado para servidor.
2. Tente descobrir servidores.

Resultado esperado:
- Painel orienta convidar o bot para o servidor.

### Sem permissão no canal

1. Remova a permissão do bot no canal alvo.
2. Tente listar canais ou buscar mensagens.

Resultado esperado:
- Painel mostra erro acionável sobre permissões.

## Validação técnica

```bash
npm --prefix backend run build
npm --prefix frontend run build
```
