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

function showAlert(msg, type = 'error') {
  alertEl.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

function renderTable(data) {
  tbody.innerHTML = '';
  if (!data.leaderboard.length) {
    tbody.innerHTML = '<tr><td colspan="4">No submissions yet.</td></tr>';
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
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function loadLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    renderTable(data);
    alertEl.innerHTML = '';
  } catch (e) {
    showAlert(e.message);
    tbody.innerHTML = '';
  }
}

document.getElementById('refreshBtn').addEventListener('click', loadLeaderboard);

loadLeaderboard();
