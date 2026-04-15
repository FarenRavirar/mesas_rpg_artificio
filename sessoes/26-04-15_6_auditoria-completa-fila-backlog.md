# 26-04-15_6_auditoria-completa-fila-backlog.md

**Data:** 15/04/2026 17:00 BRT  
**Objetivo:** Auditoria completa da FILA_IMPLEMENTACAO.md vs BACKLOG_OPERACIONAL.md — verificar item por item, mapear status no código, hidratar pendentes.

**IMPORTANTE:** Esta sessão deve ser executada em múltiplas etapas. A cada item verificado, MARCAR como verificado para não perder o progresso em caso de interrupção.

---

## Vínculos

- **Sessão Anterior:** `26-04-15_5_unificacao-docs.md`
- **Próxima Sessão:** — (continuar esta se necessário)

---

## 🎯 Objetivo da Auditoria

Para cada item da FILA (059 a 100):
1. Verificar se existe correspondência no BACKLOG
2. Verificar status atual no código
3. Classificar: ✅ Implementado | ⏳ Parcial | ❌ Pendente | 🔄 Descartado
4. Se pendente sem correspondência no BACKLOG → criar entrada
5. Atualizar FILA com status verificado

---

## 📋 Sistema de Progresso

**NÃO PROSSIGA SEM MARCAR O ITEM ANTERIOR COMO VERIFICADO.**

每 item deve ter:
- [ ] Verificado = marcado quando completar análise desse item
- Status preenchido
-BACKLOG atualizado (se necessário)
- FILA atualizada (se necessário)

---

## 🔧 Comandos de Verificação

```bash
# Verificar se existe no BACKLOG (sempre fazer primeiro)
grep -n "palavra-chave" BACKLOG_OPERACIONAL.md

# Verificar no código (exemplos de padrões)
grep -rn "age_rating" src/
grep -rn "level_range" src/
grep -rn "markdown" src/
grep -rn "times_per_month" src/
grep -rn "setting_name" src/
```

---

## §1. VERIFICAÇÃO — Itens da FILA

### Item 059 — Atalhos teclado
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** `GestaoPage.tsx` tem event listeners para A/R/Esc? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 060 — Busca texto candidatos
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** campo busca em GestaoPage? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 061 — Status PT-BR
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** traduções em GestaoPage? [ ] "Aguardando Revisão", "Aceito", "Rejeitado"? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 062 — Botão Cancelar modal
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** botão "Cancelar" em GestaoPage modal? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 064 — Ordenação candidatos
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** dropdown ordenação em GestaoPage? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 065 — Tabs modal revisão
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** tabs "Dados Extraídos", "Dados Brutos", "Preview"? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 066 — Erros específicos
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** mensagens customizadas em GestaoPage? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 067 — Tooltips explicativos
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** tooltips em campos complexos? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

---

## §2. ITENS DE ALTA PRIORIDADE

### Item 075 — Plataformas como tabelas
- **Verificado:** [ ]
- **BACKLOG:** ↔ "Plataformas (tabelas)" — existente em §1? [ ]
- **Código:** tabelas game_platforms e communication_platforms existem? [ ]
- **Código:** campos texto (vtt_platform_id) existem? [ ]
- **Pergunta:** campos texto são suficientes ou precisa de tabelas? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Validar necessidade | [ ] Atualizar BACKLOG | [ ] Atualizar FILA
- **Checkpoint:** Após validar, MARCAR como ⏳ Validar ou ✅/❌

