/**
 * One-click setup: create database, run schema, create admin user.
 * Run: node backend/scripts/setup-database.js
 * Requires MySQL running. Uses backend/.env for DB_HOST, DB_USER, DB_PASSWORD.
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_NAME = process.env.DB_NAME || 'tesda_calendar';
const OSEC_EMAIL = process.env.OSEC_EMAIL || 'osec@tesda.gov.ph';
const OSEC_PASSWORD = process.env.OSEC_PASSWORD || 'osec123';
const OSEC_NAME = process.env.OSEC_NAME || 'Office of the Secretary (OSEC)';

async function run() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  }).catch((err) => {
    console.error('Cannot connect to MySQL. Is it running? (Start MySQL in XAMPP)');
    console.error(err.message);
    process.exit(1);
  });

  console.log('Creating database and tables (fresh install)...');
  await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
  await conn.query(`CREATE DATABASE \`${DB_NAME}\``);
  await conn.changeUser({ database: DB_NAME });
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  let sql = fs.readFileSync(schemaPath, 'utf8');
  sql = sql
    .replace(/--[^\n]*/g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== 'USE' && !s.startsWith('CREATE DATABASE'));

  for (const stmt of statements) {
    if (!stmt) continue;
    try {
      await conn.query(stmt);
    } catch (err) {
      console.error('SQL error:', stmt.slice(0, 60) + '...');
      console.error(err.message);
      await conn.end();
      process.exit(1);
    }
  }

  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', ['admin@tesda.gov']);
  if (existing.length > 0) {
    console.log('Admin user already exists: admin@tesda.gov / admin123');
  } else {
    const hash = await bcrypt.hash('admin123', 10);
    await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin', 'admin@tesda.gov', hash, 'admin']
    );
    console.log('Admin user created: admin@tesda.gov / admin123');
  }

  const [osecExisting] = await conn.query('SELECT id FROM users WHERE email = ?', [OSEC_EMAIL]);
  if (osecExisting.length > 0) {
    console.log(`OSEC admin already exists: ${OSEC_EMAIL} / ${OSEC_PASSWORD}`);
  } else {
    const osecHash = await bcrypt.hash(OSEC_PASSWORD, 10);
    await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [OSEC_NAME, OSEC_EMAIL, osecHash, 'admin']
    );
    console.log(`OSEC admin created: ${OSEC_EMAIL} / ${OSEC_PASSWORD}`);
  }

  await conn.end();
  console.log('');
  console.log('Setup complete. Run START-SERVERS.bat then open http://localhost:5174');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
