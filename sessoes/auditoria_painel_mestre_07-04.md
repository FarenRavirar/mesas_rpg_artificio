# Auditoria Rigorosa: Gerenciamento de Mesas — Painel do Mestre
**Data:** 07/04/2026  
**Escopo:** Todas as interações do usuário em `https://mesasbeta.artificiorpg.com/painel` relacionadas ao gerenciamento de mesas (criação, edição, ativação/desativação, deleção).

---

## PASSAGEM A: BACKEND E ARQUITETURA

### A1. Rotas de Gerenciamento de Mesas

#### ✅ POST `/api/v1/gm/tables` — Criação de Mesa
**Status:** Implementado e robusto  
**Validações presentes:**
- ✅ Campos obrigatórios: `title`, `type`, `modality`, `system_id`
- ✅ Validação de `slots_total` (1-100) e `slots_open` (≥0, ≤ slots_total)
- ✅ Validação de frequência obrigatória para campanhas/one-shot-série
- ✅ Validação de contatos (mínimo 1, estrutura completa)
- ✅ Validação de `publisher_role` + `actual_gm_name` (announcer exige nome do GM)
- ✅ Validação DDAL (código, nome, tier obrigatórios + sistema elegível)
- ✅ Validação VTT Platform (slug → UUID, modalidade compatível)
- ✅ Validação de `price_value` quando `price_type='paga'`
- ✅ Validação de `is_covil` restrita a role `admin`
- ✅ Persistência de schedules com validação de `day_of_week` (enum)
- ✅ Persistência de campos avançados (REQ-26)
- ✅ Persistência de campos editoriais (REQ-28 Fase 6)
- ✅ Transação atômica (table + contacts + schedules)

**Tratamento de erros:**
- ✅ Códigos PostgreSQL específicos (23502, 23503, 23505, 22P02)
- ✅ Mensagens de erro contextualizadas
- ✅ Logging estruturado com payload completo

**⚠️ FALHA A1:** Falta validação de `scenario_id` quando fornecido
```typescript
// Linha 543: Persiste scenario_id sem validar se existe
scenario_id: req.body.scenario_id ?? null,
```
**Impacto:** Mesa pode ser criada com `scenario_id` inválido, causando FK constraint violation silencioso ou referência órfã.

**⚠️ FALHA A2:** Falta validação de `frequency_custom` quando `frequency='outros'`
```typescript
// Linha 397: Valida apenas se frequency_custom está presente
if (safeFrequency === 'outros' && !safeFrequencyCustom) {
  return res.status(400).json({ error: 'Quando frequência for "Outros", informe a descrição customizada.' });
}
```
**Impacto:** Validação correta, mas não há limite de caracteres. Campo pode receber texto excessivamente longo.

---

#### ✅ PUT `/api/v1/gm/tables/:id` — Edição de Mesa Própria
**Status:** Implementado com validações parciais  

**Validações presentes:**
- ✅ Ownership (gm_id = gmProfile.id)
- ✅ Validação de `slots_total` e `slots_open` (linhas 881-904)
- ✅ Validação de `publisher_role` + `actual_gm_name`
- ✅ Validação DDAL completa
- ✅ Atualização de contacts (delete + insert)
- ✅ Atualização de schedules (delete + insert)
- ✅ Persistência de campos avançados (REQ-26)
- ✅ Persistência de campos editoriais (REQ-28)

**❌ FALHA A3:** Falta validação de `system_id` quando alterado
```typescript
// Linha 912: Persiste system_id sem validar se existe
system_id: hasOwn('system_id') ? (system_id ?? null) : undefined,
```
**Impacto:** Mesa pode ser editada com `system_id` inválido, causando FK constraint violation.

**❌ FALHA A4:** Falta validação de `scenario_id` quando alterado
```typescript
// Linha 543 (POST) valida, mas PUT não tem validação equivalente
```
**Impacto:** Edição pode introduzir `scenario_id` inválido.

**❌ FALHA A5:** Falta validação de VTT Platform na edição
```typescript
// POST valida vtt_platform_id (linhas 406-428), mas PUT não tem essa lógica
```
**Impacto:** Edição pode introduzir `vtt_platform_id` inválido ou incompatível com modalidade.

**❌ FALHA A6:** Falta validação de `price_value` quando `price_type` é alterado para 'paga'
```typescript
// POST valida (linhas 486-493), mas PUT não tem validação equivalente
```
**Impacto:** Mesa pode ser alterada para paga sem valor válido.

**❌ FALHA A7:** Falta validação de `frequency` obrigatória para campanhas
```typescript
// POST valida (linhas 356-359), mas PUT não valida quando type é alterado
```
**Impacto:** Mesa pode ser alterada para campanha sem frequência.

**❌ FALHA A8:** Schedules não são validados na edição
```typescript
// Linhas 1015-1031: Insere schedules sem validar estrutura (day_of_week, start_time, frequency)
```
**Impacto:** Edição pode introduzir schedules inválidos, causando erro de enum no PostgreSQL.

---

#### ⚠️ PATCH `/api/v1/gm/tables/:id/status` — Alteração de Status
**Status:** Implementado, mas com conflito de rota  

