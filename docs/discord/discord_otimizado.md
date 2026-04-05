# Integração do Discord ao agregador, contrato real da feature

## Objetivo

Este documento orienta a implementação da feature de agregação de anúncios de mesas do Discord dentro do projeto principal:

`C:\projetos\mesas_rpg_artificio`

A fonte externa atualmente utilizada é:

`C:\projetos\DiscordChatExporter-prime`

O arquivo de exemplo de entrada foi colocado na raiz do projeto principal como:

`C:\projetos\mesas_rpg_artificio\export_exemple.json`

A meta é unificar o fluxo sem criar outro software, reutilizando o máximo possível do DiscordChatExporter-prime, mas mantendo a regra editorial, o parser de negócio e a publicação final dentro do projeto principal.

---

## Regra principal de arquitetura

A integração deve seguir esta separação:

- `DiscordChatExporter-prime` = fornecedor de dados e referências de implementação
- `mesas_rpg_artificio` = dono da regra de negócio, persistência, triagem editorial, publicação e exportação final

Ou seja:

1. o exporter fornece o JSON e, no futuro, pode fornecer um modo de export mais adequado para integração;
2. o projeto principal interpreta esse JSON;
3. o projeto principal decide o que entra, o que sai e como publica;
4. o projeto principal nunca deve depender da UI, do fluxo de download ou da estrutura interna completa do exporter.

---

## Contrato real de entrada

A primeira versão deve aceitar o JSON exportado pelo DiscordChatExporter no formato de `export_exemple.json`.

Estrutura observada:

- raiz com `guild`, `channel`, `dateRange`, `exportedAt`, `messages`
- cada item de `messages` contém:
  - `id`
  - `type`
  - `timestamp`
  - `timestampEdited`
  - `content`
  - `author`
  - `attachments`
  - `embeds`
  - `mentions`
  - `reactions`
  - `inlineEmojis`

Campos importantes no `author`:
- `id`
- `name`
- `nickname`
- `isBot`

Campos importantes em `attachments`:
- `id`
- `url`
- `fileName`
- `fileSizeBytes`

Campos importantes em `embeds`:
- `url`
- `title`
- `description`
- `thumbnail`
- `images`

---

## Problema real de mídia, que precisa ser resolvido

No export atual, em vários casos `attachments[].url` não é uma URL pública. Ele pode virar apenas o nome do arquivo exportado localmente.

Exemplo lógico:
- valor útil original: uma URL do CDN do Discord
- valor presente no JSON exportado: `imagem-abc123.jpg`

Isso significa:

- o agregador não pode tratar `attachments[].url` como link público automaticamente;
- o agregador precisa distinguir:
  - URL pública original
  - nome do arquivo exportado localmente
  - URL externa vinda de embed
  - thumbnail canônica de embed

### Regra obrigatória

A integração deve separar estes conceitos:

- `originalUrl`
- `exportedLocalName`
- `embedUrl`
- `thumbnailCanonicalUrl`

Se o exporter atual sobrescreve a URL original com o nome do arquivo exportado, essa informação precisa ser preservada em um modo de export novo, ou por adaptação no código dele.

---

## O que o Codex deve fazer primeiro

### No projeto principal

Tomar `export_exemple.json` como contrato real da ingestão.

### No projeto irmão

Investigar `C:\projetos\DiscordChatExporter-prime` para descobrir:

1. onde as mensagens são modeladas;
2. onde attachments são serializados;
3. onde embeds são serializados;
4. onde a URL original do attachment pode estar sendo trocada pelo nome local do arquivo exportado;
5. se já existe opção ou abstração para export sem baixar mídia;
6. se existe estrutura reaproveitável para serialização customizada.

---

## Instrução obrigatória de investigação no DiscordChatExporter-prime

O Codex não deve assumir nomes de arquivos ou classes sem conferir.

Ele deve procurar por referências usando busca textual no repositório `C:\projetos\DiscordChatExporter-prime` com termos como:

