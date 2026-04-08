-- Verificar dados da mesa específica
SELECT 
  t.id,
  t.title,
  t.slug,
  t.cover_url,
  tc.channel,
  tc.value,
  tc.label,
  tc.discord_server_url
FROM tables t
LEFT JOIN table_contacts tc ON t.id = tc.table_id
WHERE t.slug = '99985199454';
