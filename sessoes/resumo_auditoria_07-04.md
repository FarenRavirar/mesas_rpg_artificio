# Resumo Executivo: Auditoria do Painel do Mestre
**Data:** 07/04/2026  
**Escopo:** Sistema de gerenciamento de mesas em `https://mesasbeta.artificiorpg.com/painel`  
**Método:** Auditoria rigorosa em 3 passagens (Backend, Frontend, Integração)

---

## Status Geral: 🔴 CRÍTICO

**Funcionalidades operacionais:** 40%  
**Funcionalidades quebradas:** 60%  
**Recomendação:** **NÃO VALIDAR EM PRODUÇÃO** até correção dos bloqueadores.

---

## Falhas Críticas Identificadas

### 1. Edição de Mesa — COMPLETAMENTE QUEBRADA ❌
**Impacto:** 100% dos GMs não conseguem editar mesas existentes  
**Causa raiz:** Frontend sempre usa POST em vez de PUT  
**Localização:** `useCreateTableForm.ts:211`  
**Consequência:** Toda tentativa de edição cria nova mesa duplicada

### 2. Ativação/Desativação de Mesa — COMPLETAMENTE QUEBRADA ❌
**Impacto:** 100% dos GMs não conseguem ativar/desativar mesas  
**Causas raiz (múltiplas):**
- Backend: Conflito de rota PUT duplicada (`gmPanel.ts:728` e `gmPanel.ts:1238`)
- Frontend: Status `'inactive'` não existe no enum backend
- Frontend: Usa endpoint errado (`/gm/tables/:id` em vez de `/gm/tables/:id/status`)
- Frontend: Endpoint admin incorreto (`/gm/admin/tables/:id` não existe)

### 3. Deleção Admin — QUEBRADA ❌
**Impacto:** 100% dos Admins não conseguem deletar mesas pelo painel  
**Causa raiz:** Frontend usa endpoint `/gm/admin/tables/:id` que não existe  
**Localização:** `PainelMestrePage.tsx:430-432`  
**Correção:** Usar `/admin/tables/:id`

---

## Falhas Graves (Alta Prioridade)

### 4. Edição Carrega Dados Incompletos ⚠️
**Impacto:** Perda de dados ao editar mesas com schedules  
**Causa:** Frontend usa endpoint público `/tables/:id` que não retorna dados completos  
**Localização:** `PainelMestrePage.tsx:293`

### 5. PUT Não Persiste Campos Editoriais Fase 6 ⚠️
**Impacto:** GMs não conseguem editar `synopsis_narrative`, `benefits_text`, `gm_bio`  
**Causa:** Campos ausentes no destructuring do `req.body`  
**Localização:** `gmPanel.ts:733-781`

### 6. Validações Backend Ausentes no PUT ⚠️
**Impacto:** Edição pode introduzir dados inválidos  
**Campos sem validação:**
- `system_id` (FK não validada)
- `vtt_platform_id` (FK não validada)
- `price_value` (obrigatório quando `price_type='paga'`)
- `frequency` (obrigatório para campanhas)
- `schedules` (estrutura não validada)

### 7. Admin DELETE Não Remove Schedules ⚠️
**Impacto:** Schedules órfãos no banco após deleção admin  
**Causa:** Transação incompleta (falta `deleteFrom('table_schedules')`)  
**Localização:** `gmPanel.ts:1553-1566`

---

## Falhas Moderadas (Melhorias de UX)

### 8. Validações Frontend Ausentes
**Impacto:** Erros genéricos após preencher 6 steps do formulário  
**Validações faltantes:**
- Contatos: mínimo 1 contato válido
- Frequência: obrigatória para campanhas
- Price value: obrigatório quando mesa é paga
- Actual GM name: obrigatório quando publisher_role='announcer'
- DDAL: campos obrigatórios quando is_ddal=true

