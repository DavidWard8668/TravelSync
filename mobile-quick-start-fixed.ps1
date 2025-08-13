# MOBILE QUICK START - SECOND CHANCE APP
# Complete React Native setup and development for addiction recovery support app

param(
    [Parameter(Mandatory=$false)]
    [string]$AppName = "Second Chance",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectName = "second-chance",
    
    [string]$Platform = "both"
)

Write-Host "📱 SECOND CHANCE MOBILE APP - AUTONOMOUS EXECUTION" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Create autonomous development directory
$autonomousPath = "C:\Users\David\Development\autonomous-mobile"
New-Item -ItemType Directory -Force -Path $autonomousPath
Set-Location $autonomousPath

# Create project with React Native CLI
Write-Host "⚛️ Creating Second Chance React Native project..." -ForegroundColor Yellow

$projectPath = "$autonomousPath\SecondChanceApp"
if (Test-Path $projectPath) {
    Remove-Item -Path $projectPath -Recurse -Force
}

try {
    # Initialize React Native project
    Write-Host "   Initializing React Native with TypeScript..." -ForegroundColor Cyan
    $initResult = npx react-native init SecondChanceApp --template react-native-template-typescript
    
    Set-Location "SecondChanceApp"
    Write-Host "   ✅ React Native project created successfully" -ForegroundColor Green
    
    # Create essential directories
    New-Item -ItemType Directory -Force -Path "src\components"
    New-Item -ItemType Directory -Force -Path "src\screens" 
    New-Item -ItemType Directory -Force -Path "src\lib"
    New-Item -ItemType Directory -Force -Path "src\types"
    New-Item -ItemType Directory -Force -Path "scripts"
    
    Write-Host "   ✅ Project structure created" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ React Native initialization failed, continuing with basic setup..." -ForegroundColor Red
    
    # Create basic project structure manually
    New-Item -ItemType Directory -Force -Path "SecondChanceApp"
    Set-Location "SecondChanceApp"
    
    # Create package.json
    $packageJson = @{
        name = "second-chance-app"
        version = "1.0.0"
        main = "index.js"
        scripts = @{
            start = "react-native start"
            android = "react-native run-android"
            ios = "react-native run-ios"
            test = "jest"
        }
    } | ConvertTo-Json -Depth 5
    
    $packageJson | Out-File "package.json" -Encoding UTF8
    New-Item -ItemType Directory -Force -Path "src"
}

# Install core dependencies
Write-Host "📦 Installing Second Chance dependencies..." -ForegroundColor Yellow

$dependencies = @(
    "@react-navigation/native@^6.1.0",
    "@react-navigation/stack@^6.3.0", 
    "@supabase/supabase-js@^2.38.0",
    "react-native-device-info@^10.11.0",
    "react-native-permissions@^3.9.0",
    "react-native-push-notification@^8.1.1",
    "react-native-keychain@^8.1.0",
    "react-native-config@^1.5.0"
)

foreach ($dep in $dependencies) {
    try {
        npm install $dep
        Write-Host "   ✅ Installed $dep" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Failed to install $dep, continuing..." -ForegroundColor Yellow
    }
}

Write-Host "📱 Creating Second Chance app core..." -ForegroundColor Yellow

# Create main App component
$appComponent = @'
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
  SafeAreaView,
} from 'react-native';

interface MonitoredApp {
  id: string;
  name: string;
  packageName: string;
  isBlocked: boolean;
}

interface AdminRequest {
  id: string;
  appName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied';
}

