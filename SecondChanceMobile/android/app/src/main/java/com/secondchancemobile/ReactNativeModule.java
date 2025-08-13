package com.secondchancemobile;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;

/**
 * React Native Module for Second Chance App
 * Provides native Android functionality to React Native
 */
public class ReactNativeModule extends ReactContextBaseJavaModule {
    
    private static final String TAG = "SecondChanceModule";
    private static final String MODULE_NAME = "SecondChanceNative";
    
    private ReactApplicationContext reactContext;
    private SharedPreferences prefs;
    private DevicePolicyManager devicePolicyManager;
    private ComponentName deviceAdminComponent;
    
    public ReactNativeModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.prefs = context.getSharedPreferences("SecondChancePrefs", Context.MODE_PRIVATE);
        this.devicePolicyManager = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.deviceAdminComponent = new ComponentName(context, SecondChanceDeviceAdminReceiver.class);
    }
    
    @Override
    public String getName() {
        return MODULE_NAME;
    }
    
    /**
     * Get list of all installed user apps
     */
    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            
            WritableArray appArray = new WritableNativeArray();
            
            for (ApplicationInfo app : apps) {
                // Skip system apps
                if ((app.flags & ApplicationInfo.FLAG_SYSTEM) != 0) {
                    continue;
                }
                
                // Skip our own app
                if (app.packageName.equals(reactContext.getPackageName())) {
                    continue;
                }
                
                try {
                    WritableMap appInfo = new WritableNativeMap();
                    appInfo.putString("packageName", app.packageName);
                    appInfo.putString("appName", pm.getApplicationLabel(app).toString());
                    appInfo.putString("versionName", pm.getPackageInfo(app.packageName, 0).versionName);
                    appInfo.putBoolean("isSystemApp", (app.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                    
                    appArray.pushMap(appInfo);
                } catch (Exception e) {
                    Log.w(TAG, "Failed to get info for package: " + app.packageName);
                }
            }
            
            promise.resolve(appArray);
            Log.i(TAG, "Retrieved " + appArray.size() + " installed apps");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to get installed apps", e);
            promise.reject("GET_APPS_ERROR", "Failed to retrieve installed apps", e);
        }
    }
    
    /**
     * Request device admin privileges
     */
    @ReactMethod
    public void requestDeviceAdminPrivileges(Promise promise) {
        try {
            if (devicePolicyManager.isAdminActive(deviceAdminComponent)) {
                promise.resolve(true);
                return;
            }
            
            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, deviceAdminComponent);
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, 
                "Second Chance needs device admin privileges to prevent uninstallation during recovery.");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            reactContext.startActivity(intent);
            promise.resolve(false); // Will be true once user grants permission
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to request device admin privileges", e);
            promise.reject("DEVICE_ADMIN_ERROR", "Failed to request device admin privileges", e);
        }
    }
    
    /**
     * Check if device admin is active
     */
    @ReactMethod
    public void isDeviceAdminActive(Promise promise) {
        try {
            boolean isActive = devicePolicyManager.isAdminActive(deviceAdminComponent);
            promise.resolve(isActive);
        } catch (Exception e) {
            promise.reject("DEVICE_ADMIN_CHECK_ERROR", "Failed to check device admin status", e);
        }
    }
    
    /**
     * Set uninstall PIN
     */
    @ReactMethod
    public void setUninstallPin(String pin, Promise promise) {
        try {
            prefs.edit().putString("uninstall_pin", pin).apply();
            promise.resolve(true);
            Log.i(TAG, "Uninstall PIN set");
        } catch (Exception e) {
            Log.e(TAG, "Failed to set uninstall PIN", e);
            promise.reject("PIN_ERROR", "Failed to set uninstall PIN", e);
        }
    }
    
    /**
     * Set monitored apps
     */
    @ReactMethod
    public void setMonitoredApps(String monitoredAppsJson, Promise promise) {
        try {
            prefs.edit().putString("monitored_apps", monitoredAppsJson).apply();
            
            // Update the monitoring service
            AppMonitoringService.updateMonitoredApps(monitoredAppsJson);
            
            promise.resolve(true);
            Log.i(TAG, "Monitored apps updated");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to set monitored apps", e);
            promise.reject("MONITORED_APPS_ERROR", "Failed to set monitored apps", e);
        }
    }
    
    /**
     * Update app block status
     */
    @ReactMethod
    public void updateAppBlockStatus(String packageName, boolean isBlocked, Promise promise) {
        try {
            prefs.edit().putBoolean("blocked_" + packageName, isBlocked).apply();
            
            // Update the monitoring service
            AppMonitoringService.updateAppBlockStatus(packageName, isBlocked);
            
            promise.resolve(true);
            Log.i(TAG, "Updated block status for " + packageName + ": " + isBlocked);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to update app block status", e);
            promise.reject("BLOCK_STATUS_ERROR", "Failed to update app block status", e);
        }
    }
    
    /**
     * Get admin requests
     */
    @ReactMethod
    public void getAdminRequests(Promise promise) {
        try {
            String requestsJson = prefs.getString("admin_requests", "[]");
            promise.resolve(requestsJson);
        } catch (Exception e) {
            Log.e(TAG, "Failed to get admin requests", e);
            promise.reject("REQUESTS_ERROR", "Failed to get admin requests", e);
        }
    }
    
    /**
     * Update request status (approve/deny)
     */
    @ReactMethod
    public void updateRequestStatus(String requestId, String status, Promise promise) {
        try {
            String requestsJson = prefs.getString("admin_requests", "[]");
            JSONArray requests = new JSONArray(requestsJson);
            
            for (int i = 0; i < requests.length(); i++) {
                JSONObject request = requests.getJSONObject(i);
                if (request.getString("id").equals(requestId)) {
                    request.put("status", status);
                    request.put("respondedAt", System.currentTimeMillis());
                    
                    // If approved, unblock the app temporarily
                    if ("approved".equals(status)) {
                        String packageName = request.getString("packageName");
                        updateAppBlockStatus(packageName, false, null);
                    }
                    
                    break;
                }
            }
            
            prefs.edit().putString("admin_requests", requests.toString()).apply();
            promise.resolve(true);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to update request status", e);
            promise.reject("REQUEST_UPDATE_ERROR", "Failed to update request status", e);
        }
    }
    
    /**
     * Check if accessibility service is enabled
     */
    @ReactMethod
    public void isAccessibilityServiceEnabled(Promise promise) {
        try {
            String serviceName = reactContext.getPackageName() + "/" + AppMonitoringService.class.getName();
            String enabledServices = Settings.Secure.getString(
                reactContext.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );
            
            boolean isEnabled = enabledServices != null && enabledServices.contains(serviceName);
            promise.resolve(isEnabled);
            
        } catch (Exception e) {
            promise.reject("ACCESSIBILITY_CHECK_ERROR", "Failed to check accessibility service", e);
        }
    }
    
    /**
     * Open accessibility settings
     */
    @ReactMethod
    public void openAccessibilitySettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SETTINGS_ERROR", "Failed to open accessibility settings", e);
        }
    }
    
    /**
     * Send admin notification
     */
    @ReactMethod
    public void sendAdminNotification(String type, String data, Promise promise) {
        try {
            Intent intent = new Intent(reactContext, AdminNotificationService.class);
            intent.putExtra("type", type);
            intent.putExtra("data", data);
            reactContext.startService(intent);
            
            promise.resolve(true);
            Log.i(TAG, "Admin notification sent: " + type);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to send admin notification", e);
            promise.reject("NOTIFICATION_ERROR", "Failed to send admin notification", e);
        }
    }
    
    /**
     * Get app usage statistics
     */
    @ReactMethod
    public void getUsageStats(Promise promise) {
        try {
            String logsJson = prefs.getString("usage_logs", "[]");
            promise.resolve(logsJson);
        } catch (Exception e) {
            Log.e(TAG, "Failed to get usage stats", e);
            promise.reject("STATS_ERROR", "Failed to get usage stats", e);
        }
    }
}