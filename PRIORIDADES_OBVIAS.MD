Segue um plano completo de implementação, já alinhado com o que foi definido para o agregador, com o parser externo em Python, com o fluxo de importação por JSON, com auto preenchimento do formulário, com a página pública da mesa, com o painel de revisão, e com a ordem correta de ataque aos bugs urgentes.

A base documental já aponta dois princípios que precisam continuar valendo: a feature entra como um domínio novo dentro do backend atual em Node/TypeScript, com rotas, services, domain, jobs e migration própria, e a lógica editorial deve ficar no backend, não no frontend. Também já existe a previsão de rotas para sources, candidates, revisão editorial e exportação diária.  O parser externo, por sua vez, já foi definido para receber JSON do DiscordChatExporter e devolver campos estruturados em `enrichedFields`, com foco em `title`, `system`, `scheduleText`, `slotsText`, `platforms`, `ageRating`, `priceText`, `synopsis`, `style`, `recruiterName`, `signupText`, `location`, `banner_url` e `avatar_url`, além de campos opcionais como `level_range`, `campaign_length`, `experience_required`, `tags`, `is_paid`, `requires_pc` e `external_links`. 

## 1. Decisão principal

O projeto precisa tratar isso como três fluxos diferentes, mas conectados:

1. cadastro manual da mesa;
2. importação de anúncio via JSON do Discord;
3. revisão editorial de candidatos importados.

Os três devem convergir para o mesmo contrato de dados da mesa. O erro mais comum nesse tipo de projeto é deixar o cadastro manual ter um schema e a importação ter outro. Isso precisa ser evitado.

A decisão correta é esta:

* existe um `TableDraft`, que representa a mesa em edição;
* existe um `ImportCandidate`, que representa o anúncio importado e ainda não aprovado;
* existe uma `PublishedTable`, que representa a mesa efetivamente publicada;
* o parser Python não publica nada;
* o parser Python só enriquece o `ImportCandidate`;
* o frontend só exibe, edita, aprova e corrige;
* a decisão editorial final fica no backend. 

## 2. Prioridade real do projeto, antes de qualquer REQ novo

O documento de bugs urgentes está correto na estratégia. Não vale abrir uma nova fase grande de formulário enquanto os bloqueios de beta não estiverem estáveis.

A ordem certa é:

1. corrigir e validar o bug de logout;
2. corrigir e validar o bug de auto-detecção;
3. validar visualmente o comportamento do seletor de sistema, que no código já aparece como resolvido;
4. fechar o bug de dados brutos e prioridade de `enrichedFields`;
5. só depois abrir a nova rodada grande de melhorias do formulário.

Na prática, o projeto precisa operar em dois trilhos ao mesmo tempo:

* trilho A, estabilização do beta atual;
* trilho B, fechamento da arquitetura completa da feature de importação e auto preenchimento.

## 3. O que a página de mesa precisa ter

Pelas telas, o formulário atual já cobre uma parte boa do fluxo, mas ainda não cobre o suficiente para representar os anúncios reais do JSON. O próprio `teste.json` traz casos com múltiplos horários, múltiplas vagas, mesa em andamento, formulário externo, requisito de PC, múltiplos links, anúncios em que o autor não é o mestre, anúncios pagos, anúncios gratuitos e anúncios com sistema próprio. 

A página de mesa precisa ser dividida em blocos claros.

### Bloco A, identidade da mesa

Campos:

* título da mesa;
* sistema base, edição/subsistema, variante;
* cenário;
* mestre exibido;
* papel do publicador, mestre ou anunciante;
* idioma.

Mudança importante:

* `mestre exibido` e `quem está publicando` não podem continuar implicitamente ligados;
* se o anúncio disser “Mestre: Mariana”, mas o autor do post for outra pessoa, o formulário precisa marcar isso corretamente.

### Bloco B, tipo e estado da mesa

Campos:

* tipo da mesa: campanha, one-shot, campanha curta, campanha longa, mesa aberta, grupo/servidor;
* modalidade: online, presencial, híbrida;
* mesa em andamento: sim ou não;
* data de início;
* duração estimada da campanha;
* faixa de nível;
* nível de experiência exigido.

Mudança importante:

* o formulário atual tem “Tipo de Mesa”, mas ainda precisa diferenciar campanha regular de anúncio de grupo/servidor. O `teste.json` tem pelo menos um caso que é mais anúncio de grupo do que de uma mesa específica. 

