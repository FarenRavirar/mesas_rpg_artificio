# Guia CLI (linha de comando)

## 1) Preparação

1. Extraia o `.zip` do DiscordChatExporter.
2. Abra o terminal de sua preferência.
3. Entre na pasta da ferramenta:

### Windows (PowerShell/CMD)
```powershell
cd C:\caminho\para\DiscordChatExporter
```

### Linux/macOS
```bash
cd /caminho/para/DiscordChatExporter
```

> [!NOTE]
> No Windows com `cmd`, geralmente você não precisa do prefixo `./` no comando.

---

## 2) Descobrir comandos disponíveis

```bash
./DiscordChatExporter.Cli
```

### Comandos principais

| Comando | O que faz |
|---|---|
| `export` | Exporta um canal específico |
| `exportdm` | Exporta todos os DMs |
| `exportguild` | Exporta canais de um servidor |
| `exportall` | Exporta todos os canais acessíveis |
| `channels` | Lista canais de um servidor |
| `dm` | Lista DMs acessíveis |
| `guilds` | Lista servidores acessíveis |
| `guide` | Mostra guia para token/IDs |

Ajuda de um comando específico:

```bash
./DiscordChatExporter.Cli export --help
```

---

## 3) Exportação rápida de um canal

```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555
```

Parâmetros mínimos:
- `-t` token
- `-c` ID do canal

---

## 4) Formato de saída

```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 -f Json
```

Formatos comuns:
- `HtmlDark`
- `HtmlLight`
- `PlainText`
- `Json`
- `Csv`

---

## 5) Nome e pasta de saída

### Definir nome do arquivo
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 -o minha-sala.html
```

### Definir pasta de saída
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 -o "C:\Discord Exports"
```

### Definir pasta + nome
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 -o "C:\Discord Exports\minha-sala.html"
```

---

## 6) Nome dinâmico com tokens de template

```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 -o "C:\Discord Exports\%G\%T\%C.html"
```

Tokens suportados:
- `%g` ID do servidor
- `%G` nome do servidor
- `%t` ID da categoria
- `%T` nome da categoria
- `%c` ID do canal
- `%C` nome do canal
- `%p` posição do canal
- `%P` posição da categoria
- `%a` data `after`
- `%b` data `before`
- `%d` data atual
- `%%` caractere `%`

---

## 7) Particionamento

### Por quantidade de mensagens
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 -p 10
```

### Por tamanho
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 -p 20mb
```

---

## 8) Mídia (assets)

### Baixar mídia
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 --media
```

### Reaproveitar mídia já baixada
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 --media --reuse-media
```

### Definir diretório de mídia
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 --media --media-dir "C:\Discord Media"
```

---

## 9) Intervalo de datas

### Antes de uma data
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 --before 2019-09-18
```

### Depois de uma data
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 --after "2019-09-17 23:34"
```

### Entre duas datas
```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 --after "2019-09-17 23:34" --before "2019-09-18"
```

---

## 10) Filtro de mensagens

```bash
./DiscordChatExporter.Cli export -t "SEU_TOKEN" -c 53555 --filter "from:Tyrrrz has:image"
```

---

## 11) Exportações em lote

### Todos os canais de um servidor
```bash
./DiscordChatExporter.Cli exportguild -t "SEU_TOKEN" -g 21814
```

### Incluir threads
```bash
./DiscordChatExporter.Cli exportguild -t "SEU_TOKEN" -g 21814 --include-threads all
```

### Excluir canais de voz
```bash
./DiscordChatExporter.Cli exportguild -t "SEU_TOKEN" -g 21814 --include-vc false
```

### Exportar tudo
```bash
./DiscordChatExporter.Cli exportall -t "SEU_TOKEN"
```

### Exportar tudo sem DMs
```bash
./DiscordChatExporter.Cli exportall -t "SEU_TOKEN" --include-dm false
```

---

## 12) Comandos de listagem

### Listar canais de servidor
```bash
./DiscordChatExporter.Cli channels -t "SEU_TOKEN" -g 21814
```

### Listar DMs
```bash
./DiscordChatExporter.Cli dm -t "SEU_TOKEN"
```

### Listar servidores
```bash
./DiscordChatExporter.Cli guilds -t "SEU_TOKEN" > C:\saida\servidores.txt
```

---

## Segurança

> [!WARNING]
> Nunca use token real em prints, commits, logs públicos ou documentos versionados.