- `attachments`
- `attachment`
- `embeds`
- `thumbnail`
- `canonicalUrl`
- `fileName`
- `export`
- `json`
- `media`
- `download`
- `url`
- `Message`
- `Channel`
- `Guild`

Objetivo da busca:
- localizar o ponto exato em que o JSON final é montado;
- localizar o ponto exato em que a mídia é baixada ou referenciada;
- localizar o ponto exato em que a URL original deixa de existir ou é substituída.

### Regra

Primeiro descobrir o boundary real do exporter.
Só depois adaptar.

---

## Estratégia correta de unificação

A unificação deve ocorrer em duas camadas.

### Camada 1, agora
Consumir o JSON exportado por arquivo.

Entrada:
- `export_exemple.json`

Fluxo:
1. ler JSON;
2. validar estrutura mínima;
3. mapear mensagens para um contrato interno;
4. persistir raw;
5. extrair candidatos;
6. aplicar regras editoriais;
7. publicar ou encaminhar para revisão.

### Camada 2, depois
Aprimorar o DiscordChatExporter-prime para oferecer um modo de export melhor para integração.

Nome sugerido:
- `integration_json`

Esse modo deve:
- preservar URL original dos attachments;
- opcionalmente não baixar mídia;
- continuar exportando embeds e metadados;
- entregar JSON estável para o agregador.

---

## Regra de negócio da feature

A regra de negócio fica no projeto principal, nunca no exporter.

### O exporter não decide:
- se a mesa entra;
- se a mesa é paga e deve ser excluída;
- se o sistema é próprio e deve ser rejeitado;
- como o texto final será publicado;
- qual será o status editorial final.

### O projeto principal decide:
- `accepted`
- `rejected`
- `awaiting_review`
- `publish_mode`
- `publish_at`
- texto final formatado
- exportação diária em TXT

---

## Regra editorial já consolidada

### Excluir automaticamente quando:
- a mesa for paga e `allow_paid = false`
- o sistema for próprio, caseiro, inventado, homebrew como sistema principal, experimental ou equivalente
- o sistema não existir na taxonomia e a política da source não permitir esse caso

### Mandar para revisão quando:
- o parser não conseguir confiança suficiente
- houver dados demais faltando
- houver ambiguidade entre mestre e recrutador
- houver conflito entre título, sistema e estrutura do anúncio

### Aceitar automaticamente quando:
- o anúncio tiver estrutura suficiente
- o sistema for reconhecido
- não houver bloqueio editorial
- o `publish_mode` da source permitir o fluxo

---

## Estrutura alvo no projeto principal

A feature deve entrar como novo domínio dentro do backend atual.

### Criar

`backend/src/routes/aggregator.ts`  
`backend/src/routes/aggregatorReview.ts`

`backend/src/services/aggregator/sourceService.ts`  
`backend/src/services/aggregator/importFromExporterService.ts`  
`backend/src/services/aggregator/rawImportService.ts`  
`backend/src/services/aggregator/candidateService.ts`  
`backend/src/services/aggregator/publishService.ts`  
`backend/src/services/aggregator/exportService.ts`  
`backend/src/services/aggregator/schedulerService.ts`

`backend/src/domain/aggregator/normalizeExporterPayload.ts`  
`backend/src/domain/aggregator/parseExporterMessage.ts`  
`backend/src/domain/aggregator/extractMediaLinks.ts`  
`backend/src/domain/aggregator/classifyPayment.ts`  
`backend/src/domain/aggregator/classifySystem.ts`  
`backend/src/domain/aggregator/resolveMasterRecruiter.ts`  
`backend/src/domain/aggregator/normalizeCandidate.ts`  
`backend/src/domain/aggregator/formatForPublication.ts`

`backend/src/db/aggregator.ts`

`backend/src/scripts/importDiscordExport.ts`  
`backend/src/scripts/aggregatorBackfill.ts`  
`backend/src/scripts/aggregatorReprocess.ts`

`backend/src/jobs/aggregatorWorker.ts`

`database/migration_05_aggregator_sources_and_queue.sql`

---

## Fluxo oficial da feature

