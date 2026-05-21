/** Teacher tournament setup — visual bracket editor */

let editorState = null;

async function loadEditor(adminFetch, container, onSaved) {
  const res = await adminFetch('/api/admin/tournament-config');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  editorState = data.editor;

  BracketSetupEditor.render(container, editorState);

  container.querySelector('#saveConfigBtn')?.addEventListener('click', async () => {
    const payload = BracketSetupEditor.collectFromVisual(editorState);
    const btn = document.getElementById('saveConfigBtn');
    btn.disabled = true;
    try {
      const saveRes = await adminFetch('/api/admin/tournament-config', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || 'Save failed');
      editorState = payload;
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

window.AdminConfig = { loadEditor };
