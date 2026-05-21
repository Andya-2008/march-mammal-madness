/** Visual bracket editor for teachers — copy tournament from official bracket online */

const DIV_KEYS = ['mc', 'qss', 'wna', 'wnb'];
const STANDARD = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

function wc() {
  return window.BracketUI?.WC || '__wild_card_winner__';
}

function escapeAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function seedSelect(div, match, slot, selected, allowWc) {
  const wild = wc();
  let html = `<select class="setup-seed" data-div="${div}" data-match="${match}" data-slot="${slot}">`;
  for (let s = 1; s <= 16; s++) {
    const sel = selected === s || selected === String(s) ? 'selected' : '';
    html += `<option value="${s}" ${sel}>${s}</option>`;
  }
  if (allowWc) {
    const sel = selected === wild ? 'selected' : '';
    html += `<option value="${wild}" ${sel}>WC</option>`;
  }
  html += '</select>';
  return html;
}

function editablePair(div, matchIndex, pair, divState, wildcard) {
  const wcDiv = wildcard?.enabled && wildcard.feedsDivision === div;
  const wcMatch = (wildcard?.feedsMatchIndex ?? 0) === matchIndex;
  const lines = [0, 1].map((slot) => {
    const seedVal = pair[slot];
    const allowWc = wcDiv && wcMatch && (wildcard.feedsSlot === 'team1' ? slot === 0 : slot === 1);
    const team = (divState.teams || []).find((t) => t.seed === seedVal || t.seed === parseInt(seedVal, 10));
    const name = team?.name || '';
    return `
      <div class="mmm-line mmm-line-edit">
        ${seedSelect(div, matchIndex, slot, seedVal, allowWc)}
        <input type="text" class="setup-name" data-div="${div}" data-match="${matchIndex}" data-slot="${slot}"
          value="${name ? escapeAttr(name) : ''}" placeholder="Competitor name" autocomplete="off">
      </div>`;
  });
  return `<div class="mmm-pair setup-pair" data-div="${div}" data-match="${matchIndex}">${lines.join('')}</div>`;
}

function renderRegionSetup(divKey, divState, side, wildcard) {
  const pairings = divState.r1Pairings || STANDARD.map((p) => [...p]);
  const r1Html = pairings.map((pair, i) => editablePair(divKey, i, pair, divState, wildcard)).join('');

  const placeholder = (label) => `
    <div class="mmm-round mmm-round-placeholder">
      <div class="mmm-round-label">${label}</div>
      <div class="mmm-round-matches">
        <div class="mmm-placeholder-note">Winners during tournament</div>
      </div>
    </div>`;

  const cols =
    side === 'right'
      ? [placeholder('Final Roar'), placeholder('Elite Trait'), placeholder('Sweet 16'), `<div class="mmm-round mmm-round-editable"><div class="mmm-round-label">Round 1 — type names here</div><div class="mmm-round-matches">${r1Html}</div></div>`]
      : [`<div class="mmm-round mmm-round-editable"><div class="mmm-round-label">Round 1 — type names here</div><div class="mmm-round-matches">${r1Html}</div></div>`, placeholder('Sweet 16'), placeholder('Elite Trait'), placeholder('Final Roar')];

  return `
    <div class="mmm-region mmm-region-${divKey} setup-region">
      <input type="text" class="setup-div-name mmm-region-name-input" data-div="${divKey}"
        value="${divState.name ? escapeAttr(divState.name) : ''}" placeholder="Division name" title="Division name">
      <div class="mmm-region-cols mmm-side-${side}">${cols.join('')}</div>
    </div>`;
}