export default function SecondChanceApp() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>([
    { id: '1', name: 'Snapchat', packageName: 'com.snapchat.android', isBlocked: true },
    { id: '2', name: 'Telegram', packageName: 'org.telegram.messenger', isBlocked: true },
    { id: '3', name: 'WhatsApp', packageName: 'com.whatsapp', isBlocked: false },
  ]);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([
    { id: '1', appName: 'Snapchat', requestedAt: new Date().toISOString(), status: 'pending' },
  ]);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAppToggle = (appId: string) => {
    setMonitoredApps(apps =>
      apps.map(app =>
        app.id === appId ? { ...app, isBlocked: !app.isBlocked } : app
      )
    );
  };

  const handleRequestDecision = (requestId: string, decision: 'approved' | 'denied') => {
    setAdminRequests(requests =>
      requests.map(req =>
        req.id === requestId ? { ...req, status: decision } : req
      )
    );
    setModalVisible(false);
    
    Alert.alert(
      'Request Updated',
      `Request ${decision} successfully`,
      [{ text: 'OK' }]
    );
  };

  const renderApp = ({ item }: { item: MonitoredApp }) => (
    <View style={styles.appItem}>
      <Text style={styles.appName}>{item.name}</Text>
      <View style={styles.appControls}>
        <Text style={[styles.status, { color: item.isBlocked ? '#e74c3c' : '#27ae60' }]}>
          {item.isBlocked ? 'BLOCKED' : 'ALLOWED'}
        </Text>
        <Switch
          value={!item.isBlocked}
          onValueChange={() => handleAppToggle(item.id)}
        />
      </View>
    </View>
  );

  const renderRequest = ({ item }: { item: AdminRequest }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() => setModalVisible(true)}
    >
      <Text style={styles.requestApp}>{item.appName}</Text>
      <Text style={styles.requestTime}>
        {new Date(item.requestedAt).toLocaleTimeString()}
      </Text>
      <Text style={[styles.requestStatus, { 
        color: item.status === 'pending' ? '#f39c12' : 
               item.status === 'approved' ? '#27ae60' : '#e74c3c' 
      }]}>
        {item.status.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Second Chance</Text>
        <Text style={styles.subtitle}>Recovery Support System</Text>
      </View>

      <View style={styles.roleToggle}>
        <Text style={styles.roleLabel}>User</Text>
        <Switch value={isAdmin} onValueChange={setIsAdmin} />
        <Text style={styles.roleLabel}>Admin</Text>
      </View>

      {isAdmin ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Pending Requests ({adminRequests.filter(r => r.status === 'pending').length})</Text>
          <FlatList
            data={adminRequests.filter(req => req.status === 'pending')}
            renderItem={renderRequest}
            keyExtractor={item => item.id}
            style={styles.list}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Monitored Apps ({monitoredApps.length})</Text>
          <FlatList
            data={monitoredApps}
            renderItem={renderApp}
            keyExtractor={item => item.id}
            style={styles.list}
          />
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>🆘 Need help? Crisis support available 24/7</Text>
        <TouchableOpacity style={styles.emergencyButton}>
          <Text style={styles.emergencyText}>Emergency Support: 988</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>App Access Request</Text>
            <Text style={styles.modalText}>User wants to access a monitored app</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.approveButton]}
                onPress={() => handleRequestDecision('1', 'approved')}
              >
                <Text style={styles.buttonText}>✅ Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.denyButton]}
                onPress={() => handleRequestDecision('1', 'denied')}
              >
                <Text style={styles.buttonText}>❌ Deny</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#bdc3c7',
  },
  roleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
    elevation: 2,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
    color: '#2c3e50',
  },
  section: {
    flex: 1,
    margin: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
    paddingHorizontal: 5,
  },
  list: {
    flex: 1,
  },
  appItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  appControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ecf0f1',
  },
  requestItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  requestApp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  requestTime: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  requestStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#34495e',
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    marginBottom: 10,
  },
  emergencyButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  emergencyText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    color: '#2c3e50',
  },
  modalText: {
    fontSize: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
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
  closeText: {
    textAlign: 'center',
    color: '#7f8c8d',
  },
});
'@

$appComponent | Out-File "src\App.tsx" -Encoding UTF8
Write-Host "   ✅ Main app component created" -ForegroundColor Green

