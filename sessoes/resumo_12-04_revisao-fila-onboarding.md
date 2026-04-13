# Sessão — 12/04/2026 — Revisão da Fila e Onboarding de Mesas

## Objetivo da sessão

Refazer a fila de implementação adicionando itens com prioridade imediata:
1. Auditoria completa de cobertura das APIs (o que é usado, o que está órfão)
2. Revisão e correção do onboarding de criação de mesas (bugs + UX)
3. Melhorias nas taxonomias de sistemas e cenários (versão PT/EN, sugestões pelo mestre)

## Plano de execução

1. [x] Ler FILA_IMPLEMENTACAO.md (estado atual)
2. [x] Ler TODO_OPERACIONAL.md (REQs existentes)
3. [x] Ler RESUMO_EXECUCAO.md (próxima ação)
4. [ ] Criar arquivo de sessão
5. [ ] Adicionar novo lote `revisao-onboarding-mesas` na FILA_IMPLEMENTACAO.md
6. [ ] Adicionar novo lote `auditoria-cobertura-apis` na FILA_IMPLEMENTACAO.md
7. [ ] Adicionar novos REQs no TODO_OPERACIONAL.md (REQ-29, REQ-30)
8. [ ] Atualizar RESUMO_EXECUCAO.md com próxima ação

## Checklist completa

- [x] Sessão iniciada — arquivo criado
- [ ] FILA_IMPLEMENTACAO.md atualizada com itens 141–152
- [ ] TODO_OPERACIONAL.md atualizado com REQ-29 e REQ-30
- [ ] RESUMO_EXECUCAO.md atualizado
- [ ] Atualizar documentos relevantes

## Arquivos-alvo

- `FILA_IMPLEMENTACAO.md`
- `TODO_OPERACIONAL.md`
- `RESUMO_EXECUCAO.md`

## Critério de conclusão

- FILA_IMPLEMENTACAO.md contém novos lotes com itens numerados (141+)
- TODO_OPERACIONAL.md contém REQ-29 e REQ-30
- RESUMO_EXECUCAO.md atualizado com próxima ação

## Itens planejados para a FILA

### Lote: revisao-onboarding-mesas (Fase 3)

| ID | Tipo | GUT | Título | Notas |
|----|------|-----|--------|-------|
| 141 | frontend | 5/5/5 | Corrigir: editar mesa abre página vazia | Bug crítico |
| 142 | backend+front | 5/5/5 | Corrigir: erro de token ao desativar mesa | Bug crítico |
| 143 | banco+back | 4/5/4 | Campo name_pt em sistemas e cenários | Versão PT do nome |
| 144 | frontend | 4/5/4 | Exibir nome PT/EN no onboarding e catálogo | UX bilíngue |
| 145 | frontend | 4/5/4 | Sugestão de novo sistema/cenário pelo mestre | CRUD de sugestão |
| 146 | frontend | 4/5/4 | Corrigir duplicata de frequência (Etapa 3) | Bug UX |
| 147 | frontend | 5/5/5 | Redesenho do bloco de vagas (simplificar) | Vagas confusas |
| 148 | frontend | 5/5/4 | Conectar editor rico aos campos de texto longo | TipTap |
| 149 | frontend | 3/4/3 | Preview da imagem ao digitar URL de banner | UX |

### Lote: auditoria-cobertura-apis

| ID | Tipo | GUT | Título | Notas |
|----|------|-----|--------|-------|
| 150 | docs | 2/5/3 | Mapear rotas backend sem cobertura frontend | DEB-06 |
| 151 | frontend | 4/5/4 | Implementar telas para APIs órfãs críticas | DEB-06 |