### 9. Endpoints Não Usam VITE_API_URL
**Impacto:** Pode falhar em desenvolvimento local  
**Localizações:**
- `CreateTableForm.tsx:91` (fetch de sistemas)
- `CreateTableForm.tsx:175` (fetch de cenário)

---

## Matriz de Funcionalidades

| Funcionalidade | Status | Observação |
|---|---|---|
| Criação de mesa | ✅ Funciona | Se todos os campos obrigatórios preenchidos |
| Edição de mesa | ❌ Quebrada | Sempre cria nova mesa |
| Ativação/desativação | ❌ Quebrada | Múltiplas falhas em cascata |
| Deleção (GM) | ✅ Funciona | Transação atômica correta |
| Deleção (Admin) | ❌ Quebrada | Endpoint incorreto |
| Listagem | ✅ Funciona | Com métricas de engajamento |
| Persistência REQ-26 | ✅ Funciona | 100% dos campos avançados |
| Persistência REQ-27 | ⚠️ Parcial | Criação OK, edição admin quebrada |
| Persistência REQ-28 | ⚠️ Parcial | 3 campos não persistem no PUT |

---

## Plano de Correção Prioritizado

### Prioridade 1: BLOQUEADORES (Corrigir IMEDIATAMENTE)

#### Correção 1.1: Ativação/Desativação
**Backend:**
```typescript
// gmPanel.ts: REMOVER rota duplicada (linhas 1238-1276)
// Manter apenas PATCH /tables/:id/status (linhas 1198-1235)
```

**Frontend:**
```typescript
// PainelMestrePage.tsx:385-421
const newStatus = currentStatus === 'active' ? 'draft' : 'active'; // Usar enum válido
const endpoint = `${apiUrl}/api/v1/gm/tables/${tableId}/status`; // Usar PATCH endpoint

const response = await fetch(endpoint, {
  method: 'PATCH', // Usar PATCH em vez de PUT
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ status: newStatus }),
});
```

#### Correção 1.2: Edição de Mesa
**Frontend:**
```typescript
// useCreateTableForm.ts:180-232
const isEditing = !!initialData?.id;
const method = isEditing ? 'PUT' : 'POST';
const endpoint = isEditing 
  ? `/api/v1/gm/tables/${initialData.id}` 
  : '/api/v1/gm/tables';

const res = await fetch(endpoint, {
  method,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(payload),
});
```

---

### Prioridade 2: GRAVES (Corrigir antes de validação beta)

#### Correção 2.1: Endpoint Admin
**Frontend:**
```typescript
// PainelMestrePage.tsx:395-397 e 430-432
const endpoint = user?.role === 'admin'
  ? `${apiUrl}/api/v1/admin/tables/${tableId}` // Remover /gm/
  : `${apiUrl}/api/v1/gm/tables/${tableId}`;
```

#### Correção 2.2: Campos Editoriais Fase 6
**Backend:**
```typescript
// gmPanel.ts:733-781 — Adicionar ao destructuring:
const {
  // ... campos existentes
  synopsis_narrative,
  benefits_text,
  gm_bio,
} = req.body;

// gmPanel.ts:907-961 — Adicionar ao .set():
synopsis_narrative: hasOwn('synopsis_narrative') ? sanitizeOptionalText(synopsis_narrative) : undefined,
benefits_text: hasOwn('benefits_text') ? sanitizeOptionalText(benefits_text) : undefined,
gm_bio: hasOwn('gm_bio') ? sanitizeOptionalText(gm_bio) : undefined,
```

#### Correção 2.3: Admin DELETE Schedules
**Backend:**
```typescript
// gmPanel.ts:1553-1566 — Adicionar antes de deletar contacts:
await trx
  .deleteFrom('table_schedules')
  .where('table_id', '=', id)
  .execute();
```

