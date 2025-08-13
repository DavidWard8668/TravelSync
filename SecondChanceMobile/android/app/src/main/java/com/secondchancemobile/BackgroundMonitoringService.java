package com.secondchancemobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Background service for continuous monitoring
 * Runs as a foreground service to maintain persistent monitoring
 */
public class BackgroundMonitoringService extends Service {
    
    private static final String TAG = "BackgroundMonitoring";
    private static final String CHANNEL_ID = "monitoring_service";
    private static final int NOTIFICATION_ID = 1000;
    
    private SharedPreferences prefs;
    private ScheduledExecutorService scheduler;
    private Handler mainHandler;
    private Set<String> monitoredPackages = new HashSet<>();
    private boolean isMonitoring = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "Background Monitoring Service created");
        
        prefs = getSharedPreferences("SecondChancePrefs", MODE_PRIVATE);
        mainHandler = new Handler(Looper.getMainLooper());
        scheduler = Executors.newSingleThreadScheduledExecutor();
        
        createNotificationChannel();
        loadMonitoredApps();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Background monitoring service started");
        
        // Start foreground service
        startForeground(NOTIFICATION_ID, createNotification());
        
        // Begin monitoring
        startMonitoring();
        
        // Return sticky so service restarts if killed
        return START_STICKY;
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null; // This is not a bound service
    }
    
    private void startMonitoring() {
        if (isMonitoring) return;
        
        isMonitoring = true;
        
        // Schedule periodic checks
        scheduler.scheduleAtFixedRate(this::performMonitoringCheck, 0, 5, TimeUnit.SECONDS);
        
        // Schedule admin status sync
        scheduler.scheduleAtFixedRate(this::syncWithAdminService, 0, 30, TimeUnit.SECONDS);
        
        // Schedule cleanup tasks
        scheduler.scheduleAtFixedRate(this::performCleanupTasks, 60, 300, TimeUnit.SECONDS);
        
        Log.i(TAG, "Monitoring started for " + monitoredPackages.size() + " apps");
    }
    
    private void performMonitoringCheck() {
        try {
            // Check if accessibility service is still active
            if (!isAccessibilityServiceActive()) {
                Log.w(TAG, "Accessibility service inactive - requesting restart");
                requestAccessibilityServiceActivation();
            }
            
            // Check device admin status
            if (!isDeviceAdminActive()) {
                Log.w(TAG, "Device admin inactive - sending alert");
                sendDeviceAdminAlert();
            }
            
            // Update monitoring status
            updateMonitoringStatus();
            
            // Check for pending requests that need attention
            checkPendingRequests();
            
        } catch (Exception e) {
            Log.e(TAG, "Error during monitoring check", e);
        }
    }
    
    private void syncWithAdminService() {
        try {
            // Sync monitored apps
            loadMonitoredApps();
            
            // Sync admin requests status
            syncAdminRequests();
            
            // Send periodic status update to admin
            sendStatusUpdateToAdmin();
            
        } catch (Exception e) {
            Log.e(TAG, "Error syncing with admin service", e);
        }
    }
    
    private void performCleanupTasks() {
        try {
            // Clean up old logs
            cleanupUsageLogs();
            
            // Clean up old requests
            cleanupOldRequests();
            
            // Optimize storage
            optimizeLocalStorage();
            
            Log.d(TAG, "Cleanup tasks completed");
            
        } catch (Exception e) {
            Log.e(TAG, "Error during cleanup tasks", e);
        }
    }
    
    private boolean isAccessibilityServiceActive() {
        try {
            String serviceName = getPackageName() + "/" + AppMonitoringService.class.getName();
            String enabledServices = android.provider.Settings.Secure.getString(
                getContentResolver(),
                android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );
            
            return enabledServices != null && enabledServices.contains(serviceName);
        } catch (Exception e) {
            Log.e(TAG, "Failed to check accessibility service status", e);
            return false;
        }
    }
    
    private boolean isDeviceAdminActive() {
        try {
            android.app.admin.DevicePolicyManager devicePolicyManager = 
                (android.app.admin.DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
            android.content.ComponentName deviceAdminComponent = 
                new android.content.ComponentName(this, SecondChanceDeviceAdminReceiver.class);
            
            return devicePolicyManager.isAdminActive(deviceAdminComponent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to check device admin status", e);
            return false;
        }
    }
    
    private void requestAccessibilityServiceActivation() {
        try {
            // Send notification to user to re-enable accessibility service
            Intent notificationIntent = new Intent(this, AdminNotificationService.class);
            notificationIntent.putExtra("type", "accessibility_disabled");
            notificationIntent.putExtra("message", "Accessibility service disabled - monitoring compromised");
            startService(notificationIntent);
            
            // Update monitoring status
            prefs.edit().putString("monitoring_status", "accessibility_disabled").apply();
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to request accessibility service activation", e);
        }
    }
    
    private void sendDeviceAdminAlert() {
        try {
            // Alert admin that device admin was disabled
            Intent alertIntent = new Intent(this, AdminNotificationService.class);
            alertIntent.putExtra("type", "device_admin_disabled");
            alertIntent.putExtra("message", "Device admin disabled - uninstall protection compromised");
            startService(alertIntent);
            
            // Update status
            prefs.edit().putString("protection_status", "compromised").apply();
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to send device admin alert", e);
        }
    }
    
    private void updateMonitoringStatus() {
        try {
            JSONObject status = new JSONObject();
            status.put("timestamp", System.currentTimeMillis());
            status.put("accessibilityActive", isAccessibilityServiceActive());
            status.put("deviceAdminActive", isDeviceAdminActive());
            status.put("monitoredAppsCount", monitoredPackages.size());
            status.put("serviceRunning", true);
            
            prefs.edit().putString("monitoring_status", status.toString()).apply();
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to update monitoring status", e);
        }
    }
    
    private void checkPendingRequests() {
        try {
            String requestsJson = prefs.getString("admin_requests", "[]");
            JSONArray requests = new JSONArray(requestsJson);
            
            long currentTime = System.currentTimeMillis();
            boolean hasUrgentRequest = false;
            
            for (int i = 0; i < requests.length(); i++) {
                JSONObject request = requests.getJSONObject(i);
                String status = request.getString("status");
                long timestamp = request.getLong("timestamp");
                
                // Check for requests pending longer than 30 minutes
                if ("pending".equals(status) && (currentTime - timestamp) > 30 * 60 * 1000) {
                    hasUrgentRequest = true;
                    break;
                }
            }
            
            if (hasUrgentRequest) {
                // Send reminder to admin
                Intent reminderIntent = new Intent(this, AdminNotificationService.class);
                reminderIntent.putExtra("type", "pending_request_reminder");
                reminderIntent.putExtra("message", "You have pending requests awaiting response");
                startService(reminderIntent);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error checking pending requests", e);
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
            
            Log.d(TAG, "Loaded " + monitoredPackages.size() + " monitored apps");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to load monitored apps", e);
        }
    }
    
    private void syncAdminRequests() {
        try {
            // This would sync with a remote server if available
            // For now, just ensure local data integrity
            
            String requestsJson = prefs.getString("admin_requests", "[]");
            JSONArray requests = new JSONArray(requestsJson);
            
            // Process any auto-timeout rules
            long currentTime = System.currentTimeMillis();
            boolean modified = false;
            
            for (int i = 0; i < requests.length(); i++) {
                JSONObject request = requests.getJSONObject(i);
                String status = request.getString("status");
                long timestamp = request.getLong("timestamp");
                
                // Auto-deny requests older than 24 hours
                if ("pending".equals(status) && (currentTime - timestamp) > 24 * 60 * 60 * 1000) {
                    request.put("status", "auto_denied");
                    request.put("reason", "Request timed out after 24 hours");
                    modified = true;
                }
            }
            
            if (modified) {
                prefs.edit().putString("admin_requests", requests.toString()).apply();
                Log.i(TAG, "Auto-denied expired requests");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error syncing admin requests", e);
        }
    }
    
    private void sendStatusUpdateToAdmin() {
        try {
            // Send periodic status update every 6 hours
            long lastUpdate = prefs.getLong("last_status_update", 0);
            long currentTime = System.currentTimeMillis();
            
            if (currentTime - lastUpdate > 6 * 60 * 60 * 1000) {
                Intent statusIntent = new Intent(this, AdminNotificationService.class);
                statusIntent.putExtra("type", "status_update");
                statusIntent.putExtra("message", "Second Chance is active and monitoring " + 
                                    monitoredPackages.size() + " apps");
                startService(statusIntent);
                
                prefs.edit().putLong("last_status_update", currentTime).apply();
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending status update", e);
        }
    }
    
    private void cleanupUsageLogs() {
        try {
            String logsJson = prefs.getString("usage_logs", "[]");
            JSONArray logs = new JSONArray(logsJson);
            
            // Keep only logs from last 30 days
            long cutoffTime = System.currentTimeMillis() - (30L * 24 * 60 * 60 * 1000);
            JSONArray cleanedLogs = new JSONArray();
            
            for (int i = 0; i < logs.length(); i++) {
                JSONObject log = logs.getJSONObject(i);
                long timestamp = log.getLong("timestamp");
                
                if (timestamp > cutoffTime) {
                    cleanedLogs.put(log);
                }
            }
            
            if (cleanedLogs.length() != logs.length()) {
                prefs.edit().putString("usage_logs", cleanedLogs.toString()).apply();
                Log.d(TAG, "Cleaned " + (logs.length() - cleanedLogs.length()) + " old usage logs");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error cleaning usage logs", e);
        }
    }
    
    private void cleanupOldRequests() {
        try {
            String requestsJson = prefs.getString("admin_requests", "[]");
            JSONArray requests = new JSONArray(requestsJson);
            
            // Keep only requests from last 7 days
            long cutoffTime = System.currentTimeMillis() - (7L * 24 * 60 * 60 * 1000);
            JSONArray cleanedRequests = new JSONArray();
            
            for (int i = 0; i < requests.length(); i++) {
                JSONObject request = requests.getJSONObject(i);
                long timestamp = request.getLong("timestamp");
                
                if (timestamp > cutoffTime) {
                    cleanedRequests.put(request);
                }
            }
            
            if (cleanedRequests.length() != requests.length()) {
                prefs.edit().putString("admin_requests", cleanedRequests.toString()).apply();
                Log.d(TAG, "Cleaned " + (requests.length() - cleanedRequests.length()) + " old requests");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error cleaning old requests", e);
        }
    }
    
    private void optimizeLocalStorage() {
        try {
            // Compact shared preferences if needed
            SharedPreferences.Editor editor = prefs.edit();
            editor.apply(); // Force commit to optimize storage
            
            Log.d(TAG, "Storage optimization completed");
            
        } catch (Exception e) {
            Log.e(TAG, "Error optimizing storage", e);
        }
    }
    
    private Notification createNotification() {
        String channelId = CHANNEL_ID;
        String title = "Second Chance Protection Active";
        String content = "Monitoring " + monitoredPackages.size() + " apps for recovery support";
        
        return new NotificationCompat.Builder(this, channelId)
                .setContentTitle(title)
                .setContentText(content)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Second Chance Monitoring",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Background service for app monitoring");
            serviceChannel.enableVibration(false);
            serviceChannel.setSound(null, null);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        isMonitoring = false;
        
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
        }
        
        Log.i(TAG, "Background Monitoring Service destroyed");
    }
    
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Restart service if task is removed
        Intent restartServiceIntent = new Intent(getApplicationContext(), this.getClass());
        restartServiceIntent.setPackage(getPackageName());
        startService(restartServiceIntent);
        super.onTaskRemoved(rootIntent);
    }
}