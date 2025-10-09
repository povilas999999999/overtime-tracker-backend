import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted');
        }
      }
    };
    
    requestPermissions();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Viršvalandžių Stebėjimas' }} />
      <Stack.Screen name="settings" options={{ title: 'Nustatymai' }} />
      <Stack.Screen name="schedule" options={{ title: 'Darbo Grafikas' }} />
      <Stack.Screen name="history" options={{ title: 'Istorija' }} />
    </Stack>
  );
}
