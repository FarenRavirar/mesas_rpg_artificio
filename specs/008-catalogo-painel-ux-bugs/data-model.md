# Data Model: Revisão Visual e Responsiva do Catálogo

## Catálogo

**Purpose**: Superfície de descoberta de mesas, composta por menus, filtros, resultados e estados visuais.

**Key Attributes**:
- `visualHierarchy`: organização perceptível entre título, controles e resultados.
- `filterState`: filtros ativos, vazios e estados de interação.
- `layoutMode`: apresentação derivada do tamanho de tela.
- `resultState`: carregando, vazio, erro ou resultados disponíveis.

**Validation Rules**:
- Nenhuma área deve sobrescrever outra indevidamente.
- Layout não deve gerar rolagem horizontal indevida.
- Controles devem permanecer acessíveis e previsíveis em todos os breakpoints.

## Menu/Filtro do Catálogo

**Purpose**: Controle de refinamento de resultados que deve seguir o padrão visual da gestão de sistemas.

**Key Attributes**:
- `label`: nome claro do filtro.
- `activeState`: indicação visual de filtro aplicado.
- `emptyState`: comportamento quando não há opções ou resultados.
- `interactionState`: aberto, fechado, selecionado, desabilitado ou carregando.

**Validation Rules**:
- Estados devem ser visualmente distinguíveis.
- Agrupamento deve facilitar escaneabilidade.
- Em mobile, filtros não devem cobrir resultados de forma permanente.
- Estilo deve ser coerente com a gestão de sistemas.

## Resultado/Card de Mesa

**Purpose**: Item exibido no catálogo.

**Key Attributes**:
- `title`: título da mesa.
- `summary`: descrição curta ou texto equivalente.
- `cover`: imagem ou fallback visual.
- `badges`: marcadores opcionais.
- `actions`: ações disponíveis no card, se houver.

**Validation Rules**:
- Textos longos devem ter limite visual controlado.
- Imagem ausente deve preservar o layout.
- Badges e ações não devem invadir conteúdo adjacente.
- Cards devem manter espaçamento consistente no grid.

## Estado Visual do Catálogo

**Purpose**: Situação de interface exibida conforme carregamento e filtros.

**Known States**:
- Carregando.
- Sem resultados.
- Erro.
- Resultados filtrados.
- Filtros abertos.

**Validation Rules**:
- Cada estado deve ser legível e não sobrepor indevidamente outros elementos.
- Estados devem seguir a mesma linguagem visual do restante do catálogo.
- Mensagens devem orientar o usuário sem jargão técnico.

## State Transitions

### Navegação e filtro

1. Usuário acessa catálogo.
2. Catálogo exibe estado inicial sem sobreposição.
3. Usuário abre menus/filtros.
4. Controles mudam de estado sem cobrir resultados de forma indevida.
5. Resultados atualizam mantendo grid e espaçamento.
6. Estados vazio/erro/carregando preservam a estrutura visual.

### Responsividade

1. Viewport muda de desktop para tablet ou mobile.
2. Layout reorganiza menus, filtros e resultados.
3. Controles permanecem acessíveis.
4. Não há rolagem horizontal indevida.
5. Cards preservam limites e legibilidade.
