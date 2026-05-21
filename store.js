/** Cloud database (PostgreSQL via Neon). DATABASE_URL is required. */
if (!process.env.DATABASE_URL) {
  console.error(
    'Missing DATABASE_URL. Add your Neon connection string in Render → Environment.'
  );
  process.exit(1);
}

module.exports = require('./store-postgres');
