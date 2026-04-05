\# Onde a feature do discord ou json ou os dois entra no projeto

\### Backend



Hoje o backend já está organizado assim:



\* `backend/src/server.ts`

\* `backend/src/db/`

\* `backend/src/middleware/`

\* `backend/src/routes/`

\* `backend/src/scripts/` 



Então a feature do agregador deve entrar em \*\*novos módulos dentro de `backend/src`\*\*, mantendo o padrão atual.



\### Banco



A pasta `database/` já concentra o versionamento SQL:



\* `migration\_01\_base\_schema.sql`

\* `migration\_02\_system\_taxonomy\_and\_ddal.sql`

\* `migration\_03\_gm\_profile\_nickname.sql`

\* `migration\_04\_publisher\_role\_and\_contacts.sql` 



Logo, a feature deve entrar como \*\*nova migration\*\*, e não como SQL solto em outro lugar.



\---



\## Estrutura adaptada à árvore atual



A melhor adaptação é esta:



```text id="c3ixab"

C:\\PROJETOS\\MESAS\_RPG\_ARTIFICIO

├── backend

│   └── src

│       ├── server.ts

│       ├── db

│       │   ├── index.ts

│       │   ├── types.ts

│       │   └── aggregator.ts

│       ├── middleware

│       │   ├── auth.ts

│       │   └── publisherRole.ts

│       ├── routes

│       │   ├── auth.ts

│       │   ├── gm.ts

│       │   ├── gmPanel.ts

│       │   ├── me.ts

│       │   ├── systems.ts

│       │   ├── tables.ts

│       │   ├── aggregator.ts

│       │   └── aggregatorReview.ts

│       ├── services

│       │   └── aggregator

│       │       ├── sourceService.ts

│       │       ├── rawImportService.ts

│       │       ├── candidateService.ts

│       │       ├── publishService.ts

│       │       ├── exportService.ts

│       │       └── schedulerService.ts

│       ├── domain

│       │   └── aggregator

│       │       ├── parseMessage.ts

│       │       ├── classifySystem.ts

│       │       ├── classifyPayment.ts

│       │       ├── resolveMasterRecruiter.ts

│       │       ├── normalizeCandidate.ts

│       │       └── formatForPublication.ts

│       ├── validators

│       │   └── aggregator.ts

│       ├── jobs

│       │   └── aggregatorWorker.ts

│       └── scripts

│           ├── systemsTreeImport.ts

│           ├── aggregatorBackfill.ts

│           └── aggregatorReprocess.ts

├── database

│   └── migration\_05\_aggregator\_sources\_and\_queue.sql

└── frontend

&#x20;   └── src

&#x20;       ├── pages

&#x20;       │   ├── AggregatorSourcesPage.tsx

&#x20;       │   ├── AggregatorReviewPage.tsx

&#x20;       │   └── AggregatorExportsPage.tsx

&#x20;       ├── components

&#x20;       │   └── aggregator

&#x20;       │       ├── SourceForm.tsx

&#x20;       │       ├── CandidateReviewTable.tsx

&#x20;       │       ├── CandidateDiffCard.tsx

&#x20;       │       └── ExportDayForm.tsx

&#x20;       └── services

&#x20;           └── aggregatorApi.ts

```



\---



\## O que cada parte faz



\### `backend/src/routes/aggregator.ts`



Rota de configuração e operação da feature:



\* CRUD de `sources`

\* listagem de candidatos

\* disparo manual de importação

\* exportação por dia



\### `backend/src/routes/aggregatorReview.ts`



Rota editorial:



\* aceitar candidato

\* rejeitar candidato

\* reenfileirar

\* publicar manualmente



\### `backend/src/services/aggregator/`



Camada de aplicação da feature.

Aqui fica a orquestração do fluxo:



\* importar raw

\* chamar parser

\* salvar candidate

\* decidir publicação

\* exportar TXT



\### `backend/src/domain/aggregator/`



Aqui fica a regra de negócio pura.

É onde a feature realmente decide:



\* se o sistema é válido

\* se a mesa é paga

\* como resolver mestre e recrutador

\* como normalizar dados

\* como formatar a saída final



\### `backend/src/db/aggregator.ts`



Queries específicas da feature, sem misturar com regras.



\### `backend/src/jobs/aggregatorWorker.ts`



Executa:



\* publicação atrasada de 10 minutos

\* reprocessamento de pendências

\* consumo periódico, se houver cron interno



\### `backend/src/scripts/aggregatorBackfill.ts`



Para importar histórico ou reprocessar um canal inteiro.



\---



\## Como isso conversa com o que já existe



Hoje já existem rotas como `auth.ts`, `gm.ts`, `gmPanel.ts`, `systems.ts` e `tables.ts`. 

Então esta feature não deve ir para `tables.ts` nem para `systems.ts`. Ela é um domínio novo.



O encaixe correto é:



\* \*\*nova rota própria\*\* para agregador

\* possível uso do painel já existente, via `gmPanel`, apenas como ponto de navegação no frontend

\* backend isolado por domínio, sem espalhar regra editorial em arquivos antigos



\---



\## Migration adaptada ao seu projeto



O nome mais coerente com a sequência atual seria:



```sql id="nphm6o"

database/migration\_05\_aggregator\_sources\_and\_queue.sql

```



