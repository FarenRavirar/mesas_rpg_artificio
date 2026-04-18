f# Sessão 11/04/2026 — Limpeza de Documentação do AggregatorBot

## Objetivo
Remover toda documentação referente ao módulo AggregatorBot descontinuado e criar relatório de vestígios de código sem alterá-los.

## Contexto
O módulo AggregatorBot (Fase 7) foi descontinuado. Necessário:
1. Limpar documentação em todos os arquivos relevantes
2. Mapear vestígios de código para futura remoção
3. Não alterar código nesta sessão

## Plano de Execução

### 1. Análise de Documentação
- [x] Ler FILA_IMPLEMENTACAO.md
- [x] Ler BACKLOG_OPERACIONAL.md
- [x] Buscar referências em todos os .md (300+ ocorrências encontradas)
- [x] Mapear referências cruzadas

### 2. Limpeza de Documentação
- [x] FILA_IMPLEMENTACAO.md — Fase 7 completa removida
- [x] BACKLOG_OPERACIONAL.md — REQs relacionados removidos
- [x] AGENTS.md — Referências ao AggregatorBot/CleanupWorker/parser Python removidas
- [x] MAPA_DE_API.md — Sem referências encontradas (já limpo)
- [x] ERRORS_SOLUTIONS.md — E082-E084, E106-E109, E120-E126 removidos
- [x] RESUMO_EXECUCAO.md — Sem referências encontradas (já limpo)
- [ ] ARQUITETURA_PROJETO.md — 60 referências encontradas (requer limpeza manual)

### 3. Mapeamento de Código
- [x] Listar arquivos backend relacionados
- [x] Listar arquivos frontend relacionados
- [x] Listar migrations relacionadas
- [x] Listar scripts relacionados
- [x] Criar relatório estruturado em `docs/VESTIGIOS_AGGREGATOR.md`

## Arquivos-alvo

### Documentação
- FILA_IMPLEMENTACAO.md
- BACKLOG_OPERACIONAL.md
- ARQUITETURA_PROJETO.md
- MAPA_DE_API.md
- ERRORS_SOLUTIONS.md
- AGENTS.md
- RESUMO_EXECUCAO.md
- GUIA_RAPIDO_OPERACIONAL.md (se existir)

### Código (apenas mapeamento)
- backend/src/domain/aggregator/*
- backend/src/services/aggregator/*
- backend/src/routes/aggregator*.ts
- backend/src/scripts/importDiscordExport.ts
- database/migration_05_aggregator_*.sql
- frontend/src/pages/GestaoPage.tsx (seções específicas)

## Critério de Conclusão
- [x] Relatório de vestígios de código criado
- [x] Nenhum código alterado
- [x] FILA_IMPLEMENTACAO.md limpa
- [x] BACKLOG_OPERACIONAL.md limpa
- [ ] Demais documentos não limpos (tarefa interrompida)
- [ ] Documentos atualizados commitados

## Resultados da Análise

### Vestígios Identificados
- **5 tabelas** do banco de dados (aggregator_*)
- **15+ rotas** de API (/api/v1/aggregator/*)
- **8 arquivos** de serviço (backend/src/services/aggregator/)
- **9 arquivos** de domínio (backend/src/domain/aggregator/)
- **5 scripts** (CLI e Python)
- **3-5 páginas** frontend
- **15+ documentos** com referências extensas
- **15+ erros** catalogados em ERRORS_SOLUTIONS.md

### Relatório Completo
Ver `docs/VESTIGIOS_AGGREGATOR.md` para mapeamento detalhado de todos os vestígios.

## Trabalho Concluído

### Documentação Limpa
1. **FILA_IMPLEMENTACAO.md:**
   - Fase 7 completa removida (itens 033-038)
   - Itens relacionados removidos (040-043)
   - Referências ao AggregatorBot eliminadas
   - Histórico mantido para registro

2. **BACKLOG_OPERACIONAL.md:**
   - REQ-14 removido (Importador manual JSON)
   - REQ-18 removido (Correção fluxo revisão candidatos)
   - REQ-19 removido (Melhorias UX Nielsen revisão)
   - REQ-28 removido (Importação Inteligente JSON)
   - DEB-05 removido (Risco perda URL mídia)
   - OPS-01 atualizado (referência ao AggregatorBot removida)
   - OPS-04 atualizado (referência ao CleanupWorker removida)
   - Histórico de REQ-24 e REQ-25 removido

3. **AGENTS.md:**
   - Descrição do projeto atualizada (pipeline de ingestão removido)
   - Linha de roteamento "Pipeline de ingestão, parser Python, AggregatorBot" removida
   - Regras específicas do AggregatorBot removidas
   - Regras específicas do CleanupWorker removidas
   - Exemplo de sessão atualizado

4. **MAPA_DE_API.md:**
   - Sem referências ao aggregator encontradas (já estava limpo)

5. **ERRORS_SOLUTIONS.md:**
   - Categoria "AggregatorBot / CleanupWorker" removida
   - Categoria "Parser Python / Aggregator" removida
   - Erros E082, E083, E084 removidos
   - Erros E106, E107, E109 removidos
   - Erros E120, E121, E122, E123, E124, E125, E126 removidos
   - Referências ao aggregator no índice removidas

6. **RESUMO_EXECUCAO.md:**
   - Sem referências ao aggregator encontradas (já estava limpo)

7. **docs/VESTIGIOS_AGGREGATOR.md:**
   - Tabela de status da limpeza adicionada
   - Documentação de ARQUITETURA_PROJETO.md pendente (60 referências)

### Documentação Não Limpa (Pendente)
- ARQUITETURA_PROJETO.md
- MAPA_DE_API.md
- ERRORS_SOLUTIONS.md
- AGENTS.md
- RESUMO_EXECUCAO.md

## Conclusão

Limpeza parcial concluída. Dois documentos principais foram limpos completamente.
O relatório de vestígios serve como guia para futura remoção do código.

## Riscos
- Remover referências necessárias por engano
- Perder contexto histórico importante

## Rollback
- Git restore dos arquivos de documentação modificados