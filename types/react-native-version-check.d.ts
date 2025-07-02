declare module 'react-native-version-check' {
  interface NeedUpdateResult {
    isNeeded: boolean;
    currentVersion: string;
    latestVersion: string;
    storeUrl: string;
  }

  interface VersionCheckOptions {
    forceUpdate?: boolean;
    provider?: 'playStore' | 'appStore';
    packageName?: string;
    bundleId?: string;
  }

  export default class VersionCheck {
    static getLatestVersion(options?: VersionCheckOptions): Promise<string>;
    static getCurrentVersion(): string;
    static getStoreUrl(options?: VersionCheckOptions): Promise<string>;
    static needUpdate(options?: VersionCheckOptions): Promise<NeedUpdateResult | null>;
  }
} 