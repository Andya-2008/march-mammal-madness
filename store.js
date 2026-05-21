/** Uses PostgreSQL when DATABASE_URL is set (required for cloud hosting). */
if (process.env.DATABASE_URL) {
  module.exports = require('./store-postgres');
} else {
  try {
    module.exports = require('./store-sqlite');
  } catch (err) {
    console.error(
      'DATABASE_URL is not set and better-sqlite3 is not installed.\n' +
        'For cloud hosting: set DATABASE_URL (see DEPLOY.md).\n' +
        'For local dev: run npm install (includes devDependencies).'
    );
    throw err;
  }
}
