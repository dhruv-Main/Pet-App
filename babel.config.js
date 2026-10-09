module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Path aliases (@features, @components, ...) are resolved by Metro through tsconfig.json
    // (experiments.tsconfigPaths in app.json), so no module-resolver plugin is required.
    plugins: ['react-native-reanimated/plugin'],
  };
};
