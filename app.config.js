const appJson = require('./app.json');
const { version } = require('./package.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  version,
};
