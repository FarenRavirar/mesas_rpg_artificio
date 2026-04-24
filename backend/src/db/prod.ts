import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './types';
import dotenv from 'dotenv';

dotenv.config();

const prodUrl = process.env.PROD_DB_URL;
if (!prodUrl) {
  throw new Error('PROD_DB_URL environment variable is required for production database connection');
}

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
