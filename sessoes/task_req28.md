# Task: REQ-28 - Importação Inteligente de JSON

## Fase 1: Parser Python Expandido [x]

### Parser Python - discord_message_parser.py
- [x] Adicionar função `extract_banner_url()` - primeiro attachment de imagem
- [x] Adicionar função `extract_avatar_url()` - author.avatarUrl
- [x] Adicionar função `extract_external_links()` - array de URLs
- [x] Adicionar função `extract_is_paid()` - boolean
- [x] Adicionar função `extract_price_text()` - string com valor
- [x] Adicionar função `extract_signup_text()` - texto de inscrição
- [x] Adicionar função `extract_requires_pc()` - boolean
- [x] Adicionar função `extract_requires_camera()` - boolean
- [x] Adicionar função `extract_requires_microphone()` - boolean
- [x] Adicionar função `extract_is_ongoing()` - boolean
- [x] Adicionar função `extract_review_flags()` - array de avisos
- [x] Integrar 11 funções no `parse_message()` principal
- [x] Adicionar regra: preço → `is_paid = true`
- [x] Adicionar regra: "grátis"/"gratuita" → tratar sem contradição
- [x] Adicionar regra: embed de formulário → `external_links`
- [x] Adicionar regra: WhatsApp no texto → extrair como contato
- [x] Adicionar regra: Discord implícito → preparar recrutamento default

### Schemas Pydantic - schemas.py
- [x] Adicionar `banner_url: Optional[str]` ao ParsedMessage
- [x] Adicionar `avatar_url: Optional[str]` ao ParsedMessage
- [x] Adicionar `external_links: List[str]` ao ParsedMessage
- [x] Adicionar `is_paid: Optional[bool]` ao ParsedMessage
- [x] Adicionar `priceText: Optional[str]` ao ParsedMessage
- [x] Adicionar `signupText: Optional[str]` ao ParsedMessage
- [x] Adicionar `requires_pc: Optional[bool]` ao ParsedMessage
- [x] Adicionar `requires_camera: Optional[bool]` ao ParsedMessage
- [x] Adicionar `requires_microphone: Optional[bool]` ao ParsedMessage
- [x] Adicionar `is_ongoing: Optional[bool]` ao ParsedMessage
- [x] Adicionar `reviewFlags: List[str]` ao ParsedMessage

### TypeScript Interface - pythonParserService.ts
- [x] Atualizar `ParsedMessageResult` com 11 novos campos
- [x] Adicionar logs de comando executado
- [x] Adicionar logs de sucesso/erro
- [x] Adicionar log de tempo de execução
- [x] Adicionar fallback claro quando Python falhar

### Validação Fase 1
- [x] Testar parser com JSON completo
- [x] Testar parser com attachments vazios
- [x] Testar parser com embeds vazios
- [x] Validar casos pagos preenchem `is_paid` e `priceText`
- [x] Validar casos com imagem preenchem `banner_url`
- [x] Validar casos com formulário preenchem `external_links`

## Fase 2: Normalização Backend [x]

- [x] Inverter prioridade no merge: `{ ...rawPayload, ...enrichedFields }`
- [x] Adicionar log: `[normalizeExporterPayload] enrichedFields`
- [x] Adicionar log: `[normalizeExporterPayload] merged`
- [x] Preservar `attachments`, `embeds`, `mentions`, `author`
- [x] Logar quais campos vieram do parser
- [x] Logar quais campos ficaram vazios
- [x] Validar `parsed_json` contém todos os campos do parser

## Fase 3: Parsing de Domínio [x]

- [x] Priorizar `enrichedFields` em todos os campos
- [x] Manter fallback regex apenas quando campo ausente
- [x] Não sobrescrever `setting_name` e `setting_styles`
- [x] Separar `masterText` e `recruiterName`
- [x] Determinar `is_paid` e `billing_text`
- [x] Determinar `is_ongoing`
- [x] Determinar `candidate_kind`
- [x] Determinar `recruitment_channels` preliminares
- [x] Determinar `requirements` preliminares
- [x] Validar candidato sai com dados suficientes

## Fase 4: Auto-preenchimento [ ]

- [ ] Mapear `system_path_slug` → sistema pré-selecionado
- [ ] Mapear `is_paid` → cobrança marcada
- [ ] Mapear `priceText` → valor preenchido
- [ ] Mapear origem Discord → canal Discord automático
- [ ] Mapear `external_links` → formulários adicionados
- [ ] Mapear `signupText` → WhatsApp extraído
- [ ] Mapear `banner_url` → banner importado
- [ ] Mapear `avatar_url` → avatar do autor (visual only)
- [ ] Mapear `requires_pc/camera/microphone` → requisitos marcados
- [ ] Mapear `is_ongoing` → mesa em andamento marcada
- [ ] Mapear `setting_name`, `setting_styles` → cenário/estilos preenchidos
- [ ] Mapear `sessions[]` → agenda aproveitada
- [ ] Validar formulário abre com todos os campos preenchidos

## Fase 5: Abertura de Blocos [ ]

- [ ] Abrir bloco de valor quando `is_paid=true`
- [ ] Abrir preview de banner quando `banner_url` existir
- [ ] Abrir canais de recrutamento quando detectados
- [ ] Abrir requisitos técnicos quando marcados
- [ ] Abrir checkbox de mesa em andamento
- [ ] Abrir bloco de cenário e estilos quando preenchidos
- [ ] Abrir repetidor de agenda quando disponível
- [ ] Validar blocos relevantes abertos por padrão

## Fase 6: Persistência com Overrides [ ]

- [ ] Modificar endpoint accept para aceitar body opcional
- [ ] Validar apenas campos conhecidos (whitelist)
- [ ] Sanitizar arrays e strings
- [ ] Passar overrides para `candidateService.acceptCandidate()`
- [ ] Implementar merge: `{ ...candidate.parsed_json, ...overrides }`
- [ ] Ler `setting_name`, `setting_styles`, `banner_url`
- [ ] Ler `billing_text`, `publisher_role`, `master_display_name`
- [ ] Ler canais de recrutamento, requisitos, status de andamento
- [ ] Adicionar campos ao INSERT de `tables`
- [ ] Validar persistência com query no banco

## Fase 7: Página Pública [ ]

- [ ] Renderizar cenário e estilos
- [ ] Renderizar banner
- [ ] Renderizar requisitos técnicos
- [ ] Renderizar status de andamento
- [ ] Renderizar canais de recrutamento
- [ ] Validar mesa importada indistinguível de mesa manual

## Fase 8: Testes E2E [ ]

- [ ] Criar teste: importar JSON com todos os campos
- [ ] Validar: parser extrai dados
- [ ] Validar: normalização preserva campos
- [ ] Validar: formulário pré-preenchido
- [ ] Validar: blocos abertos automaticamente
- [ ] Validar: admin edita campo
- [ ] Validar: aprovação persiste override
- [ ] Validar: mesa publicada exibe todos os dados
- [ ] Teste passa sem erros

## Progresso Geral

- Fase 1: 0/36 ⏳
- Fase 2: 0/7
- Fase 3: 0/10
- Fase 4: 0/13
- Fase 5: 0/8
- Fase 6: 0/10
- Fase 7: 0/6
- Fase 8: 0/9

**Total: 0/99 tarefas concluídas**
