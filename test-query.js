const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/backend/.env' });

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT COUNT(*) FROM document_chunks;');
    console.log('Document chunks count:', res.rows[0].count);
    
    // Check if pgvector is installed
    const res2 = await pool.query(`SELECT * FROM pg_extension WHERE extname = 'vector';`);
    console.log('Vector extension installed:', res2.rows.length > 0);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
