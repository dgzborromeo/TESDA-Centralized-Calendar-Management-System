/**
 * Check the type field values in schedules and events tables
 */
const db = require('../config/db');

async function checkTypes() {
  try {
    console.log('\n=== SCHEDULES TABLE ===');
    const [schedules] = await db.query(`
      SELECT id, event_title, type, status, created_at 
      FROM schedules 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.table(schedules);

    console.log('\n=== EVENTS TABLE ===');
    const [events] = await db.query(`
      SELECT id, title, type, status, created_at 
      FROM events 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.table(events);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkTypes();
