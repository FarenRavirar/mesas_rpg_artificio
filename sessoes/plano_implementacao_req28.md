# Implementação Completa: REQ-28 - Importação Inteligente de JSON

## Objetivo

Implementar o fluxo completo de importação inteligente de anúncios do Discord, transformando JSON bruto em mesas publicáveis com mínima intervenção manual. O sistema deve auto-preencher formulários, abrir blocos automaticamente, aceitar edições do admin e persistir dados revisados até a tabela final.

## Contexto Atual

**Backend Fase 1 (Concluído em 05/04/2026):**
- Parser Python extrai `setting_name` e `setting_styles`
- Schemas Pydantic/TypeScript atualizados
- `candidateService` persiste em `tables`
- 5/5 testes passando

**Problema identificado:**
A quebra está na integração entre parser, normalização, mapeamento para formulário e persistência final. O parser extrai dados ricos, mas eles se perdem nas camadas intermediárias.

## Fases de Implementação

### Fase 1: Parser Python Expandido (Itens 127-128)

**Objetivo:** Extrair todos os campos necessários para auto-preenchimento completo.

**Arquivos:**
- `backend/src/services/aggregator/parser/discord_message_parser.py`
- `backend/src/services/aggregator/parser/schemas.py`
- `backend/src/services/aggregator/pythonParserService.ts`

**Campos a adicionar:**
1. `banner_url` - primeiro attachment de imagem
2. `avatar_url` - author.avatarUrl
3. `external_links` - array de URLs (formulários, sites)
4. `is_paid` - boolean
5. `priceText` - string com valor
6. `signupText` - texto de inscrição/recrutamento
7. `requires_pc` - boolean
8. `requires_camera` - boolean
9. `requires_microphone` - boolean
10. `is_ongoing` - boolean (mesa em andamento)
11. `reviewFlags` - array de avisos para revisão

**Regras de extração:**
- Se encontrar preço → `is_paid = true`
- Se encontrar "grátis"/"gratuita" → tratar sem contradição
- Embed de formulário → `external_links`
- WhatsApp no texto → extrair como contato
- Discord implícito → preparar dado para recrutamento default
- Não inferir cenário a partir do sistema
- Não inferir estilos por semântica solta
- Se não houver dado claro → deixar vazio

**Validação:**
- Parser devolve JSON estável
- Não quebra com attachments/embeds vazios
- Casos pagos preenchem `is_paid` e `priceText`
- Casos com imagem preenchem `banner_url`
- Casos com formulário preenchem `external_links`

### Fase 2: Normalização Backend (Item 129)

**Objetivo:** Garantir que `enrichedFields` do parser sejam preservados sem perda silenciosa.

**Arquivo:**
- `backend/src/domain/aggregator/normalizeExporterPayload.ts`

**Mudanças:**
1. Inverter prioridade no merge: `{ ...rawPayload, ...enrichedFields }` (enrichedFields por último)
2. Adicionar logs explícitos:
   - `console.log('[normalizeExporterPayload] enrichedFields:', enrichedFields)`
   - `console.log('[normalizeExporterPayload] merged:', merged)`
3. Preservar `attachments`, `embeds`, `mentions`, `author` e todos os campos enriquecidos
4. Logar quais campos vieram do parser e quais ficaram vazios

**Validação:**
- `parsed_json` final contém todos os campos do parser
- Logs mostram origem de cada campo
- Nenhum campo do parser é sobrescrito por fallback TypeScript

### Fase 3: Parsing de Domínio (Item 130)

**Objetivo:** Priorizar `enrichedFields` na camada de domínio.

**Arquivo:**
- `backend/src/domain/aggregator/parseExporterMessage.ts`

**Mudanças:**
1. Priorizar `enrichedFields` em todos os campos que existirem
2. Manter fallback regex apenas quando campo estiver ausente
3. Não sobrescrever `setting_name` e `setting_styles` do parser
4. Separar `masterText` e `recruiterName`
5. Determinar `is_paid`, `billing_text`, `is_ongoing`, `candidate_kind`
6. Determinar `recruitment_channels` preliminares
7. Determinar `requirements` preliminares

**Validação:**
- TypeScript não ignora mais o Python
- Candidato sai com dados suficientes para revisão
- Logs mostram priorização de enrichedFields

### Fase 4: Auto-preenchimento de Formulário (Item 131)

**Objetivo:** Mapear todos os campos do parser para o formulário de revisão.

**Arquivo:**
- `frontend/src/utils/candidateToFormData.ts`

**Mapeamentos:**
1. Sistema pré-selecionado via `system_path_slug`
2. Cobrança marcada quando `is_paid=true`
3. Valor preenchido via `priceText`
4. Canal Discord criado automaticamente quando origem for Discord
5. Formulário/WhatsApp adicionados quando detectados em `external_links`/`signupText`
6. Banner importado via `banner_url`
7. Avatar do autor via `avatar_url` (visual only, não persiste)
8. Requisitos técnicos marcados (`requires_pc/camera/microphone`)
9. Mesa em andamento marcada (`is_ongoing`)
10. Cenário e estilos preenchidos (`setting_name`, `setting_styles`)
11. Agenda aproveitada (texto bruto ou estruturada via `sessions[]`)

**Validação:**
- Formulário abre com todos os campos preenchidos
- Sistema correto pré-selecionado
- Banner mostra preview
- Canais de recrutamento aparecem
- Requisitos técnicos marcados

