import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SettingsScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reminderInterval, setReminderInterval] = useState('15');
  const [reminderDuration, setReminderDuration] = useState('10');
  const [recipientEmail, setRecipientEmail] = useState('povilas999999999@yahoo.com');
  const [emailSubject, setEmailSubject] = useState('Prašau apmokėti už viršvalandžius');
  const [emailBody, setEmailBody] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState('100');
  const [overtimeThreshold, setOvertimeThreshold] = useState('5');
  const [endOfDayReminder, setEndOfDayReminder] = useState('15');
  const [autoSendEmail, setAutoSendEmail] = useState(false);
  const [timezoneOffset, setTimezoneOffset] = useState('2');
  const [hasWorkLocation, setHasWorkLocation] = useState(false);
  const [workLocation, setWorkLocation] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/settings`);
      const data = response.data.settings;
      setSettings(data);
      setReminderInterval(String(data.reminder_interval || 15));
      setReminderDuration(String(data.reminder_duration || 10));
      setRecipientEmail(data.recipient_email || 'povilas999999999@yahoo.com');
      setEmailSubject(data.email_subject || 'Prašau apmokėti už viršvalandžius');
      setEmailBody(data.email_body_template || getDefaultEmailTemplate());
      setGeofenceRadius(String(data.geofence_radius || 100));
      setOvertimeThreshold(String(data.overtime_threshold_minutes || 5));
      setEndOfDayReminder(String(data.end_of_day_reminder_minutes || 15));
      setAutoSendEmail(data.auto_send_email_on_geofence || false);
      setTimezoneOffset(String(data.timezone_offset || 2));
      setHasWorkLocation(!!data.work_location);
      setWorkLocation(data.work_location);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultEmailTemplate = () => {
    return `Sveiki,

Prašau apmokėti už viršvalandžius.

Data: {date}
Darbo pradžia: {start_time}
Darbo pabaiga: {end_time}
Viršvalandžiai: {overtime_hours} val. ({overtime_minutes} min.)

Pridėtos {photo_count} darbo nuotraukos.

