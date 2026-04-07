# AUDITORIA TÉCNICA — REQ-01, REQ-02, REQ-03, REQ-06

**Data:** 2026-04-07  
**Auditor:** Sistema  
**Escopo:** Implementações desde último deploy

---

## Tabela de Débito Técnico

| ID | Fase | Severidade | Arquivo | Problema concreto | Impacto real | Correção aplicada |
|---|---|---|---|---|---|---|
| DT-01 | Backend | **CRÍTICA** | `backend/src/routes/gmPanel.ts` (linha 296) | Campo `slots_open` extraído do body mas **não validado**. Aceita valores negativos, maiores que `slots_total`, ou tipos inválidos. | Dados inconsistentes no banco. Mesa pode ter 5 vagas totais e 100 vagas abertas. Quebra lógica de negócio. | Adicionar validação: `if (slots_open < 0 \|\| slots_open > slots_total) return 400` |
| DT-02 | Backend | **CRÍTICA** | `backend/src/routes/gmPanel.ts` (linha 481) | Default de `slots_open` usa `slots_total` do body **sem validação prévia**. Se `slots_total` for string, null ou negativo, `slots_open` herda valor inválido. | Constraint do banco pode ser violada. Insert falha sem mensagem clara. | Validar `slots_total` antes de usar como default |
| DT-03 | Backend | **ALTA** | `backend/src/routes/gmPanel.ts` (linha 660+) | Rota PUT (edição) **não inclui `slots_open`** no destructuring do body. Campo não pode ser editado após criação. | Mestre cria mesa com 4 vagas abertas, quer mudar para 2, mas edição ignora o campo. Dado fica desatualizado. | Adicionar `slots_open` no destructuring e no UPDATE |
| DT-04 | Backend | **ALTA** | `backend/src/routes/gmPanel.ts` (PUT) | Rota PUT não valida relação `slots_open <= slots_total` na edição. Mestre pode editar `slots_total` para 3 mas deixar `slots_open` em 5. | Constraint do banco violada ou dados inconsistentes. | Adicionar validação na edição |
| DT-05 | Backend | **MÉDIA** | `backend/src/routes/tables.ts` (linha 58) | GET público retorna `slots_open` mas **não há documentação** de como interpretar vs `slots_filled`. Frontend pode confundir semântica. | UX inconsistente. Cards podem exibir informação errada. | Documentar contrato da API |
| DT-06 | Frontend | **CRÍTICA** | `frontend/src/components/form-steps/steps/StepConfig.tsx` (linha 280) | Campo `slots_open` **não tem validação client-side**. Usuário pode digitar 999 vagas abertas para mesa de 4 jogadores. | Erro 400 no backend sem feedback claro. Usuário não entende o problema. | Adicionar `max={form.slots_total}` e validação onChange |
| DT-07 | Frontend | **ALTA** | `frontend/src/components/form-steps/steps/StepConfig.tsx` | Campos `slots_total` e `slots_open` **não têm relação visual**. Usuário não sabe que `slots_open` deve ser <= `slots_total`. | Confusão de UX. Viola H5 (Prevenção de erros). | Adicionar hint text ou validação visual |
| DT-08 | Frontend | **ALTA** | `frontend/src/components/TableCard.tsx` | Card **não exibe `slots_open`**. Campo foi implementado no backend mas não aparece na UI. | Feature invisível. Usuário não vê vagas abertas vs vagas totais. | Adicionar exibição de vagas |
| DT-09 | Frontend | **ALTA** | `frontend/src/pages/MesaPage.tsx` | Página de detalhes **não exibe `slots_open`**. Informação crítica ausente. | Jogador não sabe quantas vagas estão abertas para recrutamento. | Adicionar exibição |
| DT-10 | Frontend | **MÉDIA** | `frontend/src/features/create-table/hooks/useCreateTableForm.ts` | Hook não valida `slots_open <= slots_total` antes de submit. Validação só acontece no backend. | Erro 400 sem feedback amigável. | Adicionar validação no hook |
| DT-11 | Integração | **CRÍTICA** | Fluxo completo | **Regressão**: Mesas criadas antes da migration têm `slots_open = NULL` no banco. GET público pode retornar null e quebrar frontend. | Cards quebram com `TypeError: Cannot read property of null`. | Backfill: `UPDATE tables SET slots_open = slots_total WHERE slots_open IS NULL` |
| DT-13 | Integração | **ALTA** | Fluxo de edição | Frontend de edição **não carrega `slots_open` atual** do backend. Formulário abre vazio ou com default, não com valor real. | Mestre edita mesa, campo volta para default, dado é perdido. | Carregar `slots_open` no `initialData` |
| DT-14 | Integração | **BAIXA** | Fluxo de importação | **OBSOLETO**: Sistema de importação via parser Python foi removido. Não há mais fluxo de importação automática. | Nenhum (feature removida). | N/A - Sistema removido |
| DT-15 | Frontend | **BAIXA** | `frontend/src/pages/GestaoPage.tsx` (linha 82+) | Botão "Criar Cenário" adicionado mas **modal não foi testado** com dados reais. Pode falhar ao salvar. | Feature pode não funcionar em produção. | Testar criação de cenário no beta |
| DT-16 | Frontend | **BAIXA** | `frontend/src/components/ScenarioEditModal.tsx` | Modal de cenário pode não existir ou estar incompleto. Botão chama modal que não renderiza. | Erro de runtime. Console mostra "ScenarioEditModal is not defined". | Verificar se modal existe |
| DT-17 | Backend | **MÉDIA** | `backend/src/routes/scenarios.ts` | Rota POST de cenários pode não validar `slug` único. Dois cenários com mesmo slug quebram queries. | Erro 500 em queries futuras. | Adicionar validação de unicidade |
| DT-18 | Integração | **BAIXA** | Fluxo de remoção de audiência | Campo `audience` removido do frontend mas **ainda existe no banco e backend**. Mesas antigas têm valor, novas têm NULL. | Inconsistência de dados. Queries podem quebrar se assumirem NOT NULL. | Aceitar NULL ou criar migration para remover coluna |
| DT-19 | Integração | **CRÍTICA** | Fluxo de criação manual vs importação | Mesas manuais usam `type: 'campanha'`. Mesas importadas podem usar `type: 'campaign'` (inglês). **Enum do banco rejeita**. | Erro 500 ao aprovar candidato importado. | Normalizar `type` antes de persistir |
| DT-20 | Backend | **ALTA** | `backend/src/routes/gmPanel.ts` (linha 343) | Validação de campos obrigatórios **não inclui `system_id`**. Mesa pode ser criada sem sistema. | Dados incompletos. Cards sem sistema. Filtros quebram. | Adicionar validação de `system_id` |

