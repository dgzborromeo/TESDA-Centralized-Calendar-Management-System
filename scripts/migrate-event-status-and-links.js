/**
 * Add cancellation/reschedule tracking columns to events table.
 * Usage: node backend/scripts/migrate-event-status-and-links.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

async function run() {
  await db.query(`
    ALTER TABLE events
      ADD COLUMN IF NOT EXISTS status ENUM('active','cancelled') NOT NULL DEFAULT 'active' AFTER color,
      ADD COLUMN IF NOT EXISTS cancel_reason TEXT NULL AFTER status,
      ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP NULL AFTER cancel_reason,
      ADD COLUMN IF NOT EXISTS canceled_by INT NULL AFTER canceled_at,
      ADD COLUMN IF NOT EXISTS rescheduled_from_event_id INT NULL AFTER canceled_by,
      ADD COLUMN IF NOT EXISTS rescheduled_to_event_id INT NULL AFTER rescheduled_from_event_id
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_events_status ON events (status)
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_events_resched_from ON events (rescheduled_from_event_id)
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_events_resched_to ON events (rescheduled_to_event_id)
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_events_canceled_by ON events (canceled_by)
  `);

  await db.query(`
    ALTER TABLE events
      ADD CONSTRAINT fk_events_canceled_by
      FOREIGN KEY (canceled_by) REFERENCES users(id) ON DELETE SET NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE events
      ADD CONSTRAINT fk_events_rescheduled_from
      FOREIGN KEY (rescheduled_from_event_id) REFERENCES events(id) ON DELETE SET NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE events
      ADD CONSTRAINT fk_events_rescheduled_to
      FOREIGN KEY (rescheduled_to_event_id) REFERENCES events(id) ON DELETE SET NULL
  `).catch(() => {});

  console.log('Migration complete: events cancellation/reschedule columns are ready.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

