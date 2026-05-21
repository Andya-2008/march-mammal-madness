let adminPassword = '';
let bracketData = null;
const actualPicks = {};

const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const alertEl = document.getElementById('alert');
const container = document.getElementById('admin-bracket');
const visualHost = document.getElementById('visual-bracket-admin');
const configHost = document.getElementById('config-editor-host');

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

function divisionKeys() {
  return bracketData?.divisionOrder || ['mc', 'qss', 'wna', 'wnb'];
}

async function reloadBracketData() {
  const bracketRes = await fetch('/api/bracket');
  bracketData = await bracketRes.json();
}

function onActualPick(matchId, teamId) {
  actualPicks[matchId] = teamId;
  BracketUI.clearDownstreamPicks(matchId, actualPicks, bracketData.matches);
  renderAllAdminViews();
}

function renderAllAdminViews() {
  renderAdminBracket();
  renderAdminVisual();
}

function renderAdminVisual() {
  if (!visualHost || !bracketData) return;
  BracketVisual.render(visualHost, bracketData, actualPicks, {
    heading: 'Actual Results — click winners',
    onPick: onActualPick,
  });
  const entered = Object.keys(actualPicks).filter((k) => actualPicks[k]).length;
  const el = document.getElementById('adminProgress');
  if (el) el.textContent = `${entered} of ${bracketData.matches.length} results entered`;
}

function renderAdminBracket() {
  container.innerHTML = '';
  const { matches, teams, divisions } = bracketData;
  const groups = BracketUI.groupMatchesByDivision(matches);

  function addSection(title, matchList) {
    const card = document.createElement('section');
    card.className = 'card';
    card.innerHTML = `<h2>${title}</h2>`;
    for (const m of matchList) {
      card.appendChild(BracketUI.renderMatchCard(m, actualPicks, teams, onActualPick));
    }
    container.appendChild(card);
  }

  addSection('Wild Card', groups.wildcard);
  for (const key of divisionKeys()) {
    if (divisions[key]) addSection(divisions[key].name, groups[key] || []);
  }
  addSection('Final Four & Championship', groups.finals);

  renderAdminVisual();
}

async function loadStats() {
  const res = await adminFetch('/api/admin/stats');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  document.getElementById('statsText').textContent =
    `${data.submissionCount} student brackets submitted · Submissions ${data.submissionsOpen ? 'OPEN' : 'CLOSED'}`;

  document.getElementById('toggleSubmissionsBtn').textContent = data.submissionsOpen
    ? 'Close Submissions'
    : 'Open Submissions';

  if (data.actualResults) {
    Object.assign(actualPicks, data.actualResults);
  }
}

function setupTabs() {
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isSetup = tab.dataset.tab === 'setup';
      document.getElementById('tab-setup').style.display = isSetup ? 'block' : 'none';
      document.getElementById('tab-results').style.display = isSetup ? 'none' : 'block';
    });
  });
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  adminPassword = document.getElementById('adminPassword').value;
  try {
    const res = await adminFetch('/api/admin/stats');
    if (!res.ok) {
      showAlert('Incorrect password.');
      return;
    }
    loginSection.style.display = 'none';
    adminPanel.style.display = 'block';
    setupTabs();

    await reloadBracketData();
    await loadStats();
    renderAllAdminViews();

    await AdminConfig.loadEditor(adminFetch, configHost, async () => {
      await reloadBracketData();
      renderAllAdminViews();
      showAlert('Tournament updated.', 'success');
    });
  } catch (e) {
    showAlert(e.message);
  }
});

document.getElementById('toggleSubmissionsBtn').addEventListener('click', async () => {
  const statsRes = await adminFetch('/api/admin/stats');
  const stats = await statsRes.json();
  const res = await adminFetch('/api/admin/submissions', {
    method: 'POST',
    body: JSON.stringify({ open: !stats.submissionsOpen }),
  });
  if (res.ok) {
    await loadStats();
    showAlert('Submission status updated.', 'success');
  }
});

document.getElementById('saveResultsBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveResultsBtn');
  btn.disabled = true;
  try {
    const res = await adminFetch('/api/admin/actual', {
      method: 'POST',
      body: JSON.stringify({ picks: actualPicks }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showAlert(`Saved ${data.matchCount} match results. Leaderboard will update.`, 'success');
    renderAllAdminViews();
  } catch (e) {
    showAlert(e.message);
  } finally {
    btn.disabled = false;
  }
});
