-- Amostra de candidatos aceitos
SELECT
  confidence_score,
  editorial_status,
  parsed_json->>'title' as title,
  parsed_json->>'system' as system,
  parsed_json->>'isPaid' as is_paid
FROM aggregator_import_candidates
WHERE editorial_status = 'accepted'
LIMIT 5;
