const { Pool } = require('pg');
require('dotenv').config({ path: '.env.vercel.test' });

async function main() {
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const res = await pool.query('SELECT * FROM "User"');
    console.log("Users in Postgres:", res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
main();
