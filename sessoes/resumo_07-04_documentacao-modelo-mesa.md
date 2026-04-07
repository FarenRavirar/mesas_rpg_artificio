# Sessão 07/04 — Documentação do Modelo de Mesa

## Objetivo da sessão
Documentar profundamente como uma mesa recebe dados e todos os campos que devem ser preenchidos, preparando para posterior desacoplamento do sistema de ingestão automática (AggregatorBot/parser).

## Plano de execução
1. Investigar modelo de dados da tabela `tables` no banco PostgreSQL
2. Analisar endpoint de criação de mesa (POST /tables)
3. Mapear todos os campos obrigatórios e opcionais
4. Documentar validações e regras de negócio
5. Identificar relacionamentos com outras entidades (systems, gm_profiles, images)
6. Mapear fluxo completo desde o frontend até persistência
7. Criar documentação consolidada do modelo de mesa
8. Atualizar documentos relevantes

## Task list
- [x] Investigar schema do banco (migration files)
- [x] Analisar rotas de API relacionadas a tables
- [x] Mapear campos do modelo Table (backend)
- [x] Analisar formulário de criação (frontend)
- [x] Documentar validações e constraints
- [x] Documentar relacionamentos (FK, joins)
- [x] Mapear fluxo de upload de imagens
- [x] Criar documento consolidado
- [x] Atualizar documentos relevantes

## Critério de conclusão
✅ **CONCLUÍDO** — Documento completo descrevendo todos os campos, validações, relacionamentos e fluxo de dados de uma mesa, permitindo entender o modelo sem depender do código de ingestão.

## Arquivos criados
- `/docs/MODELO_MESA_COMPLETO.md` — Documentação técnica completa (11 seções, 500+ linhas)

## Arquivos atualizados
- `/sessoes/resumo_07-04_documentacao-modelo-mesa.md` — Este arquivo
- `/RESUMO_EXECUCAO.md` — Estado atual do projeto

## Último item obrigatório
- [x] Atualizar documentos relevantes

---

## Fase 2: Investigação do Sistema de Ingestão Automática

### Objetivo
Mapear completamente o sistema de ingestão automática (AggregatorBot) para preparar o desacoplamento e substituição por upload manual de JSON.

### Task list
- [x] Mapear tabelas do banco (5 tabelas aggregator_*)
- [x] Mapear rotas de API (4 grupos de endpoints)
- [x] Mapear serviços backend (9 arquivos)
- [x] Mapear parser Python e dependências
- [x] Mapear frontend (AdminDevToolsPage)
- [x] Documentar fluxo completo atual
- [x] Identificar componentes a remover
- [x] Identificar componentes a preservar
- [x] Propor novo fluxo de upload manual
- [x] Criar plano de desacoplamento

### Arquivos criados
- `/docs/SISTEMA_INGESTAO_ATUAL.md` — Documentação completa do sistema de ingestão (11 seções, 600+ linhas)

### Descobertas principais

**Componentes a remover:**
- 5 tabelas: `aggregator_sources`, `aggregator_imported_raw_messages`, `aggregator_import_candidates`, `aggregator_candidate_audit`, `aggregator_settings`
- 3 migrations: `migration_05`, `migration_07` (parcial), `migration_11`
- 4 grupos de rotas: `/aggregator/sources`, `/aggregator/import`, `/aggregator/candidates`, `/aggregator/exports`
- 9 serviços backend: `sourceService`, `importFromExporterService`, `pythonParserService`, `candidateService`, `exportService`, etc.
- 10 arquivos domain: `/backend/src/domain/aggregator/*`
- Parser Python: `discord_message_parser.py` + dependências (spaCy, pt_core_news_lg)
- Frontend: `AdminDevToolsPage.tsx` (ou simplificar drasticamente)

**Componentes a preservar:**
- Modelo completo de mesa (`tables`, `table_contacts`, `table_schedules`, `table_metrics`)
- Rotas de mesa (`POST /gm/tables`, `GET /tables`, etc.)
- Formulário de criação (`CreateTableForm.tsx`)

**Novo fluxo proposto:**
1. Ferramenta externa prepara JSON estruturado
2. Admin faz upload via nova interface
3. Validação de estrutura mínima
4. Criação direta via `POST /gm/tables` (sem parsing, sem fila editorial)
5. Mesa publicada imediatamente com `origin = 'manual'`

### Critério de conclusão
✅ **CONCLUÍDO** — Sistema de ingestão completamente mapeado, componentes identificados, plano de desacoplamento documentado.
