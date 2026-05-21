const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      period TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(first_name, last_name, period)
    );

    CREATE TABLE IF NOT EXISTS brackets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
      picks TEXT NOT NULL,
      submitted_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS actual_results (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      picks TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

async function init() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  db = new Database(path.join(dataDir, 'mmm.db'));
  db.pragma('journal_mode = WAL');
  initSchema();

  const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'mmm2026';
  if (!getSettingSync('admin_password')) {
    setSettingSync('admin_password', defaultAdminPassword);
  }
  if (!getSettingSync('submissions_open')) {
    setSettingSync('submissions_open', 'true');
  }
}

function getSettingSync(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSettingSync(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

async function getSetting(key) {
  return getSettingSync(key);
}

async function setSetting(key, value) {
  setSettingSync(key, value);
}

async function findStudent(firstName, lastName, period) {
  return db
    .prepare('SELECT id FROM students WHERE first_name = ? AND last_name = ? AND period = ?')
    .get(firstName, lastName, period);
}

async function updateBracket(studentId, picksJson) {
  db.prepare('UPDATE students SET updated_at = datetime("now") WHERE id = ?').run(studentId);
  db.prepare('UPDATE brackets SET picks = ?, submitted_at = datetime("now") WHERE student_id = ?').run(
    picksJson,
    studentId
  );
}

async function createStudentWithBracket(firstName, lastName, period, picksJson) {
  const info = db
    .prepare('INSERT INTO students (first_name, last_name, period) VALUES (?, ?, ?)')
    .run(firstName, lastName, period);
  db.prepare('INSERT INTO brackets (student_id, picks) VALUES (?, ?)').run(info.lastInsertRowid, picksJson);
  return info.lastInsertRowid;
}

async function getBracketByStudentId(studentId) {
  return db
    .prepare(
      `SELECT s.first_name, s.last_name, s.period, b.picks
       FROM students s
       JOIN brackets b ON b.student_id = s.id
       WHERE s.id = ?`
    )
    .get(studentId);
}

async function getSubmissionCount() {
  return db.prepare('SELECT COUNT(*) as n FROM brackets').get().n;
}

async function getActualResults() {
  return db.prepare('SELECT picks, updated_at FROM actual_results WHERE id = 1').get();
}

async function hasActualResults() {
  return !!db.prepare('SELECT id FROM actual_results WHERE id = 1').get();
}

async function saveActualResults(picksJson) {
  const existing = db.prepare('SELECT id FROM actual_results WHERE id = 1').get();
  if (existing) {
    db.prepare('UPDATE actual_results SET picks = ?, updated_at = datetime("now") WHERE id = 1').run(picksJson);
  } else {
    db.prepare('INSERT INTO actual_results (id, picks) VALUES (1, ?)').run(picksJson);
  }
}

async function getAllBrackets() {
  return db
    .prepare(
      `SELECT s.id, s.first_name, s.last_name, s.period, b.picks
       FROM students s
       JOIN brackets b ON b.student_id = s.id
       ORDER BY s.last_name, s.first_name`
    )
    .all();
}

async function getAllBracketsForExport() {
  return db
    .prepare(
      `SELECT s.first_name, s.last_name, s.period, b.picks
       FROM students s
       JOIN brackets b ON b.student_id = s.id`
    )
    .all();
}

async function deleteStudent(id) {
  db.prepare('DELETE FROM students WHERE id = ?').run(id);
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
  storageLabel: 'SQLite (local)',
};
