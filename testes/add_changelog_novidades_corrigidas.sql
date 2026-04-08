INSERT INTO update_log (title, body, type, published, created_at) 
VALUES (
  'Novidades Agora Aparecem no Portal',
  'Corrigimos o sistema de novidades que estava vazio:

• **Ícone 🔔 funciona** - Clique no sino no topo da página para ver as atualizações
• **Renomeado para "Novidades"** - Nome mais claro e direto
• **4 atualizações disponíveis** - Veja tudo que melhoramos recentemente
• **Sempre atualizado** - Toda vez que melhorarmos algo, você vai saber

Clique no sino no topo da página e confira! 🔔',
  'app',
  true,
  NOW()
);
