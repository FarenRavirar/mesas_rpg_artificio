INSERT INTO update_log (title, body, type, published, created_at) 
VALUES (
  'Redesign Completo do Catálogo — Interface Profissional',
  'Transformamos o catálogo em uma interface de marketplace moderna e profissional:

• **Filtros horizontais** - Barra fixa no topo com scroll, liberando espaço para os cards
• **Nova hierarquia visual** - Imagem separada do conteúdo, informações organizadas por prioridade
• **Cores semânticas** - Verde (gratuito), Vermelho (urgência), Amarelo (pago), Laranja (ação)
• **Dots de vagas** - Visualização instantânea de disponibilidade com bolinhas preenchidas
• **Badges legíveis** - Fundo escuro translúcido sobre qualquer imagem
• **CTA diferenciado** - Botão sólido para mesas urgentes, outline para mesas normais
• **Grid otimizado** - 3 colunas no desktop, 2 no tablet, 1 no mobile

Navegue pelo catálogo e veja a diferença! 🎨',
  'app',
  true,
  NOW()
);