Nessa migration devem entrar:



\* `sources`

\* `imported\_raw\_messages`

\* `import\_candidates`

\* `aggregator\_settings`



E convém já incluir os complementos operacionais:



```sql id="t6txfx"

ALTER TABLE imported\_raw\_messages

ADD COLUMN message\_created\_at TIMESTAMPTZ,

ADD COLUMN raw\_payload JSONB,

ADD COLUMN processing\_attempts INT DEFAULT 0,

ADD COLUMN last\_processing\_error TEXT;



ALTER TABLE import\_candidates

ADD COLUMN rejection\_reason TEXT,

ADD COLUMN published\_entity\_id UUID;

```



\---



\## Adaptação do `ARQUITETURA\_PROJETO.md` para a árvore real



O documento hoje ainda está genérico, com placeholders de stack e estrutura.

A seção de stack deveria ficar assim:



\### Stack tecnológico



\* \*\*Backend\*\*: Node.js + TypeScript

\* \*\*API\*\*: Express

\* \*\*Banco de dados\*\*: PostgreSQL

\* \*\*Acesso a dados\*\*: Kysely + pg

\* \*\*Frontend\*\*: React + Vite + TypeScript

\* \*\*Deploy\*\*: Docker + GitHub Actions

\* \*\*Infra\*\*: definida pelos arquivos de compose e workflows do projeto 



\### Estrutura de diretórios



Adaptada para o projeto real:



\* `backend/src/routes` para contratos HTTP

\* `backend/src/services` para orquestração

\* `backend/src/domain` para regra de negócio

\* `backend/src/db` para acesso a dados

\* `backend/src/jobs` para execução assíncrona

\* `backend/src/scripts` para manutenção e backfill

\* `database/` para migrations SQL

\* `frontend/src` para UI



\---



\## Fluxo da feature, já adaptado ao projeto



```text id="ym829s"

Discord source habilitada

\-> importação da mensagem

\-> persistência em imported\_raw\_messages

\-> parse estrutural no domínio aggregator

\-> aplicação das regras editoriais

\-> persistência em import\_candidates

\-> decisão por publish\_mode

\-> publicação final ou revisão manual

```



\---



\## Regras que devem ficar no backend, não no frontend



O próprio `ARQUITETURA\_PROJETO.md` já reforça que não deve haver lógica de negócio no frontend. 

Então esta feature precisa obedecer isso de forma rígida.



Devem ficar no backend:



\* exclusão de mesas pagas quando `allow\_paid = false`

\* exclusão de sistema próprio/caseiro/inventado

\* cálculo de `editorial\_status`

\* cálculo de `publish\_at`

\* resolução de mestre e recrutador

\* geração do texto formatado final

\* exportação do TXT por dia



O frontend só deve:



\* exibir

\* filtrar visualmente

\* aprovar/rejeitar

\* baixar exportação



\---



\## Rotas sugeridas para esta feature



\### Configuração



\* `GET /api/aggregator/sources`

\* `POST /api/aggregator/sources`

\* `PUT /api/aggregator/sources/:id`

\* `PATCH /api/aggregator/sources/:id/enabled`



\### Operação



\* `POST /api/aggregator/import/run`

\* `POST /api/aggregator/import/source/:id/run`

\* `GET /api/aggregator/candidates`

\* `GET /api/aggregator/candidates/:id`



\### Editorial



\* `PATCH /api/aggregator/candidates/:id/accept`

\* `PATCH /api/aggregator/candidates/:id/reject`

\* `PATCH /api/aggregator/candidates/:id/review`



\### Exportação



\* `GET /api/aggregator/exports/day?date=YYYY-MM-DD`

\* `GET /api/aggregator/exports/day.txt?date=YYYY-MM-DD`



\---



\## Como a exportação por dia entra nessa árvore



Ela não deve ser um software separado.

Ela entra como:



\* `backend/src/services/aggregator/exportService.ts`

\* rota HTTP em `backend/src/routes/aggregator.ts`

\* opcionalmente tela no frontend em `AggregatorExportsPage.tsx`



Esse serviço deve:



1\. buscar mensagens daquele dia via `message\_created\_at`

2\. pegar apenas `accepted`

3\. ordenar por horário

4\. formatar no padrão oficial

5\. devolver texto puro e download `.txt`



\---



\## Ordem de implementação mais segura



Adaptando ao `FILA\_IMPLEMENTACAO.md`, a fila inicial pode ser:



\* 001, migration da feature agregador

\* 002, repositório DB da feature

\* 003, parser determinístico de anúncios

\* 004, regras editoriais automáticas

\* 005, rotas de source e candidate

\* 006, publicação por modo

\* 007, exportação TXT por dia

\* 008, UI de revisão manual

\* 009, scripts de backfill

\* 010, job de publicação atrasada



O arquivo de fila já está preparado para esse tipo de lote. 



\---



\## Resumo objetivo



Adaptado para a árvore atual:



\* \*\*não criar outro app\*\*

\* \*\*usar o backend Node/TS existente\*\*

\* \*\*criar domínio novo `aggregator` dentro de `backend/src`\*\*

\* \*\*versionar tudo em nova migration SQL dentro de `database/`\*\*

\* \*\*manter regra editorial no backend\*\*

\* \*\*usar frontend só para revisão, configuração e exportação\*\*

