/** Classic March Mammal Madness bracket (print-style tree) */

function wc() {
  return window.BracketUI?.WC || '__wild_card_winner__';
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function teamDisplay(teamId, teams, picks) {
  if (teamId === wc()) {
    const w = picks?.wildcard;
    if (w && teams[w]) return { name: teams[w].name, seed: 'WC', id: w };
    return { name: 'Wild Card Winner', seed: '—', id: null };
  }
  const t = teams[teamId];
  if (!t) return { name: 'TBD', seed: '—', id: null };
  return { name: t.name, seed: t.seed ?? '—', id: teamId };
}

function slotForMatch(match, slot, picks, teams) {
  const tid = slot === 'team1' ? match.team1 : match.team2;
  const WC = wc();
  if (tid && tid !== WC) return teamDisplay(tid, teams, picks);
  if (tid === WC) return teamDisplay(WC, teams, picks);
  if (match.requires) {
    const idx = slot === 'team1' ? 0 : 1;
    const feederId = match.requires[idx];
    const w = picks?.[feederId];
    if (w && teams[w]) return teamDisplay(w, teams, picks);
  }
  return { name: 'TBD', seed: '—', id: null };
}

function teamLine(team, isWinner, matchId) {
  const gBtn = window.GoogleSearch?.googleSearchButton(team.name) || '';
  return `
    <div class="mmm-line ${isWinner ? 'mmm-winner' : ''}" data-match-id="${matchId || ''}">
      <span class="mmm-seed">${escapeHtml(String(team.seed))}</span>
      <span class="mmm-name">${escapeHtml(team.name)}</span>
      ${gBtn}
    </div>`;
}

function matchPairHtml(match, picks, teams) {
  const t1 = slotForMatch(match, 'team1', picks, teams);
  const t2 = slotForMatch(match, 'team2', picks, teams);
  const w = picks[match.id];
  return `
    <div class="mmm-pair" data-match-id="${match.id}">
      ${teamLine(t1, w && t1.id === w, match.id)}
      ${teamLine(t2, w && t2.id === w, match.id)}
    </div>`;
}

function getRoundMatches(matches, divKey, round) {
  return matches
    .filter((m) => m.division === divKey && m.round === round)
    .sort((a, b) => {
      const ai = parseInt(a.id.split('-').pop(), 10);
      const bi = parseInt(b.id.split('-').pop(), 10);
      return ai - bi;
    });
}

function renderRegionColumn(matches, divKey, picks, teams, side) {
  const r1 = getRoundMatches(matches, divKey, 'r1');
  const r2 = getRoundMatches(matches, divKey, 'r2');
  const r3 = getRoundMatches(matches, divKey, 'r3');
  const r4 = getRoundMatches(matches, divKey, 'r4');

  const round = (label, list, rows) => `
    <div class="mmm-round" style="--rows:${rows}">
      <div class="mmm-round-label">${label}</div>
      <div class="mmm-round-matches">
        ${list.map((m) => matchPairHtml(m, picks, teams)).join('')}
      </div>
    </div>`;

  const order =
    side === 'right'
      ? [
          round('Final Roar', r4, 16),
          round('Elite Trait', r3, 16),
          round('Sweet 16', r2, 16),
          round('Round 1', r1, 16),
        ]
      : [
          round('Round 1', r1, 16),
          round('Sweet 16', r2, 16),
          round('Elite Trait', r3, 16),
          round('Final Roar', r4, 16),
        ];

  return `<div class="mmm-region-cols mmm-side-${side}">${order.join('')}</div>`;
}

function renderRegion(divKey, divName, matches, picks, teams, side) {
  return `
    <div class="mmm-region mmm-region-${divKey}">
      <div class="mmm-region-name mmm-region-name-${side}">${escapeHtml(divName)}</div>
      ${renderRegionColumn(matches, divKey, picks, teams, side)}
    </div>`;
}

function renderCenter(matches, picks, teams, wildcard, roundPoints, maxScore) {
  const wc = matches.find((m) => m.id === 'wildcard');
  const left = matches.find((m) => m.id === 'r5-left');
  const right = matches.find((m) => m.id === 'r5-right');
  const champ = matches.find((m) => m.id === 'championship');

  let wcHtml = '';
  if (wildcard?.enabled !== false && wc) {
    wcHtml = `
      <div class="mmm-wildcard">
        <div class="mmm-wc-title">Wild Card</div>
        ${matchPairHtml(wc, picks, teams)}
      </div>`;
  }

  const rp = roundPoints || {};
  return `
    <div class="mmm-center">
      <div class="mmm-center-title">${escapeHtml('Championship')}</div>
      ${wcHtml}
      <div class="mmm-center-finals">
        ${left ? `<div class="mmm-final-match"><div class="mmm-final-label">Semifinal (Left)</div>${matchPairHtml(left, picks, teams)}</div>` : ''}
        ${champ ? `<div class="mmm-final-match mmm-championship"><div class="mmm-final-label">Champion</div>${matchPairHtml(champ, picks, teams)}</div>` : ''}
        ${right ? `<div class="mmm-final-match"><div class="mmm-final-label">Semifinal (Right)</div>${matchPairHtml(right, picks, teams)}</div>` : ''}
      </div>
      <div class="mmm-scoring-key">
        <div class="mmm-scoring-title">Scoring</div>
        <div>Wild Card: ${rp.wildcard ?? 1} pt</div>
        <div>Round 1: ${rp.r1 ?? 1} pt each</div>
        <div>Sweet 16: ${rp.r2 ?? 2} pts each</div>
        <div>Elite Trait: ${rp.r3 ?? 3} pts each</div>
        <div>Final Roar: ${rp.r4 ?? 5} pts each</div>
        <div>Semifinals: ${rp.r5 ?? 8} pts each</div>
        <div>Champion: ${rp.championship ?? 13} pts</div>
        <div class="mmm-scoring-max"><strong>Max: ${maxScore ?? 138}</strong></div>
      </div>
    </div>`;
}

function render(container, bracketData, picks) {
  if (!container || !bracketData) return;
  const {
    matches,
    teams,
    divisions,
    divisionOrder,
    wildcard,
    title,
    subtitle,
    roundPoints,
    maxScore,
  } = bracketData;
  const order = divisionOrder || ['mc', 'qss', 'wna', 'wnb'];
  const p = picks || {};

  container.innerHTML = `
    <section class="mmm-sheet-section" id="full-bracket-view">
      <h2 class="mmm-sheet-heading">${escapeHtml(title || 'March Mammal Madness')}</h2>
      <p class="mmm-sheet-sub">${escapeHtml(subtitle || 'Your bracket preview')} · <span class="mmm-winner-legend">Red</span> = your picked winner</p>
      <div class="mmm-sheet-scroll">
        <div class="mmm-sheet">
          <div class="mmm-bracket-layout">
            <div class="mmm-wing mmm-wing-left">
              ${renderRegion(order[0], divisions[order[0]]?.name, matches, p, teams, 'left')}
              ${renderRegion(order[2], divisions[order[2]]?.name, matches, p, teams, 'left')}
            </div>
            ${renderCenter(matches, p, teams, wildcard, roundPoints, maxScore)}
            <div class="mmm-wing mmm-wing-right">
              ${renderRegion(order[1], divisions[order[1]]?.name, matches, p, teams, 'right')}
              ${renderRegion(order[3], divisions[order[3]]?.name, matches, p, teams, 'right')}
            </div>
          </div>
        </div>
      </div>
    </section>`;

  if (window.GoogleSearch) GoogleSearch.bindGoogleButtons(container);
}

window.BracketVisual = { render };
