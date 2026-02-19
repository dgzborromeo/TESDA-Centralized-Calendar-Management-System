/**
 * Add missing columns to events table (status, cancel_*, rescheduled_*).
 * Run: node backend/scripts/migrate-reschedule-columns.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/db');

async function columnExists(table, column) {
  const [rows] = await db.query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  return rows.length > 0;
}

const COLUMNS = [
  { name: 'status', sql: "ADD COLUMN status ENUM('active', 'cancelled') NOT NULL DEFAULT 'active'" },
  { name: 'cancel_reason', sql: 'ADD COLUMN cancel_reason TEXT NULL' },
  { name: 'canceled_at', sql: 'ADD COLUMN canceled_at TIMESTAMP NULL' },
  { name: 'canceled_by', sql: 'ADD COLUMN canceled_by INT NULL' },
  { name: 'rescheduled_from_event_id', sql: 'ADD COLUMN rescheduled_from_event_id INT NULL' },
  { name: 'rescheduled_to_event_id', sql: 'ADD COLUMN rescheduled_to_event_id INT NULL' },
];

async function main() {
  console.log('Checking events table columns...');
  let added = 0;
  for (const { name, sql } of COLUMNS) {
    if (await columnExists('events', name)) continue;
    console.log('Adding', name, '...');
    await db.query(`ALTER TABLE events ${sql}`);
    added++;
  }
  if (added === 0) {
    console.log('All columns already exist. Nothing to do.');
  } else {
    console.log('Done. Added', added, 'column(s).');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
