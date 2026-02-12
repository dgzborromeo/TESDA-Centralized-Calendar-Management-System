/**
 * Resolve a safe "display name" expression for the users table, even when
 * the database schema uses a different column name than `name`.
 *
 * This fixes runtime errors like: "Unknown column 'name' in 'field list'".
 */

let cachedColumns = null;

async function getUserColumns(db) {
  if (cachedColumns) return cachedColumns;
  let cols = [];
  try {
    const [rows] = await db.query(
      `
        SELECT COLUMN_NAME AS name
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
      `
    );
    cols = rows.map((r) => String(r.name));
  } catch (e) {
    // Some MySQL setups restrict INFORMATION_SCHEMA. Fallback.
    const [rows] = await db.query('SHOW COLUMNS FROM users');
    cols = rows.map((r) => String(r.Field));
  }
  cachedColumns = new Set(cols);
  return cachedColumns;
}

function has(cols, col) {
  return cols.has(col);
}

/**
 * Returns a SQL expression (string) which can be used in SELECT as:
 *   SELECT ${expr} AS name
 *
 * @param {Set<string>} cols
 * @param {string} alias - table alias or table name (e.g. 'u' or 'users')
 */
function userDisplayNameExpr(cols, alias = 'u') {
  const a = alias;
  if (has(cols, 'name')) return `${a}.name`;
  if (has(cols, 'full_name')) return `${a}.full_name`;
  if (has(cols, 'fullname')) return `${a}.fullname`;
  if (has(cols, 'username')) return `${a}.username`;
  if (has(cols, 'first_name') && has(cols, 'last_name')) return `CONCAT(${a}.first_name, ' ', ${a}.last_name)`;
  if (has(cols, 'first_name')) return `${a}.first_name`;
  if (has(cols, 'last_name')) return `${a}.last_name`;
  // fallback that should always exist
  return `${a}.email`;
}

/**
 * Returns the best column name to INSERT the user's display name into.
 * Returns null if none of the supported columns exist.
 */
function userNameInsertColumn(cols) {
  if (has(cols, 'name')) return 'name';
  if (has(cols, 'full_name')) return 'full_name';
  if (has(cols, 'fullname')) return 'fullname';
  if (has(cols, 'username')) return 'username';
  if (has(cols, 'first_name')) return 'first_name';
  return null;
}

async function resolveUserNameConfig(db) {
  const cols = await getUserColumns(db);
  return {
    cols,
    selectExpr: (alias) => userDisplayNameExpr(cols, alias),
    insertColumn: userNameInsertColumn(cols),
  };
}

module.exports = {
  resolveUserNameConfig,
};

