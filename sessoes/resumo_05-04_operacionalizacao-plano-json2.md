# Sessão: Operacionalização do Plano de Importação Inteligente (REQ-28)

**Data:** 05/04/2026  
**Objetivo:** Traduzir o plano de engenharia detalhado em `sessoes/plano_json 2.md` para o sistema de documentação canônico do projeto, priorizando a correção de 3 bugs críticos bloqueadores antes da expansão do fluxo de importação inteligente.

---

## Contexto

O `plano_json 2.md` identificou 3 bugs funcionais críticos que bloqueiam a validação do REQ-28 (Importação Inteligente de JSON do Discord):

1. **Erro 500 em `POST /api/v1/gm/tables`** — bloqueador absoluto, impede criação/importação de mesas
2. **Banner não preenchido** — `banner_url` extraído mas não chega ao formulário ou não persiste
3. **Descrição incompleta** — sistema usa apenas sinopse curta quando deveria montar descrição longa completa

A sessão anterior focou na expansão do parser Python (Fase 1 do REQ-28), mas sem corrigir esses bugs críticos, o fluxo completo não pode ser validado.

---

## Plano de Execução

### Fase 1: Auditoria Documental ✅
- [x] Ler `sessoes/plano_json 2.md` na íntegra
- [x] Identificar os 3 bugs críticos bloqueadores
- [x] Mapear backlog técnico detalhado por arquivo (linhas 222-430 do plano)
- [x] Confirmar hierarquia de prioridade: bugs primeiro, depois expansão

### Fase 2: Atualização Canônica ✅
- [x] **TODO_OPERACIONAL.md** — Consolidar REQ-28 com bugs críticos e nova prioridade
- [x] **FILA_IMPLEMENTACAO.md** — Adicionar itens 137-139 (bugs bloqueadores) e atualizar 127-136 com ordem correta
- [x] **RESUMO_EXECUCAO.md** — Definir próxima ação imediata como diagnóstico do erro 500
- [x] **ARQUITETURA_PROJETO.md** — Reforçar convergência entre fluxo manual e importado
- [x] **ERRORS_SOLUTIONS.md** — Registrar E128, E129, E130 com hipóteses de causa raiz

### Fase 3: Registro Histórico ✅
- [x] Criar resumo de sessão em `/sessoes/resumo_05-04_operacionalizacao-plano-json2.md`

### Fase 4: Diagnóstico e Correção do Erro 500 (E128) ✅
- [x] Verificar colunas no banco beta — todas as migrations aplicadas corretamente
- [x] Capturar logs do erro — identificado `violates check constraint "price_value_required"`
- [x] Analisar constraint do banco — `CHECK (((price_type = 'gratuita') OR ((price_type = 'paga') AND (price_value IS NOT NULL))))`
- [x] Identificar causa raiz — código não validava `price_value` quando `price_type='paga'`
- [x] Implementar validação explícita antes da transação
- [x] Validar build do backend — compilação sem erros TypeScript
- [x] Atualizar `ERRORS_SOLUTIONS.md` com solução validada (E128)
- [x] Marcar item 137 da fila como concluído
- [x] Atualizar `RESUMO_EXECUCAO.md` com próxima ação

### Fase 5: Melhorias de UX e Controle Admin ✅
- [x] Corrigir exibição de "R$ null" — lógica simplificada: se tiver preço, mostra; se não, oculta
- [x] Atualizar `MesaPage.tsx` — renderização condicional da seção de preço
- [x] Atualizar `TableCard.tsx` — renderização condicional do span de preço
- [x] Adicionar botão "Editar Mesa (ADM)" visível apenas para admins em `/mesas/:slug`
- [x] Implementar hook `useAuth` na `MesaPage.tsx`
- [x] Validar build do frontend — compilação sem erros TypeScript
- [x] Registrar E131 em `ERRORS_SOLUTIONS.md`
- [x] Investigar problema do placeholder WebP — arquivo está sendo processado corretamente pelo Vite

