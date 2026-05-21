/** March Mammal Madness 10th Annual (2013–2022) bracket structure */

const ROUND_POINTS = {
  wildcard: 1,
  r1: 1,
  r2: 2,
  r3: 3,
  r4: 5,
  r5: 8,
  championship: 13,
};

const MAX_SCORE = 138;

const TEAMS = {
  'mftb': { name: 'Mexican Free-Tailed Bat', seed: null, division: null },
  'florida-bonneted-bat': { name: 'Florida Bonneted Bat', seed: null, division: null },
  'lionesses': { name: 'Lionesses', seed: 1, division: 'mc' },
  'moles': { name: 'Moles', seed: 16, division: 'mc' },
  'cats': { name: 'Cats', seed: 8, division: 'mc' },
  'weasels': { name: 'Weasels', seed: 9, division: 'mc' },
  'otters': { name: 'Otters', seed: 5, division: 'mc' },
  'lemurs': { name: 'Lemurs', seed: 12, division: 'mc' },
  'beavers': { name: 'Beavers', seed: 4, division: 'mc' },
  'hedgehogs': { name: 'Hedgehogs', seed: 13, division: 'mc' },
  'monkeys': { name: 'Monkeys', seed: 6, division: 'mc' },
  'wombats': { name: 'Wombats', seed: 11, division: 'mc' },
  'reindeer': { name: 'Reindeer', seed: 3, division: 'mc' },
  'bats': { name: 'Bats', seed: 14, division: 'mc' },
  'foxes': { name: 'Foxes', seed: 7, division: 'mc' },
  'skunks': { name: 'Skunks', seed: 10, division: 'mc' },
  'pandas': { name: 'Pandas', seed: 2, division: 'mc' },
  'prairie-dogs': { name: 'Prairie Dogs', seed: 15, division: 'mc' },
  'orca': { name: 'Orca', seed: 1, division: 'qss' },
  'common-prawn': { name: 'Common Prawn', seed: 16, division: 'qss' },
  'olive-sea-snake': { name: 'Olive Sea Snake', seed: 8, division: 'qss' },
  'hagfish': { name: 'Hagfish', seed: 9, division: 'qss' },
  'common-map-turtle': { name: 'Common Map Turtle', seed: 5, division: 'qss' },
  'northern-jacana': { name: 'Northern Jacana', seed: 12, division: 'qss' },
  'blanket-octopus': { name: 'Blanket Octopus', seed: 4, division: 'qss' },
  'angler-fish': { name: 'Angler Fish', seed: 13, division: 'qss' },
  'macaroni-penguin': { name: 'Macaroni Penguin', seed: 6, division: 'qss' },
  'eclectus-parrot': { name: 'Eclectus Parrot', seed: 11, division: 'qss' },
  'stellers-sea-eagle': { name: "Steller's Sea Eagle", seed: 3, division: 'qss' },
  'dobsonfly': { name: 'Dobsonfly', seed: 14, division: 'qss' },
  'arctic-tern': { name: 'Arctic Tern', seed: 7, division: 'qss' },
  'indian-fruit-bat': { name: 'Indian Fruit Bat', seed: 10, division: 'qss' },
  'hawaiian-monk-seal': { name: 'Hawaiian Monk Seal', seed: 2, division: 'qss' },
  'iberian-ribbed-newt': { name: 'Iberian Ribbed Newt', seed: 15, division: 'qss' },
  'grizzly-bear': { name: 'Grizzly Bear', seed: 1, division: 'wna' },
  'wild-card-winner': { name: 'Wild Card Winner', seed: 16, division: 'wna', dynamic: true },
  'gray-wolf': { name: 'Gray Wolf', seed: 8, division: 'wna' },
  'badger': { name: 'Badger', seed: 9, division: 'wna' },
  'mountain-lion': { name: 'Mountain Lion', seed: 5, division: 'wna' },
  'kit-fox': { name: 'Kit Fox', seed: 12, division: 'wna' },
  'jaguar': { name: 'Jaguar', seed: 4, division: 'wna' },
  'marsh-rabbit': { name: 'Marsh Rabbit', seed: 13, division: 'wna' },
  'elk': { name: 'Elk', seed: 6, division: 'wna' },
  'yellow-bellied-marmot': { name: 'Yellow-Bellied Marmot', seed: 11, division: 'wna' },
  'black-bear': { name: 'Black Bear', seed: 3, division: 'wna' },
  'ground-squirrel': { name: '13-lined Ground Squirrel', seed: 14, division: 'wna' },
  'bighorn-sheep': { name: 'Bighorn Sheep', seed: 7, division: 'wna' },
  'coyote': { name: 'Coyote', seed: 10, division: 'wna' },
  'bison': { name: 'Bison', seed: 2, division: 'wna' },
  'southern-bog-lemming': { name: 'Southern Bog Lemming', seed: 15, division: 'wna' },
  'walrus': { name: 'Walrus', seed: 1, division: 'wnb' },
  'lichen': { name: 'Lichen', seed: 16, division: 'wnb' },
  'muntjac': { name: 'Muntjac', seed: 8, division: 'wnb' },
  'echidna': { name: 'Echidna', seed: 9, division: 'wnb' },
  'serval': { name: 'Serval', seed: 5, division: 'wnb' },
  'lesser-nz-bat': { name: 'Lesser NZ Short-tailed Bat', seed: 12, division: 'wnb' },
  'pangolin': { name: 'Pangolin', seed: 4, division: 'wnb' },
  'painted-redstart': { name: 'Painted Redstart', seed: 13, division: 'wnb' },
  'therapsid': { name: 'Therapsid', seed: 6, division: 'wnb' },
  'scansoriopterygid': { name: 'Scansoriopterygid', seed: 11, division: 'wnb' },
  'lungfish': { name: 'Lungfish', seed: 3, division: 'wnb' },
  'spotted-salamander': { name: 'Spotted Salamander', seed: 14, division: 'wnb' },
  'hairy-frogfish': { name: 'Hairy Frogfish', seed: 7, division: 'wnb' },
  'hairy-frog': { name: 'Hairy Frog', seed: 10, division: 'wnb' },
  'swordfish': { name: 'Swordfish', seed: 2, division: 'wnb' },
  'leaf-slug': { name: 'Leaf Slug', seed: 15, division: 'wnb' },
};

