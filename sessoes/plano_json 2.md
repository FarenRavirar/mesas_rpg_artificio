Perfeito. Isso muda o diagnóstico: além do REQ-28, agora há **três bugs funcionais imediatos** no fluxo de importação/criação.

O que já apareceu na validação anterior continua valendo: ainda há lacunas reais no mapeamento e na validação, como `requires_pc` ausente no parser e `is_ongoing` não mapeado no frontend, então o status não era “100% concluído” mesmo. 

Com o que foi relatado agora, eu trataria assim:

## Bugs novos a abrir imediatamente

### BUG A, descrição não vem completa

Sintoma:

* a importação ou o auto preenchimento não está levando toda a descrição/sinopse para o formulário ou para a mesa final.

Hipóteses mais prováveis:

* o parser está extraindo só `synopsis` curta e não o bloco inteiro útil;
* `candidateToFormData.ts` está priorizando um campo curto e ignorando descrição longa;
* existe truncamento ou sanitização excessiva no frontend;
* o `POST /api/v1/gm/tables` ou o fluxo de aprovação está persistindo `description` incompleta.

Ponto crítico:

* o JSON real tem anúncios longos, com sinopse + observações + instruções + benefícios, então o sistema precisa decidir claramente:

  * o que vai em `description`
  * o que vai em `rules/observations`
  * o que vai em `signupText`

Sem isso, ele sempre vai parecer “burro” porque vai puxar só um pedaço do anúncio. O `teste.json` tem vários casos desse tipo. 

### BUG B, banner não está entrando

Sintoma:

* “não tá puxando o link do banner”.

Hipóteses mais prováveis:

* `banner_url` até é extraído, mas não chega ao `formPatch`;
* `candidateToFormData.ts` pode estar buscando no lugar errado;
* o frontend pode estar usando `cover_url` enquanto a importação entrega `banner_url`;
* o fluxo manual `POST /api/v1/gm/tables` pode não estar aceitando/persistindo esse campo corretamente;
* no fluxo importado, o preview pode não estar lendo a mesma chave que o backend salva.

Isso combina com a própria validação anterior, que citava correção `banner_url -> cover_url` só em uma rota pública, o que não prova que o fluxo completo de criação/revisão esteja consistente. 

### BUG C, `POST /api/v1/gm/tables` retorna 500

Sintoma:

* erro real no backend, não só falha visual:
  `POST https://mesasbeta.artificiorpg.com/api/v1/gm/tables 500`

Hipóteses mais prováveis:

* o frontend está enviando campos novos que a rota `gm/tables` não sanitiza ou não persiste;
* há mismatch entre nome de campo do frontend e nome esperado no backend;
* algum campo array ou JSON está vindo em formato diferente do esperado;
* a insert ou update no banco está falhando por coluna ausente, tipo incorreto, valor inválido ou transformação quebrada;
* `cover_url/banner_url`, `setting_styles`, `recruitment_channels` ou requisitos técnicos podem estar provocando erro.

Esse bug é prioritário porque, sem resolver o 500, o resto nem consegue ser validado direito.

## Como eu reorganizaria a prioridade agora

A prioridade imediata deixa de ser “expandir mais o formulário” e passa a ser:

1. corrigir o `500` do `POST /api/v1/gm/tables`
2. corrigir descrição incompleta
3. corrigir banner não preenchido
4. fechar o restante do auto preenchimento inteligente
5. só então continuar expansão estrutural

## O que pedir para o agente agora

Eu mandaria este prompt, sem suavizar:

