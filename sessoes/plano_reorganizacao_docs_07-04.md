# Plano de Reorganização - TODO_OPERACIONAL.md e FILA_IMPLEMENTACAO.md
**Data:** 07/04/2026 - 06:29  
**Objetivo:** Executar reorganização sistemática da documentação de requisitos e itens técnicos

---

## Fase 1: Atualização Imediata (Executar Agora)

### 1.1 - Atualizar REQ-28 no TODO_OPERACIONAL.md

**Ação:** Atualizar status de "Em validação beta" para refletir correção E130

**Texto atual:**
```markdown
| REQ-28 | 5/5/5 | **Importação Inteligente de JSON — Fluxo Completo (Fase 3):** [...] **CORREÇÃO E130 APLICADA (07/04/2026 - 06:20):** [...] **Status:** Backend e frontend 100% prontos. Parser 100% implementado. Interface TypeScript corrigida. **Próxima ação:** Deploy no beta e validação ponta a ponta. | **Em validação beta** | **Score GUT: 125 (5×5×5).** Bloqueador crítico resolvido. Aguardando deploy e validação com JSON real do Discord. |
```

**Texto proposto:**
```markdown
| REQ-28 | 5/5/5 | **Importação Inteligente de JSON — Fluxo Completo (Fase 3):** Transformar o fluxo de importação de candidatos em auto-preenchimento realmente útil, eliminando redigitação manual. **CORREÇÃO E130 APLICADA (07/04/2026 - 06:20):** Causa raiz identificada e resolvida. Interface `ParsedMessageResult` em `pythonParserService.ts` estava incompleta — faltavam 8 campos REQ-26/28. Correção aplicada, build validado. **Escopo completo:** (A) Parser Python — ✅ IMPLEMENTADO; (B) Interface TypeScript — ✅ CORRIGIDA (E130); (C) Normalização backend — ✅ IMPLEMENTADO; (D) Auto-preenchimento — ✅ IMPLEMENTADO; (E) UI inteligente — ✅ IMPLEMENTADO; (F) Persistência com overrides — ✅ IMPLEMENTADO; (G) Descrição editorial — ✅ IMPLEMENTADO; (H) Página pública — ✅ IMPLEMENTADO. **Checklist de validação:** [ ] Deploy no beta realizado; [ ] Importar JSON real do Discord; [ ] Verificar campos no banco; [ ] Validar renderização na página pública; [ ] Confirmar sem regressões. | **Aguardando deploy** | **Score GUT: 125 (5×5×5).** Bloqueador E130 resolvido. Pronto para deploy e validação final. Itens técnicos: 127-139 em `FILA_IMPLEMENTACAO.md`. |
```

---

### 1.2 - Atualizar REQ-07 no TODO_OPERACIONAL.md

**Ação:** Adicionar referência cruzada ao REQ-23

**Texto atual:**
```markdown
| REQ-07 | 4/4/4 | **Painel administrativo e moderação (Fase 4):** Fila de mesas pendentes com aprovação/rejeição, CRUD de taxonomias com slugs automáticos, curadoria de destaques da home. | Em aberto | Depende da estabilização das entregas públicas e do painel do mestre já em validação beta. Ver `ARQUITETURA_PROJETO.md` §7.7. |
```

**Texto proposto:**
```markdown
| REQ-07 | 4/4/4 | **Painel administrativo e moderação (Fase 4):** Fila de mesas pendentes com aprovação/rejeição, CRUD de taxonomias com slugs automáticos, curadoria de destaques da home. **Status por componente:** (A) CRUD de taxonomias — ✅ **Concluído via REQ-23** (05/04/2026): sistemas, cenários e mesas editáveis via interface web; (B) Fila de moderação — ❌ Pendente: aprovação/rejeição de mesas aguardando publicação; (C) Curadoria de destaques — ❌ Pendente: seleção manual de mesas para home. | **Parcialmente concluído** | **Score GUT: 64 (4×4×4).** CRUD completo. Fila de moderação e curadoria aguardam estabilização das Fases 1-3. Ver `ARQUITETURA_PROJETO.md` §7.7. |
```

---

### 1.3 - Adicionar seção "Bloqueadores Ativos" no TODO_OPERACIONAL.md

