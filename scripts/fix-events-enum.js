/**
 * Fix events table ENUM to match schedules table
 */
const db = require('../config/db');

async function fixEventsEnum() {
  try {
    console.log('\n========================================');
    console.log('FIXING EVENTS TABLE ENUM');
    console.log('========================================\n');

    // 1. Check current ENUM
    console.log('1. Current events.type ENUM:');
    const [cols] = await db.query("SHOW COLUMNS FROM events LIKE 'type'");
    console.log('   ', cols[0].Type);

    // 2. First, convert any old values to new equivalents
    console.log('\n2. Converting old type values...');
    await db.query("UPDATE events SET type = 'Face to Face' WHERE type = 'meeting' OR type = 'event' OR type = ''");
    await db.query("UPDATE events SET type = 'Virtual/Zoom' WHERE type = 'zoom'");
    console.log('   ✅ Old values converted');

    // 3. Modify ENUM to new values
    console.log('\n3. Modifying ENUM to new values...');
    await db.query(`
      ALTER TABLE events 
      MODIFY COLUMN type ENUM('Face to Face', 'Hybrid', 'Virtual/Zoom') 
      DEFAULT 'Face to Face'
    `);
    console.log('   ✅ ENUM updated');

    // 4. Verify new ENUM
    console.log('\n4. New events.type ENUM:');
    const [newCols] = await db.query("SHOW COLUMNS FROM events LIKE 'type'");
    console.log('   ', newCols[0].Type);

    // 5. Check recent events
    console.log('\n5. Recent events after fix:');
    const [events] = await db.query(`
      SELECT id, title, type, status, created_at 
      FROM events 
      ORDER BY id DESC 
      LIMIT 5
    `);
    console.table(events);

    console.log('\n========================================');
    console.log('✅ EVENTS TABLE FIXED!');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err);
    process.exit(1);
  }
}

fixEventsEnum();
