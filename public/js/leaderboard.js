/** Student / public leaderboard — filter and live table only */

let leaderboardData = null;
let gradeFilter = '';
let refreshTimer = null;

const LS = window.LeaderboardShared;
const alertEl = document.getElementById('alert');
const tbody = document.getElementById('leaderboard-body');
const meta = document.getElementById('meta');
const gradeFilterEl = document.getElementById('gradeFilter');
const leaderboardTitle = document.getElementById('leaderboard-title');
const AUTO_REFRESH_MS = 30000;

function showAlert(msg, type = 'error') {
  alertEl.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

function updateHeader() {
  const label = LS.leaderboardFilterLabel(gradeFilter);
  leaderboardTitle.textContent = gradeFilter ? `Leaderboard — ${label}` : 'Leaderboard';
  meta.textContent = `${LS.formatLeaderboardDate()} · ${label}`;
}

function renderTable() {
  const rows = LS.getFilteredLeaderboardRows(leaderboardData, gradeFilter);
  tbody.innerHTML = '';

  if (!leaderboardData?.leaderboard?.length) {
    tbody.innerHTML = '<tr><td colspan="4">No submissions yet.</td></tr>';
    updateHeader();
    return;
  }

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4">No students in ${LS.escapeHtml(LS.leaderboardFilterLabel(gradeFilter))}.</td></tr>`;
    updateHeader();
    return;
  }

  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="rank-badge">${row.rank}</span></td>
      <td>${LS.escapeHtml(row.name)}</td>
      <td>${LS.escapeHtml(LS.studentGrade(row) || '—')}</td>
      <td><strong>${row.score}</strong></td>
    `;
    tbody.appendChild(tr);
  }

  updateHeader();
}

async function loadLeaderboard() {
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

gradeFilterEl?.addEventListener('change', () => {
  gradeFilter = gradeFilterEl.value;
  renderTable();
});

loadLeaderboard();
refreshTimer = setInterval(loadLeaderboard, AUTO_REFRESH_MS);
