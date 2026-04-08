-- Diagnóstico: Verificar contatos das mesas
-- Objetivo: Identificar se os links estão corretos no banco

SELECT 
  t.id,
  t.title,
  t.slug,
  tc.channel,
  tc.value,
  tc.label,
  tc.discord_server_url,
  LENGTH(tc.value) as value_length,
  tc.value LIKE 'http%' as is_url
FROM tables t
JOIN table_contacts tc ON t.id = tc.table_id
WHERE t.status = 'active'
ORDER BY t.created_at DESC
LIMIT 20;
