import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable missing!');
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  return await pool.connect();
}
