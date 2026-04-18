# Sessão: 14-04_correcoes-onboarding

**Data:** 14/04/2026 18:30 BRT  
**Objetivo:** Corrigir bugs e implementar melhorias do REQ-30 + features name_pt, toggle PT/EN

---

## Checklist de Execução

- [x] BUG 3 - Remover campo frequência duplicado do SessionRepeater
- [x] MELHORIA 1 - Remover "Vagas por Sessão", manter slots_total + slots_open
- [x] Label "Roleplay" → "Socialização" em ProfileEditPage e PlayerPage
- [x] MELHORIA 2 - Cenário duplicado: selectedScenarioName como readonly
- [x] BUG 4 - Editor rico (RichTextArea) em description, rules_notes, technical_requirements
- [x] MELHORIA 3 - Preview banner (já existia)
- [x] FEATURE 1 - name_pt: migration 102 + backend + frontend
- [x] FEATURE 2 - Toggle PT/EN nos seletores de sistema/cenário
- [x] FEATURE 3 - Sugestão de sistema (já existia)
- [x] Atualizar RESUMO_EXECUCAO.md
- [x] Atualizar BACKLOG_OPERACIONAL.md
- [ ] Aplicar migration_102 no banco beta
- [ ] Deploy para beta

---

## Arquivos Modificados

**Frontend:**
- `frontend/src/components/SessionRepeater.tsx` - removido frequency e slots_per_session
- `frontend/src/components/SettingStylesField.tsx` - adicionado selectedScenarioName
- `frontend/src/styles/SettingStylesField.css` - estilo para badge de cenário
- `frontend/src/components/form-steps/steps/StepFinal.tsx` - RichTextArea, props
- `frontend/src/components/form-steps/steps/StepBasic.tsx` - RichTextArea em description
- `frontend/src/components/SystemTreeSelector.tsx` - toggle PT/EN, name_pt
- `frontend/src/components/ScenarioSelector.tsx` - toggle PT/EN, name_pt
- `frontend/src/components/ProfileEditPage.tsx` - Roleplay → Socialização
- `frontend/src/components/PlayerPage.tsx` - Roleplay → Socialização
- `frontend/src/types/systems.ts` - name_pt no SystemTreeNode

**Backend:**
- `backend/src/db/types.ts` - name_pt em SystemsTable e ScenariosTable
- `backend/src/routes/systems.ts` - name_pt em GET/POST/PUT
- `backend/src/routes/scenarios.ts` - name_pt em GET/POST/PUT

**Database:**
- `database/migration_102_add_name_pt.sql` - NOVO

---

## Pendências

1. Aplicar migration_102_add_name_pt.sql no banco beta (requer acesso SSH)
2. Deploy para validar alterações em beta