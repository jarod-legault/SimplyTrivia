const { version } = require('./package.json');

/** @type {import('expo/config').ConfigContext} */
module.exports = ({ config }) => ({
  ...config,
  version,
});
