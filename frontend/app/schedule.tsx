import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/schedule/current`);
      setSchedule(response.data.schedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      uploadPDF(file.uri, file.name);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Klaida', 'Nepavyko pasirinkti failo.');
    }
  };

  const uploadPDF = async (uri: string, filename: string) => {
    try {
      setUploading(true);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload to backend
      const response = await axios.post(`${BACKEND_URL}/api/schedule/upload`, {
        pdf_base64: `data:application/pdf;base64,${base64}`,
        filename: filename,
      });

      Alert.alert('Sėkmė', 'Darbo grafikas įkeltas ir išanalizuotas!');
      setSchedule(response.data.schedule);
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      const errorMessage = error.response?.data?.detail || 'Nepavyko įkelti grafiko.';
      Alert.alert('Klaida', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('lt-LT', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  const getUpcomingDays = () => {
    if (!schedule?.work_days) return [];
    const today = new Date().toISOString().split('T')[0];
    return schedule.work_days.filter((day: any) => day.date >= today).slice(0, 10);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <Ionicons name="cloud-upload" size={48} color="#2563eb" />
          <Text style={styles.uploadTitle}>Įkelti naują darbo grafiką</Text>
          <Text style={styles.uploadDescription}>
            Pasirinkite PDF failą su darbo grafiku. AI automatiškai ištrauks darbo laikus.
          </Text>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={pickDocument}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="document" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>Pasirinkti PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Current Schedule */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : schedule ? (
          <View style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>Dabartinis grafikas</Text>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleDate}>
                Įkeltas: {new Date(schedule.uploaded_at).toLocaleDateString('lt-LT')}
              </Text>
              <Text style={styles.scheduleFile}>
                Failas: {schedule.pdf_filename}
              </Text>
            </View>

            {/* Upcoming Work Days */}
            <Text style={styles.subsectionTitle}>Artėjantys darbo dienos</Text>
            {getUpcomingDays().length > 0 ? (
              getUpcomingDays().map((day: any, index: number) => (
                <View key={index} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Ionicons name="calendar" size={20} color="#2563eb" />
                    <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                  </View>
                  <View style={styles.dayTimes}>
                    <View style={styles.timeItem}>
                      <Text style={styles.timeLabel}>Pradžia:</Text>
                      <Text style={styles.timeValue}>{day.start}</Text>
                    </View>
                    <View style={styles.timeItem}>
                      <Text style={styles.timeLabel}>Pabaiga:</Text>
                      <Text style={styles.timeValue}>{day.end}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>Nėra artėjančių darbo dienų</Text>
            )}
          </View>
        ) : (
          <View style={styles.noScheduleSection}>
            <Ionicons name="calendar-outline" size={64} color="#6b7280" />
            <Text style={styles.noScheduleText}>Darbo grafikas neįkeltas</Text>
            <Text style={styles.noScheduleDescription}>
              Įkelkite PDF failą su savo darbo grafiku, kad galbūt sekti viršvalandžius.
            </Text>
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
  uploadSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  scheduleSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
  },
  scheduleInfo: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scheduleDate: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  scheduleFile: {
    fontSize: 12,
    color: '#6b7280',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dayCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  dayTimes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  noScheduleSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noScheduleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noScheduleDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});