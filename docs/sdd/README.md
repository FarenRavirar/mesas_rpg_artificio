# SDD neste projeto

Usa Spec Kit oficial (github/spec-kit) adaptado. Convive com MDs canônicos da raiz — não os substitui.

## Quando usar
- Features médias/grandes que tocam backend + frontend.
- Mudanças de schema.
- Novos endpoints públicos.

## Quando NÃO usar
- Fix de typo, CSS, bump de dependência trivial — fluxo nativo do Antigravity.

## Comandos (Antigravity chat)
- /speckit.constitution — cria/atualiza constituição (1x por projeto).
- /speckit.specify — inicia feature nova; CRIA BRANCH automaticamente.
- /speckit.clarify — resolve ambiguidades (antes de /plan).
- /speckit.plan — gera plano técnico.
- /speckit.tasks — decompõe em tasks atômicas.
- /speckit.analyze — consistency check (GATE antes de implement).
- /speckit.checklist — checklists de qualidade (opcional).
- /speckit.implement — executa tasks.

## Fonte de verdade
Conflito → AGENTS.md e MDs canônicos vencem sempre.
Detalhes em docs/sdd/MAPEAMENTO_SDD.md.

## Gestão de branches
Ver docs/sdd/BRANCH_POLICY.md.