```text id="143qnm"
Nova prioridade crítica.

Além do que já foi auditado antes, surgiram 3 bugs funcionais reais no fluxo de importação/criação de mesa que precisam ser tratados como bloqueadores imediatos:

1. a descrição não está vindo completa
2. o link do banner não está sendo puxado/preenchido
3. `POST /api/v1/gm/tables` está retornando 500 em beta

Quero uma investigação técnica objetiva e uma correção incremental, sem criar arquivos novos.

Escopo da análise e correção

A. Descrição incompleta
Investigue ponta a ponta:
- parser Python
- `normalizeExporterPayload.ts`
- `parseExporterMessage.ts`
- `candidateToFormData.ts`
- formulário/frontend
- rota `POST /api/v1/gm/tables`
- persistência no banco
- página pública

Quero descobrir:
- de onde a descrição completa deveria vir
- qual campo está sendo usado hoje: `synopsis`, `description`, `content` ou outro
- onde o texto está sendo truncado, resumido, descartado ou substituído
- se o sistema está escolhendo só a sinopse curta quando deveria montar descrição longa
- qual deve ser a regra correta para `description`, `rules/observations` e `signupText`

B. Banner não preenchido
Investigue ponta a ponta:
- parser Python, `banner_url`
- `attachments`
- `normalizeExporterPayload.ts`
- `parseExporterMessage.ts`
- `candidateToFormData.ts`
- payload do formulário
- `POST /api/v1/gm/tables`
- persistência
- payload da página pública

Quero descobrir:
- se `banner_url` está sendo extraído de fato
- se ele some no mapeamento
- se há conflito entre `banner_url` e `cover_url`
- se o formulário está lendo uma chave e o backend salvando outra
- se a rota manual `gm/tables` aceita o campo corretamente

C. Erro 500 em `POST /api/v1/gm/tables`
Investigue tecnicamente com foco em causa raiz real.

Quero:
- localizar a rota exata
- mostrar o payload esperado por ela
- mostrar quais campos o frontend está enviando hoje
- identificar qual campo ou transformação pode estar quebrando
- apontar se o problema é:
  - sanitização
  - validação
  - transformação
  - insert/update no banco
  - mismatch de tipos
  - mismatch de nomes de campo

Se houver logs ou pontos onde logs precisam ser adicionados, faça isso.

Entrega esperada

1. diagnóstico por bug, separado
2. arquivos exatos afetados
3. causa raiz provável ou confirmada
4. menor conjunto de mudanças para corrigir
5. correção implementada, se for segura
6. atualização dos documentos canônicos necessários:
- `TODO_OPERACIONAL.md`
- `FILA_IMPLEMENTACAO.md`
- `RESUMO_EXECUCAO.md`
- `ERROS_SOLUTIONS.md`

Regra documental
- procure 3x antes de adicionar qualquer linha nova
- atualize linhas existentes quando houver item equivalente
- não criar arquivos novos

Prioridade de execução
1. corrigir o 500
2. corrigir banner
3. corrigir descrição completa
4. só depois retomar refinamentos do auto preenchimento

Importante
- não responda com otimismo genérico
- quero evidência por arquivo e por fluxo
- se algo não estiver provado, diga que não está provado
- não marque nada como concluído sem validação real
```

## O que eu acho que está acontecendo

Pelo conjunto dos sintomas, a chance maior é esta:

* o parser já extrai parte dos dados;
* o `candidateToFormData` está montando um patch incompleto;
* o formulário/manual create está usando outro contrato;
* a rota `gm/tables` não está preparada para alguns campos novos ou está esperando nomes diferentes;
* e isso está gerando tanto perda de dados quanto o `500`.

Em outras palavras: não parece um bug isolado. Parece um **desalinhamento de contrato entre importação, formulário e rota de gravação**.

Sim. Abaixo está o backlog técnico por arquivo para os **3 bugs imediatos**:

* descrição incompleta;
* banner não preenchido;
* `POST /api/v1/gm/tables` retornando 500.

Ele parte do que já foi auditado antes: o fluxo importado já tinha lacunas entre parser, `enrichedFields`, `candidateToFormData` e persistência final, inclusive com campos como `requires_pc` ainda ausentes no parser e `is_ongoing` não mapeado no frontend. 

---

# Backlog técnico executável, bugs imediatos do fluxo JSON

## Visão de prioridade

### Prioridade 0, bloqueador

1. corrigir o `500` do `POST /api/v1/gm/tables`

### Prioridade 1, quebra funcional visível

2. corrigir banner não preenchido

### Prioridade 2, qualidade editorial

3. corrigir descrição incompleta

### Prioridade 3, fechar coerência do fluxo

4. alinhar mapeamento, persistência e exibição pública

