module.exports = function (api) {
  api.cache(true);

  const isProd = process.env.NODE_ENV === 'production' || process.env.EAS_BUILD === 'true';

  const plugins = ['react-native-reanimated/plugin'];
  // Strip console.* calls in production to keep release logs quiet and
  // marginally shrink the JS bundle. Dev builds keep everything.
  if (isProd) {
    try {
      require.resolve('babel-plugin-transform-remove-console');
      plugins.unshift(['transform-remove-console', { exclude: ['error', 'warn'] }]);
    } catch { /* plugin not installed — no-op */ }
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
