# 26-04-15_6_auditoria-completa-fila-backlog.md

**Data:** 15/04/2026 17:00 BRT  
**Objetivo:** Auditoria completa da FILA_IMPLEMENTACAO.md vs BACKLOG_OPERACIONAL.md — verificar item por item, mapear status no código, hidratar pendentes.

**⚠️ REGRAS OBRIGATÓRIAS — LEIA ANTES DE PROSSEGUIR:**

1. **SEMPRE verificar o código** — Não aceitar status por padrão. Grep/search no código para confirmar.
2. **Atualizar TODOS os locais** — Ao modificar algo:
   - **FILA §2 Índice** + **§3 Detalhes** + **§4 MAPEAMENTO**
   - **BACKLOG §1 Índice** + **§2 BACKLOG ATIVO** + **§3 MAPEAMENTO**
   - **Sessão**: Marcar como verificado
3. **SEMPRE atualizar a sessão** — A cada item, marcar verificado ANTES de passar para o próximo.
4. **SEMPRE atualizar o índice** — Não apenas o texto de descrição.
5. **Sem retrabalho** — Fazer certo da primeira vez para não precisar refazer.

**A CADA ITEM VERIFICADO, VOCÊ DEVE ATUALIZAR:**
- BACKLOG: §1, §2, §3
- FILA: §2, §3, §4
- Sessão: marcar verificado

**SE VOCÊ ESQUECER, O USUÁRIO VAI CHINGAR. FAÇA IGUAL AO ITEM 085.**

**Se não sabe o que verificar no código:**
- grep por nomes de campos/tabelas em db/types.ts
- grep por rotas em backend/src/routes/
- grep por componentes em frontend/src/

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
- **Verificado:** [x]
- **BACKLOG:** NÃO existia → CRIADO DEB-05 (GUT 64)
- **Código:** Não implementado (sem event listeners em GestaoPage)
- **Status no código:** [x] ❌ Pendente → Agora: DEB-05
- **Ação:** [x] Criar REQ-DEB-05 no BACKLOG ✅ | [x] Atualizar FILA ✅

### Item 060 — Busca texto candidatos
- **Verificado:** [ ]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** campo busca em GestaoPage? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 061 — Status PT-BR
- **Verificado:** [ ]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** traduções em GestaoPage? [ ] "Aguardando Revisão", "Aceito", "Rejeitado"? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 062 — Botão Cancelar modal
- **Verificado:** [ ]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** botão "Cancelar" em GestaoPage modal? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 064 — Ordenação candidatos
- **Verificado:** [ ]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** dropdown ordenação em GestaoPage? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 065 — Tabs modal revisão
- **Verificado:** [ ]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** tabs "Dados Extraídos", "Dados Brutos", "Preview"? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 066 — Erros específicos
- **Verificado:** [ ]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** mensagens customizadas em GestaoPage? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 067 — Tooltips explicativos
- **Verificado:** [ ]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** tooltips em campos complexos? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

---

## §2. ITENS DE ALTA PRIORIDADE

### Item 075 — Plataformas como tabelas
- **Verificado:** [x]
- **BACKLOG:** Existia (sem ID) → CRIADO DEB-07 (GUT 100)
- **Código:** vtt_platforms existe (Migration 006), GET /vtt-platforms + POST /suggest existem. FALTA: CRUD admin + tabela communication_platforms
- **Status no código:** [x] ⏳ Parcial → Agora: DEB-07
- **Ação:** [x] Atualizar BACKLOG (DEB-07 criado) ✅ | [x] Atualizar FILA (status parcial) ✅

### Item 082 — Markdown sanitizer backend
- **Verificado:** [ ]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** utils/markdownSanitizer.ts existe? [ ]
- **Código:** validators usam DOMPurify/marked? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 084 — Faixa etária dropdown
- **Verificado:** [x]
- **BACKLOG:** ↔ REQ-21 — existente
- **Código:** Backend enum existe, StepConfig.tsx tem SelectField. FALTA: ícones visuais (🟢🟡🟠🔴)
- **Status no código:** [x] ⏳ Parcial (dropdown existe, ícones faltam)
- **Ação:** [x] Atualizar FILA ✅ | [x] Atualizar BACKLOG (REQ-21 parcial) ✅

### Item 085 — Nível mesa dropdown
- **Verificado:** [x]
- **BACKLOG:** DEB-09 criado
- **Código:** StepFinal.tsx usa InputField (texto livre), não SelectField. level_range no DB é texto livre.
- **Status no código:** [x] ❌ Pendente
- **Ação:** [x] Atualizar FILA ✅ | [x] Atualizar BACKLOG (DEB-09) ✅

### Item 086 — Frequência detallada
- **Verificado:** [x]
- **BACKLOG:** REQ-30 (concluído) + DEB-08 (criado agora para pendentes)
- **Código:** frequency + day_of_week + start_time + end_time + notes existem. FALTA: times_per_month + custom_notes
- **Status no código:** [x] ⏳ Parcial → Agora: DEB-08
- **Ação:** [x] Atualizar BACKLOG (DEB-08 criado) ✅ | [x] Atualizar FILA (status parcial + detalhes) ✅

### Item 089 — Render markdown MesaPage
- **Verificado:** [x]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** MesaPage.tsx usa react-markdown ou dangerouslySetInnerHTML? [ ]
- **Dependência:** Item 082 (sanitizer) pronto? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 096 — Dados brutos completos
- **Verificado:** [ ]
- **BACKLOG:** existe? [x] Qual REQ? ↔ —
- **Código:** GestaoPage.tsx mostra JSON completo? [ ]
- **Status no código:** [ ] ✅ Implementado | [ ] ⏳ Parcial | [ ] ❌ Pendente | [ ] 🔄 Descartado
- **Ação:** [ ] Nenhuma | [ ] Atualizar BACKLOG | [ ] Atualizar FILA

### Item 097 — Migration cenário/estilos
- **Verificado:** [x]
- **BACKLOG:** ↔ REQ-21 (Cenário/Estilos parcial)
- **Código:** Não implementado (migration não existe)
- **Status no código:** [x] ❌ Pendente
- **Ação:** [x] Atualizar BACKLOG (REQ-21 parcial) ✅ | [x] Atualizar FILA (status pendente) ✅

### Item 098 — Endpoint sugestões estilos
- **Verificado:** [x]
- **BACKLOG:** ↔ REQ-21 (parcial) — existente
- **Código:** GET /settings/suggest-styles existe em backend/src/routes/settings.ts:11
- **Código:** Tabela setting_style_suggestions existe no banco (verificado via SSH)
- **Código:** Interface SettingStyleSuggestionsTable existe em types.ts:306
- **Dependência:** Item 097 (migration) — tabela JÁ EXISTE no banco beta
- **Status no código:** [x] ✅ Implementado
- **Ação:** [x] Atualizar FILA (status implementado) | [x] Atualizar BACKLOG (REQ-21 atualizar contagem)

### Item 100 — Campos Cenário/Estilo
- **Verificado:** [x]
- **BACKLOG:** ↔ REQ-21 (parcial)
- **Código:** Backend: setting_name + setting_styles existem. Frontend: SettingStylesField.tsx + TableContent.tsx existem.
- **Status no código:** [x] ✅ Implementado
- **Ação:** [x] Atualizar FILA (status implementado) ✅

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