---

# BUG 1, `POST /api/v1/gm/tables` retorna 500

## Objetivo

Descobrir a causa raiz do erro 500 e corrigir o contrato entre frontend, rota, validação, sanitização e banco.

## Hipótese central

O frontend está enviando campos que a rota não espera, ou em formato incompatível, e a rota falha ao sanitizar, transformar ou persistir.

---

## Backlog por arquivo

| Arquivo                                                                       | Tarefa                                                                                                     | Dependência                   | Risco | Critério de aceite                                                                                       |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------- | ----- | -------------------------------------------------------------------------------------------------------- |
| `frontend` componente/página que envia o formulário de criação/edição da mesa | Capturar o payload real enviado ao `POST /api/v1/gm/tables`                                                | Nenhuma                       | Médio | Existe um payload real documentado com todos os campos enviados pelo frontend                            |
| `frontend/src/utils/candidateToFormData.ts`                                   | Verificar se o `formPatch` gera campos incompatíveis com a rota `gm/tables`                                | Payload real capturado        | Médio | Lista fechada de campos gerados e comparação com o contrato esperado da rota                             |
| `backend/src/routes/gmPanel.ts`                                               | Localizar a rota `POST /api/v1/gm/tables` e mapear exatamente quais campos ela aceita, sanitiza e persiste | Payload real + código da rota | Alto  | Existe uma tabela comparando “campo enviado” vs “campo aceito” vs “campo ignorado” vs “campo que quebra” |
| `backend/src/routes/gmPanel.ts`                                               | Adicionar logs temporários estruturados antes da sanitização e antes da persistência                       | Localização da rota           | Baixo | Logs mostram body recebido, campos normalizados e ponto exato da falha                                   |
| `backend/src/routes/gmPanel.ts`                                               | Envolver o bloco crítico de criação com tratamento de erro que exponha causa real no log interno           | Logs adicionados              | Médio | O erro 500 deixa de ser opaco e passa a indicar campo, validação ou operação que falhou                  |
| `backend/src/db/types.ts`                                                     | Verificar compatibilidade entre os tipos esperados pelo backend e o payload recebido                       | Rota mapeada                  | Médio | Nenhum campo usado pela rota está com tipo incoerente no TypeScript                                      |
| migration/schema do banco relevante                                           | Confirmar se todos os campos que a rota tenta persistir realmente existem na tabela e com tipo compatível  | Rota mapeada                  | Alto  | Não há tentativa de insert/update em coluna ausente ou tipo incompatível                                 |
| camada de sanitização usada por `gmPanel.ts`                                  | Validar arrays, strings opcionais, nullables e objetos repetidores                                         | Payload real + rota           | Alto  | Arrays como `setting_styles` ou canais múltiplos deixam de quebrar a criação                             |
| `ERROS_SOLUTIONS.md`                                                          | Registrar o erro 500 com causa raiz confirmada, sinais, solução e status                                   | Diagnóstico confirmado        | Baixo | O erro fica documentado como memória operacional                                                         |

---

## Pontos específicos a verificar no 500

### Contrato do body

Verificar se a rota aceita e sanitiza corretamente:

* `setting_name`
* `setting_styles`
* `billing_text`
* `banner_url` ou `cover_url`
* `recruitment_channels`
* `requires_pc`
* `requires_camera`
* `requires_microphone`
* `is_ongoing`
* agenda estruturada, se já estiver sendo enviada

### Locais prováveis de falha

* sanitização de array recebendo string;
* sanitização de string recebendo array;
* persistência de coluna inexistente;
* mismatch `banner_url` vs `cover_url`;
* nested object de recrutamento sem serialização adequada;
* campos opcionais chegando como `undefined`, `null`, string vazia ou array vazio em formato inesperado.

---

## Teste manual ideal para esse bug

O teste certo não é só clicar e ver 500. É capturar:

1. payload enviado pelo frontend;
2. log do backend ao receber;
3. log do backend após sanitização;
4. stack trace do erro;
5. query ou insert que falhou, se houver.

---

# BUG 2, banner não preenchido

## Objetivo

Garantir que o banner do anúncio importado:

