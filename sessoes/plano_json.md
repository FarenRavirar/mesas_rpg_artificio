Segue o checklist técnico por arquivo, já organizado para implementação real do fluxo de importação inteligente.

A base deste checklist parte de três fatos já auditados:

* o parser externo já foi pensado para devolver campos ricos como `banner_url`, `avatar_url`, `priceText`, `signupText`, `external_links` e demais dados do anúncio 
* o JSON real já traz attachments, embeds, avatar do autor, links externos, preço, vagas, horários e texto suficiente para auto preenchimento útil 
* a quebra atual está na integração entre parser, contrato intermediário, mapeamento para formulário e persistência final, exatamente como já foi identificado para cenário e estilos 

## 1. Parser Python

### `backend/src/services/aggregator/parser/discord_message_parser.py`

**Objetivo**
Extrair o máximo de dados úteis do anúncio do Discord e devolver em formato pronto para o backend normalizar.

**Checklist**

* [ ] Garantir extração de `title`
* [ ] Garantir extração de `system`
* [ ] Garantir extração de `scheduleText`
* [ ] Garantir extração de `slotsText`
* [ ] Garantir extração de `platforms`
* [ ] Garantir extração de `ageRating`
* [ ] Garantir extração de `priceText`
* [ ] Garantir extração de `is_paid`
* [ ] Garantir extração de `synopsis`
* [ ] Garantir extração de `signupText`
* [ ] Garantir extração de `external_links`
* [ ] Garantir extração de `banner_url` pelo primeiro attachment de imagem
* [ ] Garantir extração de `avatar_url` via `author.avatarUrl`
* [ ] Garantir extração de `recruiterName` via `author.nickname` com fallback para `author.name`
* [ ] Garantir separação entre `masterText` e `recruiterName`
* [ ] Adicionar `setting_name`
* [ ] Trocar extração de `style` de string única para lista saneada
* [ ] Adicionar `setting_styles` como array
* [ ] Adicionar `requires_pc`
* [ ] Adicionar `requires_microphone`
* [ ] Adicionar `requires_camera`
* [ ] Adicionar `is_ongoing`
* [ ] Adicionar `candidate_kind`, pelo menos `table`, `group`, `invalid`
* [ ] Adicionar score de confiança por campo
* [ ] Adicionar `reviewFlags`

**Regras específicas**

* [ ] Se encontrar preço, marcar `is_paid = true`
* [ ] Se encontrar “grátis”, “gratuita”, “sessão zero gratuita”, tratar sem contradição
* [ ] Se houver embed de formulário, jogar em `external_links`
* [ ] Se houver WhatsApp no texto, extrair como contato
* [ ] Se houver Discord implícito pela origem do JSON, preparar dado para recrutamento default
* [ ] Não inferir cenário a partir do sistema
* [ ] Não inferir estilos por semântica solta
* [ ] Se não houver dado claro, deixar vazio

**Critério de pronto**

* [ ] O parser devolve JSON estável
* [ ] Não quebra quando attachments estiverem vazios
* [ ] Não quebra quando embeds estiverem vazios
* [ ] Casos pagos preenchem `is_paid` e `priceText`
* [ ] Casos com imagem preenchem `banner_url`
* [ ] Casos com formulário preenchem `external_links`

---

### `backend/src/services/aggregator/parser/schemas.py`

**Objetivo**
Validar a saída do parser e impedir shape inconsistente.

**Checklist**

* [ ] Adicionar `setting_name: Optional[str]`
* [ ] Adicionar `setting_styles: List[str]`
* [ ] Adicionar `banner_url: Optional[str]`
* [ ] Adicionar `avatar_url: Optional[str]`
* [ ] Adicionar `external_links: List[...]`
* [ ] Adicionar `is_paid: Optional[bool]`
* [ ] Adicionar `requires_pc: Optional[bool]`
* [ ] Adicionar `requires_camera: Optional[bool]`
* [ ] Adicionar `requires_microphone: Optional[bool]`
* [ ] Adicionar `is_ongoing: Optional[bool]`
* [ ] Adicionar `reviewFlags`
* [ ] Adicionar `confidence` por campo ou bloco

**Critério de pronto**

* [ ] O schema aceita a nova saída do parser
* [ ] Campos opcionais não quebram mensagens incompletas
* [ ] `setting_styles` nunca sai como string

---

## 2. Backend de integração do parser

### `backend/src/services/aggregator/pythonParserService.ts`

**Objetivo**
Executar o parser Python, capturar saída, logar falhas e devolver dados enriquecidos ao backend.