**Validações presentes:**
- ✅ Status válido: `['active', 'full', 'cancelled', 'ended']`
- ✅ Ownership (gm_id = gmProfile.id)

**❌ FALHA A9: CONFLITO DE ROTA CRÍTICO**
```typescript
// Linha 728: PUT /tables/:id — Edição completa de mesa
router.put('/tables/:id', authMiddleware, async (req: Request, res: Response) => { ... });

// Linha 1238: PUT /tables/:id — Atualização de status (compatibilidade frontend)
router.put('/tables/:id', authMiddleware, async (req: Request, res: Response) => { ... });
```
**Impacto CRÍTICO:** Express registra apenas a primeira rota. A segunda rota (linha 1238) **NUNCA É EXECUTADA**. Isso significa que o frontend que chama `PUT /tables/:id` com `{ status }` está na verdade chamando a rota de edição completa (linha 728), que **NÃO VALIDA NEM PERSISTE O STATUS**.

**Evidência:**
- Linha 728-1057: Rota PUT completa não tem `status` no destructuring do `req.body`
- Linha 909: `set()` não inclui `status`
- Linha 1238-1276: Rota duplicada nunca é alcançada

**Consequência:** Botões "Ativar"/"Desativar" no frontend **NÃO FUNCIONAM**.

---

#### ✅ DELETE `/api/v1/gm/tables/:id` — Deleção de Mesa Própria
**Status:** Implementado corretamente  

**Validações presentes:**
- ✅ Ownership (gm_id = gmProfile.id)
- ✅ Transação atômica (schedules → contacts → table)
- ✅ Mensagem de sucesso com título da mesa

**Observação:** Ordem de deleção está correta (schedules primeiro, depois contacts, depois table).

---

#### ✅ PUT `/api/v1/admin/tables/:id` — Edição Administrativa
**Status:** Implementado com validações robustas  

**Validações presentes:**
- ✅ Role `admin` obrigatória
- ✅ Validação de `system_id` (linhas 1418-1429)
- ✅ Validação de `scenario_id` (linhas 1431-1442)
- ✅ Validação de `is_covil` restrita a admin (linha 1509)
- ✅ Persistência de todos os campos REQ-26/28 (linhas 1480-1500)

**✅ CORREÇÃO CONFIRMADA:** Campos REQ-26/28 estão presentes (correção B06 aplicada).

---

#### ✅ DELETE `/api/v1/admin/tables/:id` — Deleção Administrativa
**Status:** Implementado corretamente  

**Validações presentes:**
- ✅ Role `admin` obrigatória
- ✅ Transação atômica (contacts → table)

**⚠️ FALHA A10:** Falta deleção de schedules
```typescript
// Linhas 1553-1566: Deleta apenas contacts, não schedules
await trx.deleteFrom('table_contacts').where('table_id', '=', id).execute();
await trx.deleteFrom('tables').where('id', '=', id).execute();
```
**Impacto:** Schedules órfãos permanecem no banco se admin deletar mesa. Violação de integridade referencial se FK não tiver `ON DELETE CASCADE`.

---

#### ✅ GET `/api/v1/gm/tables` — Listagem de Mesas Próprias
**Status:** Implementado corretamente  

**Campos retornados:**
- ✅ Todos os campos básicos da mesa
- ✅ Campos avançados (REQ-26): `master_display_name`, `campaign_length`, etc.
- ✅ Campos editoriais (REQ-28): `setting_name`, `setting_styles`
- ✅ Métricas de engajamento: `metrics_views`, `metrics_clicks`, `metrics_contacts`, `metrics_favorites`
- ✅ Contatos (join com `table_contacts`)
- ✅ Schedules (join com `table_schedules`)

**Observação:** Rota está completa e retorna todos os dados necessários para o dashboard.

---

### A2. Modelo de Dados (types.ts)

#### ✅ TablesTable (linhas 198-277)
**Status:** Modelo completo e consistente  

**Campos presentes:**
- ✅ Todos os campos básicos
- ✅ VTT Platform (migration 006): `vtt_platform_id`, `game_platform_custom`, `game_platform_legacy`
- ✅ Campos avançados (REQ-26): linhas 257-268
- ✅ Campos editoriais (REQ-28): linhas 269-274
- ✅ Schedules: `frequency`, `frequency_custom`
- ✅ DDAL: todos os campos
- ✅ Flags: `is_covil`, `is_ddal`, `featured`, `session_zero_free`

**Observação:** Modelo está alinhado com as migrations e com o código das rotas.

---

#### ✅ TableSchedulesTable (linhas 293-305)
**Status:** Modelo correto  

**Campos:**
- ✅ `day_of_week`: DayOfWeek (enum com 7 valores)
- ✅ `start_time`: string (TIME)
- ✅ `end_time`: string | null
- ✅ `frequency`: ScheduleFrequency (enum)
- ✅ `slots_per_session`: number | null
- ✅ `is_ongoing`: boolean (default false)
- ✅ `notes`: string | null
- ✅ `sort_order`: number (default 0)

