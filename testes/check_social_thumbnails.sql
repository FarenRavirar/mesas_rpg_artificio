-- Verificar links com thumbnails de redes sociais protegidas
SELECT id, url, type, thumbnail_url 
FROM user_links 
WHERE thumbnail_url IS NOT NULL 
  AND (
    thumbnail_url LIKE '%fbcdn%' 
    OR thumbnail_url LIKE '%cdninstagram%' 
    OR thumbnail_url LIKE '%twimg%' 
    OR thumbnail_url LIKE '%tiktokcdn%'
  );
