package com.secondchancemobile;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashSet;
import java.util.Set;

/**
 * Accessibility Service for monitoring app usage
 * Detects when monitored apps are opened and blocks them if needed
 */
public class AppMonitoringService extends AccessibilityService {
    
    private static final String TAG = "AppMonitoringService";
    private Set<String> monitoredPackages = new HashSet<>();
    private SharedPreferences prefs;
    
    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        Log.i(TAG, "App Monitoring Service connected");
        
        // Configure accessibility service
        AccessibilityServiceInfo info = getServiceInfo();
        if (info != null) {
            info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
            info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
            info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS |
                        AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
            info.notificationTimeout = 100;
            setServiceInfo(info);
        }
        
        // Load monitored apps from preferences
        prefs = getSharedPreferences("SecondChancePrefs", MODE_PRIVATE);
        loadMonitoredApps();
        
        Log.i(TAG, "Monitoring " + monitoredPackages.size() + " apps");
    }
    
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            String packageName = event.getPackageName() != null ? event.getPackageName().toString() : "";
            
            // Check if this is a monitored app
            if (monitoredPackages.contains(packageName)) {
                handleMonitoredAppAccess(packageName, event);
            }
        }
    }
    
    private void handleMonitoredAppAccess(String packageName, AccessibilityEvent event) {
        Log.w(TAG, "Monitored app accessed: " + packageName);
        
        try {
            // Get app name for user-friendly display
            PackageManager pm = getPackageManager();
            ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
            String appName = pm.getApplicationLabel(appInfo).toString();
            
            // Check if app is currently blocked
            boolean isBlocked = isAppBlocked(packageName);
            
            if (isBlocked) {
                // Block the app immediately
                blockApp(packageName, appName);
                
                // Create admin request
                createAdminRequest(packageName, appName);
                
                // Return to home screen
                performGlobalAction(GLOBAL_ACTION_HOME);
                
                Log.i(TAG, "Blocked access to " + appName);
            } else {
                // App is allowed, log usage
                logAppUsage(packageName, appName, "opened");
                Log.i(TAG, "Allowed access to " + appName);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error handling app access for " + packageName, e);
        }
    }
    
    private boolean isAppBlocked(String packageName) {
        // Check if app is in blocked state
        return prefs.getBoolean("blocked_" + packageName, true); // Default to blocked
    }
    
    private void blockApp(String packageName, String appName) {
        try {
            // Show blocking notification/dialog
            Intent intent = new Intent(this, AppBlockedActivity.class);
            intent.putExtra("packageName", packageName);
            intent.putExtra("appName", appName);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to show app blocked dialog", e);
        }
    }
    
    private void createAdminRequest(String packageName, String appName) {
        try {
            // Create request data
            JSONObject request = new JSONObject();
            request.put("id", System.currentTimeMillis());
            request.put("packageName", packageName);
            request.put("appName", appName);
            request.put("timestamp", System.currentTimeMillis());
            request.put("status", "pending");
            request.put("reason", "App access detected");
            
            // Save request locally
            saveAdminRequest(request);
            
            // Send notification to admin
            sendAdminNotification(packageName, appName);
            
            Log.i(TAG, "Created admin request for " + appName);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to create admin request", e);
        }
    }
    
    private void saveAdminRequest(JSONObject request) {
        try {
            String requestsJson = prefs.getString("admin_requests", "[]");
            JSONArray requests = new JSONArray(requestsJson);
            requests.put(request);
            
            // Keep only last 100 requests
            if (requests.length() > 100) {
                JSONArray trimmedRequests = new JSONArray();
                for (int i = requests.length() - 100; i < requests.length(); i++) {
                    trimmedRequests.put(requests.get(i));
                }
                requests = trimmedRequests;
            }
            
            prefs.edit().putString("admin_requests", requests.toString()).apply();
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to save admin request", e);
        }
    }
    
    private void sendAdminNotification(String packageName, String appName) {
        try {
            // Send push notification to admin
            Intent intent = new Intent(this, AdminNotificationService.class);
            intent.putExtra("type", "app_access_request");
            intent.putExtra("packageName", packageName);
            intent.putExtra("appName", appName);
            intent.putExtra("timestamp", System.currentTimeMillis());
            startService(intent);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to send admin notification", e);
        }
    }
    
    private void logAppUsage(String packageName, String appName, String action) {
        try {
            JSONObject usage = new JSONObject();
            usage.put("packageName", packageName);
            usage.put("appName", appName);
            usage.put("action", action);
            usage.put("timestamp", System.currentTimeMillis());
            
            // Save usage log
            String logsJson = prefs.getString("usage_logs", "[]");
            JSONArray logs = new JSONArray(logsJson);
            logs.put(usage);
            
            // Keep only last 1000 logs
            if (logs.length() > 1000) {
                JSONArray trimmedLogs = new JSONArray();
                for (int i = logs.length() - 1000; i < logs.length(); i++) {
                    trimmedLogs.put(logs.get(i));
                }
                logs = trimmedLogs;
            }
            
            prefs.edit().putString("usage_logs", logs.toString()).apply();
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to log app usage", e);
        }
    }
    
    private void loadMonitoredApps() {
        try {
            String monitoredJson = prefs.getString("monitored_apps", "[]");
            JSONArray monitored = new JSONArray(monitoredJson);
            
            monitoredPackages.clear();
            for (int i = 0; i < monitored.length(); i++) {
                JSONObject app = monitored.getJSONObject(i);
                String packageName = app.getString("packageName");
                monitoredPackages.add(packageName);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to load monitored apps", e);
        }
    }
    
    @Override
    public void onInterrupt() {
        Log.w(TAG, "App Monitoring Service interrupted");
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "App Monitoring Service destroyed");
    }
    
    /**
     * Public method to update monitored apps from React Native
     */
    public static void updateMonitoredApps(String monitoredAppsJson) {
        Log.i(TAG, "Updating monitored apps");
        // This would be called from React Native bridge
    }
    
    /**
     * Public method to update app block status
     */
    public static void updateAppBlockStatus(String packageName, boolean isBlocked) {
        Log.i(TAG, "Updating block status for " + packageName + ": " + isBlocked);
        // This would be called from React Native bridge
    }
}