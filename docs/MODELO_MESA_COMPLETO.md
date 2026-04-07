# Modelo Completo de Mesa — Documentação Técnica

> **Objetivo:** Documentar todos os campos, validações, relacionamentos e fluxo de dados de uma mesa no sistema, preparando para desacoplamento do pipeline de ingestão automática.

---

## 1. Visão Geral

Uma **mesa** (`tables`) é a entidade central do sistema. Representa um anúncio de jogo de RPG publicado por um mestre (GM) ou anunciante, podendo ser criada manualmente via formulário web ou importada automaticamente via AggregatorBot.

**Origens possíveis:**
- `manual` — Criada diretamente pelo mestre via painel web
- `imported` — Importada automaticamente de fontes externas (Discord, Facebook, etc.)

---

## 2. Schema da Tabela `tables`

### 2.1. Campos Base (migration_01_base_schema.sql)

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `id` | UUID | Sim | `uuid_generate_v4()` | Identificador único da mesa |
| `slug` | TEXT | Sim | — | Slug único para URL amigável (gerado a partir do título + timestamp) |
| `gm_id` | UUID | Não | NULL | FK para `gm_profiles(id)`. Mestre responsável pela mesa |
| `system_id` | UUID | Não | NULL | FK para `systems(id)`. Sistema de RPG utilizado |
| `title` | TEXT | Sim | — | Título da mesa |
| `description` | TEXT | Não | NULL | Descrição geral da mesa |
| `cover_url` | TEXT | Não | NULL | URL da imagem de capa (Imgur) |
| `cover_deletehash` | TEXT | Não | NULL | **INTERNO** — Hash de deleção do Imgur (nunca retornar em API pública) |
| `cover_imgur_id` | TEXT | Não | NULL | ID da imagem no Imgur |
| `origin` | table_origin | Sim | `'manual'` | Origem: `manual` ou `imported` |
| `status` | table_status | Sim | `'draft'` | Status: `draft`, `active`, `full`, `cancelled`, `ended`, `pending_review` |
| `type` | table_type | Sim | — | Tipo: `campanha`, `one-shot`, `oneshot-serie`, `aberta` |
| `audience` | table_audience | Sim | `'livre'` | Público: `livre` ou `adultos` |
| `modality` | table_modality | Sim | `'online'` | Modalidade: `online`, `presencial`, `hibrida` |
| `price_type` | price_type | Sim | `'gratuita'` | Tipo de cobrança: `gratuita` ou `paga` |
| `price_value` | NUMERIC(10,2) | Condicional | NULL | Valor cobrado (obrigatório se `price_type = 'paga'`) |
| `price_frequency` | price_frequency | Não | NULL | Frequência de cobrança: `sessao`, `mes`, `campanha` |
| `slots_total` | INTEGER | Sim | 4 | Total de vagas |
| `slots_filled` | INTEGER | Sim | 0 | Vagas preenchidas |
| `language` | TEXT | Sim | `'Português'` | Idioma da mesa |
| `experience_level` | experience_level | Sim | `'todos'` | Nível de experiência: `todos`, `iniciante`, `intermediario`, `veterano` |
| `starts_at` | TIMESTAMPTZ | Não | NULL | Data/hora de início da primeira sessão |
| `city` | TEXT | Não | NULL | Cidade (apenas para `presencial` ou `hibrida`) |
| `state` | TEXT | Não | NULL | Estado (apenas para `presencial` ou `hibrida`) |
| `content_warnings` | TEXT[] | Não | `'{}'` | Avisos de conteúdo sensível |
| `safety_tools` | TEXT[] | Não | `'{}'` | Ferramentas de segurança utilizadas |
| `source_url` | TEXT | Não | NULL | URL da fonte original (para mesas importadas) |
| `source_id` | UUID | Não | NULL | FK para `sources(id)` (AggregatorBot) |
| `featured` | BOOLEAN | Sim | FALSE | Se a mesa está em destaque |
| `created_at` | TIMESTAMPTZ | Sim | NOW() | Data de criação |
| `updated_at` | TIMESTAMPTZ | Sim | NOW() | Data da última atualização |

**Constraints:**
- `slots_filled >= 0 AND slots_filled <= slots_total`
- `price_type = 'gratuita' OR (price_type = 'paga' AND price_value IS NOT NULL)`

