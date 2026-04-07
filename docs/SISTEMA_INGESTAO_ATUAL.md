# Sistema de Ingestão Automática — Mapeamento Completo

> **Objetivo:** Documentar todo o sistema de ingestão automática (AggregatorBot) para preparar o desacoplamento e substituição por upload manual de JSON.

---

## 1. Visão Geral do Sistema Atual

O sistema atual possui um **pipeline completo de ingestão automática** que:

1. **Coleta** mensagens de canais Discord via bot
2. **Parseia** mensagens brutas usando parser Python + spaCy
3. **Classifica** candidatos com score de confiança
4. **Armazena** em fila editorial para revisão admin
5. **Publica** mesas aprovadas no catálogo público

**Problema:** Este sistema é complexo, depende de infraestrutura externa (Discord bot, token, permissões) e será substituído por um **upload manual de JSON** preparado por ferramenta externa.

---

## 2. Componentes do Sistema Atual

### 2.1. Tabelas do Banco de Dados

#### `aggregator_sources` (migration_05)
Fontes de dados (canais Discord).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `name` | TEXT | Nome da fonte |
| `platform` | TEXT | Plataforma (sempre `'discord'`) |
| `server_id` | TEXT | ID do servidor Discord |
| `channel_id` | TEXT | ID do canal Discord |
| `enabled` | BOOLEAN | Se a fonte está ativa |
| `allow_paid` | BOOLEAN | Se permite mesas pagas |
| `publish_mode` | TEXT | `'manual_review'` ou `'auto_publish'` |
| `default_timezone` | TEXT | Timezone padrão |
| `notes` | TEXT | Observações |

**Constraint:** `UNIQUE (platform, server_id, channel_id)`

---

#### `aggregator_imported_raw_messages` (migration_05)
Mensagens brutas importadas do Discord.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `source_id` | UUID | FK para `aggregator_sources` |
| `external_id` | TEXT | ID da mensagem no Discord |
| `raw_text` | TEXT | Texto bruto da mensagem |
| `author_name` | TEXT | Nome do autor |
| `author_discord_id` | TEXT | ID do autor no Discord |
| `message_url` | TEXT | URL da mensagem |
| `processed` | BOOLEAN | Se foi processada pelo parser |
| `message_created_at` | TIMESTAMPTZ | Data da mensagem original |
| `raw_payload` | JSONB | Payload completo do Discord |
| `processing_attempts` | INTEGER | Tentativas de processamento |
| `last_processing_error` | TEXT | Último erro de processamento |

**Constraint:** `UNIQUE (source_id, external_id)`

---

#### `aggregator_import_candidates` (migration_05 + migration_07)
Candidatos parseados aguardando revisão editorial.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `source_id` | UUID | FK para `aggregator_sources` |
| `raw_message_id` | UUID | FK para `aggregator_imported_raw_messages` |
| `external_id` | TEXT | ID externo (Discord message ID) |
| `parsed_json` | JSONB | Dados parseados pelo Python |
| `confidence_score` | NUMERIC(5,2) | Score de confiança (0-100) |
| `editorial_status` | TEXT | `'accepted'`, `'rejected'`, `'awaiting_review'` |
| `publish_mode` | TEXT | `'manual_review'` ou `'auto_publish'` |
| `publish_at` | TIMESTAMPTZ | Data de publicação agendada |
| `rejection_reason` | TEXT | Motivo da rejeição |
| `published_table_id` | UUID | FK para `tables(id)` (se aprovado) |

**Campos adicionais (migration_07 — Parser Fase B):**
- `sessions` (JSONB) — Array de sessões estruturadas
- `slots_total`, `slots_available`, `slots_filled` (INTEGER)
- `system_raw`, `system_normalized`, `system_classification` (TEXT)
- `is_homebrew`, `is_custom` (BOOLEAN)
- `payment_classification` (TEXT)
- `candidate_kind` (TEXT)
- `master_display_name`, `recruiter_name`, `publisher_role` (TEXT)
- `is_same_person` (BOOLEAN)

**Constraint:** `UNIQUE (source_id, external_id)`

---

#### `aggregator_candidate_audit` (migration_11)
Histórico de edições em candidatos.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | SERIAL | Identificador único |
| `candidate_id` | VARCHAR(255) | FK para `aggregator_import_candidates(id)` |
| `action` | VARCHAR(50) | `'created'`, `'updated'`, `'approved'`, `'rejected'` |
| `changed_fields` | JSONB | Campos alterados |
| `old_values` | JSONB | Valores antigos |
| `new_values` | JSONB | Valores novos |
| `user_id` | INTEGER | ID do admin |
| `user_email` | VARCHAR(255) | Email do admin |

