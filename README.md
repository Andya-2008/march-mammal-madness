# March Mammal Madness — Classroom Bracket Pool

Web app for classrooms (~400 students) to submit March Mammal Madness bracket predictions, with teacher admin for real winners, automatic scoring, and PDF leaderboard export.

## For your teacher (online hosting)

**Do not run this only on a classroom computer** — students need a public link.

Follow **[DEPLOY.md](DEPLOY.md)** to deploy free on **Render + Neon** (~30 min, $0).

If you own **frogcoo.com**, use a subdomain like `https://mmm.frogcoo.com` — see the **frogcoo.com** section in DEPLOY.md (WordPress stays on the main site).

## Pages

| Page | Path |
|------|------|
| Student brackets | `/` |
| Teacher admin | `/admin.html` |
| Leaderboard + PDF | `/leaderboard.html` |

## Scoring (max 138 points)

Wild Card: 1 · Round 1: 1 each · Sweet 16: 2 · Elite Trait: 3 · Final Roar: 5 · Semifinals: 8 · Champion: 13

## Local development (optional)

Requires a Postgres database (use the same free Neon URL as production):

```powershell
$env:DATABASE_URL="postgresql://..."
$env:ADMIN_PASSWORD="mmm2026"
npm install
npm start
```

Without `DATABASE_URL`, `npm install` installs SQLite for offline testing only.

## Updating teams for a new year

Edit `data/bracket.js` with the new year's matchups.
