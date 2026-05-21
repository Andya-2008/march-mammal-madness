/** Shared leaderboard filtering and rendering */

function formatLeaderboardDate(d = new Date()) {
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

function studentGrade(row) {
  return (row.period || row.grade || '').trim();
}

function leaderboardFilterLabel(gradeFilter) {
  if (!gradeFilter) return 'Everyone';
  if (gradeFilter === 'Staff') return 'Staff';
  return `Grade ${gradeFilter}`;
}

function applyGradeFilter(rows, gradeFilter) {
  if (!gradeFilter) return rows;
  return rows.filter((r) => studentGrade(r) === gradeFilter);
}

function rerankFiltered(rows) {
  const sorted = [...rows].sort(
    (a, b) => b.score - a.score || (a.lastName || '').localeCompare(b.lastName || '')
  );
  let rank = 0;
  let prevScore = null;
  return sorted.map((entry, i) => {
    if (entry.score !== prevScore) {
      rank = i + 1;
      prevScore = entry.score;
    }
    return { ...entry, rank };
  });
}

function getFilteredLeaderboardRows(data, gradeFilter) {
  if (!data?.leaderboard) return [];
  return rerankFiltered(applyGradeFilter(data.leaderboard, gradeFilter));
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildLeaderboardCsv(rows, gradeFilter) {
  const lines = [
    ['Rank', 'Name', 'Grade', 'Score'].map(csvCell).join(','),
    ...rows.map((r) =>
      [r.rank, r.name, studentGrade(r), r.score].map(csvCell).join(',')
    ),
  ];
  return lines.join('\r\n');
}

function downloadLeaderboardCsv(rows, gradeFilter) {
  if (!rows.length) return;
  const slug = gradeFilter ? `-${gradeFilter.toLowerCase()}` : '';
  const blob = new Blob([buildLeaderboardCsv(rows, gradeFilter)], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leaderboard${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

window.LeaderboardShared = {
  formatLeaderboardDate,
  studentGrade,
  leaderboardFilterLabel,
  getFilteredLeaderboardRows,
  escapeHtml,
  downloadLeaderboardCsv,
};
