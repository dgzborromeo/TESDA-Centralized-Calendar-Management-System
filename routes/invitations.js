/**
 * Invitations / notifications API
 * Derived from pending rows in `event_rsvps`.
 */
const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { resolveUserNameConfig } = require('../utils/userName');
const { toYMD } = require('../utils/dateCoerce');

const router = express.Router();

router.use(auth);

// GET /api/invitations - pending invites for current user (upcoming/ongoing only)
router.get('/', async (req, res) => {
  try {
    const cfg = await resolveUserNameConfig(db);
    const [rows] = await db.query(
      `
        SELECT
          r.event_id,
          e.title,
          e.type,
          e.date,
          e.start_time,
          e.end_time,
          e.location,
          e.color,
          ${cfg.selectExpr('u')} AS creator_name
        FROM event_rsvps r
        JOIN events e ON e.id = r.event_id
        LEFT JOIN users u ON u.id = e.created_by
        WHERE r.office_user_id = ?
          AND r.status = 'pending'
          AND (
            e.date > CURDATE()
            OR (e.date = CURDATE() AND e.end_time >= CURTIME())
          )
        ORDER BY e.date, e.start_time
      `,
      [req.user.id]
    );

    res.json(
      rows.map((r) => ({
        ...r,
        date: toYMD(r.date),
      }))
    );
  } catch (err) {
    console.error('Invitations:', err);
    res.status(500).json({ error: 'Failed to fetch invitations.' });
  }
});

module.exports = router;

