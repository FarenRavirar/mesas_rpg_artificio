-- Mesas existentes com sistema e selos
SELECT t.title, t.status::text, s.name as system,
       t.is_ddal, t.is_covil_do_lich, t.publisher_role
FROM tables t
LEFT JOIN systems s ON s.id = t.system_id
LIMIT 10;

-- Perfis GM com nickname e role
SELECT gp.nickname, gp.slug, u.email, u.role::text
FROM gm_profiles gp
JOIN users u ON u.id = gp.user_id
LIMIT 10;

-- Contatos de mesa
SELECT tc.channel::text, tc.contact_value, t.title
FROM table_contacts tc
JOIN tables t ON t.id = tc.table_id
LIMIT 10;
