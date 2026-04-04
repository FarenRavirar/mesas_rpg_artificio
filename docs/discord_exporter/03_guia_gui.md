# Guia GUI (interface gráfica)

## 1) Instalação e execução

Após extrair o `.zip`:
- Windows: execute `DiscordChatExporter.exe`
- Linux: execute `DiscordChatExporter`

### macOS (passo extra de permissão)
Se aparecer erro de app danificado, execute:

```bash
xattr -rd com.apple.quarantine /caminho/DiscordChatExporter.app
```

Dica prática:
1. Abra o Terminal.
2. Digite `xattr -rd com.apple.quarantine` + espaço.
3. Arraste `DiscordChatExporter.app` para o terminal.
4. Pressione Enter.
5. Abra o app normalmente.

---

## 2) Login no app

1. Siga as instruções na tela para informar token.
2. Cole o token no campo superior.
3. Pressione **Enter** ou clique na seta (**→**).

> [!WARNING]
> Nunca compartilhe token.

---

## 3) Seleção de canais

1. O app mostrará DMs e servidores.
2. Selecione o canal desejado.
3. Clique em **Screenshot** para avançar.

Dicas:
- `CTRL`/`SHIFT` para selecionar vários canais.
- Duplo clique exporta diretamente.

---

## 4) Opções de exportação

- **Output path**: pasta de destino.
- **Export format**: HTML Dark, HTML Light, TXT, CSV, JSON.
- **Date range (after/before)**: intervalo opcional de datas.
- **Partition limit**: quebra em partes por quantidade de mensagens ou tamanho.
- **Message filter**: filtro avançado de mensagens.
- **Format markdown**: liga/desliga processamento de markdown.
- **Download assets**: baixa avatar, imagens, anexos etc.
- **Reuse assets**: reutiliza assets já baixados.
- **Assets directory path**: diretório único de assets.

> [!NOTE]
> Role a tela para ver todas as opções.

### Atenção com intervalo de data
O horário padrão costuma ser `00:00`. Isso pode excluir mensagens no último dia se o range não for ajustado.

---

## 5) Configurações da GUI

- **Auto-update**: atualização automática (recomendado manter ligado)
- **Dark mode**
- **Persist token**
- **Show threads**
- **Locale**
- **Date format**
- **Parallel limit** (evite valores altos para reduzir risco de bloqueio)
- **Normalize to UTC**
