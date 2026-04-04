# Agendamento no Linux com cron

Este guia automatiza exportações periódicas usando `cron`.

## 1) Criar script

No terminal:

```bash
nano /path/to/DiscordChatExporter/cron.sh
```

Cole este conteúdo:

```bash
#!/bin/bash
# Info: https://github.com/Tyrrrz/DiscordChatExporter/blob/prime/.docs

TOKEN=tokenhere
CHANNELID=channelhere
DLLFOLDER=dceFOLDERpathhere
FILENAME=filenamehere
EXPORTDIRECTORY=dirhere
EXPORTFORMAT=formathere
# Formatos: plaintext, htmldark, htmllight, json, csv
# Sensível a maiúsculas/minúsculas

if [[ "$EXPORTFORMAT" == "plaintext" ]]; then
  FORMATEXT=.txt
elif [[ "$EXPORTFORMAT" == "htmldark" ]] || [[ "$EXPORTFORMAT" == "htmllight" ]]; then
  FORMATEXT=.html
elif [[ "$EXPORTFORMAT" == "json" ]]; then
  FORMATEXT=.json
elif [[ "$EXPORTFORMAT" == "csv" ]]; then
  FORMATEXT=.csv
else
  echo "$EXPORTFORMAT - Formato de exportação desconhecido"
  echo "Formatos disponíveis: plaintext, htmldark, htmllight, csv, json"
  exit 1
fi

cd $DLLFOLDER || exit 1

./DiscordChatExporter.Cli export -t $TOKEN -c $CHANNELID -f $EXPORTFORMAT -o $FILENAME.tmp

CURRENTTIME=$(date +"%Y-%m-%d-%H-%M-%S")

if ! mv "$FILENAME.tmp" "${EXPORTDIRECTORY//\"}/$FILENAME-$CURRENTTIME$FORMATEXT" ; then
  echo "Falha ao mover $FILENAME.tmp para $EXPORTDIRECTORY/$FILENAME-$CURRENTTIME$FORMATEXT"
  echo "Limpando arquivo temporário..."
  if ! rm -Rf "$FILENAME.tmp" ; then
    echo "Falha ao remover $FILENAME.tmp"
  fi
  exit 1
fi

exit 0
```

Substitua:
- `tokenhere` pelo token
- `channelhere` pelo ID do canal
- `dceFOLDERpathhere` pela pasta do DCE (sem apontar para `.dll`)
- `filenamehere` por nome-base de arquivo (sem espaços)
- `dirhere` pelo diretório final
- `formathere` por `plaintext|htmldark|htmllight|json|csv`

> [!NOTE]
> Se houver espaços em caminhos, escape com `\` ou use aspas.

---

## 2) Dar permissão de execução

```bash
chmod +x /path/to/DiscordChatExporter/cron.sh
```

---

## 3) Configurar cron

### Como usuário atual
```bash
crontab -e
```

### Como root
```bash
sudo crontab -e
```

Adicione no fim do arquivo:

```cron
* * * * * /path/to/DiscordChatExporter/cron.sh >/tmp/discordchatexporter.log 2>/tmp/discordchatexportererror.log
```

Se não quiser logs:

```cron
* * * * * /path/to/DiscordChatExporter/cron.sh >/dev/null 2>/dev/null
```

---

## 4) Exemplos de agenda

- Minuto 15 de toda hora: `15 * * * *`
- A cada 30 minutos: `*/30 * * * *`
- Todo dia à meia-noite: `0 0 * * *`
- Todo dia ao meio-dia: `0 12 * * *`
- Todo dia às 15h, 16h e 18h: `0 15,16,18 * * *`
- Toda quarta às 9h: `0 9 * * 3`

Informações úteis:
- Semana começa no domingo (`0` ou `7` = domingo).
- Se usar dia `31`, só executa em meses que têm dia 31.

---

## 5) Boas práticas operacionais

- Rotacionar/limpar logs periodicamente.
- Revisar token após reset (token antigo fica inválido).
- Manter o `parallel limit` baixo para reduzir risco de bloqueio da conta.

> [!WARNING]
> Nunca exponha token em script versionado no Git. Use variável de ambiente segura quando possível.