* seja extraído do JSON;
* chegue ao candidato;
* preencha o formulário;
* apareça no preview;
* seja persistido;
* apareça na página pública.

## Hipótese central

O banner pode estar sendo extraído como `banner_url`, mas algum ponto posterior está esperando `cover_url`, ou ignorando attachments na hora de montar o `formPatch`.

---

## Backlog por arquivo

| Arquivo                                                            | Tarefa                                                                                                  | Dependência                        | Risco | Critério de aceite                                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Confirmar extração do primeiro attachment de imagem em `banner_url`                                     | JSON real com attachment           | Médio | Mensagem com attachment de imagem devolve `banner_url` preenchido, como previsto na especificação do parser  |
| `backend/src/services/aggregator/parser/schemas.py`                | Garantir que `banner_url` está no schema e não está sendo descartado                                    | Parser revisado                    | Baixo | `banner_url` passa na validação Pydantic                                                                     |
| `backend/src/services/aggregator/pythonParserService.ts`           | Confirmar que `banner_url` chega ao objeto enriquecido retornado ao backend                             | Parser e schema prontos            | Baixo | `enrichedFields.banner_url` aparece no retorno do serviço                                                    |
| `backend/src/domain/aggregator/normalizeExporterPayload.ts`        | Garantir que `banner_url` não se perca no merge entre raw payload e `enrichedFields`                    | Serviço Python pronto              | Médio | `parsed_json` final mantém `banner_url` intacto                                                              |
| `backend/src/domain/aggregator/parseExporterMessage.ts`            | Garantir que o campo final de banner do candidato usa `banner_url` enriquecido como prioridade          | Normalização pronta                | Médio | O candidato final tem um campo claro de banner pronto para o frontend                                        |
| `frontend/src/utils/candidateToFormData.ts`                        | Mapear `banner_url` para o campo real do formulário                                                     | Candidato final com banner         | Médio | O form abre com banner preenchido automaticamente                                                            |
| componente do formulário da mesa                                   | Atualizar preview do banner quando o `formPatch` trouxer imagem                                         | `candidateToFormData.ts` pronto    | Baixo | O preview visual muda automaticamente após importar o candidato                                              |
| `backend/src/routes/gmPanel.ts`                                    | Verificar qual campo a rota manual aceita, `banner_url`, `cover_url` ou outro, e alinhar com o frontend | Payload do form + contrato da rota | Alto  | Criação manual/importada aceita o banner sem 500 e sem perda                                                 |
| `backend/src/services/aggregator/candidateService.ts`              | Garantir persistência do banner ao aprovar candidato                                                    | Contrato da rota/serviço alinhado  | Médio | A mesa publicada salva o banner corretamente                                                                 |
| `backend/src/routes/tables.ts`                                     | Confirmar serialização do campo correto na API pública                                                  | Persistência pronta                | Baixo | API pública retorna a imagem correta para a página da mesa                                                   |
| `frontend/src/pages/MesaPage.tsx`                                  | Confirmar renderização do banner publicado                                                              | API pública pronta                 | Baixo | Banner importado aparece na página pública da mesa                                                           |
| `ERROS_SOLUTIONS.md`                                               | Registrar o bug do banner com causa raiz e solução                                                      | Diagnóstico confirmado             | Baixo | Bug documentado para não reaparecer por divergência de nome de campo                                         |

---

## Ponto crítico deste bug

A auditoria anterior já mencionava uma correção de `banner_url -> cover_url` em rota pública, mas isso não prova que o fluxo completo de criação/importação esteja consistente. 

Então este bug precisa validar **os 6 pontos**:

1. extração;
2. schema;
3. retorno do parser;
4. normalização;
5. mapeamento para formulário;
6. persistência e exibição pública.

---

## Teste manual ideal para esse bug

Usar uma mensagem real do JSON com attachment de imagem, como várias existentes no `teste.json`, e comparar:

* `attachments[0].url`
* `enrichedFields.banner_url`
* `parsed_json.banner_url`
* `formPatch.banner_url`
* payload enviado no submit
* valor salvo no banco
* valor retornado pela API pública. 

---