### Bloco C, agenda estruturada

Esse é o ponto mais importante a ser corrigido no formulário.

Hoje o projeto está modelando a agenda em um texto único, mas os anúncios reais têm variações como:

* um único dia e um único horário;
* dois dias;
* duas faixas no mesmo dia;
* uma faixa em andamento e outra aberta;
* frequência semanal ou quinzenal;
* texto complementar como “algum dia de semana para reposição”. 

A página precisa de um repetidor de sessões com:

* dia da semana;
* hora inicial;
* hora final;
* frequência;
* vagas totais;
* vagas disponíveis;
* em andamento;
* observação opcional.

Sem isso, o parser sempre vai achar mais do que a UI consegue armazenar.

### Bloco D, classificação e cobrança

Campos:

* classificação indicativa;
* cobrança: gratuita, comissionada, contribuição, outra;
* texto detalhado da cobrança;
* sessão zero gratuita: sim ou não.

Mudança importante:

* não basta um dropdown “gratuita/comissionada”;
* precisa haver um campo `billingText`, porque os anúncios reais trazem coisas como “R$ 30 por sessão”, “R$ 75 por mês”, “sessão zero gratuita”, “mensalidade”, “valor promocional” e equivalentes. 

### Bloco E, descrição editorial

Campos:

* descrição da mesa;
* sinopse;
* estilo/temática;
* regras e observações;
* requisitos técnicos;
* diferenciais/benefícios, opcional.

Mudança importante:

* `style` não pode ficar escondido dentro da descrição;
* o parser já foi pensado para extrair `style`, então a UI precisa de um campo próprio para isso. 

### Bloco F, plataformas e local

Campos:

* local do jogo;
* plataformas;
* requer PC;
* requer notebook;
* requer câmera;
* requer microfone;
* requer internet estável.

Mudança importante:

* `platforms` e `requirements` precisam ser separados;
* o JSON tem casos como “Discord + Foundry VTT (Necessário ter PC)” e “Alchemy VTT, obrigatório ter câmera”. Isso não deve virar apenas texto perdido em descrição. 

### Bloco G, mídia

Campos:

* URL do banner;
* origem do banner, attachment, embed, manual;
* avatar do publicador;
* galeria opcional.

Mudança importante:

* o `banner_url` precisa ser preenchido automaticamente pelo primeiro attachment de imagem, como já previsto na especificação do parser. 

### Bloco H, recrutamento

Campos:

* canais de recrutamento, repetidor;
* tipo do canal: Discord, WhatsApp, formulário, site, e-mail, outro;
* valor do contato;
* rótulo opcional;
* prioridade do canal;
* instrução de inscrição.

Mudança importante:

* precisa suportar múltiplos links, porque o JSON real traz formulário em texto, formulário em embed, site, Discord privado e WhatsApp.

## 4. O que a página pública da mesa precisa mostrar

A página pública da mesa, o slug próprio, precisa ser pensada como uma ficha limpa e completa, não como espelho literal do formulário.

Ela deve mostrar:

* título;
* sistema e cenário;
* selo de tipo, campanha ou one-shot;
* selo de cobrança;
* classificação indicativa;
* status, aberta ou em andamento;
* agenda resumida;
* vagas;
* descrição/sinopse;
* estilo/temática;
* plataformas;
* requisitos;
* mestre;
* anunciante, quando diferente do mestre;
* canais de recrutamento;
* banner e avatar.

Também precisa mostrar:

* tags;
* faixa de nível;
* experiência necessária;
* data de atualização;
* origem da publicação, manual ou importada.

Sobre o “placeholder”, o bug está bem descrito como algo que “deveria aparecer na página da mesa, no painel, ou na página principal”, mas sem definição funcional clara. Então, antes de codar qualquer coisa, isso precisa virar um conceito concreto. O mais provável é que o projeto esteja precisando de um campo editorial curto, algo como “resumo curto” ou “chamada curta”, e não de um “placeholder” no sentido HTML. O caminho correto é renomear isso no produto e no schema para algo inequívoco, por exemplo `summary_short` ou `listing_excerpt`.

## 5. O que o backend precisa ter

### Camada de dados

Manter o desenho já proposto:

* `sources`
* `imported_raw_messages`
* `import_candidates`
* `aggregator_settings` 

E acrescentar, de forma obrigatória:

* `message_created_at`
* `raw_payload`
* `processing_attempts`
* `last_processing_error`
* `rejection_reason`
* `published_entity_id`

