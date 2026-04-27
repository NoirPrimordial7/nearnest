const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

const MAPS_API_KEY_NAME = 'com.google.android.geo.API_KEY';

function setMapsApiKey(androidManifest, apiKey) {
  const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  mainApplication['meta-data'] = mainApplication['meta-data'] || [];

  const existing = mainApplication['meta-data'].find(
    (item) => item.$ && item.$['android:name'] === MAPS_API_KEY_NAME,
  );

  if (existing) {
    existing.$['android:value'] = apiKey;
    return androidManifest;
  }

  mainApplication['meta-data'].push({
    $: {
      'android:name': MAPS_API_KEY_NAME,
      'android:value': apiKey,
    },
  });

  return androidManifest;
}

module.exports = function withAndroidGoogleMapsApiKey(config, props = {}) {
  return withAndroidManifest(config, (modConfig) => {
    const apiKey = props.androidGoogleMapsApiKey;
    if (!apiKey) {
      return modConfig;
    }

    modConfig.modResults = setMapsApiKey(modConfig.modResults, apiKey);
    return modConfig;
  });
};