# BUG 3, descrição não vem completa

## Objetivo

Definir e corrigir a regra editorial de montagem da descrição longa da mesa, para que o sistema não puxe só um pedaço do anúncio.

## Hipótese central

O sistema está tratando `synopsis` como se fosse a descrição completa, quando o anúncio real muitas vezes tem:

* título;
* sinopse;
* regras;
* observações;
* diferenciais;
* instruções de inscrição;
* benefícios.

No JSON real, isso é comum. Há anúncios grandes com blocos de “Sinopse”, “Regras/Observações”, “Benefícios”, “Sobre o Mestre”, “Instruções” e links externos. 

---

## Backlog por arquivo

| Arquivo                                                            | Tarefa                                                                                                        | Dependência                      | Risco | Critério de aceite                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Auditar o que hoje é extraído como `synopsis` e o que fica fora dela                                          | JSON real longo                  | Médio | Existe um mapa claro do que o parser captura e do que ignora                             |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Separar melhor campos longos: `synopsis`, `rules`, `observations`, `benefits`, `signupText`                   | Auditoria do parser              | Alto  | O parser não mistura inscrição com descrição e não corta blocos importantes              |
| `backend/src/services/aggregator/parser/schemas.py`                | Garantir que existam campos suficientes para descrição editorial longa, ou ao menos compatibilidade para eles | Parser ajustado                  | Médio | O schema suporta a separação dos blocos textuais                                         |
| `backend/src/domain/aggregator/normalizeExporterPayload.ts`        | Preservar os blocos textuais longos sem truncar                                                               | Parser ajustado                  | Médio | O `parsed_json` final mantém texto longo íntegro                                         |
| `backend/src/domain/aggregator/parseExporterMessage.ts`            | Definir regra de composição de `description` final do candidato                                               | Normalização pronta              | Alto  | O candidato final entrega uma descrição útil e completa, sem inscrição ou lixo misturado |
| `frontend/src/utils/candidateToFormData.ts`                        | Mapear corretamente `description`, `rules/observations` e `signupText` para campos separados do formulário    | Candidato final consistente      | Alto  | O form abre com descrição longa coerente e campos acessórios separados                   |
| componente do formulário da mesa                                   | Garantir que área de descrição receba texto completo e não uma versão curta                                   | `candidateToFormData.ts` pronto  | Médio | Texto longo aparece íntegro na revisão                                                   |
| `backend/src/routes/gmPanel.ts`                                    | Confirmar persistência da descrição longa sem truncamento indevido                                            | Payload do form validado         | Alto  | `POST /api/v1/gm/tables` salva a descrição completa                                      |
| `backend/src/services/aggregator/candidateService.ts`              | Garantir persistência da descrição revisada ao aprovar candidato                                              | Fluxo de aprovação com overrides | Médio | A descrição aprovada é a que vai para a mesa final                                       |
| `backend/src/routes/tables.ts`                                     | Confirmar que a API pública devolve a descrição longa correta                                                 | Persistência pronta              | Baixo | O payload público retorna a descrição correta                                            |
| `frontend/src/pages/MesaPage.tsx`                                  | Validar renderização do texto completo da mesa                                                                | API pública pronta               | Baixo | A página pública mostra a descrição completa, sem resumir indevidamente                  |
| `ERROS_SOLUTIONS.md`                                               | Registrar o bug de descrição incompleta com regra de correção                                                 | Diagnóstico confirmado           | Baixo | O projeto passa a ter memória da regra correta de composição textual                     |

---

## Decisão funcional obrigatória para esse bug

O projeto precisa fixar esta regra:

* `synopsis` não é automaticamente igual a `description` final;
* `description` final deve ser montada a partir dos blocos mais relevantes do anúncio;
* `signupText` não deve ser colado no meio da descrição;
* `rules/observations` devem ir para o campo próprio;
* benefícios/diferenciais devem ir para o campo apropriado, ou ficar fora da descrição se o produto assim exigir.

Sem essa decisão, o sistema vai continuar “puxando descrição errada” mesmo com parser melhor.

---

## Teste manual ideal para esse bug

