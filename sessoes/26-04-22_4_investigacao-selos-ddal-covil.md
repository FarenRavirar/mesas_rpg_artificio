# Sessão 26-04-22_4 — Investigação Selos DDAL e Covil do Lich

**Data:** 2026-04-22  
**Objetivo:** Investigar por que os selos DDAL e Covil do Lich não estão aparecendo corretamente nas regras de design na página da mesa e nos cards.

## Vínculos
- **Sessão Anterior:** `26-04-22_3_prod-promotion.md` (encerrada)
- **Próxima Sessão:** (a definir)

## Contexto

Usuário reportou que os selos DDAL (D&D Adventurers League) e Covil do Lich não estão sendo exibidos corretamente:
- **Onde devem aparecer:** Página de detalhe da mesa + cards de mesa (catálogo/dashboard)
- **Comportamento esperado:** Selos devem ser visíveis quando aplicáveis
- **Comportamento atual:** Não aparecem ou aparecem incorretamente

## Plano de Execução

### Fase 1 — Diagnóstico de Dados
1. Verificar schema do banco: tabela `tables`, coluna de selos/badges
2. Consultar dados reais em beta/prod: quantas mesas têm esses selos?
3. Identificar formato de armazenamento (JSON, array, flags booleanos, etc.)

### Fase 2 — Diagnóstico de Backend
1. Verificar rotas de API que retornam dados de mesa:
   - `GET /api/v1/tables/:slug` (detalhe público)
   - `GET /api/v1/gm/tables` (painel do mestre)
   - `GET /api/v1/tables` (catálogo)
2. Confirmar se selos estão sendo retornados no payload
3. Verificar tipos TypeScript no backend

### Fase 3 — Diagnóstico de Frontend
1. Verificar componentes que renderizam mesa:
   - `TableCard.tsx` (cards de catálogo)
   - `TableCardDashboard.tsx` (cards do painel)
   - `TableHero.tsx` ou equivalente (página de detalhe)
2. Verificar se componentes consomem campo de selos
3. Verificar se há lógica condicional que oculta selos
4. Verificar CSS/estilos que possam estar ocultando visualmente

### Fase 4 — Diagnóstico de Regras de Design
1. Verificar `ARQUITETURA_PROJETO.md` para especificação de selos
2. Verificar se há migrations relacionadas a selos
3. Verificar se há validação/filtro que remove selos específicos

### Fase 5 — Relatório e Proposta de Correção
1. Documentar achados de cada fase
2. Identificar causa raiz
3. Propor correção mínima
4. Aguardar aprovação do mantenedor

## Checklist de Execução

- [x] Fase 1 — Diagnóstico de dados (schema + queries)
- [x] Fase 2 — Diagnóstico de backend (rotas + payloads)
- [x] Fase 3 — Diagnóstico de frontend (componentes + estilos)
- [x] Fase 4 — Diagnóstico de regras de design (docs + migrations)
- [x] Fase 5 — Relatório e proposta
- [x] Atualizar RESUMO_EXECUCAO.md
- [x] Atualizar index.md

## Arquivos que Serão Analisados

### Backend
- `backend/src/routes/tables.ts`
- `backend/src/routes/gm.ts`
- `backend/src/routes/gmPanel.ts`
- `backend/src/types/*.ts`

### Frontend
- `frontend/src/components/TableCard.tsx`
- `frontend/src/components/TableCardDashboard.tsx`
- `frontend/src/features/table/components/TableHero.tsx`
- `frontend/src/pages/TableDetailPage.tsx`

### Documentação
- `ARQUITETURA_PROJETO.md` (§12 - Modelo de Dados)
- `database/migration_*.sql` (buscar por "seal", "badge", "ddal", "covil")

## Critério de Conclusão

- Causa raiz identificada com evidências concretas
- Relatório completo documentado nesta sessão
- Proposta de correção apresentada ao mantenedor
- Aguardando aprovação para implementar correção

## Log de Progresso

### 2026-04-22 07:36 UTC-3 — Fase 1: Diagnóstico de Dados ✅

**Schema verificado:**
- Tabela `tables` possui colunas `is_ddal` (boolean) e `is_covil` (boolean)
- DDAL: 10 colunas adicionais (ddal_code, ddal_name, ddal_tier, etc.) — migration_02
- Covil: flag booleano simples — migration_10 e migration_14

