const picks = {};
let bracketData = null;

const alertEl = document.getElementById('alert');
const container = document.getElementById('bracket-container');
const visualHost = document.getElementById('visual-bracket');
const submitBtn = document.getElementById('submitBtn');
const randomTestBtn = document.getElementById('randomTestBtn');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const footerStatus = document.getElementById('footerStatus');

function showAlert(msg, type = 'error') {
  alertEl.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function divisionKeys() {
  return bracketData?.divisionOrder || ['mc', 'qss', 'wna', 'wnb'];
}

function onPick(matchId, teamId) {
  picks[matchId] = teamId;
  BracketUI.clearDownstreamPicks(matchId, picks, bracketData.matches);
  renderBracket();
}

function renderDivision(divKey, divName, cssClass, matchList) {
  const section = document.createElement('section');
  section.className = 'division-section';

  const header = document.createElement('div');
  header.className = `division-header ${cssClass}`;
  header.textContent = divName;
  section.appendChild(header);

  const rounds = {};
  for (const m of matchList) {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  }

  const roundLabels = {
    r1: 'Round 1',
    r2: 'Sweet 16',
    r3: 'Elite Trait',
    r4: 'Final Roar',
  };

  for (const [round, matches] of Object.entries(rounds)) {
    const group = document.createElement('div');
    group.className = 'round-group';
    const label = document.createElement('div');
    label.className = 'round-label';
    label.textContent = roundLabels[round] || round;
    group.appendChild(label);

    for (const m of matches) {
      group.appendChild(BracketUI.renderMatchCard(m, picks, bracketData.teams, onPick));
    }
    section.appendChild(group);
  }

  return section;
}

function renderBracket() {
  container.innerHTML = '';
  const { matches, teams, divisions, roundPoints, maxScore } = bracketData;
  const groups = BracketUI.groupMatchesByDivision(matches);

  const wcSection = document.createElement('section');
  wcSection.className = 'card';
  wcSection.innerHTML = '<h2>Wild Card</h2>';
  for (const m of groups.wildcard) {
    wcSection.appendChild(BracketUI.renderMatchCard(m, picks, teams, onPick));
  }
  if (groups.wildcard.length) container.appendChild(wcSection);

  for (const key of divisionKeys()) {
    if (divisions[key]) {
      container.appendChild(
        renderDivision(key, divisions[key].name, key, groups[key] || [])
      );
    }
  }

  const finalsSection = document.createElement('section');
  finalsSection.className = 'card';
  finalsSection.innerHTML = '<h2>Final Four & Championship</h2>';
  for (const m of groups.finals) {
    finalsSection.appendChild(BracketUI.renderMatchCard(m, picks, teams, onPick));
  }
  container.appendChild(finalsSection);

  const total = matches.length;
  const done = BracketUI.countCompletedPicks(picks, matches, teams);
  const pickedCount = Object.keys(picks).filter((k) => picks[k]).length;
  const allPicked = pickedCount >= total && done === total;

  progressFill.style.width = `${(pickedCount / total) * 100}%`;
  progressText.textContent = `${pickedCount} of ${total} matches picked`;

  submitBtn.disabled = !allPicked;
  footerStatus.textContent = allPicked
    ? 'Ready to submit!'
    : `Pick winners for all unlocked matches (${pickedCount}/${total})`;

  renderVisualBracket();
}

function renderVisualBracket() {
  if (!visualHost) return;
  try {
    if (typeof BracketVisual === 'undefined') {
      visualHost.innerHTML =
        '<div class="alert alert-error">Bracket viewer did not load. Press Ctrl+F5 to hard refresh.</div>';
      return;
    }
    BracketVisual.render(visualHost, bracketData, picks);
    if (!visualHost.querySelector('.mmm-sheet')) {
      visualHost.innerHTML =
        '<div class="alert alert-error">Could not draw bracket. Check the browser console or try refreshing.</div>';
    }
  } catch (err) {
    console.error('BracketVisual error:', err);
    visualHost.innerHTML = `<div class="alert alert-error">Bracket error: ${err.message}</div>`;
  }
}

function getMatchPickOrder(data) {
  const order = [];
  const divs = data.divisionOrder || ['mc', 'qss', 'wna', 'wnb'];
  const ids = new Set(data.matches.map((m) => m.id));

  if (data.wildcard?.enabled) order.push('wildcard');
  for (const div of divs) {
    for (let i = 0; i < 8; i++) order.push(`r1-${div}-${i}`);
  }
  for (const div of divs) {
    for (let i = 0; i < 4; i++) order.push(`r2-${div}-${i}`);
  }
  for (const div of divs) {
    for (let i = 0; i < 2; i++) order.push(`r3-${div}-${i}`);
  }
  for (const div of divs) order.push(`r4-${div}-0`);
  order.push('r5-left', 'r5-right', 'championship');
  return order.filter((id) => ids.has(id));
}

function fillRandomPicks() {
  for (const key of Object.keys(picks)) delete picks[key];
  const { matches, teams } = bracketData;

  for (const matchId of getMatchPickOrder(bracketData)) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) continue;
    const participants = BracketUI.resolveParticipantsClient(match, picks, teams);
    if (!participants || participants.length !== 2) continue;
    picks[matchId] = participants[Math.floor(Math.random() * 2)];
  }
}

