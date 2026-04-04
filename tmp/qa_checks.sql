-- Candidatos persistidos
SELECT editorial_status, COUNT(*) as total
FROM aggregator_import_candidates
GROUP BY editorial_status;

-- Amostra de candidatos aceitos
SELECT id, external_id, confidence_score, editorial_status,
       parsed_json->>'title' as title,
       parsed_json->>'system' as system,
       parsed_json->>'isPaid' as is_paid
FROM aggregator_import_candidates
WHERE editorial_status = 'accepted'
LIMIT 5;

-- Mesas com sistema e selos
SELECT t.title, t.status, s.name as system,
       t.is_ddal, t.is_covil_do_lich,
       t.publisher_only
FROM tables t
LEFT JOIN systems s ON s.id = t.system_id
LIMIT 10;

-- Perfis GM com nickname
SELECT gp.nickname, gp.slug, u.email, u.role::text
FROM gm_profiles gp
JOIN users u ON u.id = gp.user_id
LIMIT 5;
