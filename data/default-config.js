/** Default tournament (10th Annual). Teachers can replace via Admin → Tournament Setup. */

const DIVISION_KEYS = ['mc', 'qss', 'wna', 'wnb'];

const STANDARD_PAIRING_SEEDS = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];

function teamId(div, seed) {
  return `${div}-s${seed}`;
}

function divisionTeams(div, namesBySeed) {
  return namesBySeed.map((name, i) => ({
    seed: i + 1,
    name: name.trim(),
    id: teamId(div, i + 1),
  }));
}

function standardPairings(div, teams) {
  const bySeed = Object.fromEntries(teams.map((t) => [t.seed, t.id]));
  return STANDARD_PAIRING_SEEDS.map(([a, b]) => [bySeed[a], bySeed[b]]);
}

function getDefaultConfig() {
  const divisionNames = {
    mc: 'Mammal Collectives',
    qss: 'Queens of the Sea & Sky',
    wna: 'Wild North America',
    wnb: 'Why Not Both?',
  };

  /** Competitor names in seed order 1 → 16 */
  const names = {
    mc: [
      'Lionesses', 'Pandas', 'Reindeer', 'Beavers', 'Otters', 'Monkeys', 'Foxes', 'Cats',
      'Weasels', 'Skunks', 'Wombats', 'Lemurs', 'Hedgehogs', 'Bats', 'Prairie Dogs', 'Moles',
    ],
    qss: [
      'Orca', 'Hawaiian Monk Seal', "Steller's Sea Eagle", 'Blanket Octopus', 'Common Map Turtle',
      'Macaroni Penguin', 'Arctic Tern', 'Olive Sea Snake', 'Hagfish', 'Indian Fruit Bat',
      'Eclectus Parrot', 'Northern Jacana', 'Angler Fish', 'Dobsonfly', 'Iberian Ribbed Newt', 'Common Prawn',
    ],
    wna: [
      'Grizzly Bear', 'Bison', 'Black Bear', 'Jaguar', 'Mountain Lion', 'Elk', 'Bighorn Sheep', 'Gray Wolf',
      'Badger', 'Coyote', 'Yellow-Bellied Marmot', 'Kit Fox', 'Marsh Rabbit', '13-lined Ground Squirrel',
      'Southern Bog Lemming', 'Wild Card Winner',
    ],
    wnb: [
      'Walrus', 'Swordfish', 'Lungfish', 'Pangolin', 'Serval', 'Therapsid', 'Hairy Frogfish', 'Muntjac',
      'Echidna', 'Hairy Frog', 'Scansoriopterygid', 'Lesser NZ Short-tailed Bat', 'Painted Redstart',
      'Spotted Salamander', 'Leaf Slug', 'Lichen',
    ],
  };

  const customPairings = {
    mc: [
      [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
    ],
    qss: [
      [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
    ],
    wna: [
      [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
    ],
    wnb: [
      [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
    ],
  };

  const divisions = {};
  for (const key of DIVISION_KEYS) {
    const teams = divisionTeams(key, names[key]);
    const bySeed = Object.fromEntries(teams.map((t) => [t.seed, t.id]));
    const r1Pairings = customPairings[key].map(([a, b]) => [bySeed[a], bySeed[b]]);
    divisions[key] = {
      name: divisionNames[key],
      teams,
      r1Pairings,
    };
  }

  return {
    title: 'March Mammal Madness',
    subtitle: 'Classroom Bracket Pool',
    roundPoints: {
      wildcard: 1,
      r1: 1,
      r2: 2,
      r3: 3,
      r4: 5,
      r5: 8,
      championship: 13,
    },
    divisionOrder: DIVISION_KEYS,
    divisions,
    wildcard: {
      enabled: true,
      team1: { name: 'Mexican Free-Tailed Bat' },
      team2: { name: 'Florida Bonneted Bat' },
      feedsDivision: 'wna',
      feedsMatchIndex: 0,
      feedsSlot: 'team2',
    },
  };
}

/** Empty template for teachers copying a new bracket from online */
function getBlankConfig() {
  const divisionNames = { mc: '', qss: '', wna: '', wnb: '' };
  const emptyNames = () => Array(16).fill('');

  const divisions = {};
  for (const key of DIVISION_KEYS) {
    const teams = divisionTeams(key, emptyNames());
    divisions[key] = {
      name: divisionNames[key],
      teams,
      r1Pairings: STANDARD_PAIRING_SEEDS.map(([a, b]) => [a, b]),
    };
  }

  return {
    title: '',
    subtitle: '',
    roundPoints: {
      wildcard: 1,
      r1: 1,
      r2: 2,
      r3: 3,
      r4: 5,
      r5: 8,
      championship: 13,
    },
    divisionOrder: DIVISION_KEYS,
    divisions,
    wildcard: {
      enabled: true,
      team1: { name: '' },
      team2: { name: '' },
      feedsDivision: 'wna',
      feedsMatchIndex: 0,
      feedsSlot: 'team2',
    },
  };
}

module.exports = {
  getDefaultConfig,
  getBlankConfig,
  DIVISION_KEYS,
  STANDARD_PAIRING_SEEDS,
  teamId,
  standardPairings,
};