#### Correção 2.4: Validações Backend PUT
**Backend:**
```typescript
// gmPanel.ts:783-905 — Adicionar validações:

// Validar system_id se fornecido
if (hasOwn('system_id') && system_id) {
  const systemExists = await db.selectFrom('systems').select('id').where('id', '=', system_id).executeTakeFirst();
  if (!systemExists) return res.status(400).json({ error: 'Sistema não encontrado.' });
}

// Validar price_value se price_type='paga'
if (hasOwn('price_type') && price_type === 'paga') {
  const parsedPriceValue = Number(price_value);
  if (!price_value || isNaN(parsedPriceValue) || parsedPriceValue <= 0) {
    return res.status(400).json({ error: 'Para mesas pagas, informe um valor válido maior que zero.' });
  }
}

// Validar frequency para campanhas
if (hasOwn('type') && (type === 'campanha' || type === 'oneshot-serie')) {
  const finalFrequency = hasOwn('frequency') ? frequency : existingTable.frequency;
  if (!finalFrequency) {
    return res.status(400).json({ error: 'Frequência é obrigatória para campanhas e one-shots em série.' });
  }
}
```

---

### Prioridade 3: MODERADAS (Melhorias de UX)

#### Correção 3.1: Validações Frontend
**Frontend:**
```typescript
// useCreateTableForm.ts:180-232 — Adicionar antes de submit:

// Validar contatos
const validContacts = contacts.filter(c => c.value.trim() !== '');
if (validContacts.length === 0) {
  setError('Informe ao menos um canal de contato para recrutamento.');
  setSubmitState('idle');
  return;
}

// Validar frequência para campanhas
if ((form.type === 'campanha' || form.type === 'oneshot-serie') && !frequency) {
  setError('Frequência é obrigatória para campanhas e one-shots em série.');
  setSubmitState('idle');
  return;
}

// Validar price_value quando paga
if (form.price_type === 'paga') {
  const parsedPriceValue = Number(form.price_value);
  if (!form.price_value || isNaN(parsedPriceValue) || parsedPriceValue <= 0) {
    setError('Para mesas pagas, informe um valor válido maior que zero.');
    setSubmitState('idle');
    return;
  }
}

// Validar actual_gm_name quando announcer
if (publisherRole === 'announcer' && !actualGmName.trim()) {
  setError('Quando for anunciante, informe o nome do mestre real.');
  setSubmitState('idle');
  return;
}

// Validar campos DDAL
if (ddal.is_ddal) {
  if (!ddal.ddal_code || !ddal.ddal_name || !ddal.ddal_tier) {
    setError('Para mesas DDAL, preencha Código da Aventura, Nome da Aventura e Tier (1-4).');
    setSubmitState('idle');
    return;
  }
}
```

---

## Estimativa de Esforço

| Prioridade | Correções | Tempo Estimado | Risco |
|---|---|---|---|
| P1 — Bloqueadores | 2 correções | 2-3 horas | Baixo |
| P2 — Graves | 4 correções | 4-6 horas | Médio |
| P3 — Moderadas | 2 correções | 2-3 horas | Baixo |
| **TOTAL** | **8 correções** | **8-12 horas** | — |

---

## Recomendações Finais

1. **Não validar em produção** até correção de P1 e P2
2. **Executar testes E2E** após cada correção de P1
3. **Criar checklist de validação beta** com cenários de regressão identificados
4. **Documentar fluxos corrigidos** em `GUIA_RAPIDO_OPERACIONAL.md`
5. **Registrar erros corrigidos** em `ERRORS_SOLUTIONS.md` com IDs E131-E138

---

## Próximos Passos

1. Aprovar plano de correção
2. Criar branch `fix/painel-mestre-critical` a partir de `dev`
3. Aplicar correções P1 (bloqueadores)
4. Testar em ambiente local
5. Deploy em beta
6. Validação E2E com checklist
7. Aplicar correções P2 (graves)
8. Repetir ciclo de validação
9. Merge para `dev` após aprovação
10. Atualizar documentação operacional