---

### 2.2. Campos DDAL (migration_02_system_taxonomy_and_ddal.sql)

Campos específicos para mesas com selo **D&D Adventurers League (DDAL)**:

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `is_ddal` | BOOLEAN | Sim | FALSE | Se a mesa possui selo DDAL |
| `ddal_code` | TEXT | Condicional | NULL | Código da aventura DDAL (ex: "DDAL05-01") |
| `ddal_name` | TEXT | Condicional | NULL | Nome da aventura DDAL |
| `ddal_tier` | SMALLINT | Condicional | NULL | Tier da aventura (1-4) |
| `ddal_season` | TEXT | Não | NULL | Temporada DDAL |
| `ddal_duration` | TEXT | Não | NULL | Duração estimada |
| `ddal_format` | TEXT | Não | NULL | Formato (ex: "Epic", "Standard") |
| `ddal_org_code` | TEXT | Não | NULL | Código da organização |
| `ddal_setting` | TEXT | Não | NULL | Cenário da aventura |
| `ddal_rules_notes` | TEXT | Não | NULL | Notas sobre regras específicas |

**Validações:**
- Se `is_ddal = true`, então `ddal_code`, `ddal_name` e `ddal_tier` são obrigatórios
- DDAL só é permitido para sistemas no caminho `dungeons-dragons/5e/2024`

---

### 2.3. Campos de Publicador (migration_04_publisher_role_and_contacts.sql)

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `publisher_role` | TEXT | Sim | `'gm'` | Papel do publicador: `gm` (mestre) ou `announcer` (anunciante) |
| `actual_gm_name` | TEXT | Condicional | NULL | Nome do mestre real (obrigatório se `publisher_role = 'announcer'`) |

**Validação:**
- Se `publisher_role = 'announcer'`, então `actual_gm_name` é obrigatório

---

### 2.4. Campos de Frequência e Banner (migration_09_table_frequency_rules_banner.sql)

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `frequency` | TEXT | Condicional | NULL | Frequência: `semanal`, `quinzenal`, `mensal`, `outros` |
| `frequency_custom` | TEXT | Condicional | NULL | Descrição customizada (obrigatório se `frequency = 'outros'`) |
| `rules_notes` | TEXT | Não | NULL | Notas sobre regras da casa |
| `banner_url` | TEXT | Não | NULL | URL do banner da mesa (Imgur) |

**Validações:**
- Se `type IN ('campanha', 'oneshot-serie')`, então `frequency` é obrigatório
- Se `frequency = 'outros'`, então `frequency_custom` é obrigatório

**Nota:** O campo `banner_url` substituiu `cover_url` como campo principal de imagem da mesa.

---

### 2.5. Campos de Expiração e Covil (migration_10_covil_and_expiration.sql)

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `is_covil` | BOOLEAN | Sim | FALSE | Se a mesa possui selo "Covil do Lich" |
| `imported_expires_at` | TIMESTAMPTZ | Não | NULL | Data de expiração para mesas importadas |

**Regra de expiração para mesas importadas:**
- Expiram em **5 dias** OU no horário do evento (`starts_at`), o que vier primeiro
- Mesas manuais (`origin = 'manual'`) nunca expiram automaticamente

---

### 2.6. Campos Avançados (migration_11_advanced_fields.sql — REQ-26)

Campos extraídos pelo parser Python mas não representados no formulário inicial:

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `master_display_name` | TEXT | Não | NULL | Nome de exibição do mestre (pode diferir do nickname do perfil) |
| `campaign_length` | TEXT | Não | NULL | Duração estimada da campanha (ex: "6 meses", "12 sessões") |
| `level_range` | TEXT | Não | NULL | Faixa de nível dos personagens (ex: "1-5", "10-15") |
| `billing_text` | TEXT | Não | NULL | Texto descritivo sobre cobrança |
| `session_zero_free` | BOOLEAN | Sim | FALSE | Se a sessão zero é gratuita |
| `synopsis` | TEXT | Não | NULL | Sinopse narrativa da campanha |
| `style_text` | TEXT | Não | NULL | Descrição do estilo de jogo |
| `listing_excerpt` | TEXT | Não | NULL | Resumo curto para listagens |
| `technical_requirements` | TEXT | Não | NULL | Requisitos técnicos detalhados |
| `requires_pc` | BOOLEAN | Sim | FALSE | Requer computador (não funciona em mobile) |
| `requires_camera` | BOOLEAN | Sim | FALSE | Requer câmera ligada |
| `requires_microphone` | BOOLEAN | Sim | FALSE | Requer microfone funcional |