**Observação:** Modelo está correto e alinhado com a validação no POST (linhas 637-651).

---

### A3. Integridade Referencial

**❌ FALHA A11:** Falta verificação de FK constraints no código
- `system_id` → `systems.id`: Validado apenas no admin PUT, não no GM PUT
- `scenario_id` → `scenarios.id`: Não validado em nenhuma rota
- `vtt_platform_id` → `vtt_platforms.id`: Validado apenas no POST, não no PUT
- `gm_id` → `gm_profiles.id`: Validado implicitamente via ownership

**Impacto:** Dependência excessiva de constraints do PostgreSQL. Erros de FK retornam 500 em vez de 400 com mensagem clara.

---

### A4. Transações e Atomicidade

**✅ POST `/gm/tables`:** Transação completa (table + contacts + schedules)  
**✅ PUT `/gm/tables/:id`:** Transação completa (table + contacts + schedules)  
**✅ DELETE `/gm/tables/:id`:** Transação completa (schedules + contacts + table)  
**⚠️ DELETE `/admin/tables/:id`:** Transação incompleta (falta schedules)

---

### A5. Sanitização e Segurança

**✅ Sanitização robusta:**
- `sanitizeStringArray` (linha 22)
- `sanitizeOptionalText` (linha 27)
- `sanitizeNickname` (linha 33)
- `sanitizeOptionalTier` (linha 47)
- `parseOptionalBoolean` (linha 54)
- `sanitizePublisherRole` (linha 64)
- `sanitizeContactsPayload` (linha 70)

**✅ Validação de role admin para `is_covil`:**
- POST: linha 451
- Admin PUT: linha 1509

**Observação:** Sanitização está bem implementada e consistente.

---

## RESUMO PASSAGEM A: BACKEND

### Falhas Críticas (Bloqueadoras)
1. **A9 — CONFLITO DE ROTA:** PUT `/tables/:id` duplicado. Alteração de status **NÃO FUNCIONA**.

### Falhas Graves (Alta Prioridade)
2. **A3 — Falta validação de `system_id` no PUT**
3. **A5 — Falta validação de VTT Platform no PUT**
4. **A6 — Falta validação de `price_value` no PUT**
5. **A7 — Falta validação de `frequency` no PUT**
6. **A8 — Falta validação de schedules no PUT**

### Falhas Moderadas
7. **A1 — Falta validação de `scenario_id` no POST**
8. **A4 — Falta validação de `scenario_id` no PUT**
9. **A10 — Falta deleção de schedules no admin DELETE**

### Falhas Menores
10. **A2 — Falta limite de caracteres em `frequency_custom`**
11. **A11 — Dependência excessiva de FK constraints do PostgreSQL**

---

## PASSAGEM B: FRONTEND E UX

### B1. PainelMestrePage.tsx — Página Principal do Painel

#### ✅ Estrutura Geral
**Status:** Implementado corretamente  

**Componentes presentes:**
- ✅ Formulário de criação de perfil GM (`CreateGmProfileForm`)
- ✅ Dashboard com KPIs de métricas (visualizações, contatos, conversão)
- ✅ Listagem de mesas com `TableCardDashboard`
- ✅ Integração com `CreateTableForm` para criação/edição

**Observação:** Estrutura está bem organizada e segue padrões React modernos.

---

#### ✅ Gestão de Estado
**Status:** Implementado corretamente  

**Estados gerenciados:**
- ✅ `gmProfile`: Perfil do mestre logado
- ✅ `myTables`: Lista de mesas com métricas
- ✅ `view`: Controle de navegação (dashboard | create-table | create-profile)
- ✅ `editingTableId`: ID da mesa em edição
- ✅ `editingTableData`: Dados da mesa carregados para edição
- ✅ `togglingTableId`: Loading state para ativação/desativação
- ✅ `deletingTableId`: Loading state para deleção

**Observação:** Estados de loading (B3, B4) foram corrigidos.

---

#### ❌ FALHA B1: Fetch de mesa para edição usa endpoint errado
```typescript
// Linha 293: Usa /tables/:id em vez de /gm/tables/:id
const response = await fetch(`${apiUrl}/api/v1/tables/${editId}`, {
  headers: { Authorization: `Bearer ${token}` },
});
```
**Impacto:** Endpoint `/tables/:id` é público e não retorna dados completos (schedules, contacts detalhados). Edição pode carregar dados incompletos.

**Correção esperada:** Usar `GET /api/v1/gm/tables` e filtrar pelo ID, ou criar endpoint `GET /api/v1/gm/tables/:id`.

---

#### ❌ FALHA B2: handleToggleTableStatus usa endpoint e status incorretos
```typescript
// Linha 387: Status 'inactive' não existe no enum TableStatus
const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

// Linha 395-397: Endpoint admin não existe
const endpoint = user?.role === 'admin'
  ? `${apiUrl}/api/v1/gm/admin/tables/${tableId}`
  : `${apiUrl}/api/v1/gm/tables/${tableId}`;
```
**Impacto CRÍTICO:** 
1. Status `'inactive'` não existe no backend (enum: `'draft' | 'active' | 'full' | 'cancelled' | 'ended' | 'pending_review'`)
2. Endpoint `/gm/admin/tables/:id` não existe (correto seria `/admin/tables/:id`)
3. Devido à **FALHA A9** (conflito de rota), o PUT `/gm/tables/:id` não persiste status

