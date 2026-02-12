/**
 * Migrate event types:
 *  - appointment -> zoom
 *  - reminder -> event
 * and update DB enum to ('meeting','zoom','event')
 *
 * Usage: node backend/scripts/migrate-event-types.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

async function migrate() {
  // Map old values to new values (safe to run multiple times)
  await db.query(`UPDATE events SET type='zoom' WHERE type='appointment'`);
  await db.query(`UPDATE events SET type='event' WHERE type='reminder'`);

  // Update enum (MySQL)
  await db.query(`ALTER TABLE events MODIFY COLUMN type ENUM('meeting','zoom','event') NOT NULL DEFAULT 'meeting'`);

  console.log('Event types migrated: appointment->zoom, reminder->event. Enum updated.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});

