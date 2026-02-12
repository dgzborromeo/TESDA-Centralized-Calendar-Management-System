/**
 * Authentication routes: login, register, me
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { resolveUserNameConfig } = require('../utils/userName');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const cfg = await resolveUserNameConfig(db);
    if (!cfg.insertColumn) {
      return res.status(500).json({ error: 'Users table has no supported name column (name/full_name/fullname/username).' });
    }

    const [result] = await db.query(
      `INSERT INTO users (${cfg.insertColumn}, email, password, role) VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, 'user']
    );

    const [users] = await db.query(
      `SELECT id, ${cfg.selectExpr('users')} AS name, email, role, created_at FROM users WHERE id = ?`,
      [result.insertId]
    );
    const user = users[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const cfg = await resolveUserNameConfig(db);
    const [users] = await db.query(
      `SELECT id, ${cfg.selectExpr('users')} AS name, email, password, role, created_at FROM users WHERE email = ?`,
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    delete user.password;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: req.body.remember ? '30d' : '7d' }
    );
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    const code = err.code || '';
    const msg = code === 'ECONNREFUSED' ? 'Cannot connect to database. Is MySQL running?'
      : code === 'ER_BAD_DB_ERROR' ? 'Database "tesda_calendar" not found. Run database/schema.sql first.'
      : code === 'ER_ACCESS_DENIED_ERROR' ? 'Database access denied. Check backend/.env (DB_USER, DB_PASSWORD).'
      : 'Login failed. Check backend console for details.';
    res.status(500).json({ error: msg });
  }
});

// GET /api/auth/me - current user (protected)
router.get('/me', auth, async (req, res) => {
  try {
    const cfg = await resolveUserNameConfig(db);
    const [users] = await db.query(
      `SELECT id, ${cfg.selectExpr('users')} AS name, email, role, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

module.exports = router;
