// Temporary migration runner - uses the app's DB config
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wolloshare',
  });

  try {
    // Check if category column already exists
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resources' AND COLUMN_NAME = 'category'`
    );
    if (cols.length > 0) {
      console.log('category column already exists - skipping migration');
    } else {
      await conn.query(
        `ALTER TABLE resources
         ADD COLUMN category ENUM('course_material', 'assignment', 'past_exam') NOT NULL DEFAULT 'course_material' AFTER resource_type_id,
         ADD COLUMN chapter VARCHAR(100) NULL AFTER category,
         ADD INDEX idx_resources_category (category),
         ADD INDEX idx_resources_chapter (chapter)`
      );
      console.log('Migration applied: category + chapter columns added');
    }
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await conn.end();
  }
}

run();