function nextTestStudentName() {
  const n = parseInt(localStorage.getItem('mmm_test_num') || '0', 10) + 1;
  localStorage.setItem('mmm_test_num', String(n));
  return `test${n}`;
}

async function submitBracket(firstName, lastName, grade) {
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';
  if (randomTestBtn) randomTestBtn.disabled = true;

  try {
    const res = await fetch('/api/bracket/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, grade, picks }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Submission failed');

    showAlert(
      data.updated
        ? `Bracket updated for ${firstName} ${lastName}!`
        : `Bracket submitted for ${firstName} ${lastName}!`,
      'success'
    );
    return true;
  } catch (e) {
    showAlert(e.message);
    return false;
  } finally {
    submitBtn.textContent = 'Submit Bracket';
    if (randomTestBtn) randomTestBtn.disabled = false;
    renderBracket();
  }
}

function formatScoring(roundPoints, maxScore) {
  const rp = roundPoints || {};
  return `Wild Card: ${rp.wildcard ?? 1} pt · Round 1: ${rp.r1 ?? 1} each · Sweet 16: ${rp.r2 ?? 2} · Elite Trait: ${rp.r3 ?? 3} · Final Roar: ${rp.r4 ?? 5} · Semifinals: ${rp.r5 ?? 8} · Champion: ${rp.championship ?? 13} (max ${maxScore})`;
}

async function init() {
  const [bracketRes, settingsRes] = await Promise.all([
    fetch('/api/bracket'),
    fetch('/api/settings'),
  ]);

  bracketData = await bracketRes.json();
  const settings = await settingsRes.json();

  if (bracketData.title) {
    document.querySelector('header h1').textContent = bracketData.title;
  }
  const sub = document.getElementById('header-subtitle');
  if (sub) {
    sub.textContent = bracketData.subtitle || 'Submit your bracket predictions';
  }
  const scoringTitle = document.getElementById('scoring-title');
  if (scoringTitle) {
    scoringTitle.textContent = `Scoring (max ${bracketData.maxScore} points)`;
  }
  const scoringP = document.getElementById('scoring-detail');
  if (scoringP && bracketData.roundPoints) {
    scoringP.textContent = formatScoring(bracketData.roundPoints, bracketData.maxScore);
  }

  if (!settings.submissionsOpen) {
    document.getElementById('closed-banner').style.display = 'block';
    submitBtn.disabled = true;
    if (randomTestBtn) randomTestBtn.disabled = true;
  }

  renderBracket();

  submitBtn.addEventListener('click', async () => {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const grade = document.getElementById('grade').value;
    if (!grade) {
      showAlert('Please select your grade.');
      return;
    }

    if (!firstName || !lastName) {
      showAlert('Please enter your first and last name.');
      return;
    }

    await submitBracket(firstName, lastName, grade);
  });

  randomTestBtn?.addEventListener('click', async () => {
    if (!bracketData) return;

    fillRandomPicks();
    renderBracket();

    const testName = nextTestStudentName();
    document.getElementById('firstName').value = testName;
    document.getElementById('lastName').value = 'Test';
    if (!document.getElementById('grade').value) {
      document.getElementById('grade').value = 'Staff';
    }

    const total = bracketData.matches.length;
    const done = BracketUI.countCompletedPicks(picks, bracketData.matches, bracketData.teams);
    if (done < total) {
      showAlert(`Could only fill ${done} of ${total} matches. Check that the tournament is fully set up.`);
      return;
    }

    await submitBracket(testName, 'Test', document.getElementById('grade').value);
  });
}

init();