const DIVISIONS = {
  mc: { name: 'Mammal Collectives', position: 'top-left' },
  qss: { name: 'Queens of the Sea & Sky', position: 'top-right' },
  wna: { name: 'Wild North America', position: 'bottom-left' },
  wnb: { name: 'Why Not Both?', position: 'bottom-right' },
};

function divisionR1Pairings(div) {
  const pairings = {
    mc: [
      ['lionesses', 'moles'], ['cats', 'weasels'], ['otters', 'lemurs'], ['beavers', 'hedgehogs'],
      ['monkeys', 'wombats'], ['reindeer', 'bats'], ['foxes', 'skunks'], ['pandas', 'prairie-dogs'],
    ],
    qss: [
      ['orca', 'common-prawn'], ['olive-sea-snake', 'hagfish'], ['common-map-turtle', 'northern-jacana'],
      ['blanket-octopus', 'angler-fish'], ['macaroni-penguin', 'eclectus-parrot'], ['stellers-sea-eagle', 'dobsonfly'],
      ['arctic-tern', 'indian-fruit-bat'], ['hawaiian-monk-seal', 'iberian-ribbed-newt'],
    ],
    wna: [
      ['grizzly-bear', 'wild-card-winner'], ['gray-wolf', 'badger'], ['mountain-lion', 'kit-fox'],
      ['jaguar', 'marsh-rabbit'], ['elk', 'yellow-bellied-marmot'], ['black-bear', 'ground-squirrel'],
      ['bighorn-sheep', 'coyote'], ['bison', 'southern-bog-lemming'],
    ],
    wnb: [
      ['walrus', 'lichen'], ['muntjac', 'echidna'], ['serval', 'lesser-nz-bat'], ['pangolin', 'painted-redstart'],
      ['therapsid', 'scansoriopterygid'], ['lungfish', 'spotted-salamander'], ['hairy-frogfish', 'hairy-frog'],
      ['swordfish', 'leaf-slug'],
    ],
  };
  return pairings[div];
}

