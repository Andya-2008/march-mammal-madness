/** Teacher tournament setup — divisions, seeds, R1 pairings */

function wc() {
  return window.BracketUI?.WC || '__wild_card_winner__';
}
const DIV_KEYS = ['mc', 'qss', 'wna', 'wnb'];
const STANDARD = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

let editorState = null;

function seedOptions(divKey, includeWc) {
  let opts = '<option value="">—</option>';
  for (let s = 1; s <= 16; s++) {
    opts += `<option value="${s}">${s}</option>`;
  }
  if (includeWc) opts += `<option value="${wc()}">Wild Card Winner</option>`;
  return opts;
}

function renderEditor(container) {
  if (!editorState) return;
  const e = editorState;

  let divisionsHtml = '';
  for (const key of DIV_KEYS) {
    const div = e.divisions[key];
    const teamRows = (div.teams || [])
      .map(
        (t, i) => `
      <tr>
        <td>${t.seed ?? i + 1}</td>
        <td><input type="text" data-div="${key}" data-seed="${t.seed ?? i + 1}" class="team-name-input" value="${escapeAttr(t.name)}"></td>
      </tr>`
      )
      .join('');

    const pairingRows = (div.r1Pairings || STANDARD)
      .map((pair, mi) => {
        const a = pair[0];
        const b = pair[1];
        const wcDiv = e.wildcard?.feedsDivision === key && (e.wildcard?.feedsMatchIndex ?? 0) === mi;
        return `
        <tr>
          <td>Match ${mi + 1}</td>
          <td>
            <select data-div="${key}" data-match="${mi}" data-slot="0" class="pairing-select">
              ${seedOptionList(a, key, wcDiv && e.wildcard?.feedsSlot !== 'team2')}
            </select>
          </td>
          <td>vs</td>
          <td>
            <select data-div="${key}" data-match="${mi}" data-slot="1" class="pairing-select">
              ${seedOptionList(b, key, wcDiv && e.wildcard?.feedsSlot === 'team2')}
            </select>
          </td>
        </tr>`;
      })
      .join('');

    divisionsHtml += `
      <div class="card config-division" data-division="${key}">
        <h3>${escapeHtml(div.name)} <span style="color:var(--muted);font-weight:400">(${key})</span></h3>
        <label>Division display name</label>
        <input type="text" class="div-name-input" data-div="${key}" value="${escapeAttr(div.name)}" style="margin-bottom:1rem">

        <h4 style="font-size:0.95rem;margin:1rem 0 0.5rem">Competitors (seeds 1–16)</h4>
        <table class="config-table">
          <thead><tr><th>Seed</th><th>Name</th></tr></thead>
          <tbody>${teamRows}</tbody>
        </table>

        <h4 style="font-size:0.95rem;margin:1rem 0 0.5rem">Round 1 matchups</h4>
        <button type="button" class="btn btn-secondary btn-sm standard-pairings-btn" data-div="${key}">Use standard 1v16, 8v9… pairings</button>
        <table class="config-table" style="margin-top:0.75rem">
          <thead><tr><th></th><th>Competitor A</th><th></th><th>Competitor B</th></tr></thead>
          <tbody>${pairingRows}</tbody>
        </table>
      </div>`;
  }

  container.innerHTML = `
    <section class="card" id="tournament-setup">
      <h2>Tournament Setup (new each year)</h2>
      <p style="color:var(--muted);font-size:0.9rem;margin-bottom:1rem">
        Set division names, all 64 competitor names with seeds, and Round 1 pairings.
        Save before students submit brackets. Changing this later may invalidate existing picks.
      </p>

      <div class="form-row">
        <div>
          <label>Tournament title</label>
          <input type="text" id="cfg-title" value="${escapeAttr(e.title)}">
        </div>
        <div>
          <label>Subtitle (optional)</label>
          <input type="text" id="cfg-subtitle" value="${escapeAttr(e.subtitle || '')}">
        </div>
      </div>

      <div class="card" style="margin-top:1rem;background:var(--bg)">
        <h3>Wild Card</h3>
        <label><input type="checkbox" id="cfg-wc-enabled" ${e.wildcard?.enabled ? 'checked' : ''}> Include wild card play-in game</label>
        <div id="wc-fields" style="margin-top:0.75rem">
          <div class="form-row">
            <div><label>Competitor A</label><input type="text" id="cfg-wc-1" value="${escapeAttr(e.wildcard?.team1?.name || '')}"></div>
            <div><label>Competitor B</label><input type="text" id="cfg-wc-2" value="${escapeAttr(e.wildcard?.team2?.name || '')}"></div>
          </div>
          <div class="form-row">
            <div>
              <label>Winner joins division</label>
              <select id="cfg-wc-div">
                ${DIV_KEYS.map((k) => `<option value="${k}" ${e.wildcard?.feedsDivision === k ? 'selected' : ''}>${e.divisions[k]?.name || k}</option>`).join('')}
              </select>
            </div>
            <div>
              <label>Round 1 match #</label>
              <select id="cfg-wc-match">
                ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<option value="${i}" ${(e.wildcard?.feedsMatchIndex ?? 0) === i ? 'selected' : ''}>${i + 1}</option>`).join('')}
              </select>
            </div>
            <div>
              <label>Slot (A or B)</label>
              <select id="cfg-wc-slot">
                <option value="team2" ${e.wildcard?.feedsSlot !== 'team1' ? 'selected' : ''}>B (underdog / 16-seed side)</option>
                <option value="team1" ${e.wildcard?.feedsSlot === 'team1' ? 'selected' : ''}>A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      ${divisionsHtml}

      <div class="actions">
        <button type="button" class="btn btn-primary" id="saveConfigBtn">Save Tournament Setup</button>
        <button type="button" class="btn btn-secondary" id="resetConfigBtn">Reset to Default</button>
      </div>
    </section>`;

  bindEditorEvents(container);
}

function seedOptionList(selected, divKey, allowWc) {
  let html = '<option value="">—</option>';
  for (let s = 1; s <= 16; s++) {
    const sel = selected === s || selected === String(s) ? 'selected' : '';
    html += `<option value="${s}" ${sel}>Seed ${s}</option>`;
  }
  if (allowWc) {
    const wild = wc();
    const sel = selected === wild ? 'selected' : '';
    html += `<option value="${wild}" ${sel}>Wild Card Winner</option>`;
  }
  return html;
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

function collectEditorFromDom() {
  const e = JSON.parse(JSON.stringify(editorState));

  e.title = document.getElementById('cfg-title')?.value?.trim() || 'March Mammal Madness';
  e.subtitle = document.getElementById('cfg-subtitle')?.value?.trim() || '';
  e.wildcard = {
    enabled: document.getElementById('cfg-wc-enabled')?.checked,
    team1: { name: document.getElementById('cfg-wc-1')?.value?.trim() || '' },
    team2: { name: document.getElementById('cfg-wc-2')?.value?.trim() || '' },
    feedsDivision: document.getElementById('cfg-wc-div')?.value || 'wna',
    feedsMatchIndex: parseInt(document.getElementById('cfg-wc-match')?.value || '0', 10),
    feedsSlot: document.getElementById('cfg-wc-slot')?.value || 'team2',
  };

  document.querySelectorAll('.div-name-input').forEach((inp) => {
    const key = inp.dataset.div;
    if (e.divisions[key]) e.divisions[key].name = inp.value.trim();
  });

  document.querySelectorAll('.team-name-input').forEach((inp) => {
    const key = inp.dataset.div;
    const seed = parseInt(inp.dataset.seed, 10);
    const team = e.divisions[key]?.teams?.find((t) => t.seed === seed);
    if (team) team.name = inp.value.trim();
  });

  document.querySelectorAll('.pairing-select').forEach((sel) => {
    const key = sel.dataset.div;
    const mi = parseInt(sel.dataset.match, 10);
    const slot = parseInt(sel.dataset.slot, 10);
    const wild = wc();
    const val = sel.value === wild ? wild : parseInt(sel.value, 10);
    if (!e.divisions[key].r1Pairings) e.divisions[key].r1Pairings = STANDARD.map((p) => [...p]);
    e.divisions[key].r1Pairings[mi][slot] = val;
  });

  return e;
}

function bindEditorEvents(container) {
  container.querySelectorAll('.standard-pairings-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.div;
      editorState.divisions[key].r1Pairings = STANDARD.map((p) => [...p]);
      if (editorState.wildcard?.enabled && editorState.wildcard.feedsDivision === key) {
        const mi = editorState.wildcard.feedsMatchIndex ?? 0;
        const slot = editorState.wildcard.feedsSlot === 'team1' ? 0 : 1;
        editorState.divisions[key].r1Pairings[mi][slot] = wc();
      }
      renderEditor(container);
    });
  });
}

async function loadEditor(adminFetch, container, onSaved) {
  const res = await adminFetch('/api/admin/tournament-config');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  editorState = data.editor;
  renderEditor(container);

  container.querySelector('#saveConfigBtn')?.addEventListener('click', async () => {
    const payload = collectEditorFromDom();
    const btn = document.getElementById('saveConfigBtn');
    btn.disabled = true;
    try {
      const saveRes = await adminFetch('/api/admin/tournament-config', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || 'Save failed');
      if (onSaved) onSaved(saveData);
      alert(saveData.message || 'Saved!');
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  container.querySelector('#resetConfigBtn')?.addEventListener('click', async () => {
    if (!confirm('Reset to the default tournament? This replaces all names and pairings.')) return;
    const resetRes = await adminFetch('/api/admin/tournament-config/reset', { method: 'POST' });
    if (!resetRes.ok) {
      const d = await resetRes.json();
      alert(d.error || 'Reset failed');
      return;
    }
    await loadEditor(adminFetch, container, onSaved);
    alert('Reset to default tournament.');
  });
}

window.AdminConfig = { loadEditor, collectEditorFromDom };
