import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  FlatList,
  Alert,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface InstalledApp {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
  versionName: string;
  icon?: string;
}

interface SecondaryAdmin {
  id: string;
  email: string;
  phone?: string;
  name: string;
  status: 'pending' | 'active' | 'inactive';
  permissions: {
    canApprove: boolean;
    canBlock: boolean;
    canViewHistory: boolean;
    receiveAlerts: boolean;
  };
  joinedAt: Date;
}

interface MonitoredApp {
  packageName: string;
  appName: string;
  icon?: string;
  isBlocked: boolean;
  requiresApproval: boolean;
  lastUsed?: Date;
  blockReason?: string;
  riskLevel: 'low' | 'medium' | 'high';
  category?: string;
}

interface AppRequest {
  id: string;
  appName: string;
  packageName: string;
  userId: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  adminResponse?: string;
  adminId?: string;
  expiresAt?: Date;
  reason: string;
}

interface UserSettings {
  userId: string;
  deviceId: string;
  uninstallPin?: string;
  emergencyContacts: string[];
  notificationSettings: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
  recoveryGoals: {
    cleanDays: number;
    targetDays: number;
    milestones: string[];
  };
}

export default function SecondChanceApp() {
  // State management
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // User data
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [secondaryAdmin, setSecondaryAdmin] = useState<SecondaryAdmin | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  
  // Apps data
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>([]);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [appRequests, setAppRequests] = useState<AppRequest[]>([]);
  
  // Modal states
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Form states
  const [uninstallPin, setUninstallPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Check if app is already set up
      await checkExistingSetup();
      
      // Request necessary permissions
      await requestPermissions();
      
      // Load installed apps
      await loadInstalledApps();
      
      // Initialize device admin if setup is complete
      if (isSetupComplete) {
        await setupDeviceAdmin();
        await startAppMonitoring();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('App initialization failed:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to initialize app. Please restart and grant necessary permissions.');
    }
  };

  const checkExistingSetup = async () => {
    try {
      const setupData = await AsyncStorage.getItem('setup_complete');
      const adminData = await AsyncStorage.getItem('secondary_admin');
      const appsData = await AsyncStorage.getItem('monitored_apps');
      const settingsData = await AsyncStorage.getItem('user_settings');
      
      if (setupData === 'true') {
        setIsSetupComplete(true);
      }
      
      if (adminData) {
        setSecondaryAdmin(JSON.parse(adminData));
      }
      
      if (appsData) {
        setMonitoredApps(JSON.parse(appsData));
      }
      
      if (settingsData) {
        setUserSettings(JSON.parse(settingsData));
      }
    } catch (error) {
      console.error('Failed to load existing setup:', error);
    }
  };

  const requestPermissions = async () => {
    const permissions = Platform.select({
      android: [
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.SEND_SMS,
        PERMISSIONS.ANDROID.RECEIVE_SMS,
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.USE_BIOMETRIC,
      ],
      ios: [
        PERMISSIONS.IOS.CAMERA,
        PERMISSIONS.IOS.FACE_ID,
        PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      ],
    });

    if (permissions) {
      for (const permission of permissions) {
        try {
          const result = await request(permission);
          if (result !== RESULTS.GRANTED) {
            console.warn(`Permission ${permission} not granted`);
          }
        } catch (error) {
          console.error(`Failed to request permission ${permission}:`, error);
        }
      }
    }
  };

  const loadInstalledApps = async () => {
    try {
      // Simulate getting installed apps (would use native module in production)
      const mockApps: InstalledApp[] = [
        { packageName: 'com.snapchat.android', appName: 'Snapchat', isSystemApp: false, versionName: '12.0.0' },
        { packageName: 'org.telegram.messenger', appName: 'Telegram', isSystemApp: false, versionName: '10.0.0' },
        { packageName: 'com.whatsapp', appName: 'WhatsApp', isSystemApp: false, versionName: '2.23.0' },
        { packageName: 'com.instagram.android', appName: 'Instagram', isSystemApp: false, versionName: '250.0.0' },
        { packageName: 'com.tinder', appName: 'Tinder', isSystemApp: false, versionName: '13.0.0' },
        { packageName: 'com.facebook.katana', appName: 'Facebook', isSystemApp: false, versionName: '380.0.0' },
        { packageName: 'com.twitter.android', appName: 'Twitter', isSystemApp: false, versionName: '9.0.0' },
        { packageName: 'com.discord', appName: 'Discord', isSystemApp: false, versionName: '150.0.0' },
      ];
      
      setInstalledApps(mockApps);
    } catch (error) {
      console.error('Failed to load installed apps:', error);
    }
  };

  const setupDeviceAdmin = async () => {
    try {
      // Request device admin permissions (would use native module)
      console.log('Setting up device admin permissions...');
      
      // In production, this would:
      // 1. Request device admin privileges
      // 2. Enable uninstall protection
      // 3. Set up app usage monitoring
      
      return true;
    } catch (error) {
      console.error('Failed to setup device admin:', error);
      return false;
    }
  };

  const startAppMonitoring = async () => {
    try {
      // Start monitoring selected apps (would use native module)
      console.log('Starting app monitoring for:', monitoredApps);
      
      // In production, this would:
      // 1. Monitor app launches
      // 2. Block restricted apps
      // 3. Send admin notifications
      // 4. Log usage attempts
      
    } catch (error) {
      console.error('Failed to start app monitoring:', error);
    }
  };

  const saveSecondaryAdmin = async () => {
    if (!adminEmail || !adminEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!adminName.trim()) {
      Alert.alert('Name Required', 'Please enter the admin\'s name.');
      return;
    }

    setLoading(true);
    
    try {
      const admin: SecondaryAdmin = {
        id: Date.now().toString(),
        email: adminEmail.toLowerCase().trim(),
        phone: adminPhone.trim() || undefined,
        name: adminName.trim(),
        status: 'pending',
        permissions: {
          canApprove: true,
          canBlock: true,
          canViewHistory: true,
          receiveAlerts: true,
        },
        joinedAt: new Date(),
      };
      
      await AsyncStorage.setItem('secondary_admin', JSON.stringify(admin));
      setSecondaryAdmin(admin);
      
      // Send invitation to admin
      await sendAdminInvitation(admin);
      
      setShowAdminSetup(false);
      setCurrentStep(2);
      setLoading(false);
      
      Alert.alert(
        'Admin Invited!',
        `Invitation sent to ${admin.name} (${admin.email}). They will receive setup instructions.`,
        [{ text: 'Continue' }]
      );
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save admin information. Please try again.');
    }
  };

  const sendAdminInvitation = async (admin: SecondaryAdmin) => {
    try {
      // In production, this would send actual email/SMS
      const inviteMessage = `
You've been invited to be a recovery support admin for Second Chance app.

Your role:
• Receive alerts when monitored apps are accessed
• Approve or deny app usage requests  
• Support someone's recovery journey

Download Second Chance Admin app and use invite code: ${admin.id}

Crisis Resources (Always Available):
• Suicide Prevention: 988
• Crisis Text: Text HOME to 741741
• SAMHSA Helpline: 1-800-662-4357

Thank you for supporting recovery.
      `;
      
      console.log('Admin invitation:', { to: admin.email, message: inviteMessage });
      
      // Would integrate with email/SMS service
      return true;
    } catch (error) {
      console.error('Failed to send admin invitation:', error);
      throw error;
    }
  };

  const selectAppsToMonitor = () => {
    if (installedApps.length === 0) {
      Alert.alert('No Apps Found', 'Please restart the app to reload installed applications.');
      return;
    }
    setShowAppSelector(true);
  };

  const toggleAppSelection = (packageName: string) => {
    const newSelection = new Set(selectedApps);
    if (newSelection.has(packageName)) {
      newSelection.delete(packageName);
    } else {
      newSelection.add(packageName);
    }
    setSelectedApps(newSelection);
  };

  const saveMonitoredApps = async () => {
    if (selectedApps.size === 0) {
      Alert.alert('No Apps Selected', 'Please select at least one app to monitor.');
      return;
    }

    try {
      const monitored: MonitoredApp[] = Array.from(selectedApps).map(packageName => {
        const app = installedApps.find(a => a.packageName === packageName);
        return {
          packageName,
          appName: app?.appName || packageName,
          icon: app?.icon,
          isBlocked: true,
          requiresApproval: true,
          riskLevel: getRiskLevel(packageName),
          category: getAppCategory(packageName),
        };
      });
      
      await AsyncStorage.setItem('monitored_apps', JSON.stringify(monitored));
      setMonitoredApps(monitored);
      
      setShowAppSelector(false);
      setCurrentStep(3);
      
      Alert.alert(
        'Apps Selected!', 
        `Now monitoring ${monitored.length} apps. Your admin will receive alerts when these are accessed.`
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save monitored apps. Please try again.');
    }
  };

  const getRiskLevel = (packageName: string): 'low' | 'medium' | 'high' => {
    const highRisk = ['snapchat', 'telegram', 'tinder', 'grindr', 'whisper'];
    const mediumRisk = ['instagram', 'facebook', 'twitter', 'discord'];
    
    const name = packageName.toLowerCase();
    
    if (highRisk.some(risk => name.includes(risk))) return 'high';
    if (mediumRisk.some(risk => name.includes(risk))) return 'medium';
    return 'low';
  };

  const getAppCategory = (packageName: string): string => {
    const categories: { [key: string]: string } = {
      'snapchat': 'Social/Messaging',
      'telegram': 'Messaging',
      'whatsapp': 'Messaging', 
      'instagram': 'Social Media',
      'facebook': 'Social Media',
      'tinder': 'Dating',
      'discord': 'Gaming/Social',
    };
    
    const name = packageName.toLowerCase();
    for (const [key, category] of Object.entries(categories)) {
      if (name.includes(key)) return category;
    }
    return 'Other';
  };

  const setupUninstallProtection = () => {
    setShowPinSetup(true);
  };

  const saveUninstallPin = async () => {
    if (!uninstallPin || uninstallPin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter at least 4 digits.');
      return;
    }
    
    if (uninstallPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PIN and confirmation do not match.');
      return;
    }
    
    try {
      const settings: UserSettings = {
        userId: await DeviceInfo.getUniqueId(),
        deviceId: await DeviceInfo.getDeviceId(),
        uninstallPin: uninstallPin,
        emergencyContacts: secondaryAdmin ? [secondaryAdmin.email] : [],
        notificationSettings: {
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: !!secondaryAdmin?.phone,
        },
        recoveryGoals: {
          cleanDays: 0,
          targetDays: 30,
          milestones: [],
        },
      };
      
      await AsyncStorage.setItem('user_settings', JSON.stringify(settings));
      await AsyncStorage.setItem('setup_complete', 'true');
      
      setUserSettings(settings);
      setShowPinSetup(false);
      setIsSetupComplete(true);
      
      // Initialize device protection
      await setupDeviceAdmin();
      await startAppMonitoring();
      
      Alert.alert(
        'Setup Complete!',
        'Second Chance is now active and protecting your recovery. Your admin will be notified of any monitored app usage.',
        [{ text: 'Start Recovery Journey' }]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const handleAppAccessRequest = (app: MonitoredApp) => {
    if (!app.isBlocked) {
      // App is allowed, let them use it
      return;
    }
    
    // Create request for admin approval
    const request: AppRequest = {
      id: Date.now().toString(),
      appName: app.appName,
      packageName: app.packageName,
      userId: userSettings?.userId || 'unknown',
      timestamp: new Date(),
      status: 'pending',
      reason: `User requested access to ${app.appName}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
    
    setAppRequests([request, ...appRequests]);
    
    // Notify admin
    notifyAdmin(request);
    
    Alert.alert(
      'Access Request Sent',
      `Your admin has been notified about your request to use ${app.appName}. You'll be notified when they respond.`,
      [{ text: 'OK' }]
    );
  };

  const notifyAdmin = async (request: AppRequest) => {
    if (!secondaryAdmin) return;
    
    try {
      const message = {
        to: secondaryAdmin.email,
        subject: '🚨 Second Chance - App Access Request',
        body: `
App Access Request Alert

User is requesting access to: ${request.appName}
Time: ${request.timestamp.toLocaleString()}
Reason: ${request.reason}

Please review and approve or deny this request in the Second Chance Admin app.

This request expires in 24 hours.

Crisis Resources (if needed):
• Suicide Prevention: 988
• Crisis Text: Text HOME to 741741
• SAMHSA Helpline: 1-800-662-4357
        `,
      };
      
      console.log('Sending admin notification:', message);
      
      // In production, would send actual notification via API
      
    } catch (error) {
      console.error('Failed to notify admin:', error);
    }
  };

  const callCrisisLine = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const sendCrisisText = () => {
    Linking.openURL('sms:741741?body=HOME');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Initializing Second Chance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSetupComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.setupContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Second Chance</Text>
            <Text style={styles.subtitle}>Recovery Support & Accountability</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
            </View>
            <Text style={styles.stepIndicator}>Step {currentStep} of 3</Text>
          </View>

          {currentStep === 1 && (
            <View style={styles.setupStep}>
              <Text style={styles.stepTitle}>👥 Assign Recovery Support Admin</Text>
              <Text style={styles.stepDescription}>
                Choose someone you trust who will receive alerts when you try to access monitored apps. 
                This could be a sponsor, family member, counselor, or friend.
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Admin's full name"
                value={adminName}
                onChangeText={setAdminName}
                autoCapitalize="words"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Admin's email address"
                value={adminEmail}
                onChangeText={setAdminEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Admin's phone (optional)"
                value={adminPhone}
                onChangeText={setAdminPhone}
                keyboardType="phone-pad"
              />
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={saveSecondaryAdmin}
                disabled={!adminName.trim() || !adminEmail.includes('@')}
              >
                <Text style={styles.buttonText}>Send Admin Invitation</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.setupStep}>
              <Text style={styles.stepTitle}>📱 Select Apps to Monitor</Text>
              <Text style={styles.stepDescription}>
                Choose which apps on your device should require admin approval before use.
                Focus on apps that might trigger urges or connect you to risky situations.
              </Text>
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={selectAppsToMonitor}
              >
                <Text style={styles.buttonText}>Choose Apps ({selectedApps.size} selected)</Text>
              </TouchableOpacity>
              
              {selectedApps.size > 0 && (
                <Text style={styles.selectedInfo}>
                  {Array.from(selectedApps).map(pkg => 
                    installedApps.find(app => app.packageName === pkg)?.appName
                  ).join(', ')}
                </Text>
              )}
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.setupStep}>
              <Text style={styles.stepTitle}>🔒 Secure App Protection</Text>
              <Text style={styles.stepDescription}>
                Set a PIN that will be required to uninstall Second Chance. Make sure your admin knows this PIN.
                This prevents the app from being removed during moments of weakness.
              </Text>
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={setupUninstallProtection}
              >
                <Text style={styles.buttonText}>Set Protection PIN</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.crisisSection}>
            <Text style={styles.crisisTitle}>🆘 Need Help Right Now?</Text>
            <TouchableOpacity 
              style={styles.crisisButton}
              onPress={() => callCrisisLine('988')}
            >
              <Text style={styles.crisisButtonText}>📞 Call 988 - Suicide Prevention</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.crisisButton}
              onPress={sendCrisisText}
            >
              <Text style={styles.crisisButtonText}>📱 Text HOME to 741741</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.crisisButton}
              onPress={() => callCrisisLine('1-800-662-4357')}
            >
              <Text style={styles.crisisButtonText}>📞 SAMHSA Helpline</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* App Selector Modal */}
        <Modal visible={showAppSelector} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAppSelector(false)}>
                <Text style={styles.closeButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Apps to Monitor</Text>
              <TouchableOpacity 
                onPress={saveMonitoredApps}
                disabled={selectedApps.size === 0}
              >
                <Text style={[styles.saveButton, selectedApps.size === 0 && styles.saveButtonDisabled]}>
                  Save ({selectedApps.size})
                </Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={installedApps}
              renderItem={({ item }) => {
                const isSelected = selectedApps.has(item.packageName);
                const riskLevel = getRiskLevel(item.packageName);
                
                return (
                  <TouchableOpacity
                    style={[styles.appItem, isSelected && styles.appItemSelected]}
                    onPress={() => toggleAppSelection(item.packageName)}
                  >
                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{item.appName}</Text>
                      <Text style={styles.packageName}>{item.packageName}</Text>
                      <View style={styles.appMeta}>
                        <Text style={[styles.riskBadge, styles[`risk${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`]]}>
                          {riskLevel.toUpperCase()} RISK
                        </Text>
                        <Text style={styles.category}>{getAppCategory(item.packageName)}</Text>
                      </View>
                    </View>
                    <Switch
                      value={isSelected}
                      onValueChange={() => toggleAppSelection(item.packageName)}
                    />
                  </TouchableOpacity>
                );
              }}
              keyExtractor={item => item.packageName}
            />
          </SafeAreaView>
        </Modal>

        {/* PIN Setup Modal */}
        <Modal visible={showPinSetup} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Uninstall Protection PIN</Text>
              <Text style={styles.modalDescription}>
                This PIN prevents Second Chance from being uninstalled during moments of weakness.
                Your admin should also know this PIN.
              </Text>
              
              <TextInput
                style={styles.pinInput}
                placeholder="Enter PIN"
                value={uninstallPin}
                onChangeText={setUninstallPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={8}
              />
              
              <TextInput
                style={styles.pinInput}
                placeholder="Confirm PIN"
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={8}
              />
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={saveUninstallPin}
                disabled={!uninstallPin || uninstallPin !== confirmPin || uninstallPin.length < 4}
              >
                <Text style={styles.buttonText}>Complete Setup</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPinSetup(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  // Main app interface (after setup is complete)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainHeader}>
        <Text style={styles.title}>Second Chance</Text>
        <Text style={styles.subtitle}>
          Recovery Active • {userSettings?.recoveryGoals.cleanDays || 0} Days Clean
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {/* Admin Status Card */}
        <View style={styles.adminCard}>
          <Text style={styles.cardTitle}>Recovery Support Admin</Text>
          <Text style={styles.adminName}>{secondaryAdmin?.name}</Text>
          <Text style={styles.adminEmail}>{secondaryAdmin?.email}</Text>
          <View style={styles.adminStatus}>
            <Text style={styles.statusText}>
              {secondaryAdmin?.status === 'active' ? '✅ Active & Monitoring' : '⏳ Invitation Sent'}
            </Text>
          </View>
        </View>

        {/* Monitored Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🔍 Monitored Apps ({monitoredApps.length})
          </Text>
          {monitoredApps.map(app => (
            <View key={app.packageName} style={styles.monitoredAppItem}>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.appName}</Text>
                <Text style={[
                  styles.appStatus,
                  { color: app.isBlocked ? '#e74c3c' : '#27ae60' }
                ]}>
                  {app.isBlocked ? '🔒 Requires Admin Approval' : '✅ Approved for Use'}
                </Text>
                <Text style={[styles.riskBadge, styles[`risk${app.riskLevel.charAt(0).toUpperCase() + app.riskLevel.slice(1)}`]]}>
                  {app.riskLevel.toUpperCase()} RISK • {app.category}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.accessButton, app.isBlocked && styles.blockedButton]}
                onPress={() => handleAppAccessRequest(app)}
              >
                <Text style={styles.accessButtonText}>
                  {app.isBlocked ? 'Request Access' : 'Open App'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Recent Requests</Text>
          {appRequests.length === 0 ? (
            <Text style={styles.emptyText}>No requests yet. Stay strong! 💪</Text>
          ) : (
            appRequests.slice(0, 5).map(request => (
              <View key={request.id} style={styles.requestItem}>
                <Text style={styles.requestApp}>{request.appName}</Text>
                <Text style={styles.requestTime}>
                  {request.timestamp.toLocaleString()}
                </Text>
                <Text style={[
                  styles.requestStatus,
                  { 
                    color: request.status === 'approved' ? '#27ae60' : 
                           request.status === 'denied' ? '#e74c3c' : '#f39c12'
                  }
                ]}>
                  {request.status.toUpperCase()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Recovery Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Recovery Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{userSettings?.recoveryGoals.cleanDays || 0}</Text>
              <Text style={styles.progressLabel}>Days Clean</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{monitoredApps.filter(a => a.isBlocked).length}</Text>
              <Text style={styles.progressLabel}>Apps Blocked</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{appRequests.length}</Text>
              <Text style={styles.progressLabel}>Total Requests</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Crisis Support Footer */}
      <View style={styles.crisisFooter}>
        <Text style={styles.crisisFooterTitle}>🆘 Crisis Support Always Available</Text>
        <View style={styles.crisisButtons}>
          <TouchableOpacity 
            style={styles.miniCrisisButton}
            onPress={() => callCrisisLine('988')}
          >
            <Text style={styles.miniCrisisText}>988</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.miniCrisisButton}
            onPress={sendCrisisText}
          >
            <Text style={styles.miniCrisisText}>Text 741741</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.miniCrisisButton}
            onPress={() => callCrisisLine('1-800-662-4357')}
          >
            <Text style={styles.miniCrisisText}>SAMHSA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  setupContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainHeader: {
    backgroundColor: '#2c3e50',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#34495e',
    borderRadius: 2,
    marginTop: 15,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  setupStep: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 15,
    color: '#7f8c8d',
    lineHeight: 22,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  primaryButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedInfo: {
    marginTop: 10,
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalContent: {
    padding: 20,
    justifyContent: 'center',
    flex: 1,
  },
  modalDescription: {
    fontSize: 15,
    color: '#7f8c8d',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    color: '#27ae60',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    color: '#bdc3c7',
  },
  appItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appItemSelected: {
    backgroundColor: '#e8f4fd',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  appInfo: {
    flex: 1,
    marginRight: 15,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 6,
  },
  appMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  riskBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  riskHigh: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  riskMedium: {
    backgroundColor: '#fff8e1',
    color: '#ef6c00',
  },
  riskLow: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  category: {
    fontSize: 10,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 3,
    backgroundColor: '#fff',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  mainContent: {
    padding: 20,
    paddingBottom: 100, // Account for crisis footer
  },
  adminCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  adminStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  monitoredAppItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
  },
  accessButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  blockedButton: {
    backgroundColor: '#3498db',
  },
  accessButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  requestApp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  requestStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 1,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  crisisSection: {
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  crisisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 15,
  },
  crisisButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  crisisButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  crisisFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff3cd',
    padding: 15,
    borderTopWidth: 2,
    borderTopColor: '#ffc107',
  },
  crisisFooterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 8,
  },
  crisisButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  miniCrisisButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 80,
    alignItems: 'center',
  },
  miniCrisisText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});