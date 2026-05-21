/** Teacher admin leaderboard — filter, print, CSV, delete, reset */

let adminPassword = '';
let leaderboardData = null;
let gradeFilter = '';

const LS = window.LeaderboardShared;
const loginSection = document.getElementById('login-section');
const panel = document.getElementById('admin-leaderboard-panel');
const alertEl = document.getElementById('alert');
const tbody = document.getElementById('leaderboard-body');
const meta = document.getElementById('meta');
const csvBtn = document.getElementById('csvBtn');
const gradeFilterEl = document.getElementById('gradeFilter');
const leaderboardTitle = document.getElementById('leaderboard-title');

function showAlert(msg, type = 'error') {
  alertEl.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

function adminFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'X-Admin-Password': adminPassword,
    },
    body: options.body,
  });
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
    tbody.innerHTML = '<tr><td colspan="5">No submissions yet.</td></tr>';
    if (csvBtn) csvBtn.disabled = true;
    updateHeader();
    return;
  }

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5">No students in ${LS.escapeHtml(LS.leaderboardFilterLabel(gradeFilter))}.</td></tr>`;
    if (csvBtn) csvBtn.disabled = true;
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
      <td class="no-print col-actions">
        <button type="button" class="btn btn-danger btn-sm btn-delete-student" data-id="${row.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('.btn-delete-student').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.closest('tr')?.children[1]?.textContent?.trim() || 'this student';
      deleteStudent(btn.dataset.id, name);
    });
  });

  updateHeader();
  if (csvBtn) csvBtn.disabled = false;
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

async function deleteStudent(id, name) {
  if (!confirm(`Delete bracket for ${name}? This cannot be undone.`)) return;

  try {
    const res = await adminFetch(`/api/admin/student/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    showAlert(data.message || 'Student deleted.', 'success');
    await loadLeaderboard();
  } catch (e) {
    showAlert(e.message);
  }
}

async function resetLeaderboard() {
  const msg =
    'Reset the entire leaderboard?\n\n' +
    '• All student bracket submissions will be deleted\n' +
    '• All entered actual results will be cleared\n\n' +
    'This cannot be undone.';
  if (!confirm(msg)) return;

  try {
    const res = await adminFetch('/api/admin/leaderboard/reset', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset failed');
    showAlert(data.message || 'Leaderboard reset.', 'success');
    await loadLeaderboard();
  } catch (e) {
    showAlert(e.message);
  }
}

document.getElementById('loginBtn')?.addEventListener('click', async () => {
  adminPassword = document.getElementById('adminPassword').value;
  try {
    const res = await adminFetch('/api/admin/stats');
    if (!res.ok) throw new Error('Invalid password');
    loginSection.style.display = 'none';
    panel.style.display = 'block';
    await loadLeaderboard();
  } catch {
    showAlert('Invalid admin password.');
  }
});

document.getElementById('refreshBtn')?.addEventListener('click', loadLeaderboard);
document.getElementById('csvBtn')?.addEventListener('click', () => {
  const rows = LS.getFilteredLeaderboardRows(leaderboardData, gradeFilter);
  LS.downloadLeaderboardCsv(rows, gradeFilter);
});
document.getElementById('printBtn')?.addEventListener('click', () => window.print());
document.getElementById('resetLeaderboardBtn')?.addEventListener('click', resetLeaderboard);
gradeFilterEl?.addEventListener('change', () => {
  gradeFilter = gradeFilterEl.value;
  renderTable();
});