**Checklist**

* [ ] Atualizar a interface `ParsedMessageResult`
* [ ] Incluir `setting_name`
* [ ] Incluir `setting_styles`
* [ ] Incluir `banner_url`
* [ ] Incluir `avatar_url`
* [ ] Incluir `external_links`
* [ ] Incluir `is_paid`
* [ ] Incluir `requires_pc`
* [ ] Incluir `requires_camera`
* [ ] Incluir `requires_microphone`
* [ ] Incluir `is_ongoing`
* [ ] Incluir `reviewFlags`
* [ ] Incluir `candidate_kind`
* [ ] Adicionar log de comando executado
* [ ] Adicionar log de sucesso
* [ ] Adicionar log de erro
* [ ] Adicionar log do tempo de execução
* [ ] Adicionar fallback claro quando Python falhar
* [ ] Não engolir erro silenciosamente

**Critério de pronto**

* [ ] Dá para ver em log quando o Python rodou
* [ ] Dá para ver em log quando caiu no fallback
* [ ] O serviço devolve o objeto enriquecido completo

---

### `backend/src/domain/aggregator/normalizeExporterPayload.ts`

**Objetivo**
Unificar o payload cru do DiscordChatExporter com a saída do parser Python.

**Checklist**

* [ ] Garantir merge entre raw message e `enrichedFields`
* [ ] Priorizar `enrichedFields` quando existirem
* [ ] Preservar `attachments`, `embeds`, `mentions` e `author`
* [ ] Preservar `banner_url`
* [ ] Preservar `avatar_url`
* [ ] Preservar `external_links`
* [ ] Preservar `setting_name`
* [ ] Preservar `setting_styles`
* [ ] Preservar `is_paid`
* [ ] Preservar `priceText`
* [ ] Preservar `reviewFlags`
* [ ] Adicionar logs de quais campos vieram do parser
* [ ] Adicionar logs de quais campos ficaram vazios

**Critério de pronto**

* [ ] `parsed_json` final contém tudo que o parser devolveu
* [ ] Não há perda silenciosa de campos

---

### `backend/src/domain/aggregator/parseExporterMessage.ts`

**Objetivo**
Interpretar o payload normalizado e gerar dados de domínio do candidato.

**Checklist**

* [ ] Priorizar `enrichedFields` em todos os campos que existirem
* [ ] Manter fallback regex apenas quando o campo estiver ausente
* [ ] Não sobrescrever `setting_name` e `setting_styles` do parser com parsing fraco
* [ ] Separar `masterText` e `recruiterName`
* [ ] Determinar `is_paid`
* [ ] Determinar `billing_text`
* [ ] Determinar `is_ongoing`
* [ ] Determinar `candidate_kind`
* [ ] Determinar `recruitment_channels` preliminares
* [ ] Determinar `requirements` preliminares

**Critério de pronto**

* [ ] O TS não ignora mais o Python
* [ ] O candidato sai com dados suficientes para revisão

---

## 3. Serviço de candidatos e persistência

### `backend/src/services/aggregator/candidateService.ts`

**Objetivo**
Criar a mesa final a partir do candidato aprovado, usando os dados revisados.

**Checklist**

* [ ] Ler `setting_name` de `parsed_json` ou override
* [ ] Ler `setting_styles` de `parsed_json` ou override
* [ ] Ler `banner_url` de `parsed_json` ou override
* [ ] Ler `avatar_url` de `parsed_json` ou override
* [ ] Ler `is_paid` e `priceText`
* [ ] Persistir `setting_name`
* [ ] Persistir `setting_styles`
* [ ] Persistir `banner_url`
* [ ] Persistir `billing_text` ou equivalente
* [ ] Persistir `publisher_role`
* [ ] Persistir `master_display_name`
* [ ] Persistir canais de recrutamento
* [ ] Persistir requisitos técnicos
* [ ] Persistir status de mesa em andamento
* [ ] Permitir overrides vindos do formulário de revisão
* [ ] Não depender mais apenas de `body` vazio no `accept()`

**Critério de pronto**

* [ ] Aprovar candidato salva cenário e estilos
* [ ] Aprovar candidato salva banner
* [ ] Aprovar candidato salva recrutamento
* [ ] Aprovar candidato respeita revisão manual

---

### `backend/src/routes/aggregator...` ou rota equivalente de aprovação

**Objetivo**
Receber a aprovação do candidato com payload revisado.

**Checklist**

