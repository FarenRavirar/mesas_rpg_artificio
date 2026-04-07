# RESUMO DE CORREÇÕES — AUDITORIA TÉCNICA

**Data:** 2026-04-07  
**Auditor:** Sistema  
**Status:** Correções críticas aplicadas

---

## ✅ Correções Aplicadas

### Backend

**DT-01, DT-02: Validação de slots no POST** ✅
- **Arquivo:** `backend/src/routes/gmPanel.ts` (linhas 351-367)
- **Correção:** Validação completa de `slots_total` (1-100) e `slots_open` (0-slots_total)
- **Impacto:** Previne dados inconsistentes no banco

**DT-04: Validação de slots no PUT** ✅
- **Arquivo:** `backend/src/routes/gmPanel.ts` (linhas 813-839)
- **Correção:** Validação na edição com queries para valores atuais
- **Impacto:** Previne edição que quebre relação slots_open <= slots_total

### Frontend

**DT-06, DT-07: Validação client-side** ✅
- **Arquivo:** `frontend/src/components/form-steps/steps/StepConfig.tsx` (linhas 280-287)
- **Correção:** `max={form.slots_total}` dinâmico + hint text explicativo
- **Impacto:** Previne erro 400, melhora UX (H5 - Prevenção de erros)

### Database

**DT-11: Backfill de mesas antigas** ✅
- **Arquivo:** `database/backfill_slots_open.sql`
- **Execução:** Rodado no beta (0 mesas afetadas - todas já tinham valor)
- **Impacto:** Previne TypeError em mesas antigas

---

## ⚠️ Pendências Críticas

### DT-08: Exibição de slots_open nos cards ❌
- **Arquivo:** `frontend/src/components/TableCard.tsx`
- **Problema:** Campo implementado mas invisível
- **Impacto:** Feature não usada
- **Correção necessária:** Adicionar exibição `{table.slots_total} jogadores / {table.slots_open} vagas abertas`

### DT-09: Exibição de slots_open na página de detalhes ❌
- **Arquivo:** `frontend/src/pages/MesaPage.tsx`
- **Problema:** Informação crítica ausente
- **Impacto:** Jogador não sabe quantas vagas estão abertas
- **Correção necessária:** Adicionar no bloco de informações da mesa

### DT-10: Validação no hook ❌
- **Arquivo:** `frontend/src/features/create-table/hooks/useCreateTableForm.ts`
- **Problema:** Validação só no backend
- **Impacto:** Erro 400 sem feedback amigável
- **Correção necessária:** Adicionar validação antes de submit

### DT-12: Parser Python não extrai slots_open ❌
- **Arquivo:** `backend/src/services/aggregator/parser/discord_message_parser.py`
- **Problema:** Perda de informação em importações
- **Impacto:** Anúncio "2 vagas de 5" vira "5 vagas de 5"
- **Correção necessária:** Expandir parser ou aceitar limitação

### DT-13: Edição não carrega valor atual ❌
- **Arquivo:** `frontend/src/features/create-table/hooks/useCreateTableForm.ts`
- **Problema:** `initialData` não inclui `slots_open`
- **Impacto:** Dado perdido ao editar
- **Correção necessária:** Carregar `slots_open` do backend

### DT-14: candidateService não persiste slots_open ❌
- **Arquivo:** `backend/src/services/aggregator/candidateService.ts`
- **Problema:** Mesas importadas sempre têm todas vagas abertas
- **Impacto:** Perda de informação
- **Correção necessária:** Adicionar `slots_open` no INSERT

### DT-15, DT-16: Modal de cenário não testado ❌
- **Arquivo:** `frontend/src/pages/GestaoPage.tsx`, `frontend/src/components/ScenarioEditModal.tsx`
- **Problema:** Botão adicionado mas modal pode não funcionar
- **Impacto:** Erro de runtime
- **Correção necessária:** Testar criação de cenário no beta

### DT-18: Campo audience removido incompletamente ❌
- **Problema:** Frontend removeu, backend e banco mantêm
- **Impacto:** Inconsistência de dados
- **Correção necessária:** Decidir se remove coluna ou aceita NULL

### DT-19: Conflito type 'campaign' vs 'campanha' ❌
- **Arquivo:** `backend/src/domain/aggregator/normalizeExporterPayload.ts`
- **Problema:** Parser retorna inglês, banco aceita português
- **Impacto:** Erro 500 ao aprovar candidato importado
- **Correção necessária:** Normalizar `type` antes de persistir

### DT-20: system_id não validado como obrigatório ❌
- **Arquivo:** `backend/src/routes/gmPanel.ts` (linha 343)
- **Problema:** Mesa pode ser criada sem sistema
- **Impacto:** Dados incompletos, filtros quebram
- **Correção necessária:** Adicionar validação

---

## 📊 Resumo Quantitativo

