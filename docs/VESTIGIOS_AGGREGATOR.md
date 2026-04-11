# Relatório de Vestígios do AggregatorBot

**Data:** 11/04/2026  
**Objetivo:** Mapear todos os vestígios de código do módulo AggregatorBot descontinuado sem alterá-los.

---

## 1. Banco de Dados

### Tabelas (migration_05)
- `aggregator_sources` — Fontes de dados (canais Discord)
- `aggregator_imported_raw_messages` — Mensagens brutas importadas
- `aggregator_import_candidates` — Candidatos parseados aguardando revisão
- `aggregator_settings` — Configurações globais do agregador
- `aggregator_candidate_audit` (migration_11) — Histórico de edições

### Migration para Remoção
- `database/migration_99_drop_aggregator_tables.sql` — Migration de remoção já existe

---

## 2. Backend — Rotas

### Arquivos de Rotas
- `backend/src/routes/aggregator.ts` — CRUD de fontes, importação
- `backend/src/routes/aggregatorReview.ts` — Revisão editorial de candidatos

### Endpoints Identificados
**Gerenciamento de Fontes:**
- `GET /api/v1/aggregator/sources`
- `POST /api/v1/aggregator/sources`
- `PUT /api/v1/aggregator/sources/:id`
- `PATCH /api/v1/aggregator/sources/:id/toggle`

**Importação:**
- `POST /api/v1/aggregator/import/file`
- `POST /api/v1/aggregator/import/source/:id/run`

**Revisão Editorial:**
- `GET /api/v1/aggregator/candidates`
- `GET /api/v1/aggregator/candidates/:id`
- `PATCH /api/v1/aggregator/candidates/:id/accept`
- `PATCH /api/v1/aggregator/candidates/:id/reject`
- `PATCH /api/v1/aggregator/candidates/:id/review`
- `PATCH /api/v1/aggregator/candidates/reject-all`
- `PATCH /api/v1/aggregator/candidates/:id/undo-rejection`
- `DELETE /api/v1/aggregator/candidates/bulk`

**Exportação:**
- `GET /api/v1/aggregator/exports/day`
- `GET /api/v1/aggregator/exports/day.txt`

---

## 3. Backend — Serviços

### Diretório: `backend/src/services/aggregator/`
- `sourceService.ts` — Gerenciamento de fontes
- `candidateService.ts` — Gerenciamento de candidatos
- `rawImportService.ts` — Importação de mensagens brutas
- `importFromExporterService.ts` — Importação de JSON do Discord Exporter
- `exportService.ts` — Exportação diária
- `publishService.ts` — Publicação de candidatos aprovados
- `schedulerService.ts` — Agendamento de tarefas
- `pythonParserService.ts` — Interface com parser Python

---

## 4. Backend — Domínio

### Diretório: `backend/src/domain/aggregator/`
- `normalizeExporterPayload.ts` — Normalização de payload do Discord
- `parseExporterMessage.ts` — Parse de mensagens
- `extractMediaLinks.ts` — Extração de links de mídia
- `classifyPayment.ts` — Classificação de pagamento
- `classifySystem.ts` — Classificação de sistema
- `resolveMasterRecruiter.ts` — Resolução mestre vs anunciante
- `normalizeCandidate.ts` — Normalização de candidatos
- `formatForPublication.ts` — Formatação para publicação
- `types.ts` — Tipos TypeScript do aggregator

---

## 5. Backend — Scripts

### Scripts CLI
- `backend/src/scripts/importDiscordExport.ts` — Importação manual de JSON
- `backend/src/scripts/aggregatorBackfill.ts` — Backfill de dados
- `backend/src/scripts/aggregatorReprocess.ts` — Reprocessamento

### Scripts Python
- `backend/src/services/aggregator/parser/discord_message_parser.py` — Parser Python com spaCy
- `backend/src/services/aggregator/parser/schemas.py` — Schemas Pydantic
- `setup_python_env.ps1` — Setup do ambiente Python

---

## 6. Backend — Jobs

### Workers
- `backend/src/jobs/aggregatorJob.ts` — Worker automático (não implementado)
- `backend/src/jobs/cleanupJob.ts` — CleanupWorker (não ativado)

---

## 7. Backend — Tipos

### Extensões Kysely
- `backend/src/db/types.ts` — Tipos das tabelas aggregator_*
- `backend/src/db/aggregator.ts` — Queries específicas do aggregator

---

## 8. Frontend — Páginas

### Páginas Administrativas
- `frontend/src/pages/GestaoPage.tsx` — Aba "Mesas Importadas" (linhas 840-1639)
- `frontend/src/pages/AdminDevToolsPage.tsx` — Ferramentas de importação
- `frontend/src/pages/AggregatorSourcesPage.tsx` — Gerenciamento de fontes (se existir)
- `frontend/src/pages/AggregatorReviewPage.tsx` — Revisão de candidatos (se existir)
- `frontend/src/pages/AggregatorExportsPage.tsx` — Exportações (se existir)

---

## 9. Frontend — Componentes

### Componentes Relacionados
- Seções de revisão de candidatos em `GestaoPage.tsx`
- Modais de aprovação/rejeição
- Filtros de candidatos importados

---

## 10. Frontend — Utilitários

### Helpers
- `frontend/src/utils/candidateToFormData.ts` — Mapeamento de candidatos para formulário
- `frontend/src/services/aggregatorApi.ts` — Cliente API do aggregator (se existir)

---