```text
source habilitada
-> importar arquivo export_exemple.json ou equivalente
-> persistir mensagem bruta em imported_raw_messages
-> adaptar payload do exporter para contrato interno
-> extrair campos do anúncio
-> aplicar regras editoriais
-> persistir import_candidates
-> decidir accepted / rejected / awaiting_review
-> publicar ou segurar para revisão conforme publish_mode
-> gerar exportação TXT por dia
```

---

## Banco de dados, contrato esperado

### sources
Define a política da origem.

Campos relevantes:
- `platform = 'discord'`
- `server_id`
- `channel_id`
- `enabled`
- `allow_paid`
- `publish_mode`

### imported_raw_messages
Guarda o bruto e a rastreabilidade.

Deve conter:
- `source_id`
- `external_id`
- `raw_text`
- `author`
- `message_url`
- `processed`
- `message_created_at`
- `raw_payload`
- `processing_attempts`
- `last_processing_error`

### import_candidates
Guarda o resultado editorial.

Deve conter:
- `source_id`
- `external_id`
- `parsed_json`
- `confidence_score`
- `editorial_status`
- `publish_mode`
- `publish_at`
- `rejection_reason`
- `published_entity_id`

### aggregator_settings
Liga e desliga a feature globalmente.

---

## parsed_json mínimo esperado

```json
{
  "sourceMessageId": "1489816910265585676",
  "sourceChannelId": "1012065641282404481",
  "title": "Forgotten Realms: Uma Campanha Sandbox",
  "system": "Dungeons & Dragons 2024",
  "style": "Sandbox, aventura, sobrevivência, diplomacia, exploração e alta fantasia",
  "scheduleText": "Sábado das 12h às 16h",
  "slotsText": "5 vagas",
  "ageRating": "+18",
  "location": "Discord + Foundry VTT",
  "platforms": "Discord + Foundry VTT",
  "masterText": null,
  "recruiterName": "Ladrahas",
  "signupText": "mandar mensagem para este perfil",
  "synopsis": "texto consolidado",
  "isPaid": true,
  "priceText": "R$ 30,00 por sessão",
  "isCustomSystem": false,
  "mediaLinks": [],
  "externalLinks": [],
  "rawMentions": [],
  "needsReview": false
}
```

---

## Regras de mídia, detalhadas

### Ordem de preferência

1. URL pública original do attachment, se existir
2. URL externa útil vinda de embed
3. `thumbnail.canonicalUrl`, se representar a mídia ou preview útil
4. nome local exportado, apenas como referência técnica interna

### Regra obrigatória
Nunca usar `exportedLocalName` como URL pública final.

### Exemplo de estrutura interna recomendada

```json
{
  "mediaLinks": [
    {
      "kind": "attachment",
      "origin": "original_url",
      "url": "https://cdn.discordapp.com/...",
      "localName": "imagem-abc123.jpg",
      "fileName": "imagem.jpg"
    },
    {
      "kind": "embed",
      "origin": "embed_url",
      "url": "https://docs.google.com/forms/...",
      "label": "formulario"
    }
  ]
}
```

---

## O que o Codex deve procurar no DiscordChatExporter-prime

### Procura A, serialização de mensagens
Buscar onde o JSON final de mensagem é gerado.

Objetivo:
- descobrir de onde vêm `content`, `author`, `attachments`, `embeds`
- descobrir se existe modelo intermediário antes da exportação

### Procura B, serialização de attachments
Buscar onde:
- URL original do attachment é lida
- arquivo local é salvo
- nome local passa a ser exposto no JSON

Objetivo:
- impedir perda da URL original

### Procura C, embeds
Buscar onde:
- `embed.url`
- `thumbnail.canonicalUrl`
- `images`
são montados

Objetivo:
- reaproveitar links externos como formulário, docs, vídeos e imagens

### Procura D, opção de não baixar mídia
Buscar flags, config, opções ou modos de export que:
- desabilitem download de mídia
- mantenham somente links
- permitam serialização customizada

### Procura E, templates/exporters
Buscar classes, serviços ou módulos responsáveis por:
- export JSON
- export HTML
- export media assets