Pagarbiai`;
  };

  const saveSettings = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/settings`, {
        reminder_interval: parseInt(reminderInterval) || 15,
        reminder_duration: parseInt(reminderDuration) || 10,
        recipient_email: recipientEmail,
        email_subject: emailSubject,
        email_body_template: emailBody,
        geofence_radius: parseInt(geofenceRadius) || 100,
        overtime_threshold_minutes: parseInt(overtimeThreshold) || 5,
        end_of_day_reminder_minutes: parseInt(endOfDayReminder) || 15,
        auto_send_email_on_geofence: autoSendEmail,
        timezone_offset: parseInt(timezoneOffset) || 2,
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
        radius: parseInt(geofenceRadius) || 100,
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

  const resetEmailTemplate = () => {
    setEmailBody(getDefaultEmailTemplate());
    Alert.alert('Sėkmė', 'Email šablonas atstatytas į numatytąjį.');
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
            <Text style={styles.hint}>Kaip dažnai priminti fotografuoti darbo metu</Text>
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
            <Text style={styles.hint}>Vibracijos ir pyptelėjimų trukmė</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Įspėjimas prieš darbo pabaigą (minutės)</Text>
            <TextInput
              style={styles.input}
              value={endOfDayReminder}
              onChangeText={setEndOfDayReminder}
              keyboardType="number-pad"
              placeholder="15"
            />
            <Text style={styles.hint}>
              {endOfDayReminder} min. prieš darbo pabaigą pradės priminti fotografuoti dažniau
            </Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>El. laiško turinys</Text>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => setShowEmailModal(true)}
            >
              <Ionicons name="create" size={20} color="#2563eb" />
              <Text style={styles.editButtonText}>Redaguoti el. laiško tekstą</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              Galimi kintamieji: {'{date}'}, {'{start_time}'}, {'{end_time}'}, {'{overtime_hours}'}, {'{overtime_minutes}'}, {'{photo_count}'}
            </Text>
          </View>
        </View>

        {/* Overtime Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Viršvalandžių nustatymai</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Viršvalandžių slenksnis (minutės)</Text>
            <TextInput
              style={styles.input}
              value={overtimeThreshold}
              onChangeText={setOvertimeThreshold}
              keyboardType="number-pad"
              placeholder="5"
            />
            <Text style={styles.hint}>
              El. laiškas bus siunčiamas tik jei viršijate darbo pabaigą daugiau nei {overtimeThreshold} min.
            </Text>
          </View>
        </View>

        {/* Timezone Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Laiko Juosta</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>UTC Offset (valandos)</Text>
            <TextInput
              style={styles.input}
              value={timezoneOffset}
              onChangeText={setTimezoneOffset}
              keyboardType="number-pad"
              placeholder="2"
            />
            <Text style={styles.hint}>
              Populiarios laiko juostos:{'\n'}
              • 0 = UTC (Londonas){'\n'}
              • 1 = CET (Berlynas, Paryžius){'\n'}
              • 2 = EET (Lietuva, Vilnius) ✓{'\n'}
              • 3 = EEST (Maskva)
            </Text>
          </View>
        </View>

        {/* Geofencing Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Darbo vieta (Geofencing)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Geofence spindulys (metrai)</Text>
            <TextInput
              style={styles.input}
              value={geofenceRadius}
              onChangeText={setGeofenceRadius}
              keyboardType="number-pad"
              placeholder="100"
            />
            <Text style={styles.hint}>
              Jei paliekate darbo zoną daugiau nei {geofenceRadius}m, aktyvuojasi el. laiško siuntimas.
            </Text>
          </View>

          <View style={styles.toggleGroup}>
            <View style={styles.toggleHeader}>
              <Text style={styles.label}>Automatinis el. laiško siuntimas</Text>
              <Switch
                value={autoSendEmail}
                onValueChange={setAutoSendEmail}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={autoSendEmail ? '#fff' : '#f3f4f6'}
              />
            </View>
            <Text style={styles.hint}>
              {autoSendEmail 
                ? '✅ El. laiškas bus išsiųstas AUTOMATIŠKAI kai paliekate darbo zoną' 
                : '❓ Sistema KLAUS ar siųsti el. laišką kai paliekate darbo zoną'}
            </Text>
          </View>

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
                  Spindulys: {geofenceRadius}m
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
            Sistema tikrina vietą kas 5 minutes. Kai paliekate darbo zoną, el. laiškas siunčiamas pagal aukščiau nurodytą nustatymą.
          </Text>
        </View>

        {/* Email Template Modal */}
        <Modal
          visible={showEmailModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEmailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Redaguoti el. laiško turinį</Text>
              
              <ScrollView style={styles.emailInputContainer}>
                <TextInput
                  style={styles.emailInput}
                  value={emailBody}
                  onChangeText={setEmailBody}
                  multiline
                  numberOfLines={15}
                  placeholder={getDefaultEmailTemplate()}
                />
              </ScrollView>

              <Text style={styles.modalHint}>
                Galimi kintamieji:{'\n'}
                • {'{date}'} - Darbo data{'\n'}
                • {'{start_time}'} - Pradžios laikas{'\n'}
                • {'{end_time}'} - Pabaigos laikas{'\n'}
                • {'{overtime_hours}'} - Viršvalandžiai (val.){'\n'}
                • {'{overtime_minutes}'} - Viršvalandžiai (min.){'\n'}
                • {'{photo_count}'} - Nuotraukų kiekis
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.resetButton} onPress={resetEmailTemplate}>
                  <Text style={styles.resetButtonText}>Atstatyti</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalSaveButton} 
                  onPress={() => setShowEmailModal(false)}
                >
                  <Text style={styles.modalSaveButtonText}>Gerai</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  toggleGroup: {
    marginBottom: 16,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    lineHeight: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  emailInputContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  emailInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 250,
    textAlignVertical: 'top',
  },
  modalHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  resetButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