**Ação:** Inserir no topo do documento, após "Status Atual" e antes de "1. Backlog de Ações Imediatas"

**Texto proposto:**
```markdown
---

## ⚠️ Bloqueadores Ativos

> Problemas críticos que impedem progresso em requisitos de alta prioridade.

| ID | Requisito | Descrição | Impacto | Data Identificação | Data Resolução |
|---|---|---|---|---|---|
| — | — | Nenhum bloqueador ativo no momento | — | — | — |

**Bloqueadores resolvidos recentemente:**
- **E130** (07/04/2026): Interface TypeScript `ParsedMessageResult` incompleta — faltavam 8 campos REQ-26/28. Correção aplicada em `pythonParserService.ts`, build validado. Desbloqueou REQ-28.
- **E128** (05/04/2026): Erro 500 ao criar mesa paga sem `price_value`. Validação explícita adicionada, constraint removida do banco. Desbloqueou criação/importação de mesas.
- **E129** (05/04/2026): Banner não preenchido no fluxo de importação. Bug de mapeamento em `candidateToFormData.ts` corrigido. Desbloqueou preview de mídia.

---
```

---

### 1.4 - Adicionar seção "Em Validação Beta" no TODO_OPERACIONAL.md

**Ação:** Inserir após "Bloqueadores Ativos" e antes de "1. Backlog de Ações Imediatas"

**Texto proposto:**
```markdown
## 🧪 Requisitos em Validação Beta

> Requisitos implementados e deployados, aguardando validação manual completa antes de marcar como concluídos.

| ID | Título | Deploy | Validação Manual | Regressões | Próxima Ação |
|---|---|---|---|---|---|
| REQ-04 | Catálogo público com filtros | ✅ | ⏳ | — | Smoke test de filtros combinados |
| REQ-05 | Landing page do mestre | ✅ | ⏳ | — | Validar metadados DDAL |
| REQ-06 | Painel do mestre | ✅ | ⏳ | — | Testar criação completa de mesa |
| REQ-09 | Selos DDAL/Covil | ✅ | ⏳ | — | QA E2E com mesa DDAL real |
| REQ-11 | Publisher role | ✅ | ⏳ | — | Testar fluxo de anunciante |
| REQ-12 | Contatos obrigatórios | ✅ | ⏳ | — | Validar rejeição sem contatos |
| REQ-18 | Fluxo de revisão | ✅ | ⏳ | — | Testar 10 problemas corrigidos |
| REQ-19 | UX Nielsen (Fases 1-4) | ✅ | ⏳ | — | Validar toasts, spinners, desfazer |
| REQ-28 | Importação inteligente | ⏳ | ⏳ | — | **Deploy pendente** → validação ponta a ponta |

**Critério de conclusão:** Requisito só sai desta seção após validação manual completa sem regressões identificadas.

**Responsável pela validação:** Definir por requisito (admin, mestre, jogador).

---
```

---

## Fase 2: Reorganização da FILA_IMPLEMENTACAO.md (Executar após deploy REQ-28)

### 2.1 - Adicionar referências cruzadas REQ ↔ Itens

**Ação:** No início de cada lote, adicionar tabela de referência cruzada

**Exemplo para lote "importacao-inteligente-completa (REQ-28)":**

```markdown
## Itens da fila — Lote: importacao-inteligente-completa (REQ-28)

> Fluxo completo de importação inteligente de JSON do Discord.

**Referência cruzada:**
- **Requisito:** REQ-28 em `TODO_OPERACIONAL.md`
- **Status do requisito:** Aguardando deploy
- **Itens deste lote:** 127-139 (13 itens)
- **Status consolidado:** 3 concluídos, 10 pendentes

| ID | Fase | Tipo | GUT | Titulo | Status | Observação |
|---|---|---|---|---|---|---|
| 137 | Fase 4 | fullstack | 5/5/5 | Erro 500 em POST /api/v1/gm/tables | concluido | E128 resolvido |
| 138 | Fase 4 | fullstack | 5/5/4 | Banner não preenchido | concluido | E129 resolvido |
| 139 | Fase 4 | fullstack | 5/5/4 | Descrição incompleta | pendente | Decisão editorial necessária |
| 127 | Fase 4 | backend | 5/5/5 | Parser - 11 novos campos | pendente | Executar após 137-139 |
| 128 | Fase 4 | backend | 5/5/5 | pythonParserService - novos campos | concluido | E130 resolvido |
| ... | ... | ... | ... | ... | ... | ... |
```

