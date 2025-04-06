module.exports = function (api) {
  api.cache(true);

  let plugins = [['@babel/plugin-proposal-decorators', { legacy: true }]];

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