**Consequência:** Botões "Ativar"/"Desativar" **NÃO FUNCIONAM** por múltiplas razões.

---

#### ❌ FALHA B3: handleDeleteTable usa endpoint admin incorreto
```typescript
// Linha 430-432: Endpoint admin não existe
const endpoint = user?.role === 'admin'
  ? `${apiUrl}/api/v1/gm/admin/tables/${tableId}`
  : `${apiUrl}/api/v1/gm/tables/${tableId}`;
```
**Impacto:** Admin não consegue deletar mesas pelo painel. Endpoint correto seria `/admin/tables/:id`.

---

#### ✅ Métricas de Engajamento
**Status:** Implementado corretamente  

**KPIs calculados:**
- ✅ `totalViews`: Soma de visualizações de todas as mesas
- ✅ `totalContacts`: Soma de contatos de todas as mesas
- ✅ `conversionRate`: Taxa de conversão (contatos/visualizações)

**Observação:** Cálculo está correto e usa `useMemo` para otimização.

---

#### ✅ Fluxo de Edição
**Status:** Implementado com ressalvas  

**Fluxo:**
1. ✅ URL com `?edit=<id>` carrega dados da mesa
2. ✅ `editingTableData` é passado para `CreateTableForm` como `initialData`
3. ⚠️ Após sucesso, `refreshData()` limpa query params (linha 326)

**⚠️ FALHA B4:** Falta validação se mesa pertence ao GM antes de carregar
```typescript
// Linha 290-310: Carrega mesa sem validar ownership
const response = await fetch(`${apiUrl}/api/v1/tables/${editId}`, {
  headers: { Authorization: `Bearer ${token}` },
});
```
**Impacto:** GM pode tentar editar mesa de outro GM se souber o ID. Backend bloqueia, mas UX fica confusa.

---

### B2. CreateTableForm.tsx — Formulário de Criação/Edição

#### ✅ Estrutura de Steps
**Status:** Implementado corretamente  

**Steps:**
1. ✅ StepBasic: Título, descrição, tipo, modalidade, público, preço, vagas
2. ✅ StepSystem: Sistema e cenário
3. ✅ StepSessions: Horários e frequência
4. ✅ StepConfig: Publisher role, VTT, comunicação
5. ✅ StepFinal: Contatos, DDAL, campos avançados, banner
6. ✅ StepReview: Revisão final

**Observação:** Estrutura modular e bem organizada.

---

#### ✅ Hooks Customizados
**Status:** Implementado corretamente  

**Hooks utilizados:**
- ✅ `useCreateTableForm`: Gerencia todo o estado do formulário
- ✅ `useStepNavigation`: Controla navegação entre steps
- ✅ `useAutosave`: Salva rascunho automaticamente

**Observação:** Separação de responsabilidades está correta.

---

#### ✅ Restore de Draft
**Status:** Implementado corretamente  

**Fluxo:**
1. ✅ Carrega draft do localStorage ao montar componente
2. ✅ Exibe modal perguntando se deseja restaurar
3. ✅ Restaura todos os campos do formulário (linhas 116-147)
4. ✅ Limpa draft após submissão bem-sucedida (linha 61)

**Observação:** Implementação robusta e completa.

---

#### ❌ FALHA B5: Fetch de sistemas não usa VITE_API_URL
```typescript
// Linha 91: URL hardcoded sem variável de ambiente
const res = await fetch('/api/v1/systems?view=tree');
```
**Impacto:** Funciona em produção (mesma origem), mas pode falhar em desenvolvimento local se backend estiver em porta diferente.

---

#### ❌ FALHA B6: Fetch de cenário não usa VITE_API_URL
```typescript
// Linha 175: URL hardcoded sem variável de ambiente
const res = await fetch(`/api/v1/scenarios/${formHook.selectedScenarioId}`);
```
**Impacto:** Mesmo que B5.

---

#### ✅ Validação de DDAL
**Status:** Implementado corretamente  

**Lógica:**
- ✅ Desabilita DDAL automaticamente se sistema não for elegível (linhas 189-193)
- ✅ Valida path_slug contra `DDAL_ELIGIBLE_PATH` (linha 159-161)

**Observação:** Validação está correta e alinhada com backend.

---

### B3. useCreateTableForm.ts — Hook de Gerenciamento de Estado

#### ✅ Estado Completo
**Status:** Implementado corretamente  

**Campos gerenciados:**
- ✅ Todos os campos básicos (title, description, type, modality, etc.)
- ✅ Sistema e cenário
- ✅ Sessões (schedules)
- ✅ Frequência e frequência customizada
- ✅ VTT Platform e comunicação
- ✅ Publisher role e nome do GM real
- ✅ Contatos
- ✅ DDAL (todos os campos)
- ✅ Campos avançados (REQ-26)
- ✅ Cenário e estilos (REQ-28)

