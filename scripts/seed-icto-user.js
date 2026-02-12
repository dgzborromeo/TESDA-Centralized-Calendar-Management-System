/**
 * Create Information and Communication Technology Office (ICTO) user
 * Usage: node backend/scripts/seed-icto-user.js
 *
 * Default:
 *  - Email: icto@tesda.gov.ph
 *  - Password: icto123
 *  - Role: user
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { resolveUserNameConfig } = require('../utils/userName');

const EMAIL = process.env.ICTO_EMAIL || 'icto@tesda.gov.ph';
const PASSWORD = process.env.ICTO_PASSWORD || 'icto123';
const DISPLAY_NAME = process.env.ICTO_NAME || 'Information and Communication Technology Office (ICTO)';

async function seed() {
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [EMAIL]);
  if (existing.length > 0) {
    console.log(`ICTO user already exists: ${EMAIL}`);
    process.exit(0);
  }

  const cfg = await resolveUserNameConfig(db);
  if (!cfg.insertColumn) {
    console.error('Users table has no supported name column (name/full_name/fullname/username/first_name).');
    process.exit(1);
  }

  const hash = await bcrypt.hash(PASSWORD, 10);
  await db.query(
    `INSERT INTO users (${cfg.insertColumn}, email, password, role) VALUES (?, ?, ?, ?)`,
    [DISPLAY_NAME, EMAIL, hash, 'user']
  );

  console.log(`ICTO user created: ${EMAIL} / ${PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

