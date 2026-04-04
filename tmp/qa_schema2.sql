-- Schema real de table_contacts
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'table_contacts'
ORDER BY ordinal_position;

-- Campos bool/selos em tables
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tables' AND data_type = 'boolean';
