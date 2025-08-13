package com.secondchancemobile;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

/**
 * Boot receiver to automatically start monitoring after device restart
 * Ensures Second Chance protection continues after reboot
 */
public class BootReceiver extends BroadcastReceiver {
    
    private static final String TAG = "BootReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.i(TAG, "Boot receiver triggered with action: " + action);
        
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            Intent.ACTION_PACKAGE_REPLACED.equals(action)) {
            
            try {
                // Check if monitoring was previously enabled
                SharedPreferences prefs = context.getSharedPreferences("SecondChancePrefs", Context.MODE_PRIVATE);
                boolean wasMonitoringEnabled = prefs.getBoolean("monitoring_enabled", false);
                
                if (wasMonitoringEnabled) {
                    // Start background monitoring service
                    Intent serviceIntent = new Intent(context, BackgroundMonitoringService.class);
                    context.startForegroundService(serviceIntent);
                    
                    Log.i(TAG, "Started background monitoring service after boot");
                    
                    // Log boot event
                    logBootEvent(context);
                    
                    // Notify admin of successful restart
                    notifyAdminOfRestart(context);
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to restart monitoring after boot", e);
            }
        }
    }
    
    private void logBootEvent(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("SecondChancePrefs", Context.MODE_PRIVATE);
            
            // Record boot timestamp
            prefs.edit()
                .putLong("last_boot_time", System.currentTimeMillis())
                .putInt("boot_count", prefs.getInt("boot_count", 0) + 1)
                .apply();
                
            Log.i(TAG, "Boot event logged");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to log boot event", e);
        }
    }
    
    private void notifyAdminOfRestart(Context context) {
        try {
            // Send notification to admin about device restart
            Intent notificationIntent = new Intent(context, AdminNotificationService.class);
            notificationIntent.putExtra("type", "device_restart");
            notificationIntent.putExtra("message", "Second Chance protection restarted after device reboot");
            notificationIntent.putExtra("timestamp", System.currentTimeMillis());
            
            context.startService(notificationIntent);
            
            Log.i(TAG, "Admin notified of device restart");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to notify admin of restart", e);
        }
    }
}