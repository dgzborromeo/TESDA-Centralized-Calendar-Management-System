/**
 * Sync event types from their source schedules
 */
const db = require('../config/db');

async function syncEventTypes() {
  try {
    console.log('\n========================================');
    console.log('SYNCING EVENT TYPES FROM SCHEDULES');
    console.log('========================================\n');

    // Find events that match schedules by title and date
    console.log('1. Finding matching schedule-event pairs...');
    const [matches] = await db.query(`
      SELECT 
        e.id as event_id,
        e.title as event_title,
        e.type as event_type,
        s.id as schedule_id,
        s.event_title as schedule_title,
        s.type as schedule_type
      FROM events e
      INNER JOIN schedules s ON (
        e.title = s.event_title 
        AND e.date = s.start_date
      )
      WHERE (e.type IS NULL OR e.type = '')
        AND s.type IS NOT NULL
        AND s.type != ''
      LIMIT 50
    `);

    console.log(`   Found ${matches.length} events to update\n`);

    if (matches.length === 0) {
      console.log('   No matching pairs found. All events may already be synced.\n');
    } else {
      console.log('2. Updating event types...');
      for (const match of matches) {
        await db.query(
          'UPDATE events SET type = ? WHERE id = ?',
          [match.schedule_type, match.event_id]
        );
        console.log(`   ✅ Event ${match.event_id} "${match.event_title}" → ${match.schedule_type}`);
      }
    }

    // 3. Set default for remaining empty ones
    console.log('\n3. Setting default for remaining events...');
    const [remaining] = await db.query(`
      UPDATE events 
      SET type = 'Face to Face' 
      WHERE type IS NULL OR type = ''
    `);
    console.log(`   ✅ Set ${remaining.affectedRows} events to default 'Face to Face'`);

    // 4. Verify
    console.log('\n4. Verification:');
    const [emptyCount] = await db.query(`
      SELECT COUNT(*) as count 
      FROM events 
      WHERE type IS NULL OR type = ''
    `);
    console.log(`   Events with empty type: ${emptyCount[0].count}`);

    const [typeDistribution] = await db.query(`
      SELECT type, COUNT(*) as count 
      FROM events 
      GROUP BY type 
      ORDER BY count DESC
    `);
    console.log('\n   Type distribution:');
    console.table(typeDistribution);

    console.log('\n========================================');
    console.log('✅ SYNC COMPLETE!');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err);
    process.exit(1);
  }
}

syncEventTypes();