**Observação:** Estado está completo e alinhado com backend.

---

#### ✅ Validação Frontend
**Status:** Implementado corretamente  

**Validações presentes:**
- ✅ `slots_total` >= 1 (linha 189)
- ✅ `slots_open` >= 0 (linha 195)
- ✅ `slots_open` <= `slots_total` (linha 201)

**Observação:** Validações básicas estão presentes, mas faltam validações mais complexas.

---

#### ❌ FALHA B7: Submit sempre usa POST, nunca PUT para edição
```typescript
// Linha 211: Sempre POST, mesmo quando initialData está presente
const res = await fetch('/api/v1/gm/tables', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});
```
**Impacto CRÍTICO:** Edição de mesa **NÃO FUNCIONA**. Sempre cria nova mesa em vez de atualizar existente.

**Correção esperada:**
```typescript
const isEditing = !!initialData?.id;
const method = isEditing ? 'PUT' : 'POST';
const endpoint = isEditing ? `/api/v1/gm/tables/${initialData.id}` : '/api/v1/gm/tables';
```

---

#### ❌ FALHA B8: Falta validação de contatos antes de submit
```typescript
// Linha 180-232: Submit não valida se há pelo menos 1 contato válido
```
**Impacto:** Frontend permite submeter sem contatos, backend rejeita com erro genérico.

---

#### ❌ FALHA B9: Falta validação de frequência para campanhas
```typescript
// Linha 180-232: Submit não valida se frequência é obrigatória para type='campanha'
```
**Impacto:** Frontend permite submeter campanha sem frequência, backend rejeita.

---

#### ❌ FALHA B10: Falta validação de price_value quando price_type='paga'
```typescript
// Linha 180-232: Submit não valida se price_value > 0 quando price_type='paga'
```
**Impacto:** Frontend permite submeter mesa paga sem valor, backend rejeita.

---

#### ❌ FALHA B11: Falta validação de actual_gm_name quando publisher_role='announcer'
```typescript
// Linha 180-232: Submit não valida se actual_gm_name está preenchido quando publisher_role='announcer'
```
**Impacto:** Frontend permite submeter anunciante sem nome do GM, backend rejeita.

---

#### ❌ FALHA B12: Falta validação de campos DDAL obrigatórios
```typescript
// Linha 180-232: Submit não valida se ddal_code, ddal_name, ddal_tier estão preenchidos quando is_ddal=true
```
**Impacto:** Frontend permite submeter DDAL sem campos obrigatórios, backend rejeita.

---

#### ✅ Dirty State Tracking
**Status:** Implementado corretamente  

**Funcionalidades:**
- ✅ Aviso ao sair da página com mudanças não salvas (linhas 133-143)
- ✅ Limpa dirty state após submissão bem-sucedida (linha 226)

**Observação:** Implementação correta e melhora UX.

---

### B4. Componentes de Steps (Análise Superficial)

**Observação:** Não foi feita análise profunda dos componentes individuais de steps (StepBasic, StepSystem, etc.), mas assumindo que seguem o padrão estabelecido.

**Pontos a verificar em auditoria futura:**
- Validação de campos obrigatórios em cada step
- Feedback visual de erros
- Acessibilidade (labels, ARIA, navegação por teclado)
- Responsividade mobile

---

## RESUMO PASSAGEM B: FRONTEND

### Falhas Críticas (Bloqueadoras)
1. **B7 — Submit sempre usa POST:** Edição de mesa **NÃO FUNCIONA**
2. **B2 — handleToggleTableStatus usa status e endpoint incorretos:** Ativação/desativação **NÃO FUNCIONA**

### Falhas Graves (Alta Prioridade)
3. **B1 — Fetch de mesa para edição usa endpoint público:** Dados incompletos
4. **B3 — handleDeleteTable usa endpoint admin incorreto:** Admin não consegue deletar
5. **B8 — Falta validação de contatos antes de submit**
6. **B9 — Falta validação de frequência para campanhas**
7. **B10 — Falta validação de price_value quando price_type='paga'**
8. **B11 — Falta validação de actual_gm_name quando publisher_role='announcer'**
9. **B12 — Falta validação de campos DDAL obrigatórios**

### Falhas Moderadas
10. **B4 — Falta validação de ownership antes de carregar mesa para edição**
11. **B5 — Fetch de sistemas não usa VITE_API_URL**
12. **B6 — Fetch de cenário não usa VITE_API_URL**

---

## PASSAGEM C: INTEGRAÇÃO E REGRESSÃO

### C1. Fluxo: Criação Manual de Mesa

**Caminho:** Painel → "Nova Mesa" → Formulário (6 steps) → Submit

#### Análise de Integração

**Frontend → Backend:**
- ✅ Payload construído por `formStateToPayload()` (mapper)
- ✅ Todos os campos REQ-26/28 incluídos
- ✅ Schedules mapeados corretamente
- ✅ Contatos mapeados corretamente
- ❌ **FALHA C1:** Sempre usa POST, nunca detecta modo edição (B7)

