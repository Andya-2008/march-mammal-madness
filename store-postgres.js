const { Pool } = require('pg');

let pool;

async function init() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      period TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(first_name, last_name, period)
    );

    CREATE TABLE IF NOT EXISTS brackets (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
      picks JSONB NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS actual_results (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      picks JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'mmm2026';
  if (!(await getSetting('admin_password'))) {
    await setSetting('admin_password', defaultAdminPassword);
  }
  if (!(await getSetting('submissions_open'))) {
    await setSetting('submissions_open', 'true');
  }
}

async function getSetting(key) {
  const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
  return rows[0]?.value ?? null;
}

async function setSetting(key, value) {
  await pool.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2`,
    [key, value]
  );
}

async function findStudent(firstName, lastName, period) {
  const { rows } = await pool.query(
    'SELECT id FROM students WHERE first_name = $1 AND last_name = $2 AND period = $3',
    [firstName, lastName, period]
  );
  return rows[0] || null;
}

async function updateBracket(studentId, picksJson) {
  const picks = JSON.parse(picksJson);
  await pool.query('UPDATE students SET updated_at = NOW() WHERE id = $1', [studentId]);
  await pool.query(
    'UPDATE brackets SET picks = $1, submitted_at = NOW() WHERE student_id = $2',
    [picks, studentId]
  );
}

async function createStudentWithBracket(firstName, lastName, period, picksJson) {
  const picks = JSON.parse(picksJson);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO students (first_name, last_name, period) VALUES ($1, $2, $3) RETURNING id',
      [firstName, lastName, period]
    );
    const studentId = rows[0].id;
    await client.query('INSERT INTO brackets (student_id, picks) VALUES ($1, $2)', [
      studentId,
      picks,
    ]);
    await client.query('COMMIT');
    return studentId;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function getBracketByStudentId(studentId) {
  const { rows } = await pool.query(
    `SELECT s.first_name, s.last_name, s.period, b.picks
     FROM students s
     JOIN brackets b ON b.student_id = s.id
     WHERE s.id = $1`,
    [studentId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    first_name: row.first_name,
    last_name: row.last_name,
    period: row.period,
    picks: typeof row.picks === 'string' ? row.picks : JSON.stringify(row.picks),
  };
}

async function getSubmissionCount() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM brackets');
  return rows[0].n;
}

async function getActualResults() {
  const { rows } = await pool.query('SELECT picks, updated_at FROM actual_results WHERE id = 1');
  const row = rows[0];
  if (!row) return null;
  return {
    picks: typeof row.picks === 'string' ? row.picks : JSON.stringify(row.picks),
    updated_at: row.updated_at,
  };
}

async function hasActualResults() {
  const { rows } = await pool.query('SELECT id FROM actual_results WHERE id = 1');
  return rows.length > 0;
}

async function saveActualResults(picksJson) {
  const picks = JSON.parse(picksJson);
  const { rows } = await pool.query('SELECT id FROM actual_results WHERE id = 1');
  if (rows.length) {
    await pool.query('UPDATE actual_results SET picks = $1, updated_at = NOW() WHERE id = 1', [picks]);
  } else {
    await pool.query('INSERT INTO actual_results (id, picks) VALUES (1, $1)', [picks]);
  }
}

function normalizePicks(row) {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    period: row.period,
    picks: typeof row.picks === 'string' ? row.picks : JSON.stringify(row.picks),
  };
}

async function getAllBrackets() {
  const { rows } = await pool.query(
    `SELECT s.id, s.first_name, s.last_name, s.period, b.picks
     FROM students s
     JOIN brackets b ON b.student_id = s.id
     ORDER BY s.last_name, s.first_name`
  );
  return rows.map(normalizePicks);
}

async function getAllBracketsForExport() {
  const { rows } = await pool.query(
    `SELECT s.first_name, s.last_name, s.period, b.picks
     FROM students s
     JOIN brackets b ON b.student_id = s.id`
  );
  return rows.map((row) => ({
    first_name: row.first_name,
    last_name: row.last_name,
    period: row.period,
    picks: typeof row.picks === 'string' ? row.picks : JSON.stringify(row.picks),
  }));
}

async function deleteStudent(id) {
  await pool.query('DELETE FROM students WHERE id = $1', [id]);
}

module.exports = {
  init,
  getSetting,
  setSetting,
  findStudent,
  updateBracket,
  createStudentWithBracket,
  getBracketByStudentId,
  getSubmissionCount,
  getActualResults,
  hasActualResults,
  saveActualResults,
  getAllBrackets,
  getAllBracketsForExport,
  deleteStudent,
  storageLabel: 'PostgreSQL (cloud)',
};