function renderSetupSheet(editorState) {
  const e = editorState;
  const order = e.divisionOrder || DIV_KEYS;

  const wcBlock = e.wildcard?.enabled
    ? `
    <div class="mmm-wildcard setup-wildcard">
      <div class="mmm-wc-title">Wild Card</div>
      <div class="mmm-pair">
        <div class="mmm-line mmm-line-edit">
          <span class="mmm-seed">A</span>
          <input type="text" class="setup-wc-name" data-wc="1" value="${e.wildcard.team1?.name ? escapeAttr(e.wildcard.team1.name) : ''}" placeholder="Competitor A">
        </div>
        <div class="mmm-line mmm-line-edit">
          <span class="mmm-seed">B</span>
          <input type="text" class="setup-wc-name" data-wc="2" value="${e.wildcard.team2?.name ? escapeAttr(e.wildcard.team2.name) : ''}" placeholder="Competitor B">
        </div>
      </div>
      <div class="setup-wc-meta">
        <label>Winner plays in</label>
        <select id="cfg-wc-div" class="setup-wc-meta-sel">
          ${order.map((k) => `<option value="${k}" ${e.wildcard.feedsDivision === k ? 'selected' : ''}>${escapeHtml(e.divisions[k]?.name || k)}</option>`).join('')}
        </select>
        <label>Match #</label>
        <select id="cfg-wc-match" class="setup-wc-meta-sel">
          ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<option value="${i}" ${(e.wildcard.feedsMatchIndex ?? 0) === i ? 'selected' : ''}>${i + 1}</option>`).join('')}
        </select>
        <label>Slot</label>
        <select id="cfg-wc-slot" class="setup-wc-meta-sel">
          <option value="team2" ${e.wildcard.feedsSlot !== 'team1' ? 'selected' : ''}>Lower line</option>
          <option value="team1" ${e.wildcard.feedsSlot === 'team1' ? 'selected' : ''}>Upper line</option>
        </select>
      </div>
    </div>`
    : '';

  return `
    <div class="mmm-sheet setup-sheet">
      <div class="mmm-bracket-layout">
        <div class="mmm-wing mmm-wing-left">
          ${renderRegionSetup(order[0], e.divisions[order[0]], 'left', e.wildcard)}
          ${renderRegionSetup(order[2], e.divisions[order[2]], 'left', e.wildcard)}
        </div>
        <div class="mmm-center">
          <div class="mmm-center-title">Copy bracket from online</div>
          <p class="setup-center-hint">Fill in <strong>Round 1</strong> names to match the official poster. Change seed numbers if a matchup uses different seeds.</p>
          ${wcBlock}
        </div>
        <div class="mmm-wing mmm-wing-right">
          ${renderRegionSetup(order[1], e.divisions[order[1]], 'right', e.wildcard)}
          ${renderRegionSetup(order[3], e.divisions[order[3]], 'right', e.wildcard)}
        </div>
      </div>
    </div>`;
}

function collectFromVisual(editorState) {
  const e = JSON.parse(JSON.stringify(editorState));
  const wild = wc();

  e.title = document.getElementById('cfg-title')?.value?.trim() || 'March Mammal Madness';
  e.subtitle = document.getElementById('cfg-subtitle')?.value?.trim() || '';
  e.wildcard = {
    enabled: document.getElementById('cfg-wc-enabled')?.checked,
    team1: { name: '' },
    team2: { name: '' },
    feedsDivision: document.getElementById('cfg-wc-div')?.value || 'wna',
    feedsMatchIndex: parseInt(document.getElementById('cfg-wc-match')?.value || '0', 10),
    feedsSlot: document.getElementById('cfg-wc-slot')?.value || 'team2',
  };

  if (e.wildcard.enabled) {
    e.wildcard.team1.name = document.querySelector('.setup-wc-name[data-wc="1"]')?.value?.trim() || '';
    e.wildcard.team2.name = document.querySelector('.setup-wc-name[data-wc="2"]')?.value?.trim() || '';
  }

  for (const key of DIV_KEYS) {
    const divName = document.querySelector(`.setup-div-name[data-div="${key}"]`)?.value?.trim();
    if (divName) e.divisions[key].name = divName;

    const teamsBySeed = {};
    const r1Pairings = [];

    for (let mi = 0; mi < 8; mi++) {
      const pair = [1, 16];
      for (let slot = 0; slot < 2; slot++) {
        const seedEl = document.querySelector(
          `.setup-seed[data-div="${key}"][data-match="${mi}"][data-slot="${slot}"]`
        );
        const nameEl = document.querySelector(
          `.setup-name[data-div="${key}"][data-match="${mi}"][data-slot="${slot}"]`
        );
        let seed = parseInt(seedEl?.value, 10);
        if (seedEl?.value === wild) seed = wild;
        const name = nameEl?.value?.trim() || '';
        pair[slot] = seed;
        if (typeof seed === 'number' && seed >= 1 && seed <= 16) {
          teamsBySeed[seed] = name;
        }
      }
      r1Pairings.push(pair);
    }

    e.divisions[key].r1Pairings = r1Pairings;
    e.divisions[key].teams = [];
    for (let s = 1; s <= 16; s++) {
      e.divisions[key].teams.push({ seed: s, name: teamsBySeed[s] || '' });
    }
  }

  return e;
}

function applyStandardPairings(divKey, editorState) {
  editorState.divisions[divKey].r1Pairings = STANDARD.map((p) => [...p]);
  if (editorState.wildcard?.enabled && editorState.wildcard.feedsDivision === divKey) {
    const mi = editorState.wildcard.feedsMatchIndex ?? 0;
    const slot = editorState.wildcard.feedsSlot === 'team1' ? 0 : 1;
    editorState.divisions[divKey].r1Pairings[mi][slot] = wc();
  }
}

function render(host, editorState) {
  if (!host || !editorState) return;

  host.innerHTML = `
    <section class="card" id="tournament-setup">
      <h2>Tournament Setup — Visual Bracket</h2>
      <p style="color:var(--muted);font-size:0.9rem;margin-bottom:1rem">
        Open the official March Mammal Madness bracket online and type each competitor into the matching
        <strong>Round 1</strong> slot below. Adjust seed numbers if needed. Save when finished.
      </p>

      <div class="form-row">
        <div>
          <label>Tournament title</label>
          <input type="text" id="cfg-title" value="${editorState.title ? escapeAttr(editorState.title) : ''}" placeholder="March Mammal Madness">
        </div>
        <div>
          <label>Subtitle (optional)</label>
          <input type="text" id="cfg-subtitle" value="${editorState.subtitle ? escapeAttr(editorState.subtitle) : ''}" placeholder="e.g. 2026 Classroom Pool">
        </div>
      </div>

      <label style="display:block;margin:1rem 0 0.5rem">
        <input type="checkbox" id="cfg-wc-enabled" ${editorState.wildcard?.enabled ? 'checked' : ''}>
        Include wild card play-in game
      </label>

      <div class="actions" style="margin-bottom:1rem">
        <button type="button" class="btn btn-secondary btn-sm" id="standardAllBtn">Standard seeds (1v16, 8v9…) all divisions</button>
      </div>

      <div class="visual-bracket-wrapper setup-bracket-host">
        <div class="mmm-sheet-scroll">${renderSetupSheet(editorState)}</div>
      </div>

      <div class="actions" style="margin-top:1.25rem">
        <button type="button" class="btn btn-primary" id="saveConfigBtn">Save Tournament Setup</button>
        <button type="button" class="btn btn-secondary" id="resetConfigBtn">Clear All Fields</button>
        <button type="button" class="btn btn-secondary" id="exampleConfigBtn">Load Example Bracket</button>
      </div>
    </section>`;

  document.getElementById('cfg-wc-enabled')?.addEventListener('change', () => {
    editorState.wildcard.enabled = document.getElementById('cfg-wc-enabled').checked;
    render(host, editorState);
  });

  document.getElementById('standardAllBtn')?.addEventListener('click', () => {
    for (const key of DIV_KEYS) applyStandardPairings(key, editorState);
    render(host, editorState);
  });
}

window.BracketSetupEditor = { render, collectFromVisual, applyStandardPairings, DIV_KEYS };
