/** Open Google search for a competitor name */

function googleSearchUrl(name) {
  const q = encodeURIComponent(`${name} animal`);
  return `https://www.google.com/search?q=${q}`;
}

function googleSearchButton(name, small = true) {
  if (!name || name === 'TBD' || name === 'Wild Card Winner') return '';
  const cls = small ? 'btn-google btn-google-sm' : 'btn-google';
  const url = googleSearchUrl(name);
  return `<button type="button" class="${cls}" data-search-url="${url.replace(/"/g, '&quot;')}" title="Search Google for ${name.replace(/"/g, '&quot;')}" aria-label="Search Google for ${name.replace(/"/g, '&quot;')}">⌕</button>`;
}

function bindGoogleButtons(root) {
  (root || document).querySelectorAll('.btn-google').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = btn.getAttribute('data-search-url');
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });
  });
}

window.GoogleSearch = { googleSearchUrl, googleSearchButton, bindGoogleButtons };
