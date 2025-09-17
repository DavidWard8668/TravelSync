/**
 * App Access Control Service
 * Manages timed access restrictions and app blocking for recovery support
 */

interface AppRestriction {
  appId: string;
  appName: string;
  packageName?: string; // Android
  bundleId?: string; // iOS
  category: 'social' | 'gaming' | 'shopping' | 'entertainment' | 'productivity' | 'other';
  restrictionType: 'blocked' | 'timed' | 'scheduled' | 'limited';
  settings: RestrictionSettings;
}

interface RestrictionSettings {
  // Timed Access
  dailyLimit?: number; // minutes per day
  sessionLimit?: number; // minutes per session
  cooldownPeriod?: number; // minutes between sessions
  
  // Scheduled Access
  allowedHours?: {
    start: string; // "09:00"
    end: string; // "17:00"
  }[];
  blockedDays?: number[]; // 0-6 (Sunday-Saturday)
  
  // Limited Access
  launchLimit?: number; // launches per day
  notificationBlock?: boolean;
  
  // Recovery Mode
  emergencyOverride?: boolean; // Allow during crisis
  gradualReduction?: {
    enabled: boolean;
    targetMinutes: number;
    reductionPerWeek: number;
  };
}

interface UsageTracking {
  appId: string;
  date: string;
  totalMinutes: number;
  sessions: {
    start: Date;
    end: Date;
    duration: number;
  }[];
  launches: number;
  violations: number;
}

export class AppAccessControlService {
  private restrictions: Map<string, AppRestriction> = new Map();
  private usageData: Map<string, UsageTracking[]> = new Map();
  private activeSession: Map<string, Date> = new Map();
  
  constructor() {
    this.loadRestrictions();
    this.initializeMonitoring();
  }

  /**
   * Add or update app restriction
   */
  setRestriction(restriction: AppRestriction): void {
    this.restrictions.set(restriction.appId, restriction);
    this.saveRestrictions();
    this.notifyDeviceAdmin(restriction);
  }

  /**
   * Check if app access is allowed
   */
  canAccessApp(appId: string): {
    allowed: boolean;
    reason?: string;
    remainingTime?: number;
  } {
    const restriction = this.restrictions.get(appId);
    if (!restriction) {
      return { allowed: true };
    }

    switch (restriction.restrictionType) {
      case 'blocked':
        return { 
          allowed: false, 
          reason: 'This app is blocked for your recovery' 
        };
        
      case 'timed':
        return this.checkTimedAccess(appId, restriction);
        
      case 'scheduled':
        return this.checkScheduledAccess(restriction);
        
      case 'limited':
        return this.checkLimitedAccess(appId, restriction);
        
      default:
        return { allowed: true };
    }
  }

  /**
   * Check timed access restrictions
   */
  private checkTimedAccess(
    appId: string, 
    restriction: AppRestriction
  ): { allowed: boolean; reason?: string; remainingTime?: number } {
    const today = new Date().toISOString().split('T')[0];
    const usage = this.getTodayUsage(appId);
    
    // Check daily limit
    if (restriction.settings.dailyLimit) {
      const remainingDaily = restriction.settings.dailyLimit - usage.totalMinutes;
      if (remainingDaily <= 0) {
        return {
          allowed: false,
          reason: `Daily limit of ${restriction.settings.dailyLimit} minutes reached`,
          remainingTime: 0
        };
      }
    }
    
    // Check session limit
    if (restriction.settings.sessionLimit && this.activeSession.has(appId)) {
      const sessionStart = this.activeSession.get(appId)!;
      const sessionMinutes = (Date.now() - sessionStart.getTime()) / 60000;
      
      if (sessionMinutes >= restriction.settings.sessionLimit) {
        return {
          allowed: false,
          reason: `Session limit of ${restriction.settings.sessionLimit} minutes reached`,
          remainingTime: 0
        };
      }
    }
    
    // Check cooldown period
    if (restriction.settings.cooldownPeriod && usage.sessions.length > 0) {
      const lastSession = usage.sessions[usage.sessions.length - 1];
      const timeSinceLastSession = (Date.now() - lastSession.end.getTime()) / 60000;
      
      if (timeSinceLastSession < restriction.settings.cooldownPeriod) {
        const waitTime = restriction.settings.cooldownPeriod - timeSinceLastSession;
        return {
          allowed: false,
          reason: `Cooldown period active. Wait ${Math.ceil(waitTime)} minutes`,
          remainingTime: 0
        };
      }
    }
    
    return { 
      allowed: true,
      remainingTime: restriction.settings.dailyLimit 
        ? restriction.settings.dailyLimit - usage.totalMinutes 
        : undefined
    };
  }

