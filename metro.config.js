// Metro config — extends Expo's defaults to bundle `.lottie` (dotLottie)
// files as assets so we can `require('../assets/animations/Fire.lottie')`.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('lottie')) {
  config.resolver.assetExts.push('lottie');
}

module.exports = config;