**Backend → Banco:**
- ✅ Transação atômica (table + contacts + schedules)
- ✅ Validações robustas
- ✅ Sanitização completa

**Banco → Frontend:**
- ✅ Retorna mesa criada com ID
- ✅ Frontend chama `refreshData()` e volta para dashboard

#### Regressões Identificadas

**❌ REGRESSÃO C1-A:** Criação sem sistema
- **Cenário:** Usuário pula step 2 (sistema) e submete
- **Esperado:** Backend rejeita com erro claro
- **Real:** Backend valida `system_id` obrigatório (linha 352), mas frontend não valida antes
- **Impacto:** UX ruim, erro genérico após 6 steps

**❌ REGRESSÃO C1-B:** Criação sem contatos
- **Cenário:** Usuário remove todos os contatos no step 5
- **Esperado:** Frontend bloqueia submit
- **Real:** Frontend permite, backend rejeita (linha 385)
- **Impacto:** UX ruim, erro após 6 steps

**❌ REGRESSÃO C1-C:** Criação de campanha sem frequência
- **Cenário:** Usuário seleciona type='campanha' mas não preenche frequência
- **Esperado:** Frontend bloqueia submit
- **Real:** Frontend permite, backend rejeita (linha 357)
- **Impacto:** UX ruim, erro após 6 steps

**✅ SEM REGRESSÃO:** Criação com campos avançados (REQ-26)
- **Cenário:** Usuário preenche campos avançados no step 5
- **Esperado:** Backend persiste todos os campos
- **Real:** Backend persiste corretamente (linhas 582-594)

**✅ SEM REGRESSÃO:** Criação com schedules (REQ-27)
- **Cenário:** Usuário adiciona múltiplos horários no step 3
- **Esperado:** Backend persiste todos os schedules
- **Real:** Backend persiste corretamente (linhas 657-672)

---

### C2. Fluxo: Edição de Mesa

**Caminho:** Painel → Card de mesa → "Editar" → Formulário → Submit

#### Análise de Integração

**Frontend (carregamento):**
- ❌ **FALHA C2-A:** Usa endpoint público `/tables/:id` (B1)
- ❌ **FALHA C2-B:** Não valida ownership antes de carregar (B4)
- ⚠️ Endpoint público não retorna schedules completos

**Frontend (submit):**
- ❌ **FALHA C2-C (CRÍTICA):** Sempre usa POST, nunca PUT (B7)
- **Consequência:** Edição cria nova mesa em vez de atualizar

**Backend (PUT /gm/tables/:id):**
- ✅ Validações de ownership corretas
- ❌ Falta validação de `system_id` (A3)
- ❌ Falta validação de VTT Platform (A5)
- ❌ Falta validação de `price_value` (A6)
- ❌ Falta validação de `frequency` (A7)
- ❌ Falta validação de schedules (A8)

#### Regressões Identificadas

**❌ REGRESSÃO C2-A (BLOQUEADORA):** Edição não funciona
- **Cenário:** GM clica em "Editar", altera título, submete
- **Esperado:** Mesa é atualizada
- **Real:** Nova mesa é criada (POST em vez de PUT)
- **Impacto CRÍTICO:** Funcionalidade de edição **COMPLETAMENTE QUEBRADA**

**❌ REGRESSÃO C2-B:** Edição carrega dados incompletos
- **Cenário:** GM edita mesa com múltiplos schedules
- **Esperado:** Formulário carrega todos os schedules
- **Real:** Endpoint público pode não retornar schedules completos
- **Impacto:** Perda de dados ao "editar"

**❌ REGRESSÃO C2-C:** Edição pode introduzir system_id inválido
- **Cenário:** GM altera sistema para ID inexistente (manipulação de DOM)
- **Esperado:** Backend rejeita com erro claro
- **Real:** FK constraint violation genérico (500)
- **Impacto:** UX ruim, erro não tratado

---

### C3. Fluxo: Ativação/Desativação de Mesa

**Caminho:** Painel → Card de mesa → Toggle "Ativar"/"Desativar"

#### Análise de Integração

**Frontend:**
- ❌ **FALHA C3-A:** Status `'inactive'` não existe no backend (B2)
- ❌ **FALHA C3-B:** Endpoint `/gm/admin/tables/:id` não existe (B2)
- ❌ **FALHA C3-C:** Usa PUT `/gm/tables/:id` que não persiste status (A9)

**Backend:**
- ❌ **FALHA C3-D (CRÍTICA):** Conflito de rota PUT `/tables/:id` (A9)
- ✅ PATCH `/tables/:id/status` existe e funciona
- ⚠️ Mas frontend não usa PATCH

#### Regressões Identificadas

**❌ REGRESSÃO C3-A (BLOQUEADORA):** Ativação/desativação não funciona
- **Cenário:** GM clica em "Desativar" em mesa ativa
- **Esperado:** Mesa muda para status 'inactive' ou 'draft'
- **Real:** Nada acontece (múltiplas falhas em cascata)
- **Impacto CRÍTICO:** Funcionalidade **COMPLETAMENTE QUEBRADA**