### Fase 5: Abertura Automática de Blocos (Item 132)

**Objetivo:** UX inteligente que expande blocos relevantes automaticamente.

**Arquivos:**
- `frontend/src/pages/GestaoPage.tsx`
- `frontend/src/pages/PainelMestrePage.tsx`

**Blocos a abrir automaticamente:**
1. Bloco de valor quando `is_paid=true`
2. Preview de banner quando `banner_url` existir
3. Canais de recrutamento quando detectados
4. Requisitos técnicos quando marcados
5. Checkbox de mesa em andamento
6. Bloco de cenário e estilos quando preenchidos
7. Repetidor de agenda (se suportado) ou texto bruto

**Validação:**
- Blocos relevantes abertos por padrão
- Admin pode editar qualquer campo
- Sistema não exige redigitação do que já estava no JSON

### Fase 6: Persistência com Overrides (Itens 133-134)

**Objetivo:** Aceitar edições do admin e persistir dados revisados.

**Arquivos:**
- `backend/src/routes/aggregatorReview.ts`
- `backend/src/services/aggregator/candidateService.ts`

**Mudanças no endpoint:**
1. Modificar `PATCH /api/v1/aggregator/candidates/:id/accept` para aceitar body opcional
2. Validar apenas campos conhecidos (whitelist)
3. Sanitizar arrays e strings
4. Passar overrides para `candidateService.acceptCandidate(candidateId, overrides)`

**Mudanças no service:**
1. Merge de overrides com `parsed_json`: `const finalData = { ...candidate.parsed_json, ...overrides }`
2. Ler `setting_name`, `setting_styles`, `banner_url`, `billing_text`, `publisher_role`, `master_display_name`
3. Ler canais de recrutamento, requisitos técnicos, status de andamento
4. Adicionar campos ao INSERT de `tables`
5. Validar persistência com query direta no banco

**Validação:**
- Endpoint aceita payload com edições
- Dados revisados são persistidos
- Query no banco confirma persistência
- Cenário/estilos/banner/cobrança/recrutamento/requisitos chegam até `tables`

### Fase 7: Página Pública (Item 135)

**Objetivo:** Mesa importada indistinguível de mesa manual.

**Arquivo:**
- `frontend/src/pages/MesaPage.tsx`

**Campos a renderizar:**
1. Cenário e estilos
2. Banner
3. Requisitos técnicos
4. Status de andamento
5. Canais de recrutamento

**Validação:**
- Mesa importada tem mesma qualidade visual de mesa manual
- Todos os campos aparecem corretamente
- Nenhum campo vazio que deveria estar preenchido

### Fase 8: Testes E2E (Item 136)

**Objetivo:** Validar fluxo completo sem perda de dados.

**Arquivo:**
- `backend/tests/e2e/importacao-inteligente.test.ts`

**Cenário de teste:**
1. Importar JSON com todos os campos
2. Parser extrai dados
3. Normalização preserva campos
4. Formulário de revisão pré-preenchido
5. Blocos abertos automaticamente
6. Admin edita campo
7. Aprovação persiste override
8. Mesa publicada exibe todos os dados

**Validação:**
- Teste passa sem erros
- Nenhuma perda de dados em nenhuma camada
- Logs confirmam fluxo correto

## Ordem de Execução

1. **Fase 1:** Parser Python (127-128) - 2h estimadas
2. **Fase 2:** Normalização (129) - 1h estimada
3. **Fase 3:** Parsing de domínio (130) - 1h estimada
4. **Fase 4:** Auto-preenchimento (131) - 2h estimadas
5. **Fase 5:** Abertura de blocos (132) - 1h estimada
6. **Fase 6:** Persistência (133-134) - 2h estimadas
7. **Fase 7:** Página pública (135) - 1h estimada
8. **Fase 8:** Testes E2E (136) - 1h estimada

**Total estimado:** 11 horas

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Parser Python não roda em beta (E109) | Alto | Dockerfile já corrigido, rebuild necessário |
| enrichedFields ignorados (E122) | Alto | Logs explícitos em cada camada |
| Sistema não pré-selecionado (E123) | Médio | Validar `system_path_slug` existe no banco |
| Banner não importado (E124) | Médio | Preview visual para validação |
| Cenário/estilos perdidos (E125) | Alto | Query no banco após cada aprovação |
| Endpoint rejeita overrides (E126) | Alto | Validação whitelist, não rejeitar body |

## Critério de Sucesso

- [ ] Parser extrai 11 novos campos sem erros
- [ ] Normalização preserva 100% dos campos do parser
- [ ] Formulário abre com todos os campos preenchidos
- [ ] Blocos relevantes abertos automaticamente
- [ ] Admin pode editar e aprovar com overrides
- [ ] Dados revisados persistem até `tables`
- [ ] Mesa publicada indistinguível de mesa manual
- [ ] Teste E2E passa sem erros
- [ ] Nenhum erro E122-E126 ocorre em produção

## Rollback

Se qualquer fase falhar:
1. Reverter commits da fase
2. Marcar itens como `pendente` na fila
3. Documentar erro em `ERRORS_SOLUTIONS.md`
4. Não fazer deploy até correção

## Próxima Ação

Após aprovação deste plano, começar pela Fase 1: expandir parser Python com 11 novos campos.
