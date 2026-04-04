# GUIA_RAPIDO_OPERACIONAL.md

Resumo executivo para reduzir custo de contexto dos agentes, com navegação rápida por cenário.

> [!IMPORTANT]
> Este guia **não substitui** os arquivos canônicos.
> Em caso de conflito, prevalecem: `AGENTS.md` → `ARQUITETURA_PROJETO.md`.

---

## Índice rápido (use primeiro)

| Cenário | Ler primeiro (atalho) | Fonte canônica principal | Decisão rápida |
|---|---|---|---|
| Onboarding (3 etapas) | `AI_CONTEXT_INDEX.md` | `ARQUITETURA_PROJETO.md` §7.5 | `AuthCallback` deve redirecionar para `/onboarding` quando `onboarding_completed=false` |
| Catálogo e busca pública | `AI_CONTEXT_INDEX.md` | `ARQUITETURA_PROJETO.md` §7.1-7.3 | Busca/filtros ficam no Frontend, API retorna dados públicos |
| Taxonomia de sistemas (árvore + aliases) | `AI_CONTEXT_INDEX.md` | `ARQUITETURA_PROJETO.md` §4 e §7.5 | Modelar `sistema > edição > variante`; aliases servem para busca, não para duplicar sistema |
| Selos oficiais (Covil/DDAL) | `AI_CONTEXT_INDEX.md` | `ARQUITETURA_PROJETO.md` §7.2, §7.4 e §7.6 | DDAL só é elegível no caminho `D&D > D&D 5e > D&D 2024` e exige metadados mínimos no backend |
| Header/Footer globais | `AI_CONTEXT_INDEX.md` | `ARQUITETURA_PROJETO.md` §7.1-7.6 | Header sticky e footer institucional devem existir em todas as rotas/etapas |
| Landing pública de mestre | `AI_CONTEXT_INDEX.md` | `ARQUITETURA_PROJETO.md` §7.4 | Nunca expor `avatar_deletehash`/`banner_deletehash` |
| OAuth / JWT / roles | `AI_CONTEXT_INDEX.md` | `ARQUITETURA_PROJETO.md` §6 | Segurança e role no Backend, nunca no Frontend |
| Imagens e Imgur | `AI_CONTEXT_INDEX.md` | `ARQUITETURA_PROJETO.md` §16 | Upload/remoção só no Backend |
| Deploy / Git / promoção | `AI_CONTEXT_INDEX.md` | `GIT_WORKFLOW.md` + `OPERACAO_PRODUCAO.md` | Sem `commit`/`push` sem autorização explícita; beta ativo em `dev`; produção só validar publicamente quando a publicação operacional existir |
| Erros de execução | `AI_CONTEXT_INDEX.md` | `ERRORS_SOLUTIONS.md` | Ao primeiro erro: parar e aplicar solução catalogada |

---

## Contratos inegociáveis (snapshot)

| Tema | Regra |
|---|---|
| Idioma | Toda comunicação em português |
| Auth | Apenas Google OAuth |
| JWT | Backend valida token em rotas privadas |
| Role | `player -> gm` somente no Backend ao criar `gm_profile` |
| Dados sensíveis | Nunca retornar `cover_deletehash`, `avatar_deletehash`, `banner_deletehash` em rotas públicas |
| Imagem | Processamento e Imgur exclusivamente no Backend |
| Git | `commit`/`push` só com autorização explícita do usuário |
| Fluxo de branch | `feature/<escopo>` → `dev` (beta) → `main` (produção) |

---

> As seções de detalhe (Onboarding, Catálogo, Landing, OAuth, Imgur, Git, Erros) foram removidas deste guia.
> O roteamento por cenário está em `AI_CONTEXT_INDEX.md`. Os contratos canônicos estão em `ARQUITETURA_PROJETO.md`.

---

## Checklist de fechamento — Task de código

- [ ] Escopo entregue sem refactor fora do pedido.
- [ ] Build/teste mínimo executado; resultado registrado inline.
- [ ] Erro ocorreu → `ERRORS_SOLUTIONS.md` consultado e atualizado se inédito.
- [ ] JWT/roles validados no Backend; nenhum segredo ou deletehash exposto.
- [ ] Contrato conferido em `ARQUITETURA_PROJETO.md` (seção aplicável).
- [ ] Docs atualizadas por delta: `GUIA_RAPIDO_OPERACIONAL.md`, `TODO_OPERACIONAL.md`, `FILA_IMPLEMENTACAO.md` — só se houve mudança real.
- [ ] `commit`/`push`/deploy → **somente com autorização explícita do usuário.**

---

## Checklist de fechamento — Task de documentação

- [ ] Alinhado com canônicos: `AGENTS.md`, `ARQUITETURA_PROJETO.md`, `GIT_WORKFLOW.md` e `OPERACAO_PRODUCAO.md`, quando aplicável.
- [ ] Sem duplicação: resumo + referência ao canônico quando aplicável.
- [ ] Alterações por delta mínimo; links e nomes de seção revisados.
- [ ] Erro recorrente tratado → `ERRORS_SOLUTIONS.md` atualizado no padrão.
- [ ] Mudança de fluxo → refletida em `GUIA_RAPIDO_OPERACIONAL.md`.
- [ ] Impacto em backlog → `TODO_OPERACIONAL.md` e/ou `FILA_IMPLEMENTACAO.md` atualizados.
- [ ] Docs modificadas listadas no resumo da task.
- [ ] `commit`/`push`/deploy → **somente com autorização explícita do usuário.**

---

## Protocolo de autoatualização contínua (sempre que possível)

Quando uma task alterar contrato, checklist, fluxo recorrente ou decisão operacional:
1. Atualizar **somente por delta** a seção afetada deste guia.
2. Não duplicar regra já presente em arquivo canônico; referenciar o canônico.
3. Se houver conflito, corrigir o guia para refletir o canônico.
4. Registrar no resumo da task que o guia foi atualizado.

> [!NOTE]
> A autoatualização é assistida por agentes (não automática por script). O objetivo é manter este guia sempre enxuto, atual e fiel às fontes canônicas.