  /**
   * Check scheduled access restrictions
   */
  private checkScheduledAccess(
    restriction: AppRestriction
  ): { allowed: boolean; reason?: string } {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    
    // Check blocked days
    if (restriction.settings.blockedDays?.includes(currentDay)) {
      return {
        allowed: false,
        reason: 'App is blocked today'
      };
    }
    
    // Check allowed hours
    if (restriction.settings.allowedHours) {
      const isInAllowedHours = restriction.settings.allowedHours.some(period => {
        return currentTime >= period.start && currentTime <= period.end;
      });
      
      if (!isInAllowedHours) {
        return {
          allowed: false,
          reason: 'Outside allowed hours'
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Check limited access restrictions
   */
  private checkLimitedAccess(
    appId: string,
    restriction: AppRestriction
  ): { allowed: boolean; reason?: string } {
    const usage = this.getTodayUsage(appId);
    
    if (restriction.settings.launchLimit) {
      if (usage.launches >= restriction.settings.launchLimit) {
        return {
          allowed: false,
          reason: `Launch limit of ${restriction.settings.launchLimit} reached today`
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Start app session tracking
   */
  startSession(appId: string): void {
    if (!this.activeSession.has(appId)) {
      this.activeSession.set(appId, new Date());
      this.incrementLaunchCount(appId);
    }
  }

  /**
   * End app session tracking
   */
  endSession(appId: string): void {
    const sessionStart = this.activeSession.get(appId);
    if (sessionStart) {
      const sessionEnd = new Date();
      const duration = (sessionEnd.getTime() - sessionStart.getTime()) / 60000;
      
      this.recordSession(appId, {
        start: sessionStart,
        end: sessionEnd,
        duration
      });
      
      this.activeSession.delete(appId);
      this.checkGradualReduction(appId);
    }
  }

  /**
   * Get problematic app suggestions based on usage patterns
   */
  getProblematicApps(): {
    appId: string;
    appName: string;
    averageDailyUsage: number;
    category: string;
    suggestion: string;
  }[] {
    const problematicApps = [];
    
    for (const [appId, usageHistory] of this.usageData.entries()) {
      const last7Days = usageHistory.slice(-7);
      if (last7Days.length === 0) continue;
      
      const avgDaily = last7Days.reduce((sum, day) => sum + day.totalMinutes, 0) / last7Days.length;
      
      // Flag apps with high usage
      if (avgDaily > 120) { // More than 2 hours daily
        problematicApps.push({
          appId,
          appName: this.getAppName(appId),
          averageDailyUsage: avgDaily,
          category: this.getAppCategory(appId),
          suggestion: this.generateSuggestion(avgDaily)
        });
      }
    }
    
    return problematicApps.sort((a, b) => b.averageDailyUsage - a.averageDailyUsage);
  }

  /**
   * Generate usage suggestion
   */
  private generateSuggestion(avgMinutes: number): string {
    if (avgMinutes > 240) {
      return 'Consider blocking this app temporarily to break the habit';
    } else if (avgMinutes > 180) {
      return 'Set a daily limit of 60 minutes with gradual reduction';
    } else if (avgMinutes > 120) {
      return 'Schedule access to specific hours only';
    } else {
      return 'Monitor usage and set session limits';
    }
  }

  /**
   * Check and apply gradual reduction
   */
  private checkGradualReduction(appId: string): void {
    const restriction = this.restrictions.get(appId);
    if (!restriction?.settings.gradualReduction?.enabled) return;
    
    const { targetMinutes, reductionPerWeek } = restriction.settings.gradualReduction;
    const currentLimit = restriction.settings.dailyLimit || 0;
    
    // Check if it's time to reduce (weekly)
    const lastReduction = this.getLastReductionDate(appId);
    const daysSinceReduction = (Date.now() - lastReduction.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceReduction >= 7 && currentLimit > targetMinutes) {
      const newLimit = Math.max(targetMinutes, currentLimit - reductionPerWeek);
      restriction.settings.dailyLimit = newLimit;
      this.setRestriction(restriction);
      
      this.notifyUser({
        title: 'Access Limit Reduced',
        message: `${restriction.appName} daily limit reduced to ${newLimit} minutes`,
        type: 'progress'
      });
    }
  }

  /**
   * Get recovery-focused app recommendations
   */
  getRecoveryApps(): {
    name: string;
    description: string;
    category: string;
    url: string;
  }[] {
    return [
      {
        name: 'Headspace',
        description: 'Meditation and mindfulness for stress reduction',
        category: 'wellness',
        url: 'https://www.headspace.com'
      },
      {
        name: 'I Am Sober',
        description: 'Sobriety tracker and community support',
        category: 'recovery',
        url: 'https://iamsober.com'
      },
      {
        name: 'Calm',
        description: 'Sleep stories, meditation, and relaxation',
        category: 'wellness',
        url: 'https://www.calm.com'
      },
      {
        name: 'rethink',
        description: 'Addiction recovery coaching and support',
        category: 'recovery',
        url: 'https://www.rethinkapp.com'
      },
      {
        name: 'Forest',
        description: 'Stay focused and present with gamified productivity',
        category: 'productivity',
        url: 'https://www.forestapp.cc'
      }
    ];
  }

  /**
   * Emergency override for crisis situations
   */
  enableEmergencyOverride(duration: number = 30): void {
    // Temporarily disable all restrictions for crisis support access
    this.restrictions.forEach(restriction => {
      restriction.settings.emergencyOverride = true;
    });
    
    setTimeout(() => {
      this.restrictions.forEach(restriction => {
        restriction.settings.emergencyOverride = false;
      });
    }, duration * 60000);
    
    this.logEmergencyAccess();
  }

  /**
   * Get usage insights and patterns
   */
  getUsageInsights(appId: string): {
    peakUsageHours: string[];
    averageSessionLength: number;
    totalThisWeek: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    triggers: string[];
  } {
    const usageHistory = this.usageData.get(appId) || [];
    const thisWeek = usageHistory.slice(-7);
    
    // Analyze patterns
    const peakHours = this.analyzePeakHours(thisWeek);
    const avgSession = this.calculateAverageSession(thisWeek);
    const weekTotal = thisWeek.reduce((sum, day) => sum + day.totalMinutes, 0);
    const trend = this.analyzeTrend(usageHistory);
    const triggers = this.identifyTriggers(thisWeek);
    
    return {
      peakUsageHours: peakHours,
      averageSessionLength: avgSession,
      totalThisWeek: weekTotal,
      trend,
      triggers
    };
  }

  private loadRestrictions(): void {
    // Load from localStorage or database
    const saved = localStorage.getItem('app_restrictions');
    if (saved) {
      const data = JSON.parse(saved);
      this.restrictions = new Map(data);
    }
  }

  private saveRestrictions(): void {
    localStorage.setItem('app_restrictions', 
      JSON.stringify(Array.from(this.restrictions.entries()))
    );
  }

  private notifyDeviceAdmin(restriction: AppRestriction): void {
    // Send to native module for enforcement
    if (window.NativeModules?.SecondChance) {
      window.NativeModules.SecondChance.updateRestriction(restriction);
    }
  }

  private getTodayUsage(appId: string): UsageTracking {
    const today = new Date().toISOString().split('T')[0];
    const usageHistory = this.usageData.get(appId) || [];
    let todayUsage = usageHistory.find(u => u.date === today);
    
    if (!todayUsage) {
      todayUsage = {
        appId,
        date: today,
        totalMinutes: 0,
        sessions: [],
        launches: 0,
        violations: 0
      };
      usageHistory.push(todayUsage);
      this.usageData.set(appId, usageHistory);
    }
    
    return todayUsage;
  }

  private incrementLaunchCount(appId: string): void {
    const usage = this.getTodayUsage(appId);
    usage.launches++;
  }

  private recordSession(appId: string, session: any): void {
    const usage = this.getTodayUsage(appId);
    usage.sessions.push(session);
    usage.totalMinutes += session.duration;
  }

  private getAppName(appId: string): string {
    return this.restrictions.get(appId)?.appName || appId;
  }

  private getAppCategory(appId: string): string {
    return this.restrictions.get(appId)?.category || 'other';
  }

  private getLastReductionDate(appId: string): Date {
    // Track reduction dates in metadata
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
  }

  private notifyUser(notification: any): void {
    // Send notification to user
    console.log('Notification:', notification);
  }

  private logEmergencyAccess(): void {
    console.log('Emergency override activated');
  }

  private analyzePeakHours(usage: UsageTracking[]): string[] {
    // Analyze session times to find peak usage hours
    return ['14:00-16:00', '20:00-22:00'];
  }

  private calculateAverageSession(usage: UsageTracking[]): number {
    const allSessions = usage.flatMap(u => u.sessions);
    if (allSessions.length === 0) return 0;
    return allSessions.reduce((sum, s) => sum + s.duration, 0) / allSessions.length;
  }

  private analyzeTrend(history: UsageTracking[]): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 7) return 'stable';
    const recent = history.slice(-7).map(h => h.totalMinutes);
    const older = history.slice(-14, -7).map(h => h.totalMinutes);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.1) return 'increasing';
    if (recentAvg < olderAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  private identifyTriggers(usage: UsageTracking[]): string[] {
    // Identify potential triggers based on usage patterns
    return ['After work stress', 'Weekend boredom', 'Late night routine'];
  }

  private initializeMonitoring(): void {
    // Set up monitoring intervals
    setInterval(() => {
      this.checkActiveRestrictions();
    }, 60000); // Check every minute
  }

  private checkActiveRestrictions(): void {
    // Monitor and enforce active restrictions
    for (const [appId, sessionStart] of this.activeSession.entries()) {
      const canAccess = this.canAccessApp(appId);
      if (!canAccess.allowed) {
        this.endSession(appId);
        this.notifyDeviceAdmin(this.restrictions.get(appId)!);
      }
    }
  }
}

// Singleton instance
export const appAccessControl = new AppAccessControlService();

// Window declaration for native bridge
declare global {
  interface Window {
    NativeModules?: {
      SecondChance: {
        updateRestriction: (restriction: AppRestriction) => void;
      };
    };
  }
}