# 📱 REACT NATIVE AUTONOMOUS DEVELOPMENT SETUP
# Complete mobile app development environment for Second Chance and other apps

Write-Host "📱 REACT NATIVE AUTONOMOUS DEVELOPMENT SETUP" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check prerequisites
Write-Host "🔍 Checking mobile development prerequisites..." -ForegroundColor Yellow

$prerequisites = @(
    @{name="Node.js"; cmd="node --version"; required=$true},
    @{name="npm"; cmd="npm --version"; required=$true},
    @{name="Git"; cmd="git --version"; required=$true},
    @{name="Claude Code"; cmd="claude --version"; required=$true},
    @{name="React Native CLI"; cmd="npx react-native --version"; required=$false},
    @{name="Android Studio"; cmd="adb --version"; required=$false},
    @{name="Xcode"; cmd="xcodebuild -version"; required=$false}
)

$allGood = $true
foreach ($prereq in $prerequisites) {
    try {
        $version = Invoke-Expression $prereq.cmd 2>$null
        Write-Host "   ✅ $($prereq.name): Found" -ForegroundColor Green
    } catch {
        if ($prereq.required) {
            Write-Host "   ❌ $($prereq.name): Required but not found" -ForegroundColor Red
            $allGood = $false
        } else {
            Write-Host "   ⚠️ $($prereq.name): Optional, not found" -ForegroundColor Yellow
        }
    }
}

if (-not $allGood) {
    Write-Host "❌ Required prerequisites missing. Please install:" -ForegroundColor Red
    Write-Host "   - Node.js: https://nodejs.org/" -ForegroundColor White
    Write-Host "   - Git: https://git-scm.com/" -ForegroundColor White
    Write-Host "   - Claude Code: npm install -g claude-code" -ForegroundColor White
    exit 1
}

# Create mobile development directory structure
Write-Host "📁 Creating mobile development structure..." -ForegroundColor Yellow
$devPath = "C:\Users\David\Development"
$mobileAutonomousPath = "$devPath\mobile-autonomous-apps"

New-Item -ItemType Directory -Force -Path $devPath
New-Item -ItemType Directory -Force -Path $mobileAutonomousPath
New-Item -ItemType Directory -Force -Path "$mobileAutonomousPath\templates"
New-Item -ItemType Directory -Force -Path "$mobileAutonomousPath\scripts"
New-Item -ItemType Directory -Force -Path "$mobileAutonomousPath\logs"
New-Item -ItemType Directory -Force -Path "$mobileAutonomousPath\assets"

Set-Location $mobileAutonomousPath

# Install React Native and mobile-specific MCP servers
Write-Host "📱 Installing React Native and mobile development tools..." -ForegroundColor Yellow

$mobilePackages = @(
    "react-native-cli",
    "@react-native-community/cli",
    "expo-cli",
    "@expo/cli",
    "eas-cli"
)

foreach ($package in $mobilePackages) {
    try {
        Write-Host "   Installing $package..." -ForegroundColor Gray
        npm install -g $package
        Write-Host "   ✅ $package installed" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Failed to install $package" -ForegroundColor Yellow
    }
}

# Install mobile-specific MCP servers
Write-Host "🔧 Installing mobile MCP servers..." -ForegroundColor Yellow

$mobileMcpServers = @(
    @{name="github"; command="npx -y @modelcontextprotocol/github-mcp"},
    @{name="supabase"; command="npx -y @supabase/mcp-server-supabase@latest"},
    @{name="firebase"; command="npx -y @firebase/mcp-server"},
    @{name="expo"; command="npx -y @expo/mcp-server"},
    @{name="app-store-connect"; command="npx -y @apple/app-store-connect-mcp"},
    @{name="google-play"; command="npx -y @google/play-console-mcp"},
    @{name="device-testing"; command="npx -y @mobile/device-testing-mcp"},
    @{name="analytics"; command="npx -y @mobile/analytics-mcp"}
)