**Dados reais em beta:**
```
total_mesas: 2
ddal_count: 0
covil_count: 0
```

**Conclusão Fase 1:** Schema correto, mas **não há mesas com selos no ambiente beta** para testar visualmente.

---

### 2026-04-22 07:36 UTC-3 — Fase 2: Diagnóstico de Backend ✅

**Rotas verificadas:**

1. **`GET /api/v1/tables` (catálogo público)** — `backend/src/routes/tables.ts:81-82`
   - ✅ Retorna `is_ddal` e `is_covil` no payload
   - ✅ Filtros funcionando: `?seal=ddal` e `?seal=covil-do-lich`

2. **`GET /api/v1/tables/:slug` (detalhe público)** — `backend/src/routes/tables.ts:319-320`
   - ✅ Retorna `is_ddal` e `is_covil` no payload
   - ✅ Retorna todos os campos DDAL (ddal_code, ddal_name, ddal_tier, etc.)

3. **`GET /api/v1/gm/tables` (painel do mestre)** — `backend/src/routes/gmPanel.ts:824`
   - ✅ Retorna `is_ddal` no payload
   - ❌ **NÃO retorna `is_covil`** — campo ausente na query

**Conclusão Fase 2:** Backend público está correto. **Painel do mestre não retorna `is_covil`**.

---

### 2026-04-22 07:36 UTC-3 — Fase 3: Diagnóstico de Frontend ✅

**Componentes verificados:**

1. **`TableCard.tsx` (cards de catálogo/homepage)** — linhas 111-115
   - ✅ Renderiza selo DDAL corretamente
   - ❌ **Selo Covil do Lich AUSENTE** — não há código para renderizá-lo

2. **`TableCardDashboard.tsx` (cards do painel do mestre)**
   - ❌ **Nenhum selo renderizado** — nem DDAL, nem Covil

3. **`TableHero.tsx` (hero da página de detalhe)** — linhas 19-22, 56-69
   - ✅ Usa `getTableBadges()` que suporta ambos os selos
   - ✅ Renderiza badges dinamicamente via loop

4. **`CertificationsSection.tsx` (seção de certificações na página de detalhe)** — linhas 14, 24, 50
   - ✅ Renderiza ambos os selos corretamente (DDAL e Covil)
   - ✅ Exibe detalhes completos de DDAL

**Conclusão Fase 3:** 
- **Página de detalhe:** funcionando corretamente
- **Cards de catálogo:** falta selo Covil
- **Cards do painel:** faltam ambos os selos

---

### 2026-04-22 07:37 UTC-3 — Fase 4: Diagnóstico de Regras de Design ✅

**Documentação verificada:**

1. **BACKLOG_OPERACIONAL.md** — linha 118
   - REQ-09 marcado como concluído em 15/04/2026
   - Descrição: "Selos Covil + DDAL. Persistência, filtro, badges, validação."
   - Referência: FILA 068

2. **Migrations verificadas:**
   - `migration_02_system_taxonomy_and_ddal.sql` — adiciona campos DDAL à tabela `tables`
   - `migration_10_covil_and_expiration.sql` — adiciona `is_covil` à tabela `tables`
   - `migration_14_user_profiles_complete.sql` — adiciona `covil_verified` ao perfil do mestre (não usado atualmente)

**Conclusão Fase 4:** REQ-09 foi implementado, mas **incompletamente**. A funcionalidade existe no backend e na página de detalhe, mas falta nos cards de catálogo e painel.

---

### 2026-04-22 07:37 UTC-3 — Fase 5: Relatório Final e Proposta ✅

## 🔍 CAUSA RAIZ IDENTIFICADA

A funcionalidade de selos DDAL e Covil do Lich foi implementada **parcialmente**:

### ✅ O que funciona:
1. **Backend:** Campos no banco, rotas públicas retornando dados corretamente
2. **Página de detalhe:** `TableHero.tsx` e `CertificationsSection.tsx` exibem ambos os selos
3. **Filtros:** Catálogo aceita `?seal=ddal` e `?seal=covil-do-lich`

### ❌ O que NÃO funciona:

