# Research: Catálogo e Painel UX Bugs

## Decision 1: Tratar a spec como hipótese, não como verdade validada

**Decision**: O plano usa a spec como ponto de partida, mas o escopo técnico foi confirmado por busca no código antes da implementação.

**Rationale**: O mantenedor alertou que a spec foi feita por IA. A inspeção confirmou que o bug visual do catálogo envolve `CatalogoPage`, `FilterDrawer`, `ActiveFiltersChips`, `TableCard` e `SystemTreeSelector`; também revelou impacto potencial no painel pelo uso compartilhado do seletor.

**Alternatives considered**:
- Seguir a spec literalmente: rejeitado porque perderia o bug compartilhado com painel.
- Reescrever a spec agora: rejeitado nesta fase; o plano pode registrar o ajuste e tasks posteriores podem reconciliar a spec se necessário.

## Decision 2: Eliminar risco de sobreposição reduzindo dependência de sticky offsets hardcoded

**Decision**: A implementação deve revisar a estrutura de `CatalogoPage` para evitar duas faixas sticky com offset manual (`top-[88px]`) competindo com conteúdo, drawer e botão flutuante.

**Rationale**: O catálogo público tem cabeçalho sticky em `top-0` e filtros desktop sticky com `top-[88px]`. Esse tipo de offset é frágil quando o cabeçalho muda de altura, quando há erro de sistemas, zoom de fonte, breakpoints ou telas pequenas.

**Alternatives considered**:
- Ajustar apenas o número do offset: rejeitado por ser frágil.
- Remover toda fixação: aceitável se a experiência ficar clara, mas precisa preservar acesso rápido aos filtros.
- Consolidar cabeçalho e filtros em uma superfície responsiva: preferido se mantiver escaneabilidade sem cobrir resultados.

## Decision 3: Usar gestão de sistemas como referência de padrão, não como cópia literal

**Decision**: O catálogo deve adotar a lógica visual da gestão de sistemas: busca compacta, chips/segmentos claros, contagem de resultados e agrupamento denso. Não deve copiar cores administrativas literalmente quando isso piorar a experiência pública.

**Rationale**: `CatalogToolbar` usa uma área única com busca, ação primária, filtros de tipo e contagem. Essa organização é mais previsível que espalhar filtros em múltiplas zonas sem cabeçalhos consistentes.

**Alternatives considered**:
- Copiar `CatalogToolbar` inteiro: rejeitado porque a gestão é administrativa e tem ações que não existem no catálogo público.
- Manter visual atual com pequenos ajustes: rejeitado porque o problema relatado é estrutural, não só cosmético.

## Decision 4: Incluir `SystemTreeSelector` no escopo por impacto cruzado catálogo/painel

**Decision**: A feature deve validar e corrigir o modo `singleSelect` de `SystemTreeSelector`, especialmente o bloco de seleção de variantes.

**Rationale**: O componente é usado no catálogo e no passo de sistema do formulário de mesa. A leitura do código encontrou um trecho de variantes que renderiza opções a partir de `midNodes` e usa texto de edição, apesar de já calcular `variants`. Isso é forte indício de bug relacionado ao painel.

**Alternatives considered**:
- Deixar painel fora porque a spec fala só de catálogo: rejeitado pelo nome da feature e pela orientação do mantenedor.
- Criar seletor novo só para catálogo: rejeitado por duplicar comportamento e aumentar risco.

## Decision 5: Preservar contratos atuais de filtros, busca e URLs

**Decision**: Mudanças de UX não devem alterar parâmetros de URL, semântica dos filtros, rotas ou payloads de catálogo.

**Rationale**: `useCatalogFilters`, `useCatalogTables` e `catalogFilters.ts` já mantêm estado via URL. A feature é visual/UX e deve ser reversível sem migração de dados.

**Alternatives considered**:
- Reestruturar filtros e parâmetros: rejeitado por ampliar escopo e risco sem necessidade.

## Decision 6: Teste obrigatório é build frontend, com testes focados se houver lógica isolável

**Decision**: A validação mínima técnica é `npm --prefix frontend run build`; se a implementação alterar normalizadores ou lógica pura do seletor, adicionar/rodar testes Vitest focados.

**Rationale**: O projeto não tem cobertura específica para catálogo hoje. A feature é majoritariamente visual, mas há lógica de árvore/singleSelect que pode receber teste unitário se for isolada.

**Alternatives considered**:
- Somente validação manual: rejeitado porque TypeScript/build capturam regressões de props e normalização.
- Criar suite ampla de UI agora: rejeitado se atrasar a correção; testes devem seguir risco real.
