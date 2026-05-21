let leaderboardData = null;
let gradeFilter = '';

function formatLeaderboardDate(d = new Date()) {
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

function studentGrade(row) {
  return (row.period || row.grade || '').trim();
}

function filterLabel() {
  if (!gradeFilter) return 'Everyone';
  if (gradeFilter === 'Staff') return 'Staff';
  return `Grade ${gradeFilter}`;
}

function applyGradeFilter(rows) {
  if (!gradeFilter) return rows;
  return rows.filter((r) => studentGrade(r) === gradeFilter);
}

function rerankFiltered(rows) {
  const sorted = [...rows].sort(
    (a, b) => b.score - a.score || (a.lastName || '').localeCompare(b.lastName || '')
  );
  let rank = 0;
  let prevScore = null;
  return sorted.map((entry, i) => {
    if (entry.score !== prevScore) {
      rank = i + 1;
      prevScore = entry.score;
    }
    return { ...entry, rank };
  });
}

function getFilteredRows() {
  if (!leaderboardData?.leaderboard) return [];
  return rerankFiltered(applyGradeFilter(leaderboardData.leaderboard));
}

const alertEl = document.getElementById('alert');
const tbody = document.getElementById('leaderboard-body');
const meta = document.getElementById('meta');
const csvBtn = document.getElementById('csvBtn');
const gradeFilterEl = document.getElementById('gradeFilter');
const leaderboardTitle = document.getElementById('leaderboard-title');

function showAlert(msg, type = 'error') {
  alertEl.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function updateHeader() {
  const label = filterLabel();
  leaderboardTitle.textContent = gradeFilter ? `Leaderboard — ${label}` : 'Leaderboard';
  meta.textContent = `${formatLeaderboardDate()} · ${label}`;
}

function renderTable() {
  const rows = getFilteredRows();
  tbody.innerHTML = '';

  if (!leaderboardData?.leaderboard?.length) {
    tbody.innerHTML = '<tr><td colspan="4">No submissions yet.</td></tr>';
    if (csvBtn) csvBtn.disabled = true;
    updateHeader();
    return;
  }

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4">No students in ${escapeHtml(filterLabel())}.</td></tr>`;
    if (csvBtn) csvBtn.disabled = true;
    updateHeader();
    return;
  }

  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="rank-badge">${row.rank}</span></td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(studentGrade(row) || '—')}</td>
      <td><strong>${row.score}</strong></td>
    `;
    tbody.appendChild(tr);
  }

  updateHeader();
  if (csvBtn) csvBtn.disabled = false;
}

function downloadCsv() {
  const rows = getFilteredRows();
  if (!rows.length) return;

  const slug = gradeFilter ? `-${gradeFilter.toLowerCase()}` : '';
  const lines = [
    ['Rank', 'Name', 'Grade', 'Score'].map(csvCell).join(','),
    ...rows.map((r) =>
      [r.rank, r.name, studentGrade(r), r.score].map(csvCell).join(',')
    ),
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leaderboard${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadLeaderboard() {
  if (csvBtn) csvBtn.disabled = true;
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    leaderboardData = data;
    renderTable();
    alertEl.innerHTML = '';
  } catch (e) {
    leaderboardData = null;
    showAlert(e.message);
    tbody.innerHTML = '';
  }
}

document.getElementById('refreshBtn').addEventListener('click', loadLeaderboard);
csvBtn?.addEventListener('click', downloadCsv);
gradeFilterEl?.addEventListener('change', () => {
  gradeFilter = gradeFilterEl.value;
  renderTable();
});

loadLeaderboard();
