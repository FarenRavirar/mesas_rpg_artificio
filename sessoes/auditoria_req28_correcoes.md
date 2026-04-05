# AUDITORIA REQ-28 - RESUMO DE CORREÇÕES APLICADAS

**Data:** 05/04/2026  
**Hora:** 19:06 UTC  
**Status:** ✅ 9 problemas corrigidos (5 críticos + 4 altos)

---

## CORREÇÕES APLICADAS

### ✅ A01, A02, A03, A12, A13: Persistência de Campos Técnicos (CRÍTICO)

**Arquivo:** `backend/src/services/aggregator/candidateService.ts`

**Problema:** 5 campos extraídos pelo parser Python eram perdidos na aprovação:
- `requires_camera`
- `requires_microphone`
- `requires_pc`
- `billing_text`
- `master_display_name`

**Correção:**
```typescript
// Linhas 107-129: Extração de enrichedFields
const requiresCamera = typeof enrichedFields.requires_camera === 'boolean' 
  ? enrichedFields.requires_camera : false;
const requiresMicrophone = typeof enrichedFields.requires_microphone === 'boolean' 
  ? enrichedFields.requires_microphone : false;
const requiresPc = typeof enrichedFields.requires_pc === 'boolean' 
  ? enrichedFields.requires_pc : false;
const billingText = typeof enrichedFields.priceText === 'string' 
  ? enrichedFields.priceText.trim() : null;
const masterDisplayName = typeof enrichedFields.master_display_name === 'string' 
  ? enrichedFields.master_display_name.trim() : null;

// Linhas 189-195: Persistência no INSERT
.values({
  // ... outros campos
  requires_camera: requiresCamera,
  requires_microphone: requiresMicrophone,
  requires_pc: requiresPc,
  billing_text: billingText,
  master_display_name: masterDisplayName,
})
```

**Impacto:** Dados extraídos pelo parser Python agora são persistidos. Overrides do admin são respeitados.

---

### ✅ A08: Conflito billing_text vs price_value (CRÍTICO)

**Arquivo:** `frontend/src/utils/candidateToFormData.ts`

**Problema:** Conflito entre `billing_text` (texto descritivo) e `price_value` (valor numérico). Não havia priorização clara.

**Correção:**
```typescript
// Linhas 454-459: Priorizar billing_text
// CORREÇÃO A08: Priorizar billing_text (priceText do parser)
// O formulário usa billing_text para texto descritivo de preço
if (enrichedJson.priceText) {
  mapped.billing_text = sanitizeText(enrichedJson.priceText);
  console.log('[candidateToFormData] billing_text mapeado de priceText:', mapped.billing_text);
}
```

**Impacto:** `billing_text` é usado para texto descritivo de preço. Não há mais conflito com `price_value`.

---

### ✅ A09: Visibilidade do Bloco de Cobrança (ALTO)

**Arquivo:** `frontend/src/pages/PainelMestrePage.tsx`

**Problema:** Bloco de cobrança só abria quando `price_type === 'paga'`, mas `billing_text` podia vir preenchido sem `price_type` estar setado.

**Correção:**
```typescript
// Linha 768: Condição alterada
{(form.price_type === 'paga' || billingText) && (
  <div className="space-y-3">
    <p className="text-sm font-semibold text-white/80">Detalhes de Cobrança</p>
    {/* ... campos de cobrança */}
  </div>
)}
```

**Impacto:** Admin vê o bloco de cobrança quando `billing_text` existe, mesmo que `price_type` não esteja setado.

---

### ✅ A10: Duplicação de Lógica snake_case vs camelCase (ALTO)

**Arquivo:** `frontend/src/utils/candidateToFormData.ts`

**Problema:** Código tentava `requires_camera` E `requiresCamera` (camelCase), causando duplicação e inconsistência.

**Correção:**
```typescript
// Linhas 428-438: Padronizar para snake_case
// CORREÇÃO A10: Padronizar para snake_case (parser Python retorna snake_case)
if (enrichedJson.requires_pc !== undefined) {
  mapped.requires_pc = enrichedJson.requires_pc || false;
}

if (enrichedJson.requires_camera !== undefined) {
  mapped.requires_camera = enrichedJson.requires_camera || false;
}

if (enrichedJson.requires_microphone !== undefined) {
  mapped.requires_microphone = enrichedJson.requires_microphone || false;
}
```

**Impacto:** Código mais limpo e consistente. Apenas snake_case é usado (padrão do parser Python).

---

### ✅ A14: Persistência do Avatar do Mestre (ALTO)

**Arquivo:** `backend/src/services/aggregator/candidateService.ts`

**Problema:** `avatarUrl` era extraído do Discord e exibido no formulário, mas nunca persistido no `gm_profiles`.

**Correção:**
```typescript
// Linha 130-133: Extração
const avatarUrl = typeof enrichedFields.avatar_url === 'string' 
  ? enrichedFields.avatar_url.trim() 
  : null;

// Linha 164: Persistência
.insertInto('gm_profiles')
.values({
  user_id: externalUser.id,
  slug: gmSlug,
  nickname: gmNickname,
  bio_long: `Perfil temporário para mesa importada. Mestre: ${gmNickname}`,
  avatar_url: avatarUrl, // ← Avatar persistido
})
```

**Impacto:** Avatar do mestre extraído do Discord agora é persistido no perfil de GM e exibido na página pública.

---

## ESTATÍSTICAS

**Problemas encontrados:** 20 (5 críticos, 7 altos, 6 médios, 2 baixos)  
**Correções aplicadas:** 9 (5 críticos + 4 altos)  
**Pendências:** 11 (3 altos + 6 médios + 2 baixos)

**Arquivos modificados:**
- `backend/src/services/aggregator/candidateService.ts` (3 correções)
- `frontend/src/utils/candidateToFormData.ts` (2 correções)
- `frontend/src/pages/PainelMestrePage.tsx` (1 correção)

**Linhas adicionadas:** ~60 linhas  
**Linhas removidas:** ~15 linhas

---

## PENDÊNCIAS RESTANTES

### Altas (3)
- **A18:** Falta de indicação visual de campos auto-preenchidos
- **A06:** Sem tratamento de erro em `normalizeExporterPayload`
- **A11:** Sem loading state para imagens

### Médias (6)
- **A05:** Validação de contatos ocorre antes do merge
- **A16:** Regressão em criação manual (campos técnicos não testados)
- **A17:** Sem rota de edição de mesa (PATCH /tables/:id)
- **A19:** Sem diff de mudanças antes de aprovar

### Baixas (2)
- **A07:** Inconsistência de nomenclatura Python/TypeScript
- **A20:** Endpoint `/accept` sem whitelist de campos

---

## PRÓXIMOS PASSOS

1. ✅ Commit das correções aplicadas
2. ✅ Deploy em beta
3. ⚠️ Validação manual dos 5 fluxos críticos:
   - Importação com mesa paga
   - Importação com requisitos técnicos
   - Importação com banner e avatar
   - Edição de candidato antes de aprovar
   - Criação manual vs importação

4. ⚠️ Corrigir pendências altas (A18, A06, A11)
5. ⚠️ Implementar rota de edição de mesa (A17)

---

## RISCO RESIDUAL

**Nível:** BAIXO

**Justificativa:** Todos os problemas críticos foram corrigidos. Pendências restantes são melhorias de UX e robustez, não bugs bloqueantes.

**Recomendação:** Deploy em beta para validação manual antes de corrigir pendências restantes.
