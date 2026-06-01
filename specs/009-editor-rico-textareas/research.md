# Research: Editor Rico em Textareas

## Decision 1: Inventário completo antes de qualquer substituição

**Rationale**: O pedido exige mapeamento de todo local com `textarea`. Substituir campo por campo sem inventário cria risco de inconsistência, regressão e duplicidade de padrões.

**Alternatives considered**:
- Procurar apenas campos visíveis ao usuário final: rejeitado porque pode deixar formulários administrativos ou secundários inconsistentes.
- Substituir todos automaticamente: rejeitado porque nem todo campo longo deve ter formatação rica.

## Decision 2: MarkdownEditor é a referência canônica (não RichTextArea)

**Rationale**: O projeto possui `frontend/src/components/MarkdownEditor.tsx` usando `react-markdown-editor-lite` v1.4.2 e `markdown-it` v14.1.1 — já instalados em `frontend/package.json`. Esse componente tem toolbar completa (negrito, itálico, sublinhado, tachado, títulos, listas, blockquote, código inline/bloco, tabela, link, full-screen, mode-toggle). É mais rico e mais consistente do que `RichTextArea`. O mantenedor confirmou que `MarkdownEditor` é o editor ideal para padronização.

**Achado crítico**: `MarkdownEditor` existe no código (`frontend/src/components/MarkdownEditor.tsx`) mas **não está sendo usado em nenhum lugar** — nenhum `import` além do próprio arquivo foi encontrado. É um componente pronto aguardando adoção.

**Achado crítico**: "Descrição da Mesa" (`StepBasic.tsx:33`) usa `RichTextArea` atualmente, **não** `MarkdownEditor`. `RichTextArea` é um editor simplificado custom que usa `<textarea>` internamente com toolbar básica de markdown. Os campos que já usam `RichTextArea` também são candidatos à substituição por `MarkdownEditor`.

**Alternatives considered**:
- Usar `RichTextArea` como referência canônica: rejeitado pelo mantenedor — é um editor limitado sem preview real, full-screen ou tabelas.
- Criar novo editor: rejeitado por duplicar UX e manutenção.

## Decision 3: Elegibilidade depende da finalidade do campo

**Rationale**: Campos descritivos longos (bios, sinopse, descrições de campanha) se beneficiam de formatação markdown. Campos funcionais curtos (mensagem de contato, texto de cobrança, notas DDAL internas, observações de sessão repetida) devem ser classificados individualmente durante execução.

**Alternatives considered**:
- Todo `textarea` vira editor rico: rejeitado por excesso de complexidade.
- Nenhum `textarea` muda sem pedido específico: rejeitado porque mantém inconsistência geral.

## Decision 4: Validações e limites existentes devem ser preservados

**Rationale**: A troca do componente de entrada não pode alterar contrato funcional do formulário. `MarkdownEditor` expõe `onChange({ text })` e aceita `value` (string) — integração com formulários React não requer mudança de tipo de dado.

**Alternatives considered**:
- Remover limites para permitir formatação: rejeitado porque muda regra de produto.
- Migrar validações depois: rejeitado porque gera risco de regressão.

## Decision 5: Conteúdo legado em texto puro deve continuar editável

**Rationale**: Campos existentes podem ter conteúdo salvo sem marcação markdown. `MarkdownEditor` exibe texto puro normalmente no modo de edição — sem perda de conteúdo legado.

**Alternatives considered**:
- Converter conteúdo legado em lote: rejeitado porque sugere mudança de dados não solicitada.
- Exigir recriação manual do conteúdo: rejeitado porque prejudica usuários.

## Decision 6: Responsividade do editor deve ser validada em cada fluxo substituído

**Rationale**: `react-markdown-editor-lite` tem barra de ferramentas e área de edição que podem quebrar layouts em mobile. Cada formulário afetado precisa de validação em desktop e mobile.

**Alternatives considered**:
- Validar apenas o componente isolado: rejeitado porque o problema costuma aparecer no contexto do formulário.
- Validar apenas desktop: rejeitado porque o produto exige abordagem responsiva.

---

## Inventário de `<textarea>` nu encontrado no frontend

Pesquisa executada em `frontend/src/` — 10 ocorrências de `<textarea>` nu classificáveis:

| # | Arquivo | Campo | Tela | Observação |
|---|---|---|---|---|
| 1 | `components/form-steps/steps/StepFinal.tsx:230` | `billing_text` | Criar/Editar Mesa | Texto de cobrança, 2 linhas |
| 2 | `components/form-steps/steps/StepFinal.tsx:462` | `ddal_rules_notes` | Criar/Editar Mesa | Notas de regras DDAL, 3 linhas |
| 3 | `pages/ProfileEditPage.tsx:484` | `bio` | Perfil | Bio curta do usuário |
| 4 | `pages/ProfileEditPage.tsx:744` | `bio_long` | Perfil Mestre | Bio detalhada do mestre |
| 5 | `pages/PainelMestrePage.tsx:191` | `gm-bio` | Painel do Mestre | Bio do mestre |
| 6 | `pages/OnboardingPage.tsx:274` | `onboarding-bio` | Onboarding | Bio curta no cadastro |
| 7 | `components/SystemSuggestionModal.tsx:217` | `description` | Catálogo | Descrição de sugestão de sistema |
| 8 | `components/SessionRepeater.tsx:228` | `notes` | Criar/Editar Mesa | Observações de sessão repetida |
| 9 | `components/ScenarioSuggestionModal.tsx:121` | `description` | Catálogo | Descrição de sugestão de cenário |
| 10 | `components/mestre/MestreContactForm.tsx:110` | `message` | Contato | Mensagem de contato ao mestre |

Nota: `ConfirmDialog.tsx` usa "textarea" apenas em `querySelectorAll` de acessibilidade — não é campo de formulário.

## Campos usando RichTextArea (candidatos a upgrade para MarkdownEditor)

| Arquivo | Campo | Tela |
|---|---|---|
| `components/form-steps/steps/StepBasic.tsx:33` | `description` | Criar/Editar Mesa — Descrição da Mesa |
| `components/form-steps/steps/StepFinal.tsx:164` | `rules_notes` | Criar/Editar Mesa — Regras/Observações |
| `components/form-steps/steps/StepFinal.tsx:258` | `synopsis` | Criar/Editar Mesa — Sinopse Narrativa |
| `components/form-steps/steps/StepFinal.tsx:268` | `style_text` | Criar/Editar Mesa — Estilo de Jogo |
| `components/form-steps/steps/StepFinal.tsx:290` | `technical_requirements` | Criar/Editar Mesa — Requisitos Detalhados |
