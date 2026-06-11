const db = require('../config/db');

db.query('SELECT id, title, type, date FROM events WHERE id IN (269, 270, 271, 272)')
  .then(([rows]) => {
    console.table(rows);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
