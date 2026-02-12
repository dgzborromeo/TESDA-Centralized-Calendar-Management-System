/**
 * Create event_attachments table for uploaded event files.
 * Usage: node backend/scripts/migrate-event-attachments.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS event_attachments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(150) NULL,
      size_bytes INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      INDEX idx_event (event_id)
    ) ENGINE=InnoDB
  `);
  console.log('Migration complete: event_attachments table is ready.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