* [ ] Alterar endpoint de accept para aceitar body opcional com overrides
* [ ] Validar campos recebidos
* [ ] Sanitizar arrays
* [ ] Sanitizar strings
* [ ] Rejeitar payload inválido
* [ ] Passar overrides para `candidateService.accept()`

**Critério de pronto**

* [ ] O frontend consegue aprovar com alterações sem perder o resto do candidato

---

## 4. Mapeamento para o formulário

### `frontend/src/utils/candidateToFormData.ts`

**Objetivo**
Converter o candidato importado em formulário já preenchido.

**Checklist**

* [ ] Adicionar `setting_name` em `CandidateFormData`
* [ ] Adicionar `setting_styles` em `CandidateFormData`
* [ ] Adicionar `banner_url`
* [ ] Adicionar `avatar_url`
* [ ] Adicionar `billing_mode`
* [ ] Adicionar `billing_text`
* [ ] Adicionar `publisher_role`
* [ ] Adicionar `master_display_name`
* [ ] Adicionar `recruitment_channels`
* [ ] Adicionar `requires_pc`
* [ ] Adicionar `requires_camera`
* [ ] Adicionar `requires_microphone`
* [ ] Adicionar `is_ongoing`
* [ ] Adicionar agenda estruturada, se já existir modelo
* [ ] Se ainda não existir agenda estruturada, ao menos preencher texto bruto da agenda
* [ ] Priorizar `enrichedFields`
* [ ] Fallback para parsing secundário só quando necessário

**Regras de preenchimento inteligente**

* [ ] Se `is_paid = true`, marcar cobrança como paga
* [ ] Se `priceText` existir, preencher campo de valor
* [ ] Se vier do Discord e não houver outro contato melhor, adicionar canal `Discord`
* [ ] Se houver Google Forms, adicionar canal `Formulário`
* [ ] Se houver WhatsApp, adicionar canal `WhatsApp`
* [ ] Se houver attachment de imagem, preencher banner
* [ ] Se houver `author.avatarUrl`, preencher avatar
* [ ] Se houver `requires_pc`, marcar requisito
* [ ] Se houver `setting_name`, preencher cenário
* [ ] Se houver `setting_styles`, preencher estilos

**Critério de pronto**

* [ ] Abrir revisão já com o máximo preenchido
* [ ] Não exigir redigitação do que já estava no JSON

---

## 5. Frontend de revisão e formulário

### `frontend/src/pages/GestaoPage.tsx` ou página equivalente de revisão

**Objetivo**
Exibir o candidato importado com preview e formulário editável.

**Checklist**

* [ ] Mostrar mensagem original
* [ ] Mostrar dados extraídos
* [ ] Mostrar formulário preenchido
* [ ] Mostrar `setting_name`
* [ ] Mostrar `setting_styles`
* [ ] Mostrar `banner_url` no preview
* [ ] Mostrar `avatar_url` no preview
* [ ] Mostrar canais de recrutamento sugeridos
* [ ] Mostrar badge visual para campo importado automaticamente
* [ ] Mostrar badge visual para campo revisável
* [ ] Permitir editar antes de aprovar
* [ ] Ao aprovar, enviar payload revisado

**Critério de pronto**

* [ ] O admin consegue revisar sem sair da tela
* [ ] O admin entende o que veio do parser e o que foi editado

---

### `frontend/src/components/SettingStylesField.tsx`

**Objetivo**
Receber cenário e estilos também no fluxo importado, não só no manual.

**Checklist**

* [ ] Garantir compatibilidade com dados vindos da importação
* [ ] Aceitar lista já preenchida
* [ ] Não limpar `setting_styles` ao renderizar
* [ ] Permitir editar `setting_name`
* [ ] Permitir remover ou adicionar estilos
* [ ] Lidar bem com array vazio

**Critério de pronto**

* [ ] Funciona igual no manual e no importado

---

### Componente ou página do formulário da mesa

**Objetivo**
Abrir e fechar blocos automaticamente com base no que o JSON trouxe.

**Checklist**

* [ ] Se `billing_mode = paga`, abrir bloco de valor
* [ ] Se `billing_text` existir, preencher valor automaticamente
* [ ] Se `banner_url` existir, atualizar preview do banner
* [ ] Se `avatar_url` existir, atualizar preview do mestre ou recrutador
* [ ] Se `recruitment_channels` existirem, renderizar linhas automaticamente
* [ ] Se `requires_pc = true`, marcar requisito
* [ ] Se `is_ongoing = true`, marcar checkbox
* [ ] Se houver múltiplas sessões, abrir repetidor de horários
* [ ] Se houver `setting_name` e `setting_styles`, preencher bloco de cenário e estilos

