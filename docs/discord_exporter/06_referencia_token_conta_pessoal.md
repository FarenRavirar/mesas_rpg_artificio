# Referência avançada: token de conta pessoal

> [!CAUTION]
> Esta seção é apenas referência técnica.
> Automação de conta pessoal (self-bot) pode violar os Termos do Discord.

> [!WARNING]
> Nunca compartilhe seu token. Ele dá acesso total à conta.

## Pré-requisito

1. Acesse `https://discord.com`.
2. Faça login com sua conta.

## Métodos via navegador

### Chrome — monitor de rede
1. Pressione `Ctrl + Shift + I` (macOS: `⌥ + ⌘ + I`).
2. Vá para aba **Network**.
3. Recarregue (`F5` / `Ctrl + R`).
4. No filtro, digite `messages`.
5. Se não aparecer, troque de canal para gerar nova requisição.
6. Clique na requisição `messages`.
7. Em **Headers**, procure `authorization` em **Request Headers**.
8. Copie o valor.

### Chrome — armazenamento local
1. Abra DevTools (`Ctrl + Shift + I`).
2. Ative modo responsivo (`Ctrl + Shift + M`).
3. Vá para aba **Application**.
4. Em **Storage > Local Storage > https://discord.com**.
5. Filtre por `token`.
6. Copie o valor.

### Firefox — monitor de rede
1. Pressione `Ctrl + Shift + E` (macOS: `⌥ + ⌘ + E`).
2. Recarregue (`F5`).
3. Filtre por `messages`.
4. Clique na requisição.
5. Em **Headers**, filtre por `authorization`.
6. Copie o valor.

### Firefox — armazenamento local
1. Pressione `Shift + F9` para abrir Storage.
2. Ative modo responsivo (`Ctrl + Shift + M`).
3. Em **Local Storage > https://discord.com**.
4. Filtre por `token`.
5. Copie o valor.

## App desktop (habilitar DevTools)

Se o app desktop não mostrar DevTools, você pode habilitar editando `settings.json` do Discord.

Exemplo de chave:

```json
{
  "DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING": true
}
```

Depois, reabra o Discord e use os mesmos métodos de rede/armazenamento.

## Reset de token

- Conta pessoal: redefinir senha da conta invalida token anterior.
- Bot: usar **Reset Token** no Developer Portal.

## Referências de compliance

- Discord Trust & Safety: automação de conta pessoal é proibida fora do modelo oficial de bot/OAuth2.