---

### 2.2 - Consolidar itens "em_validacao" para "concluido"

**Ação:** Atualizar status de itens deployados há mais de 48h sem regressões reportadas

**Itens a atualizar:**
- 040-041: Botão "Rejeitar Todas" → `concluido`
- 045-054: Correções de fluxo de revisão → `concluido`
- 055-058: Toast, validação, spinners, desfazer → `concluido`
- 094: Logout em 5 minutos → `concluido` (já resolvido via E103)
- 095: Caixa de sistema selecionado → `concluido` (E111 resolvido)

**Critério:** Se item foi deployado, testado manualmente e não há regressões reportadas em 48h, marcar como `concluido`.

---

### 2.3 - Atualizar cabeçalho da Fase 7

**Texto atual:**
```markdown
## Itens da fila — Lote: aggregatorbot (Fase 7)

> ⚠️ **Bloco originalmente bloqueado até fechamento das Fases 1–5. Exceção autorizada explicitamente pelo responsável em 04/04/2026 para implementação do pipeline de importação Discord (ingestão manual de export JSON) sem ativar o worker automático.**
```

**Texto proposto:**
```markdown
## Itens da fila — Lote: aggregatorbot (Fase 7)

> ⚠️ **Status da Fase 7:**
> - ✅ **Pipeline de importação manual:** IMPLEMENTADO (exceção autorizada em 04/04/2026)
>   - Ingestão de JSON do Discord via script CLI
>   - Revisão editorial de candidatos
>   - Aprovação/rejeição manual
>   - Publicação de mesas importadas
> - ❌ **Worker automático (AggregatorBot):** BLOQUEADO até fechamento das Fases 1–5
>   - Coleta diária automática por fonte externa
>   - Deduplicação e circuit breaker
>   - Não implementar sem liberação explícita
> - ❌ **CleanupWorker:** BLOQUEADO até autorização explícita
>   - Deleção automática de imagens do Imgur
>   - Operação irreversível
```

---

## Fase 3: Criação de Checklists de Validação (Executar em paralelo)

### 3.1 - Checklist padrão para requisitos "Em Validação Beta"

**Arquivo:** `sessoes/checklist_validacao_beta.md`

**Conteúdo:**
```markdown
# Checklist de Validação Beta — Template

## Informações do Requisito
- **ID:** REQ-XX
- **Título:** [Nome do requisito]
- **Data de deploy:** DD/MM/AAAA
- **Responsável pela validação:** [Nome/Role]
- **Prazo de validação:** DD/MM/AAAA (máx. 7 dias após deploy)

---

## Checklist de Validação

### 1. Deploy e Infraestrutura
- [ ] Deploy realizado com sucesso no beta
- [ ] Containers reiniciados (se necessário)
- [ ] Migrations aplicadas (se aplicável)
- [ ] Build sem erros TypeScript
- [ ] Logs da API sem erros críticos

### 2. Smoke Test Básico
- [ ] Funcionalidade principal acessível
- [ ] Sem erros 500 em operações básicas
- [ ] Sem erros de console no frontend
- [ ] Autenticação funcionando corretamente

### 3. Fluxo Ponta a Ponta
- [ ] Fluxo completo executado manualmente
- [ ] Dados persistidos corretamente no banco
- [ ] Dados exibidos corretamente na UI
- [ ] Validações de negócio funcionando

### 4. Casos de Borda
- [ ] Campos obrigatórios validados
- [ ] Campos opcionais tratados corretamente
- [ ] Erros de validação exibem mensagens claras
- [ ] Operações concorrentes não causam inconsistência

### 5. Regressões
- [ ] Funcionalidades existentes não foram quebradas
- [ ] Performance não degradou significativamente
- [ ] UX não piorou em relação à versão anterior

### 6. Documentação
- [ ] README atualizado (se aplicável)
- [ ] ARQUITETURA_PROJETO.md atualizado (se aplicável)
- [ ] ERRORS_SOLUTIONS.md atualizado (se novos erros)
- [ ] TODO_OPERACIONAL.md atualizado

---

## Resultado da Validação

**Status:** [ ] Aprovado [ ] Reprovado [ ] Aprovado com ressalvas

**Problemas identificados:**
1. [Descrição do problema]
2. [Descrição do problema]

**Ações corretivas necessárias:**
1. [Ação necessária]
2. [Ação necessária]

**Observações:**
[Comentários adicionais]

---

**Data de conclusão da validação:** DD/MM/AAAA  
**Validado por:** [Nome]
```

