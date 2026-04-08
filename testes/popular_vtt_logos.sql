-- Atualizar logo_filename das plataformas VTT
-- Baseado nos arquivos existentes em /public/vtt-logos/

UPDATE vtt_platforms SET logo_filename = 'roll20.webp' WHERE slug = 'roll20';
UPDATE vtt_platforms SET logo_filename = 'foundry-vtt.webp' WHERE slug = 'foundry-vtt';
UPDATE vtt_platforms SET logo_filename = 'fantasy-grounds-unity.webp' WHERE slug = 'fantasy-grounds-unity';
UPDATE vtt_platforms SET logo_filename = 'owlbear-rodeo.webp' WHERE slug = 'owlbear-rodeo';
UPDATE vtt_platforms SET logo_filename = 'talespire.webp' WHERE slug = 'talespire';
UPDATE vtt_platforms SET logo_filename = 'tabletop-simulator.webp' WHERE slug = 'tabletop-simulator';
UPDATE vtt_platforms SET logo_filename = 'dndbeyond-maps.webp' WHERE slug = 'dndbeyond-maps';
UPDATE vtt_platforms SET logo_filename = 'alchemy-rpg.webp' WHERE slug = 'alchemy-rpg';
UPDATE vtt_platforms SET logo_filename = 'quest-portal.webp' WHERE slug = 'quest-portal';

-- Verificar resultado
SELECT name, slug, logo_filename FROM vtt_platforms ORDER BY name;
