// Temporary migration runner - uses the app's DB config
require('dotenv').config();
const { Pool } = require('pg');

async function run() {
  const conn = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if category column already exists
    const { rows: cols } = await conn.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'resources' AND column_name = 'category'`
    );
    if (cols.length > 0) {
      console.log('category column already exists - skipping migration');
    } else {
      await conn.query(`ALTER TABLE resources
        ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'course_material',
        ADD COLUMN chapter VARCHAR(100)`);
      await conn.query('CREATE INDEX IF NOT EXISTS idx_resources_category ON resources (category)');
      await conn.query('CREATE INDEX IF NOT EXISTS idx_resources_chapter ON resources (chapter)');
      console.log('Migration applied: category + chapter columns added');
    }
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await conn.end();
  }
}

run();
