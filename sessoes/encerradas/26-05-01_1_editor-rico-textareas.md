# Sessão 26-05-01_1 — Editor Rico em Textareas

**Data**: 2026-05-01
**Objetivo**: Executar spec kit completo (specify → plan → tasks) para spec 009-editor-rico-textareas com pesquisa real do código.

**Sessão Anterior**: `encerradas/26-04-29_4_catalogo-painel-ux-bugs.md`
**Próxima Sessão**: a definir

---

## Plano de Execução

1. Leitura de AGENTS.md e constitution.md ✅
2. Verificar estado do projeto e sessões ativas ✅
3. Pesquisar código real: componentes de editor, textareas, uso em Descrição da Mesa ✅
4. `/speckit.specify` — validar spec.md existente, atualizar feature.json ✅
5. `/speckit.plan` — atualizar plan.md e research.md com achados reais de código ✅
6. `/speckit.tasks` — regenerar tasks.md com sessão correta e caminhos reais ✅
7. Atualizar AGENTS.md com plano ativo ✅
8. Atualizar project-state.md ✅
9. Atualizar sessoes/index.md ✅

---

## Arquivos modificados

- `specs/009-editor-rico-textareas/research.md` — atualizado com achados reais do código
- `specs/009-editor-rico-textareas/plan.md` — atualizado com componente canônico (MarkdownEditor) e caminhos reais
- `specs/009-editor-rico-textareas/tasks.md` — regenerado: sessão correta, caminhos reais, 22 tasks
- `.specify/feature.json` — atualizado para apontar spec 009
- `AGENTS.md` — ponteiro de plano ativo atualizado
- `.specify/memory/project-state.md` — estado atualizado
- `sessoes/index.md` — esta sessão adicionada

---

## Achados da Pesquisa de Código

### Editor canônico confirmado

| Componente | Arquivo | Biblioteca |
|---|---|---|
| `MarkdownEditor` | `frontend/src/components/MarkdownEditor.tsx` | react-markdown-editor-lite v1.4.2 + markdown-it v14.1.1 |

**Status**: componente pronto, dependência instalada, **não usado em nenhum formulário ainda**.

**RichTextArea** (`frontend/src/components/RichTextArea.tsx`) é o editor atual em "Descrição da Mesa" (StepBasic.tsx:33) e outros 4 campos em StepFinal — todos candidatos a upgrade.

### Inventário: 10 `<textarea>` nus

| # | Arquivo | Campo | Tela |
|---|---|---|---|
| 1 | `components/form-steps/steps/StepFinal.tsx:230` | `billing_text` | Criar/Editar Mesa |
| 2 | `components/form-steps/steps/StepFinal.tsx:462` | `ddal_rules_notes` | Criar/Editar Mesa |
| 3 | `pages/ProfileEditPage.tsx:484` | `bio` | Perfil |
| 4 | `pages/ProfileEditPage.tsx:744` | `bio_long` | Perfil Mestre |
| 5 | `pages/PainelMestrePage.tsx:191` | `gm-bio` | Painel do Mestre |
| 6 | `pages/OnboardingPage.tsx:274` | `onboarding-bio` | Onboarding |
| 7 | `components/SystemSuggestionModal.tsx:217` | `description` | Catálogo |
| 8 | `components/SessionRepeater.tsx:228` | `notes` | Criar/Editar Mesa |
| 9 | `components/ScenarioSuggestionModal.tsx:121` | `description` | Catálogo |
| 10 | `components/mestre/MestreContactForm.tsx:110` | `message` | Contato |

### 5 campos com RichTextArea (candidatos a upgrade)

| Arquivo | Campo |
|---|---|
| `StepBasic.tsx:33` | `description` (Descrição da Mesa) |
| `StepFinal.tsx:164` | `rules_notes` |
| `StepFinal.tsx:258` | `synopsis` |
| `StepFinal.tsx:268` | `style_text` |
| `StepFinal.tsx:290` | `technical_requirements` |

---

## Implementação — Phase 4 (US2): Substituições com MarkdownEditor

### Campos substituídos (8 total)

| ID | Campo | Arquivo | Editor anterior | height | maxLength |
|---|---|---|---|---|---|
| B01 | `description` | `StepBasic.tsx` | RichTextArea | 300 | — |
| B02 | `rules_notes` | `StepFinal.tsx` | RichTextArea | 200 | 1500 |
| B03 | `synopsis` | `StepFinal.tsx` | RichTextArea | 250 | 2000 |
| B04 | `style_text` | `StepFinal.tsx` | RichTextArea | 180 | 500 |
| B05 | `technical_requirements` | `StepFinal.tsx` | RichTextArea | 180 | 1000 |
| A03 | `bio` | `ProfileEditPage.tsx` | `<textarea>` | 200 | 500 |
| A04 | `bio_long` | `ProfileEditPage.tsx` | `<textarea>` | 300 | 2000 |
| A05 | `gm-bio` | `PainelMestrePage.tsx` | `<textarea>` | 200 | — |

**Nota técnica (A03/A04)**: `ProfileEditPage` usa padrão `defaultValue` (React Query + uncontrolled). Para compatibilidade com o `value` prop obrigatório do `MarkdownEditor`, foram adicionados `useState` locais (`bio` em `TabGeral`, `bioLong` em `TabMestre`) sincronizados com `updateProfile`/`updateGm` no `onChange`.

### Build T011 (após StepBasic)

```
> tsc -b && vite build
✓ built in ~1.2s — zero erros TypeScript
```

### Build T014 (final — após todas as substituições)

```
> tsc -b && vite build
✓ built in 686ms — zero erros TypeScript
```

---

## Phase 5 (US3): Campos não elegíveis preservados

### Grep final T019

Saída de `grep -rn "<textarea" frontend/src/`:

```
frontend/src/components/form-steps/steps/StepFinal.tsx:231     billing_text      (não elegível — campo de cobrança)
frontend/src/components/form-steps/steps/StepFinal.tsx:466     ddal_rules_notes  (não elegível — DDAL only)
frontend/src/components/mestre/MestreContactForm.tsx:110       message           (não elegível — formulário de contato)
frontend/src/components/RichTextArea.tsx:135                   <textarea> interno (não elegível — implementação interna)
frontend/src/components/ScenarioSuggestionModal.tsx:121        description       (não elegível — modal admin)
frontend/src/components/SessionRepeater.tsx:228                notes             (não elegível — campo curto)
frontend/src/components/SystemSuggestionModal.tsx:217          description       (não elegível — modal admin)
frontend/src/pages/OnboardingPage.tsx:274                      onboarding-bio    (não elegível — onboarding único)
```

**Total**: 8 ocorrências = 7 campos não elegíveis + 1 interno (`RichTextArea.tsx`). Todos presentes no inventário com justificativa.

---

## Checklist de Fechamento

- [x] `/speckit.specify` concluído — feature.json → 009
- [x] `/speckit.plan` concluído — research.md e plan.md atualizados
- [x] `/speckit.tasks` concluído — 22 tasks, caminhos reais, sessão correta
- [x] `.specify/feature.json` atualizado para 009
- [x] `AGENTS.md` atualizado com plano ativo
- [x] `sessoes/index.md` atualizado
- [x] `.specify/memory/project-state.md` atualizado
- [ ] Mover sessão para encerradas/ (quando autorizado)
