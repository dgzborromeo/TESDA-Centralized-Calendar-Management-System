const db = require('../config/db');
async function debug() {
  const [cols] = await db.query('DESCRIBE events');
  console.log('Events columns:', cols.map(c => c.Field + ' (' + c.Type + ')').join('\n'));

  const [events] = await db.query('SELECT id, title, participants FROM events ORDER BY id DESC LIMIT 3');
  console.log('\nSample events:', JSON.stringify(events, null, 2));

  const [parts] = await db.query(
    'SELECT sp.*, p.name as position_name FROM schedule_participants sp JOIN positions p ON p.id = sp.designation_id WHERE sp.schedule_id = 11'
  );
  console.log('\nSchedule 11 participants with names:', JSON.stringify(parts, null, 2));

  // Check regions/provinces for the target_ids
  const [reg] = await db.query('SELECT id, region FROM regions WHERE id = 4');
  console.log('\nRegion 4:', JSON.stringify(reg, null, 2));
  const [off] = await db.query('SELECT id, name FROM offices WHERE id = 8');
  console.log('\nOffice 8:', JSON.stringify(off, null, 2));

  process.exit(0);
}
debug().catch(e => { console.error(e); process.exit(1); });
