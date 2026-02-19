/**
 * TESDA Calendar System - API Server
 * Express + MySQL + JWT auth
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const usersRoutes = require('./routes/users');
const invitationsRoutes = require('./routes/invitations');
const apiRoutes = require('./routes/api');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api', apiRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Calendar API running at http://localhost:${PORT}`);
});