**Critério de pronto**

* [ ] O formulário reage ao payload importado
* [ ] O sistema deixa de parecer “burro” na revisão

---

## 6. Página pública e listagem

### `frontend/src/pages/MesaPage.tsx`

**Objetivo**
Exibir o que foi salvo pela importação da mesma forma que no fluxo manual.

**Checklist**

* [ ] Exibir `setting_name`
* [ ] Exibir `setting_styles`
* [ ] Exibir banner salvo
* [ ] Exibir canais de recrutamento
* [ ] Exibir cobrança com texto detalhado
* [ ] Exibir status em andamento, quando aplicável
* [ ] Exibir requisitos técnicos, quando existirem

**Critério de pronto**

* [ ] Uma mesa importada publicada fica indistinguível de uma mesa manual bem preenchida

---

### `frontend/src/...` listagem ou painel principal

**Objetivo**
Refletir no catálogo e no painel os campos importados que forem relevantes.

**Checklist**

* [ ] Mostrar banner correto
* [ ] Mostrar cenário, se existir
* [ ] Mostrar estilos, se existirem
* [ ] Mostrar selo gratuita ou paga corretamente
* [ ] Mostrar status em andamento, se aplicável

**Critério de pronto**

* [ ] Os campos persistidos aparecem também fora da página individual

---

## 7. Banco e tipos

### `backend/src/db/types.ts`

**Objetivo**
Garantir que o TypeScript conhece os campos persistidos e não os perde.

**Checklist**

* [ ] Confirmar `setting_name`
* [ ] Confirmar `setting_styles`
* [ ] Confirmar campo de valor detalhado, se existir
* [ ] Confirmar campos de recrutamento, se modelados em tabela separada
* [ ] Confirmar campos de requisitos, se já existirem
* [ ] Ajustar tipos de arrays quando necessário

**Critério de pronto**

* [ ] Nenhum campo novo fica “invisível” por tipo incompleto

---

### Migration ou schema do banco, se faltar algo

**Objetivo**
Garantir que a persistência suporte o que o formulário e a importação precisam.

**Checklist**

* [ ] Verificar se existe campo para valor detalhado
* [ ] Verificar se existe estrutura para múltiplos canais de recrutamento
* [ ] Verificar se existe estrutura para agenda estruturada
* [ ] Verificar se existe estrutura para requisitos técnicos
* [ ] Se faltar, abrir migration separada

**Critério de pronto**

* [ ] O schema não limita o auto preenchimento útil

---

## 8. Infra e deploy

### `backend/Dockerfile`

**Objetivo**
Garantir que o parser Python rode mesmo em beta ou produção.

**Checklist**

* [ ] Copiar scripts Python
* [ ] Garantir Python disponível
* [ ] Garantir bibliotecas necessárias disponíveis
* [ ] Garantir caminho correto do parser
* [ ] Garantir `PYTHON_CMD` configurável

**Critério de pronto**

* [ ] O parser roda dentro do container
* [ ] Não falha só no ambiente de deploy

---

### `.env` e configuração da app

**Objetivo**
Garantir execução previsível.

**Checklist**

* [ ] Definir `PYTHON_CMD`
* [ ] Definir path do parser, se necessário
* [ ] Adicionar flag de debug do parser, se útil
* [ ] Garantir logs habilitados no ambiente de beta

**Critério de pronto**

* [ ] Dá para saber rapidamente se o Python rodou ou não

---

## 9. Testes

### Parser

* [ ] Caso com mesa paga preenche cobrança e valor
* [ ] Caso com attachment preenche banner
* [ ] Caso com embed de forms preenche recrutamento
* [ ] Caso com WhatsApp no texto cria canal WhatsApp
* [ ] Caso com `Cenário:` preenche `setting_name`
* [ ] Caso com `Estilo:` preenche `setting_styles`
* [ ] Caso sem esses campos deixa vazio
* [ ] Caso com sistema próprio não inventa cenário

### Backend

* [ ] `parsed_json` preserva novos campos
* [ ] `candidateToFormData` recebe novos campos
* [ ] `accept()` persiste novos campos
* [ ] overrides da revisão funcionam

### Frontend

* [ ] formulário abre com banner preenchido
* [ ] formulário abre com cobrança preenchida
* [ ] formulário abre com recrutamento preenchido
* [ ] formulário abre com cenário e estilos preenchidos
* [ ] bloco de valor abre automaticamente quando pago
* [ ] preview do banner atualiza automaticamente

---

## 10. Ordem de execução recomendada

### Bloco 1

