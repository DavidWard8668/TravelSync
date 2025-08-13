package com.secondchancemobile;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.Toast;

/**
 * Device Admin Receiver for Second Chance App
 * Provides uninstall protection and device management capabilities
 */
public class SecondChanceDeviceAdminReceiver extends DeviceAdminReceiver {
    
    private static final String TAG = "SecondChanceAdmin";
    
    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.i(TAG, "Second Chance Device Admin enabled");
        Toast.makeText(context, "Second Chance protection enabled", Toast.LENGTH_SHORT).show();
        
        // Start background monitoring service
        Intent serviceIntent = new Intent(context, BackgroundMonitoringService.class);
        context.startForegroundService(serviceIntent);
    }
    
    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Log.i(TAG, "Second Chance Device Admin disabled");
        Toast.makeText(context, "Second Chance protection disabled", Toast.LENGTH_SHORT).show();
        
        // Stop monitoring service
        Intent serviceIntent = new Intent(context, BackgroundMonitoringService.class);
        context.stopService(serviceIntent);
    }
    
    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        Log.w(TAG, "Device admin disable requested");
        // This message will be shown when user tries to disable device admin
        return "Disabling Second Chance will remove recovery protection. Are you sure?";
    }
    
    @Override
    public void onPasswordChanged(Context context, Intent intent) {
        super.onPasswordChanged(context, intent);
        Log.i(TAG, "Device password changed");
    }
    
    @Override
    public void onPasswordFailed(Context context, Intent intent) {
        super.onPasswordFailed(context, intent);
        Log.w(TAG, "Device password failed");
    }
    
    @Override
    public void onPasswordSucceeded(Context context, Intent intent) {
        super.onPasswordSucceeded(context, intent);
        Log.i(TAG, "Device password succeeded");
    }
    
    /**
     * Called when user attempts to uninstall the app
     */
    public static boolean isUninstallBlocked(Context context, String pin) {
        // Verify PIN before allowing uninstall
        // This would check against stored PIN in SharedPreferences
        android.content.SharedPreferences prefs = context.getSharedPreferences("SecondChancePrefs", Context.MODE_PRIVATE);
        String storedPin = prefs.getString("uninstall_pin", "");
        
        boolean pinMatches = storedPin.equals(pin);
        
        if (!pinMatches) {
            Log.w(TAG, "Uninstall attempt with incorrect PIN");
            Toast.makeText(context, "Incorrect PIN. Uninstall blocked.", Toast.LENGTH_LONG).show();
            
            // Notify admin of uninstall attempt
            notifyAdminOfUninstallAttempt(context);
        }
        
        return !pinMatches;
    }
    
    private static void notifyAdminOfUninstallAttempt(Context context) {
        try {
            // Send notification to admin about uninstall attempt
            Intent intent = new Intent(context, AdminNotificationService.class);
            intent.putExtra("type", "uninstall_attempt");
            intent.putExtra("timestamp", System.currentTimeMillis());
            context.startService(intent);
            
            Log.i(TAG, "Admin notified of uninstall attempt");
        } catch (Exception e) {
            Log.e(TAG, "Failed to notify admin of uninstall attempt", e);
        }
    }
}