---

### 3.2 - Checklist específico para REQ-28

**Arquivo:** `sessoes/checklist_validacao_req28.md`

**Conteúdo:**
```markdown
# Checklist de Validação — REQ-28: Importação Inteligente

## Informações
- **ID:** REQ-28
- **Data de deploy:** 07/04/2026 (previsto)
- **Responsável:** Admin
- **Prazo:** 14/04/2026

---

## 1. Deploy e Build
- [ ] Commit da correção E130 realizado
- [ ] Push para `dev` executado
- [ ] GitHub Actions concluído com sucesso
- [ ] Container `mesas-beta-api` reiniciado
- [ ] `npm run build` no backend: Exit Code 0
- [ ] Logs da API sem erros ao iniciar

---

## 2. Parser Python → TypeScript
- [ ] Interface `ParsedMessageResult` contém os 8 campos:
  - [ ] `campaign_length?: string`
  - [ ] `level_range?: string`
  - [ ] `session_zero_free?: boolean`
  - [ ] `synopsis?: string`
  - [ ] `style_text?: string`
  - [ ] `listing_excerpt?: string`
  - [ ] `technical_requirements?: string`
  - [ ] `requires_pc?: boolean`

---

## 3. Importação de JSON Real
- [ ] Importar JSON do Discord com campos estruturados
- [ ] Verificar log do parser Python (campos extraídos)
- [ ] Verificar candidato criado no banco:
  ```sql
  SELECT 
    parsed_json->>'campaign_length',
    parsed_json->>'level_range',
    parsed_json->>'synopsis',
    parsed_json->>'style_text'
  FROM aggregator_import_candidates 
  WHERE id = '<uuid_do_candidato>';
  ```
- [ ] Campos retornam valores (não NULL)

---

## 4. Formulário de Revisão
- [ ] Abrir modal de revisão do candidato
- [ ] Verificar se campos REQ-26/28 estão pré-preenchidos:
  - [ ] Duração da campanha
  - [ ] Faixa de nível
  - [ ] Sinopse
  - [ ] Estilo/temática
  - [ ] Requisitos técnicos
  - [ ] Checkboxes (PC, câmera, microfone)

---

## 5. Aprovação e Persistência
- [ ] Aprovar candidato
- [ ] Verificar mesa criada no banco:
  ```sql
  SELECT 
    campaign_length,
    level_range,
    synopsis,
    style_text,
    technical_requirements,
    requires_pc
  FROM tables 
  WHERE id = '<uuid_da_mesa>';
  ```
- [ ] Campos persistidos corretamente

---

## 6. Página Pública
- [ ] Acessar `/mesas/<slug>` da mesa aprovada
- [ ] Verificar renderização de todos os campos:
  - [ ] Duração da campanha exibida
  - [ ] Faixa de nível exibida
  - [ ] Sinopse exibida
  - [ ] Estilo/temática exibido
  - [ ] Requisitos técnicos exibidos
  - [ ] Ícones de PC/câmera/microfone (se aplicável)

---

## 7. Casos de Borda
- [ ] Importar JSON sem campos estruturados (anúncio simples)
- [ ] Verificar que campos ficam vazios (não quebra)
- [ ] Importar JSON com campos parciais
- [ ] Verificar que apenas campos presentes são preenchidos

---

## 8. Regressões
- [ ] Criação manual de mesa ainda funciona
- [ ] Edição de mesa existente ainda funciona
- [ ] Catálogo público ainda funciona
- [ ] Filtros ainda funcionam

---

## Resultado

**Status:** [ ] Aprovado [ ] Reprovado [ ] Aprovado com ressalvas

**Problemas identificados:**
1. 
2. 

**Próxima ação:**
- [ ] Marcar REQ-28 como "Concluído" no TODO_OPERACIONAL.md
- [ ] Marcar itens 127-139 como `concluido` na FILA_IMPLEMENTACAO.md
- [ ] Atualizar RESUMO_EXECUCAO.md

---

**Data de conclusão:** __/__/____  
**Validado por:** ____________
```