#### Problema 1: Selo Covil ausente no `TableCard.tsx`
- **Arquivo:** `frontend/src/components/TableCard.tsx`
- **Linha:** 111-115
- **Situação:** Renderiza apenas selo DDAL, não há código para Covil
- **Impacto:** Usuários não veem selo Covil nos cards de catálogo/homepage

#### Problema 2: Nenhum selo no `TableCardDashboard.tsx`
- **Arquivo:** `frontend/src/components/TableCardDashboard.tsx`
- **Situação:** Não renderiza nenhum selo (nem DDAL, nem Covil)
- **Impacto:** Mestres não veem selos das próprias mesas no painel

#### Problema 3: Backend do painel não retorna `is_covil`
- **Arquivo:** `backend/src/routes/gmPanel.ts`
- **Linha:** 824
- **Situação:** Query retorna `is_ddal` mas não `is_covil`
- **Impacto:** Mesmo corrigindo frontend, painel não terá dados de Covil

---

## 💡 PROPOSTA DE CORREÇÃO

### Mudança Mínima Necessária (3 arquivos):

#### 1. `frontend/src/components/TableCard.tsx` (linhas 109-121)
**Adicionar selo Covil do Lich após selo DDAL:**

```tsx
{/* Badges críticos apenas */}
<div className="absolute top-3 left-3 flex flex-wrap gap-2">
  {table.is_ddal && (
    <span className="px-2 py-1 rounded-md text-[11px] font-black tracking-wide text-amber-100 bg-black/70 backdrop-blur-sm border border-amber-500/30">
      🛡️ DDAL
    </span>
  )}
  {table.is_covil && (
    <span className="px-2 py-1 rounded-md text-[11px] font-black tracking-wide text-purple-100 bg-black/70 backdrop-blur-sm border border-purple-500/30">
      👑 Covil do Lich
    </span>
  )}
  {isFull && (
    <span className="px-2 py-1 rounded-md text-[11px] font-black tracking-wide text-white bg-red-600 backdrop-blur-sm">
      Lotada
    </span>
  )}
</div>
```

#### 2. `frontend/src/components/TableCardDashboard.tsx` (após linha 91)
**Adicionar badges de selos na imagem do card:**

```tsx
{/* Badges de certificação */}
<div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
  {table.is_ddal && (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-100 bg-black/70 backdrop-blur-sm border border-amber-500/30">
      🛡️ DDAL
    </span>
  )}
  {table.is_covil && (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-purple-100 bg-black/70 backdrop-blur-sm border border-purple-500/30">
      👑 Covil
    </span>
  )}
</div>
```

**Adicionar tipos ao interface (linha 12):**
```tsx
interface MyTableEnhanced {
  // ... campos existentes
  is_ddal?: boolean;
  is_covil?: boolean;
}
```

#### 3. `backend/src/routes/gmPanel.ts` (linha 824)
**Adicionar `is_covil` ao SELECT da query:**

```typescript
.select([
  't.id',
  't.slug',
  // ... outros campos
  't.is_ddal',
  't.is_covil', // ADICIONAR ESTA LINHA
  // ... resto dos campos
])
```

---

## ✅ CRITÉRIO DE VALIDAÇÃO

Após implementar as correções:

1. **Criar mesa de teste com selos:**
   ```sql
   -- Em beta
   UPDATE tables SET is_ddal = true, ddal_code = 'DDAL-TEST', ddal_name = 'Teste DDAL', ddal_tier = 1 WHERE id = '<id_mesa>';
   UPDATE tables SET is_covil = true WHERE id = '<id_mesa>';
   ```

2. **Verificar visualmente:**
   - ✅ Catálogo: ambos os selos aparecem no card
   - ✅ Painel do mestre: ambos os selos aparecem no card
   - ✅ Página de detalhe: ambos os selos aparecem (já funciona)

3. **Verificar payload:**
   ```bash
   curl https://mesasbeta.artificiorpg.com/api/v1/gm/tables -H "Authorization: Bearer <token>" | jq '.[0] | {is_ddal, is_covil}'
   ```

---

## 🎯 PRÓXIMOS PASSOS

Aguardando aprovação do mantenedor para implementar as 3 correções propostas.

**Estimativa:** 15 minutos (3 arquivos, mudanças localizadas, sem quebra de contrato).

---

### 2026-04-22 02:11 UTC-3
- Sessão criada
- Aguardando início da investigação
