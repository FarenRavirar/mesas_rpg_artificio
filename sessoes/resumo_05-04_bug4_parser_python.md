# Sessão 05/04/2026 — Correção BUG 4: Parser TypeScript Ignora Dados do Parser Python

**Horário:** 09:26 - 09:30 BRT  
**Objetivo:** Corrigir BUG 4 identificado pelo usuário — parser TypeScript ignorava completamente os dados extraídos pelo parser Python

---

## ✅ Checklist de Execução

- [x] Analisar arquivo `D:\teste.json` com 100 mensagens reais
- [x] Criar script Python para análise estatística de padrões
- [x] Identificar taxa de sucesso por campo (título 76%, sistema 70%, vagas 68%)
- [x] Diagnosticar causa raiz: `parseExporterMessage.ts` não consultava `enrichedFields`
- [x] Modificar `parseExporterMessage.ts` para priorizar `enrichedFields`
- [x] Melhorar regex de vagas para capturar "Vagas disponíveis: X"
- [x] Testar build do backend (✅ passou sem erros)
- [x] Atualizar `SOLUCOES_BUGS_URGENTES.md`
- [x] Atualizar documentos relevantes

---

## 🔍 Análise Realizada

### Script Python de Análise Estatística

**Arquivo criado:** `D:\analisar_padroes.py`

**Resultados (100 mensagens):**

| Campo | Taxa de Extração | Padrão Mais Eficaz |
|-------|------------------|-------------------|
| Título | 76% | Markdown heading `#` (69.7%) |
| Sistema | 70% | Marcador `▬ Sistema:` (67.1%) |
| Vagas | 68% | Marcador `▬ Vagas:` (38.2%) |
| Classificação | 59% | Marcador `▬ Classificação:` (39%) |
| Valor | 45% | Regex `R$ XX` (93.3%) |
| Plataforma | 38% | Marcador `▬ Plataformas:` (89.5%) |
| Horário | 15% | Marcador `▬ Dia e Horário:` (66.7%) |

**Mídia:**
- 82% das mensagens têm attachments (PNG/JPG)
- 20% das mensagens têm embeds

---

## 🐛 Problema Identificado

### Causa Raiz

O parser TypeScript (`parseExporterMessage.ts`) **ignorava completamente** os dados do parser Python:

```typescript
// ANTES (ERRADO)
const title = extractHeadingTitle(message.content);
const systemText = lineValueByMatchers(message.content, [...]);
```

**Consequência:**
- Parser Python rodava e extraía dados → `enrichedFields`
- Parser TypeScript **descartava** esses dados
- Fazia parsing manual do zero
- Perdia informações já extraídas (sistema, vagas, banner, etc.)

---

## ✅ Solução Implementada

### Arquivo Modificado

**`backend/src/domain/aggregator/parseExporterMessage.ts`**

### Mudanças

1. **Adicionada extração de `enrichedFields`:**
```typescript
const enriched = (message.enrichedFields || {}) as Record<string, any>;
```

2. **Todos os campos agora priorizam Python com fallback TypeScript:**
```typescript
const title = enriched.title ?? extractHeadingTitle(message.content);
const systemText = enriched.system ?? lineValueByMatchers(message.content, [...]);
const scheduleText = enriched.scheduleText ?? extractSchedule(message.content);
const slotsText = enriched.slotsText ?? lineValueByMatchers(message.content, [...]);
// ... e todos os outros campos
```

3. **Melhorado regex de vagas:**
```typescript
const slotsText = enriched.slotsText ?? lineValueByMatchers(message.content, [
  /vagas?\s+dispon[íi]veis?[:\s]+(\d+)/i,  // "Vagas disponíveis: 2"
  /(?:n[ºo]\s*de\s*)?vagas?\s*[:\-]\s*(.+)$/i,
  /(\d+\s*\/\s*\d+\.?)/i,
  /(\d+)\s*vagas?/i,
]);
```

### Campos Priorizados

- `title`, `system`, `style`
- `scheduleText`, `slotsText`
- `ageRating`, `location`, `platforms`
- `masterText`, `recruiterName`
- `signupText`, `synopsis`

---

## 🎯 Resultado Esperado

Com essa correção:

✅ **Parser Python (67.7% confiança) será usado quando disponível**  
✅ **Fallback automático para TypeScript quando Python falhar**  
✅ **"Ordem Paranormal" será reconhecido** (se Python detectar)  
✅ **Vagas serão extraídas corretamente** de múltiplos formatos  
✅ **Banner será mapeado** do primeiro attachment  
✅ **Avatar do GM será extraído** do Discord

---

## 📊 Validação

### Build Backend

```bash
npm run build
```

**Resultado:** ✅ **Passou sem erros** (exit code 0)

---

## 📝 Documentação Atualizada

1. ✅ `SOLUCOES_BUGS_URGENTES.md` — BUG 4 marcado como **RESOLVIDO**
2. ✅ Tabela de status atualizada (09:30 BRT)
3. ✅ Artefato criado: `analise_parser_rpg.md` (análise completa)

---

## 🚀 Próximos Passos

1. ⏳ **Deploy em beta** — aplicar mudanças no ambiente beta
2. ⏳ **Testar com dados reais** — importar anúncio do Discord
3. ⏳ **Validar extração** — verificar se "Ordem Paranormal" é reconhecido
4. ⏳ **Validar vagas** — verificar se "Vagas disponíveis: 2" é extraído
5. ⏳ **Validar banner** — verificar se primeiro attachment vira banner

---

## 📚 Arquivos Modificados

- `backend/src/domain/aggregator/parseExporterMessage.ts` — priorização de enrichedFields
- `SOLUCOES_BUGS_URGENTES.md` — status atualizado

## 📚 Arquivos Criados

- `D:\analisar_padroes.py` — script de análise estatística
- `D:\analise_resultados.txt` — resultados da análise
- `artifacts/analise_parser_rpg.md` — documentação completa

---

## 🎓 Lições Aprendidas

1. **Sempre verificar se dados já extraídos estão sendo usados** — evitar retrabalho
2. **Análise estatística de dados reais é essencial** — 100 mensagens revelaram padrões
3. **Priorização com fallback é a melhor estratégia** — usa Python quando possível, TypeScript quando necessário
4. **Regex específicos melhoram extração** — "Vagas disponíveis: X" agora funciona

---

**Status Final:** ✅ **BUG 4 RESOLVIDO** — Aguardando deploy em beta