Além disso, a entidade principal de mesa publicada precisa armazenar os campos que hoje o formulário ainda não representa bem:

* agenda estruturada;
* vagas disponíveis;
* detalhe de cobrança;
* requisitos técnicos;
* canais de recrutamento múltiplos;
* tags;
* links externos;
* origem importada.

### Camada de domínio

O backend precisa ter módulos claros:

* `normalizeExporterPayload`
* `parseExporterMessage`
* `classifySystem`
* `classifyPayment`
* `resolveMasterRecruiter`
* `normalizeCandidate`
* `formatForPublication`
* `candidateToDraft`
* `draftToPublished`

O ponto central é este:

* `parseExporterMessage` extrai;
* `normalizeExporterPayload` unifica;
* `candidateToDraft` mapeia para o formulário;
* `draftToPublished` valida e publica.

### Camada de serviço

Services necessários:

* `sourceService`
* `importFromExporterService`
* `rawImportService`
* `candidateService`
* `reviewService`
* `publishService`
* `exportService`
* `schedulerService` 

### Rotas

Rotas mínimas:

* `GET /api/aggregator/sources`
* `POST /api/aggregator/sources`
* `PUT /api/aggregator/sources/:id`
* `PATCH /api/aggregator/sources/:id/enabled`
* `POST /api/aggregator/import/file`
* `GET /api/aggregator/candidates`
* `GET /api/aggregator/candidates/:id`
* `PATCH /api/aggregator/candidates/:id/accept`
* `PATCH /api/aggregator/candidates/:id/reject`
* `PATCH /api/aggregator/candidates/:id/review`
* `GET /api/aggregator/exports/day`
* `GET /api/aggregator/exports/day.txt` 

Além disso:

* `GET /api/tables/:id/import-debug`
* `POST /api/aggregator/candidates/:id/apply-to-draft`
* `POST /api/tables/:id/publish`

## 6. Como o parser Python deve ser implementado

Com as bibliotecas realmente instaladas, a v1 deve ser determinística. O parser foi especificado para enriquecer mensagens do DiscordChatExporter e extrair campos estruturados, mas, no ambiente que foi descrito agora, o desenho mais sólido não deve depender de spaCy como requisito obrigatório. A base real da v1 deve ser:

* `re`
* `json`
* `beautifulsoup4`
* `python-dateutil`
* `parsedatetime`
* `pandas`
* `numpy`
* `python-magic`, quando necessário para tipo de arquivo. 

### Estrutura recomendada do parser

Arquivos:

* `scripts/parser/main.py`
* `scripts/parser/clean_text.py`
* `scripts/parser/extract_title.py`
* `scripts/parser/extract_system.py`
* `scripts/parser/extract_schedule.py`
* `scripts/parser/extract_slots.py`
* `scripts/parser/extract_platforms.py`
* `scripts/parser/extract_price.py`
* `scripts/parser/extract_synopsis.py`
* `scripts/parser/extract_style.py`
* `scripts/parser/extract_signup.py`
* `scripts/parser/extract_media.py`
* `scripts/parser/extract_links.py`
* `scripts/parser/normalize.py`
* `scripts/parser/confidence.py`

### Entrada do parser

O parser recebe um objeto de mensagem do DiscordChatExporter:

* `id`
* `timestamp`
* `content`
* `author`
* `attachments`
* `embeds`
* `mentions`

### Saída do parser

A saída precisa ser sempre JSON, com:

* `enrichedFields`
* `confidence`
* `missingFields`
* `reviewFlags`
* `debug`

### Campos de saída

Obrigatórios:

* `title`
* `system`
* `scheduleText`
* `slotsText`
* `platforms`
* `ageRating`
* `priceText`
* `synopsis`
* `style`
* `recruiterName`
* `signupText`
* `location`
* `banner_url`
* `avatar_url`

Opcionais:

* `level_range`
* `session_duration`
* `campaign_length`
* `experience_required`
* `tags`
* `is_paid`
* `requires_pc`
* `external_links`

### Regras do parser

* limpar markdown e decoração;
* detectar títulos por heading, marcador ou primeira linha forte;
* detectar sistema com taxonomia e aliases;
* marcar sistema próprio, experimental, homebrew como caso inválido ou revisável;
* detectar múltiplos horários;
* detectar vagas totais e vagas disponíveis;
* detectar cobrança;
* detectar inscrição por formulário, WhatsApp, DM ou site;
* extrair banner do primeiro attachment de imagem;
* extrair avatar de `author.avatarUrl`;
* extrair links externos de embeds e texto cru.

