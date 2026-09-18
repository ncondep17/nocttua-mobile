// @nocttua/theme resolves as a symlink into node_modules (file:./shared/theme);
// Metro/Expo SDK 52+ follows symlinks by default. This file only adds
// react-native-svg-transformer so brand SVGs import as components.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = config;
