/**
 * TESDA Calendar System - API Server
 * Express + MySQL + JWT auth
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const usersRoutes = require('./routes/users');
const invitationsRoutes = require('./routes/invitations');

const app = express();
const PORT = process.env.PORT || 3001;

async function ensureSchema() {
  // Make sure newer columns exist in older deployments (local/hosted).
  try {
    const [rows] = await db.query(
      `
        SELECT COUNT(*) AS cnt
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'events'
          AND COLUMN_NAME = 'regional_directors_label'
      `
    );
    const exists = Number(rows?.[0]?.cnt || 0) > 0;
    if (!exists) {
      await db.query(`ALTER TABLE events ADD COLUMN regional_directors_label TEXT NULL AFTER description`);
      console.log('[schema] Added events.regional_directors_label');
    }
  } catch (e) {
    // Don't block server start; just log. (Some hosts may restrict INFORMATION_SCHEMA access.)
    console.warn('[schema] ensureSchema skipped:', e?.message || e);
  }
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/invitations', invitationsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

(async () => {
  await ensureSchema();
  app.listen(PORT, () => {
    console.log(`Calendar API running at http://localhost:${PORT}`);
  });
})();
