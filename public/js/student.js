const picks = {};
let bracketData = null;

const alertEl = document.getElementById('alert');
const container = document.getElementById('bracket-container');
const submitBtn = document.getElementById('submitBtn');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const footerStatus = document.getElementById('footerStatus');

function showAlert(msg, type = 'error') {
  alertEl.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      group.appendChild(
        BracketUI.renderMatchCard(m, picks, bracketData.teams, onPick)
      );
    }
    section.appendChild(group);
  }

  return section;
}

function renderBracket() {
  container.innerHTML = '';
  const { matches, teams, divisions } = bracketData;
  const groups = BracketUI.groupMatchesByDivision(matches);

  const wcSection = document.createElement('section');
  wcSection.className = 'card';
  wcSection.innerHTML = '<h2>Wild Card</h2>';
  for (const m of groups.wildcard) {
    wcSection.appendChild(BracketUI.renderMatchCard(m, picks, teams, onPick));
  }
  container.appendChild(wcSection);

  for (const key of ['mc', 'qss', 'wna', 'wnb']) {
    container.appendChild(
      renderDivision(key, divisions[key].name, key, groups[key])
    );
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
  const allPicked = done === total && Object.keys(picks).length >= total;

  progressFill.style.width = `${(done / total) * 100}%`;
  progressText.textContent = `${Object.keys(picks).filter((k) => picks[k]).length} of ${total} matches picked`;

  submitBtn.disabled = !allPicked;
  footerStatus.textContent = allPicked
    ? 'Ready to submit!'
    : `Pick winners for all unlocked matches (${done}/${total} ready)`;
}

async function init() {
  const [bracketRes, settingsRes] = await Promise.all([
    fetch('/api/bracket'),
    fetch('/api/settings'),
  ]);

  bracketData = await bracketRes.json();
  const settings = await settingsRes.json();

  if (!settings.submissionsOpen) {
    document.getElementById('closed-banner').style.display = 'block';
    submitBtn.disabled = true;
  }

  renderBracket();

  submitBtn.addEventListener('click', async () => {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const period = document.getElementById('period').value.trim();

    if (!firstName || !lastName) {
      showAlert('Please enter your first and last name.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      const res = await fetch('/api/bracket/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, period, picks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      showAlert(
        data.updated
          ? 'Your bracket was updated successfully!'
          : 'Your bracket was submitted successfully!',
        'success'
      );
    } catch (e) {
      showAlert(e.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Bracket';
    }
  });
}

init();