---

#### `aggregator_settings` (migration_05)
Configurações globais do agregador.

| Campo | Tipo | Descrição |
|---|---|---|
| `key` | TEXT | Chave da configuração (PK) |
| `value` | JSONB | Valor da configuração |

---

### 2.2. Rotas de API

#### Rotas de Gerenciamento de Fontes (`/api/v1/aggregator/sources`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| GET | `/sources` | Listar todas as fontes | Admin |
| POST | `/sources` | Criar nova fonte (canal Discord) | Admin |
| PUT | `/sources/:id` | Atualizar fonte | Admin |
| PATCH | `/sources/:id/enabled` | Ativar/desativar fonte | Admin |

**Payload de criação:**
```json
{
  "name": "Canal de Anúncios",
  "serverId": "123456789",
  "channelId": "987654321",
  "enabled": true,
  "allowPaid": false,
  "publishMode": "manual_review",
  "defaultTimezone": "America/Sao_Paulo",
  "notes": "Canal oficial"
}
```

---

#### Rotas de Importação (`/api/v1/aggregator/import`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| POST | `/import/file` | Importar JSON do Discord Exporter | Público |
| POST | `/import/source/:id/run` | Importar JSON vinculado a uma fonte | Admin |

**Payload de importação:**
```json
{
  "sourceId": "uuid-opcional",
  "dryRun": true,
  "payload": {
    "guild": { "name": "Servidor" },
    "channel": { "name": "Canal" },
    "messages": [...]
  }
}
```

**Resposta:**
```json
{
  "data": {
    "totalMessages": 150,
    "imported": 145,
    "accepted": 0,
    "awaitingReview": 140,
    "rejected": 5,
    "failed": 0,
    "dryRun": true,
    "results": [...]
  }
}
```

---

#### Rotas de Revisão Editorial (`/api/v1/aggregator/candidates`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| GET | `/candidates` | Listar candidatos (com filtros) | Admin |
| GET | `/candidates/:id` | Buscar candidato por ID | Admin |
| PATCH | `/candidates/:id/accept` | Aceitar candidato (com overrides) | Admin |
| PATCH | `/candidates/:id/reject` | Rejeitar candidato | Admin |
| PATCH | `/candidates/:id/review` | Enviar para revisão | Admin |
| PUT | `/candidates/:id` | Editar `parsed_json` do candidato | Admin |
| DELETE | `/candidates/:id` | Deletar candidato permanentemente | Admin |
| DELETE | `/candidates/bulk` | Deletar múltiplos candidatos | Admin |
| PATCH | `/candidates/reject-all` | Rejeitar todos em lote | Admin |
| PATCH | `/candidates/:id/undo-rejection` | Desfazer rejeição | Admin |

**Filtros disponíveis:**
- `editorial_status` — `'accepted'`, `'rejected'`, `'awaiting_review'`
- `page`, `limit` — Paginação

---

#### Rotas de Aprovação (`/api/v1/aggregator/candidates/:id/approve`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| POST | `/candidates/:id/approve` | Aprovar candidato e criar mesa | Admin |

**Fluxo de aprovação:**
1. Buscar candidato por ID
2. Validar campos obrigatórios (`title`, `description`)
3. Aplicar overrides do admin (se fornecidos no body)
4. Criar mesa em `tables` com `origin = 'imported'`
5. Criar contatos em `table_contacts`
6. Criar horários em `table_schedules`
7. Atualizar candidato: `editorial_status = 'accepted'`, `published_table_id = <mesa_id>`

---

#### Rotas de Exportação (`/api/v1/aggregator/exports`)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| GET | `/exports/day` | Exportar mesas aceitas do dia (JSON) | Admin |
| GET | `/exports/day.txt` | Exportar mesas aceitas do dia (TXT) | Admin |

---

### 2.3. Serviços Backend

#### `sourceService.ts`
Gerencia fontes (canais Discord).

**Funções:**
- `list()` — Listar todas as fontes
- `create(data)` — Criar nova fonte
- `update(id, data)` — Atualizar fonte
- `setEnabled(id, enabled)` — Ativar/desativar fonte

---

#### `importFromExporterService.ts`
Importa JSON do Discord Exporter.