* [ ] `discord_message_parser.py`
* [ ] `schemas.py`
* [ ] `pythonParserService.ts`
* [ ] `normalizeExporterPayload.ts`
* [ ] `parseExporterMessage.ts`

### Bloco 2

* [ ] `candidateToFormData.ts`
* [ ] formulário de revisão
* [ ] preview da gestão

### Bloco 3

* [ ] `candidateService.ts`
* [ ] rota de aprovação com overrides
* [ ] persistência final

### Bloco 4

* [ ] página pública
* [ ] listagem/painel
* [ ] testes finais

Abaixo está o backlog executável em formato operacional, usando como base o que já foi auditado: o fluxo manual já persiste `setting_name` e `setting_styles`, mas o fluxo importado perde esses campos no parser, no contrato intermediário, no mapeamento para o formulário e na persistência final. Além disso, a arquitetura já prevê um domínio próprio `aggregator`, com rotas, services e exportação diária, e o parser já foi pensado para enriquecer campos como `banner_url`, `avatar_url`, `priceText`, `platforms` e `external_links`.    

## Fase 1, parser e contrato de importação

| Arquivo                                                            | Tarefa                                                                                                                                                  | Dependência                | Risco | Critério de aceite                                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Adicionar `extract_setting_name()`                                                                                                                      | Nenhuma                    | Médio | Parser retorna `setting_name` quando houver `Cenário:`, `Ambientação:`, `Setting:`, `Mundo:` ou menção textual forte de cenário conhecido |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Adicionar `extract_setting_styles()`                                                                                                                    | Nenhuma                    | Médio | Parser retorna `setting_styles` como array saneado, nunca como string única                                                               |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Trocar `extract_style()` legado para derivar de lista ou manter compatibilidade temporária                                                              | `extract_setting_styles()` | Médio | Campo legado `style` não quebra chamadas antigas e `setting_styles` passa a ser a fonte principal                                         |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Extrair `banner_url` pelo primeiro attachment de imagem                                                                                                 | Nenhuma                    | Baixo | Mensagens com attachment de imagem retornam `banner_url` preenchido, como previsto na especificação                                       |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Extrair `avatar_url` via `author.avatarUrl`                                                                                                             | Nenhuma                    | Baixo | Mensagens retornam `avatar_url` quando o autor tiver avatar, como já existe no JSON real                                                  |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Extrair `is_paid` e `priceText` com regex robusta                                                                                                       | Nenhuma                    | Médio | Mensagens pagas retornam `is_paid=true` e `priceText` preenchido                                                                          |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Extrair `external_links` de texto e `embeds[].url`                                                                                                      | Nenhuma                    | Médio | Links de forms, docs e sites entram em `external_links`, como ocorre no JSON real                                                         |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Extrair `signupText` e classificar canal principal de recrutamento                                                                                      | `external_links`           | Médio | Mensagens com “mandar DM”, formulário ou WhatsApp retornam `signupText` e pistas suficientes para canais sugeridos                        |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Extrair `requires_pc`, `requires_microphone`, `requires_camera`                                                                                         | Nenhuma                    | Baixo | Menções como “Necessário ter PC” ou “câmera obrigatória” geram booleans preenchidos                                                       |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Extrair `is_ongoing`                                                                                                                                    | Nenhuma                    | Baixo | Frases como “em andamento” ou “já tivemos a primeira sessão” marcam `is_ongoing=true`                                                     |
| `backend/src/services/aggregator/parser/discord_message_parser.py` | Adicionar `reviewFlags` por campo ambíguo                                                                                                               | Nenhuma                    | Médio | Saída do parser diferencia campo explícito, implícito e ausente                                                                           |
| `backend/src/services/aggregator/parser/schemas.py`                | Adicionar `setting_name` ao schema                                                                                                                      | Nenhuma                    | Baixo | Pydantic aceita `setting_name` sem erro                                                                                                   |
| `backend/src/services/aggregator/parser/schemas.py`                | Adicionar `setting_styles` como lista                                                                                                                   | Nenhuma                    | Baixo | Pydantic aceita `setting_styles` como `List[str]`, não string                                                                             |
| `backend/src/services/aggregator/parser/schemas.py`                | Adicionar `banner_url`, `avatar_url`, `external_links`, `is_paid`, `requires_pc`, `requires_microphone`, `requires_camera`, `is_ongoing`, `reviewFlags` | Nenhuma                    | Baixo | Schema cobre todo o objeto enriquecido relevante para auto preenchimento                                                                  |

## Fase 2, serviço Python e normalização backend

