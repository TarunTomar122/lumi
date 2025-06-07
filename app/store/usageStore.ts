import { create } from 'zustand';
import { clientTools } from '@/utils/tools';

interface AppUsage {
  appName: string;
  totalTimeInForeground: number;
}

interface UsageStore {
  usageData: AppUsage[];
  refreshUsageData: () => Promise<void>;
}

export const useUsageStore = create<UsageStore>((set) => ({
  usageData: [],
  refreshUsageData: async () => {
    const result = await clientTools.getUsageStats();
    if (result.success && result.appUsageStats) {
      const usageArray = Object.entries(result.appUsageStats)
        .map(([_, data]) => ({
          appName: data.appName || 'Unknown App',
          totalTimeInForeground: data.totalTimeInForeground || 0,
        }))
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground)
        .slice(0, 3);

      set({ usageData: usageArray });
    }
  },
})); 