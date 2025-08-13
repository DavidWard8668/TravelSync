import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';

const supabaseUrl = Config.SUPABASE_URL || '';
const supabaseAnonKey = Config.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types for Second Chance App
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'user' | 'admin';
          admin_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: 'user' | 'admin';
          admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'user' | 'admin';
          admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      monitored_apps: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          package_name: string;
          is_blocked: boolean;
          last_used: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          package_name: string;
          is_blocked?: boolean;
          last_used?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          package_name?: string;
          is_blocked?: boolean;
          last_used?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_requests: {
        Row: {
          id: string;
          user_id: string;
          admin_id: string;
          app_name: string;
          package_name: string;
          status: 'pending' | 'approved' | 'denied';
          reason: string;
          admin_note: string | null;
          requested_at: string;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          admin_id: string;
          app_name: string;
          package_name: string;
          status?: 'pending' | 'approved' | 'denied';
          reason: string;
          admin_note?: string | null;
          requested_at?: string;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          admin_id?: string;
          app_name?: string;
          package_name?: string;
          status?: 'pending' | 'approved' | 'denied';
          reason?: string;
          admin_note?: string | null;
          requested_at?: string;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: any;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: any;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: any;
          read?: boolean;
          created_at?: string;
        };
      };
      app_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          app_name: string;
          package_name: string;
          action: 'opened' | 'closed' | 'blocked' | 'approved';
          timestamp: string;
          duration: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          app_name: string;
          package_name: string;
          action: 'opened' | 'closed' | 'blocked' | 'approved';
          timestamp?: string;
          duration?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          app_name?: string;
          package_name?: string;
          action?: 'opened' | 'closed' | 'blocked' | 'approved';
          timestamp?: string;
          duration?: number | null;
          created_at?: string;
        };
      };
    };
  };
}

// Utility functions for Second Chance app
export const secondChanceService = {
  // User management
  async createUser(email: string, role: 'user' | 'admin' = 'user', adminId?: string) {
    const { data, error } = await supabase.from('users').insert([
      { email, role, admin_id: adminId }
    ]).select().single();
    
    if (error) throw error;
    return data;
  },

  async getUserWithAdmin(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        admin:users!admin_id(email, id)
      `)
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // App monitoring
  async addMonitoredApp(userId: string, appName: string, packageName: string) {
    const { data, error } = await supabase.from('monitored_apps').insert([
      { user_id: userId, name: appName, package_name: packageName }
    ]).select().single();
    
    if (error) throw error;
    return data;
  },

  async getMonitoredApps(userId: string) {
    const { data, error } = await supabase
      .from('monitored_apps')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async updateAppBlockStatus(appId: string, isBlocked: boolean) {
    const { data, error } = await supabase
      .from('monitored_apps')
      .update({ is_blocked: isBlocked, updated_at: new Date().toISOString() })
      .eq('id', appId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Admin requests
  async createAdminRequest(
    userId: string,
    adminId: string,
    appName: string,
    packageName: string,
    reason: string
  ) {
    const { data, error } = await supabase.from('admin_requests').insert([
      {
        user_id: userId,
        admin_id: adminId,
        app_name: appName,
        package_name: packageName,
        reason,
        requested_at: new Date().toISOString()
      }
    ]).select().single();
    
    if (error) throw error;
    return data;
  },

  async getPendingRequests(adminId: string) {
    const { data, error } = await supabase
      .from('admin_requests')
      .select(`
        *,
        user:users!user_id(email, id)
      `)
      .eq('admin_id', adminId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async respondToRequest(requestId: string, status: 'approved' | 'denied', adminNote?: string) {
    const { data, error } = await supabase
      .from('admin_requests')
      .update({
        status,
        admin_note: adminNote,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Notifications
  async sendNotification(userId: string, type: string, title: string, message: string, data?: any) {
    const { data, error } = await supabase.from('notifications').insert([
      { user_id: userId, type, title, message, data }
    ]).select().single();
    
    if (error) throw error;
    return data;
  },

  async getNotifications(userId: string, unreadOnly: boolean = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
    return data;
  },

  // Usage logging
  async logAppUsage(
    userId: string,
    appName: string,
    packageName: string,
    action: 'opened' | 'closed' | 'blocked' | 'approved',
    duration?: number
  ) {
    const { data, error } = await supabase.from('app_usage_logs').insert([
      {
        user_id: userId,
        app_name: appName,
        package_name: packageName,
        action,
        timestamp: new Date().toISOString(),
        duration
      }
    ]).select().single();
    
    if (error) throw error;
    return data;
  },

  async getUsageStats(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('app_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Real-time subscriptions
  subscribeToAdminRequests(adminId: string, callback: (payload: any) => void) {
    return supabase
      .channel('admin_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_requests',
          filter: `admin_id=eq.${adminId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }
};