| Arquivo                                                     | Tarefa                                                                                                   | Dependência                     | Risco | Critério de aceite                                                                                  |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| `backend/src/services/aggregator/pythonParserService.ts`    | Atualizar interface `ParsedMessageResult` com novos campos                                               | Schema Python atualizado        | Baixo | Interface TS reflete a saída real do parser                                                         |
| `backend/src/services/aggregator/pythonParserService.ts`    | Adicionar logs de execução, erro, fallback e tempo do parser                                             | Nenhuma                         | Baixo | Logs mostram claramente quando o parser rodou e quando caiu no fallback                             |
| `backend/src/services/aggregator/pythonParserService.ts`    | Garantir que `enrichedFields` preserve todos os novos campos                                             | Interface atualizada            | Médio | `setting_name`, `setting_styles`, `banner_url`, `avatar_url`, `external_links` chegam ao backend TS |
| `backend/src/domain/aggregator/normalizeExporterPayload.ts` | Fazer merge entre raw payload e `enrichedFields` sem perder campos novos                                 | Parser TS atualizado            | Médio | `parsed_json` final contém cenário, estilos, banner, avatar, links, cobrança e flags                |
| `backend/src/domain/aggregator/normalizeExporterPayload.ts` | Adicionar logs de quais campos vieram do parser e quais ficaram vazios                                   | Nenhuma                         | Baixo | Em debug, dá para ver por que um campo foi preenchido ou não                                        |
| `backend/src/domain/aggregator/parseExporterMessage.ts`     | Priorizar `enrichedFields` sobre fallback regex em todos os campos                                       | `normalizeExporterPayload.ts`   | Médio | TS não ignora mais campos do parser, como já foi identificado na auditoria do fluxo importado       |
| `backend/src/domain/aggregator/parseExporterMessage.ts`     | Construir `recruitment_channels` preliminares a partir de Discord, formulário, WhatsApp e links externos | `external_links` e `signupText` | Médio | Candidato já sai com canais sugeridos de recrutamento                                               |
| `backend/src/domain/aggregator/parseExporterMessage.ts`     | Construir `billing_mode` e `billing_text` preliminares                                                   | `is_paid` e `priceText`         | Baixo | Mesas pagas já chegam com cobrança pronta para a revisão                                            |
| `backend/src/domain/aggregator/parseExporterMessage.ts`     | Construir `requirements` preliminares                                                                    | booleans de requisitos          | Baixo | Mesas com PC, câmera ou microfone obrigatório já chegam com esses campos marcados                   |

## Fase 3, mapeamento para o formulário de revisão

| Arquivo                                     | Tarefa                                                                                 | Dependência                     | Risco | Critério de aceite                                                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| `frontend/src/utils/candidateToFormData.ts` | Adicionar `setting_name` em `CandidateFormData`                                        | `parsed_json` com novo campo    | Baixo | Candidato importado abre com cenário preenchido quando houver                                                 |
| `frontend/src/utils/candidateToFormData.ts` | Adicionar `setting_styles` em `CandidateFormData`                                      | `parsed_json` com novo campo    | Baixo | Candidato importado abre com estilos preenchidos como array                                                   |
| `frontend/src/utils/candidateToFormData.ts` | Adicionar `banner_url` e `avatar_url`                                                  | parser e normalização prontos   | Baixo | Preview do banner e do avatar são preenchidos automaticamente                                                 |
| `frontend/src/utils/candidateToFormData.ts` | Adicionar `billing_mode` e `billing_text`                                              | `is_paid` e `priceText` prontos | Baixo | Se a mesa for paga, cobrança já vem marcada e o valor já aparece preenchido                                   |
| `frontend/src/utils/candidateToFormData.ts` | Adicionar `recruitment_channels`                                                       | canais preliminares prontos     | Médio | Importações do Discord já criam ao menos um canal `Discord`, e também formulário ou WhatsApp quando existirem |
| `frontend/src/utils/candidateToFormData.ts` | Adicionar `requires_pc`, `requires_microphone`, `requires_camera`, `is_ongoing`        | parser pronto                   | Baixo | Campos derivados abrem e marcam corretamente o formulário                                                     |
| `frontend/src/utils/candidateToFormData.ts` | Mapear agenda estruturada, ou texto bruto da agenda enquanto a UI completa não existir | `scheduleText` pronto           | Médio | Mensagem importada já abre com agenda aproveitada, sem exigir redigitação                                     |
| `frontend/src/utils/candidateToFormData.ts` | Priorizar `enrichedFields` sempre que existirem                                        | parser e normalização prontos   | Médio | Auto preenchimento passa a ser consistente com o que o parser devolveu, em vez de ignorá-lo                   |

