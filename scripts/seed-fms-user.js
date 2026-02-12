/**
 * Create Financial and Management Service (FMS) user
 * Usage: node backend/scripts/seed-fms-user.js
 *
 * Default:
 *  - Email: fms@tesda.gov.ph
 *  - Password: fms123
 *  - Role: user
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { resolveUserNameConfig } = require('../utils/userName');

const EMAIL = process.env.FMS_EMAIL || 'fms@tesda.gov.ph';
const PASSWORD = process.env.FMS_PASSWORD || 'fms123';
const DISPLAY_NAME = process.env.FMS_NAME || 'Financial and Management Service (FMS)';

async function seed() {
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [EMAIL]);
  if (existing.length > 0) {
    console.log(`FMS user already exists: ${EMAIL}`);
    process.exit(0);
  }

  const cfg = await resolveUserNameConfig(db);
  if (!cfg.insertColumn) {
    console.error('Users table has no supported name column (name/full_name/fullname/username/first_name).');
    process.exit(1);
  }

  const hash = await bcrypt.hash(PASSWORD, 10);
  await db.query(`INSERT INTO users (${cfg.insertColumn}, email, password, role) VALUES (?, ?, ?, ?)`, [
    DISPLAY_NAME,
    EMAIL,
    hash,
    'user',
  ]);

  console.log(`FMS user created: ${EMAIL} / ${PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

