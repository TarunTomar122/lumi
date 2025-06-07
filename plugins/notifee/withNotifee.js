const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withNotifee(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Add permissions
    const mainApplication = androidManifest.manifest.application[0];
    const permissions = androidManifest.manifest['uses-permission'] || [];

    // Ensure permissions array exists
    androidManifest.manifest['uses-permission'] = permissions;

    // Add required permissions if they don't exist
    const requiredPermissions = [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
    ];

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