## Fase 4, frontend da revisão e formulário

| Arquivo                                                   | Tarefa                                                           | Dependência                         | Risco | Critério de aceite                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------- | ----- | ----------------------------------------------------------------------------- |
| `frontend/src/pages/GestaoPage.tsx` ou página equivalente | Exibir `setting_name` e `setting_styles` no preview do candidato | `candidateToFormData.ts`            | Baixo | Cenário e estilos aparecem na revisão de candidato, não só no fluxo manual    |
| `frontend/src/pages/GestaoPage.tsx` ou página equivalente | Exibir preview do banner importado                               | `banner_url` no formPatch           | Baixo | Importação com attachment de imagem mostra banner automaticamente             |
| `frontend/src/pages/GestaoPage.tsx` ou página equivalente | Exibir preview do avatar do autor ou recrutador                  | `avatar_url` no formPatch           | Baixo | Importação mostra visualmente a imagem do publicador                          |
| `frontend/src/pages/GestaoPage.tsx` ou página equivalente | Exibir canais de recrutamento sugeridos                          | `recruitment_channels` no formPatch | Médio | Revisão mostra Discord, formulário ou WhatsApp já prontos quando forem óbvios |
| `frontend/src/pages/GestaoPage.tsx` ou página equivalente | Exibir badges de origem do campo, importado, inferido, manual    | `reviewFlags`                       | Médio | O admin entende o que veio do parser e o que ainda exige atenção              |
| `frontend/src/components/SettingStylesField.tsx`          | Garantir compatibilidade com dados importados                    | `candidateToFormData.ts`            | Baixo | O componente funciona igual em mesa manual e mesa importada                   |
| componente do formulário da mesa                          | Abrir automaticamente o bloco de valor se `billing_mode = paga`  | `billing_mode` no formPatch         | Baixo | Ao importar mesa paga, a parte do valor já fica liberada e preenchida         |
| componente do formulário da mesa                          | Atualizar preview do banner quando `banner_url` vier no import   | `banner_url` no formPatch           | Baixo | Banner importado já substitui o placeholder padrão                            |
| componente do formulário da mesa                          | Popular automaticamente canais de recrutamento                   | `recruitment_channels` no formPatch | Médio | Importação do Discord já cria linha de recrutamento pronta                    |
| componente do formulário da mesa                          | Marcar requisitos técnicos automaticamente                       | booleans no formPatch               | Baixo | PC, câmera e microfone aparecem marcados quando detectados                    |
| componente do formulário da mesa                          | Marcar “mesa em andamento” automaticamente                       | `is_ongoing` no formPatch           | Baixo | Anúncios em andamento já chegam com a flag marcada                            |

## Fase 5, aprovação com overrides e persistência final

| Arquivo                                                              | Tarefa                                                                    | Dependência                | Risco | Critério de aceite                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------- | ----- | -------------------------------------------------------------- |
| rota `PATCH /api/v1/aggregator/candidates/:id/accept` ou equivalente | Deixar de depender apenas de body vazio e aceitar overrides do formulário | frontend de revisão pronto | Médio | O accept recebe payload opcional com edição manual             |
| `backend/src/services/aggregator/candidateService.ts`                | Ler `setting_name` revisado ou do `parsed_json`                           | rota aceita overrides      | Médio | Aprovar candidato salva cenário na tabela `tables`             |
| `backend/src/services/aggregator/candidateService.ts`                | Ler `setting_styles` revisados ou do `parsed_json`                        | rota aceita overrides      | Médio | Aprovar candidato salva estilos na tabela `tables`             |
| `backend/src/services/aggregator/candidateService.ts`                | Persistir `banner_url`                                                    | `parsed_json` ou override  | Baixo | Banner importado é mantido na mesa publicada                   |
| `backend/src/services/aggregator/candidateService.ts`                | Persistir `billing_mode` e `billing_text`                                 | cobrança mapeada           | Médio | Mesas pagas ficam publicadas com valor correto                 |
| `backend/src/services/aggregator/candidateService.ts`                | Persistir `recruitment_channels`                                          | canais revisados prontos   | Médio | Recrutamento importado não se perde na publicação              |
| `backend/src/services/aggregator/candidateService.ts`                | Persistir requisitos técnicos e status em andamento                       | formPatch pronto           | Baixo | Mesa publicada reflete corretamente PC obrigatório e andamento |
| `backend/src/services/aggregator/candidateService.ts`                | Persistir `publisher_role` e `master_display_name`                        | parser e revisão prontos   | Médio | Diferenciação entre mestre e anunciante chega à mesa publicada |
| `backend/src/db/types.ts`                                            | Confirmar tipos novos ou faltantes para persistência final                | migration ou schema atual  | Baixo | Nenhum campo fica invisível por tipo incompleto                |