### Item 082 — Markdown sanitizer backend
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** utils/markdownSanitizer.ts existe? [ ]
- **Código:** validators usam DOMPurify/marked? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 084 — Faixa etária dropdown
- **Verificado:** [ ]
- **BACKLOG:** ↔ REQ-21 — existente? [ ]
- **Código:** StepConfig.tsx tem dropdown para age_rating? [ ]
- **Código:** valores fixos (livre/+10/+12/+14/+16/+18)? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 085 — Nível mesa dropdown
- **Verificado:** [ ]
- **BACKLOG:** ↔ REQ-26 — existente? [ ]
- **Código:** StepFinal.tsx tem dropdown para level_range? [ ]
- **Código:** valores fixos (Iniciante/Intermediário/Avançado/Misto)? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 086 — Frequência detallada
- **Verificado:** [ ]
- **BACKLOG:** ↔ REQ-30 — existente? [ ]
- **Código:** table_schedules tem times_per_month? [ ]
- **Código:** table_schedules tem custom_notes? [ ]
- **Código:** SessionRepeater tem campos extras? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 089 — Render markdown MesaPage
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** MesaPage.tsx usa react-markdown ou dangerouslySetInnerHTML? [ ]
- **Dependência:** Item 082 (sanitizer) pronto? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 096 — Dados brutos completos
- **Verificado:** [ ]
- **BACKLOG:** existe? [ ] Qual REQ?
- **Código:** GestaoPage.tsx mostra JSON completo? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 097 — Migration cenário/estilos
- **Verificado:** [ ]
- **BACKLOG:** ↔ REQ-21 (parcial) — existente? [ ]
- **Código:** tabela tables tem setting_name? [ ]
- **Código:** tabela tables tem setting_styles? [ ]
- **Código:** tabela setting_style_suggestions existe? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 098 — Endpoint sugestões estilos
- **Verificado:** [ ]
- **BACKLOG:** ↔ REQ-21 (parcial) — existente? [ ]
- **Código:** GET /settings/suggest-styles existe? [ ]
- **Dependência:** Item 097 (migration) aplicada? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 100 — Campos Cenário/Estilo
- **Verificado:** [ ]
- **BACKLOG:** ↔ REQ-21 (parcial) — existente? [ ]
- **Código:** formulário tem campo "Cenário"? [ ]
- **Código:** formulário tem campo "Estilos"? [ ]
- **Código:** MesaPage exibe cenário/estilos? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

---

## §3. CONSOLIDAÇÃO

Após verificar todos os itens:

### Lista de Pendentes (criar/atualizar no BACKLOG)
- [ ] Item XXX: [descrição] → criar REQ-XX
- [ ] ...

### Lista de Status Confirmados (atualizar na FILA)
- [ ] Item XXX: ✅ Implementado
- [ ] Item YYY: ⏳ Parcial
- [ ] ...

### Itens para Hydratar no BACKLOG
- [ ] REQ-XX: [descrição] — adicionar da FILA 059-067 (UX Gestão)
- [ ] REQ-XX: Markdown sanitizer — adicionar da FILA 082
- [ ] ...

---

## 📝 Checklist de Execução

- [ ] Ler BACKLOG_OPERACIONAL.md para contexto
- [ ] Ler FILA_IMPLEMENTACAO.md para contexto
- [ ] Para cada item 059-067: verificar código, classificar status, atualizar
- [ ] Para cada item 075-100: verificar código, classificar status, atualizar
- [ ] Consolidar pendentes
- [ ] Criar/atualizar REQs no BACKLOG se necessário
- [ ] Atualizar FILA com status verificado
- [ ] Criar sessão de resultado
- [ ] Atualizar RESUMO_EXECUCAO.md

---

## ⚠️ Regra de Ouro

**A cada item verificado, MARCAR como verificado nesta sessão ANTES de passar para o próximo.**

Se a sessão for interrompida (energia acaba, tempo limite, etc):
1. Esta sessão contém todo o progresso
2. O próximo agente pode continuar de onde parou
3.Basta buscar o último item não marcado e continuar

**NÃO criar novos checkpoints — usar os já definidos.**

---

## 🚀 Iniciar Execução

Começar pelo Item 059 e prosseguir em ordem. A cada conclusão:
1. Preencher campos do item
2. MARCAR como [x] Verificado
3. Atualizar BACKLOG se necessário
4. Atualizar FILA se necessário
5. Passar para próximo item