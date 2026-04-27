const appJson = require('./app.json');

const androidMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ||
  process.env.GOOGLE_MAPS_ANDROID_API_KEY ||
  '';

const baseConfig = appJson.expo;
const plugins = [...(baseConfig.plugins || [])];

if (androidMapsApiKey) {
  plugins.push([
    './plugins/withAndroidGoogleMapsApiKey',
    {
      androidGoogleMapsApiKey: androidMapsApiKey,
    },
  ]);
}

module.exports = {
  ...baseConfig,
  android: {
    ...baseConfig.android,
    config: {
      ...(baseConfig.android && baseConfig.android.config ? baseConfig.android.config : {}),
      googleMaps: {
        ...(baseConfig.android &&
        baseConfig.android.config &&
        baseConfig.android.config.googleMaps
          ? baseConfig.android.config.googleMaps
          : {}),
        apiKey: androidMapsApiKey,
      },
    },
  },
  plugins,
  extra: {
    ...(baseConfig.extra || {}),
    hasAndroidMapsKey: Boolean(androidMapsApiKey),
  },
};
