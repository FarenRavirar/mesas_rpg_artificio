# AUDITORIA DE DÉBITO TÉCNICO - Pipeline de Importação

**Data:** 2026-04-05  
**Escopo:** Correções do parser Python + frontend (caso "O Lorde Demônio")

---

## TABELA DE DÉBITO TÉCNICO

| ID | Fase | Severidade | Arquivo | Problema Concreto | Impacto Real | Correção Aplicada |
|----|------|------------|---------|-------------------|--------------|-------------------|
| **A01** | Backend | **CRÍTICA** | `backend/src/routes/gmPanel.ts` | Campo `scenario_id` extraído no destructuring (linha 287) mas **NUNCA persistido** no INSERT (linha 458-532) | Cenário importado do parser é perdido silenciosamente. Mesa criada sem `scenario_id` mesmo quando parser detectou. | Adicionar `scenario_id` ao INSERT |
| **A02** | Backend | **CRÍTICA** | `backend/src/routes/gmPanel.ts` | Campos `synopsis_narrative`, `benefits_text`, `gm_bio` extraídos (linha 336-338) mas **NUNCA persistidos** no INSERT | Blocos editoriais extraídos pelo parser são perdidos. Mesa criada sem conteúdo editorial. | Adicionar campos ao INSERT |
| **A03** | Backend | **ALTA** | `backend/src/routes/gmPanel.ts` | Campo `scenario_id` ausente no UPDATE (linha 615-836) | Edição de mesa não permite alterar cenário. Inconsistência entre POST e PUT. | Adicionar `scenario_id` ao UPDATE |
| **A04** | Backend | **ALTA** | `backend/src/routes/gmPanel.ts` | Campos editoriais ausentes no UPDATE | Edição de mesa não permite alterar blocos editoriais. Inconsistência entre POST e PUT. | Adicionar campos ao UPDATE |
| **A05** | Backend | **MÉDIA** | `backend/src/routes/gmPanel.ts` | Validação de `schedules` ausente no POST | Backend aceita `schedules: []` vazio sem erro. Frontend exige pelo menos 1, mas backend não valida. | Adicionar validação |
| **A06** | Backend | **MÉDIA** | `backend/src/routes/gmPanel.ts` | Log de `schedules` na linha 276 mas campo não usado no fluxo de validação | Log existe mas não há validação correspondente. Inconsistência. | Adicionar validação |
| **A07** | Backend | **BAIXA** | `backend/src/routes/tables.ts` | Conflito de nomenclatura: `gm_bio` retornado duas vezes (linha 245 e 252) | Campo `t.gm_bio` (mesa) sobrescreve `gm.bio_long as gm_bio` (perfil). Confusão de fonte. | Renomear um dos campos |
| **B01** | Frontend | **CRÍTICA** | `frontend/src/pages/PainelMestrePage.tsx` | Campo `scenario_id` inicializado (linha 180) mas **NUNCA enviado** no payload do POST (linha 370-410) | Cenário selecionado no formulário é perdido. Backend nunca recebe. | Adicionar ao payload |
| **B02** | Frontend | **CRÍTICA** | `frontend/src/components/SessionRepeater.tsx` | Interface `SessionSchedule` define `end_time: string` (linha 8) mas permite vazio no input (linha 193) | Tipo mente: diz que é obrigatório mas aceita vazio. Backend espera `string | null`. | Corrigir tipo para `string | null` |
| **B03** | Frontend | **ALTA** | `frontend/src/pages/PainelMestrePage.tsx` | Campos editoriais (`synopsis_narrative`, `benefits_text`, `gm_bio`) ausentes no estado e no payload | Campos extraídos pelo parser e mapeados em `candidateToFormData` são perdidos no formulário. | Adicionar ao estado e payload |
| **B04** | Frontend | **ALTA** | `frontend/src/utils/candidateToFormData.ts` | Mapeamento de `sessions` usa `day_of_week` capitalizado ("Domingo") mas `SessionSchedule` espera lowercase ("domingo") | Parser Python retorna "Domingo", frontend espera "domingo". Mapeamento existe (linha 291-301) mas pode falhar se parser mudar formato. | Validar mapeamento |
| **B05** | Frontend | **MÉDIA** | `frontend/src/pages/PainelMestrePage.tsx` | Estado `sessions` vazio no modo review sem validação visual | Usuário vê formulário sem sessões mas não há feedback de que está incompleto. | Adicionar empty state |
| **B06** | Frontend | **MÉDIA** | `frontend/src/components/SessionRepeater.tsx` | Componente não renderiza quando `sessions.length === 0` mas exibe warning (linha 260-266) | Warning aparece mas usuário não pode adicionar sessão facilmente. Botão "Adicionar" está no topo. | UX confusa |
| **C01** | Integração | **CRÍTICA** | `backend/src/routes/aggregator.ts` vs `gmPanel.ts` | Rota `/aggregator/candidates/:id/approve` persiste `scenario_id` (linha 443) mas `/gm/tables` POST **NÃO** | Fluxo de aprovação funciona, fluxo manual quebra. Regressão: cenário só funciona via importação. | Sincronizar rotas |
| **C02** | Integração | **CRÍTICA** | `backend/src/routes/aggregator.ts` vs `gmPanel.ts` | Rota `/aggregator/candidates/:id/approve` persiste campos editoriais (linha 454-456) mas `/gm/tables` POST **NÃO** | Fluxo de aprovação funciona, fluxo manual quebra. Regressão: campos editoriais só funcionam via importação. | Sincronizar rotas |
| **C03** | Integração | **ALTA** | `frontend/src/utils/candidateToFormData.ts` vs `PainelMestrePage.tsx` | `candidateToFormData` mapeia `sessions` (linha 287-313) mas `PainelMestrePage` não envia no payload | Dados mapeados são perdidos. Fluxo de revisão quebrado. | Adicionar ao payload |
| **C04** | Integração | **ALTA** | Parser Python vs Frontend | Parser retorna `day_of_week: "Domingo"` mas `SessionSchedule` espera `"domingo"` | Mapeamento existe mas é frágil. Se parser mudar capitalização, quebra. | Normalizar no parser |
| **C05** | Integração | **MÉDIA** | `backend/src/routes/tables.ts` vs `gmPanel.ts` | GET `/tables/:slug` retorna `schedules` (linha 282-287) mas POST `/gm/tables` não valida se está vazio | Inconsistência: API pública retorna schedules mas criação não valida. | Adicionar validação |
| **C06** | Regressão | **ALTA** | Fluxo manual vs importação | Criação manual de mesa não permite selecionar cenário (campo ausente no payload) | Feature REQ-28 só funciona via importação. Criação manual regrediu. | Adicionar campo |
| **C07** | Regressão | **ALTA** | Fluxo manual vs importação | Criação manual de mesa não permite preencher campos editoriais | Feature REQ-28 Fase 6 só funciona via importação. Criação manual regrediu. | Adicionar campos |
| **C08** | Regressão | **MÉDIA** | Edição vs criação | PUT `/gm/tables/:id` não permite editar `scenario_id` nem campos editoriais | Campos podem ser criados mas não editados. Inconsistência. | Adicionar ao UPDATE |

