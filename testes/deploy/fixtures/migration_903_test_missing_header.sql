-- Migration sem cabeçalho estruturado (deveria ser bloqueada pelo parser)
-- Esta fixture NÃO TEM @class — é intencional.

CREATE TABLE IF NOT EXISTS test_table_903 (id SERIAL PRIMARY KEY);
