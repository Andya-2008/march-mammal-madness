const { STANDARD_PAIRING_SEEDS, teamId, standardPairings } = require('./default-config');

const WILD_CARD_PLACEHOLDER = '__wild_card_winner__';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'team';
}

function normalizeConfig(raw) {
  const config = JSON.parse(JSON.stringify(raw));
  if (!config.roundPoints) throw new Error('Missing roundPoints');
  if (!config.divisions) throw new Error('Missing divisions');

  config.divisionOrder = config.divisionOrder || Object.keys(config.divisions);
  const teams = {};
  const divisions = {};

  for (const divKey of config.divisionOrder) {
    const div = config.divisions[divKey];
    if (!div) continue;

    const divTeams = (div.teams || []).map((t, idx) => {
      const seed = t.seed ?? idx + 1;
      const id = t.id || teamId(divKey, seed);
      const entry = { id, name: (t.name || '').trim(), seed, division: divKey };
      teams[id] = entry;
      return entry;
    });

    let r1Pairings = div.r1Pairings;
    if (!r1Pairings?.length) {
      r1Pairings = standardPairings(divKey, divTeams);
    }

    if (config.wildcard?.enabled && config.wildcard.feedsDivision === divKey) {
      const idx = config.wildcard.feedsMatchIndex ?? 0;
      const slot = config.wildcard.feedsSlot === 'team1' ? 0 : 1;
      const pair = r1Pairings[idx];
      if (pair) pair[slot] = WILD_CARD_PLACEHOLDER;
    }

    divisions[divKey] = {
      name: div.name || divKey,
      teams: divTeams,
      r1Pairings,
    };
  }

  if (config.wildcard?.enabled) {
    const w1 = config.wildcard.team1?.name?.trim();
    const w2 = config.wildcard.team2?.name?.trim();
    if (w1) teams['wildcard-1'] = { id: 'wildcard-1', name: w1, seed: null, division: null };
    if (w2) teams['wildcard-2'] = { id: 'wildcard-2', name: w2, seed: null, division: null };
  }

  return { ...config, divisions, teams, divisionsMeta: divisions };
}

function buildDivisionMatches(div, r1Pairings) {
  const matches = [];

  r1Pairings.forEach(([t1, t2], i) => {
    matches.push({
      id: `r1-${div}-${i}`,
      round: 'r1',
      division: div,
      label: `Round 1 — Match ${i + 1}`,
      team1: t1,
      team2: t2,
      feeds: [`r2-${div}-${Math.floor(i / 2)}`],
      feedSlot: i % 2 === 0 ? 'team1' : 'team2',
    });
  });

  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `r2-${div}-${i}`,
      round: 'r2',
      division: div,
      label: `Sweet 16 — Match ${i + 1}`,
      team1: null,
      team2: null,
      feeds: [`r3-${div}-${Math.floor(i / 2)}`],
      feedSlot: i % 2 === 0 ? 'team1' : 'team2',
      requires: [`r1-${div}-${i * 2}`, `r1-${div}-${i * 2 + 1}`],
    });
  }

  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `r3-${div}-${i}`,
      round: 'r3',
      division: div,
      label: `Elite Trait — Match ${i + 1}`,
      team1: null,
      team2: null,
      feeds: [`r4-${div}-0`],
      feedSlot: i === 0 ? 'team1' : 'team2',
      requires: [`r2-${div}-${i * 2}`, `r2-${div}-${i * 2 + 1}`],
    });
  }

  matches.push({
    id: `r4-${div}-0`,
    round: 'r4',
    division: div,
    label: 'Final Roar',
    team1: null,
    team2: null,
    feeds: div === 'mc' || div === 'wna' ? ['r5-left'] : ['r5-right'],
    feedSlot: div === 'mc' || div === 'qss' ? 'team1' : 'team2',
    requires: [`r3-${div}-0`, `r3-${div}-1`],
  });

  return matches;
}

