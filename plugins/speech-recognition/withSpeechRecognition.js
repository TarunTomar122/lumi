const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withSpeechRecognition(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Add permissions
    const mainApplication = androidManifest.manifest.application[0];
    const permissions = androidManifest.manifest['uses-permission'] || [];

    // Ensure permissions array exists
    androidManifest.manifest['uses-permission'] = permissions;

    // Add required permissions if they don't exist
    const requiredPermissions = [
      'android.permission.RECORD_AUDIO',
      'android.permission.INTERNET',
    ];

    // Add queries for speech recognition services
    const queries = androidManifest.manifest.queries || [{ }];
    androidManifest.manifest.queries = queries;

    // Add intent filter for speech recognition
    const intentFilters = queries[0].intent || [];
    queries[0].intent = intentFilters;

    // Add speech recognition intent if it doesn't exist
    const speechRecognitionIntent = intentFilters.find(
      (intent) =>
        intent?.action?.[0]?.['$']?.['android:name'] === 'android.speech.RecognitionService'
    );

    if (!speechRecognitionIntent) {
      intentFilters.push({
        action: [{ $: { 'android:name': 'android.speech.RecognitionService' } }],
      });
    }

    // Add required permissions
    requiredPermissions.forEach((permission) => {
      if (!permissions.find((p) => p.$['android:name'] === permission)) {
        permissions.push({
          $: {
            'android:name': permission,
          },
        });
      }
    });

    return config;
  });
}; 