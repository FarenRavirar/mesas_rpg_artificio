-- Atualizar changelog existente para linguagem mais familiar
UPDATE update_log 
SET body = 'Deixamos o catálogo muito mais fácil de usar e bonito:

• **Filtros no topo** - Agora os filtros ficam numa barra no topo da página, deixando mais espaço para você ver as mesas
• **Cards mais organizados** - A imagem fica separada das informações, tudo mais limpo e fácil de ler
• **Cores que fazem sentido** - Verde para mesas gratuitas, vermelho para última vaga, amarelo para mesas pagas
• **Bolinhas de vagas** - Agora você vê de cara quantas vagas estão ocupadas pelas bolinhas coloridas
• **Botões destacados** - Mesas com poucas vagas têm botão laranja chamativo, outras têm botão mais discreto
• **Funciona melhor no celular** - Os filtros rolam para o lado no celular, não ocupam a tela toda

Dá uma olhada no catálogo, ficou bem mais fácil de encontrar sua mesa ideal! 🎲'
WHERE title = 'Redesign Completo do Catálogo — Interface Profissional';

-- Atualizar changelog de correções também
UPDATE update_log 
SET body = 'Corrigimos alguns probleminhas que estavam incomodando:

• **Imagem padrão aparece** - Mesas sem foto agora mostram um dado 🎲 bonitinho em vez de ficar em branco
• **Links funcionam** - Os botões de WhatsApp, Discord e formulários agora abrem direitinho
• **Você vê o link real** - Embaixo do botão aparece o link completo para você copiar se quiser
• **Logos das plataformas** - Roll20, Foundry VTT e outras plataformas agora mostram seus logos certinho

Tudo funcionando redondinho agora! ✨'
WHERE title = 'Correções de UX: Placeholder, Links e Ícones VTT';
