// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(process.cwd());

// Add .db files to asset extensions and .sql for migrations
config.resolver.assetExts.push('db', 'json');
config.resolver.sourceExts.push('sql');

// Support both ESM and CommonJS
config.resolver.sourceExts.push('mjs', 'cjs');

module.exports = config;
