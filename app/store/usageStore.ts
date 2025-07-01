import { create } from 'zustand';
import { clientTools } from '@/utils/tools';
import { checkUsagePermission } from '@/utils/usageStats';

interface AppUsage {
  appName: string;
  totalTimeInForeground: number;
}

interface UsageStore {
  usageData: AppUsage[];
  hasUsagePermission: boolean | null; // null = not checked, true = granted, false = denied
  isCheckingPermission: boolean;
  refreshUsageData: () => Promise<void>;
  checkPermissionStatus: () => Promise<boolean>;
  requestUsagePermission: () => Promise<boolean>;
}

export const useUsageStore = create<UsageStore>((set, get) => ({
  usageData: [],
  hasUsagePermission: null,
  isCheckingPermission: false,
  
  checkPermissionStatus: async () => {
    if (get().isCheckingPermission) return get().hasUsagePermission || false;
    
    set({ isCheckingPermission: true });
    try {
      const hasPermission = await checkUsagePermission(false); // Don't auto-prompt
      set({ hasUsagePermission: hasPermission });
      return hasPermission;
    } catch (error) {
      console.error('Error checking usage permission:', error);
      set({ hasUsagePermission: false });
      return false;
    } finally {
      set({ isCheckingPermission: false });
    }
  },
  
  requestUsagePermission: async () => {
    try {
      const hasPermission = await checkUsagePermission(true); // Auto-prompt when explicitly requested
      set({ hasUsagePermission: hasPermission });
      if (hasPermission) {
        // If permission granted, refresh usage data
        await get().refreshUsageData();
      }
      return hasPermission;
    } catch (error) {
      console.error('Error requesting usage permission:', error);
      set({ hasUsagePermission: false });
      return false;
    }
  },
  
  refreshUsageData: async () => {
    const hasPermission = get().hasUsagePermission;
    if (hasPermission === false) {
      // Don't try to fetch if we know we don't have permission
      return;
    }
    
    const result = await clientTools.getUsageStats();
    if (result.success && result.appUsageStats) {
      const usageArray = Object.entries(result.appUsageStats)
        .map(([_, data]) => ({
          appName: data.appName || 'Unknown App',
          totalTimeInForeground: data.totalTimeInForeground || 0,
        }))
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground)
        .slice(0, 3);

      set({ usageData: usageArray, hasUsagePermission: true });
    } else {
      // If getUsageStats failed, it might be due to permission
      set({ hasUsagePermission: false });
    }
  },
})); 