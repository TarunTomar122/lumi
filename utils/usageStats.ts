import {
  EventFrequency,
  checkForPermission,
  queryUsageStats,
  showUsageAccessSettings,
} from '@brighthustle/react-native-usage-stats-manager';
import { Platform } from 'react-native';

export interface AppUsageInfo {
  appName: string;
  firstTimeStamp: number;
  isSystem: boolean;
  lastTimeStamp: number;
  lastTimeUsed: number;
  packageName: string;
  totalTimeInForeground: number;
}

export const checkUsagePermission = async (autoPrompt: boolean = false): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;

  const hasPermission = await checkForPermission();
  if (!hasPermission && autoPrompt) {
    showUsageAccessSettings('');
    return false;
  }
  return hasPermission;
};

export const getAppUsageStats = async (
  startTime: number,
  endTime: number
): Promise<AppUsageInfo[]> => {
  if (Platform.OS !== 'android') return [];

  try {
    const stats = await queryUsageStats(EventFrequency.INTERVAL_DAILY, startTime, endTime);
    return stats || [];
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return [];
  }
};

export const getLastDayUsageStats = async (): Promise<AppUsageInfo[]> => {
  const endTime = Date.now();
  const startTime = endTime - 24 * 60 * 60 * 1000; // 24 hours ago
  return getAppUsageStats(startTime, endTime);
};

export const getLastWeekUsageStats = async (): Promise<AppUsageInfo[]> => {
  const endTime = Date.now();
  const startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago
  return getAppUsageStats(startTime, endTime);
};
