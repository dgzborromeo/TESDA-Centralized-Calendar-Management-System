/**
 * Add nullable end_date column to events table (safe if already exists).
 * Usage: node backend/scripts/migrate-add-end-date.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

async function run() {
  await db.query(`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS end_date DATE NULL AFTER date
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_end_date ON events (end_date)
  `);
  console.log('Migration complete: events.end_date is ready.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
