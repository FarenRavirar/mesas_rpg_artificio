# Inventário de Textareas — Editor Rico em Textareas

**Feature**: `specs/009-editor-rico-textareas/`
**Criado**: 2026-05-01
**Sessão**: `sessoes/26-05-01_1_editor-rico-textareas.md`

**Editor canônico**: `frontend/src/components/MarkdownEditor.tsx`
**Biblioteca**: `react-markdown-editor-lite` v1.4.2 + `markdown-it` v14.1.1
**Status da dependência**: ✅ Instalada em `frontend/package.json`

---

## Seção A — `<textarea>` nu (10 ocorrências)

| # | Arquivo | Linha | Campo ID | Tela | Finalidade | Classificação | Justificativa |
|---|---|---|---|---|---|---|---|
| A01 | `components/form-steps/steps/StepFinal.tsx` | 230 | `billing_text` | Criar/Editar Mesa | Texto descritivo sobre cobrança (2 linhas, opcional) | não elegível | Campo financeiro curto; formatting markdown prejudica clareza de valores e condições |
| A02 | `components/form-steps/steps/StepFinal.tsx` | 462 | `ddal_rules_notes` | Criar/Editar Mesa | Notas de regras da temporada DDAL (3 linhas, interno) | não elegível | Campo técnico e interno destinado a organizadores DDAL; texto puro é mais adequado |
| A03 | `pages/ProfileEditPage.tsx` | 484 | `bio` | Perfil | Bio curta do usuário (campo de perfil público) | elegível | Bio pública exibida em perfil; formatação básica (negrito, ênfase) agrega valor |
| A04 | `pages/ProfileEditPage.tsx` | 744 | `bio_long` | Perfil Mestre | Bio detalhada do mestre (campo longo de perfil público) | elegível | Campo descritivo longo e público; formatação enriquece apresentação do mestre |
| A05 | `pages/PainelMestrePage.tsx` | 191 | `gm-bio` | Painel do Mestre | Bio do mestre editável no painel (campo público) | elegível | Mesmo propósito de bio_long; campo público que se beneficia de formatação |
| A06 | `pages/OnboardingPage.tsx` | 274 | `onboarding-bio` | Onboarding | Bio curta no cadastro inicial | não elegível | Onboarding deve ser simples e rápido; editor rico cria fricção no fluxo de entrada |
| A07 | `components/SystemSuggestionModal.tsx` | 217 | `description` | Catálogo — Modal | Descrição de sugestão de sistema (modal transitório) | não elegível | Campo dentro de modal de sugestão; editor rico é desproporcional para contexto de sugestão rápida |
| A08 | `components/SessionRepeater.tsx` | 228 | `notes` | Criar/Editar Mesa | Observações de sessão repetida (campo operacional curto) | não elegível | Campo operacional e de preenchimento rápido; formatting não agrega valor |
| A09 | `components/ScenarioSuggestionModal.tsx` | 121 | `description` | Catálogo — Modal | Descrição de sugestão de cenário (modal transitório) | não elegível | Mesmo caso do A07; modal de sugestão rápida não justifica editor rico |
| A10 | `components/mestre/MestreContactForm.tsx` | 110 | `message` | Contato | Mensagem de contato ao mestre | não elegível | Mensagem livre de contato; formatação markdown não é esperada pelo destinatário |

**Resumo Seção A**: 3 elegíveis (A03, A04, A05) / 7 não elegíveis

---

## Seção B — Campos com `RichTextArea` (candidatos a upgrade)

| # | Arquivo | Linha | Campo ID | Tela | Finalidade | Classificação | Justificativa |
|---|---|---|---|---|---|---|---|
| B01 | `components/form-steps/steps/StepBasic.tsx` | 33 | `description` | Criar/Editar Mesa | Descrição principal da mesa (campo central, público) | elegível | Campo mais importante da mesa; upgrade para MarkdownEditor traz preview, full-screen e formatação completa |
| B02 | `components/form-steps/steps/StepFinal.tsx` | 164 | `rules_notes` | Criar/Editar Mesa | Regras e observações da mesa (opcional, público) | elegível | Campo descritivo público; MarkdownEditor melhora a qualidade de formatação das regras |
| B03 | `components/form-steps/steps/StepFinal.tsx` | 258 | `synopsis` | Criar/Editar Mesa | Sinopse narrativa (opcional, público) | elegível | Campo narrativo longo; MarkdownEditor é ideal para sinopses com formatação expressiva |
| B04 | `components/form-steps/steps/StepFinal.tsx` | 268 | `style_text` | Criar/Editar Mesa | Estilo de jogo (opcional, público, max 500 chars) | elegível | Campo público exibido no catálogo; formatação agrega valor mesmo com limite curto |
| B05 | `components/form-steps/steps/StepFinal.tsx` | 290 | `technical_requirements` | Criar/Editar Mesa | Requisitos técnicos detalhados (opcional, público) | elegível | Campo descritivo com potencial de listas e formatação; upgrade melhora a apresentação |

**Resumo Seção B**: 5 elegíveis / 0 não elegíveis

---

## Resumo Geral

| Categoria | Total | Elegíveis | Não elegíveis |
|---|---|---|---|
| `<textarea>` nu (Seção A) | 10 | 3 | 7 |
| `RichTextArea` (Seção B) | 5 | 5 | 0 |
| **Total** | **15** | **8** | **7** |

---

## Arquivos que serão modificados (elegíveis confirmados)

| Arquivo | Campos |
|---|---|
| `frontend/src/pages/ProfileEditPage.tsx` | `bio` (A03), `bio_long` (A04) |
| `frontend/src/pages/PainelMestrePage.tsx` | `gm-bio` (A05) |
| `frontend/src/components/form-steps/steps/StepBasic.tsx` | `description` (B01) |
| `frontend/src/components/form-steps/steps/StepFinal.tsx` | `rules_notes` (B02), `synopsis` (B03), `style_text` (B04), `technical_requirements` (B05) |

**Total**: 5 arquivos, 8 campos elegíveis a substituir.

---

## Campos não elegíveis — confirmação de preservação

| Campo | Arquivo | Mantido como |
|---|---|---|
| `billing_text` | `StepFinal.tsx` | `<textarea>` |
| `ddal_rules_notes` | `StepFinal.tsx` | `<textarea>` |
| `onboarding-bio` | `OnboardingPage.tsx` | `<textarea>` |
| `description` modal | `SystemSuggestionModal.tsx` | `<textarea>` |
| `notes` | `SessionRepeater.tsx` | `<textarea>` |
| `description` modal | `ScenarioSuggestionModal.tsx` | `<textarea>` |
| `message` | `MestreContactForm.tsx` | `<textarea>` |
