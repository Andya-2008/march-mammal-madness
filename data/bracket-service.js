const { getDefaultConfig } = require('./default-config');
const { buildBracketFromConfig } = require('./bracket-engine');

let cachedBundle = null;
let cachedConfigJson = null;

function bundleToApi(bundle) {
  return {
    title: bundle.config.title,
    subtitle: bundle.config.subtitle,
    teams: bundle.teams,
    divisions: bundle.divisions,
    divisionOrder: bundle.config.divisionOrder,
    matches: bundle.matches,
    roundPoints: bundle.roundPoints,
    maxScore: bundle.maxScore,
    wildcard: bundle.config.wildcard || { enabled: false },
  };
}

async function getBracketBundle(store) {
  const fromDb = store ? await store.getTournamentConfig() : null;
  const configJson = JSON.stringify(fromDb || getDefaultConfig());
  if (cachedBundle && cachedConfigJson === configJson) return cachedBundle;

  const config = fromDb || getDefaultConfig();
  cachedBundle = buildBracketFromConfig(config);
  cachedConfigJson = configJson;
  return cachedBundle;
}

function invalidateBracketCache() {
  cachedBundle = null;
  cachedConfigJson = null;
}

module.exports = { getBracketBundle, bundleToApi, invalidateBracketCache };
