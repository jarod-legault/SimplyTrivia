// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(process.cwd());

// Add .db files to asset extensions and .sql for migrations
config.resolver.assetExts.push('db');
config.resolver.sourceExts.push('sql');

module.exports = config;