function buildDivisionMatches(div) {
  const matches = [];
  const r1 = divisionR1Pairings(div);

  r1.forEach(([t1, t2], i) => {
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

const MATCHES = [
  {
    id: 'wildcard',
    round: 'wildcard',
    division: null,
    label: 'Wild Card',
    team1: 'mftb',
    team2: 'florida-bonneted-bat',
    feeds: ['r1-wna-0'],
    feedSlot: 'team2',
  },
  ...buildDivisionMatches('mc'),
  ...buildDivisionMatches('qss'),
  ...buildDivisionMatches('wna'),
  ...buildDivisionMatches('wnb'),
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
  },
];

const MATCH_BY_ID = Object.fromEntries(MATCHES.map((m) => [m.id, m]));

function getMatchOrder() {
  const order = ['wildcard'];
  ['mc', 'qss', 'wna', 'wnb'].forEach((div) => {
    for (let i = 0; i < 8; i++) order.push(`r1-${div}-${i}`);
  });
  ['mc', 'qss', 'wna', 'wnb'].forEach((div) => {
    for (let i = 0; i < 4; i++) order.push(`r2-${div}-${i}`);
  });
  ['mc', 'qss', 'wna', 'wnb'].forEach((div) => {
    for (let i = 0; i < 2; i++) order.push(`r3-${div}-${i}`);
  });
  ['mc', 'qss', 'wna', 'wnb'].forEach((div) => order.push(`r4-${div}-0`));
  order.push('r5-left', 'r5-right', 'championship');
  return order;
}

function resolveParticipants(matchId, picks) {
  const match = MATCH_BY_ID[matchId];
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
    if (slot === 'wild-card-winner') {
      if (!picks.wildcard) return null;
      participants.push(picks.wildcard);
    } else {
      participants.push(slot);
    }
  }
  return participants.length === 2 ? participants : null;
}

function isMatchReady(matchId, picks) {
  const participants = resolveParticipants(matchId, picks);
  return Array.isArray(participants) && participants.length === 2;
}

function calculateScore(studentPicks, actualPicks) {
  let score = 0;
  const breakdown = {};

  for (const match of MATCHES) {
    const actual = actualPicks[match.id];
    const student = studentPicks[match.id];
    if (!actual) continue;

    const points = ROUND_POINTS[match.round];
    const correct = student === actual;
    if (correct) score += points;

    breakdown[match.id] = { correct, points: correct ? points : 0, actual, student };
  }

  return { score, breakdown, maxScore: MAX_SCORE };
}

function validatePicks(picks) {
  const errors = [];
  for (const matchId of getMatchOrder()) {
    const match = MATCH_BY_ID[matchId];
    const participants = resolveParticipants(matchId, picks);
    if (!participants || participants.length !== 2) {
      if (picks[matchId]) {
        errors.push(`${match.label}: pick is not valid yet (earlier rounds incomplete).`);
        delete picks[matchId];
      }
      continue;
    }
    const pick = picks[matchId];
    if (!pick) {
      errors.push(`${match.label}: missing pick.`);
    } else if (!participants.includes(pick)) {
      errors.push(`${match.label}: invalid competitor selected.`);
    }
  }
  const missing = MATCHES.filter((m) => !picks[m.id]).map((m) => m.label);
  if (missing.length) {
    errors.push(`Incomplete bracket: ${missing.length} matches still need a winner.`);
  }
  return errors;
}

module.exports = {
  TEAMS,
  DIVISIONS,
  MATCHES,
  MATCH_BY_ID,
  ROUND_POINTS,
  MAX_SCORE,
  getMatchOrder,
  resolveParticipants,
  isMatchReady,
  calculateScore,
  validatePicks,
};