---

### 2.7. Campos de Cenário (migration_12_cenarios.sql)

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `scenario_id` | UUID | Não | NULL | FK para `scenarios(id)`. Cenário pré-cadastrado |

---

### 2.8. Campos de Cenário e Estilos (migration_17_setting_and_styles.sql — REQ-28)

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `setting_name` | TEXT | Não | NULL | Nome do cenário (ex: "Forgotten Realms", "Eberron") |
| `setting_styles` | TEXT[] | Não | NULL | Array de estilos/temáticas (ex: ["Alta Fantasia", "Aventura Épica"]) |

**Índice:** GIN para buscas eficientes em arrays de estilos

---

### 2.9. Campos Editoriais (migration_18_editorial_fields.sql — REQ-28 Fase 2)

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `synopsis_narrative` | TEXT | Não | NULL | Bloco narrativo principal extraído do anúncio original |
| `benefits_text` | TEXT | Não | NULL | Benefícios e diferenciais oferecidos pela mesa |
| `gm_bio` | TEXT | Não | NULL | Biografia ou apresentação do mestre |

**Índices:** GIN para busca textual em português em `synopsis_narrative` e `gm_bio`

---

## 3. Tabelas Relacionadas

### 3.1. `table_contacts` (migration_04_publisher_role_and_contacts.sql)

Canais de contato para recrutamento de jogadores.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `table_id` | UUID | Sim | FK para `tables(id)` ON DELETE CASCADE |
| `channel` | TEXT | Sim | Canal: `whatsapp`, `discord`, `phone`, `email`, `facebook`, `instagram`, `form` |
| `value` | TEXT | Sim | Valor do contato (número, URL, email, etc.) |
| `label` | TEXT | Não | Label customizado (ex: "WhatsApp do Grupo") |
| `discord_server_url` | TEXT | Não | URL do servidor Discord (apenas para `channel = 'discord'`) |
| `sort_order` | SMALLINT | Sim | Ordem de exibição |
| `created_at` | TIMESTAMPTZ | Sim | Data de criação |

**Validações:**
- Pelo menos **1 contato** é obrigatório por mesa
- `channel` deve ser um dos valores permitidos

---

### 3.2. `table_schedules` (migration_12_table_schedules.sql — REQ-27)

Múltiplos horários de sessão por mesa.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | UUID | Sim | Identificador único |
| `table_id` | UUID | Sim | FK para `tables(id)` ON DELETE CASCADE |
| `day_of_week` | TEXT | Sim | Dia da semana: `segunda`, `terça`, `quarta`, `quinta`, `sexta`, `sábado`, `domingo` |
| `start_time` | TIME | Sim | Horário de início (HH:MM:SS) |
| `end_time` | TIME | Não | Horário de término |
| `frequency` | TEXT | Sim | Frequência: `semanal`, `quinzenal`, `mensal`, `avulsa` |
| `slots_per_session` | INT | Não | Vagas específicas desta sessão (NULL = herda de `tables.slots_total`) |
| `is_ongoing` | BOOLEAN | Sim | Sessão já em andamento (não aceita novos jogadores) |
| `notes` | TEXT | Não | Observações opcionais |
| `sort_order` | SMALLINT | Sim | Ordem de exibição |
| `created_at` | TIMESTAMPTZ | Sim | Data de criação |

**Validação:** `end_time` deve ser maior que `start_time` (validado no backend)

---

### 3.3. `table_metrics` (migration_16_table_metrics.sql)

Métricas de engajamento da mesa.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `table_id` | UUID | Sim | FK para `tables(id)` ON DELETE CASCADE (PK) |
| `views_count` | INTEGER | Sim | Contador de visualizações |
| `clicks_count` | INTEGER | Sim | Contador de cliques |
| `contacts_count` | INTEGER | Sim | Contador de contatos realizados |
| `favorites_count` | INTEGER | Sim | Contador de favoritos |
| `created_at` | TIMESTAMPTZ | Sim | Data de criação |
| `updated_at` | TIMESTAMPTZ | Sim | Data da última atualização |

