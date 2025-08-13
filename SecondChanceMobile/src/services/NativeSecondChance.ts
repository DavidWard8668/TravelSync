import { NativeModules, Platform } from 'react-native';

/**
 * Interface for native Android functionality
 */
interface SecondChanceNativeInterface {
  // App management
  getInstalledApps(): Promise<InstalledApp[]>;
  setMonitoredApps(monitoredAppsJson: string): Promise<boolean>;
  updateAppBlockStatus(packageName: string, isBlocked: boolean): Promise<boolean>;
  
  // Device admin
  requestDeviceAdminPrivileges(): Promise<boolean>;
  isDeviceAdminActive(): Promise<boolean>;
  setUninstallPin(pin: string): Promise<boolean>;
  
  // Accessibility service
  isAccessibilityServiceEnabled(): Promise<boolean>;
  openAccessibilitySettings(): Promise<boolean>;
  
  // Admin requests
  getAdminRequests(): Promise<string>;
  updateRequestStatus(requestId: string, status: string): Promise<boolean>;
  sendAdminNotification(type: string, data: string): Promise<boolean>;
  
  // Usage statistics
  getUsageStats(): Promise<string>;
}

interface InstalledApp {
  packageName: string;
  appName: string;
  versionName: string;
  isSystemApp: boolean;
}

interface AdminRequest {
  id: string;
  packageName: string;
  appName: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'denied';
  reason: string;
  respondedAt?: number;
}

interface UsageLog {
  packageName: string;
  appName: string;
  action: string;
  timestamp: number;
}

/**
 * Native module for Second Chance functionality
 */
const SecondChanceNative = Platform.select({
  android: NativeModules.SecondChanceNative as SecondChanceNativeInterface,
  ios: {} as SecondChanceNativeInterface, // iOS implementation would go here
}) || ({} as SecondChanceNativeInterface);

/**
 * Service class for managing native Second Chance functionality
 */
export class NativeSecondChanceService {
  /**
   * Check if native module is available
   */
  static isAvailable(): boolean {
    return Platform.OS === 'android' && SecondChanceNative != null;
  }

