const { getDefaultConfig } = require('./default-config');
const { buildBracketFromConfig } = require('./bracket-engine');

const defaultBundle = buildBracketFromConfig(getDefaultConfig());

module.exports = {
  getDefaultConfig,
  buildBracketFromConfig,
  ...defaultBundle,
};