function buildBracketFromConfig(rawConfig) {
  const config = normalizeConfig(rawConfig);
  const { teams, divisionsMeta, divisionOrder, roundPoints, wildcard } = config;

  const divisions = {};
  for (const key of divisionOrder) {
    divisions[key] = { name: divisionsMeta[key].name, position: key };
  }

  const matches = [];

  if (wildcard?.enabled) {
    matches.push({
      id: 'wildcard',
      round: 'wildcard',
      division: null,
      label: 'Wild Card',
      team1: 'wildcard-1',
      team2: 'wildcard-2',
      feeds: [`r1-${wildcard.feedsDivision}-${wildcard.feedsMatchIndex ?? 0}`],
      feedSlot: wildcard.feedsSlot === 'team1' ? 'team1' : 'team2',
    });
  }

  for (const div of divisionOrder) {
    matches.push(...buildDivisionMatches(div, divisionsMeta[div].r1Pairings));
  }

  matches.push(
    {
      id: 'r5-left',
      round: 'r5',
      division: null,
      label: 'Semifinal (Left)',
      team1: null,
      team2: null,
      feeds: ['championship'],
      feedSlot: 'team1',
      requires: ['r4-mc-0', 'r4-wna-0'],
    },
    {
      id: 'r5-right',
      round: 'r5',
      division: null,
      label: 'Semifinal (Right)',
      team1: null,
      team2: null,
      feeds: ['championship'],
      feedSlot: 'team2',
      requires: ['r4-qss-0', 'r4-wnb-0'],
    },
    {
      id: 'championship',
      round: 'championship',
      division: null,
      label: 'Championship',
      team1: null,
      team2: null,
      feeds: [],
      requires: ['r5-left', 'r5-right'],
    }
  );

  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]));

  let maxScore = 0;
  for (const m of matches) {
    maxScore += roundPoints[m.round] || 0;
  }

  function getMatchOrder() {
    const order = [];
    if (wildcard?.enabled) order.push('wildcard');
    for (const div of divisionOrder) {
      for (let i = 0; i < 8; i++) order.push(`r1-${div}-${i}`);
    }
    for (const div of divisionOrder) {
      for (let i = 0; i < 4; i++) order.push(`r2-${div}-${i}`);
    }
    for (const div of divisionOrder) {
      for (let i = 0; i < 2; i++) order.push(`r3-${div}-${i}`);
    }
    for (const div of divisionOrder) order.push(`r4-${div}-0`);
    order.push('r5-left', 'r5-right', 'championship');
    return order;
  }

  function resolveParticipants(matchId, picks) {
    const match = matchById[matchId];
    if (!match) return null;

    if (match.requires) {
      const participants = [];
      for (const reqId of match.requires) {
        const winner = picks[reqId];
        if (!winner) return null;
        participants.push(winner);
      }
      return participants;
    }

    const participants = [];
    for (const slot of [match.team1, match.team2]) {
      if (!slot) continue;
      if (slot === WILD_CARD_PLACEHOLDER) {
        if (!picks.wildcard) return null;
        participants.push(picks.wildcard);
      } else {
        participants.push(slot);
      }
    }
    return participants.length === 2 ? participants : null;
  }

  function calculateScore(studentPicks, actualPicks) {
    let score = 0;
    const breakdown = {};
    for (const match of matches) {
      const actual = actualPicks[match.id];
      const student = studentPicks[match.id];
      if (!actual) continue;
      const points = roundPoints[match.round] || 0;
      const correct = student === actual;
      if (correct) score += points;
      breakdown[match.id] = { correct, points: correct ? points : 0, actual, student };
    }
    return { score, breakdown, maxScore };
  }

  function validatePicks(picks) {
    const errors = [];
    for (const matchId of getMatchOrder()) {
      const match = matchById[matchId];
      const participants = resolveParticipants(matchId, picks);
      if (!participants || participants.length !== 2) {
        if (picks[matchId]) {
          errors.push(`${match.label}: pick is not valid yet (earlier rounds incomplete).`);
          delete picks[matchId];
        }
        continue;
      }
      const pick = picks[matchId];
      if (!pick) errors.push(`${match.label}: missing pick.`);
      else if (!participants.includes(pick)) errors.push(`${match.label}: invalid competitor selected.`);
    }
    const missing = matches.filter((m) => !picks[m.id]).length;
    if (missing) errors.push(`Incomplete bracket: ${missing} matches still need a winner.`);
    return errors;
  }

  function configForEditor() {
    const editor = {
      title: config.title,
      subtitle: config.subtitle || '',
      roundPoints: { ...config.roundPoints },
      divisionOrder: [...config.divisionOrder],
      wildcard: { ...config.wildcard },
      divisions: {},
    };
    for (const key of divisionOrder) {
      const d = divisionsMeta[key];
      editor.divisions[key] = {
        name: d.name,
        teams: d.teams.map((t) => ({ seed: t.seed, name: t.name })),
        r1Pairings: d.r1Pairings.map(([a, b]) => {
          const resolve = (id) => {
            if (id === WILD_CARD_PLACEHOLDER) return WILD_CARD_PLACEHOLDER;
            const t = teams[id];
            return t ? t.seed : null;
          };
          return [resolve(a), resolve(b)];
        }),
      };
    }
    return editor;
  }

  return {
    config,
    teams,
    divisions,
    matches,
    matchById,
    roundPoints,
    maxScore,
    getMatchOrder,
    resolveParticipants,
    calculateScore,
    validatePicks,
    configForEditor,
    WILD_CARD_PLACEHOLDER,
  };
}

