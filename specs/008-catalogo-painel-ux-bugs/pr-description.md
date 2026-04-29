# PR: Catálogo e Painel UX Bugs

## Sumário executivo

Corrige a revisão visual do catálogo público com foco em sobreposição, responsividade e estabilidade dos filtros/cards. Também corrige um bug relacionado no seletor de sistemas compartilhado com o painel, onde variantes em modo de seleção única usavam a lista errada.

## Mudanças por componente

- `CatalogoPage`: remove dependência de filtros sticky com offset fixo, consolida filtros desktop em superfície estável, ajusta grid, paginação e estados.
- `FilterDrawer`: melhora estrutura mobile com altura dinâmica, conteúdo rolável e rodapé fixo fora da rolagem.
- `ActiveFiltersChips`: protege filtros ativos contra textos longos.
- `TableCard`: estabiliza skeleton/card, badges, textos longos, preço e conteúdo variável.
- `SystemTreeSelector`: corrige dropdown de variantes em `singleSelect`.
- `database/changelogs.json`: atualiza a entrada consolidada de 29/04/2026 com linguagem leiga.

## Testing evidence

- `npm --prefix frontend run build` concluído com sucesso.
- Validação funcional final ainda deve ocorrer no Beta em janela anônima após deploy em `dev`.

## Checklist pós-merge

- Deploy para `dev`.
- Testar `/catalogo` no Beta em janela anônima.
- Validar filtros em desktop, tablet e mobile.
- Validar criação/edição de mesa com seleção de sistema, edição/subsistema e variante.