**Causas raiz:**
1. Frontend envia status `'inactive'` que não existe no enum
2. Frontend usa endpoint errado (`/gm/tables/:id` em vez de `/gm/tables/:id/status`)
3. Backend tem conflito de rota (PUT duplicado)
4. Rota PUT não persiste status

---

### C4. Fluxo: Deleção de Mesa

**Caminho:** Painel → Card de mesa → "Deletar" → Confirmação → Submit

#### Análise de Integração

**Frontend (GM):**
- ✅ Usa DELETE `/gm/tables/:id`
- ✅ Confirmação antes de deletar
- ✅ Loading state durante deleção

**Frontend (Admin):**
- ❌ **FALHA C4-A:** Endpoint `/gm/admin/tables/:id` não existe (B3)
- ✅ Deveria usar `/admin/tables/:id`

**Backend (GM):**
- ✅ DELETE `/gm/tables/:id` funciona corretamente
- ✅ Transação atômica (schedules → contacts → table)

**Backend (Admin):**
- ✅ DELETE `/admin/tables/:id` existe
- ❌ **FALHA C4-B:** Não deleta schedules (A10)

#### Regressões Identificadas

**❌ REGRESSÃO C4-A:** Admin não consegue deletar pelo painel
- **Cenário:** Admin clica em "Deletar" em qualquer mesa
- **Esperado:** Mesa é deletada
- **Real:** Erro 404 (endpoint não existe)
- **Impacto:** Admin precisa usar ferramenta externa

**❌ REGRESSÃO C4-B:** Deleção admin deixa schedules órfãos
- **Cenário:** Admin deleta mesa com schedules via endpoint correto
- **Esperado:** Schedules são deletados em cascata
- **Real:** Schedules permanecem no banco (se FK não tiver ON DELETE CASCADE)
- **Impacto:** Poluição do banco, violação de integridade

---

### C5. Fluxo: Listagem de Mesas no Painel

**Caminho:** Login → Painel (carregamento automático)

#### Análise de Integração

**Frontend:**
- ✅ Usa GET `/gm/tables`
- ✅ Mapeia métricas corretamente
- ✅ Exibe cards com todos os dados

**Backend:**
- ✅ Retorna todos os campos necessários
- ✅ Inclui métricas de engajamento
- ✅ Inclui contatos e schedules

**✅ SEM REGRESSÃO:** Listagem funciona corretamente

---

### C6. Matriz de Conflitos Frontend ↔ Backend

| Funcionalidade | Frontend Envia | Backend Espera | Status |
|---|---|---|---|
| Criação de mesa | POST `/gm/tables` | POST `/gm/tables` | ✅ OK |
| Edição de mesa | POST `/gm/tables` | PUT `/gm/tables/:id` | ❌ CONFLITO |
| Ativação/desativação | PUT `/gm/tables/:id` + `status: 'inactive'` | PATCH `/gm/tables/:id/status` + enum válido | ❌ CONFLITO |
| Deleção (GM) | DELETE `/gm/tables/:id` | DELETE `/gm/tables/:id` | ✅ OK |
| Deleção (Admin) | DELETE `/gm/admin/tables/:id` | DELETE `/admin/tables/:id` | ❌ CONFLITO |
| Listagem | GET `/gm/tables` | GET `/gm/tables` | ✅ OK |
| Carregar para edição | GET `/tables/:id` | GET `/gm/tables` (filtrado) | ⚠️ SUBÓTIMO |

---

### C7. Análise de Persistência de Dados

#### Campos REQ-26 (Avançados)

| Campo | POST Persiste | PUT Persiste | Admin PUT Persiste |
|---|---|---|---|
| `master_display_name` | ✅ | ✅ | ✅ |
| `campaign_length` | ✅ | ✅ | ✅ |
| `level_range` | ✅ | ✅ | ✅ |
| `billing_text` | ✅ | ✅ | ✅ |
| `session_zero_free` | ✅ | ✅ | ✅ |
| `synopsis` | ✅ | ✅ | ✅ |
| `style_text` | ✅ | ✅ | ✅ |
| `listing_excerpt` | ✅ | ✅ | ✅ |
| `technical_requirements` | ✅ | ✅ | ✅ |
| `requires_pc` | ✅ | ✅ | ✅ |
| `requires_camera` | ✅ | ✅ | ✅ |
| `requires_microphone` | ✅ | ✅ | ✅ |

**Conclusão:** Campos REQ-26 estão 100% persistidos em todas as rotas.

---

#### Campos REQ-28 (Editoriais)

| Campo | POST Persiste | PUT Persiste | Admin PUT Persiste |
|---|---|---|---|
| `setting_name` | ✅ | ✅ | ✅ |
| `setting_styles` | ✅ | ✅ | ✅ |
| `synopsis_narrative` | ✅ | ❌ AUSENTE | ✅ |
| `benefits_text` | ✅ | ❌ AUSENTE | ✅ |
| `gm_bio` | ✅ | ❌ AUSENTE | ✅ |

**❌ REGRESSÃO C7-A:** PUT `/gm/tables/:id` não persiste campos editoriais Fase 6
- **Impacto:** GM não consegue editar `synopsis_narrative`, `benefits_text`, `gm_bio`
- **Causa:** Campos não estão no destructuring do `req.body` (linha 733-781)