**Endpoints de tracking (públicos, sem autenticação):**
- `POST /api/v1/tables/:id/view`
- `POST /api/v1/tables/:id/click`
- `POST /api/v1/tables/:id/contact`
- `POST /api/v1/tables/:id/favorite`

---

## 4. Fluxo de Criação de Mesa

### 4.1. Endpoint: `POST /api/v1/gm/tables`

**Autenticação:** JWT obrigatório (role `gm` ou superior)

**Validações pré-persistência:**

1. **Campos obrigatórios:**
   - `title`, `type`, `modality`
   - Se `type IN ('campanha', 'oneshot-serie')` → `frequency` obrigatório
   - Se `price_type = 'paga'` → `price_value` obrigatório e > 0
   - Se `publisher_role = 'announcer'` → `actual_gm_name` obrigatório
   - Se `frequency = 'outros'` → `frequency_custom` obrigatório
   - Pelo menos **1 contato** obrigatório

2. **Validações DDAL:**
   - Se `is_ddal = true` → `ddal_code`, `ddal_name`, `ddal_tier` obrigatórios
   - Sistema deve estar no caminho `dungeons-dragons/5e/2024`

3. **Geração de slug:**
   - Baseado no título (normalizado, sem acentos, lowercase)
   - Sufixo único: `Date.now().toString(36)`
   - Formato: `{titulo-normalizado}-{timestamp}`

4. **Transação:**
   - Inserir em `tables`
   - Inserir contatos em `table_contacts`
   - Inserir horários em `table_schedules` (se fornecidos)

**Resposta de sucesso:** `201 Created` com dados da mesa criada

---

### 4.2. Endpoint: `PUT /api/v1/gm/tables/:id`

**Autenticação:** JWT obrigatório (apenas o mestre dono da mesa)

**Validações:**
- Mesmas validações do POST
- Verifica propriedade: `gm_id` deve corresponder ao `gm_profile` do usuário logado

**Transação:**
- Atualizar `tables`
- Se `contacts` fornecido: deletar contatos antigos e inserir novos
- Se `schedules` fornecido: deletar schedules antigos e inserir novos

---

### 4.3. Endpoint: `DELETE /api/v1/gm/tables/:id`

**Autenticação:** JWT obrigatório (apenas o mestre dono da mesa)

**Transação:**
- Se `origin = 'imported'`: limpar `published_table_id` do candidato original
- Deletar `table_schedules` (CASCADE)
- Deletar `table_contacts` (CASCADE)
- Deletar `tables`

---

## 5. Fluxo de Consulta Pública

### 5.1. Endpoint: `GET /api/v1/tables`

**Autenticação:** Não requerida (catálogo público)

**Filtros disponíveis:**
- `system` (slug do sistema)
- `modality`, `type`, `audience`, `price_type`, `experience_level`
- `state`, `city`
- `featured` (boolean)
- `search` (busca textual em título, descrição, sistema, nome do mestre)
- `seal` (`ddal`, `covil-do-lich`)
- `page`, `limit` (paginação)

**Regra de expiração:**
- Mesas `origin = 'manual'` → sempre visíveis
- Mesas `origin = 'imported'` → visíveis apenas se não expiradas

**Retorno:**
- Lista de mesas com dados do mestre (`gm_display_name`, `gm_avatar_url`, `gm_badges`)
- Dados do sistema (`system_name`, `system_slug`)
- Array de `contacts` (sem deletehashes)

---

### 5.2. Endpoint: `GET /api/v1/tables/:slug`

**Autenticação:** Não requerida

**Retorno:**
- Dados completos da mesa
- Array de `contacts`
- Array de `schedules`
- Dados do mestre e sistema

**Validação de expiração:** Retorna `404` se mesa importada estiver expirada

---

## 6. Campos Internos (Nunca Retornar em API Pública)

> [!CAUTION]
> Os seguintes campos contêm informações sensíveis e **NUNCA** devem ser retornados em rotas públicas:

- `cover_deletehash`
- `avatar_deletehash` (de `gm_profiles`)
- `banner_deletehash` (de `gm_profiles`)

Esses campos são usados exclusivamente pelo backend para deletar imagens no Imgur via `CleanupWorker`.

---

## 7. Regras de Negócio

### 7.1. Elevação de Role

