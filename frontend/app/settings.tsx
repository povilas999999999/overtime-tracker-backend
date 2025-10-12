import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SettingsScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [reminderInterval, setReminderInterval] = useState('15');
  const [reminderDuration, setReminderDuration] = useState('10');
  const [recipientEmail, setRecipientEmail] = useState('povilas999999999@yahoo.com');
  const [emailSubject, setEmailSubject] = useState('Prašau apmokėti už viršvalandžius');
  const [emailBody, setEmailBody] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState('100');
  const [hasWorkLocation, setHasWorkLocation] = useState(false);
  const [workLocation, setWorkLocation] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/settings`);
      const data = response.data.settings;
      setSettings(data);
      setReminderInterval(String(data.reminder_interval || 15));
      setReminderDuration(String(data.reminder_duration || 10));
      setRecipientEmail(data.recipient_email || 'povilas999999999@yahoo.com');
      setEmailSubject(data.email_subject || 'Prašau apmokėti už viršvalandžius');
      setHasWorkLocation(!!data.work_location);
      setWorkLocation(data.work_location);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/settings`, {
        reminder_interval: parseInt(reminderInterval) || 15,
        reminder_duration: parseInt(reminderDuration) || 10,
        recipient_email: recipientEmail,
        email_subject: emailSubject,
        work_location: workLocation,
      });

      Alert.alert('Sėkmė', 'Nustatymai išsaugoti!');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Klaida', 'Nepavyko išsaugoti nustatymų.');
    }
  };

  const setCurrentLocationAsWork = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Klaida', 'Reikalingas leidimas naudoti vietovę.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        radius: 100, // 100 meter radius
      };

      setWorkLocation(newLocation);
      setHasWorkLocation(true);
      Alert.alert('Sėkmė', 'Dabartinė vieta nustatyta kaip darbo vieta!');
    } catch (error) {
      console.error('Error setting work location:', error);
      Alert.alert('Klaida', 'Nepavyko nustatyti darbo vietos.');
    }
  };

  const clearWorkLocation = () => {
    setWorkLocation(null);
    setHasWorkLocation(false);
    Alert.alert('Sėkmė', 'Darbo vieta pašalinta.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Reminder Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priminimai</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priminimo intervalas (minutės)</Text>
            <TextInput
              style={styles.input}
              value={reminderInterval}
              onChangeText={setReminderInterval}
              keyboardType="number-pad"
              placeholder="15"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priminimo trukmė (sekundės)</Text>
            <TextInput
              style={styles.input}
              value={reminderDuration}
              onChangeText={setReminderDuration}
              keyboardType="number-pad"
              placeholder="10"
            />
          </View>
        </View>

        {/* Email Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>El. paštas</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gavėjo el. paštas</Text>
            <TextInput
              style={styles.input}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="email@example.com"
            />
            <Text style={styles.hint}>Testuojamas: povilas999999999@yahoo.com</Text>
            <Text style={styles.hint}>Galutinis: alvydas.vezelis@nvc.santa.lt</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>El. laiško tema</Text>
            <TextInput
              style={styles.input}
              value={emailSubject}
              onChangeText={setEmailSubject}
              placeholder="Prašau apmokėti už viršvalandžius"
            />
          </View>
        </View>

        {/* Work Location Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Darbo vieta (Geofencing)</Text>
          
          <View style={styles.locationCard}>
            {hasWorkLocation && workLocation ? (
              <>
                <Ionicons name="location" size={48} color="#10b981" />
                <Text style={styles.locationText}>
                  Lat: {workLocation.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Lon: {workLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Spindulys: {workLocation.radius}m
                </Text>
                <TouchableOpacity style={styles.dangerButton} onPress={clearWorkLocation}>
                  <Text style={styles.dangerButtonText}>Pašalinti</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="location-outline" size={48} color="#6b7280" />
                <Text style={styles.noLocationText}>Darbo vieta nenustatyta</Text>
                <TouchableOpacity style={styles.secondaryButton} onPress={setCurrentLocationAsWork}>
                  <Text style={styles.secondaryButtonText}>Nustatyti dabartinę vietą</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.infoText}>
            Kai paliekate darbo vietą, automatiškai išsiunčiamas el. laiškas su viršvalandžiais.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Ionicons name="save" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Išsaugoti nustatymus</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  locationCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  noLocationText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});