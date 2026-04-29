# Research: Revisão Visual e Responsiva do Catálogo

## Decision 1: Corrigir o catálogo por revisão de sistema visual, não por ajuste isolado de sobreposição

**Rationale**: Sobreposição visual raramente é um problema isolado. Normalmente envolve estrutura, espaçamento, posicionamento, breakpoints, hierarquia e estados. Uma correção pontual pode esconder o sintoma e deixar outros bugs relacionados.

**Alternatives considered**:
- Ajustar apenas `z-index`: rejeitado porque não garante hierarquia nem responsividade.
- Corrigir apenas o caso visível reportado: rejeitado porque o pedido exige investigar bugs relacionados ao catálogo.

## Decision 2: Usar a gestão de sistemas como referência interna para menus e filtros

**Rationale**: A plataforma já possui uma referência visual interna para controles de filtragem e gestão. Alinhar o catálogo a essa linguagem reduz inconsistência, facilita aprendizado e evita introduzir um padrão visual paralelo.

**Alternatives considered**:
- Criar uma linguagem visual nova para o catálogo: rejeitado porque aumenta divergência entre áreas do produto.
- Manter filtros atuais e só reposicionar: rejeitado se os estados e espaçamentos continuarem inconsistentes.

## Decision 3: Aplicar padrões modernos de descoberta usados por produtos digitais maduros

**Rationale**: Produtos de alta maturidade priorizam hierarquia clara, controles previsíveis, agrupamento lógico, estados visuais legíveis, grid adaptável e baixa fricção. O catálogo deve facilitar escaneabilidade antes de densidade visual.

**Alternatives considered**:
- Aumentar densidade de cards em todas as telas: rejeitado porque piora leitura e responsividade.
- Ocultar filtros em mobile sem affordance clara: rejeitado porque prejudica descoberta.

## Decision 4: Investigar estados e breakpoints antes de implementar

**Rationale**: O bug relatado pode aparecer apenas em certas larguras, com filtros abertos, estados vazios, cards longos ou combinações de controles. O mapeamento prévio reduz regressões e evita correção incompleta.

**Alternatives considered**:
- Implementar direto a partir de uma captura mental do problema: rejeitado porque não cobre bugs relacionados.
- Validar só em desktop: rejeitado porque o pedido exige abordagem responsiva completa.

## Decision 5: Cards e resultados precisam ter limites resilientes para conteúdo variável

**Rationale**: Catálogos recebem conteúdo heterogêneo. O layout deve lidar com títulos longos, imagens ausentes, badges, descrições e estados sem invadir áreas vizinhas.

**Alternatives considered**:
- Permitir crescimento ilimitado dos cards: rejeitado porque pode quebrar grid e escaneabilidade.
- Cortar conteúdo sem indicação visual: rejeitado porque pode ocultar informação importante sem clareza.

## Decision 6: Validação final deve combinar inspeção visual, responsividade e Beta

**Rationale**: Build técnico não valida qualidade visual. A aceitação depende de testar desktop, tablet/mobile, menus/filtros, estados e navegação real no Beta em janela anônima.

**Alternatives considered**:
- Validar apenas localmente: rejeitado porque não substitui Beta.
- Validar apenas o caso de sobreposição inicial: rejeitado porque o escopo inclui bugs relacionados e padronização visual.
