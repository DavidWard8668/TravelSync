import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  Linking,
  ScrollView,
} from 'react-native';
import NativeSecondChanceService from '../services/NativeSecondChance';

interface CrisisSupportProps {
  visible: boolean;
  onClose: () => void;
  onCrisisMode?: () => void;
}

const CRISIS_RESOURCES = [
  {
    name: 'Suicide Prevention Lifeline',
    number: '988',
    description: 'Free, confidential 24/7 suicide prevention hotline',
    action: () => Linking.openURL('tel:988'),
  },
  {
    name: 'Crisis Text Line',
    number: '741741',
    text: 'HOME',
    description: 'Free, 24/7 crisis support via text message',
    action: () => Linking.openURL('sms:741741?body=HOME'),
  },
  {
    name: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    description: 'Treatment referral and information service',
    action: () => Linking.openURL('tel:1-800-662-4357'),
  },
  {
    name: 'National Sexual Assault Hotline',
    number: '1-800-656-4673',
    description: '24/7 support for survivors of sexual assault',
    action: () => Linking.openURL('tel:1-800-656-4673'),
  },
  {
    name: 'National Domestic Violence Hotline',
    number: '1-800-799-7233',
    description: '24/7 support for domestic violence survivors',
    action: () => Linking.openURL('tel:1-800-799-7233'),
  },
];

const CrisisSupport: React.FC<CrisisSupportProps> = ({ visible, onClose, onCrisisMode }) => {
  const [isActivatingCrisisMode, setIsActivatingCrisisMode] = useState(false);

  const handleCrisisMode = async () => {
    Alert.alert(
      '🆘 Crisis Mode',
      'This will temporarily disable all app blocking to give you access to communication and support apps. Your admin will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate Crisis Mode',
          style: 'destructive',
          onPress: activateCrisisMode,
        },
      ]
    );
  };

  const activateCrisisMode = async () => {
    try {
      setIsActivatingCrisisMode(true);
      
      if (NativeSecondChanceService.isAvailable()) {
        await NativeSecondChanceService.enableCrisisMode();
        console.log('Crisis mode activated via native service');
      }
      
      onCrisisMode?.();
      
      Alert.alert(
        '🆘 Crisis Mode Activated',
        'All app restrictions have been temporarily lifted. Your admin has been notified. Please reach out for support.',
        [{ text: 'OK' }]
      );
      
      onClose();
      
    } catch (error) {
      console.error('Failed to activate crisis mode:', error);
      Alert.alert(
        'Error',
        'Failed to activate crisis mode. Please contact your admin directly or call 988.'
      );
    } finally {
      setIsActivatingCrisisMode(false);
    }
  };

  const handleResourceContact = (resource: typeof CRISIS_RESOURCES[0]) => {
    Alert.alert(
      resource.name,
      resource.description,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: resource.text ? `Text ${resource.text}` : 'Call',
          onPress: resource.action,
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🆘 Crisis Support</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.emergencySection}>
            <Text style={styles.emergencyTitle}>
              🚨 If you are in immediate danger, call 911
            </Text>
          </View>

          <View style={styles.crisisModeSection}>
            <Text style={styles.sectionTitle}>Emergency Access</Text>
            <Text style={styles.sectionDescription}>
              If you need immediate access to communication apps for support, activate crisis mode below.
              This will temporarily remove all app restrictions.
            </Text>
            <TouchableOpacity
              style={[styles.crisisModeButton, isActivatingCrisisMode && styles.buttonDisabled]}
              onPress={handleCrisisMode}
              disabled={isActivatingCrisisMode}
            >
              <Text style={styles.crisisModeButtonText}>
                {isActivatingCrisisMode ? 'Activating...' : '🆘 Activate Crisis Mode'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resourcesSection}>
            <Text style={styles.sectionTitle}>24/7 Crisis Resources</Text>
            <Text style={styles.sectionDescription}>
              These resources are always available and free. Don't hesitate to reach out.
            </Text>
            
            {CRISIS_RESOURCES.map((resource, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resourceCard}
                onPress={() => handleResourceContact(resource)}
              >
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>{resource.name}</Text>
                  <Text style={styles.resourceNumber}>{resource.number}</Text>
                  {resource.text && (
                    <Text style={styles.resourceText}>Text "{resource.text}" to start</Text>
                  )}
                  <Text style={styles.resourceDescription}>{resource.description}</Text>
                </View>
                <View style={styles.resourceAction}>
                  <Text style={styles.actionText}>{resource.text ? 'TEXT' : 'CALL'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.selfCareSection}>
            <Text style={styles.sectionTitle}>Self-Care Reminders</Text>
            <View style={styles.reminderCard}>
              <Text style={styles.reminder}>💙 You are not alone in this</Text>
            </View>
            <View style={styles.reminderCard}>
              <Text style={styles.reminder}>🌟 Recovery is possible</Text>
            </View>
            <View style={styles.reminderCard}>
              <Text style={styles.reminder}>🤝 Asking for help is a sign of strength</Text>
            </View>
            <View style={styles.reminderCard}>
              <Text style={styles.reminder}>🌈 This feeling will pass</Text>
            </View>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              If you're experiencing a mental health crisis, please reach out immediately. 
              There are people who want to help you through this.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff3cd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#dc3545',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  emergencySection: {
    backgroundColor: '#dc3545',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  crisisModeSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 15,
    color: '#7f8c8d',
    lineHeight: 22,
    marginBottom: 15,
  },
  crisisModeButton: {
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  crisisModeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resourcesSection: {
    marginBottom: 20,
  },
  resourceCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resourceInfo: {
    flex: 1,
    marginRight: 15,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  resourceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 4,
  },
  resourceText: {
    fontSize: 12,
    color: '#3498db',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  resourceAction: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selfCareSection: {
    marginBottom: 20,
  },
  reminderCard: {
    backgroundColor: '#e8f4fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  reminder: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  footerSection: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  footerText: {
    fontSize: 15,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});

export default CrisisSupport;