**Funções:**
- `importPayload({ payload, sourceId, dryRun })` — Importar payload JSON

**Fluxo:**
1. Validar estrutura do payload
2. Extrair mensagens do array `messages`
3. Para cada mensagem:
   - Criar registro em `aggregator_imported_raw_messages`
   - Chamar `pythonParserService.parse(rawText)`
   - Criar candidato em `aggregator_import_candidates`
4. Retornar resumo (total, importados, aceitos, rejeitados, falhas)

---

#### `pythonParserService.ts`
Chama parser Python via subprocess.

**Funções:**
- `parse(rawText)` — Parsear texto bruto e retornar JSON estruturado

**Fluxo:**
1. Criar arquivo temporário com texto bruto
2. Executar `python discord_message_parser.py <arquivo>`
3. Ler JSON de saída
4. Retornar objeto parseado

**Dependências:**
- Python 3.x
- spaCy + modelo `pt_core_news_lg`
- Script `discord_message_parser.py`

---

#### `candidateService.ts`
Gerencia candidatos editoriais.

**Funções:**
- `list({ editorialStatus, page, limit })` — Listar candidatos
- `getById(id)` — Buscar candidato por ID
- `accept(id, overrides)` — Aceitar candidato
- `reject(id, reason)` — Rejeitar candidato
- `review(id, reason)` — Enviar para revisão
- `update(id, parsedJson)` — Editar `parsed_json`
- `deleteById(id)` — Deletar candidato
- `deleteBulk(ids)` — Deletar múltiplos candidatos

---

#### `exportService.ts`
Gera exportações diárias.

**Funções:**
- `getDailyAccepted(date)` — Exportar mesas aceitas do dia

---

### 2.4. Parser Python

#### `discord_message_parser.py`
Script Python que parseia mensagens brutas do Discord.

**Localização:** `/backend/scripts/discord_message_parser.py` (presumido)

**Dependências:**
- `spacy` — NLP para extração de entidades
- `pt_core_news_lg` — Modelo de linguagem português

**Entrada:** Texto bruto da mensagem Discord

**Saída:** JSON estruturado com:
- `title` — Título da mesa
- `description` — Descrição
- `system_id` — Sistema de RPG
- `type` — Tipo de mesa
- `modality` — Modalidade
- `price_type` — Tipo de cobrança
- `contacts` — Array de contatos
- `schedules` — Array de horários
- `setting_name` — Nome do cenário
- `setting_styles` — Estilos
- Campos avançados (REQ-26, REQ-28)

---

### 2.5. Frontend (AdminDevToolsPage)

#### Funcionalidades

1. **Gerenciamento de Token Admin**
   - Input para JWT admin
   - Salva em `localStorage`
   - Revela/oculta token

2. **Testes Rápidos Automáticos**
   - 6 testes de saúde da API
   - Semáforo visual (verde/vermelho/amarelo)
   - Execução em lote

3. **Criação de Fonte por Link**
   - Input para URL do canal Discord
   - Parse automático de `serverId` e `channelId`
   - Criação via `POST /aggregator/sources`

4. **Upload e Importação de JSON**
   - Drag & drop de arquivo JSON
   - Validação e reparo automático via `jsonrepair`
   - Split automático em chunks de 1000 mensagens
   - Dry-run mode
   - Resumo visual de importação
   - Barra de progresso para múltiplos chunks

5. **Teste de Rotas Customizadas**
   - Input para path customizado
   - Execução manual de GET requests

---

## 3. Fluxo Completo Atual

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. COLETA (Discord Bot ou Discord Exporter)                     │
│    - Bot monitora canal Discord                                 │
│    - OU admin exporta JSON via Discord Chat Exporter            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. IMPORTAÇÃO (POST /aggregator/import/file)                    │
│    - Recebe JSON do Discord Exporter                            │
│    - Valida estrutura (guild, channel, messages)                │
│    - Split automático em chunks de 1000 mensagens               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. ARMAZENAMENTO BRUTO (aggregator_imported_raw_messages)       │
│    - Salva mensagem bruta                                       │
│    - Marca como não processada                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. PARSING (pythonParserService → discord_message_parser.py)    │
│    - Extrai entidades via spaCy                                 │
│    - Classifica sistema, tipo, modalidade                       │
│    - Extrai contatos e horários                                 │
│    - Calcula confidence_score                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CANDIDATO (aggregator_import_candidates)                     │
│    - Salva parsed_json                                          │
│    - Define editorial_status = 'awaiting_review'                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. REVISÃO EDITORIAL (Admin via /gestao)                        │
│    - Admin visualiza candidatos                                 │
│    - Edita campos se necessário                                 │
│    - Aprova ou rejeita                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. PUBLICAÇÃO (POST /aggregator/candidates/:id/approve)         │
│    - Cria mesa em tables (origin = 'imported')                  │
│    - Cria contatos em table_contacts                            │
│    - Cria horários em table_schedules                           │
│    - Vincula candidato à mesa (published_table_id)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. CATÁLOGO PÚBLICO (GET /api/v1/tables)                        │
│    - Mesa visível no catálogo                                   │
│    - Expira em 5 dias OU no horário do evento                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Dependências Externas

