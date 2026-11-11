import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not configured.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString, max: 1 });
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

try {
  await migrate(drizzle(pool), { migrationsFolder });
  console.log('migrations applied');
} catch (err) {
  console.error('migration failed', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
