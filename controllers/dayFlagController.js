'use strict';
const db = require('../config/db');

// Ensure table exists (auto-create on first use)
async function ensureTable() {
  // Create table with the full, current schema
  await db.query(`
    CREATE TABLE IF NOT EXISTS day_flags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`date\` DATE NOT NULL UNIQUE,
      type ENUM('suspended','wfh') NOT NULL DEFAULT 'suspended',
      time VARCHAR(8) NULL,
      time_end VARCHAR(8) NULL,
      memo_subject VARCHAR(255) NULL,
      memo_number VARCHAR(100) NULL,
      note VARCHAR(255) NULL,
      created_by INT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // For existing tables created by older versions — add missing columns safely
  const alterCols = [
    `ALTER TABLE day_flags ADD COLUMN IF NOT EXISTS time VARCHAR(8) NULL AFTER type`,
    `ALTER TABLE day_flags ADD COLUMN IF NOT EXISTS time_end VARCHAR(8) NULL AFTER time`,
    `ALTER TABLE day_flags ADD COLUMN IF NOT EXISTS memo_subject VARCHAR(255) NULL AFTER time_end`,
    `ALTER TABLE day_flags ADD COLUMN IF NOT EXISTS memo_number VARCHAR(100) NULL AFTER memo_subject`,
    `ALTER TABLE day_flags ADD COLUMN IF NOT EXISTS note VARCHAR(255) NULL AFTER memo_number`,
  ];
  for (const sql of alterCols) {
    await db.query(sql).catch(() => {});
  }

  // Rename memo_title → memo_subject if the old column still exists
  const [cols] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'day_flags' AND COLUMN_NAME = 'memo_title'`
  ).catch(() => [[]]);
  if (cols && cols.length > 0) {
    await db.query(`ALTER TABLE day_flags CHANGE COLUMN memo_title memo_subject VARCHAR(255) NULL`).catch(() => {});
  }
}

exports.list = async (req, res) => {
  try {
    await ensureTable();
    const { year } = req.query;
    let sql = 'SELECT * FROM day_flags';
    const params = [];
    if (year) {
      sql += ' WHERE YEAR(`date`) = ?';
      params.push(year);
    }
    sql += ' ORDER BY `date` ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch day flags.' });
  }
};

exports.create = async (req, res) => {
  try {
    await ensureTable();
    const { date, type, time, time_end, memo_subject, memo_number, note } = req.body;
    if (!date || !type) return res.status(400).json({ error: 'date and type are required.' });
    const [result] = await db.query(
      'INSERT INTO day_flags (`date`, type, time, time_end, memo_subject, memo_number, note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [date, type, time || null, time_end || null, memo_subject || null, memo_number || null, note || null, req.user?.id || null]
    );
    const [rows] = await db.query('SELECT * FROM day_flags WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A flag already exists for that date.' });
    console.error(e);
    res.status(500).json({ error: 'Failed to create day flag.' });
  }
};

exports.update = async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { date, type, time, time_end, memo_subject, memo_number, note } = req.body;
    if (!date || !type) return res.status(400).json({ error: 'date and type are required.' });
    await db.query(
      'UPDATE day_flags SET `date` = ?, type = ?, time = ?, time_end = ?, memo_subject = ?, memo_number = ?, note = ?, updatedAt = NOW() WHERE id = ?',
      [date, type, time || null, time_end || null, memo_subject || null, memo_number || null, note || null, id]
    );
    const [rows] = await db.query('SELECT * FROM day_flags WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A flag already exists for that date.' });
    console.error(e);
    res.status(500).json({ error: 'Failed to update day flag.' });
  }
};

exports.remove = async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    await db.query('DELETE FROM day_flags WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete day flag.' });
  }
};
