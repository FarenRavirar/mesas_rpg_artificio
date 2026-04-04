SELECT t.title, t.status::text, s.name as system,
       t.is_ddal, t.is_covil_do_lich, t.publisher_only
FROM tables t
LEFT JOIN systems s ON s.id = t.system_id
LIMIT 10;
