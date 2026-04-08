-- Diagnóstico: Verificar logos VTT no banco
SELECT 
  id,
  name,
  slug,
  logo_filename,
  CASE 
    WHEN logo_filename IS NULL THEN 'NULL'
    WHEN logo_filename = '' THEN 'VAZIO'
    ELSE 'OK'
  END as status
FROM vtt_platforms
ORDER BY name;
