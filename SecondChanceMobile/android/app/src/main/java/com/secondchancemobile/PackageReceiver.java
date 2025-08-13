package com.secondchancemobile;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Package receiver to monitor app installation and removal
 * Alerts admin if monitored apps are uninstalled or if suspicious apps are installed
 */
public class PackageReceiver extends BroadcastReceiver {
    
    private static final String TAG = "PackageReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String packageName = intent.getData() != null ? intent.getData().getSchemeSpecificPart() : "";
        
        Log.i(TAG, "Package event: " + action + " for package: " + packageName);
        
        try {
            if (Intent.ACTION_PACKAGE_ADDED.equals(action)) {
                handlePackageAdded(context, packageName);
            } else if (Intent.ACTION_PACKAGE_REMOVED.equals(action)) {
                handlePackageRemoved(context, packageName);
            } else if (Intent.ACTION_PACKAGE_INSTALL.equals(action)) {
                handlePackageInstall(context, packageName);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling package event: " + action, e);
        }
    }
    
    private void handlePackageAdded(Context context, String packageName) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("SecondChancePrefs", Context.MODE_PRIVATE);
            
            // Get app name
            PackageManager pm = context.getPackageManager();
            String appName = getAppName(pm, packageName);
            
            // Check if this is a potentially problematic app
            if (isSuspiciousApp(packageName, appName)) {
                // Alert admin about suspicious app installation
                alertAdminOfSuspiciousApp(context, packageName, appName, "installed");
                
                // Automatically add to monitoring if it matches certain criteria
                if (shouldAutoMonitor(packageName, appName)) {
                    addToMonitoredApps(context, packageName, appName);
                }
            }
            
            // Log package addition
            logPackageEvent(prefs, packageName, appName, "added");
            