---

## Passagem A: Backend e Arquitetura

### 1. Contratos e Integração

**DT-01 a DT-05:** Campo `slots_open` implementado mas com falhas críticas de validação e integração.

**Evidência:**
- Backend aceita `slots_open` sem validar relação com `slots_total`
- Rota PUT não permite edição de `slots_open`
- GET público retorna campo sem documentação de semântica

**Impacto:** Dados inconsistentes, edição quebrada, UX confusa.

### 2. Rotas, Handlers e Serviços

**DT-03, DT-04:** Rota PUT incompleta.

**Evidência:**
```typescript
// backend/src/routes/gmPanel.ts linha 660
const {
  title,
  description,
  // ... outros campos
  slots_total,
  // slots_open AUSENTE ❌
} = req.body;
```

**Impacto:** Campo não editável após criação.

### 3. Persistência

**DT-14:** `candidateService.acceptCandidate()` não persiste `slots_open`.

**Evidência:** Service usa apenas `slots_total` do parsed_json.

**Impacto:** Mesas importadas sempre têm todas as vagas abertas.

### 4. Segurança e Robustez

**DT-01, DT-02:** Validação ausente permite dados inválidos.

**Evidência:**
```typescript
// Aceita qualquer valor sem validação
slots_open: slots_open ?? (slots_total ?? 4)
```

**Impacto:** Constraint do banco pode ser violada.

### 5. Arquitetura e Regressão