Um usuário com `role = 'player'` torna-se `role = 'gm'` ao criar seu primeiro `gm_profile`.

**Lógica:** Exclusiva do backend. O frontend nunca decide elevação de role.

---

### 7.2. Upload de Imagens

**Fluxo:**
1. Frontend envia imagem para `POST /api/v1/gm/upload-image`
2. Backend converte para WebP (se necessário)
3. Backend envia para Imgur via `IMGUR_CLIENT_ID`
4. Backend retorna `{ url, deletehash, imgur_id }`
5. Frontend armazena apenas `url` no formulário
6. Backend persiste `url`, `deletehash` e `imgur_id` no banco

**Regra:** Upload e processamento de imagens **sempre** no backend, nunca no frontend.

---

### 7.3. Limpeza de Imagens

O `CleanupWorker` (node-cron) deleta imagens de mesas encerradas (`status = 'ended'`) no Imgur usando o `deletehash`.

**Critério de exclusão:** Requer autorização explícita para alterações — deleção no Imgur é irreversível.

---

## 8. Validações de UX (Heurísticas de Nielsen)

Toda mudança de interface relacionada ao formulário de criação de mesa deve respeitar as **10 Heurísticas de Nielsen**:

1. **Visibilidade do status** — Feedback de autosave, progresso de steps
2. **Compatibilidade com o mundo real** — Linguagem natural, não técnica
3. **Controle e liberdade** — Navegação livre entre steps, restore de draft
4. **Consistência** — Padrões visuais e de interação consistentes
5. **Prevenção de erros** — Validações inline, desabilitar opções inválidas
6. **Reconhecimento vs memorização** — Labels claros, placeholders informativos
7. **Eficiência e flexibilidade** — Atalhos, autosave, sugestões automáticas
8. **Design minimalista** — Apenas campos relevantes por step
9. **Recuperação de erros** — Mensagens claras, sugestões de correção
10. **Ajuda e documentação** — Tooltips, exemplos inline

---

## 9. Campos por Origem

### 9.1. Mesas Manuais (`origin = 'manual'`)

**Campos preenchidos pelo formulário web:**
- Todos os campos base
- Campos DDAL (se aplicável)
- Campos de publicador
- Campos de frequência e banner
- Campos avançados (REQ-26)
- Campos de cenário e estilos (REQ-28)
- Campos editoriais (REQ-28 Fase 2)
- Relacionamentos: `table_contacts`, `table_schedules`

---

### 9.2. Mesas Importadas (`origin = 'imported'`)

**Campos preenchidos pelo parser Python:**
- Campos base (extraídos do anúncio)
- Campos DDAL (se detectado)
- Campos de publicador (inferidos)
- Campos avançados (extraídos quando disponíveis)
- Campos de cenário e estilos (extraídos quando disponíveis)
- Campos editoriais (extraídos do texto original)
- `source_url`, `source_id`
- `imported_expires_at` (calculado)

**Fluxo:**
1. Parser Python extrai dados do anúncio
2. Cria candidato em `aggregator_import_candidates`
3. Admin revisa e aprova via painel de gestão
4. Backend cria mesa em `tables` com `origin = 'imported'`
5. Vincula candidato à mesa via `published_table_id`

---

## 10. Resumo de Campos Obrigatórios

### Sempre obrigatórios:
- `title`, `type`, `modality`
- Pelo menos 1 contato em `table_contacts`

### Condicionalmente obrigatórios:
- `frequency` — se `type IN ('campanha', 'oneshot-serie')`
- `frequency_custom` — se `frequency = 'outros'`
- `price_value` — se `price_type = 'paga'`
- `actual_gm_name` — se `publisher_role = 'announcer'`
- `ddal_code`, `ddal_name`, `ddal_tier` — se `is_ddal = true`

---

## 11. Próximos Passos

Esta documentação serve como base para:

1. **Desacoplamento do AggregatorBot** — Separar o sistema de ingestão automática do core da aplicação
2. **Refatoração do parser Python** — Isolar como serviço independente
3. **Backup do pipeline de ingestão** — Preservar código e documentação para uso futuro
4. **Simplificação do modelo** — Remover dependências do parser no core da aplicação

---

**Última atualização:** 2026-04-07  
**Autor:** Sistema (via análise de migrations, rotas e formulário)
