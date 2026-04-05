# Sessão: Integração do PRIORIDADES_OBVIAS.MD nos Documentos Canônicos

**Data:** 05/04/2026  
**Objetivo:** Transformar o plano estratégico completo de 735 linhas (PRIORIDADES_OBVIAS.MD) em ações executáveis dentro do sistema de documentação já estabelecido pelo AGENTS.md, editando apenas os documentos canônicos existentes sem criar arquivos novos.

---

## Plano de Execução

1. ✅ Analisar PRIORIDADES_OBVIAS.MD e extrair requisitos técnicos
2. ✅ Verificar duplicações 3x em cada documento canônico
3. ✅ Atualizar TODO_OPERACIONAL.md com 3 novos REQs (REQ-26, REQ-27, REQ-28)
4. ✅ Atualizar FILA_IMPLEMENTACAO.md com 11 novos itens técnicos (113-123)
5. ✅ Atualizar RESUMO_EXECUCAO.md com próxima ação clara
6. ✅ Atualizar ARQUITETURA_PROJETO.md com novos campos e seção 4.6
7. ✅ Atualizar documentos relevantes (protocolo obrigatório)

---

## Task List

- [x] Criar implementation_plan.md com análise completa do PRIORIDADES_OBVIAS.MD
- [x] Identificar 8 blocos de campos (A-H) do formulário
- [x] Mapear campos já implementados vs pendentes
- [x] Buscar duplicações em TODO_OPERACIONAL.md (3x)
- [x] Buscar duplicações em FILA_IMPLEMENTACAO.md (3x)
- [x] Buscar duplicações em ARQUITETURA_PROJETO.md (3x)
- [x] Adicionar REQ-26 (Formulário Expandido - 11 campos) ao TODO
- [x] Adicionar REQ-27 (Agenda Estruturada - table_schedules) ao TODO
- [x] Adicionar REQ-28 (Cenário e Estilos) ao TODO
- [x] Adicionar itens 113-117 (REQ-26) à FILA
- [x] Adicionar itens 118-123 (REQ-27) à FILA
- [x] Atualizar RESUMO_EXECUCAO.md com estado atual e próxima ação
- [x] Adicionar 13 novos campos na seção 4.2 do ARQUITETURA_PROJETO.md
- [x] Criar seção 4.6 sobre table_schedules no ARQUITETURA_PROJETO.md
- [x] Atualizar documentos relevantes (este arquivo em /sessoes/)

---

## Arquivos-Alvo

- `TODO_OPERACIONAL.md` — Adicionados REQ-26, REQ-27, REQ-28
- `FILA_IMPLEMENTACAO.md` — Adicionados itens 113-123 em 2 novos lotes
- `RESUMO_EXECUCAO.md` — Atualizado estado atual e próxima ação prioritária
- `ARQUITETURA_PROJETO.md` — Adicionados 13 campos + seção 4.6 (table_schedules)

---

## Decisões Importantes

### 1. Análise dos 8 Blocos de Campos (PRIORIDADES_OBVIAS.MD Seção 3)

**Bloco A - Identidade da mesa:**
- `master_display_name` ✅ JÁ IMPLEMENTADO (REQ-24, migration_07)
- `publisher_role` ✅ JÁ IMPLEMENTADO (REQ-11, migration_04)
- Cenário (texto livre) ⚠️ PENDENTE → REQ-28
- Idioma ✅ JÁ EXISTE (`language`)

**Bloco B - Tipo e estado:**
- `candidate_kind` ✅ PARSER JÁ EXTRAI (REQ-24)
- Mesa em andamento ✅ JÁ IMPLEMENTADO (migration_09)
- Duração estimada ⚠️ PENDENTE → REQ-26 (`campaign_length`)
- Faixa de nível ⚠️ PENDENTE → REQ-26 (`level_range`)
- Nível de experiência ✅ JÁ EXISTE (`experience_level`)

**Bloco C - Agenda estruturada (CRÍTICO):**
- Repetidor de sessões ⚠️ PENDENTE → REQ-27 (tabela `table_schedules`)
- Parser já extrai `sessions[]` ✅ (REQ-24, migration_07)
- Banco ainda não persiste ⚠️ BLOQUEADOR