  /**
   * Get list of all installed user apps
   */
  static async getInstalledApps(): Promise<InstalledApp[]> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      const apps = await SecondChanceNative.getInstalledApps();
      console.log(`Retrieved ${apps.length} installed apps`);
      return apps;
      
    } catch (error) {
      console.error('Failed to get installed apps:', error);
      throw error;
    }
  }

  /**
   * Set which apps should be monitored
   */
  static async setMonitoredApps(apps: { packageName: string; appName: string; riskLevel: string }[]): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      const monitoredAppsJson = JSON.stringify(apps);
      const success = await SecondChanceNative.setMonitoredApps(monitoredAppsJson);
      
      if (success) {
        console.log('Successfully updated monitored apps');
      }
      
      return success;
      
    } catch (error) {
      console.error('Failed to set monitored apps:', error);
      throw error;
    }
  }

  /**
   * Update the block status of a specific app
   */
  static async updateAppBlockStatus(packageName: string, isBlocked: boolean): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      const success = await SecondChanceNative.updateAppBlockStatus(packageName, isBlocked);
      console.log(`Updated block status for ${packageName}: ${isBlocked ? 'blocked' : 'allowed'}`);
      
      return success;
      
    } catch (error) {
      console.error(`Failed to update app block status for ${packageName}:`, error);
      throw error;
    }
  }

  /**
   * Request device admin privileges
   */
  static async requestDeviceAdminPrivileges(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      const hasPrivileges = await SecondChanceNative.requestDeviceAdminPrivileges();
      
      if (hasPrivileges) {
        console.log('Device admin privileges already granted');
      } else {
        console.log('Device admin request initiated - user needs to grant permission');
      }
      
      return hasPrivileges;
      
    } catch (error) {
      console.error('Failed to request device admin privileges:', error);
      throw error;
    }
  }

  /**
   * Check if device admin is currently active
   */
  static async isDeviceAdminActive(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        return false;
      }
      
      const isActive = await SecondChanceNative.isDeviceAdminActive();
      console.log(`Device admin status: ${isActive ? 'active' : 'inactive'}`);
      
      return isActive;
      
    } catch (error) {
      console.error('Failed to check device admin status:', error);
      return false;
    }
  }

  /**
   * Set PIN for uninstall protection
   */
  static async setUninstallPin(pin: string): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      if (!pin || pin.length < 4) {
        throw new Error('PIN must be at least 4 characters');
      }
      
      const success = await SecondChanceNative.setUninstallPin(pin);
      
      if (success) {
        console.log('Uninstall PIN set successfully');
      }
      
      return success;
      
    } catch (error) {
      console.error('Failed to set uninstall PIN:', error);
      throw error;
    }
  }

  /**
   * Check if accessibility service is enabled
   */
  static async isAccessibilityServiceEnabled(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        return false;
      }
      
      const isEnabled = await SecondChanceNative.isAccessibilityServiceEnabled();
      console.log(`Accessibility service status: ${isEnabled ? 'enabled' : 'disabled'}`);
      
      return isEnabled;
      
    } catch (error) {
      console.error('Failed to check accessibility service status:', error);
      return false;
    }
  }

  /**
   * Open device accessibility settings
   */
  static async openAccessibilitySettings(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      const success = await SecondChanceNative.openAccessibilitySettings();
      console.log('Opened accessibility settings');
      
      return success;
      
    } catch (error) {
      console.error('Failed to open accessibility settings:', error);
      throw error;
    }
  }

  /**
   * Get pending admin requests
   */
  static async getAdminRequests(): Promise<AdminRequest[]> {
    try {
      if (!this.isAvailable()) {
        return [];
      }
      
      const requestsJson = await SecondChanceNative.getAdminRequests();
      const requests = JSON.parse(requestsJson) as AdminRequest[];
      
      console.log(`Retrieved ${requests.length} admin requests`);
      return requests;
      
    } catch (error) {
      console.error('Failed to get admin requests:', error);
      return [];
    }
  }

  /**
   * Update the status of an admin request
   */
  static async updateRequestStatus(requestId: string, status: 'approved' | 'denied'): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      const success = await SecondChanceNative.updateRequestStatus(requestId, status);
      
      if (success) {
        console.log(`Request ${requestId} ${status}`);
      }
      
      return success;
      
    } catch (error) {
      console.error(`Failed to update request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to admin
   */
  static async sendAdminNotification(type: string, data: any): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      const dataJson = JSON.stringify(data);
      const success = await SecondChanceNative.sendAdminNotification(type, dataJson);
      
      if (success) {
        console.log(`Admin notification sent: ${type}`);
      }
      
      return success;
      
    } catch (error) {
      console.error(`Failed to send admin notification (${type}):`, error);
      throw error;
    }
  }

  /**
   * Get app usage statistics
   */
  static async getUsageStats(): Promise<UsageLog[]> {
    try {
      if (!this.isAvailable()) {
        return [];
      }
      
      const statsJson = await SecondChanceNative.getUsageStats();
      const stats = JSON.parse(statsJson) as UsageLog[];
      
      console.log(`Retrieved ${stats.length} usage log entries`);
      return stats;
      
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return [];
    }
  }

  /**
   * Initialize all required permissions and services
   */
  static async initializeDeviceProtection(): Promise<{
    deviceAdmin: boolean;
    accessibilityService: boolean;
    needsSetup: boolean;
  }> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      // Check current status
      const [deviceAdmin, accessibilityService] = await Promise.all([
        this.isDeviceAdminActive(),
        this.isAccessibilityServiceEnabled(),
      ]);
      
      const needsSetup = !deviceAdmin || !accessibilityService;
      
      console.log('Device protection status:', { deviceAdmin, accessibilityService, needsSetup });
      
      return {
        deviceAdmin,
        accessibilityService,
        needsSetup,
      };
      
    } catch (error) {
      console.error('Failed to initialize device protection:', error);
      throw error;
    }
  }

  /**
   * Complete setup process with device admin request
   */
  static async completeSetup(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      // Request device admin privileges
      const deviceAdminGranted = await this.requestDeviceAdminPrivileges();
      
      if (!deviceAdminGranted) {
        console.log('Device admin privileges required for complete setup');
        return false;
      }
      
      // Check if accessibility service is enabled
      const accessibilityEnabled = await this.isAccessibilityServiceEnabled();
      
      if (!accessibilityEnabled) {
        console.log('Accessibility service required - opening settings');
        await this.openAccessibilitySettings();
        return false; // User needs to manually enable
      }
      
      console.log('Setup complete - all permissions granted');
      return true;
      
    } catch (error) {
      console.error('Failed to complete setup:', error);
      throw error;
    }
  }

  /**
   * Create an app access request
   */
  static async createAppAccessRequest(
    packageName: string,
    appName: string,
    reason: string = 'User requested app access'
  ): Promise<string> {
    try {
      const request: AdminRequest = {
        id: Date.now().toString(),
        packageName,
        appName,
        timestamp: Date.now(),
        status: 'pending',
        reason,
      };

      // Send notification to admin
      await this.sendAdminNotification('app_access_request', {
        ...request,
        message: `User is requesting access to ${appName}`,
        urgent: true,
      });

      console.log(`Created access request for ${appName}`);
      return request.id;
      
    } catch (error) {
      console.error(`Failed to create access request for ${appName}:`, error);
      throw error;
    }
  }

  /**
   * Emergency function to disable all app blocking (crisis mode)
   */
  static async enableCrisisMode(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Native module not available');
      }
      
      console.log('🆘 CRISIS MODE ACTIVATED - Disabling all app blocking');
      
      // Get current admin requests to find blocked apps
      const requests = await this.getAdminRequests();
      const blockedApps = [...new Set(requests.map(r => r.packageName))];
      
      // Temporarily unblock all apps
      const unblockPromises = blockedApps.map(packageName => 
        this.updateAppBlockStatus(packageName, false)
      );
      
      await Promise.all(unblockPromises);
      
      // Send crisis notification to admin
      await this.sendAdminNotification('crisis_mode_activated', {
        timestamp: Date.now(),
        message: 'Crisis mode activated - all apps temporarily unblocked',
        urgent: true,
        blockedAppsCount: blockedApps.length,
      });
      
      console.log(`Crisis mode: Unblocked ${blockedApps.length} apps`);
      return true;
      
    } catch (error) {
      console.error('Failed to enable crisis mode:', error);
      throw error;
    }
  }
}

export default NativeSecondChanceService;
export type { InstalledApp, AdminRequest, UsageLog };