function seedsUsedInR1Pairings(pairings) {
  const seeds = new Set();
  for (const pair of pairings || []) {
    for (const s of pair) {
      if (s === WILD_CARD_PLACEHOLDER) continue;
      const n = typeof s === 'number' ? s : parseInt(s, 10);
      if (n >= 1 && n <= 16) seeds.add(n);
    }
  }
  return seeds;
}

function validateConfigInput(raw) {
  const errors = [];
  if (!raw.title?.trim()) errors.push('Tournament title is required.');
  if (!raw.divisions || typeof raw.divisions !== 'object') errors.push('Divisions required.');

  const keys = raw.divisionOrder || Object.keys(raw.divisions || {});
  for (const key of keys) {
    const div = raw.divisions[key];
    if (!div) continue;
    if (!div.name?.trim()) errors.push(`Division ${key}: name required.`);
    const teamList = div.teams || [];
    if (teamList.length !== 16) errors.push(`Division ${key}: need exactly 16 competitors (seeds 1–16).`);
    const pairings = div.r1Pairings;
    const usedSeeds = seedsUsedInR1Pairings(pairings);
    const emptyNames = teamList.filter((t) => usedSeeds.has(t.seed) && !t.name?.trim()).length;
    if (emptyNames) errors.push(`Division ${key}: ${emptyNames} competitor name(s) still empty.`);
    if (pairings && pairings.length !== 8) errors.push(`Division ${key}: need 8 Round 1 matchups.`);
  }

  for (const [key, div] of Object.entries(raw.divisions || {})) {
    if (!keys.includes(key) && div) {
      if ((div.teams || []).length !== 16) errors.push(`Division ${key}: need exactly 16 competitors.`);
    }
  }

  // Wild card names may be left empty until teachers fill them in from the official bracket.

  return errors;
}

function editorToStorageConfig(editor) {
  const config = {
    title: editor.title.trim(),
    subtitle: editor.subtitle?.trim() || '',
    roundPoints: editor.roundPoints,
    divisionOrder: editor.divisionOrder || ['mc', 'qss', 'wna', 'wnb'],
    wildcard: editor.wildcard,
    divisions: {},
  };

  for (const key of config.divisionOrder) {
    const div = editor.divisions[key];
    const teams = (div.teams || []).map((t, i) => ({
      seed: t.seed ?? i + 1,
      name: (t.name || '').trim(),
      id: teamId(key, t.seed ?? i + 1),
    }));
    const bySeed = Object.fromEntries(teams.map((t) => [t.seed, t.id]));

    let r1Pairings;
    if (div.r1Pairings?.length === 8) {
      r1Pairings = div.r1Pairings.map(([a, b]) => {
        const idA = a === WILD_CARD_PLACEHOLDER ? WILD_CARD_PLACEHOLDER : bySeed[a];
        const idB = b === WILD_CARD_PLACEHOLDER ? WILD_CARD_PLACEHOLDER : bySeed[b];
        return [idA, idB];
      });
    } else {
      r1Pairings = standardPairings(key, teams);
    }

    config.divisions[key] = { name: div.name.trim(), teams, r1Pairings };
  }

  return config;
}

module.exports = {
  buildBracketFromConfig,
  normalizeConfig,
  validateConfigInput,
  seedsUsedInR1Pairings,
  editorToStorageConfig,
  WILD_CARD_PLACEHOLDER,
  STANDARD_PAIRING_SEEDS,
};
