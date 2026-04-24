import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './types';
import dotenv from 'dotenv';

dotenv.config();

// Se não houver PROD_DB_URL, usa um fallback dummy para não quebrar a tipagem em dev
const prodUrl = process.env.PROD_DB_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: prodUrl,
    max: 5,
  }),
});

export const prodDb = new Kysely<Database>({
  dialect,
}) as Kysely<Database> & { isProdConnection: boolean };

// Decorator property for testing validation
prodDb.isProdConnection = true;
