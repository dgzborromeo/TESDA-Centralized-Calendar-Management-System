function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Normalize a MySQL DATE/Datetime value into a plain "YYYY-MM-DD" string.
 * - If mysql2 returns DATE as a JS Date, using local getters avoids UTC shift.
 * - If it's already a string, keep the first 10 chars.
 */
function toYMD(value) {
  if (!value) return value;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = pad2(value.getMonth() + 1);
    const d = pad2(value.getDate());
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'string') {
    // If backend accidentally serialized a Date into ISO (e.g. 2026-02-02T16:00:00.000Z),
    // interpret it as a real timestamp and convert to local YMD to avoid off-by-one days.
    if (value.includes('T')) {
      const dt = new Date(value);
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = pad2(dt.getMonth() + 1);
        const d = pad2(dt.getDate());
        return `${y}-${m}-${d}`;
      }
    }
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
  return String(value);
}

module.exports = { toYMD };

