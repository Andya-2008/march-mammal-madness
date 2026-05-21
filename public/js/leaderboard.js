let leaderboardData = null;

function formatLeaderboardDate(d = new Date()) {
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

const alertEl = document.getElementById('alert');
const tbody = document.getElementById('leaderboard-body');
const meta = document.getElementById('meta');
const csvBtn = document.getElementById('csvBtn');

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

function renderTable(data) {
  tbody.innerHTML = '';
  if (!data.leaderboard.length) {
    tbody.innerHTML = '<tr><td colspan="4">No submissions yet.</td></tr>';
    if (csvBtn) csvBtn.disabled = true;
    return;
  }

  for (const row of data.leaderboard) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="rank-badge">${row.rank}</span></td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.period || row.grade || '—')}</td>
      <td><strong>${row.score}</strong></td>
    `;
    tbody.appendChild(tr);
  }

  meta.textContent = formatLeaderboardDate();
  if (csvBtn) csvBtn.disabled = false;
}

function downloadCsv() {
  if (!leaderboardData?.leaderboard?.length) return;

  const lines = [
    ['Rank', 'Name', 'Grade', 'Score'].map(csvCell).join(','),
    ...leaderboardData.leaderboard.map((r) =>
      [r.rank, r.name, r.period || r.grade || '', r.score].map(csvCell).join(',')
    ),
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leaderboard-${new Date().toISOString().slice(0, 10)}.csv`;
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
    renderTable(data);
    alertEl.innerHTML = '';
  } catch (e) {
    leaderboardData = null;
    showAlert(e.message);
    tbody.innerHTML = '';
  }
}

document.getElementById('refreshBtn').addEventListener('click', loadLeaderboard);
csvBtn?.addEventListener('click', downloadCsv);

loadLeaderboard();