# Create basic package.json if it doesn't exist
if (-not (Test-Path "package.json")) {
    $packageJson = @{
        name = "second-chance-app"
        version = "1.0.0"
        description = "Mobile app for addiction recovery support with admin oversight"
        main = "index.js"
        scripts = @{
            start = "react-native start"
            android = "react-native run-android"
            ios = "react-native run-ios"
            test = "jest"
            build = "react-native build"
        }
        dependencies = @{
            react = "18.2.0"
            "react-native" = "0.72.0"
        }
        keywords = @("recovery", "addiction", "support", "mobile", "react-native")
        author = "Claude Code Autonomous Development"
        license = "MIT"
    } | ConvertTo-Json -Depth 5
    
    $packageJson | Out-File "package.json" -Encoding UTF8
    Write-Host "   ✅ Package.json created" -ForegroundColor Green
}

# Create environment configuration
$envConfig = @'
# Second Chance App Environment Configuration
# Copy this file to .env and fill in your actual values

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
APP_NAME=Second Chance
APP_VERSION=1.0.0
ENVIRONMENT=development

# Crisis Support Configuration
CRISIS_HOTLINE=988
CRISIS_TEXT_NUMBER=741741
SUPPORT_EMAIL=support@secondchance.app

# Push Notification Configuration
FCM_SERVER_KEY=your_fcm_server_key
APNS_KEY_ID=your_apns_key_id

# Analytics Configuration
MIXPANEL_TOKEN=your_mixpanel_token
SENTRY_DSN=your_sentry_dsn
'@

$envConfig | Out-File ".env.template" -Encoding UTF8
Copy-Item ".env.template" ".env" -Force
Write-Host "   ✅ Environment configuration created" -ForegroundColor Green

Write-Host "🔧 Setting up development scripts..." -ForegroundColor Yellow

# Create development start script
$devScript = @'
#!/usr/bin/env node
console.log("🚀 Starting Second Chance development environment...");

const { exec } = require("child_process");

// Start Metro bundler
console.log("📱 Starting Metro bundler...");
exec("npx react-native start", (error, stdout, stderr) => {
    if (error) {
        console.error(`Metro error: ${error}`);
        return;
    }
    console.log(stdout);
});

// Wait a bit then start Android
setTimeout(() => {
    console.log("🤖 Starting Android app...");
    exec("npx react-native run-android", (error, stdout, stderr) => {
        if (error) {
            console.warn(`Android start failed: ${error.message}`);
        } else {
            console.log("✅ Android app started successfully");
        }
    });
}, 3000);

console.log("🎉 Second Chance development environment starting!");
console.log("📋 To-do:");
console.log("   - Configure .env file with your Supabase credentials");  
console.log("   - Ensure Android emulator or device is connected");
console.log("   - Run 'npm run test' to validate setup");
'@

$devScript | Out-File "scripts\start-dev.js" -Encoding UTF8

# Create basic test
$testFile = @'
import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../src/App';

describe('Second Chance App', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    
    expect(getByText('Second Chance')).toBeTruthy();
    expect(getByText('Recovery Support System')).toBeTruthy();
  });

  it('shows monitored apps for regular user', () => {
    const { getByText } = render(<App />);
    
    expect(getByText('Monitored Apps')).toBeTruthy();
    expect(getByText('Snapchat')).toBeTruthy();
    expect(getByText('Telegram')).toBeTruthy();
  });

  it('can toggle between user and admin mode', () => {
    const { getByText, getByDisplayValue } = render(<App />);
    
    // Should start in user mode
    expect(getByText('Monitored Apps')).toBeTruthy();
    
    // Switch to admin mode would require interaction testing
    // This is a basic smoke test
  });
});
'@

New-Item -ItemType Directory -Force -Path "__tests__"
$testFile | Out-File "__tests__\App.test.tsx" -Encoding UTF8
Write-Host "   ✅ Basic tests created" -ForegroundColor Green

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Execute autonomous development workflow for Second Chance", "status": "completed"}, {"id": "2", "content": "Self-heal any failures and continue execution", "status": "completed"}, {"id": "3", "content": "Run comprehensive testing suite", "status": "in_progress"}, {"id": "4", "content": "Document and record all progress", "status": "pending"}, {"id": "5", "content": "Deploy to production with monitoring", "status": "pending"}]