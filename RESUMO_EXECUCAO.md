# RESUMO_EXECUCAO.md

**Última atualização:** 14/04/2026 18:30 BRT

---

## Estado Atual do Projeto

**Ambiente Beta:** `mesasbeta.artificiorpg.com` — deploy automático por `dev`  
**Ambiente Produção:** `mesas.artificiorpg.com` — sem alteração de workflow nesta etapa  
**Branch ativa:** `dev`

**Correções do REQ-30 (Onboarding de Mesas) - CONCLUÍDAS:**
- BUG 3: Removido campo "Frequência" duplicado no SessionRepeater (ao lado do dia)
- MELHORIA 1: Removido "Vagas por Sessão", simplificado para slots_total + slots_open
- Label "Roleplay" → "Socialização" em ProfileEditPage e PlayerPage

**MELHORIA 2 - Cenário duplicado:**
- Adicionado `selectedScenarioName` no StepFinal
- Exibido como badge readonly em SettingStylesField quando cenário foi selecionado na Etapa 2
- Se não selecionou, permite digitar novo cenário

**BUG 4 - Editor rico:**
- Substituído `<textarea>` por `<RichTextArea>` (com toolbar) nos campos:
  - Descrição da Mesa (StepBasic)
  - Regras/Observações da Mesa (StepFinal)
  - Requisitos Detalhados (StepFinal)

**FEATURE 1 - Campo name_pt:**
- Migration 102 adiciona coluna name_pt em systems e scenarios
- Backend: GET/POST/PUT retornam e aceitam name_pt
- Frontend: SystemTreeNode e Scenario incluem name_pt

**FEATURE 2 - Toggle PT/EN:**
- Botões PT/EN adicionados em SystemTreeSelector e ScenarioSelector
- Ao trocar idioma, exibe name_pt ou name conforme seleção

**FEATURE 3 - Sugestão de sistema:**
- Sistema de sugestão já existente no StepSystem (+ Adicionar Sistema)
- Cenário pode ser sugerido via SettingStylesField (campo texto livre)

---

## Próxima Ação

- Aplicar migration_102_add_name_pt.sql no banco beta
- Deploy para validar alterações em beta

---

## Última Sessão

**Data:** 14/04/2026 18:30 BRT  
**Tipo:** Correções do REQ-30 + Features name_pt, toggle PT/EN, sugestão de sistema  
**O que foi feito:** 
- BUG 3: Removido campo frequência duplicado do SessionRepeater
- MELHORIA 1: Removido vagas por sessão, simplificado para slots_total + slots_open
- Label Roleplay → Socialização
- MELHORIA 2: Cenário exibido como readonly se selecionado na Etapa 2
- BUG 4: Editor rico (RichTextArea) adicionado em description, rules_notes, technical_requirements
- FEATURE 1: name_pt em sistemas e cenários (migration 102 + backend + frontend)
- FEATURE 2: Toggle PT/EN nos seletores
- FEATURE 3: Sistema de sugestão já existe, cenário via campo texto

**Status:** ✅ Concluído — aguardando aplicação da migration e deploy
**Arquivo:** `sessoes/resumo_14-04_correcoes-onboarding.md`

---

## Se der incidente e você precisar abrir novo chat

Abrir o novo chat já apontando estes arquivos, nesta ordem:
1. `RESUMO_EXECUCAO.md` (estado mais recente)
2. `TODO_OPERACIONAL.md` (backlog de bugs e features)
3. `FILA_IMPLEMENTACAO.md` (itens técnicos pendentes)
4. `database/migration_102_add_name_pt.sql` (pronta para aplicar)