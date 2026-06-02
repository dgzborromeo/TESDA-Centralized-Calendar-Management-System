/**
 * Create NITESD user (run once after schema.sql)
 * Usage: node backend/scripts/seed-nitesd-user.js
 *
 * Default:
 *  - Email: nitesd@tesda.gov.ph
 *  - Password: nitesd123
 *  - Role: user
 *  - Office: National Institute for Technical Education and Skills Development (NITESD)
 *  - Under: Office of the Deputy Director-General for Policies and Planning (ODDG-PP)
 *  - Color: Pink (#ec4899)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { resolveUserNameConfig } = require('../utils/userName');

const EMAIL = process.env.NITESD_EMAIL || 'nitesd@tesda.gov.ph';
const PASSWORD = process.env.NITESD_PASSWORD || 'nitesd123';
const DISPLAY_NAME = process.env.NITESD_NAME || 'National Institute for Technical Education and Skills Development (NITESD)';

async function seed() {
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [EMAIL]);
  if (existing.length > 0) {
    console.log(`NITESD user already exists: ${EMAIL}`);
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

  console.log(`✅ NITESD user created successfully!`);
  console.log(`📧 Email: ${EMAIL}`);
  console.log(`🔑 Password: ${PASSWORD}`);
  console.log(`🏢 Office: National Institute for Technical Education and Skills Development (NITESD)`);
  console.log(`📁 Under: ODDG-PP`);
  console.log(`🎨 Color: Pink (#ec4899)`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error creating NITESD user:', err);
  process.exit(1);
});