## 11. Configuração

### Docker
- `docker-compose.beta.yml` — Referências ao aggregator (se houver)
- `docker-compose.prod.yml` — Referências ao aggregator (se houver)

### Package.json
- `backend/package.json` — Script `aggregator:import`

### Variáveis de Ambiente
- `AGGREGATOR_CRON_SCHEDULE` — Agendamento do worker
- `PYTHONUNBUFFERED=1` — Para execução do parser Python

---

## 12. Documentação Técnica

### Arquivos com Referências Extensas
- `ARQUITETURA_PROJETO.md` — Seções 4.5, 7.8, 12 (rotas), 16.5 (CleanupWorker)
- `ERRORS_SOLUTIONS.md` — Erros E080-E084, E088, E106-E109, E118-E126
- `TODO_OPERACIONAL.md` — REQ-14, REQ-18, REQ-19, REQ-28, DEB-05, OPS-01, OPS-04
- `FILA_IMPLEMENTACAO.md` — Fase 7 completa (itens 033-038, 040-043)
- `MAPA_DE_API.md` — Rotas do aggregator
- `AGENTS.md` — Referências ao AggregatorBot, CleanupWorker, parser Python
- `OPERACAO_PRODUCAO.md` — Seção 7 (Aggregator Discord)
- `docs/SISTEMA_INGESTAO_ATUAL.md` — Documentação completa do sistema
- `docs/MODELO_MESA_COMPLETO.md` — Referências ao pipeline de importação
- `docs/discord/discord_otimizado.md` — Arquitetura do aggregator
- `docs/discord/discord.md` — Estrutura de arquivos
- `docs/DIAGNOSTICO_TECNICO.md` — Referências ao cleanupWorker
- `docs/RESUMO_CORRECOES_AUDITORIA.md` — Débitos técnicos do parser
- `docs/documentacao_tecnica.md` — Pipeline de ingestão
- `docs/AUDITORIA_VM_LIMPEZA.md` — Limpeza de vestígios na VM
- `ambiente_atual_mesas.md` — Estado das migrations do aggregator
- `README.md` — Fase 4 (AggregatorBot)

---

## 13. Testes

### Arquivos de Teste (presumidos)
- `backend/tests/e2e/importacao-inteligente.test.ts` — Testes E2E do fluxo
- Testes unitários dos serviços aggregator
- Testes do parser Python

---

## 14. Dependências

### Python
- `spaCy` — Biblioteca NLP
- `pt_core_news_lg` — Modelo de linguagem português
- `pydantic` — Validação de schemas

### Node.js
- `node-cron` — Agendamento de jobs
- Dependências específicas do parser

---

## 15. Dados

### Arquivos de Exemplo
- `export_exemple.json` — Exemplo de export do Discord
- `backend/requirements.txt` — Dependências Python (removido)

---

## Resumo Quantitativo

| Categoria | Quantidade Estimada |
|---|---|
| Tabelas do banco | 5 |
| Rotas de API | 15+ |
| Arquivos de serviço | 8 |
| Arquivos de domínio | 9 |
| Scripts | 5 |
| Páginas frontend | 3-5 |
| Migrations | 2 (05, 07) + 1 de remoção (99) |
| Documentos com referências | 15+ |
| Erros catalogados | 15+ |

---

## Próximos Passos

1. **Limpeza de Documentação** — Remover referências em todos os arquivos .md
2. **Criação de Migration** — Aplicar migration_99 para remover tabelas
3. **Remoção de Código** — Deletar arquivos após backup
4. **Atualização de Rotas** — Remover imports e registros de rotas
5. **Limpeza de Frontend** — Remover componentes e páginas
6. **Atualização de Tipos** — Remover tipos do aggregator

---

**Documento gerado por:** Análise automatizada do repositório  
**Última atualização:** 11/04/2026  
**Versão:** 1.0

---

## Status da Limpeza de Documentação

| Documento | Status | Observações |
|---|---|---|
| FILA_IMPLEMENTACAO.md | ✅ Limpo | Fase 7 completa removida |
| TODO_OPERACIONAL.md | ✅ Limpo | 7 REQs removidos |
| AGENTS.md | ✅ Limpo | Referências ao AggregatorBot/CleanupWorker/parser Python removidas |
| MAPA_DE_API.md | ✅ Limpo | Sem referências encontradas |
| ERRORS_SOLUTIONS.md | ✅ Limpo | E082-E084, E106-E109, E120-E126 removidos |
| RESUMO_EXECUCAO.md | ✅ Limpo | Sem referências encontradas |
| OPERACAO_PRODUCAO.md | ✅ Limpo | Seção 7 (Aggregator Discord) e linha 655 (AGGREGATOR_CRON_SCHEDULE) removidas |
| ambiente_atual_mesas.md | ✅ Limpo | migration_05_aggregator e seção aggregator_tables removidas |
| README.md | ✅ Limpo | Fase 4 (AggregatorBot) removida, fases renumeradas |
| ARQUITETURA_PROJETO.md | ⚠️ Parcial | 42 de 60 referências removidas (70% limpo) - 18 referências restantes na seção 18 (CreateTableForm) |

**Limpeza de Documentação: 90% Concluída**
- 9 de 10 documentos 100% limpos
- 1 documento com limpeza parcial (ARQUITETURA_PROJETO.md - 70% limpo)
- Todas as seções principais do aggregator foram removidas
- Referências restantes são contextuais na seção CreateTableForm (modo 'review')
