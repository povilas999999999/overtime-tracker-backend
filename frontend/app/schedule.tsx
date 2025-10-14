import React, { useState, useEffect } from 'react';
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
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showEditDayModal, setShowEditDayModal] = useState(false);
  const [manualEntries, setManualEntries] = useState<any[]>([{ date: '', start: '', end: '' }]);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editDayDate, setEditDayDate] = useState('');
  const [editDayStart, setEditDayStart] = useState('');
  const [editDayEnd, setEditDayEnd] = useState('');

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

  // Method 1: PDF Upload (FIXED)
  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setShowMethodModal(false);
      uploadPDF(file.uri, file.name);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Klaida', 'Nepavyko pasirinkti failo.');
    }
  };

  const uploadPDF = async (uri: string, filename: string) => {
    try {
      setUploading(true);

      // FIXED: Remove FileSystem.EncodingType
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const response = await axios.post(`${BACKEND_URL}/api/schedule/upload`, {
        pdf_base64: `data:application/pdf;base64,${base64}`,
        filename: filename,
      });

      Alert.alert('Sėkmė', 'Darbo grafikas įkeltas ir išanalizuotas!');
      setSchedule(response.data.schedule);
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Nepavyko įkelti grafiko.';
      Alert.alert('Klaida', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Method 2: Image OCR (FIXED)
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Klaida', 'Reikalingas leidimas naudoti kamerą.');
        return;
      }

      Alert.alert(
        'Pasirinkite šaltinį',
        'Kaip norite įkelti grafiko nuotrauką?',
        [
          { text: 'Fotografuoti', onPress: () => takePhoto() },
          { text: 'Galerija', onPress: () => pickFromGallery() },
          { text: 'Atšaukti', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Klaida', 'Nepavyko prašyti leidimų.');
    }
  };

  const takePhoto = async () => {
    try {
      setShowMethodModal(false);
      
      // FIXED: Use 'images' instead of MediaTypeOptions.Images
      // FIXED: Lower quality to 0.3 to prevent freeze
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Klaida', 'Nepavyko padaryti nuotraukos.');
    }
  };

  const pickFromGallery = async () => {
    try {
      setShowMethodModal(false);
      
      // FIXED: Use 'images' instead of MediaTypeOptions.Images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Klaida', 'Nepavyko pasirinkti nuotraukos.');
    }
  };

  const uploadImage = async (base64: string) => {
    try {
      setUploading(true);

      const response = await axios.post(`${BACKEND_URL}/api/schedule/upload-image`, {
        image_base64: `data:image/jpeg;base64,${base64}`,
      });

      Alert.alert('Sėkmė', 'Grafikas atpažintas ir išsaugotas!');
      setSchedule(response.data.schedule);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error.response?.data?.detail || 'Nepavyko atpažinti grafiko.';
      Alert.alert('Klaida', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Method 3: Manual Entry
  const openManualEntry = () => {
    setShowMethodModal(false);
    setManualEntries([{ date: '', start: '', end: '' }]);
    setShowManualModal(true);
  };

  const addManualEntry = () => {
    setManualEntries([...manualEntries, { date: '', start: '', end: '' }]);
  };

  const removeManualEntry = (index: number) => {
    const newEntries = manualEntries.filter((_, i) => i !== index);
    setManualEntries(newEntries.length > 0 ? newEntries : [{ date: '', start: '', end: '' }]);
  };

  const updateManualEntry = (index: number, field: string, value: string) => {
    const newEntries = [...manualEntries];
    newEntries[index][field] = value;
    setManualEntries(newEntries);
  };

  const saveManualSchedule = async () => {
    try {
      const validEntries = manualEntries.filter(e => e.date && e.start && e.end);
      
      if (validEntries.length === 0) {
        Alert.alert('Klaida', 'Įveskite bent vieną pilną darbo dieną.');
        return;
      }

      setUploading(true);
      setShowManualModal(false);

      const response = await axios.post(`${BACKEND_URL}/api/schedule/manual`, {
        work_days: validEntries,
      });

      Alert.alert('Sėkmė', `Išsaugota ${validEntries.length} darbo dienų!`);
      setSchedule(response.data.schedule);
    } catch (error: any) {
      console.error('Error saving manual schedule:', error);
      const errorMessage = error.response?.data?.detail || 'Nepavyko išsaugoti grafiko.';
      Alert.alert('Klaida', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Edit Day Function
  const openEditDay = (index: number, day: any) => {
    setEditingDayIndex(index);
    setEditDayDate(day.date);
    setEditDayStart(day.start);
    setEditDayEnd(day.end);
    setShowEditDayModal(true);
  };

  const saveEditedDay = () => {
    if (!schedule || editingDayIndex === null) return;

    // Validate
    if (!editDayDate || !editDayStart || !editDayEnd) {
      Alert.alert('Klaida', 'Užpildykite visus laukus.');
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(editDayStart) || !timeRegex.test(editDayEnd)) {
      Alert.alert('Klaida', 'Neteisingas laiko formatas. Naudokite HH:MM');
      return;
    }

    // Update schedule
    const updatedWorkDays = [...schedule.work_days];
    updatedWorkDays[editingDayIndex] = {
      date: editDayDate,
      start: editDayStart,
      end: editDayEnd,
    };

    // Save to backend
    saveUpdatedSchedule(updatedWorkDays);
  };

  const saveUpdatedSchedule = async (workDays: any[]) => {
    try {
      setUploading(true);
      setShowEditDayModal(false);

      const response = await axios.post(`${BACKEND_URL}/api/schedule/manual`, {
        work_days: workDays,
      });

      Alert.alert('Sėkmė', 'Grafikas atnaujintas!');
      setSchedule(response.data.schedule);
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      Alert.alert('Klaida', 'Nepavyko atnaujinti grafiko.');
    } finally {
      setUploading(false);
    }
  };

  const deleteSchedule = async () => {
    if (!schedule) return;

    Alert.alert(
      'Ištrinti grafiką?',
      'Ar tikrai norite ištrinti dabartinį darbo grafiką?',
      [
        { text: 'Ne', style: 'cancel' },
        {
          text: 'Taip, ištrinti',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/schedule/${schedule.id}`);
              Alert.alert('Sėkmė', 'Grafikas ištrintas!');
              setSchedule(null);
            } catch (error) {
              Alert.alert('Klaida', 'Nepavyko ištrinti grafiko.');
            }
          }
        }
      ]
    );
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
          <Text style={styles.uploadTitle}>Įkelti darbo grafiką</Text>
          <Text style={styles.uploadDescription}>
            Pasirinkite vieną iš trijų būdų įkelti savo darbo grafiką
          </Text>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={() => setShowMethodModal(true)}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>Pasirinkti metodą</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Method Selection Modal */}
        <Modal
          visible={showMethodModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMethodModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Pasirinkite įkėlimo metodą</Text>
              
              <TouchableOpacity style={styles.methodButton} onPress={pickPDF}>
                <Ionicons name="document" size={32} color="#2563eb" />
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>PDF Failas</Text>
                  <Text style={styles.methodDescription}>
                    Įkelkite PDF dokumentą su grafiku
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.methodButton} onPress={pickImage}>
                <Ionicons name="camera" size={32} color="#10b981" />
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>Nuotrauka (OCR)</Text>
                  <Text style={styles.methodDescription}>
                    Nufotografuokite grafiką - AI atpažins tekstą
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.methodButton} onPress={openManualEntry}>
                <Ionicons name="create" size={32} color="#f59e0b" />
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>Rankinis įvedimas</Text>
                  <Text style={styles.methodDescription}>
                    Įveskite darbo laikus rankiniu būdu
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowMethodModal(false)}
              >
                <Text style={styles.cancelButtonText}>Atšaukti</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Manual Entry Modal */}
        <Modal
          visible={showManualModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowManualModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rankinis grafiko įvedimas</Text>
              <Text style={styles.modalSubtitle}>
                Formatas: Data (YYYY-MM-DD), Pradžia (HH:MM), Pabaiga (HH:MM)
              </Text>
              
              <ScrollView style={styles.entriesContainer}>
                {manualEntries.map((entry, index) => (
                  <View key={index} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryNumber}>#{index + 1}</Text>
                      {manualEntries.length > 1 && (
                        <TouchableOpacity onPress={() => removeManualEntry(index)}>
                          <Ionicons name="trash" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <TextInput
                      style={styles.input}
                      placeholder="Data (pvz. 2025-01-15)"
                      value={entry.date}
                      onChangeText={(text) => updateManualEntry(index, 'date', text)}
                    />
                    
                    <View style={styles.timeRow}>
                      <TextInput
                        style={[styles.input, styles.timeInput]}
                        placeholder="Pradžia (09:00)"
                        value={entry.start}
                        onChangeText={(text) => updateManualEntry(index, 'start', text)}
                      />
                      <TextInput
                        style={[styles.input, styles.timeInput]}
                        placeholder="Pabaiga (17:00)"
                        value={entry.end}
                        onChangeText={(text) => updateManualEntry(index, 'end', text)}
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.addButton} onPress={addManualEntry}>
                <Ionicons name="add-circle" size={24} color="#2563eb" />
                <Text style={styles.addButtonText}>Pridėti dieną</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveButton} onPress={saveManualSchedule}>
                  <Text style={styles.saveButtonText}>Išsaugoti</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowManualModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Atšaukti</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Day Modal */}
        <Modal
          visible={showEditDayModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditDayModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Redaguoti darbo dieną</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={editDayDate}
                  onChangeText={setEditDayDate}
                  placeholder="2025-01-15"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pradžios laikas (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={editDayStart}
                  onChangeText={setEditDayStart}
                  placeholder="09:00"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pabaigos laikas (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={editDayEnd}
                  onChangeText={setEditDayEnd}
                  placeholder="17:00"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveButton} onPress={saveEditedDay}>
                  <Text style={styles.saveButtonText}>Išsaugoti</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowEditDayModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Atšaukti</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Current Schedule */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : schedule ? (
          <View style={styles.scheduleSection}>
            <View style={styles.scheduleTitleRow}>
              <Text style={styles.sectionTitle}>Dabartinis grafikas</Text>
              <TouchableOpacity onPress={deleteSchedule} style={styles.deleteIconButton}>
                <Ionicons name="trash" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleDate}>
                Įkeltas: {new Date(schedule.uploaded_at).toLocaleDateString('lt-LT')}
              </Text>
              <Text style={styles.scheduleFile}>
                Šaltinis: {schedule.pdf_filename}
              </Text>
            </View>

            {/* Upcoming Work Days - FIXED GRAMMAR */}
            <Text style={styles.subsectionTitle}>Artėjancios darbo dienos</Text>
            {getUpcomingDays().length > 0 ? (
              getUpcomingDays().map((day: any, index: number) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.dayCard}
                  onPress={() => openEditDay(index, day)}
                >
                  <View style={styles.dayHeader}>
                    <Ionicons name="calendar" size={20} color="#2563eb" />
                    <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                    <Ionicons name="create" size={16} color="#6b7280" />
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
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>Nėra artėjančių darbo dienų</Text>
            )}

            {/* Delete Schedule Button */}
            <TouchableOpacity style={styles.deleteButton} onPress={deleteSchedule}>
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Ištrinti grafiką</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noScheduleSection}>
            <Ionicons name="calendar-outline" size={64} color="#6b7280" />
            <Text style={styles.noScheduleText}>Darbo grafikas neįkeltas</Text>
            <Text style={styles.noScheduleDescription}>
              Įkelkite savo darbo grafiką naudodami vieną iš trijų metodų aukščiau.
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  methodTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  entriesContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  entryCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  scheduleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  deleteIconButton: {
    padding: 4,
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
    flex: 1,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
