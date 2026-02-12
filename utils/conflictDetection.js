/**
 * Conflict detection for events by date overlap and time overlap.
 * Two events conflict on a target date if:
 * - target date is within existing event date range
 * - start_time < other_end_time AND end_time > other_start_time
 */
const db = require('../config/db');

/**
 * Check for conflicting events (same date, overlapping time)
 * @param {string} date - target date YYYY-MM-DD
 * @param {string} startTime - HH:MM or HH:MM:SS
 * @param {string} endTime - HH:MM or HH:MM:SS
 * @param {number} excludeEventId - optional event ID to exclude (for edit)
 * @param {number} userId - only check events created by this user (or all if admin)
 * @param {string} role - 'admin' checks all, 'user' checks only own
 * @returns {Promise<Array>} conflicting events
 */
async function getConflicts(date, startTime, endTime, excludeEventId = null, userId = null, role = 'user') {
  let sql = `
    SELECT e.id, e.title, e.type, e.date, e.end_date, e.start_time, e.end_time, e.location, e.created_by
    FROM events e
    WHERE e.date <= ?
    AND COALESCE(e.end_date, e.date) >= ?
    AND e.start_time < ?
    AND e.end_time > ?
  `;
  const params = [date, date, endTime, startTime];
  if (excludeEventId) {
    sql += ' AND e.id != ?';
    params.push(excludeEventId);
  }
  if (role !== 'admin' && userId) {
    sql += ' AND e.created_by = ?';
    params.push(userId);
  }
  const [rows] = await db.query(sql, params);
  return rows;
}

/**
 * Log conflict pair to conflicts table (optional)
 */
async function logConflict(eventId, conflictingEventId) {
  await db.query(
    'INSERT IGNORE INTO conflicts (event_id, conflicting_event_id) VALUES (?, ?)',
    [eventId, conflictingEventId]
  );
}

/**
 * Get all conflict pairs for an event (for display)
 */
async function getConflictsForEvent(eventId) {
  const [rows] = await db.query(`
    SELECT c.id, c.conflicting_event_id, e.title, e.start_time, e.end_time
    FROM conflicts c
    JOIN events e ON e.id = c.conflicting_event_id
    WHERE c.event_id = ?
  `, [eventId]);
  return rows;
}

module.exports = { getConflicts, logConflict, getConflictsForEvent };