### 4.1. Discord
- **Bot Token** — Requer aplicação Discord com bot configurado
- **Permissões** — `Read Message History` no canal
- **Discord Chat Exporter** — Ferramenta externa para exportar JSON

### 4.2. Python
- **Python 3.x** — Runtime
- **spaCy** — Biblioteca NLP
- **pt_core_news_lg** — Modelo de linguagem (700+ MB)

### 4.3. Node.js
- **jsonrepair** — Biblioteca para reparar JSON malformado

---

## 5. Novo Fluxo Proposto (Upload Manual)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PREPARAÇÃO EXTERNA (Ferramenta do usuário)                   │
│    - Usuário usa ferramenta própria para preparar JSON          │
│    - JSON já vem estruturado no formato esperado                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. UPLOAD MANUAL (Nova interface de upload)                     │
│    - Admin faz upload do JSON preparado                         │
│    - Validação de estrutura mínima                              │
│    - Sem parsing, sem classificação automática                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CRIAÇÃO DIRETA DE MESA (POST /api/v1/gm/tables)              │
│    - Cria mesa diretamente em tables                            │
│    - Cria contatos em table_contacts                            │
│    - Cria horários em table_schedules                           │
│    - origin = 'manual' (não 'imported')                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CATÁLOGO PÚBLICO (GET /api/v1/tables)                        │
│    - Mesa visível no catálogo                                   │
│    - Sem expiração automática (origin = 'manual')               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Componentes a Serem Removidos

### 6.1. Tabelas do Banco
- ❌ `aggregator_sources`
- ❌ `aggregator_imported_raw_messages`
- ❌ `aggregator_import_candidates`
- ❌ `aggregator_candidate_audit`
- ❌ `aggregator_settings`

### 6.2. Migrations
- ❌ `migration_05_aggregator_sources_and_queue.sql`
- ❌ `migration_07_advanced_parser.sql` (campos específicos do parser)
- ❌ `migration_11_candidate_audit_log.sql`

### 6.3. Rotas de API
- ❌ `/api/v1/aggregator/sources` (todas)
- ❌ `/api/v1/aggregator/import` (todas)
- ❌ `/api/v1/aggregator/candidates` (todas)
- ❌ `/api/v1/aggregator/exports` (todas)

### 6.4. Serviços Backend
- ❌ `sourceService.ts`
- ❌ `importFromExporterService.ts`
- ❌ `pythonParserService.ts`
- ❌ `candidateService.ts`
- ❌ `exportService.ts`
- ❌ `rawImportService.ts`
- ❌ `publishService.ts`

### 6.5. Domain/Aggregator
- ❌ `/backend/src/domain/aggregator/` (todo o diretório)
  - `classifyPayment.ts`
  - `classifySystem.ts`
  - `extractMediaLinks.ts`
  - `formatForPublication.ts`
  - `normalizeCandidate.ts`
  - `normalizeExporterPayload.ts`
  - `parseExporterMessage.ts`
  - `resolveMasterRecruiter.ts`
  - `sanitizeDiscordJson.ts`
  - `types.ts`

### 6.6. Scripts Python
- ❌ `discord_message_parser.py`
- ❌ `setup_python_env.ps1`
- ❌ `setup_python_env.sh`

### 6.7. Frontend
- ❌ `AdminDevToolsPage.tsx` (ou simplificar drasticamente)
- ❌ Aba "Aggregator" em `/gestao` (se existir)

### 6.8. Dependências
- ❌ Python runtime
- ❌ spaCy
- ❌ pt_core_news_lg
- ❌ jsonrepair (opcional, pode manter)

---

## 7. Componentes a Serem Preservados