### Modo de confiança

Cada campo precisa ter score próprio, por exemplo:

* `exact_marker`
* `high_confidence_regex`
* `weak_inference`
* `manual_required`

Isso é importante porque o frontend não deve tratar um preenchimento fraco do mesmo jeito que um preenchimento certo.

## 7. Como o auto preenchimento deve funcionar ao importar JSON

Esse fluxo precisa ser simples e confiável.

### Passo 1

Usuário sobe um JSON exportado do Discord.

### Passo 2

Backend valida o shape mínimo:

* `guild`
* `channel`
* `messages[]` 

### Passo 3

Cada mensagem vira um `imported_raw_messages`.

### Passo 4

O backend chama o parser Python para gerar `enrichedFields`.

### Passo 5

O backend roda `normalizeExporterPayload` e `parseExporterMessage`.

### Passo 6

O backend aplica regras editoriais:

* paga ou não;
* sistema válido ou não;
* confiança suficiente ou não;
* duplicada ou não;
* mesa ou anúncio de grupo;
* mestre e recrutador. 

### Passo 7

O candidato vira:

* `accepted`
* `awaiting_review`
* `rejected`

### Passo 8

Quando o usuário abre a revisão, o frontend recebe:

* `raw`
* `enrichedFields`
* `normalizedCandidate`
* `formPatch`
* `reviewFlags`

### Passo 9

O formulário já abre preenchido.

### Passo 10

O usuário ajusta só o que faltar e confirma.

## 8. Como o frontend deve ser organizado

### Página 1, Sources

Serve para:

* cadastrar canais monitorados;
* definir `allow_paid`;
* definir `publish_mode`;
* testar conexão;
* disparar importação manual.

### Página 2, Review de candidatos

Precisa ter:

* lista de candidatos;
* filtros por status, source, data, sistema, confiança;
* preview da mensagem original;
* diff entre bruto, extraído e formulário;
* painel lateral de edição;
* bloco de “dados brutos” expandível;
* badge de confiança;
* badge de origem do campo, parser, regra, manual.

### Página 3, Formulário de mesa

É a mesma página usada para criar e editar, mas também serve para revisar candidato importado.

Ela deve aceitar um `formPatch`.

### Página 4, Exportação diária

Precisa permitir:

* escolher data;
* filtrar por source;
* escolher formato;
* baixar TXT.

### Componente crítico, seletor de sistema

O comportamento relatado no bug 2 deve permanecer estável:

* seleção visível no topo;
* scroll automático;
* destaque visual;
* caixa fixa de confirmação.

Como o documento já trata esse bug como resolvido no código, a ação aqui é validação de beta, não reescrita estrutural.

## 9. O que precisa ser corrigido especificamente nos bugs urgentes

### BUG 1, auto-detecção

A correção não deve ser tratada só como “copiar scripts Python pro container”.

A implementação correta precisa garantir quatro coisas ao mesmo tempo:

1. o parser Python existe na imagem;
2. o comando de execução está configurado;
3. o backend registra se o parser rodou ou caiu;
4. o frontend realmente prioriza `enrichedFields`.

Checklist técnico:

* Dockerfile copia `scripts/parser`;
* `PYTHON_CMD` configurado;
* log de entrada e saída do parser;
* log de timeout;
* `normalizeExporterPayload` confirma presença de `enrichedFields`;
* `candidateToFormData` prioriza `enrichedFields`;
* dados brutos mostram a origem de cada valor.

### BUG 3, logout em 5 minutos

Isso é bloqueador real de beta.

A correção precisa incluir:

* verificação do valor efetivo de `JWT_EXPIRES_IN`;
* log do valor carregado no boot;
* log de `exp` emitido no token;
* verificação de clock drift;
* confirmação de que o frontend não invalida sessão por erro de refresh;
* teste manual de 10, 30 e 60 minutos.

### BUG 4, parser TS ignora parser Python

Mesmo que a correção já tenha sido feita localmente, o projeto precisa formalizar essa regra:

* o TS não pode reextrair cegamente quando `enrichedFields` estiver presente;
* o TS deve usar `enrichedFields` como prioridade;
* o parsing manual fica como fallback de campo, não como substituição completa.

### BUG 5, placeholder

Não corrigir ainda sem definição funcional.
Primeiro transformar isso em nome de negócio real:

