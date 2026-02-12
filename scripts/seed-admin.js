/**
 * Create default admin user (run once after schema.sql)
 * Usage: node backend/scripts/seed-admin.js
 * Admin: admin@tesda.gov / admin123
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tesda_calendar',
  });
  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', ['admin@tesda.gov']);
  if (existing.length > 0) {
    console.log('Admin user already exists.');
    process.exit(0);
  }
  const hash = await bcrypt.hash('admin123', 10);
  await conn.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['Admin', 'admin@tesda.gov', hash, 'admin']
  );
  console.log('Admin user created: admin@tesda.gov / admin123');
  await conn.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
