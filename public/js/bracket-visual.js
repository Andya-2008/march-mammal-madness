/** Full tournament bracket visualization */

const WC = '__wild_card_winner__';

function teamDisplay(teamId, teams, picks) {
  if (teamId === WC) {
    const w = picks?.wildcard;
    if (w && teams[w]) return { name: teams[w].name, seed: 'WC', id: w };
    return { name: 'Wild Card Winner', seed: 'WC', id: null };
  }
  const t = teams[teamId];
  if (!t) return { name: 'TBD', seed: '—', id: null };
  return { name: t.name, seed: t.seed ?? '—', id: teamId };
}

function feederWinner(feederMatchId, picks, teams) {
  if (!feederMatchId || !picks[feederMatchId]) return null;
  const id = picks[feederMatchId];
  return teamDisplay(id, teams, picks);
}

function slotForMatch(match, slot, picks, teams, matchById) {
  const tid = slot === 'team1' ? match.team1 : match.team2;
  if (tid && tid !== WC) return teamDisplay(tid, teams, picks);
  if (tid === WC) return teamDisplay(WC, teams, picks);

  if (match.requires) {
    const idx = slot === 'team1' ? 0 : 1;
    const feederId = match.requires[idx];
    const w = feederWinner(feederId, picks, teams);
    if (w) return w;
  }
  return { name: 'TBD', seed: '—', id: null };
}

function renderSlot(label, team, isWinner, extraClass = '') {
  const cls = ['bracket-slot', extraClass];
  if (isWinner) cls.push('winner');
  if (!team.id && team.name === 'TBD') cls.push('tbd');
  return `
    <div class="${cls.join(' ')}" title="${label}">
      <span class="slot-seed">${team.seed}</span>
      <span class="slot-name">${escapeHtml(team.name)}</span>
    </div>`;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function renderMatchBox(match, picks, teams, matchById, compact) {
  const t1 = slotForMatch(match, 'team1', picks, teams, matchById);
  const t2 = slotForMatch(match, 'team2', picks, teams, matchById);
  const winnerId = picks[match.id];
  const w1 = winnerId && t1.id === winnerId;
  const w2 = winnerId && t2.id === winnerId;

  return `
    <div class="bracket-match ${compact ? 'compact' : ''}" data-match-id="${match.id}">
      ${renderSlot('Top', t1, w1)}
      ${renderSlot('Bottom', t2, w2)}
    </div>`;
}

function renderDivisionBracket(divKey, divName, matches, picks, teams, matchById) {
  const r1 = matches.filter((m) => m.division === divKey && m.round === 'r1');
  const r2 = matches.filter((m) => m.division === divKey && m.round === 'r2');
  const r3 = matches.filter((m) => m.division === divKey && m.round === 'r3');
  const r4 = matches.filter((m) => m.division === divKey && m.round === 'r4');

  const col = (label, list, compact) => `
    <div class="bracket-col">
      <div class="bracket-col-label">${label}</div>
      <div class="bracket-col-matches ${compact ? '' : 'r1-spaced'}">
        ${list.map((m) => renderMatchBox(m, picks, teams, matchById, compact)).join('')}
      </div>
    </div>`;

  return `
    <div class="bracket-region ${divKey}">
      <h4 class="bracket-region-title">${escapeHtml(divName)}</h4>
      <div class="bracket-region-cols">
        ${col('Round 1', r1, false)}
        ${col('Sweet 16', r2, true)}
        ${col('Elite Trait', r3, true)}
        ${col('Final Roar', r4, true)}
      </div>
    </div>`;
}

function renderFinals(matches, picks, teams, matchById, wildcard) {
  const wc = matches.find((m) => m.id === 'wildcard');
  const left = matches.find((m) => m.id === 'r5-left');
  const right = matches.find((m) => m.id === 'r5-right');
  const champ = matches.find((m) => m.id === 'championship');

  let html = '<div class="bracket-finals">';
  if (wildcard?.enabled !== false && wc) {
    html += `<div class="bracket-finals-wc">
      <div class="bracket-finals-label">Wild Card</div>
      ${renderMatchBox(wc, picks, teams, matchById, true)}
    </div>`;
  }
  html += '<div class="bracket-finals-center">';
  if (left) html += renderMatchBox(left, picks, teams, matchById, true);
  if (champ) {
    html += `<div class="bracket-champion-label">Championship</div>`;
    html += renderMatchBox(champ, picks, teams, matchById, true);
  }
  if (right) html += renderMatchBox(right, picks, teams, matchById, true);
  html += '</div></div>';
  return html;
}

function render(container, bracketData, picks, options = {}) {
  if (!container || !bracketData) return;
  const { matches, teams, divisions, divisionOrder, wildcard, title } = bracketData;
  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]));
  const order = divisionOrder || ['mc', 'qss', 'wna', 'wnb'];

  const regions = order
    .map((key) => {
      const name = divisions[key]?.name || key;
      return renderDivisionBracket(key, name, matches, picks || {}, teams, matchById);
    })
    .join('');

  container.innerHTML = `
    <section class="visual-bracket-section">
      <h2>${escapeHtml(title || 'Full Bracket')}</h2>
      <p class="visual-bracket-hint">Live view of your picks · Winners highlighted in gold</p>
      <div class="visual-bracket-grid">
        <div class="visual-bracket-quad top-left">${renderDivisionBracket(order[0], divisions[order[0]]?.name, matches, picks || {}, teams, matchById)}</div>
        <div class="visual-bracket-quad top-right">${renderDivisionBracket(order[1], divisions[order[1]]?.name, matches, picks || {}, teams, matchById)}</div>
        <div class="visual-bracket-mid">${renderFinals(matches, picks || {}, teams, matchById, wildcard)}</div>
        <div class="visual-bracket-quad bottom-left">${renderDivisionBracket(order[2], divisions[order[2]]?.name, matches, picks || {}, teams, matchById)}</div>
        <div class="visual-bracket-quad bottom-right">${renderDivisionBracket(order[3], divisions[order[3]]?.name, matches, picks || {}, teams, matchById)}</div>
      </div>
    </section>`;
}

window.BracketVisual = { render };
