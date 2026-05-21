let leaderboardData = [];

function formatLeaderboardDate(d = new Date()) {
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

const alertEl = document.getElementById('alert');
const tbody = document.getElementById('leaderboard-body');
const pdfBtn = document.getElementById('pdfBtn');
const meta = document.getElementById('meta');

function showAlert(msg, type = 'error') {
  alertEl.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

function renderTable(data) {
  tbody.innerHTML = '';
  if (!data.leaderboard.length) {
    tbody.innerHTML = '<tr><td colspan="4">No submissions yet.</td></tr>';
    return;
  }

  for (const row of data.leaderboard) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="rank-badge">${row.rank}</span></td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.period || row.grade || '—')}</td>
      <td><strong>${row.score}</strong></td>
    `;
    tbody.appendChild(tr);
  }

  meta.textContent = formatLeaderboardDate();
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function loadLeaderboard() {
  pdfBtn.disabled = true;
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    leaderboardData = data;
    renderTable(data);
    pdfBtn.disabled = false;
    alertEl.innerHTML = '';
  } catch (e) {
    showAlert(e.message);
    tbody.innerHTML = '';
  }
}

function downloadPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text('Leaderboard', 40, 50);

  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(formatLeaderboardDate(), 40, 68);

  const rows = leaderboardData.leaderboard.map((r) => [
    String(r.rank),
    r.name,
    r.period || r.grade || '—',
    String(r.score),
  ]);

  doc.autoTable({
    startY: 85,
    head: [['Rank', 'Name', 'Grade', 'Score']],
    body: rows,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [30, 58, 95], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`mmm-leaderboard-${new Date().toISOString().slice(0, 10)}.pdf`);
}

document.getElementById('refreshBtn').addEventListener('click', loadLeaderboard);
document.getElementById('pdfBtn').addEventListener('click', downloadPdf);

loadLeaderboard();
