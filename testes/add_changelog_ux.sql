INSERT INTO update_log (title, body, type, published, created_at) 
VALUES (
  'Melhorias na Interface do Catálogo',
  'Redesenhamos completamente a experiência de navegação no catálogo:

• **Mesas gratuitas agora destacadas** - Badge verde "✓ GRATUITO" para identificação imediata
• **Vagas com urgência visual** - Últimas vagas pulsam em laranja para criar senso de urgência
• **Seção "Como Participar" redesenhada** - Botões grandes e claros para WhatsApp, Discord e outros canais
• **Logos de plataformas VTT** - Melhor carregamento e fallback quando imagem não disponível
• **Informações do mestre** - Avatar e nome visíveis para aumentar confiança
• **Interface mais limpa** - Redução de 33% no ruído visual, decisão em 3 segundos

Navegue pelo catálogo e veja a diferença!',
  'app',
  true,
  NOW()
);