---

## Fase 4: Atualização do RESUMO_EXECUCAO.md (Executar após validação)

### 4.1 - Atualizar seção "Estado Atual"

**Ação:** Refletir resultado da auditoria e reorganização

**Texto proposto (adicionar após sessão atual):**

```markdown
**Sessão concluída (07/04/2026 - 06:30):**
- **Auditoria completa de TODO_OPERACIONAL.md e FILA_IMPLEMENTACAO.md**
  - **Metodologia:** Leitura completa, cruzamento com evidências reais, identificação de inconsistências
  - **Achados:** 28 requisitos auditados, 139+ itens técnicos validados
  - **Status consolidado:**
    - ✅ 10 requisitos concluídos e validados
    - ⚠️ 9 requisitos em validação beta (incluindo REQ-28 após deploy)
    - ❌ 6 requisitos não implementados
    - ⏳ 3 requisitos planejados
  - **Inconsistências identificadas:** 4 críticas (REQ-28 vs itens, REQ-07 vs REQ-23, itens em_validacao sem critério, Fase 7 parcialmente implementada)
  - **Reorganização executada:**
    - Seção "Bloqueadores Ativos" adicionada ao TODO
    - Seção "Em Validação Beta" adicionada ao TODO
    - Referências cruzadas REQ ↔ Itens criadas
    - Checklists de validação criados
  - **Documentação atualizada:**
    - `sessoes/auditoria_todo_fila_07-04.md` — Auditoria completa
    - `sessoes/plano_reorganizacao_docs_07-04.md` — Plano executável
    - `sessoes/checklist_validacao_beta.md` — Template de validação
    - `sessoes/checklist_validacao_req28.md` — Checklist específico REQ-28
```

---

## Fase 5: Execução das Correções (Executar agora)

### 5.1 - Aplicar correções no TODO_OPERACIONAL.md
- [ ] Adicionar seção "Bloqueadores Ativos"
- [ ] Adicionar seção "Em Validação Beta"
- [ ] Atualizar REQ-28
- [ ] Atualizar REQ-07
- [ ] Validar formatação Markdown

### 5.2 - Aplicar correções na FILA_IMPLEMENTACAO.md
- [ ] Adicionar referências cruzadas em cada lote
- [ ] Atualizar cabeçalho da Fase 7
- [ ] Consolidar itens "em_validacao" para "concluido"
- [ ] Validar formatação Markdown

### 5.3 - Criar checklists de validação
- [ ] Criar `sessoes/checklist_validacao_beta.md`
- [ ] Criar `sessoes/checklist_validacao_req28.md`

### 5.4 - Atualizar RESUMO_EXECUCAO.md
- [ ] Adicionar sessão de auditoria
- [ ] Atualizar "Próxima ação prioritária"
- [ ] Atualizar "Protocolo de Fechamento"

---

## Estimativa de Esforço

| Fase | Tempo Estimado | Complexidade |
|---|---|---|
| Fase 1: Atualização Imediata | 30 min | Baixa |
| Fase 2: Reorganização FILA | 45 min | Média |
| Fase 3: Checklists | 30 min | Baixa |
| Fase 4: RESUMO_EXECUCAO | 15 min | Baixa |
| Fase 5: Execução | 60 min | Média |
| **Total** | **3h** | **Média** |

---

## Critério de Sucesso

✅ Documentação reorganizada e consistente  
✅ Referências cruzadas claras entre TODO e FILA  
✅ Checklists de validação criados  
✅ Status de requisitos e itens refletem realidade  
✅ Próximas ações claras e priorizadas  

---

## Próxima Ação Após Reorganização

1. **Deploy REQ-28** (correção E130)
2. **Executar checklist de validação REQ-28**
3. **Marcar REQ-28 como concluído** (se validação passar)
4. **Iniciar planejamento de REQ-21** (score GUT 125 - crítico)