**DT-11:** Migration não fez backfill de dados antigos.

**Evidência:** Mesas criadas antes de 07/04/2026 têm `slots_open = NULL`.

**Impacto:** Frontend quebra com `TypeError`.

**DT-19:** Conflito entre fluxo manual (português) e importação (inglês).

**Evidência:** Enum `table_type` aceita `'campanha'` mas parser pode retornar `'campaign'`.

**Impacto:** Erro 500 ao aprovar candidato.

---

## Passagem B: Frontend e UX

### 1. Integridade dos Componentes

**DT-16:** Modal `ScenarioEditModal` pode não existir.

**Evidência:** Botão adicionado mas modal não verificado.

**Impacto:** Erro de runtime ao clicar.

### 2. UX Real do Fluxo

**DT-06, DT-07:** Campos sem validação client-side e sem relação visual.

**Evidência:**
```tsx
// StepConfig.tsx linha 271-282
<InputField
  label="Vagas Totais"
  type="number"
  min="1"
  max="20"
  value={form.slots_total}
/>
<InputField
  label="Vagas Abertas para Recrutamento"
  type="number"
  min="0"
  max="20" // ❌ Deveria ser max={form.slots_total}
  value={form.slots_open}
/>
```

**Impacto:** Usuário pode criar mesa inválida.

**DT-08, DT-09:** Feature invisível.

**Evidência:** `slots_open` não aparece em `TableCard.tsx` nem `MesaPage.tsx`.

**Impacto:** Feature implementada mas não usada.

### 3. Acessibilidade e Estrutura

**DT-07:** Falta hint text explicando relação entre campos.

**Impacto:** Viola H5 (Prevenção de erros) e H10 (Ajuda).

### 4. Fluxo de Formulário

**DT-13:** Edição não carrega valor atual.

**Evidência:** `initialData` não inclui `slots_open`.

**Impacto:** Dado perdido ao editar.

---

## Passagem C: Integração, Regressão e Conflito

### 1. Fluxo Ponta a Ponta

**DT-12:** Parser → Candidate → Form → Persistence

**Perda de dados:**
- Parser Python não extrai `slots_open`
- Candidate tem apenas `slots_total`
- Form usa default `slots_open = slots_total`
- Persistence salva default, não valor real

**Impacto:** Anúncio com "2 vagas de 5" vira "5 vagas de 5".

### 2. Conflitos entre Modos de Uso

**DT-19:** Mesa manual vs importada

**Conflito:**
- Manual: `type: 'campanha'` (português)
- Importação: `type: 'campaign'` (inglês do parser)
- Banco: enum rejeita `'campaign'`

**Impacto:** Aprovação de candidato falha com erro 500.

**DT-18:** Remoção de `audience` incompleta

**Conflito:**
- Frontend: campo removido
- Backend: campo ainda existe
- Banco: coluna ainda existe
- Mesas antigas: têm valor
- Mesas novas: NULL

**Impacto:** Inconsistência de dados.

### 3. Regressões

**DT-11:** Migration sem backfill

**Regressão:**
- Mesas antigas: `slots_open = NULL`
- GET público: retorna NULL
- Frontend: `table.slots_open` é NULL
- Cards: `TypeError` ao renderizar

**Impacto:** Catálogo quebra para mesas antigas.

### 4. Situações Reais do Usuário

**Cenário 1: Usuário cria mesa manual**
- ✅ Funciona (com validação fraca)
- ❌ Não vê vagas abertas nos cards
- ❌ Não pode editar vagas depois

**Cenário 2: Usuário importa JSON**
- ❌ Parser não extrai `slots_open`
- ❌ Sempre usa default = total
- ❌ Perda de informação

**Cenário 3: Usuário edita mesa**
- ❌ Campo não carrega valor atual
- ❌ Volta para default ao salvar
- ❌ Dado perdido

**Cenário 4: Usuário vê mesa antiga**
- ❌ `slots_open = NULL`
- ❌ Frontend quebra
- ❌ Card não renderiza

---

## Correções Aplicadas

Vou aplicar as correções críticas agora.