### 7.1. Modelo de Mesa
- ✅ Tabela `tables` (completa)
- ✅ Tabela `table_contacts`
- ✅ Tabela `table_schedules`
- ✅ Tabela `table_metrics`

### 7.2. Rotas de Mesa
- ✅ `POST /api/v1/gm/tables` — Criar mesa manual
- ✅ `PUT /api/v1/gm/tables/:id` — Editar mesa
- ✅ `DELETE /api/v1/gm/tables/:id` — Deletar mesa
- ✅ `GET /api/v1/tables` — Catálogo público
- ✅ `GET /api/v1/tables/:slug` — Mesa individual

### 7.3. Formulário de Criação
- ✅ `CreateTableForm.tsx` (completo)
- ✅ Todos os steps (Basic, System, Sessions, Config, Final, Review)

---

## 8. Nova Interface de Upload (A Criar)

### 8.1. Requisitos

1. **Upload de JSON**
   - Drag & drop ou file input
   - Validação de estrutura mínima
   - Preview dos dados antes de criar

2. **Mapeamento Direto**
   - JSON → `POST /api/v1/gm/tables`
   - Sem parsing intermediário
   - Sem fila editorial

3. **Validações**
   - Campos obrigatórios: `title`, `type`, `modality`, `contacts`
   - Validação de tipos (arrays, booleans, etc.)
   - Validação de enums (type, modality, etc.)

4. **Feedback**
   - Sucesso: redirecionar para mesa criada
   - Erro: mostrar mensagem clara

### 8.2. Formato JSON Esperado

```json
{
  "title": "Título da Mesa",
  "description": "Descrição completa",
  "type": "campanha",
  "modality": "online",
  "system_id": "uuid-do-sistema",
  "price_type": "gratuita",
  "slots_total": 4,
  "language": "Português",
  "experience_level": "todos",
  "contacts": [
    {
      "channel": "discord",
      "value": "https://discord.gg/...",
      "label": "Servidor Principal"
    }
  ],
  "schedules": [
    {
      "day_of_week": "sábado",
      "start_time": "14:00:00",
      "frequency": "semanal"
    }
  ],
  "setting_name": "Forgotten Realms",
  "setting_styles": ["Alta Fantasia", "Aventura Épica"]
}
```

---

## 9. Plano de Desacoplamento

### Fase 1: Backup e Documentação
- [x] Documentar sistema atual completo
- [ ] Criar backup de todas as tabelas aggregator_*
- [ ] Exportar candidatos pendentes (se houver)
- [ ] Documentar dependências Python

### Fase 2: Nova Interface de Upload
- [ ] Criar componente `UploadTableJsonPage.tsx`
- [ ] Implementar validação de JSON
- [ ] Mapear JSON → payload de `POST /gm/tables`
- [ ] Testar com JSONs de exemplo

### Fase 3: Remoção Gradual
- [ ] Desabilitar rotas `/aggregator/*` (comentar no `server.ts`)
- [ ] Remover imports de serviços aggregator
- [ ] Remover `AdminDevToolsPage` ou simplificar
- [ ] Remover scripts Python

### Fase 4: Limpeza do Banco
- [ ] Criar migration para DROP das tabelas aggregator_*
- [ ] Aplicar em beta
- [ ] Validar que nenhuma FK quebrou

### Fase 5: Limpeza de Código
- [ ] Deletar `/backend/src/services/aggregator/`
- [ ] Deletar `/backend/src/domain/aggregator/`
- [ ] Deletar `/backend/scripts/discord_message_parser.py`
- [ ] Deletar scripts de setup Python
- [ ] Remover dependências do `package.json` (se houver)

---

## 10. Riscos e Considerações

### 10.1. Dados Existentes
- **Candidatos pendentes:** Exportar antes de remover tabelas
- **Mesas importadas:** Continuam funcionando (não dependem das tabelas aggregator)

### 10.2. Referências no Código
- Campo `origin` em `tables` — manter, mas novos uploads serão `'manual'`
- Campo `published_table_id` em candidatos — será removido junto com a tabela

### 10.3. Testes
- Validar que mesas manuais continuam funcionando
- Validar que catálogo público não quebra
- Validar que formulário de criação continua funcional

---

## 11. Próximos Passos

1. **Revisar este documento com o responsável**
2. **Decidir formato final do JSON de upload**
3. **Criar interface de upload**
4. **Testar com dados reais**
5. **Executar plano de desacoplamento**

---

**Última atualização:** 2026-04-07  
**Autor:** Sistema (via análise de código e banco de dados)
