const express = require('express');
const path = require('path');
const store = require('./store');
const {
  TEAMS,
  DIVISIONS,
  MATCHES,
  MATCH_BY_ID,
  ROUND_POINTS,
  MAX_SCORE,
  calculateScore,
  validatePicks,
} = require('./data/bracket');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function checkAdmin(req) {
  const password = req.headers['x-admin-password'] || req.body?.adminPassword;
  const stored = await store.getSetting('admin_password');
  return password && password === stored;
}

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, storage: store.storageLabel });
});

app.get('/api/bracket', (_req, res) => {
  res.json({
    teams: TEAMS,
    divisions: DIVISIONS,
    matches: MATCHES,
    roundPoints: ROUND_POINTS,
    maxScore: MAX_SCORE,
  });
});

app.get('/api/settings', async (_req, res) => {
  const submissionsOpen = (await store.getSetting('submissions_open')) === 'true';
  res.json({
    submissionsOpen,
    hasActualResults: await store.hasActualResults(),
  });
});

app.post('/api/bracket/submit', async (req, res) => {
  try {
    if ((await store.getSetting('submissions_open')) !== 'true') {
      return res.status(403).json({ error: 'Submissions are closed.' });
    }

    const { firstName, lastName, period, picks } = req.body;
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: 'First and last name are required.' });
    }

    const cleanPicks = { ...picks };
    const errors = validatePicks(cleanPicks);
    if (errors.length) {
      return res.status(400).json({ error: errors[0], errors });
    }

    const first = firstName.trim();
    const last = lastName.trim();
    const per = period?.trim() || '';
    const picksJson = JSON.stringify(cleanPicks);

    const student = await store.findStudent(first, last, per);
    if (student) {
      await store.updateBracket(student.id, picksJson);
      return res.json({
        message: 'Bracket updated successfully.',
        studentId: student.id,
        updated: true,
      });
    }

    const studentId = await store.createStudentWithBracket(first, last, per, picksJson);
    res.json({
      message: 'Bracket submitted successfully.',
      studentId,
      updated: false,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not save bracket. Please try again.' });
  }
});

app.get('/api/bracket/:studentId', async (req, res) => {
  const row = await store.getBracketByStudentId(req.params.studentId);
  if (!row) return res.status(404).json({ error: 'Bracket not found.' });
  res.json({
    firstName: row.first_name,
    lastName: row.last_name,
    period: row.period,
    picks: JSON.parse(row.picks),
  });
});

app.get('/api/admin/stats', async (req, res) => {
  if (!(await checkAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

  const count = await store.getSubmissionCount();
  const actual = await store.getActualResults();

  res.json({
    submissionCount: count,
    actualResults: actual ? JSON.parse(actual.picks) : null,
    actualUpdatedAt: actual?.updated_at || null,
    submissionsOpen: (await store.getSetting('submissions_open')) === 'true',
  });
});

app.post('/api/admin/actual', async (req, res) => {
  if (!(await checkAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

  const { picks } = req.body;
  const cleanPicks = { ...picks };

  for (const matchId of Object.keys(cleanPicks)) {
    if (!MATCH_BY_ID[matchId]) delete cleanPicks[matchId];
  }

  await store.saveActualResults(JSON.stringify(cleanPicks));
  res.json({ message: 'Actual results saved.', matchCount: Object.keys(cleanPicks).length });
});

app.post('/api/admin/submissions', async (req, res) => {
  if (!(await checkAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });
  const open = !!req.body.open;
  await store.setSetting('submissions_open', open ? 'true' : 'false');
  res.json({ submissionsOpen: open });
});

app.get('/api/leaderboard', async (_req, res) => {
  const actualRow = await store.getActualResults();
  if (!actualRow) {
    return res.status(400).json({ error: 'Actual results have not been entered yet.' });
  }

  const actualPicks = JSON.parse(actualRow.picks);
  const rows = await store.getAllBrackets();

  const leaderboard = rows.map((row) => {
    const studentPicks = JSON.parse(row.picks);
    const { score } = calculateScore(studentPicks, actualPicks);
    return {
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      firstName: row.first_name,
      lastName: row.last_name,
      period: row.period,
      score,
      maxScore: MAX_SCORE,
    };
  });

  leaderboard.sort((a, b) => b.score - a.score || a.lastName.localeCompare(b.lastName));

  let rank = 0;
  let prevScore = null;
  leaderboard.forEach((entry, i) => {
    if (entry.score !== prevScore) {
      rank = i + 1;
      prevScore = entry.score;
    }
    entry.rank = rank;
  });

  res.json({ leaderboard, maxScore: MAX_SCORE, studentCount: leaderboard.length });
});

app.get('/api/admin/export', async (req, res) => {
  if (!(await checkAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

  const actualRow = await store.getActualResults();
  const rows = await store.getAllBracketsForExport();
  const actualPicks = actualRow ? JSON.parse(actualRow.picks) : {};

  const data = rows.map((row) => {
    const picks = JSON.parse(row.picks);
    const { score } = calculateScore(picks, actualPicks);
    return {
      firstName: row.first_name,
      lastName: row.last_name,
      period: row.period,
      score,
    };
  });

  data.sort((a, b) => b.score - a.score);
  res.json({ students: data, maxScore: MAX_SCORE });
});

app.delete('/api/admin/student/:id', async (req, res) => {
  if (!(await checkAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });
  await store.deleteStudent(req.params.id);
  res.json({ message: 'Student deleted.' });
});

store
  .init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`March Mammal Madness running on port ${PORT}`);
      console.log(`  Storage: ${store.storageLabel}`);
      console.log(`  Student bracket: /`);
      console.log(`  Admin panel:     /admin.html`);
      console.log(`  Leaderboard:     /leaderboard.html`);
      if (!process.env.DATABASE_URL) {
        console.log('  Tip: Set DATABASE_URL for cloud hosting (see DEPLOY.md)');
      }
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
