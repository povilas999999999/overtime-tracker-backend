import { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const GEOFENCE_TASK = 'geofence-task';

// Define geofence task
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }
  
  if (data.eventType === Location.GeofencingEventType.Exit) {
    console.log('Exited work geofence - triggering email');
    // Trigger email sending
    const sessionId = await AsyncStorage.getItem('activeSessionId');
    if (sessionId) {
      try {
        await axios.post(`${BACKEND_URL}/api/session/end`, {
          session_id: sessionId,
          latitude: data.region.latitude,
          longitude: data.region.longitude
        });
        
        await axios.post(`${BACKEND_URL}/api/email/send`, {
          session_id: sessionId
        });
        
        await AsyncStorage.removeItem('activeSessionId');
        
        // Send notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Viršvalandžių el. laiškas išsiųstas',
            body: 'El. laiškas su darbo nuotraukomis ir viršvalandžiais išsiųstas sėkmingai.',
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Error sending email on geofence exit:', error);
      }
    }
  }
});

export default function Index() {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [timeWorked, setTimeWorked] = useState('00:00:00');
  const [locationPermission, setLocationPermission] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const intervalRef = useRef<any>(null);
  const reminderIntervalRef = useRef<any>(null);

  useEffect(() => {
    loadSettings();
    checkPermissions();
    checkActiveSession();
  }, []);

  useEffect(() => {
    if (isWorking && currentSession) {
      // Start timer
      intervalRef.current = setInterval(() => {
        const start = new Date(currentSession.start_time);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeWorked(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }, 1000);

      // Start photo reminders
      startPhotoReminders();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (reminderIntervalRef.current) clearInterval(reminderIntervalRef.current);
    };
  }, [isWorking, currentSession]);

  const checkPermissions = async () => {
    try {
      // Location
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === 'granted') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        setLocationPermission(backgroundStatus === 'granted');
        
        if (backgroundStatus === 'granted') {
          Alert.alert('Sėkmė', 'Vietos leidimai suteikti!');
        } else {
          Alert.alert('Dėmesio', 'Reikalingas "Always Allow" leidimas fono sekimui. Eikite į Settings > Location ir pasirinkite "Always".');
        }
      } else {
        Alert.alert('Klaida', 'Vietos leidimas nesuteiktas.');
      }

      // Camera
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus === 'granted');

      // Notifications
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      
      if (cameraStatus === 'granted' && notifStatus.granted) {
        Alert.alert('Sėkmė', 'Visi leidimai suteikti!');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Klaida', 'Nepavyko prašyti leidimų.');
    }
  };

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/settings`);
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkActiveSession = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/session/active`);
      if (response.data.session) {
        setCurrentSession(response.data.session);
        setIsWorking(true);
        await AsyncStorage.setItem('activeSessionId', response.data.session.id);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const startPhotoReminders = () => {
    const interval = (settings?.reminder_interval || 15) * 60 * 1000; // Convert to ms
    
    reminderIntervalRef.current = setInterval(async () => {
      // Send notification with vibration
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Laikas nufotografuoti darbą!',
          body: 'Padarykite nuotrauką atliekamo darbo.',
          sound: true,
        },
        trigger: null,
      });

      // Vibrate
      if (Platform.OS !== 'web') {
        const { Vibration } = require('react-native');
        const duration = (settings?.reminder_duration || 10) * 1000;
        Vibration.vibrate([0, 500, 500, 500], false);
        setTimeout(() => Vibration.cancel(), duration);
      }
    }, interval);
  };

  const startWork = async () => {
    if (!locationPermission) {
      Alert.alert('Klaida', 'Reikalingas leidimas naudoti vietovę fone.');
      return;
    }

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const today = new Date().toISOString().split('T')[0];

      // Start session
      const response = await axios.post(`${BACKEND_URL}/api/session/start`, {
        date: today,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      setCurrentSession(response.data.session);
      setIsWorking(true);
      await AsyncStorage.setItem('activeSessionId', response.data.session.id);

      // Setup geofencing if work location is set
      if (settings?.work_location) {
        await Location.startGeofencingAsync(GEOFENCE_TASK, [
          {
            identifier: 'work-location',
            latitude: settings.work_location.latitude,
            longitude: settings.work_location.longitude,
            radius: settings.work_location.radius || 100,
            notifyOnEnter: false,
            notifyOnExit: true,
          },
        ]);
      }

      Alert.alert('Sėkmė', 'Darbo sesija pradėta!');
    } catch (error) {
      console.error('Error starting work:', error);
      Alert.alert('Klaida', 'Nepavyko pradėti darbo sesijos.');
    }
  };

  const stopWork = async () => {
    if (!currentSession) return;

    try {
      const location = await Location.getCurrentPositionAsync({});

      await axios.post(`${BACKEND_URL}/api/session/end`, {
        session_id: currentSession.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      // Stop geofencing
      if (settings?.work_location) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK);
      }

      setIsWorking(false);
      setCurrentSession(null);
      setTimeWorked('00:00:00');
      await AsyncStorage.removeItem('activeSessionId');

      Alert.alert(
        'Darbo sesija baigta',
        'Ar norite iš karto išsiųsti viršvalandžių el. laišką?',
        [
          { text: 'Vėliau', style: 'cancel' },
          {
            text: 'Siųsti dabar',
            onPress: async () => {
              try {
                await axios.post(`${BACKEND_URL}/api/email/send`, {
                  session_id: currentSession.id
                });
                Alert.alert('Sėkmė', 'El. laiškas išsiųstas!');
              } catch (error) {
                Alert.alert('Klaida', 'Nepavyko išsiųsti el. laiško.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error stopping work:', error);
      Alert.alert('Klaida', 'Nepavyko baigti darbo sesijos.');
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission) {
      Alert.alert('Klaida', 'Reikalingas leidimas naudoti kamerą.');
      return;
    }

    router.push('/camera');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={isWorking ? "time" : "time-outline"} 
              size={48} 
              color={isWorking ? "#10b981" : "#6b7280"} 
            />
            <Text style={styles.statusTitle}>
              {isWorking ? 'DIRBU' : 'LAUKIAMA'}
            </Text>
          </View>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{timeWorked}</Text>
            <Text style={styles.timerLabel}>Dirbta laikas</Text>
          </View>

          {currentSession && (
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionText}>
                Pradėta: {new Date(currentSession.start_time).toLocaleTimeString('lt-LT')}
              </Text>
              {currentSession.scheduled_end && (
                <Text style={styles.sessionText}>
                  Planuojama pabaiga: {currentSession.scheduled_end}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!isWorking ? (
            <TouchableOpacity style={styles.primaryButton} onPress={startWork}>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.primaryButtonText}>Pradėti darbą</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.photoButtonText}>Fotografuoti</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.stopButton} onPress={stopWork}>
                <Ionicons name="stop-circle" size={24} color="#fff" />
                <Text style={styles.stopButtonText}>Baigti darbą</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navContainer}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => router.push('/schedule')}
          >
            <Ionicons name="calendar" size={24} color="#2563eb" />
            <Text style={styles.navButtonText}>Grafikas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings" size={24} color="#2563eb" />
            <Text style={styles.navButtonText}>Nustatymai</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => router.push('/history')}
          >
            <Ionicons name="list" size={24} color="#2563eb" />
            <Text style={styles.navButtonText}>Istorija</Text>
          </TouchableOpacity>
        </View>

        {/* Permissions Warning */}
        {(!locationPermission || !cameraPermission) && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#f59e0b" />
            <Text style={styles.warningText}>
              {!locationPermission && 'Reikalingas leidimas naudoti vietovę fone. '}
              {!cameraPermission && 'Reikalingas leidimas naudoti kamerą.'}
            </Text>
            <TouchableOpacity onPress={checkPermissions}>
              <Text style={styles.warningLink}>Suteikti leidimus</Text>
            </TouchableOpacity>
          </View>
        )}
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
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 16,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563eb',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  sessionInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  sessionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  photoButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navButtonText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'column',
    alignItems: 'center',
  },
  warningText: {
    color: '#92400e',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 8,
  },
  warningLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