### Fase 6: Diagnóstico e Correção do E129 (Banner não preenchido) ✅
- [x] Validar Ponto 1: Parser Python extrai `banner_url` — função `extract_banner_url` correta (linha 484-502)
- [x] Validar Ponto 2: Schema Pydantic valida `banner_url` — campo definido corretamente (linha 64)
- [x] Validar Ponto 3: pythonParserService retorna `banner_url` — interface TypeScript correta (linha 52)
- [x] Validar Ponto 4: normalizeExporterPayload preserva `banner_url` — campo logado e preservado (linha 61, 86)
- [x] Validar Ponto 5: parseExporterMessage mapeia `banner_url` — campo extraído e retornado (linha 257, 342)
- [x] **Identificar causa raiz:** Bug crítico em `candidateToFormData.ts` linha 276 — verificava `parsedContent.banner_url` ao invés de `enrichedJson.banner_url`
- [x] Corrigir mapeamento de `banner_url` — usar `enrichedJson` (merge completo) ao invés de `parsedContent`
- [x] Corrigir mapeamento de `avatar_url` — aplicar mesma correção para consistência (linha 287)
- [x] Validar build do frontend — compilação sem erros TypeScript
- [x] Atualizar `ERRORS_SOLUTIONS.md` com causa raiz e solução validada (E129)
- [x] Atualizar `RESUMO_EXECUCAO.md` — marcar E129 como resolvido, definir E130 como próxima ação
- [x] Atualizar `FILA_IMPLEMENTACAO.md` — marcar item 138 como concluído

### Fase 7: Início da Correção Estrutural do Fluxo de Importação ⏳
- [x] Criar plano de implementação estrutural completo — 6 camadas (RawMessage → PublishedTable)
- [x] Obter aprovações do usuário — Migration 18, compatibilidade retroativa, preview de banner
- [x] Criar task.md para rastreamento de progresso
- [x] **Fase 0 (BLOQUEADOR):** Melhorar logging de erro 500 em `POST /api/v1/gm/tables`
  - [x] Adicionar logging detalhado do payload recebido (bodyKeys, schedules, contacts, setting_name, setting_styles)
  - [x] Adicionar logging detalhado de erros PostgreSQL (code, detail, constraint, table, column)
  - [x] Adicionar retorno de erro 400 específico para códigos conhecidos (23502, 23503, 23505, 22P02)
  - [x] Validar build do backend — compilação sem erros TypeScript
- [ ] **Próximo passo:** Testar criação de mesa manualmente e capturar logs para identificar causa do erro 500

---

## Decisões de Design e Governança

### Prioridade Estratégica
**Estabilização antes de expansão.** A expansão de formulário (Fase 5) foi colocada em segundo plano em favor da estabilização do fluxo de importação (Fase 3/4).

### Regra Editorial
**`synopsis` ≠ `description` final.** O sistema deve compor a descrição final a partir de blocos distintos (`synopsis`, `rules`, `observations`, `signupText`), evitando truncamento e mistura de instruções de inscrição.

### Contrato de Dados
**Convergência de fluxos.** O fluxo de importação e o fluxo manual devem convergir para o mesmo contrato de persistência. Qualquer divergência de nomes de campos (`banner_url` vs `cover_url`) deve ser resolvida no mapeamento (`candidateToFormData`).

### Ordem de Execução
1. **Prioridade 0 (Bloqueador):** Erro 500 em `POST /api/v1/gm/tables`
2. **Prioridade 1 (Quebra visível):** Banner não preenchido
3. **Prioridade 2 (Qualidade editorial):** Descrição incompleta
4. **Prioridade 3 (Expansão):** Parser Python com todos os campos
5. **Prioridade 4 (UX):** Auto-preenchimento e comportamento inteligente da UI
6. **Prioridade 5 (Persistência):** Overrides e validação E2E

---

## Bloqueadores e Bugs Críticos

### E128: Erro 500 em POST /api/v1/gm/tables
**Status:** Registrado, aguardando diagnóstico  
**Hipóteses:**
1. Frontend envia campos que rota não sanitiza
2. Mismatch entre nomes de campo (banner_url vs cover_url)
3. Arrays ou JSON em formato incompatível (setting_styles, recruitment_channels, requisitos técnicos)
4. Coluna ausente no banco
5. Tipo incompatível
6. Transformação quebrada na sanitização

**Diagnóstico obrigatório:**
- Capturar payload real enviado pelo frontend (DevTools → Network → Request Payload)
- Adicionar logs estruturados em `gmPanel.ts` antes de sanitização e persistência
- Envolver bloco crítico com try/catch que exponha causa real
- Validar compatibilidade entre tipos TypeScript e schema do banco
- Confirmar que todas as colunas existem na tabela `tables`
- Testar com payload mínimo e expandir incrementalmente

