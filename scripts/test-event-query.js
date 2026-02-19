/**
 * Test the events list query to see the actual DB error.
 * Run from project root: node backend/scripts/test-events-query.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../config/db');
const { resolveUserNameConfig } = require('../utils/userName');
const { toYMD } = require('../utils/dateCoerce');

async function main() {
  try {
    console.log('Connecting to DB:', process.env.DB_HOST || 'localhost', process.env.DB_NAME || 'tesda_calendar');
    await db.query('SELECT 1');
    console.log('DB connection OK');

    const cfg = await resolveUserNameConfig(db);
    console.log('UserName config OK, selectExpr(u):', cfg.selectExpr('u'));

    const sql = `
      SELECT e.*, ${cfg.selectExpr('u')} AS creator_name,
        rs.date AS rescheduled_to_date,
        rs.end_date AS rescheduled_to_end_date,
        rs.title AS rescheduled_to_title,
        (SELECT COUNT(*) FROM conflicts c WHERE c.event_id = e.id) AS conflict_count,
        (SELECT COUNT(*) FROM event_attachments a WHERE a.event_id = e.id) AS attachment_count,
        (SELECT COUNT(*) FROM event_attachments a WHERE a.event_id = e.id AND a.original_name LIKE '[POSTDOC:%') AS post_document_count,
        (SELECT GROUP_CONCAT(DISTINCT ${cfg.selectExpr('u2')} ORDER BY ${cfg.selectExpr('u2')} SEPARATOR ', ')
          FROM event_attendees ea
          JOIN users u2 ON u2.id = ea.user_id
          WHERE ea.event_id = e.id) AS participants_summary
      FROM events e
      LEFT JOIN users u ON u.id = e.created_by
      LEFT JOIN events rs ON rs.id = e.rescheduled_to_event_id
      WHERE 1=1
      ORDER BY e.date, e.start_time
      LIMIT 1
    `;
    const [events] = await db.query(sql);
    console.log('Events query OK, count:', events.length);
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  }
}

main();
