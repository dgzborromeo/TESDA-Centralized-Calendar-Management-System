/**
 * Create `event_rsvps` table (if missing) and backfill from `event_attendees`.
 * Safe to run multiple times.
 *
 * Usage: node backend/scripts/migrate-event-rsvps.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS event_rsvps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      office_user_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
      representative_name VARCHAR(255) NULL,
      decline_reason TEXT NULL,
      responded_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (office_user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_event_office (event_id, office_user_id),
      INDEX idx_office_status (office_user_id, status),
      INDEX idx_event_status (event_id, status)
    ) ENGINE=InnoDB
  `);

  // Backfill pending RSVPs for existing attendees
  await db.query(`
    INSERT IGNORE INTO event_rsvps (event_id, office_user_id, status)
    SELECT ea.event_id, ea.user_id, 'pending'
    FROM event_attendees ea
  `);

  console.log('event_rsvps migration complete (created + backfilled).');
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});

