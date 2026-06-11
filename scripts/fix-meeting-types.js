/**
 * Fix meeting type issue - comprehensive check and repair
 */
const db = require('../config/db');

async function fixMeetingTypes() {
  try {
    console.log('\n========================================');
    console.log('MEETING TYPE FIX SCRIPT');
    console.log('========================================\n');

    // 1. Check schedules table structure
    console.log('1. Checking schedules table structure...');
    const [schedColumns] = await db.query("SHOW COLUMNS FROM schedules LIKE 'type'");
    if (schedColumns.length === 0) {
      console.log('❌ ERROR: schedules.type column does not exist!');
      console.log('   Creating column...');
      await db.query(`
        ALTER TABLE schedules 
        ADD COLUMN type ENUM('Face to Face', 'Hybrid', 'Virtual/Zoom') 
        AFTER description
      `);
      console.log('✅ schedules.type column created');
    } else {
      console.log('✅ schedules.type column exists');
      console.log('   Type:', schedColumns[0].Type);
    }

    // 2. Check events table structure
    console.log('\n2. Checking events table structure...');
    const [eventColumns] = await db.query("SHOW COLUMNS FROM events LIKE 'type'");
    if (eventColumns.length === 0) {
      console.log('❌ ERROR: events.type column does not exist!');
    } else {
      console.log('✅ events.type column exists');
      console.log('   Type:', eventColumns[0].Type);
    }

    // 3. Check recent schedules
    console.log('\n3. Checking recent schedules...');
    const [schedules] = await db.query(`
      SELECT id, event_title, type, status, created_at 
      FROM schedules 
      ORDER BY id DESC 
      LIMIT 5
    `);
    console.table(schedules);

    // 4. Check recent events
    console.log('\n4. Checking recent events...');
    const [events] = await db.query(`
      SELECT id, title, type, status, created_at 
      FROM events 
      ORDER BY id DESC 
      LIMIT 5
    `);
    console.table(events);

    // 5. Fix NULL/empty types in schedules
    console.log('\n5. Fixing NULL/empty types in schedules...');
    const [schedUpdate] = await db.query(`
      UPDATE schedules 
      SET type = 'Face to Face' 
      WHERE type IS NULL OR type = '' OR type = 'meeting'
    `);
    console.log(`✅ Updated ${schedUpdate.affectedRows} schedule records`);

    // 6. Fix NULL/empty types in events
    console.log('\n6. Fixing NULL/empty types in events...');
    const [eventUpdate] = await db.query(`
      UPDATE events 
      SET type = 'Face to Face' 
      WHERE type IS NULL OR type = '' OR type = 'meeting' OR type = 'event' OR type = 'zoom'
    `);
    console.log(`✅ Updated ${eventUpdate.affectedRows} event records`);

    // 7. Verify fix
    console.log('\n7. Verifying fix...');
    const [emptySchedTypes] = await db.query(`
      SELECT COUNT(*) as count 
      FROM schedules 
      WHERE type IS NULL OR type = ''
    `);
    console.log(`   Schedules with empty type: ${emptySchedTypes[0].count}`);

    const [emptyEventTypes] = await db.query(`
      SELECT COUNT(*) as count 
      FROM events 
      WHERE type IS NULL OR type = ''
    `);
    console.log(`   Events with empty type: ${emptyEventTypes[0].count}`);

    console.log('\n========================================');
    console.log('✅ FIX COMPLETE!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('1. Restart backend server');
    console.log('2. Create a new event with Hybrid type');
    console.log('3. Check if it displays correctly\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err);
    process.exit(1);
  }
}

fixMeetingTypes();
