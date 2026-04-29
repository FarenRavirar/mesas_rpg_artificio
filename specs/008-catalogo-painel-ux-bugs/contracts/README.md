# UI Contract: Catálogo e Painel UX Bugs

## Escopo

Contrato visual e funcional para o catálogo público e para o seletor de sistemas compartilhado com o painel. Não define endpoint novo.

## Catálogo Público

### Layout

- O cabeçalho do catálogo deve aparecer acima dos controles sem ocultar resultados.
- A superfície de filtros desktop deve permanecer acessível sem cobrir cards ou estados da página.
- O grid deve se adaptar a mobile, tablet e desktop sem rolagem horizontal indevida.
- Estados de carregamento, atualização, vazio e erro devem preservar a mesma largura útil do conteúdo.

### Filtros

- Busca, sistema, modalidade, preço, nível, ordenação, selos e estilos mantêm a semântica atual.
- Alterar filtros deve atualizar resultados sem apagar filtros não relacionados.
- Limpar filtros deve retornar ao estado inicial do catálogo.
- Chips ativos devem ser removíveis individualmente.

### Mobile

- Drawer de filtros deve ter backdrop, fechamento claro e ação explícita de aplicar.
- Drawer não deve bloquear a interface em estado permanente.
- Botão flutuante de filtros deve ficar acima do conteúdo sem cobrir paginação ou CTA crítico.

## Cards de Mesa

- Cards aceitam títulos e nomes longos sem invadir áreas vizinhas.
- Badges e logos permanecem dentro da imagem/card.
- Preço, vagas e mestre continuam visíveis quando disponíveis.
- Imagem ausente ou inválida usa fallback existente sem quebrar o grid.

## Seletor de Sistemas

- Modo `singleSelect` preserva uma única seleção.
- Seleção de base, edição/subsistema e variante deve refletir a árvore correta.
- Busca por nome, nome em português, slug, path e aliases deve continuar disponível.
- O mesmo componente deve funcionar no catálogo e no formulário de criação/edição de mesa.

## Fora de Escopo

- Alterar endpoints.
- Alterar schema do banco.
- Alterar autenticação, permissões ou regras de publicação.
- Reescrever a gestão de sistemas.
