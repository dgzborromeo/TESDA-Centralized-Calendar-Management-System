/**
 * Events CRUD API with conflict detection
 * Regular users can only manage their own events; admin can manage all
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../config/db');
const { auth, requireAdmin } = require('../middleware/auth');
const { getConflictsForEvent } = require('../utils/conflictDetection');
const { resolveUserNameConfig } = require('../utils/userName');
const { toYMD } = require('../utils/dateCoerce');
const {
  isRomoUser, isOsecUser, isPoUser, isSmoUser, isCoUser, isIctoUser, isAsUser, isPloUser,
  isPioUser, isQsoUser, isFmsUser, isClgeoUser, isEbetoUser,
  assignedOfficeColor,
} = require('../utils/specialUsers');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads', 'events');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').slice(0, 12).toLowerCase();
      const safeBase = path
        .basename(file.originalname || 'file', path.extname(file.originalname || ''))
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 80) || 'file';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// All routes require auth
router.use(auth);

// Helper: can user modify this event?
function canModify(req, event) {
  if (
    isRomoUser(req.user) || isPoUser(req.user) || isSmoUser(req.user) || isCoUser(req.user) ||
    isIctoUser(req.user) || isAsUser(req.user) || isPloUser(req.user) ||
    isPioUser(req.user) || isQsoUser(req.user) || isFmsUser(req.user) || isClgeoUser(req.user) || isEbetoUser(req.user)
  ) return false;
  if (req.user.role === 'admin') return true;
  return event.created_by === req.user.id;
}

function isWeekendYMD(ymd) {
  if (!ymd || typeof ymd !== 'string' || ymd.length < 10) return false;
  const d = new Date(`${ymd.slice(0, 10)}T12:00:00`);
  const day = d.getDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

function isEventDoneRecord(eventRow) {
  const date = toYMD(eventRow?.date);
  const endDate = toYMD(eventRow?.end_date) || date;
  const endTime = String(eventRow?.end_time || '').slice(0, 8);
  if (!date || !endDate || !endTime) return false;
  const endAt = new Date(`${endDate}T${endTime}`);
  if (!Number.isFinite(endAt.getTime())) return false;
  return new Date() >= endAt;
}

function datesInRange(startYmd, endYmd) {
  const start = String(startYmd || '').slice(0, 10);
  const end = String(endYmd || '').slice(0, 10);
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate < startDate) {
    return [];
  }
  const out = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    out.push(toYMD(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function parseAttendeeIds(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return raw
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n));
    }
  }
  return [];
}

function attachmentPublicPath(fileName) {
  return `/uploads/events/${encodeURIComponent(fileName)}`;
}

async function getParticipantConflicts({ date, startTime, endTime, participantIds, excludeEventId = null }) {
  const ids = Array.from(new Set((participantIds || []).map((n) => parseInt(n, 10)).filter((n) => Number.isFinite(n))));
  if (!ids.length) return [];

  const idPlaceholders = ids.map(() => '?').join(', ');
  let sql = `
    SELECT DISTINCT
      e.id, e.title, e.date, e.end_date, e.start_time, e.end_time,
      (
        SELECT GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ')
        FROM users u
        WHERE u.id IN (${idPlaceholders})
          AND (
            u.id = e.created_by
            OR EXISTS (
              SELECT 1
              FROM event_attendees ea2
              WHERE ea2.event_id = e.id
                AND ea2.user_id = u.id
            )
          )
      ) AS overlapping_participants
    FROM events e
    WHERE e.date <= ?
      AND COALESCE(e.end_date, e.date) >= ?
      AND e.start_time < ?
      AND e.end_time > ?
      AND (
        e.created_by IN (${idPlaceholders})
        OR EXISTS (
          SELECT 1
          FROM event_attendees ea
          WHERE ea.event_id = e.id
            AND ea.user_id IN (${idPlaceholders})
        )
      )
  `;
  const params = [...ids, date, date, endTime, startTime, ...ids, ...ids];
  if (excludeEventId) {
    sql += ' AND e.id != ?';
    params.push(excludeEventId);
  }
  sql += ' ORDER BY e.date, e.start_time';
  const [rows] = await db.query(sql, params);
  return rows;
}

// GET /api/events - list events (filter by date range, user, search q for title/location)
router.get('/', async (req, res) => {
  try {
    const { start, end, date, q } = req.query;
    const cfg = await resolveUserNameConfig(db);
    let sql = `
      SELECT e.*, ${cfg.selectExpr('u')} AS creator_name,
        (SELECT COUNT(*) FROM conflicts c WHERE c.event_id = e.id) AS conflict_count,
        (
          SELECT GROUP_CONCAT(DISTINCT ${cfg.selectExpr('u2')} ORDER BY ${cfg.selectExpr('u2')} SEPARATOR ', ')
          FROM event_attendees ea
          JOIN users u2 ON u2.id = ea.user_id
          WHERE ea.event_id = e.id
        ) AS participants_summary
      FROM events e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE 1=1
    `;
    const params = [];
    // Everyone can view all events; edit permissions are enforced on PUT/DELETE
    if (start && end) {
      sql += ' AND e.date <= ? AND COALESCE(e.end_date, e.date) >= ?';
      params.push(end, start);
    }
    if (date) {
      sql += ' AND e.date <= ? AND COALESCE(e.end_date, e.date) >= ?';
      params.push(date, date);
    }
    if (q && q.trim()) {
      sql += ' AND (e.title LIKE ? OR e.location LIKE ? OR e.description LIKE ?)';
      const like = `%${q.trim()}%`;
      params.push(like, like, like);
    }
    sql += ' ORDER BY e.date, e.start_time';
    const [events] = await db.query(sql, params);
    res.json(
      events.map((e) => ({
        ...e,
        date: toYMD(e.date),
        end_date: e.end_date ? toYMD(e.end_date) : null,
      }))
    );
  } catch (err) {
    console.error('List events:', err);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

// GET /api/events/conflicts - count conflicts for current user's events
router.get('/conflicts', async (req, res) => {
  try {
    // Show total conflicts to everyone (admin + normal user)
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM conflicts');
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get conflict count.' });
  }
});

// GET /api/events/conflicts/list - list conflicting event pairs for sidebar
router.get('/conflicts/list', async (req, res) => {
  try {
    // Show full conflict list to everyone (admin + normal user)
    const sql = `
      SELECT c.id AS conflict_id, c.event_id, c.conflicting_event_id,
        e1.title AS event_title, e1.date AS event_date, e1.start_time AS event_start, e1.end_time AS event_end, e1.type AS event_type,
        e2.title AS conflicting_title, e2.date AS conflicting_date, e2.start_time AS conflicting_start, e2.end_time AS conflicting_end,
        CASE
          WHEN e1.date = e2.date AND e1.start_time < e2.end_time AND e1.end_time > e2.start_time THEN 1
          ELSE 0
        END AS time_conflict,
        CASE
          WHEN (
            EXISTS (
              SELECT 1
              FROM event_attendees ea1
              WHERE ea1.event_id = e1.id
                AND ea1.user_id IN (
                  SELECT ea2.user_id FROM event_attendees ea2 WHERE ea2.event_id = e2.id
                  UNION SELECT e2.created_by
                )
              LIMIT 1
            )
            OR e1.created_by IN (
              SELECT ea2.user_id FROM event_attendees ea2 WHERE ea2.event_id = e2.id
              UNION SELECT e2.created_by
            )
          ) THEN 1
          ELSE 0
        END AS participant_conflict
      FROM conflicts c
      JOIN events e1 ON e1.id = c.event_id
      JOIN events e2 ON e2.id = c.conflicting_event_id
      ORDER BY e1.date DESC, e1.start_time DESC
    `;
    const [rows] = await db.query(sql);
    res.json(
      rows.map((r) => ({
        ...r,
        event_date: toYMD(r.event_date),
        conflicting_date: toYMD(r.conflicting_date),
      }))
    );
  } catch (err) {
    console.error('Conflicts list:', err);
    res.status(500).json({ error: 'Failed to get conflicts list.' });
  }
});

// GET /api/events/:id - single event with attendees and conflict info
router.get('/:id', async (req, res) => {
  try {
    const cfg = await resolveUserNameConfig(db);
    const [events] = await db.query(`
      SELECT e.*, ${cfg.selectExpr('u')} AS creator_name
      FROM events e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE e.id = ?
    `, [req.params.id]);
    if (events.length === 0) return res.status(404).json({ error: 'Event not found.' });
    const event = events[0];
    event.date = toYMD(event.date);
    event.end_date = event.end_date ? toYMD(event.end_date) : null;
    // Everyone can view all event details; edit permissions are enforced on PUT/DELETE
    const [attendees] = await db.query(`
      SELECT ea.user_id, ${cfg.selectExpr('u')} AS name, u.email
      FROM event_attendees ea
      JOIN users u ON u.id = ea.user_id
      WHERE ea.event_id = ?
    `, [req.params.id]);
    event.attendees = attendees;
    const [rsvps] = await db.query(
      `
        SELECT
          r.office_user_id,
          ${cfg.selectExpr('ou')} AS office_name,
          r.status,
          r.representative_name,
          r.decline_reason,
          r.responded_at
        FROM event_rsvps r
        JOIN users ou ON ou.id = r.office_user_id
        WHERE r.event_id = ?
        ORDER BY FIELD(r.status,'accepted','pending','declined'), office_name
      `,
      [req.params.id]
    );
    event.rsvps = rsvps;
    const [attachments] = await db.query(
      `
        SELECT id, event_id, file_name, original_name, mime_type, size_bytes, created_at
        FROM event_attachments
        WHERE event_id = ?
        ORDER BY id ASC
      `,
      [req.params.id]
    );
    event.attachments = attachments.map((a) => ({
      ...a,
      url: attachmentPublicPath(a.file_name),
    }));
    const conflicts = await getConflictsForEvent(req.params.id);
    event.conflicts = conflicts;
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event.' });
  }
});

// POST /api/events/:id/rsvp - invited office responds
router.post('/:id/rsvp', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (!Number.isFinite(eventId)) return res.status(400).json({ error: 'Invalid event id.' });

    const { status, representative_name, decline_reason, office_user_id } = req.body || {};

    const targetOfficeUserId =
      req.user.role === 'admin' && office_user_id ? parseInt(office_user_id, 10) : req.user.id;
    if (!Number.isFinite(targetOfficeUserId)) return res.status(400).json({ error: 'Invalid office_user_id.' });

    if (status !== 'accepted' && status !== 'declined') {
      return res.status(400).json({ error: "status must be 'accepted' or 'declined'." });
    }
    if (status === 'accepted' && (!representative_name || !String(representative_name).trim())) {
      return res.status(400).json({ error: 'Representative name is required when accepting.' });
    }
    if (status === 'declined' && (!decline_reason || !String(decline_reason).trim())) {
      return res.status(400).json({ error: 'Reason is required when declining.' });
    }

    // Verify invitation exists (or admin is acting)
    const [invRows] = await db.query(
      'SELECT status FROM event_rsvps WHERE event_id = ? AND office_user_id = ?',
      [eventId, targetOfficeUserId]
    );
    if (invRows.length === 0) {
      return res.status(403).json({ error: 'You are not invited to this event.' });
    }

    // Lock changes after event start time
    const [events] = await db.query('SELECT date, start_time FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) return res.status(404).json({ error: 'Event not found.' });
    const ymd = toYMD(events[0].date);
    const start = new Date(`${ymd}T${events[0].start_time}`);
    if (Number.isFinite(start.getTime()) && new Date() >= start) {
      return res.status(400).json({ error: 'Response is locked after the event start time.' });
    }

    await db.query(
      `
        UPDATE event_rsvps
        SET status = ?,
            representative_name = ?,
            decline_reason = ?,
            responded_at = NOW(),
            updated_at = NOW()
        WHERE event_id = ? AND office_user_id = ?
      `,
      [
        status,
        status === 'accepted' ? String(representative_name).trim() : null,
        status === 'declined' ? String(decline_reason).trim() : null,
        eventId,
        targetOfficeUserId,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('RSVP:', err);
    res.status(500).json({ error: 'Failed to submit response.' });
  }
});

// POST /api/events - create with conflict check
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { title, type, date, end_date, start_time, end_time, location, description } = req.body || {};
    const attendee_ids = parseAttendeeIds(req.body?.attendee_ids);
    if (!title || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Title, date, start time and end time are required.' });
    }
    const startDate = String(date).slice(0, 10);
    const endDate = String(end_date || date).slice(0, 10);
    const todayYmd = toYMD(new Date());
    if (endDate < startDate) {
      return res.status(400).json({ error: 'End date must be the same as or after start date.' });
    }
    if (startDate < todayYmd) {
      return res.status(400).json({ error: 'Past dates are view-only. Please select today or a future date.' });
    }
    const dateList = datesInRange(startDate, endDate);
    if (!dateList.length) {
      return res.status(400).json({ error: 'Invalid date range.' });
    }
    const hasWeekend = dateList.some((d) => isWeekendYMD(d));
    if (hasWeekend) {
      return res.status(400).json({ error: 'Weekends are locked. Please use weekdays only in the selected date range.' });
    }
    if (new Date(`1970-01-01T${end_time}`) <= new Date(`1970-01-01T${start_time}`)) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }

    // Participant conflict only (time overlap is allowed if participants don't overlap).
    const participantIds = [req.user.id, ...attendee_ids];
    const conflictsByDate = [];
    for (const d of dateList) {
      const conflicts = await getParticipantConflicts({
        date: d,
        startTime: start_time,
        endTime: end_time,
        participantIds,
      });
      if (conflicts.length > 0) {
        conflictsByDate.push(
          ...conflicts.map((c) => ({
            id: c.id,
            title: c.title,
            date: toYMD(c.date) || d,
            start_time: c.start_time,
            end_time: c.end_time,
            overlapping_participants: c.overlapping_participants || '',
          }))
        );
      }
    }
    if (conflictsByDate.length > 0) {
      return res.status(409).json({
        error: 'Selected participant(s) have overlapping schedule in this time slot.',
        conflicts: conflictsByDate,
      });
    }

    const finalColor = assignedOfficeColor(req.user);
    const normalizedEndDate = endDate > startDate ? endDate : null;
    const [result] = await db.query(
      `INSERT INTO events (title, type, date, end_date, start_time, end_time, location, description, color, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, type || 'meeting', startDate, normalizedEndDate, start_time, end_time, location || null, description || null, finalColor, req.user.id]
    );
    const eventId = result.insertId;
    if (attendee_ids && Array.isArray(attendee_ids) && attendee_ids.length > 0) {
      for (const uid of attendee_ids) {
        await db.query('INSERT IGNORE INTO event_attendees (event_id, user_id) VALUES (?, ?)', [eventId, uid]);
        await db.query(
          `INSERT IGNORE INTO event_rsvps (event_id, office_user_id, status) VALUES (?, ?, 'pending')`,
          [eventId, uid]
        );
      }
    }
    if (req.file) {
      await db.query(
        `
          INSERT INTO event_attachments (event_id, file_name, original_name, mime_type, size_bytes)
          VALUES (?, ?, ?, ?, ?)
        `,
        [eventId, req.file.filename, req.file.originalname, req.file.mimetype || null, req.file.size || 0]
      );
    }
    const cfg = await resolveUserNameConfig(db);
    const [createdEvents] = await db.query(
      `
        SELECT e.*, ${cfg.selectExpr('u')} AS creator_name
        FROM events e
        LEFT JOIN users u ON u.id = e.created_by
        WHERE e.id = ?
      `,
      [eventId]
    );
    const normalizedEvents = createdEvents.map((ev) => ({
      ...ev,
      date: toYMD(ev.date),
      end_date: ev.end_date ? toYMD(ev.end_date) : null,
    }));
    res.status(201).json({
      event: normalizedEvents[0],
      events: normalizedEvents,
      created_count: normalizedEvents.length,
      conflicts: [],
    });
  } catch (err) {
    console.error('Create event:', err);
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

// PUT /api/events/:id - update
router.put('/:id', async (req, res) => {
  try {
    if (
      isRomoUser(req.user) || isPoUser(req.user) || isSmoUser(req.user) || isCoUser(req.user) ||
      isIctoUser(req.user) || isAsUser(req.user) || isPloUser(req.user) ||
      isPioUser(req.user) || isQsoUser(req.user) || isFmsUser(req.user) || isClgeoUser(req.user) || isEbetoUser(req.user)
    ) {
      return res.status(403).json({ error: 'This account cannot edit events.' });
    }
    const [events] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (events.length === 0) return res.status(404).json({ error: 'Event not found.' });
    if (!canModify(req, events[0])) return res.status(403).json({ error: 'Access denied.' });
    if (isEventDoneRecord(events[0])) {
      return res.status(400).json({ error: 'This event is already done and is now view-only.' });
    }
    const { title, type, date, end_date, start_time, end_time, location, description, color, attendee_ids } = req.body;
    const e = events[0];
    const existingDate = toYMD(e.date);
    const existingEndDate = e.end_date ? toYMD(e.end_date) : existingDate;
    if (date !== undefined) {
      const requested = toYMD(date);
      // Allow editing other fields for an event already on a weekend, but block moving a weekday event onto weekends.
      if (requested && isWeekendYMD(requested) && requested !== existingDate) {
        return res.status(400).json({ error: 'Weekends are locked. Please select a weekday.' });
      }
    }
    const newTitle = title !== undefined ? title : e.title;
    const newType = type !== undefined ? type : e.type;
    const newDate = date !== undefined ? toYMD(date) : existingDate;
    const requestedEndDate = end_date !== undefined
      ? (end_date ? toYMD(end_date) : null)
      : (e.end_date ? toYMD(e.end_date) : null);
    const newEndDate = requestedEndDate && requestedEndDate > newDate ? requestedEndDate : null;
    if (requestedEndDate && requestedEndDate < newDate) {
      return res.status(400).json({ error: 'End date must be the same as or after start date.' });
    }
    const dateList = datesInRange(newDate, newEndDate || newDate);
    if (!dateList.length) {
      return res.status(400).json({ error: 'Invalid date range.' });
    }
    const movedFromOriginalRange = newDate !== existingDate || (newEndDate || existingDate) !== existingEndDate;
    if (movedFromOriginalRange && dateList.some((d) => isWeekendYMD(d))) {
      return res.status(400).json({ error: 'Weekends are locked. Please use weekdays only in the selected date range.' });
    }
    const newStart = start_time !== undefined ? start_time : e.start_time;
    const newEnd = end_time !== undefined ? end_time : e.end_time;
    if (new Date(`1970-01-01T${newEnd}`) <= new Date(`1970-01-01T${newStart}`)) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }
    // Participant conflict only (time overlap is allowed if participants don't overlap).
    let nextAttendeeIds = [];
    if (attendee_ids !== undefined && Array.isArray(attendee_ids)) {
      nextAttendeeIds = attendee_ids
        .map((x) => parseInt(x, 10))
        .filter((n) => Number.isFinite(n));
    } else {
      const [existingAttendees] = await db.query('SELECT user_id FROM event_attendees WHERE event_id = ?', [req.params.id]);
      nextAttendeeIds = existingAttendees.map((r) => r.user_id);
    }
    const participantIds = [e.created_by, ...nextAttendeeIds];
    const conflictRows = [];
    for (const d of dateList) {
      const conflicts = await getParticipantConflicts({
        date: d,
        startTime: newStart,
        endTime: newEnd,
        participantIds,
        excludeEventId: parseInt(req.params.id, 10),
      });
      if (conflicts.length > 0) {
        conflictRows.push(...conflicts.map((c) => ({ ...c, date: c.date ? toYMD(c.date) : d })));
      }
    }
    if (conflictRows.length > 0) {
      return res.status(409).json({
        error: 'Selected participant(s) have overlapping schedule in this time slot.',
        conflicts: conflictRows.map((c) => ({
          id: c.id,
          title: c.title,
          date: c.date,
          start_time: c.start_time,
          end_time: c.end_time,
          overlapping_participants: c.overlapping_participants || '',
        })),
      });
    }
    await db.query(
      `UPDATE events SET title=?, type=?, date=?, end_date=?, start_time=?, end_time=?, location=?, description=?, color=?, updated_at=NOW() WHERE id=?`,
      [newTitle, newType, newDate, newEndDate, newStart, newEnd, location !== undefined ? location : e.location, description !== undefined ? description : e.description, color !== undefined ? color : e.color, req.params.id]
    );
    await db.query('DELETE FROM conflicts WHERE event_id = ? OR conflicting_event_id = ?', [req.params.id, req.params.id]);
    if (attendee_ids !== undefined && Array.isArray(attendee_ids)) {
      await db.query('DELETE FROM event_attendees WHERE event_id = ?', [req.params.id]);
      for (const uid of attendee_ids) {
        await db.query('INSERT IGNORE INTO event_attendees (event_id, user_id) VALUES (?, ?)', [req.params.id, uid]);
      }

      // Sync RSVP rows to match attendee_ids (preserve existing accepted/declined for retained attendees)
      const [existingRsvps] = await db.query(
        'SELECT office_user_id FROM event_rsvps WHERE event_id = ?',
        [req.params.id]
      );
      const existingSet = new Set(existingRsvps.map((r) => r.office_user_id));
      const nextSet = new Set(attendee_ids.map((x) => parseInt(x, 10)).filter((n) => Number.isFinite(n)));

      for (const uid of nextSet) {
        if (!existingSet.has(uid)) {
          await db.query(
            `INSERT IGNORE INTO event_rsvps (event_id, office_user_id, status) VALUES (?, ?, 'pending')`,
            [req.params.id, uid]
          );
        }
      }
      for (const uid of existingSet) {
        if (!nextSet.has(uid)) {
          await db.query('DELETE FROM event_rsvps WHERE event_id = ? AND office_user_id = ?', [req.params.id, uid]);
        }
      }
    }
    const cfg = await resolveUserNameConfig(db);
    const [updated] = await db.query(`
      SELECT e.*, ${cfg.selectExpr('u')} AS creator_name FROM events e
      LEFT JOIN users u ON u.id = e.created_by WHERE e.id = ?
    `, [req.params.id]);
    res.json({
      event: { ...updated[0], date: toYMD(updated[0].date), end_date: updated[0].end_date ? toYMD(updated[0].end_date) : null },
      conflicts: [],
    });
  } catch (err) {
    console.error('Update event:', err);
    res.status(500).json({ error: 'Failed to update event.' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    if (
      isRomoUser(req.user) || isPoUser(req.user) || isSmoUser(req.user) || isCoUser(req.user) ||
      isIctoUser(req.user) || isAsUser(req.user) || isPloUser(req.user) ||
      isPioUser(req.user) || isQsoUser(req.user) || isFmsUser(req.user) || isClgeoUser(req.user) || isEbetoUser(req.user)
    ) {
      return res.status(403).json({ error: 'This account cannot delete events.' });
    }
    const [events] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (events.length === 0) return res.status(404).json({ error: 'Event not found.' });
    if (!canModify(req, events[0])) return res.status(403).json({ error: 'Access denied.' });
    if (isEventDoneRecord(events[0])) {
      return res.status(400).json({ error: 'This event is already done and is now view-only.' });
    }
    await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// POST /api/events/check-conflict - check without saving (for real-time UI)
router.post('/check-conflict', async (req, res) => {
  try {
    const { date, end_date, start_time, end_time, exclude_event_id } = req.body;
    const attendee_ids = parseAttendeeIds(req.body?.attendee_ids);
    if (!date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Date, start_time and end_time required.' });
    }
    const startDate = String(date).slice(0, 10);
    const endDate = String(end_date || date).slice(0, 10);
    if (endDate < startDate) {
      return res.status(400).json({ error: 'End date must be the same as or after start date.' });
    }
    const dateList = datesInRange(startDate, endDate);
    if (!dateList.length) {
      return res.status(400).json({ error: 'Invalid date range.' });
    }
    if (dateList.some((d) => isWeekendYMD(d))) {
      return res.status(400).json({ error: 'Weekends are locked. Please use weekdays only in the selected date range.' });
    }
    const merged = [];
    let baseParticipantId = req.user.id;
    if (exclude_event_id) {
      const [rows] = await db.query('SELECT created_by FROM events WHERE id = ?', [parseInt(exclude_event_id, 10)]);
      if (rows.length > 0 && Number.isFinite(rows[0].created_by)) {
        baseParticipantId = rows[0].created_by;
      }
    }
    const participantIds = [baseParticipantId, ...attendee_ids];
    for (const d of dateList) {
      const conflicts = await getParticipantConflicts({
        date: d,
        startTime: start_time,
        endTime: end_time,
        participantIds,
        excludeEventId: exclude_event_id ? parseInt(exclude_event_id, 10) : null,
      });
      merged.push(
        ...conflicts.map((c) => ({
          ...c,
          date: c.date ? toYMD(c.date) : d,
          end_date: c.end_date ? toYMD(c.end_date) : null,
        }))
      );
    }
    res.json({ conflicts: merged });
  } catch (err) {
    res.status(500).json({ error: 'Conflict check failed.' });
  }
});

module.exports = router;
