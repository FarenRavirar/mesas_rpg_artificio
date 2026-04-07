# Auditoria Homepage — 07/04/2026

**Escopo:** Homepage (`/`), catálogo público (`GET /api/v1/tables`), componentes relacionados  
**Método:** 3 passagens (Backend → Frontend → Integração)  
**Objetivo:** Identificar falhas, regressões e conflitos

---

## TABELA DE DÉBITO TÉCNICO

| ID | Fase | Severidade | Arquivo | Problema Concreto | Impacto Real | Correção Aplicada |
|---|---|---|---|---|---|
| HP-01 | A | **CRÍTICA** | `backend/src/routes/tables.ts:128-136` | Filtro de expiração aplica lógica de mesas importadas a TODAS as mesas, incluindo manuais | Mesas manuais antigas (>5 dias) desaparecem do catálogo mesmo estando ativas | Corrigir lógica OR para não aplicar expiração a mesas manuais |
| HP-02 | A | ALTA | `backend/src/routes/tables.ts:174-178` | Query de totalCount não aplica filtros ativos (system, modality, search, etc) | Contador "X+ mesas abertas" mostra total global, não total filtrado | Aplicar mesmos filtros da query principal |
| HP-03 | A | MÉDIA | `backend/src/routes/tables.ts:189-192` | Erro genérico sem contexto de query params | Logs não mostram quais filtros causaram erro | Adicionar query params ao log de erro |
| HP-04 | A | BAIXA | `backend/src/routes/tables.ts:33-34` | `parseInt(page)` e `parseInt(limit)` sem validação de NaN | Query params malformados (`?page=abc`) retornam NaN, causando offset inválido | Adicionar fallback para NaN |
| HP-05 | B | **CRÍTICA** | `frontend/src/components/TableCard.tsx:121-123` | Array.from sem key única | React warning: cada elemento precisa de key única | Usar índice como key (aceitável para array estático) |
| HP-06 | B | ALTA | `frontend/src/components/TableCard.tsx:28` | Fallback `slots_open ?? (slots_total - slots_filled)` inconsistente com regra de negócio | Se mestre fechar recrutamento, cálculo mostra vagas que não existem | Remover fallback — slots_open deve ser obrigatório no backend |
| HP-07 | B | ALTA | `frontend/src/pages/HomePage.tsx:58` | Prova social usa `totalCount > 0 ? totalCount : tables.length` | Se API retornar total=0 mas data.length>0, mostra length errado | Sempre usar totalCount, fallback só se undefined |
| HP-08 | B | MÉDIA | `frontend/src/pages/HomePage.tsx:130` | Tracking de click_card calcula `slots_total - slots_filled` | Inconsistente com HP-06 — deveria usar slots_open | Usar slots_open |
| HP-09 | B | MÉDIA | `frontend/src/hooks/useFetchTables.ts:54` | useEffect com dependências primitivas de objeto | Mudança em `options.limit` não retriggera se objeto for recriado | Destructure options ou usar useMemo |
| HP-10 | C | **CRÍTICA** | Integração backend→frontend | Backend retorna `gm_bio_long` mas frontend espera `gm_bio_long` em TableDetail | Campo existe mas não está em TableCard — cards não mostram bio do mestre | Adicionar `gm_bio_long` ao tipo TableCard |
| HP-11 | C | ALTA | Integração filtros | Filtro de `seal=covil-do-lich` funciona, mas frontend não envia esse parâmetro | Feature implementada no backend mas não exposta no frontend | Adicionar filtro de selos no catálogo |
| HP-12 | C | MÉDIA | Regressão de expiração | Lógica de expiração (HP-01) afeta mesas manuais antigas que deveriam estar visíveis | Mesas de campanhas longas (>5 dias) somem do catálogo | Corrigir HP-01 |
| HP-13 | C | BAIXA | Estado vazio | Empty state não diferencia "sem resultados de busca" vs "sem mesas no sistema" | UX confusa quando catálogo está vazio vs busca sem resultado | Adicionar mensagem contextual |

---

## PASSAGEM A: BACKEND E ARQUITETURA

### A1. Contratos e Integração

**✅ OK:** Backend retorna todos os campos esperados pelo frontend  
**✅ OK:** Nomenclatura consistente entre camadas (após renomeação gm_bio→table_gm_bio)  
**❌ FALHA HP-10:** `gm_bio_long` retornado mas não tipado em TableCard

### A2. Rotas e Handlers

**❌ FALHA HP-01 (CRÍTICA):** Filtro de expiração quebrado
```typescript
// Linha 128-136: LÓGICA INCORRETA
query = query.where((eb) =>
  eb.or([
    eb('t.origin', '=', 'manual'), // Mesas manuais sempre visíveis
    sql<boolean>`NOW() < LEAST(...)`, // Mas OR aplica a TODAS
  ])
);
```
**Problema:** OR significa "manual OU não expirada", mas deveria ser "se importada, verificar expiração; se manual, sempre visível"

**❌ FALHA HP-02 (ALTA):** totalCount ignora filtros
```typescript
// Linha 174-178: CONTA TUDO, NÃO APENAS FILTRADO
const totalCount = await db
  .selectFrom('tables as t')
  .select(sql<number>`COUNT(*)`.as('count'))
  .where('t.status', '=', 'active') // Só status, sem system, modality, search, etc
  .executeTakeFirst();
```

