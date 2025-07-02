import VersionCheck from 'react-native-version-check';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UPDATE_CHECK_STORAGE_KEY = 'last_update_check';
const UPDATE_DISMISSED_STORAGE_KEY = 'update_dismissed_version';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  storeUrl?: string;
}

export const checkForAppUpdate = async (): Promise<UpdateInfo | null> => {
  try {
    // Get current installed version
    const currentVersion = DeviceInfo.getVersion();
    const currentBundleId = DeviceInfo.getBundleId();

    // Check if this is a development build (has .dev suffix)
    const isDevelopmentBuild = currentBundleId.includes('.dev');

    if (isDevelopmentBuild) {
      console.log('Development build detected - will check production store version');
    }

    // Check if we should perform the update check (not more than once per day)
    const lastCheckTime = await AsyncStorage.getItem(UPDATE_CHECK_STORAGE_KEY);
    const now = Date.now();

    if (lastCheckTime && now - parseInt(lastCheckTime) < CHECK_INTERVAL) {
      console.log('Update check skipped - checked recently');
      return null;
    }

    // Get the production package name (remove .dev if present)
    const productionPackageName = currentBundleId.replace('.dev', '');

    // Fetch latest version from store using production package name
    const versionCheckOptions = {
      packageName: productionPackageName, // For Android
      bundleId: productionPackageName, // For iOS
    };

    const latestVersion = await VersionCheck.getLatestVersion(versionCheckOptions);
    const storeUrl = await VersionCheck.getStoreUrl(versionCheckOptions);

    // Store the check time
    await AsyncStorage.setItem(UPDATE_CHECK_STORAGE_KEY, now.toString());

    // Compare versions
    const needsUpdate = await VersionCheck.needUpdate(versionCheckOptions);

    if (needsUpdate && needsUpdate.isNeeded) {
      console.log(`Update available: ${currentVersion} -> ${latestVersion}`);
      return {
        currentVersion,
        latestVersion,
        updateAvailable: true,
        storeUrl: storeUrl || undefined,
      };
    }

    console.log('App is up to date');
    return {
      currentVersion,
      latestVersion,
      updateAvailable: false,
    };
  } catch (error) {
    console.error('Error checking for app update:', error);
    // If app is not published yet or there's any error, fail silently
    return null;
  }
};

export const dismissUpdate = async (version: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(UPDATE_DISMISSED_STORAGE_KEY, version);
    console.log('Update dismissed for version:', version);
  } catch (error) {
    console.error('Error dismissing update:', error);
  }
};

export const getCurrentVersion = (): string => {
  return DeviceInfo.getVersion();
};