| Categoria | Total | Corrigidos | Pendentes |
|---|---|---|---|
| **Críticos** | 7 | 3 | 4 |
| **Altos** | 8 | 1 | 7 |
| **Médios** | 4 | 0 | 4 |
| **Baixos** | 1 | 0 | 1 |
| **TOTAL** | 20 | 4 | 16 |

**Taxa de correção:** 20% (4/20)

---

## 🔍 Riscos que Exigem Validação Manual

### 1. Fluxo de Criação Manual
- ✅ Validação backend funciona
- ✅ Validação frontend funciona
- ❌ Exibição nos cards ausente
- ❌ Exibição na página ausente

**Teste necessário:** Criar mesa manual no beta e verificar se vagas aparecem

### 2. Fluxo de Edição
- ✅ Validação backend funciona
- ❌ Carregamento de valor atual ausente
- ❌ Pode perder dado ao editar

**Teste necessário:** Editar mesa existente e verificar se `slots_open` é preservado

### 3. Fluxo de Importação
- ❌ Parser não extrai `slots_open`
- ❌ Service não persiste corretamente
- ❌ Sempre usa default = total

**Teste necessário:** Importar JSON e verificar se vagas são corretas

### 4. Regressão de Mesas Antigas
- ✅ Backfill executado
- ✅ Todas mesas têm valor
- ⚠️ Verificar se GET público não retorna NULL

**Teste necessário:** Abrir catálogo e verificar se cards renderizam

---

## 🚀 Próximos Passos Recomendados

### Prioridade 0 (Bloqueadores)
1. **DT-19:** Normalizar `type` antes de persistir (erro 500 em importação)
2. **DT-20:** Validar `system_id` obrigatório (dados incompletos)

### Prioridade 1 (Críticos)
3. **DT-08:** Adicionar exibição nos cards (feature invisível)
4. **DT-09:** Adicionar exibição na página (informação ausente)
5. **DT-13:** Carregar valor atual na edição (perda de dados)

### Prioridade 2 (Altos)
6. **DT-10:** Validação no hook (UX)
7. **DT-12:** Parser extrair `slots_open` (perda de informação)
8. **DT-14:** Service persistir `slots_open` (importação)

### Prioridade 3 (Médios)
9. **DT-15, DT-16:** Testar modal de cenário
10. **DT-18:** Decidir sobre campo `audience`

---

## ✅ O Que Foi Corrigido

1. **Validação backend POST:** Previne dados inválidos na criação
2. **Validação backend PUT:** Previne dados inválidos na edição
3. **Validação frontend:** Previne erro 400, melhora UX
4. **Backfill database:** Previne TypeError em mesas antigas

---

## ❌ O Que Continuou Pendente

1. **Exibição nos cards e páginas:** Feature invisível
2. **Fluxo de edição:** Pode perder dados
3. **Fluxo de importação:** Perda de informação
4. **Conflitos de tipo:** Erro 500 em importação
5. **Validação de sistema:** Dados incompletos

---

## ⚠️ Riscos Ainda Exigem Validação Beta

1. **Criar mesa manual:** Verificar se vagas aparecem nos cards
2. **Editar mesa:** Verificar se `slots_open` é preservado
3. **Importar JSON:** Verificar se vagas são corretas
4. **Abrir catálogo:** Verificar se cards renderizam sem erro
5. **Criar cenário:** Verificar se modal funciona

---

## 📝 Fluxos que Precisam Ser Testados no Beta

### Teste 1: Criação Manual
1. Acessar `/painel-mestre`
2. Criar mesa com 5 jogadores, 2 vagas abertas
3. Verificar se salva sem erro
4. Abrir catálogo
5. **Esperado:** Card mostra "5 jogadores / 2 vagas abertas"
6. **Atual:** Card não mostra vagas ❌

### Teste 2: Edição
1. Abrir mesa existente para editar
2. Verificar se campo `slots_open` está preenchido
3. **Esperado:** Campo mostra valor atual
4. **Atual:** Campo pode estar vazio ❌

### Teste 3: Validação
1. Tentar criar mesa com 10 vagas abertas e 5 jogadores
2. **Esperado:** Erro 400 claro
3. **Atual:** Erro 400 com mensagem clara ✅

### Teste 4: Importação
1. Importar JSON com anúncio "2 vagas de 5"
2. Aprovar candidato
3. Abrir mesa publicada
4. **Esperado:** Mostra "5 jogadores / 2 vagas abertas"
5. **Atual:** Mostra "5 jogadores / 5 vagas abertas" ❌

---

## 🎯 Conclusão

**Correções críticas aplicadas:** 4/20 (20%)  
**Pendências críticas:** 4  
**Pendências altas:** 7  
**Validação beta necessária:** 5 fluxos

**Status geral:** ⚠️ **Implementação parcial com riscos conhecidos**

A implementação de `slots_open` está **funcionalmente correta no backend** mas **invisível no frontend** e **incompleta nos fluxos de edição e importação**.

**Recomendação:** Completar DT-08, DT-09, DT-13 antes de deploy para produção.
