/**
 * Users API - list users (for attendee selection); admin can manage
 */
const express = require('express');
const db = require('../config/db');
const { auth, requireAdmin } = require('../middleware/auth');
const { resolveUserNameConfig } = require('../utils/userName');
const { assignedOfficeColor } = require('../utils/specialUsers');
const { CLUSTER_LEGEND } = require('../utils/clusterLegend');

const router = express.Router();

router.use(auth);

// GET /api/users/legend - list offices with assigned colors (for Calendar legend)
router.get('/legend', async (req, res) => {
  try {
    const cfg = await resolveUserNameConfig(db);
    const [rows] = await db.query(
      `SELECT id, ${cfg.selectExpr('users')} AS name, email, role FROM users ORDER BY name`
    );
    res.json(
      rows.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        color: assignedOfficeColor(u),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch legend users.' });
  }
});

// GET /api/users/legend/clusters - 7 clusters with expandable offices/divisions
router.get('/legend/clusters', async (req, res) => {
  try {
    const clusterEmails = [
      process.env.CLUSTER_OSEC_EMAIL || 'cluster.osec@tesda.gov.ph',
      process.env.CLUSTER_ODDG_PP_EMAIL || 'cluster.oddg.pp@tesda.gov.ph',
      process.env.CLUSTER_ODDG_AI_EMAIL || 'cluster.oddg.ai@tesda.gov.ph',
      process.env.CLUSTER_ODDG_SC_EMAIL || 'cluster.oddg.sc@tesda.gov.ph',
      process.env.CLUSTER_ODDG_PL_EMAIL || 'cluster.oddg.pl@tesda.gov.ph',
      process.env.CLUSTER_ODDG_FLA_EMAIL || 'cluster.oddg.fla@tesda.gov.ph',
      process.env.CLUSTER_ODDG_TESDO_EMAIL || 'cluster.oddg.tesdo@tesda.gov.ph',
    ].map((e) => String(e).toLowerCase());

    const placeholders = clusterEmails.map(() => '?').join(', ');
    const [rows] = await db.query(
      `SELECT id, email FROM users WHERE LOWER(email) IN (${placeholders})`,
      clusterEmails
    );
    const idByEmail = new Map(rows.map((r) => [String(r.email || '').toLowerCase(), r.id]));

    const out = CLUSTER_LEGEND.map((cluster) => {
      const clusterEmail = String(cluster?.account?.email || '').toLowerCase();
      const accountId = clusterEmail ? (idByEmail.get(clusterEmail) || null) : null;
      return {
        ...cluster,
        account: cluster.account
          ? {
              ...cluster.account,
              id: accountId,
              exists: Boolean(accountId),
            }
          : null,
      };
    });

    res.json(out);
  } catch (err) {
    console.error('Legend clusters:', err);
    res.status(500).json({ error: 'Failed to fetch cluster legend.' });
  }
});

// GET /api/users - list users (for dropdowns); admin sees all, user sees all (for attendees)
router.get('/', async (req, res) => {
  try {
    const cfg = await resolveUserNameConfig(db);
    const [users] = await db.query(
      `SELECT id, ${cfg.selectExpr('users')} AS name, email, role, created_at FROM users ORDER BY name`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET /api/users/:id - single user (admin or self)
router.get('/:id', async (req, res) => {
  if (req.user.role !== 'admin' && parseInt(req.params.id, 10) !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const cfg = await resolveUserNameConfig(db);
  const [users] = await db.query(
    `SELECT id, ${cfg.selectExpr('users')} AS name, email, role, created_at FROM users WHERE id = ?`,
    [req.params.id]
  );
  if (users.length === 0) return res.status(404).json({ error: 'User not found.' });
  res.json(users[0]);
});

module.exports = router;
