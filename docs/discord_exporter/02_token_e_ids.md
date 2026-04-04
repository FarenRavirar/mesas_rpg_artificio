# Token e IDs (servidor/canal)

## 1) Link oficial do portal

- Discord Developer Portal: <https://discord.com/developers/applications>

---

## 2) Token de bot (recomendado)

### Criar ou abrir aplicação
1. Acesse o Developer Portal.
2. Crie uma aplicação nova (ou use uma já existente).
3. Vá para a seção **Bot**.

### Gerar/resetar token
1. Em **Bot**, clique em **Reset Token**.
2. Confirme em **Yes, do it!**.
3. Copie o token e armazene com segurança.

> [!WARNING]
> Ao resetar, o token antigo para de funcionar imediatamente.

### Habilitar leitura de conteúdo
1. Ainda em **Bot**, procure **Privileged Gateway Intents**.
2. Habilite **Message Content Intent**.

Sem isso, as exportações podem vir vazias.

---

## 3) Convidar o bot para servidor

1. No Developer Portal, copie o **Application ID**.
2. Abra no navegador a URL abaixo, trocando `YOUR_APP_ID`:

```text
https://discord.com/oauth2/authorize?scope=bot&permissions=66560&client_id=YOUR_APP_ID
```

3. Selecione o servidor e conclua autorização.

---

## 4) Obter Server ID e Channel ID

1. No Discord, abra **User Settings**.
2. Vá em **Advanced**.
3. Ative **Developer Mode**.
4. Clique com botão direito no servidor/canal.
5. Use **Copy Server ID** ou **Copy Channel ID**.

---

## 5) Sobre token de conta pessoal

> [!CAUTION]
> O uso de token de conta pessoal para automação não é recomendado e pode violar os Termos do Discord.

Se você estiver estudando esse cenário, trate como risco alto de compliance e prefira sempre migração para bot oficial.

Para referência detalhada de métodos (Chrome, Firefox, app desktop e variações), veja:
- [Referência avançada: token de conta pessoal](./06_referencia_token_conta_pessoal.md)