---

#### Schedules (REQ-27)

| Operação | POST | PUT | Admin PUT | DELETE (GM) | DELETE (Admin) |
|---|---|---|---|---|---|
| Persiste schedules | ✅ | ✅ | ❌ AUSENTE | ✅ | ❌ AUSENTE |

**❌ REGRESSÃO C7-B:** Admin PUT não gerencia schedules
- **Impacto:** Admin não consegue editar horários de mesas

**❌ REGRESSÃO C7-C:** Admin DELETE não remove schedules
- **Impacto:** Schedules órfãos no banco

---

## RESUMO PASSAGEM C: INTEGRAÇÃO

### Falhas Críticas (Bloqueadoras)
1. **C2-A — Edição não funciona:** POST em vez de PUT (B7)
2. **C3-A — Ativação/desativação não funciona:** Múltiplas falhas em cascata (A9 + B2)

### Falhas Graves (Alta Prioridade)
3. **C2-B — Edição carrega dados incompletos:** Endpoint público (B1)
4. **C4-A — Admin não consegue deletar pelo painel:** Endpoint errado (B3)
5. **C7-A — PUT não persiste campos editoriais Fase 6:** Campos ausentes no destructuring
6. **C7-B — Admin PUT não gerencia schedules:** Funcionalidade ausente
7. **C7-C — Admin DELETE não remove schedules:** Transação incompleta (A10)

### Falhas Moderadas
8. **C1-A — Criação sem sistema:** Validação frontend ausente
9. **C1-B — Criação sem contatos:** Validação frontend ausente (B8)
10. **C1-C — Criação de campanha sem frequência:** Validação frontend ausente (B9)
11. **C2-C — Edição pode introduzir system_id inválido:** Validação backend ausente (A3)

---

## CONCLUSÃO FINAL DA AUDITORIA

### Funcionalidades Operacionais ✅
1. **Criação manual de mesa** — Funciona se todos os campos obrigatórios forem preenchidos
2. **Listagem de mesas** — Funciona corretamente com métricas
3. **Deleção de mesa (GM)** — Funciona corretamente
4. **Persistência de campos REQ-26** — 100% funcional
5. **Persistência de schedules (criação)** — Funcional

### Funcionalidades Quebradas ❌
1. **Edição de mesa** — COMPLETAMENTE QUEBRADA (sempre cria nova mesa)
2. **Ativação/desativação de mesa** — COMPLETAMENTE QUEBRADA (múltiplas falhas)
3. **Deleção de mesa (Admin via painel)** — QUEBRADA (endpoint errado)

### Funcionalidades Parcialmente Quebradas ⚠️
1. **Edição de campos editoriais Fase 6** — Não persiste 3 campos
2. **Edição de schedules (Admin)** — Admin não consegue editar horários
3. **Deleção de schedules (Admin)** — Deixa registros órfãos

---

## PRIORIZAÇÃO DE CORREÇÕES

### Prioridade 1 (BLOQUEADORES — Corrigir IMEDIATAMENTE)
1. **A9 + B2 + C3-A:** Corrigir ativação/desativação de mesa
   - Backend: Remover rota PUT duplicada (linha 1238-1276)
   - Frontend: Usar PATCH `/gm/tables/:id/status` com enum correto
   
2. **B7 + C2-A:** Corrigir edição de mesa
   - Frontend: Detectar modo edição e usar PUT com ID correto

### Prioridade 2 (GRAVES — Corrigir antes de validação beta)
3. **A3, A5, A6, A7, A8:** Adicionar validações no PUT `/gm/tables/:id`
4. **B1 + C2-B:** Criar endpoint GET `/gm/tables/:id` ou usar listagem filtrada
5. **B3 + C4-A:** Corrigir endpoint admin no frontend
6. **C7-A:** Adicionar campos editoriais Fase 6 no PUT `/gm/tables/:id`
7. **A10 + C7-C:** Adicionar deleção de schedules no admin DELETE

### Prioridade 3 (MODERADAS — Melhorias de UX)
8. **B8, B9, B10, B11, B12:** Adicionar validações frontend antes de submit
9. **A1, A4:** Adicionar validação de `scenario_id`
10. **B5, B6:** Usar `VITE_API_URL` em todos os fetches

### Prioridade 4 (MENORES — Refatoração futura)
11. **A2:** Adicionar limite de caracteres em `frequency_custom`
12. **A11:** Melhorar tratamento de erros de FK
13. **B4:** Validar ownership antes de carregar mesa para edição

---

## ESTIMATIVA DE IMPACTO

**Usuários afetados:**
- **100% dos GMs** não conseguem editar mesas existentes
- **100% dos GMs** não conseguem ativar/desativar mesas
- **100% dos Admins** não conseguem deletar mesas pelo painel

**Gravidade:** **CRÍTICA** — Sistema de gerenciamento de mesas está 50% inoperante.

**Recomendação:** **Não validar em produção até correção das Prioridades 1 e 2.**
