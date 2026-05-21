/** Google lookup for competitor names */

function googleSearchUrl(name) {
  const q = `${name} March Mammal Madness`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function searchButtonHtml(name, extraClass = '') {
  if (!name || name === 'TBD' || name === 'Wild Card Winner') return '';
  const url = googleSearchUrl(name);
  const cls = ['search-btn', extraClass].filter(Boolean).join(' ');
  return `<a href="${url}" class="${cls}" target="_blank" rel="noopener noreferrer" title="Search Google for ${escapeAttr(name)}" aria-label="Search ${escapeAttr(name)} on Google">&#128269;</a>`;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

window.BracketSearch = { googleSearchUrl, searchButtonHtml };