**Bloco D - Classificação e cobrança:**
- Classificação indicativa ✅ JÁ EXISTE (`age_rating`)
- Cobrança ✅ JÁ EXISTE (`price_type`)
- `billing_text` ⚠️ PENDENTE → REQ-26
- Sessão zero gratuita ⚠️ PENDENTE → REQ-26 (`session_zero_free`)

**Bloco E - Descrição editorial:**
- Descrição ✅ JÁ EXISTE (`description`)
- Sinopse ⚠️ PENDENTE → REQ-26 (`synopsis`)
- `style_text` ⚠️ PENDENTE → REQ-26
- Regras ✅ JÁ IMPLEMENTADO (`rules_notes`, migration_09)
- Requisitos técnicos ⚠️ PENDENTE → REQ-26 (`technical_requirements`)

**Bloco F - Plataformas e local:**
- Local ✅ JÁ EXISTE (`location`/`modality`)
- Plataformas ✅ JÁ EXISTE (`table_platforms`)
- `requires_pc`, `requires_camera`, `requires_microphone` ⚠️ PENDENTE → REQ-26

**Bloco G - Mídia:**
- Banner ✅ JÁ IMPLEMENTADO (`banner_url`, migration_09)
- Origem ✅ JÁ EXISTE (`cover_source_type`)
- Avatar do publicador ⚠️ DECISÃO: não persiste (REQ-20, Opção B)

**Bloco H - Recrutamento:**
- Canais de recrutamento ✅ JÁ IMPLEMENTADO (`table_contacts`, REQ-12, migration_04)

### 2. Paridade Parser vs Formulário

**Situação atual:**
- Parser Python extrai ~95% dos campos necessários (REQ-24)
- Formulário atual representa ~60% dos campos
- Gap de 35% causa perda de dados e retrabalho manual

**Solução:**
- REQ-26: Adicionar 11 campos faltantes (migration_11)
- REQ-27: Implementar table_schedules (migration_12)
- REQ-28: Sistema de cenário/estilos (migration_13)

**Impacto esperado:**
- Reduzir trabalho manual do admin de 80% para <10%
- Paridade completa entre parser e formulário

### 3. Priorização

**Score GUT:**
- REQ-26: 125 (5×5×5) — Crítico
- REQ-27: 125 (5×5×5) — Crítico (parser já extrai mas não persiste)
- REQ-28: 80 (4×5×4) — Alta prioridade

**Ordem de implementação sugerida:**
1. REQ-27 (Agenda Estruturada) — Bloqueador, dados sendo perdidos
2. REQ-26 (Campos Avançados) — Paridade com parser
3. REQ-28 (Cenário/Estilos) — Melhoria de descoberta

---

## Critério de Conclusão

✅ TODO_OPERACIONAL.md atualizado com REQ-26, REQ-27, REQ-28  
✅ FILA_IMPLEMENTACAO.md atualizado com itens 113-123  
✅ RESUMO_EXECUCAO.md atualizado com próxima ação clara  
✅ ARQUITETURA_PROJETO.md atualizado com novos campos e seção 4.6  
✅ Nenhum arquivo novo criado  
✅ Verificação 3x de duplicação executada para cada adição  
✅ Atualizar documentos relevantes (este resumo em /sessoes/)

---

## Próximos Passos

**Próxima ação prioritária:** Implementar REQ-27 (Agenda Estruturada) antes de REQ-26, pois:
1. Parser já extrai `sessions[]` (REQ-24, migration_07)
2. Dados estão sendo perdidos por falta de persistência
3. É bloqueador para paridade completa

**Itens técnicos:** 118-123 em FILA_IMPLEMENTACAO.md

**Dependências:** Nenhuma (REQ-24 já concluído)

---

## Referências

- `PRIORIDADES_OBVIAS.MD` — Documento estratégico fonte (735 linhas)
- `implementation_plan.md` — Plano detalhado desta sessão
- `TODO_OPERACIONAL.md` — REQ-26, REQ-27, REQ-28
- `FILA_IMPLEMENTACAO.md` — Itens 113-123
- `RESUMO_EXECUCAO.md` — Estado atual atualizado
- `ARQUITETURA_PROJETO.md` — Seção 4.2 (novos campos) + Seção 4.6 (table_schedules)
