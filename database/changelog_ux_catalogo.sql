-- Changelog para refatoração UX do catálogo
-- Data: 2026-04-08
-- Deploy: Beta

INSERT INTO update_log (title, body, type, published, created_at) 
VALUES (
  'Catálogo mais organizado e fácil de usar',
  'Melhoramos a forma como você busca e filtra mesas no catálogo:

• **Filtros mais claros** - Agora os filtros ficam organizados em blocos separados, facilitando encontrar o que você procura
• **Filtros no celular** - No celular, os filtros aparecem em um menu lateral bonitinho quando você clica no botão "Filtros"
• **Você vê o que está filtrando** - Os filtros ativos aparecem como etiquetas que você pode remover clicando nelas
• **Botões mais espertos** - Os cards das mesas agora mostram "Entrar na mesa" quando tem vaga, ou "Ver detalhes" quando está lotada
• **Mais espaço para ver as mesas** - Reorganizamos tudo para você ver mais mesas de uma vez

Explore o catálogo e encontre sua próxima aventura! 🎲',
  'app',
  true,
  NOW()
);
