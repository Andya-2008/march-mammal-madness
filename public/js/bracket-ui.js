/** Shared bracket UI helpers */

const WC = '__wild_card_winner__';

function teamLabel(teamId, teams) {
  const t = teams[teamId];
  if (!t) return teamId;
  const seed = t.seed != null ? `(${t.seed}) ` : '';
  return `${seed}${t.name}`;
}

function resolveParticipantsClient(match, picks, teams) {
  if (match.requires) {
    const parts = [];
    for (const reqId of match.requires) {
      const w = picks[reqId];
      if (!w) return null;
      parts.push(w);
    }
    return parts;
  }
  const parts = [];
  for (const slot of [match.team1, match.team2]) {
    if (!slot) continue;
    if (slot === WC || slot === 'wild-card-winner') {
      if (!picks.wildcard) return null;
      parts.push(picks.wildcard);
    } else {
      parts.push(slot);
    }
  }
  return parts.length === 2 ? parts : null;
}

function isMatchReadyClient(match, picks) {
  return resolveParticipantsClient(match, picks)?.length === 2;
}

function renderMatchCard(match, picks, teams, onPick) {
  const participants = resolveParticipantsClient(match, picks, teams);
  const ready = participants?.length === 2;
  const div = document.createElement('div');
  div.className = `match-card${ready ? '' : ' locked'}`;
  div.dataset.matchId = match.id;

  const h4 = document.createElement('h4');
  h4.textContent = match.label;
  div.appendChild(h4);

  if (!ready) {
    const hint = document.createElement('p');
    hint.style.color = 'var(--muted)';
    hint.style.fontSize = '0.85rem';
    hint.textContent = 'Complete earlier matches first.';
    div.appendChild(hint);
    return div;
  }

  const opts = document.createElement('div');
  opts.className = 'pick-options';

  for (const teamId of participants) {
    const label = document.createElement('label');
    label.className = 'pick-option' + (picks[match.id] === teamId ? ' selected' : '');

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = match.id;
    input.value = teamId;
    input.checked = picks[match.id] === teamId;
    input.addEventListener('change', () => onPick(match.id, teamId));

    const seedSpan = document.createElement('span');
    seedSpan.className = 'seed';
    const t = teams[teamId];
    seedSpan.textContent = t?.seed != null ? t.seed : '—';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = t?.name || teamId;

    label.append(input, seedSpan, nameSpan);
    opts.appendChild(label);
  }

  div.appendChild(opts);
  return div;
}

function groupMatchesByDivision(matches) {
  const groups = { wildcard: [], mc: [], qss: [], wna: [], wnb: [], finals: [] };
  for (const m of matches) {
    if (m.round === 'wildcard') groups.wildcard.push(m);
    else if (m.id === 'r5-left' || m.id === 'r5-right' || m.id === 'championship') groups.finals.push(m);
    else if (m.division) groups[m.division].push(m);
  }
  return groups;
}

function countCompletedPicks(picks, matches, teams) {
  let done = 0;
  for (const m of matches) {
    if (isMatchReadyClient(m, picks) && picks[m.id]) done++;
  }
  return done;
}

function clearDownstreamPicks(changedMatchId, picks, matches) {
  const feedsMap = {};
  for (const m of matches) {
    if (m.requires) {
      for (const req of m.requires) {
        if (!feedsMap[req]) feedsMap[req] = [];
        feedsMap[req].push(m.id);
      }
    }
    if (m.team1 === WC || m.team2 === WC || m.team1 === 'wild-card-winner' || m.team2 === 'wild-card-winner') {
      if (!feedsMap.wildcard) feedsMap.wildcard = [];
      feedsMap.wildcard.push(m.id);
    }
  }

  const toClear = new Set();
  const queue = [changedMatchId];
  while (queue.length) {
    const id = queue.shift();
    for (const child of feedsMap[id] || []) {
      if (!toClear.has(child)) {
        toClear.add(child);
        queue.push(child);
      }
    }
  }
  for (const id of toClear) delete picks[id];
}

window.BracketUI = {
  WC,
  teamLabel,
  resolveParticipantsClient,
  isMatchReadyClient,
  renderMatchCard,
  groupMatchesByDivision,
  countCompletedPicks,
  clearDownstreamPicks,
};