**❌ FALHA HP-03 (MÉDIA):** Log de erro sem contexto
```typescript
// Linha 189-192
} catch (error: any) {
  console.error('[GET /tables]', error); // Não mostra query params
  res.status(500).json({ error: 'Erro ao buscar mesas.' });
}
```

**❌ FALHA HP-04 (BAIXA):** parseInt sem validação
```typescript
// Linha 33-34
const pageNum = Math.max(1, parseInt(page)); // Se page='abc', parseInt retorna NaN
const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Math.max(1, NaN) = NaN
```

### A3. Persistência

**✅ OK:** Dados persistidos corretamente  
**✅ OK:** Joins corretos (gm_profiles, users, profiles, systems)  
**✅ OK:** Contacts e schedules buscados separadamente

### A4. Segurança e Robustez

**✅ OK:** Rota pública sem JWT (correto)  
**✅ OK:** Sanitização de search com ILIKE parametrizado  
**⚠️ RISCO:** Sem rate limiting (fora de escopo desta auditoria)

### A5. Arquitetura e Regressão

**❌ FALHA HP-12 (REGRESSÃO):** HP-01 afeta mesas manuais antigas

---

## PASSAGEM B: FRONTEND E UX

### B1. Integridade dos Componentes

**✅ OK:** Imports corretos  
**✅ OK:** Props tipadas  
**❌ FALHA HP-05 (CRÍTICA):** Array.from sem key única (linha 121)
**❌ FALHA HP-09 (MÉDIA):** useEffect com dependências primitivas de objeto

### B2. UX Real do Fluxo

**✅ OK:** Loading state presente (skeleton)  
**✅ OK:** Error state presente  
**⚠️ FALHA HP-13 (BAIXA):** Empty state genérico

**❌ FALHA HP-07 (ALTA):** Prova social inconsistente
```typescript
// Linha 58: LÓGICA ERRADA
{totalCount > 0 ? totalCount : tables.length}+ mesas abertas agora
```
**Problema:** Se API retornar `{data: [mesa1, mesa2], pagination: {total: 0}}`, mostra "2+ mesas" em vez de "0+ mesas"

**❌ FALHA HP-08 (MÉDIA):** Tracking inconsistente
```typescript
// Linha 130: CALCULA EM VEZ DE USAR slots_open
onClick={() => track('click_card', { 
  tableId: t.id, 
  slotsLeft: t.slots_total - t.slots_filled, // ERRADO
  price: t.price_value 
})}
```

### B3. Acessibilidade e Estrutura

**✅ OK:** IDs únicos em elementos interativos  
**✅ OK:** Alt em imagens  
**⚠️ FALTA:** aria-label em botão de busca (baixa prioridade)

### B4. Fluxo de Formulário

**N/A:** Homepage não tem formulário

---

## PASSAGEM C: INTEGRAÇÃO, REGRESSÃO E CONFLITO

### C1. Fluxo Ponta a Ponta

**Fluxo:** Usuário acessa `/` → HomePage carrega → useFetchTables chama `/api/v1/tables` → Backend retorna mesas → TableCard renderiza

**✅ OK:** Fluxo básico funciona  
**❌ FALHA HP-01:** Mesas manuais antigas desaparecem  
**❌ FALHA HP-02:** Contador global em vez de filtrado  
**❌ FALHA HP-06:** Fallback de slots_open inconsistente

### C2. Conflitos entre Modos de Uso

**Mesa manual vs importada:**
- ❌ HP-01: Filtro de expiração afeta ambas incorretamente
- ✅ OK: Campo `origin` diferencia corretamente

**Busca vs catálogo completo:**
- ❌ HP-02: totalCount não reflete busca ativa
- ✅ OK: Título muda para "Resultados para X"

### C3. Regressões

**❌ HP-12:** Lógica de expiração (implementada para mesas importadas) quebra mesas manuais antigas

### C4. Situações Reais do Usuário

**Cenário 1:** Usuário busca "D&D"
- ✅ Backend filtra corretamente
- ❌ HP-02: Contador mostra total global, não total de D&D

**Cenário 2:** Mestre publica mesa manual, volta 6 dias depois
- ❌ HP-01: Mesa desaparece do catálogo (expiração incorreta)

**Cenário 3:** Mesa com 2 vagas abertas mas mestre fechou recrutamento (slots_open=0)
- ❌ HP-06: Card mostra "2 vagas" (fallback incorreto)

**Cenário 4:** Usuário clica em card
- ❌ HP-08: Tracking envia slotsLeft calculado errado

---

## SEVERIDADE CONSOLIDADA

| Severidade | Quantidade | IDs |
|---|---|---|
| **CRÍTICA** | 3 | HP-01, HP-05, HP-10 |
| ALTA | 4 | HP-02, HP-06, HP-07, HP-11 |
| MÉDIA | 4 | HP-03, HP-08, HP-09, HP-13 |
| BAIXA | 2 | HP-04, HP-12 |

---

## PRÓXIMA ETAPA

Aplicar correções diretamente no código.