## Fase 6, página pública e listagem

| Arquivo                                      | Tarefa                                                       | Dependência         | Risco | Critério de aceite                                                                   |
| -------------------------------------------- | ------------------------------------------------------------ | ------------------- | ----- | ------------------------------------------------------------------------------------ |
| `frontend/src/pages/MesaPage.tsx`            | Exibir `setting_name`                                        | persistência pronta | Baixo | Mesa importada publicada mostra cenário como já ocorre no fluxo manual               |
| `frontend/src/pages/MesaPage.tsx`            | Exibir `setting_styles` como chips                           | persistência pronta | Baixo | Mesa importada publicada mostra estilos corretamente                                 |
| `frontend/src/pages/MesaPage.tsx`            | Exibir banner persistido                                     | persistência pronta | Baixo | Banner importado aparece na página pública                                           |
| `frontend/src/pages/MesaPage.tsx`            | Exibir cobrança detalhada                                    | persistência pronta | Baixo | Valor aparece corretamente para mesas pagas                                          |
| `frontend/src/pages/MesaPage.tsx`            | Exibir requisitos técnicos e status em andamento             | persistência pronta | Baixo | Mesa publicada reflete PC obrigatório e andamento                                    |
| `frontend/src/pages` de listagem ou catálogo | Exibir cenário, estilos e selo de cobrança quando relevantes | persistência pronta | Baixo | Catálogo e painel passam a refletir os campos importados, não só a página individual |

## Fase 7, infraestrutura, deploy e observabilidade

| Arquivo                                                     | Tarefa                                                                                       | Dependência          | Risco | Critério de aceite                                                             |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------- | ----- | ------------------------------------------------------------------------------ |
| `backend/Dockerfile`                                        | Garantir que o parser Python e dependências estejam na imagem                                | parser pronto        | Médio | Container executa o parser em beta e produção                                  |
| `.env` e configuração de runtime                            | Configurar `PYTHON_CMD` e flags de debug                                                     | Dockerfile correto   | Baixo | É possível confirmar por log que o parser rodou                                |
| `backend/src/services/aggregator/pythonParserService.ts`    | Logar entrada, saída e fallback                                                              | env e parser prontos | Baixo | Logs permitem diagnosticar auto preenchimento quebrado rapidamente             |
| `backend/src/domain/aggregator/normalizeExporterPayload.ts` | Logar campos importantes ausentes, sistema, banner, cobrança, recrutamento, cenário, estilos | normalização pronta  | Baixo | Diferença entre o que veio do JSON e o que chegou ao formulário fica auditável |

## Fase 8, testes obrigatórios

| Arquivo                          | Tarefa                                                                                        | Dependência                           | Risco | Critério de aceite                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------ |
| suíte de testes do parser Python | Cobrir caso com attachment, forms, WhatsApp, mesa paga, cenário explícito, estilos explícitos | parser pronto                         | Médio | Parser passa nos cenários reais mais importantes                                                       |
| testes de integração backend     | Cobrir raw → parser → `parsed_json` → `formPatch` → aprovação                                 | backend pronto                        | Médio | Fluxo importado funciona ponta a ponta                                                                 |
| testes do frontend de revisão    | Cobrir auto preenchimento do formulário                                                       | `candidateToFormData.ts` e UI prontos | Médio | Abrir candidato importado já mostra sistema, banner, cobrança, recrutamento, cenário e estilos         |
| validação manual com JSON real   | Usar `teste.json` e exportações reais com attachments e embeds                                | tudo acima                            | Médio | O sistema deixa de exigir redigitação do que já estava no JSON, inclusive banner, recrutamento e valor |

## Ordem de execução recomendada

1. Parser e schema Python
2. `pythonParserService.ts`
3. `normalizeExporterPayload.ts` e `parseExporterMessage.ts`
4. `candidateToFormData.ts`
5. UI de revisão e formulário com abertura automática de blocos
6. rota de accept com overrides
7. `candidateService.ts` e persistência final
8. página pública e catálogo
9. Docker, logs e testes

Se for útil, a próxima resposta pode converter esse backlog em um formato de sprint com IDs do tipo `AGG-001`, `AGG-002`, prioridade, estimativa e ordem de execução.

