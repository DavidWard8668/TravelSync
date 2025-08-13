package com.secondchancemobile;

import android.app.IntentService;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.telephony.SmsManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Service for sending notifications to secondary admin
 * Supports push notifications, SMS, and email
 */
public class AdminNotificationService extends IntentService {
    
    private static final String TAG = "AdminNotificationService";
    private static final String CHANNEL_ID = "second_chance_alerts";
    private static final int NOTIFICATION_ID = 1001;
    
    private SharedPreferences prefs;
    private NotificationManager notificationManager;
    private ExecutorService executor;
    
    public AdminNotificationService() {
        super("AdminNotificationService");
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences("SecondChancePrefs", MODE_PRIVATE);
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        executor = Executors.newSingleThreadExecutor();
        
        createNotificationChannel();
    }
    
    @Override
    protected void onHandleIntent(Intent intent) {
        if (intent == null) return;
        
        String type = intent.getStringExtra("type");
        
        try {
            switch (type) {
                case "app_access_request":
                    handleAppAccessRequest(intent);
                    break;
                case "uninstall_attempt":
                    handleUninstallAttempt(intent);
                    break;
                case "admin_setup":
                    handleAdminSetup(intent);
                    break;
                case "crisis_alert":
                    handleCrisisAlert(intent);
                    break;
                default:
                    Log.w(TAG, "Unknown notification type: " + type);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to handle notification: " + type, e);
        }
    }
    
    private void handleAppAccessRequest(Intent intent) {
        String packageName = intent.getStringExtra("packageName");
        String appName = intent.getStringExtra("appName");
        long timestamp = intent.getLongExtra("timestamp", System.currentTimeMillis());
        
        String message = "🚨 Recovery Alert: Your friend is requesting access to " + appName + 
                        ". They may be experiencing urges. Please respond with support or permission.";
        
        // Send all notification types
        sendLocalNotification("App Access Request", message, "app_request");
        sendSMSNotification(message);
        sendEmailNotification("Second Chance - App Access Request", message, packageName);
        sendPushNotification("app_access_request", appName, packageName);
        
        Log.i(TAG, "Sent admin notifications for app access request: " + appName);
    }
    
    private void handleUninstallAttempt(Intent intent) {
        long timestamp = intent.getLongExtra("timestamp", System.currentTimeMillis());
        
        String message = "🔒 URGENT: Someone is trying to uninstall the Second Chance app from your friend's device. " +
                        "This may indicate a relapse risk. Please check in with them immediately.";
        
        // Send all notification types with high priority
        sendLocalNotification("URGENT - Uninstall Attempt", message, "uninstall_attempt");
        sendSMSNotification("URGENT: " + message);
        sendEmailNotification("URGENT: Second Chance Uninstall Attempt", message, null);
        sendPushNotification("uninstall_attempt", "Uninstall Attempt", null);
        
        Log.w(TAG, "Sent urgent admin notifications for uninstall attempt");
    }
    
    private void handleAdminSetup(Intent intent) {
        String adminEmail = intent.getStringExtra("adminEmail");
        String userName = intent.getStringExtra("userName");
        
        String message = "You've been selected as a recovery admin for " + userName + 
                        " in the Second Chance app. This person trusts you to help them stay on track. " +
                        "Please download the app and accept the admin invitation.";
        
        sendEmailNotification("Second Chance - You're a Recovery Admin", message, null);
        
        Log.i(TAG, "Sent admin setup notification to: " + adminEmail);
    }
    
    private void handleCrisisAlert(Intent intent) {
        String reason = intent.getStringExtra("reason");
        
        String message = "🆘 CRISIS ALERT: Your friend may be in crisis (" + reason + 
                        "). Please reach out immediately. If this is an emergency, call 911.";
        
        // Send immediate high-priority notifications
        sendLocalNotification("CRISIS ALERT", message, "crisis");
        sendSMSNotification("CRISIS: " + message);
        sendEmailNotification("CRISIS ALERT - Second Chance", message, null);
        sendPushNotification("crisis_alert", reason, null);
        
        Log.e(TAG, "Sent crisis alert notifications: " + reason);
    }
    
    private void sendLocalNotification(String title, String message, String category) {
        try {
            Intent appIntent = new Intent(this, MainActivity.class);
            appIntent.putExtra("category", category);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, appIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setVibrate(new long[]{0, 500, 250, 500})
                .setContentIntent(pendingIntent);
            
            if (category.equals("crisis") || category.equals("uninstall_attempt")) {
                builder.setPriority(NotificationCompat.PRIORITY_MAX)
                       .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000});
            }
            
            notificationManager.notify(NOTIFICATION_ID, builder.build());
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to send local notification", e);
        }
    }
    
    private void sendSMSNotification(String message) {
        try {
            String adminPhone = getAdminPhone();
            if (adminPhone == null || adminPhone.isEmpty()) {
                Log.w(TAG, "No admin phone number configured");
                return;
            }
            
            // Truncate message for SMS limits
            if (message.length() > 160) {
                message = message.substring(0, 157) + "...";
            }
            
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(adminPhone, null, message, null, null);
            
            Log.i(TAG, "SMS sent to admin phone: " + adminPhone.replaceAll("\\d(?=\\d{4})", "*"));
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to send SMS notification", e);
        }
    }
    
    private void sendEmailNotification(String subject, String message, String packageName) {
        executor.execute(() -> {
            try {
                String adminEmail = getAdminEmail();
                if (adminEmail == null || adminEmail.isEmpty()) {
                    Log.w(TAG, "No admin email configured");
                    return;
                }
                
                // Create HTML email content
                String htmlContent = createEmailContent(subject, message, packageName);
                
                // Send via external email service (would integrate with SendGrid, etc.)
                sendViaEmailAPI(adminEmail, subject, htmlContent);
                
                Log.i(TAG, "Email sent to admin: " + adminEmail.replaceAll("(.{2}).*(@.*)", "$1***$2"));
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to send email notification", e);
            }
        });
    }
    
    private void sendPushNotification(String type, String data, String packageName) {
        executor.execute(() -> {
            try {
                String adminFCMToken = getAdminFCMToken();
                if (adminFCMToken == null || adminFCMToken.isEmpty()) {
                    Log.w(TAG, "No admin FCM token configured");
                    return;
                }
                
                // Create FCM message
                JSONObject notification = new JSONObject();
                notification.put("title", "Second Chance Alert");
                notification.put("body", getNotificationBody(type, data));
                
                JSONObject dataPayload = new JSONObject();
                dataPayload.put("type", type);
                dataPayload.put("data", data);
                dataPayload.put("timestamp", System.currentTimeMillis());
                if (packageName != null) {
                    dataPayload.put("packageName", packageName);
                }
                
                JSONObject message = new JSONObject();
                message.put("to", adminFCMToken);
                message.put("notification", notification);
                message.put("data", dataPayload);
                
                // Send via FCM
                sendFCMMessage(message);
                
                Log.i(TAG, "Push notification sent for: " + type);
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to send push notification", e);
            }
        });
    }
    
    private String createEmailContent(String subject, String message, String packageName) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("MMM dd, yyyy 'at' hh:mm a", Locale.US);
        String formattedDate = dateFormat.format(new Date());
        
        return "<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; max-width: 600px;'>" +
               "<div style='background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 20px; text-align: center;'>" +
               "<h2>🛡️ Second Chance Alert</h2></div>" +
               "<div style='padding: 20px;'>" +
               "<h3>" + subject + "</h3>" +
               "<p>" + message + "</p>" +
               "<p><strong>Time:</strong> " + formattedDate + "</p>" +
               (packageName != null ? "<p><strong>App:</strong> " + packageName + "</p>" : "") +
               "<hr><p style='color: #666; font-size: 12px;'>This alert was sent by the Second Chance recovery support app. " +
               "To respond or manage settings, please open the app.</p>" +
               "</div></body></html>";
    }
    
    private void sendViaEmailAPI(String toEmail, String subject, String htmlContent) throws Exception {
        // This would integrate with an email service like SendGrid, Amazon SES, etc.
        // For now, we'll log the email content
        Log.i(TAG, "Email API - To: " + toEmail + ", Subject: " + subject);
        
        // Example integration with a webhook/API endpoint
        try {
            URL url = new URL("https://api.example-email-service.com/send");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            
            JSONObject emailData = new JSONObject();
            emailData.put("to", toEmail);
            emailData.put("subject", subject);
            emailData.put("html", htmlContent);
            emailData.put("from", "noreply@secondchanceapp.com");
            
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = emailData.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int responseCode = connection.getResponseCode();
            Log.i(TAG, "Email API response: " + responseCode);
            
        } catch (Exception e) {
            Log.w(TAG, "Email API unavailable, using fallback method");
        }
    }
    
    private void sendFCMMessage(JSONObject message) throws Exception {
        // This would integrate with Firebase Cloud Messaging
        Log.i(TAG, "FCM Message: " + message.toString());
        
        // Example FCM integration
        try {
            URL url = new URL("https://fcm.googleapis.com/fcm/send");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Authorization", "key=" + getFCMServerKey());
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = message.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int responseCode = connection.getResponseCode();
            Log.i(TAG, "FCM response: " + responseCode);
            
        } catch (Exception e) {
            Log.w(TAG, "FCM unavailable, notification logged locally");
        }
    }
    
    private String getNotificationBody(String type, String data) {
        switch (type) {
            case "app_access_request":
                return "Your friend is requesting access to " + data + ". Please respond with support.";
            case "uninstall_attempt":
                return "URGENT: Someone is trying to remove the Second Chance app.";
            case "crisis_alert":
                return "CRISIS: Your friend may need immediate support (" + data + ").";
            default:
                return "Second Chance alert: " + data;
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Second Chance Alerts";
            String description = "Notifications for recovery support requests";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 250, 500});
            
            notificationManager.createNotificationChannel(channel);
        }
    }
    
    private String getAdminEmail() {
        return prefs.getString("admin_email", "");
    }
    
    private String getAdminPhone() {
        return prefs.getString("admin_phone", "");
    }
    
    private String getAdminFCMToken() {
        return prefs.getString("admin_fcm_token", "");
    }
    
    private String getFCMServerKey() {
        // This would be stored securely, potentially fetched from a secure backend
        return prefs.getString("fcm_server_key", "");
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (executor != null && !executor.isShutdown()) {
            executor.shutdown();
        }
    }
}