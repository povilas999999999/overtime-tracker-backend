import { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
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
      
      // Start periodic location check (every 5 minutes)
      startLocationCheck();
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
      let permissionsGranted = [];
      let permissionsFailed = [];

      // Location - Foreground ONLY (no background needed!)
      try {
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus === 'granted') {
          setLocationPermission(true);
          permissionsGranted.push('✅ Vietos leidimas (kai naudojate)');
        } else {
          setLocationPermission(false);
          permissionsFailed.push('❌ Vietos leidimas');
        }
      } catch (locError) {
        console.error('Location permission error:', locError);
        setLocationPermission(false);
        permissionsFailed.push('❌ Vietos leidimas (klaida)');
      }

      // Camera
      try {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        if (cameraStatus === 'granted') {
          setCameraPermission(true);
          permissionsGranted.push('✅ Kamera');
        } else {
          setCameraPermission(false);
          permissionsFailed.push('❌ Kamera');
        }
      } catch (camError) {
        console.error('Camera permission error:', camError);
        permissionsFailed.push('❌ Kamera (klaida)');
      }

      // Notifications
      try {
        const { status: notifStatus } = await Notifications.requestPermissionsAsync();
        if (notifStatus === 'granted') {
          permissionsGranted.push('✅ Pranešimai');
        } else {
          permissionsFailed.push('❌ Pranešimai');
        }
      } catch (notifError) {
        console.error('Notification permission error:', notifError);
        permissionsFailed.push('❌ Pranešimai (klaida)');
      }

      // Build result message
      let message = '';
      
      if (permissionsGranted.length > 0) {
        message += 'SUTEIKTI LEIDIMAI:\n' + permissionsGranted.join('\n') + '\n\n';
      }
      
      if (permissionsFailed.length > 0) {
        message += 'NESUTEIKTI LEIDIMAI:\n' + permissionsFailed.join('\n') + '\n\n';
        message += 'KAIP PATAISYTI:\n';
        message += '1. Eikite į iPhone Settings\n';
        message += '2. Raskite šią aplikaciją\n';
        message += '3. Suteikite trūkstamus leidimus';
      }

      // Show result
      if (permissionsFailed.length === 0) {
        Alert.alert('🎉 Visi leidimai suteikti!', message);
      } else if (permissionsGranted.length > 0) {
        Alert.alert('Leidimų būsena', message);
      } else {
        Alert.alert('Leidimai nesuteikti', message);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Klaida prašant leidimų', 
        `Įvyko klaida: ${error.message || error}\n\nBandykite:\n1. Uždaryti ir atidaryti aplikaciją\n2. Suteikti leidimus iPhone Settings`
      );
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

  const startLocationCheck = () => {
    // Check location every 5 minutes
    const locationCheckInterval = setInterval(async () => {
      if (!settings?.work_location || !currentSession) return;
      
      try {
        const location = await Location.getCurrentPositionAsync({});
        const workLat = settings.work_location.latitude;
        const workLon = settings.work_location.longitude;
        const radius = settings.work_location.radius || 100;
        
        // Calculate distance
        const distance = getDistanceFromLatLonInMeters(
          location.coords.latitude,
          location.coords.longitude,
          workLat,
          workLon
        );
        
        // If outside work zone, trigger email
        if (distance > radius) {
          console.log('Outside work zone! Triggering email...');
          await handleGeofenceExit();
          clearInterval(locationCheckInterval);
        }
      } catch (error) {
        console.error('Location check error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Store interval ref for cleanup
    return locationCheckInterval;
  };

  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Radius of the earth in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleGeofenceExit = async () => {
    const sessionId = await AsyncStorage.getItem('activeSessionId');
    if (sessionId) {
      try {
        const location = await Location.getCurrentPositionAsync({});
        
        await axios.post(`${BACKEND_URL}/api/session/end`, {
          session_id: sessionId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        await axios.post(`${BACKEND_URL}/api/email/send`, {
          session_id: sessionId
        });
        
        await AsyncStorage.removeItem('activeSessionId');
        setIsWorking(false);
        setCurrentSession(null);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Viršvalandžių el. laiškas išsiųstas',
            body: 'Paliekate darbo vietą. El. laiškas išsiųstas automatiškai.',
          },
          trigger: null,
        });
        
        Alert.alert('Darbo pabaiga', 'Paliekate darbo vietą. Viršvalandžių el. laiškas išsiųstas!');
      } catch (error) {
        console.error('Error in geofence exit:', error);
      }
    }
  };

  const startWork = async () => {
    if (!locationPermission) {
      Alert.alert('Klaida', 'Reikalingas leidimas naudoti vietovę.');
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

      Alert.alert(
        'Darbo sesija pradėta!',
        settings?.work_location 
          ? 'Jūsų vieta bus tikrinama kas 5 minutes. Paliekant darbo vietą, automatiškai išsiųsime el. laišką.' 
          : 'Nustatykite darbo vietą nustatymuose automatiniam el. laiško siuntimui.',
        [{ text: 'Gerai' }]
      );
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
