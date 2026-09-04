const fs = require('fs');
const path = require('path');
const { pool, query } = require('./pool');

async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, '../../../database/migrations');
  console.log(`[Migrations] Scanning ${migrationsDir}...`);

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`[Migrations] Found ${files.length} migration file(s).`);

  const client = await pool.connect();
  try {
    for (const file of files) {
      console.log(`[Migrations] Applying: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`[Migrations] Successfully applied: ${file}`);
    }
    console.log('[Migrations] All migrations completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Migrations] Error applying migrations:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[Migrations] Process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migrations] Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
