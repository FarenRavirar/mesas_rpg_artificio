# 26-04-15_5_unificacao-docs.md

**Data:** 15/04/2026 16:30 BRT  
**Objetivo:** Unificar nomenclatura e estrutura entre BACKLOG_OPERACIONAL.md e FILA_IMPLEMENTACAO.md

---

## Vínculos

- **Sessão Anterior:** `26-04-15_4_organizacao-fila.md`
- **Próxima Sessão:** —

---

## O que foi feito

### 1. Análise de divergência

| Aspecto | BACKLOG | FILA |
|---------|---------|------|
| ID | REQ-21, DEB-06, OPS-02 | 075, 086, 100 |
| Colunas | ID, GUT, Descrição, Status, 一步 | ID, GUT, Descrição, 一步, Dependências, Arquivos |
| Histórico | Checkboxes + data | Texto simples |

### 2. Mapeamento por conteúdo

Identificados os itens que existem em ambos documentos:
- REQ-21 ↔ 084 (faixa etária)
- REQ-29 ↔ DEB-06 (auditoria API)
- REQ-30 ↔ 086 (frequência)
- REQ-26 ↔ 085 (nível mesa)
- REQ-21 ↔ 100, 097, 098 (cenário/estilos)

Itens técnicos exclusivos da FILA (059-067, 082, 089, 096) mapeados como "itens técnicos sem correspondência de produto".

### 3. Estrutura unificada

**BACKLOG_OPERACIONAL.md (§1-4):**
- §1: Índice por prioridade (com coluna "FILA ref")
- §2: Backlog ativo com colunas: ID, GUT,一步, FILA ref, Status
- §3: Mapeamento BACKLOG ↔ FILA
- §4: Histórico com referência FILA

**FILA_IMPLEMENTACAO.md (§1-5):**
- §1: Formato obrigatório
- §2: Índice por prioridade (com coluna "BACKLOG ref")
- §3: Detalhes com colunas: ID, GUT,一步, Status
- §4: Mapeamento FILA ↔ BACKLOG
- §5: Histórico com referência BACKLOG

---

## Checklist

- [x] Analisar divergência entre documentos
- [x] Mapear itens por conteúdo (não número)
- [x] Atualizar BACKLOG com colunas unificadas + mapeamento
- [x] Atualizar FILA com colunas unificadas + mapeamento
- [x] Unificar formato Histórico
- [x] Verificar AGENTS.md (já correto)
- [x] Verificar .cursorrules-docs (já correto)
- [x] Criar sessão de resumo
- [x] Atualizar RESUMO_EXECUCAO.md

---

## Arquivos modificados

- `BACKLOG_OPERACIONAL.md` — estrutura unificada + mapeamento
- `FILA_IMPLEMENTACAO.md` — estrutura unificada + mapeamento
- `sessoes/26-04-15_5_unificacao-docs.md` — sessão criada

---

## Critério de Conclusão

- [x] Ambos documentos com estrutura paralela
- [x] Mapeamento por conteúdo disponível
- [x] Histórico com referência cruzada
- [x] Índice com colunas correspondentes
- [x] RESUMO_EXECUCAO.md atualizado
- [x] index.md atualizado

---

## Status

**Concluído** — Unificação de nomenclatura e estrutura BACKLOG ↔ FILA implementada.