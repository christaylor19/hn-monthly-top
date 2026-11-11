import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not configured on the server.');

export const pool = new pg.Pool({ connectionString, max: 5 });
export const db = drizzle(pool, { schema });
