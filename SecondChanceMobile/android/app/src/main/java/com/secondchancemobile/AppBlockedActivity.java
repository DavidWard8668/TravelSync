package com.secondchancemobile;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Activity shown when a monitored app is blocked
 * Provides options to request admin permission
 */
public class AppBlockedActivity extends Activity {
    
    private static final String TAG = "AppBlockedActivity";
    
    private String packageName;
    private String appName;
    private SharedPreferences prefs;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Get app details from intent
        Intent intent = getIntent();
        packageName = intent.getStringExtra("packageName");
        appName = intent.getStringExtra("appName");
        
        prefs = getSharedPreferences("SecondChancePrefs", MODE_PRIVATE);
        
        // Create simple layout programmatically
        createBlockedScreen();
        
        Log.i(TAG, "Showing block screen for " + appName);
    }
    
    private void createBlockedScreen() {
        // Create vertical layout
        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setPadding(50, 100, 50, 50);
        layout.setBackgroundColor(0xFF1a1a2e); // Dark blue background
        
        // App blocked title
        TextView titleText = new TextView(this);
        titleText.setText("🛡️ App Blocked");
        titleText.setTextSize(28);
        titleText.setTextColor(0xFFffffff);
        titleText.setGravity(android.view.Gravity.CENTER);
        titleText.setPadding(0, 0, 0, 30);
        layout.addView(titleText);
        
        // App name and explanation
        TextView appText = new TextView(this);
        appText.setText(appName + " is currently blocked as part of your recovery protection.");
        appText.setTextSize(18);
        appText.setTextColor(0xFFe94560);
        appText.setGravity(android.view.Gravity.CENTER);
        appText.setPadding(0, 0, 0, 40);
        layout.addView(appText);
        
        // Recovery message
        TextView recoveryText = new TextView(this);
        recoveryText.setText("Stay strong! You can request permission from your secondary admin if you truly need access.");
        recoveryText.setTextSize(16);
        recoveryText.setTextColor(0xFF0f3460);
        recoveryText.setGravity(android.view.Gravity.CENTER);
        recoveryText.setPadding(0, 0, 0, 50);
        layout.addView(recoveryText);
        
        // Request permission button
        Button requestButton = new Button(this);
        requestButton.setText("Request Permission");
        requestButton.setTextSize(18);
        requestButton.setBackgroundColor(0xFF16213e);
        requestButton.setTextColor(0xFFffffff);
        requestButton.setPadding(40, 20, 40, 20);
        requestButton.setOnClickListener(this::onRequestPermission);
        layout.addView(requestButton);
        
        // Add spacing
        View spacer = new View(this);
        spacer.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 40));
        layout.addView(spacer);
        
        // Crisis support button
        Button crisisButton = new Button(this);
        crisisButton.setText("Need Support? Call 988");
        crisisButton.setTextSize(16);
        crisisButton.setBackgroundColor(0xFF0f3460);
        crisisButton.setTextColor(0xFFffffff);
        crisisButton.setPadding(30, 15, 30, 15);
        crisisButton.setOnClickListener(this::onCrisisSupport);
        layout.addView(crisisButton);
        
        // Add more spacing
        View spacer2 = new View(this);
        spacer2.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 30));
        layout.addView(spacer2);
        
        // Back to home button
        Button homeButton = new Button(this);
        homeButton.setText("Return to Home");
        homeButton.setTextSize(14);
        homeButton.setBackgroundColor(0xFF533483);
        homeButton.setTextColor(0xFFffffff);
        homeButton.setPadding(20, 10, 20, 10);
        homeButton.setOnClickListener(this::onReturnHome);
        layout.addView(homeButton);
        
        setContentView(layout);
    }
    
    private void onRequestPermission(View view) {
        try {
            // Create admin request
            createAdminRequest();
            
            // Show confirmation
            Toast.makeText(this, "Permission request sent to your admin", Toast.LENGTH_LONG).show();
            
            // Return to home
            returnToHome();
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to create admin request", e);
            Toast.makeText(this, "Failed to send request. Please try again.", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void onCrisisSupport(View view) {
        try {
            // Call 988 Suicide & Crisis Lifeline
            Intent callIntent = new Intent(Intent.ACTION_DIAL);
            callIntent.setData(android.net.Uri.parse("tel:988"));
            startActivity(callIntent);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to open crisis support", e);
            Toast.makeText(this, "Crisis support: Call 988", Toast.LENGTH_LONG).show();
        }
    }
    
    private void onReturnHome(View view) {
        returnToHome();
    }
    
    private void returnToHome() {
        // Return to home screen
        Intent homeIntent = new Intent(Intent.ACTION_MAIN);
        homeIntent.addCategory(Intent.CATEGORY_HOME);
        homeIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(homeIntent);
        finish();
    }
    
    private void createAdminRequest() throws Exception {
        // Create request data
        JSONObject request = new JSONObject();
        request.put("id", System.currentTimeMillis());
        request.put("packageName", packageName);
        request.put("appName", appName);
        request.put("timestamp", System.currentTimeMillis());
        request.put("status", "pending");
        request.put("reason", "User requested access from blocked screen");
        request.put("urgency", "normal");
        
        // Save request locally
        saveAdminRequest(request);
        
        // Send notification to admin
        Intent notificationIntent = new Intent(this, AdminNotificationService.class);
        notificationIntent.putExtra("type", "app_access_request");
        notificationIntent.putExtra("packageName", packageName);
        notificationIntent.putExtra("appName", appName);
        notificationIntent.putExtra("timestamp", System.currentTimeMillis());
        startService(notificationIntent);
        
        Log.i(TAG, "Created admin request for " + appName);
    }
    
    private void saveAdminRequest(JSONObject request) throws Exception {
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
    }
    
    @Override
    public void onBackPressed() {
        // Prevent back button from bypassing block
        returnToHome();
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Handle new blocking requests
        packageName = intent.getStringExtra("packageName");
        appName = intent.getStringExtra("appName");
        
        // Update display if needed
        recreate();
    }
}