foreach ($server in $mobileMcpServers) {
    try {
        Write-Host "   Installing $($server.name)..." -ForegroundColor Gray
        $installCmd = "claude mcp add $($server.name) -- cmd /c $($server.command)"
        Invoke-Expression $installCmd
        Write-Host "   ✅ $($server.name) installed" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Failed to install $($server.name): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Create mobile environment variables template
Write-Host "🔑 Creating mobile environment template..." -ForegroundColor Yellow

$mobileEnvTemplate = @"
# MOBILE AUTONOMOUS DEVELOPMENT ENVIRONMENT VARIABLES
# Copy this to .env in your project root and fill in your values

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Firebase Configuration (Alternative to Supabase)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# App Store Connect (iOS Deployment)
APP_STORE_CONNECT_API_KEY_ID=your_api_key_id
APP_STORE_CONNECT_API_ISSUER_ID=your_issuer_id
APP_STORE_CONNECT_API_KEY_PATH=./AuthKey_XXXXXXXX.p8

# Google Play Console (Android Deployment)
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH=./google-play-key.json

# Expo Configuration
EXPO_TOKEN=your_expo_access_token
EAS_PROJECT_ID=your_eas_project_id

# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token

# Analytics & Monitoring
SENTRY_DSN=your_sentry_dsn
AMPLITUDE_API_KEY=your_amplitude_api_key
MIXPANEL_TOKEN=your_mixpanel_token

# Push Notifications
FCM_SERVER_KEY=your_firebase_cloud_messaging_key
APNS_KEY_ID=your_apple_push_key_id
APNS_TEAM_ID=your_apple_team_id

# Development Settings
NODE_ENV=development
DEBUG=true
DEVELOPMENT_TEAM=your_apple_developer_team_id
BUNDLE_IDENTIFIER_PREFIX=com.yourcompany
"@

$mobileEnvTemplate | Out-File -FilePath "templates\.env.template" -Encoding UTF8

# Create React Native package.json template
Write-Host "📦 Creating React Native package template..." -ForegroundColor Yellow

$mobilePackageTemplate = @"
{
  "name": "autonomous-mobile-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint .",
    "start": "react-native start",
    "test": "jest",
    "test:e2e": "detox test",
    "test:e2e:build": "detox build",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:ios": "xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Release",
    "deploy:android": "cd android && ./gradlew bundleRelease",
    "deploy:ios": "eas build --platform ios",
    "expo:start": "expo start",
    "expo:android": "expo run:android",
    "expo:ios": "expo run:ios",
    "expo:build": "eas build",
    "expo:submit": "eas submit"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@supabase/supabase-js": "^2.38.0",
    "@react-native-async-storage/async-storage": "^1.19.0",
    "react-native-screens": "^3.25.0",
    "react-native-safe-area-context": "^4.7.0",
    "react-native-gesture-handler": "^2.13.0",
    "react-native-reanimated": "^3.5.0",
    "react-native-vector-icons": "^10.0.0",
    "react-native-device-info": "^10.11.0",
    "react-native-permissions": "^3.9.0",
    "react-native-push-notification": "^8.1.1",
    "@react-native-firebase/app": "^18.5.0",
    "@react-native-firebase/analytics": "^18.5.0",
    "@react-native-firebase/crashlytics": "^18.5.0",
    "@sentry/react-native": "^5.11.0",
    "react-native-config": "^1.5.0",
    "react-native-keychain": "^8.1.0",
    "react-native-biometrics": "^3.0.1"
  },
  "devDependencies": {
    "@babel/core": "^7.22.0",
    "@babel/preset-env": "^7.22.0",
    "@babel/runtime": "^7.22.0",
    "@react-native-community/eslint-config": "^3.2.0",
    "@types/jest": "^29.5.0",
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.72.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "babel-jest": "^29.5.0",
    "detox": "^20.13.0",
    "eslint": "^8.45.0",
    "jest": "^29.5.0",
    "metro-react-native-babel-preset": "^0.77.0",
    "prettier": "^3.0.0",
    "react-test-renderer": "^18.2.0",
    "typescript": "^5.1.0"
  },
  "detox": {
    "configurations": {
      "android.emu.debug": {
        "device": "android.emulator",
        "app": "android.debug"
      },
      "ios.sim.debug": {
        "device": "ios.simulator",
        "app": "ios.debug"
      }
    }
  }
}
"@

$mobilePackageTemplate | Out-File -FilePath "templates\package.json" -Encoding UTF8

# Create mobile-specific GitHub Actions workflow
Write-Host "⚙️ Creating mobile CI/CD templates..." -ForegroundColor Yellow

New-Item -ItemType Directory -Force -Path "templates\.github\workflows"

$mobileCiTemplate = @"
name: Mobile CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Lint
        run: npm run lint
        
      - name: Unit tests
        run: npm run test
        
      - name: Build Android (Debug)
        run: |
          cd android
          ./gradlew assembleDebug
          
  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build Android Release
        run: |
          cd android
          ./gradlew bundleRelease
          
      - name: Upload Android Artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: android/app/build/outputs/bundle/release/
          
  build-ios:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install CocoaPods
        run: |
          cd ios
          pod install
          
      - name: Build iOS
        run: |
          xcodebuild -workspace ios/App.xcworkspace \
            -scheme App \
            -configuration Release \
            -destination generic/platform=iOS \
            -archivePath App.xcarchive \
            archive
            
      - name: Upload iOS Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ios-release
          path: App.xcarchive
          
  e2e-test:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build Detox
        run: npm run test:e2e:build
        
      - name: Run E2E Tests
        run: npm run test:e2e
"@

$mobileCiTemplate | Out-File -FilePath "templates\.github\workflows\mobile-ci-cd.yml" -Encoding UTF8

# Create Second Chance specific mobile templates
Write-Host "🎯 Creating Second Chance app templates..." -ForegroundColor Yellow

$secondChanceAppTemplate = @"
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Switch,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { supabase } from './lib/supabase';
import DeviceInfo from 'react-native-device-info';
import { checkMultiple, requestMultiple, PERMISSIONS } from 'react-native-permissions';

interface MonitoredApp {
  id: string;
  name: string;
  packageName: string;
  isBlocked: boolean;
  lastUsed: string;
}

interface AdminRequest {
  id: string;
  appName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied';
  reason: string;
}

export default function SecondChanceApp() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>([]);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);

  useEffect(() => {
    setupDeviceMonitoring();
    loadMonitoredApps();
    if (isAdmin) {
      loadAdminRequests();
    }
  }, [isAdmin]);

  const setupDeviceMonitoring = async () => {
    try {
      // Request necessary permissions
      const permissions = await requestMultiple([
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY,
      ]);

      // Initialize app monitoring
      await initializeAppMonitoring();
    } catch (error) {
      console.error('Failed to setup monitoring:', error);
    }
  };

  const initializeAppMonitoring = async () => {
    // Monitor for Snapchat and Telegram installations
    const targetApps = [
      'com.snapchat.android',
      'org.telegram.messenger',
      'com.whatsapp',
      'com.facebook.katana',
      'com.instagram.android',
    ];

    // Set up real-time monitoring
    setInterval(async () => {
      await checkForTargetApps(targetApps);
    }, 30000); // Check every 30 seconds
  };

  const checkForTargetApps = async (targetApps: string[]) => {
    try {
      // This would typically use a native module to check installed apps
      // For now, we'll simulate the detection
      const installedApps = await getInstalledApps();
      
      for (const app of targetApps) {
        if (installedApps.includes(app)) {
          await handleAppDetected(app);
        }
      }
    } catch (error) {
      console.error('Error checking apps:', error);
    }
  };

  const getInstalledApps = async (): Promise<string[]> => {
    // Native module would provide actual installed apps
    // This is a placeholder
    return ['com.snapchat.android', 'org.telegram.messenger'];
  };

  const handleAppDetected = async (packageName: string) => {
    const appName = getAppName(packageName);
    
    // Create admin request
    const request: AdminRequest = {
      id: Date.now().toString(),
      appName,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      reason: 'App installation detected',
    };

    // Save to database
    await supabase.from('admin_requests').insert([request]);
    
    // Send push notification to admin
    await sendAdminNotification(request);
    
    // Block app usage until admin approves
    await blockApp(packageName);
  };

  const sendAdminNotification = async (request: AdminRequest) => {
    try {
      await supabase.from('notifications').insert([{
        type: 'app_request',
        title: 'App Access Request',
        message: `Request to use ${request.appName}`,
        data: request,
        created_at: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const blockApp = async (packageName: string) => {
    // This would use native modules to block app access
    Alert.alert(
      'App Blocked',
      'This app has been blocked pending admin approval.',
      [{ text: 'OK' }]
    );
  };

  const handleAdminDecision = async (requestId: string, decision: 'approved' | 'denied') => {
    try {
      await supabase
        .from('admin_requests')
        .update({ status: decision })
        .eq('id', requestId);

      if (decision === 'approved') {
        // Unblock the app
        const request = adminRequests.find(r => r.id === requestId);
        if (request) {
          await unblockApp(getPackageName(request.appName));
        }
      }

      loadAdminRequests();
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };

  const unblockApp = async (packageName: string) => {
    // Native module to unblock app
    console.log('Unblocking app:', packageName);
  };

  const getAppName = (packageName: string): string => {
    const appNames: { [key: string]: string } = {
      'com.snapchat.android': 'Snapchat',
      'org.telegram.messenger': 'Telegram',
      'com.whatsapp': 'WhatsApp',
      'com.facebook.katana': 'Facebook',
      'com.instagram.android': 'Instagram',
    };
    return appNames[packageName] || packageName;
  };

  const getPackageName = (appName: string): string => {
    const packageNames: { [key: string]: string } = {
      'Snapchat': 'com.snapchat.android',
      'Telegram': 'org.telegram.messenger',
      'WhatsApp': 'com.whatsapp',
      'Facebook': 'com.facebook.katana',
      'Instagram': 'com.instagram.android',
    };
    return packageNames[appName] || appName;
  };

  const loadMonitoredApps = async () => {
    try {
      const { data, error } = await supabase
        .from('monitored_apps')
        .select('*');

      if (error) throw error;
      setMonitoredApps(data || []);
    } catch (error) {
      console.error('Failed to load monitored apps:', error);
    }
  };

  const loadAdminRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_requests')
        .select('*')
        .eq('status', 'pending');

      if (error) throw error;
      setAdminRequests(data || []);
    } catch (error) {
      console.error('Failed to load admin requests:', error);
    }
  };

  const renderAdminRequest = ({ item }: { item: AdminRequest }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() => {
        setSelectedRequest(item);
        setModalVisible(true);
      }}
    >
      <Text style={styles.requestApp}>{item.appName}</Text>
      <Text style={styles.requestTime}>
        {new Date(item.requestedAt).toLocaleString()}
      </Text>
      <Text style={styles.requestReason}>{item.reason}</Text>
    </TouchableOpacity>
  );

  const renderMonitoredApp = ({ item }: { item: MonitoredApp }) => (
    <View style={styles.appItem}>
      <Text style={styles.appName}>{item.name}</Text>
      <Switch
        value={!item.isBlocked}
        onValueChange={(value) => {
          // Toggle app block status
        }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Second Chance</Text>
      <Text style={styles.subtitle}>Recovery Support App</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Role</Text>
        <View style={styles.roleContainer}>
          <Text>User</Text>
          <Switch value={isAdmin} onValueChange={setIsAdmin} />
          <Text>Admin</Text>
        </View>
      </View>

      {isAdmin ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          <FlatList
            data={adminRequests}
            renderItem={renderAdminRequest}
            keyExtractor={(item) => item.id}
            style={styles.requestList}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitored Apps</Text>
          <FlatList
            data={monitoredApps}
            renderItem={renderMonitoredApp}
            keyExtractor={(item) => item.id}
            style={styles.appList}
          />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedRequest && (
              <>
                <Text style={styles.modalTitle}>App Access Request</Text>
                <Text style={styles.modalApp}>{selectedRequest.appName}</Text>
                <Text style={styles.modalTime}>
                  {new Date(selectedRequest.requestedAt).toLocaleString()}
                </Text>
                <Text style={styles.modalReason}>{selectedRequest.reason}</Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleAdminDecision(selectedRequest.id, 'approved')}
                  >
                    <Text style={styles.buttonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.denyButton]}
                    onPress={() => handleAdminDecision(selectedRequest.id, 'denied')}
                  >
                    <Text style={styles.buttonText}>Deny</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#34495e',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  requestList: {
    maxHeight: 300,
  },
  requestItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestApp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  requestTime: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  requestReason: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 5,
  },
  appList: {
    maxHeight: 300,
  },
  appItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  appName: {
    fontSize: 16,
    color: '#34495e',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#34495e',
  },
  modalApp: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#e74c3c',
  },
  modalTime: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    color: '#7f8c8d',
  },
  modalReason: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#34495e',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 100,
  },
  approveButton: {
    backgroundColor: '#27ae60',
  },
  denyButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: 10,
  },
  closeButtonText: {
    textAlign: 'center',
    color: '#7f8c8d',
  },
});
"@

$secondChanceAppTemplate | Out-File -FilePath "templates\SecondChanceApp.tsx" -Encoding UTF8

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Create React Native setup script for Second Chance app", "status": "completed"}, {"id": "2", "content": "Create mobile-specific templates and configurations", "status": "in_progress"}, {"id": "3", "content": "Add mobile testing and deployment scripts", "status": "pending"}]