            Log.i(TAG, "Package added: " + appName + " (" + packageName + ")");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to handle package added", e);
        }
    }
    
    private void handlePackageRemoved(Context context, String packageName) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("SecondChancePrefs", Context.MODE_PRIVATE);
            
            // Check if this was a monitored app
            boolean wasMonitored = isMonitoredApp(prefs, packageName);
            
            if (wasMonitored) {
                // Alert admin that a monitored app was uninstalled
                String appName = getStoredAppName(prefs, packageName);
                alertAdminOfMonitoredAppRemoval(context, packageName, appName);
                
                // Remove from monitored apps list
                removeFromMonitoredApps(context, packageName);
            }
            
            // Log package removal
            logPackageEvent(prefs, packageName, packageName, "removed");
            
            Log.i(TAG, "Package removed: " + packageName);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to handle package removed", e);
        }
    }
    
    private void handlePackageInstall(Context context, String packageName) {
        // This is called during installation process
        Log.d(TAG, "Package installation detected: " + packageName);
    }
    
    private boolean isSuspiciousApp(String packageName, String appName) {
        // List of app patterns that might be problematic for recovery
        String[] suspiciousPatterns = {
            "telegram", "snapchat", "whatsapp", "signal", "wickr",
            "vpn", "proxy", "tor", "onion",
            "dating", "tinder", "bumble", "grindr",
            "gambling", "casino", "poker", "bet",
            "drug", "weed", "cannabis", "pharmacy"
        };
        
        String lowerPackage = packageName.toLowerCase();
        String lowerName = appName.toLowerCase();
        
        for (String pattern : suspiciousPatterns) {
            if (lowerPackage.contains(pattern) || lowerName.contains(pattern)) {
                return true;
            }
        }
        
        return false;
    }
    
    private boolean shouldAutoMonitor(String packageName, String appName) {
        // Auto-monitor high-risk communication apps
        String[] autoMonitorPatterns = {
            "telegram", "snapchat", "signal", "wickr"
        };
        
        String lowerPackage = packageName.toLowerCase();
        String lowerName = appName.toLowerCase();
        
        for (String pattern : autoMonitorPatterns) {
            if (lowerPackage.contains(pattern) || lowerName.contains(pattern)) {
                return true;
            }
        }
        
        return false;
    }
    
    private boolean isMonitoredApp(SharedPreferences prefs, String packageName) {
        try {
            String monitoredJson = prefs.getString("monitored_apps", "[]");
            JSONArray monitored = new JSONArray(monitoredJson);
            
            for (int i = 0; i < monitored.length(); i++) {
                JSONObject app = monitored.getJSONObject(i);
                if (app.getString("packageName").equals(packageName)) {
                    return true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to check if app is monitored", e);
        }
        
        return false;
    }
    
    private void addToMonitoredApps(Context context, String packageName, String appName) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("SecondChancePrefs", Context.MODE_PRIVATE);
            String monitoredJson = prefs.getString("monitored_apps", "[]");
            JSONArray monitored = new JSONArray(monitoredJson);
            
            // Check if already monitored
            for (int i = 0; i < monitored.length(); i++) {
                JSONObject app = monitored.getJSONObject(i);
                if (app.getString("packageName").equals(packageName)) {
                    return; // Already monitored
                }
            }
            
            // Add new monitored app
            JSONObject newApp = new JSONObject();
            newApp.put("packageName", packageName);
            newApp.put("appName", appName);
            newApp.put("isBlocked", true);
            newApp.put("addedAutomatically", true);
            newApp.put("addedAt", System.currentTimeMillis());
            
            monitored.put(newApp);
            prefs.edit().putString("monitored_apps", monitored.toString()).apply();
            
            // Set as blocked by default
            prefs.edit().putBoolean("blocked_" + packageName, true).apply();
            
            // Notify admin
            Intent notificationIntent = new Intent(context, AdminNotificationService.class);
            notificationIntent.putExtra("type", "auto_monitored_app");
            notificationIntent.putExtra("packageName", packageName);
            notificationIntent.putExtra("appName", appName);
            context.startService(notificationIntent);
            
            Log.i(TAG, "Auto-added to monitoring: " + appName);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to add app to monitoring", e);
        }
    }
    
    private void removeFromMonitoredApps(Context context, String packageName) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("SecondChancePrefs", Context.MODE_PRIVATE);
            String monitoredJson = prefs.getString("monitored_apps", "[]");
            JSONArray monitored = new JSONArray(monitoredJson);
            JSONArray updated = new JSONArray();
            
            for (int i = 0; i < monitored.length(); i++) {
                JSONObject app = monitored.getJSONObject(i);
                if (!app.getString("packageName").equals(packageName)) {
                    updated.put(app);
                }
            }
            
            prefs.edit().putString("monitored_apps", updated.toString()).apply();
            
            // Remove block status
            prefs.edit().remove("blocked_" + packageName).apply();
            
            Log.i(TAG, "Removed from monitoring: " + packageName);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to remove app from monitoring", e);
        }
    }
    
    private void alertAdminOfSuspiciousApp(Context context, String packageName, String appName, String action) {
        try {
            Intent notificationIntent = new Intent(context, AdminNotificationService.class);
            notificationIntent.putExtra("type", "suspicious_app");
            notificationIntent.putExtra("packageName", packageName);
            notificationIntent.putExtra("appName", appName);
            notificationIntent.putExtra("action", action);
            notificationIntent.putExtra("message", 
                "Potentially risky app " + action + ": " + appName + ". Consider monitoring this app.");
            
            context.startService(notificationIntent);
            
            Log.w(TAG, "Admin alerted of suspicious app: " + appName);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to alert admin of suspicious app", e);
        }
    }
    
    private void alertAdminOfMonitoredAppRemoval(Context context, String packageName, String appName) {
        try {
            Intent notificationIntent = new Intent(context, AdminNotificationService.class);
            notificationIntent.putExtra("type", "monitored_app_removed");
            notificationIntent.putExtra("packageName", packageName);
            notificationIntent.putExtra("appName", appName);
            notificationIntent.putExtra("message", 
                "Monitored app uninstalled: " + appName + ". This may indicate progress or concerning behavior.");
            
            context.startService(notificationIntent);
            
            Log.w(TAG, "Admin alerted of monitored app removal: " + appName);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to alert admin of monitored app removal", e);
        }
    }
    
    private String getAppName(PackageManager pm, String packageName) {
        try {
            ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
            return pm.getApplicationLabel(appInfo).toString();
        } catch (PackageManager.NameNotFoundException e) {
            return packageName; // Return package name if app name not found
        }
    }
    
    private String getStoredAppName(SharedPreferences prefs, String packageName) {
        try {
            String monitoredJson = prefs.getString("monitored_apps", "[]");
            JSONArray monitored = new JSONArray(monitoredJson);
            
            for (int i = 0; i < monitored.length(); i++) {
                JSONObject app = monitored.getJSONObject(i);
                if (app.getString("packageName").equals(packageName)) {
                    return app.getString("appName");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to get stored app name", e);
        }
        
        return packageName;
    }
    
    private void logPackageEvent(SharedPreferences prefs, String packageName, String appName, String action) {
        try {
            JSONObject event = new JSONObject();
            event.put("packageName", packageName);
            event.put("appName", appName);
            event.put("action", action);
            event.put("timestamp", System.currentTimeMillis());
            
            // Add to package event log
            String eventsJson = prefs.getString("package_events", "[]");
            JSONArray events = new JSONArray(eventsJson);
            events.put(event);
            
            // Keep only last 100 events
            if (events.length() > 100) {
                JSONArray trimmed = new JSONArray();
                for (int i = events.length() - 100; i < events.length(); i++) {
                    trimmed.put(events.get(i));
                }
                events = trimmed;
            }
            
            prefs.edit().putString("package_events", events.toString()).apply();
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to log package event", e);
        }
    }
}