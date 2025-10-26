import { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
    checkPermissions(true); // Silent mode on mount - no popups!
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

  const checkPermissions = async (silent = false) => {
    try {
      let permissionsGranted = [];
      let permissionsFailed = [];

      // Check current permissions first (without requesting)
      const locationPerms = await Location.getForegroundPermissionsAsync();
      const cameraPerms = await Camera.getCameraPermissionsAsync();
      const notifPerms = await Notifications.getPermissionsAsync();

      // Update state based on current permissions
      setLocationPermission(locationPerms.status === 'granted');
      setCameraPermission(cameraPerms.status === 'granted');

      // If silent mode (on mount), just update state and return
      if (silent) {
        console.log('Permission check (silent):', {
          location: locationPerms.status,
          camera: cameraPerms.status,
          notifications: notifPerms.status
        });
        return;
      }

      // Manual permission request (when user clicks button)
      
      // Location
      if (locationPerms.status !== 'granted') {
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus === 'granted') {
          setLocationPermission(true);
          permissionsGranted.push('✅ Vietos leidimas');
        } else {
          permissionsFailed.push('❌ Vietos leidimas');
        }
      } else {
        permissionsGranted.push('✅ Vietos leidimas');
      }

      // Camera
      if (cameraPerms.status !== 'granted') {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        if (cameraStatus === 'granted') {
          setCameraPermission(true);
          permissionsGranted.push('✅ Kamera');
        } else {
          permissionsFailed.push('❌ Kamera');
        }
      } else {
        permissionsGranted.push('✅ Kamera');
      }

      // Notifications
      if (notifPerms.status !== 'granted') {
        const { status: notifStatus } = await Notifications.requestPermissionsAsync();
        if (notifStatus === 'granted') {
          permissionsGranted.push('✅ Pranešimai');
        } else {
          permissionsFailed.push('❌ Pranešimai');
        }
      } else {
        permissionsGranted.push('✅ Pranešimai');
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
      } else {
        Alert.alert('Leidimų būsena', message);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      if (!silent) {
        Alert.alert(
          'Klaida', 
          `Nepavyko patikrinti leidimų: ${error.message || error}`
        );
      }
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
    const baseInterval = (settings?.reminder_interval || 15) * 60 * 1000; // Convert to ms
    let currentInterval = baseInterval;
    
    const checkAndRemind = async () => {
      // Check if we're near end of day
      if (currentSession?.scheduled_end) {
        const now = new Date();
        const [hours, minutes] = currentSession.scheduled_end.split(':');
        const scheduledEnd = new Date();
        scheduledEnd.setHours(parseInt(hours), parseInt(minutes), 0);
        
        const minutesUntilEnd = Math.floor((scheduledEnd.getTime() - now.getTime()) / (1000 * 60));
        const endOfDayThreshold = settings?.end_of_day_reminder_minutes || 15;
        
        // If we're within threshold before end, remind more frequently
        if (minutesUntilEnd > 0 && minutesUntilEnd <= endOfDayThreshold) {
          currentInterval = 5 * 60 * 1000; // 5 minutes
          console.log(`Near end of day (${minutesUntilEnd} min left), increasing reminder frequency`);
        } else {
          currentInterval = baseInterval;
        }
      }
      
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
      
      // Schedule next reminder with current interval
      if (reminderIntervalRef.current) {
        clearTimeout(reminderIntervalRef.current);
      }
      reminderIntervalRef.current = setTimeout(checkAndRemind, currentInterval);
    };
    
    // Start first reminder
    reminderIntervalRef.current = setTimeout(checkAndRemind, currentInterval);
  };

  const startLocationCheck = () => {
    // Check location every 5 minutes
    const locationCheckInterval = setInterval(async () => {
      if (!settings?.work_location || !currentSession) return;
      
      try {
        const location = await Location.getCurrentPositionAsync({});
        const workLat = settings.work_location.latitude;
        const workLon = settings.work_location.longitude;
        const radius = settings.geofence_radius || 100;
        
        // Calculate distance
        const distance = getDistanceFromLatLonInMeters(
          location.coords.latitude,
          location.coords.longitude,
          workLat,
          workLon
        );
        
        // Check if outside work zone
        if (distance > radius) {
          console.log(`Outside work zone! Distance: ${distance}m, Radius: ${radius}m`);
          
          // Check if overtime threshold is met
          if (currentSession.scheduled_end) {
            const now = new Date();
            const [hours, minutes] = currentSession.scheduled_end.split(':');
            const scheduledEnd = new Date();
            scheduledEnd.setHours(parseInt(hours), parseInt(minutes), 0);
            
            const minutesOvertime = Math.floor((now.getTime() - scheduledEnd.getTime()) / (1000 * 60));
            const overtimeThreshold = settings.overtime_threshold_minutes || 5;
            
            if (minutesOvertime >= overtimeThreshold) {
              console.log(`Overtime threshold met: ${minutesOvertime} >= ${overtimeThreshold} minutes`);
              await handleGeofenceExit();
              clearInterval(locationCheckInterval);
            } else {
              console.log(`Overtime threshold not met yet: ${minutesOvertime} < ${overtimeThreshold} minutes`);
            }
          } else {
            // No scheduled end time, send anyway
            await handleGeofenceExit();
            clearInterval(locationCheckInterval);
          }
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
    if (!sessionId) return;

    try {
      const location = await Location.getCurrentPositionAsync({});
      
      // End session
      await axios.post(`${BACKEND_URL}/api/session/end`, {
        session_id: sessionId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      // Check if auto-send is enabled
      // Check if session still exists (hasn't been ended already)
      try {
        const sessionCheck = await axios.get(`${BACKEND_URL}/api/session/active`);
        if (!sessionCheck.data.session || sessionCheck.data.session.id !== sessionId) {
          console.log('Session already ended, skipping email send');
          return;
        }
      } catch (e) {
        console.log('Session not found, skipping email send');
        return;
      }

      const autoSend = settings?.auto_send_email_on_geofence || false;

      if (autoSend) {
        // Auto-send email
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
        
        Alert.alert('Darbo pabaiga', 'Paliekate darbo vietą. Viršvalandžių el. laiškas išsiųstas automatiškai!');
      } else {
        // Ask user
        await AsyncStorage.removeItem('activeSessionId');
        setIsWorking(false);
        setCurrentSession(null);

        Alert.alert(
          'Paliekate darbo vietą',
          'Ar norite išsiųsti viršvalandžių el. laišką?',
          [
            { 
              text: 'Ne', 
              style: 'cancel',
              onPress: () => {
                Alert.alert('Gerai', 'El. laiškas neišsiųstas. Galite išsiųsti vėliau iš Istorijos.');
              }
            },
            {
              text: 'Taip, siųsti',
              onPress: async () => {
                try {
                  await axios.post(`${BACKEND_URL}/api/email/send`, {
                    session_id: sessionId
                  });
                  Alert.alert('Sėkmė', 'El. laiškas išsiųstas!');
                  
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: 'Viršvalandžių el. laiškas išsiųstas',
                      body: 'El. laiškas su viršvalandžiais išsiųstas sėkmingai.',
                    },
                    trigger: null,
                  });
                } catch (error) {
                  Alert.alert('Klaida', 'Nepavyko išsiųsti el. laiško.');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error in geofence exit:', error);
      Alert.alert('Klaida', 'Nepavyko baigti darbo sesijos.');
    }
  };

  const startWork = async () => {
    // If location permission not granted, request it first
    if (!locationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Leidimas būtinas',
          'Programai reikalingas leidimas naudoti vietovę, kad galėtų pradėti darbo sesiją.\n\nEikite į iPhone Settings ir suteikite leidimą.',
          [{ text: 'Gerai' }]
        );
        return;
      }
      setLocationPermission(true);
    }

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Start session with local timestamp
      const response = await axios.post(`${BACKEND_URL}/api/session/start`, {
        date: today,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        start_timestamp: now.toISOString()  // Send frontend local time
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

      setIsWorking(false);
      const sessionId = currentSession.id;
      setCurrentSession(null);
      setTimeWorked('00:00:00');
      await AsyncStorage.removeItem('activeSessionId');

      // Check if auto-send is enabled (manual stop work - always ask)
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
                  session_id: sessionId
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
    // If camera permission not granted, request it first
    if (!cameraPermission) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Leidimas būtinas',
          'Programai reikalingas leidimas naudoti kamerą.\n\nEikite į iPhone Settings ir suteikite leidimą.',
          [{ text: 'Gerai' }]
        );
        return;
      }
      setCameraPermission(true);
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