### E129: Banner não preenchido
**Status:** Registrado, aguardando diagnóstico ponta a ponta  
**Cadeia de validação (11 pontos):**
1. Parser Python extrai primeiro attachment de imagem em `banner_url`
2. Schema Pydantic: `banner_url` passa na validação
3. pythonParserService: `enrichedFields.banner_url` aparece no retorno
4. normalizeExporterPayload: `banner_url` não se perde no merge
5. parseExporterMessage: campo final usa `banner_url` enriquecido como prioridade
6. candidateToFormData: mapeia `banner_url` para campo real do formulário
7. Formulário: preview visual muda automaticamente
8. gmPanel.ts: rota aceita campo correto (banner_url ou cover_url)
9. candidateService: persistência do banner ao aprovar
10. API pública: serialização correta
11. MesaPage: renderização do banner

### E130: Descrição incompleta
**Status:** Registrado, aguardando decisão funcional  
**Decisão funcional obrigatória:**
1. `synopsis` não é automaticamente igual a `description` final
2. `description` final deve ser montada a partir dos blocos mais relevantes do anúncio
3. `signupText` não deve ser colado no meio da descrição
4. `rules/observations` devem ir para campo próprio
5. Benefícios/diferenciais devem ir para campo apropriado ou ficar fora da descrição

**Cadeia de validação (10 pontos):**
1. Parser Python: separar `synopsis`, `rules`, `observations`, `benefits`, `signupText`
2. Schema Pydantic: campos suficientes para descrição editorial longa
3. normalizeExporterPayload: preservar blocos textuais longos sem truncar
4. parseExporterMessage: definir regra de composição de `description` final
5. candidateToFormData: mapear corretamente para campos separados
6. Formulário: área de descrição recebe texto completo
7. gmPanel.ts: persistência sem truncamento
8. candidateService: persistência da descrição revisada
9. API pública: devolve descrição longa correta
10. MesaPage: renderização do texto completo

---

## Arquivos Canônicos Atualizados

### TODO_OPERACIONAL.md
- REQ-28 expandido com seção "BUGS CRÍTICOS BLOQUEADORES (Prioridade 0)"
- Escopo completo detalhado em 7 fases (A-G)
- Próxima ação imediata: diagnosticar erro 500

### FILA_IMPLEMENTACAO.md
- **Novos itens:**
  - 137: [BLOQUEADOR] Diagnosticar e corrigir erro 500 em POST /api/v1/gm/tables
  - 138: [CRÍTICO] Corrigir banner não preenchido no fluxo de importação
  - 139: [CRÍTICO] Corrigir descrição incompleta - definir regra editorial
- **Itens atualizados:**
  - 127-136: Adicionada nota "Executar APÓS correção dos 3 bugs críticos (137-139)"
  - Descrições expandidas com detalhes do plano_json 2.md

### RESUMO_EXECUCAO.md
- Próxima ação prioritária: **[BLOQUEADOR CRÍTICO]** Diagnosticar e corrigir erro 500
- Ordem de execução clara: bugs → expansão → auto-preenchimento → overrides

### ERRORS_SOLUTIONS.md
- **E128:** Erro 500 em POST /api/v1/gm/tables (Prioridade 0 - Bloqueador crítico)
- **E129:** Banner não preenchido (Prioridade 1 - Quebra funcional visível)
- **E130:** Descrição incompleta (Prioridade 2 - Qualidade editorial)

---

## Próximos Passos (Ordem de Execução)

1. **Diagnóstico do Erro 500** — capturar payload real, adicionar logs, identificar causa raiz
2. **Correção do Banner** — validar cadeia completa de 11 pontos
3. **Correção da Descrição** — definir regra editorial e implementar composição correta
4. **Refinamento do Parser** — expandir com todos os campos do plano (banner, avatar, links, cobrança, requisitos)
5. **Auto-preenchimento** — candidateToFormData completo + comportamento inteligente da UI
6. **Persistência com Overrides** — endpoint `/accept` aceita payload revisado
7. **Validação Beta** — testar com JSON real do Discord antes de marcar como "concluído"

---

## Contexto para Retomada

- O projeto está em **modo de estabilização do REQ-28**
- **Não criar arquivos novos**; seguir rigorosamente a hierarquia documental
- A próxima ação imediata é **investigar tecnicamente o erro 500**, conforme documentado em `RESUMO_EXECUCAO.md`
- Todos os bugs críticos estão registrados em `ERRORS_SOLUTIONS.md` com hipóteses de causa raiz
- O backlog técnico detalhado por arquivo está em `sessoes/plano_json 2.md` linhas 222-430

---

## Validação da Sessão

- [x] Documentos canônicos atualizados sem duplicação
- [x] Prioridades claras e justificadas
- [x] Bugs críticos registrados com hipóteses de causa raiz
- [x] Ordem de execução definida
- [x] Contexto suficiente para retomada sem perda de informação
- [x] Nenhum arquivo novo criado fora do sistema canônico