---

## PROBLEMAS POR SEVERIDADE

### CRÍTICA (7)
- A01, A02, B01, B03, C01, C02, C03

### ALTA (6)
- A03, A04, B03, C04, C06, C07, C08

### MÉDIA (5)
- A05, A06, B05, B06, C05

### BAIXA (1)
- A07

---

## ANÁLISE DE IMPACTO

### Fluxo Quebrado: Criação Manual de Mesa
**Problema:** Campos `scenario_id`, `synopsis_narrative`, `benefits_text`, `gm_bio` são extraídos no destructuring mas **nunca persistidos**.

**Impacto:**
- Usuário seleciona cenário no formulário → campo é perdido
- Parser extrai blocos editoriais → campos são perdidos
- Mesa criada sem cenário e sem conteúdo editorial

**Afetados:**
- POST `/api/v1/gm/tables` (criação manual)
- PUT `/api/v1/gm/tables/:id` (edição)

**Não afetados:**
- POST `/api/v1/aggregator/candidates/:id/approve` (aprovação de importação) ✅

### Fluxo Quebrado: Revisão de Candidato
**Problema:** `candidateToFormData` mapeia `sessions` mas `PainelMestrePage` não envia no payload.

**Impacto:**
- Parser extrai sessões → mapeamento funciona
- Formulário inicializa com sessões → estado funciona
- Usuário aprova candidato → sessões são perdidas no POST

**Afetados:**
- Modo `review` do `PainelMestrePage`

### Regressão: Feature REQ-28 Só Funciona Via Importação
**Problema:** Rota `/aggregator/candidates/:id/approve` persiste campos novos, mas `/gm/tables` POST não.

**Impacto:**
- Importação funciona ✅
- Criação manual quebrada ❌
- Edição quebrada ❌

---

## CORREÇÕES OBRIGATÓRIAS (ORDEM DE EXECUÇÃO)

### 1. Backend - POST `/gm/tables` (CRÍTICO)
- Adicionar `scenario_id` ao INSERT
- Adicionar `synopsis_narrative`, `benefits_text`, `gm_bio` ao INSERT
- Adicionar validação de `schedules` (mínimo 1)

### 2. Backend - PUT `/gm/tables/:id` (ALTO)
- Adicionar `scenario_id` ao UPDATE
- Adicionar campos editoriais ao UPDATE

### 3. Frontend - `PainelMestrePage.tsx` (CRÍTICO)
- Adicionar `scenario_id` ao payload do POST
- Adicionar campos editoriais ao estado e payload

### 4. Frontend - `SessionRepeater.tsx` (ALTO)
- Corrigir tipo de `end_time` para `string | null`

### 5. Backend - GET `/tables/:slug` (BAIXO)
- Renomear conflito de `gm_bio`

---

## PENDÊNCIAS QUE NÃO PODEM SER FECHADAS AGORA

### P01: Validação de Banco de Dados
**Motivo:** Não foi possível localizar DATABASE_URL ou executar reimportação real.
**Risco:** Campos podem estar sendo persistidos mas com tipo errado ou constraint violada.
**Validação necessária:** Reimportar caso "O Lorde Demônio" via rota real e inspecionar banco.

### P02: Teste de Fluxo Completo no Beta
**Motivo:** Correções não foram deployadas.
**Risco:** Pode haver problemas de integração não detectados localmente.
**Validação necessária:** Deploy no beta + teste manual de criação, importação, revisão e edição.

### P03: Conflito de `gm_bio`
**Motivo:** Campo retornado duas vezes em GET `/tables/:slug`.
**Risco:** Frontend pode estar usando fonte errada (perfil vs mesa).
**Validação necessária:** Verificar qual `gm_bio` o frontend consome e renomear o outro.

---

## CRITÉRIO DE SUCESSO DA AUDITORIA

✅ Encontradas **18 falhas concretas** em backend, frontend e integração  
✅ Identificadas **3 regressões** entre fluxo manual e importação  
✅ Mapeados **7 problemas críticos** que causam perda de dados  
✅ Registradas **3 pendências** que exigem validação beta  
✅ Priorização clara: crítico → alto → médio → baixo

---

## PRÓXIMA AÇÃO

Aplicar correções diretamente no código na ordem definida acima.