* resumo curto;
* chamada curta;
* subtítulo;
* texto de listagem.

## 10. Como o schema do formulário deve mudar

Campos que eu adicionaria imediatamente:

* `master_display_name`
* `publisher_role`
* `billing_text`
* `age_rating`
* `style_text`
* `level_range`
* `requires_pc`
* `requires_camera`
* `requires_microphone`
* `external_links`
* `tags`
* `sessions[]`
* `slots_available`
* `listing_excerpt`

Campos que eu mudaria:

* `audience` precisa ser revisto, porque hoje parece misturar classificação etária com perfil de público;
* `vagas totais` não pode mais ser o único campo de vagas;
* `frequência das sessões` não deve ser o único lugar da agenda.

## 11. Como a importação deve lidar com os casos reais do JSON

O `teste.json` já mostra vários edge cases que o sistema precisa suportar:

* anúncio com formulário em embed, sem depender de regex no texto;
* attachment de banner claro;
* autor diferente do mestre;
* múltiplos horários na mesma campanha;
* exigência de PC explícita;
* sistema próprio ou baseado em outro sistema;
* anúncio que é grupo, e não mesa única;
* valor zero em texto provocativo, mas com sistema próprio;
* homebrew como complemento e não como sistema principal.

Por isso o parser não deve devolver só um `system`. Ele deve devolver também:

* `system_raw`
* `system_normalized`
* `system_classification`, válido, inválido, revisável
* `payment_classification`, gratuita, paga, ambígua
* `candidate_kind`, mesa, grupo, anúncio múltiplo, inválido

## 12. Plano de implementação por fases

### Fase 0, estabilização do beta

* validar bug 3;
* validar bug 1;
* confirmar bug 2;
* consolidar bug 4;
* esclarecer bug 5.

### Fase 1, backend base

* migration `05`;
* repositório DB do agregador;
* persistência raw;
* sources;
* candidates;
* settings.

### Fase 2, parser Python

* CLI;
* contratos de entrada e saída;
* extratores por campo;
* score de confiança;
* testes com `teste.json`.

### Fase 3, importação

* endpoint `/api/aggregator/import/file`;
* criação de candidates;
* mapeamento de `enrichedFields`;
* rejection reasons;
* logs.

### Fase 4, revisão editorial

* lista de candidates;
* diff bruto versus enriquecido versus formulário;
* aceitar, rejeitar, revisar;
* aplicar patch ao draft.

### Fase 5, formulário expandido

* agenda estruturada;
* cobrança detalhada;
* requisitos técnicos;
* recrutamento múltiplo;
* campos de sistema e cenário consolidados.

### Fase 6, publicação e página pública

* publicação a partir do draft aprovado;
* slug da mesa;
* listagem;
* página individual.

### Fase 7, exportação diária

* TXT por dia;
* filtro por source;
* ordenação por `message_created_at`. 

## 13. Critério de aceite real

O projeto só deve considerar essa feature pronta quando estes cenários passarem:

1. importar JSON sem erro;
2. persistir `raw_payload`;
3. executar parser Python dentro do container;
4. popular `enrichedFields`;
5. abrir formulário com auto preenchimento;
6. preencher sistema automaticamente quando houver alta confiança;
7. puxar banner automaticamente do attachment;
8. puxar formulário automaticamente do embed;
9. separar mestre e anunciante;
10. marcar corretamente mesa paga, gratuita ou inválida;
11. rejeitar sistema próprio quando a política exigir isso;
12. permitir revisão manual sem perder os dados do parser;
13. exportar TXT do dia;
14. manter sessão autenticada além de 10 minutos;
15. exibir sistema selecionado no topo da UI;
16. registrar logs suficientes para auditoria.

## 14. Resultado esperado

Quando isso estiver implementado, o fluxo ideal será este:

* o admin sobe um JSON;
* o backend persiste tudo;
* o parser enriquece;
* o sistema classifica;
* o frontend abre o candidato já preenchido;
* o admin só revisa o que estiver ambíguo;
* a mesa é publicada com página própria;
* o export diário sai do mesmo pipeline.

Essa é a forma mais segura de aproveitar o que já existe, corrigir os gargalos atuais e evitar que o formulário e o parser cresçam em direções diferentes.

O próximo passo correto é transformar esse plano em backlog executável por arquivos, já separado em:

* migrations;
* backend routes/services/domain;
* parser Python;
* frontend pages/components;
* checklist de validação beta.