Objetivo:
- reaproveitar a parte útil sem importar o projeto inteiro.

---

## Regra de implementação para o Codex

### Não fazer
- não acoplar diretamente o backend principal ao build inteiro do DiscordChatExporter-prime
- não importar classes internas do exporter por conveniência sem encapsulamento
- não espalhar parsing do JSON do Discord em rotas
- não jogar regra editorial no frontend
- não tratar `attachments[].url` do export atual como URL externa confiável

### Fazer
- criar adapter interno de ingestão
- encapsular a integração em um ponto próprio
- documentar claramente a fronteira entre os dois projetos
- usar `export_exemple.json` como fixture de teste
- preparar evolução futura para `integration_json`

---

## Estratégia de testes

### Testes mínimos no projeto principal

1. importar `export_exemple.json` sem erro
2. persistir `raw_payload`
3. persistir `message_created_at`
4. gerar candidate com `parsed_json`
5. rejeitar mesa paga quando `allow_paid = false`
6. rejeitar sistema próprio ou marcar para revisão
7. preservar links de formulário vindos de `embeds`
8. não tratar nome local de attachment como URL final
9. exportar TXT por dia com as mesas aceitas

### Fixture obrigatória
Usar `C:\projetos\mesas_rpg_artificio\export_exemple.json` como base de ingestão nos testes iniciais.

---

## Rotas sugeridas

### Configuração
- `GET /api/aggregator/sources`
- `POST /api/aggregator/sources`
- `PUT /api/aggregator/sources/:id`
- `PATCH /api/aggregator/sources/:id/enabled`

### Importação
- `POST /api/aggregator/import/file`
- `POST /api/aggregator/import/source/:id/run`

### Editorial
- `GET /api/aggregator/candidates`
- `GET /api/aggregator/candidates/:id`
- `PATCH /api/aggregator/candidates/:id/accept`
- `PATCH /api/aggregator/candidates/:id/reject`
- `PATCH /api/aggregator/candidates/:id/review`

### Exportação
- `GET /api/aggregator/exports/day?date=YYYY-MM-DD`
- `GET /api/aggregator/exports/day.txt?date=YYYY-MM-DD`

---

## Exportação diária

A exportação por dia deve:

1. filtrar por `message_created_at`
2. pegar apenas candidatos `accepted`
3. ordenar por horário da mensagem
4. usar o formatter oficial do projeto
5. devolver texto puro
6. opcionalmente salvar arquivo `.txt`

### Importante
Exportação diária não é outro sistema.
É uma saída operacional da mesma feature.

---

## Atualizações obrigatórias de documentação

Ao implementar, atualizar:
- `ARQUITETURA_PROJETO.md`
- `FILA_IMPLEMENTACAO.md`
- `TODO_OPERACIONAL.md`

---

## Ordem de implementação recomendada

1. migration da feature agregador
2. tipos e acesso a dados
3. importador de `export_exemple.json`
4. adapter do payload do exporter
5. parser determinístico de anúncios
6. regras editoriais
7. rotas de importação e review
8. exportação TXT por dia
9. investigação e adaptação do `DiscordChatExporter-prime`
10. possível criação do modo `integration_json`

---

## Critério de aceite final

A feature estará aceitável quando:

1. o projeto principal importar o JSON exportado sem depender do exporter em runtime;
2. o raw for persistido integralmente;
3. a regra editorial funcionar;
4. links externos úteis forem preservados;
5. nomes locais de arquivo não forem tratados como links finais;
6. a exportação diária em TXT funcionar;
7. a fronteira entre `mesas_rpg_artificio` e `DiscordChatExporter-prime` estiver documentada;
8. houver caminho claro para evoluir o exporter para um formato `integration_json`.

---

## Resumo operacional

- `export_exemple.json` é o contrato atual de entrada.
- `DiscordChatExporter-prime` é a referência técnica a ser investigada e reaproveitada.
- o projeto principal continua dono da regra editorial e da publicação.
- a integração correta é por adapter e boundary claro.
- o maior risco atual é a perda da URL original dos attachments.
