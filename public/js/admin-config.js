/** Teacher tournament setup — visual bracket editor */

let editorState = null;

async function loadEditor(adminFetch, container, onSaved) {
  const res = await adminFetch('/api/admin/tournament-config');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  editorState = data.editor;

  BracketSetupEditor.render(container, editorState);

  container.querySelector('#saveConfigBtn')?.addEventListener('click', async () => {
    const setupHost = container.querySelector('#tournament-setup') || container;
    const validation = BracketSetupEditor.validateSetup(setupHost);
    if (!validation.ok) {
      alert(validation.message);
      validation.firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      validation.firstInvalid?.focus?.();
      return;
    }

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
      const retry = BracketSetupEditor.validateSetup(setupHost);
      if (!retry.ok) {
        retry.firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      btn.disabled = false;
    }
  });

  container.querySelector('#resetConfigBtn')?.addEventListener('click', async () => {
    if (!confirm('Clear every field on the setup bracket?')) return;
    const resetRes = await adminFetch('/api/admin/tournament-config/reset', { method: 'POST' });
    if (!resetRes.ok) {
      const d = await resetRes.json();
      alert(d.error || 'Clear failed');
      return;
    }
    await loadEditor(adminFetch, container, onSaved);
    alert('All fields cleared.');
  });

  container.querySelector('#exampleConfigBtn')?.addEventListener('click', async () => {
    if (!confirm('Load the sample 10th Annual bracket? This will replace current setup.')) return;
    const exRes = await adminFetch('/api/admin/tournament-config/example', { method: 'POST' });
    if (!exRes.ok) {
      const d = await exRes.json();
      alert(d.error || 'Load failed');
      return;
    }
    await loadEditor(adminFetch, container, onSaved);
    alert('Example bracket loaded.');
  });
}

window.AdminConfig = { loadEditor };