Usar um anúncio grande do JSON real que tenha:

* sinopse;
* observações;
* benefícios;
* instruções de inscrição.

Comparar:

1. texto cru da mensagem;
2. `synopsis` extraída;
3. `description` no `formPatch`;
4. payload enviado no submit;
5. descrição salva no banco;
6. descrição devolvida na API pública;
7. descrição renderizada na página da mesa.

---

# Bugs correlatos que precisam ser fechados junto

Esses não são os 3 bugs novos, mas continuam afetando o mesmo fluxo e devem entrar no mesmo ciclo técnico.

| Arquivo                                                            | Tarefa                                                     | Dependência                   | Risco | Critério de aceite                                                      |
| ------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------- | ----- | ----------------------------------------------------------------------- |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Implementar `extract_requires_pc()` que ainda está ausente | Nenhuma                       | Baixo | `requires_pc` passa a ser extraído de mensagens com “Necessário ter PC” |
| `frontend/src/utils/candidateToFormData.ts`                        | Mapear `is_ongoing` no formulário de revisão               | parser já extrai `is_ongoing` | Baixo | Campo “mesa em andamento” abre já marcado quando apropriado             |
| UI do formulário                                                   | Exibir de forma mais clara campos auto preenchidos         | formPatch estável             | Médio | O admin entende o que veio do parser e o que foi editado manualmente    |

A própria validação anterior já tinha apontado `requires_pc` ausente no parser e `is_ongoing` não mapeado no frontend. 

---

# Atualizações documentais necessárias

## `TODO_OPERACIONAL.md`

Adicionar ou atualizar itens para:

* correção do erro 500 em `gm/tables`;
* alinhamento de contrato banner/cover;
* regra de composição de descrição editorial importada;
* fechamento do fluxo importado ponta a ponta;
* validação beta obrigatória antes de marcar concluído.

## `FILA_IMPLEMENTACAO.md`

Abrir ou atualizar itens técnicos por ordem:

1. diagnóstico do 500
2. correção do contrato da rota
3. correção de banner
4. correção da descrição
5. fechamento de `requires_pc`
6. fechamento de `is_ongoing`
7. validação ponta a ponta em beta

## `RESUMO_EXECUCAO.md`

A próxima ação única deve ser:

* **diagnosticar e corrigir o 500 do `POST /api/v1/gm/tables`**, porque ele bloqueia a validação dos demais ajustes.

## `ERROS_SOLUTIONS.md`

Registrar:

* erro 500 na criação manual/importada da mesa;
* banner não persistido ou não mapeado;
* descrição incompleta no fluxo importado;
* divergência entre `banner_url` e `cover_url`, se confirmada.

---

# O que eu preciso que você traga, se quiser acelerar a análise

O melhor pacote de evidência possível seria este:

### 1. Um payload real enviado pelo frontend

No DevTools, aba Network, na requisição que dá 500:

* Request Payload ou Form Data completo.

### 2. A resposta do backend

Mesmo que seja 500:

* Response body completo;
* headers, se tiver mensagem útil.

### 3. Um exemplo de candidato importado

De preferência com:

* descrição longa;
* banner em attachment;
* preço;
* canal de recrutamento.

### 4. Logs do backend no momento do 500

Especialmente da rota `POST /api/v1/gm/tables`.

### 5. Se puder buscar na VM

Esses pontos são os mais úteis:

* o arquivo da rota de criação de mesa;
* os logs do backend;
* o payload salvo do candidato antes da aprovação.

---

# Critério final de aceite deste ciclo

Esse conjunto só pode ser considerado fechado quando:

1. `POST /api/v1/gm/tables` não retorna mais 500
2. o banner entra automaticamente no formulário
3. a descrição longa chega completa ao formulário
4. a descrição salva no banco continua completa
5. a página pública exibe a descrição e o banner corretamente
6. `requires_pc` é extraído de fato
7. `is_ongoing` é mapeado e editável
8. tudo isso é validado com um JSON real do Discord

Se você me mandar o **payload da requisição que está dando 500** e, se possível, o **response body** dela, eu consigo te devolver um diagnóstico muito mais fechado do problema da rota.
