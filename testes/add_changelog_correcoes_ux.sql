INSERT INTO update_log (title, body, type, published, created_at) 
VALUES (
  'Correções de UX: Placeholder, Links e Ícones VTT',
  'Corrigimos 3 problemas importantes na interface:

• **Placeholder visível** - Mesas sem imagem de capa agora mostram ícone 🎲 + texto "Sem imagem de capa"
• **Links de contato funcionando** - WhatsApp, Discord e formulários agora abrem corretamente
• **Links abreviados visíveis** - WhatsApp e Discord mostram o link real abaixo do botão para você copiar
• **Ícones VTT aparecem** - Logos de Roll20, Foundry VTT e outras plataformas agora carregam corretamente

Navegue pelas mesas e veja as melhorias!',
  'app',
  true,
  NOW()
);
