/**
 * One-time fix: update event id 182 (promoted from schedule 11) with participant labels
 */
const db = require('../config/db');

async function fix() {
  // Get schedule 11 participants with position names and location names
  const [parts] = await db.query(`
    SELECT sp.designation_id, sp.target_id, sp.target_type, sp.is_all, p.name as position_name
    FROM schedule_participants sp
    JOIN positions p ON p.id = sp.designation_id
    WHERE sp.schedule_id = 11
  `);

  const rdNames = [], pdNames = [], edNames = [], allNames = [];

  for (const p of parts) {
    const posName = p.position_name || '';
    const posLower = posName.toLowerCase();
    const targetType = p.target_type ? String(p.target_type).toLowerCase().trim() : '';
    const targetId = p.target_id;
    const isAll = p.is_all;

    let locationName = '';
    if (isAll) {
      locationName = '(All)';
    } else if (targetId) {
      switch (targetType) {
        case 'region': {
          const [r] = await db.query('SELECT region FROM regions WHERE id = ? LIMIT 1', [targetId]);
          locationName = r[0] ? `(${r[0].region})` : '';
          break;
        }
        case 'province': case 'prov': case 'district': {
          const [r] = await db.query('SELECT name FROM provinces WHERE id = ? LIMIT 1', [targetId]);
          locationName = r[0] ? `(${r[0].name})` : '';
          break;
        }
        case 'office': {
          const [r] = await db.query('SELECT name, abbr FROM offices WHERE id = ? LIMIT 1', [targetId]);
          locationName = r[0] ? `(${r[0].abbr || r[0].name})` : '';
          break;
        }
        case 'cluster': {
          const [r] = await db.query('SELECT name FROM clusters WHERE id = ? LIMIT 1', [targetId]);
          locationName = r[0] ? `(${r[0].name})` : '';
          break;
        }
        default:
          locationName = targetType ? `(${targetType.toUpperCase()})` : '';
      }
    }

    const label = locationName ? `${posName} ${locationName}` : posName;
    allNames.push(label);

    if (posLower.includes('regional director')) rdNames.push(isAll ? 'All RDs' : label);
    else if (posLower.includes('provincial director') || posLower.includes('district director')) pdNames.push(isAll ? 'All PDs' : label);
    else if (posLower.includes('executive director')) edNames.push(isAll ? 'All EDs' : label);
  }

  console.log('Participants text:', allNames.join(', '));
  console.log('RD label:', rdNames.join(', '));
  console.log('PD label:', pdNames.join(', '));
  console.log('ED label:', edNames.join(', '));

  await db.query(
    `UPDATE events SET 
      participants = ?,
      regional_directors_label = ?,
      provincial_directors_label = ?,
      executive_directors_label = ?
     WHERE id = 182`,
    [
      allNames.length ? allNames.join(', ') : null,
      rdNames.length ? rdNames.join(', ') : null,
      pdNames.length ? pdNames.join(', ') : null,
      edNames.length ? edNames.join(', ') : null,
    ]
  );

  console.log('Event 182 updated successfully.');
  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
