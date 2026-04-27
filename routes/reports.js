/**
 * Reports API — admin only
 * GET /api/reports/events?start=&end=&status=&type=
 */
const express = require('express');
const db = require('../config/db');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/events', auth, requireAdmin, async (req, res) => {
  try {
    const { start, end, status, type } = req.query;

    let where = ['1=1'];
    const params = [];

    if (start) { where.push('e.date >= ?'); params.push(start); }
    if (end)   { where.push('e.date <= ?'); params.push(end); }
    if (status && status !== 'all') { where.push('e.status = ?'); params.push(status); }
    if (type   && type   !== 'all') { where.push('e.type = ?');   params.push(type); }

    const sql = `
      SELECT
        e.id,
        e.title,
        e.type,
        e.date,
        e.end_date,
        e.start_time,
        e.end_time,
        e.location,
        e.status,
        e.is_posted,
        e.participants,
        e.description,
        e.created_at,
        u.name AS creator_name
      FROM events e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE ${where.join(' AND ')}
      ORDER BY e.date ASC, e.start_time ASC
    `;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

module.exports = router;
