import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/sessions/history?limit=50`);
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
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

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return '-';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}val ${minutes}min`;
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const openEditModal = (session: any) => {
    setEditingSession(session);
    setEditDate(session.date);
    
    // Format times from ISO to HH:MM
    const startDate = new Date(session.start_time);
    setEditStartTime(`${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`);
    
    if (session.end_time) {
      const endDate = new Date(session.end_time);
      setEditEndTime(`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
    } else {
      setEditEndTime('');
    }
    
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editingSession) return;

    // Validate inputs
    if (!editDate || !editStartTime) {
      Alert.alert('Klaida', 'Įveskite datą ir pradžios laiką.');
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(editStartTime) || (editEndTime && !timeRegex.test(editEndTime))) {
      Alert.alert('Klaida', 'Neteisingas laiko formatas. Naudokite HH:MM (pvz. 08:30)');
      return;
    }

    try {
      // Create ISO timestamps
      const startISO = `${editDate}T${editStartTime}:00`;
      const endISO = editEndTime ? `${editDate}T${editEndTime}:00` : null;

      await axios.post(`${BACKEND_URL}/api/session/edit`, {
        session_id: editingSession.id,
        date: editDate,
        start_time: startISO,
        end_time: endISO
      });

      Alert.alert('Sėkmė', 'Sesijos laikas pakeistas!');
      setShowEditModal(false);
      loadHistory(); // Reload to show updated data
    } catch (error) {
      console.error('Error editing session:', error);
      Alert.alert('Klaida', 'Nepavyko pakeisti sesijos laiko.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Statistics */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistika</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{sessions.length}</Text>
                <Text style={styles.statLabel}>Iš viso sesijų</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {sessions.filter(s => s.email_sent).length}
                </Text>
                <Text style={styles.statLabel}>Išsiųstų el. laiškų</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {sessions.reduce((sum, s) => sum + (s.photos?.length || 0), 0)}
                </Text>
                <Text style={styles.statLabel}>Nuotraukų</Text>
              </View>
            </View>
          </View>

          {/* Session List */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Darbo sesijos</Text>
            {sessions.length > 0 ? (
              sessions.map((session, index) => (
                <View key={index} style={styles.sessionCard}>
                  <TouchableOpacity onPress={() => toggleSession(session.id)}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionHeaderLeft}>
                        <Ionicons 
                          name={session.end_time ? "checkmark-circle" : "time"} 
                          size={24} 
                          color={session.end_time ? "#10b981" : "#f59e0b"} 
                        />
                        <View style={styles.sessionHeaderText}>
                          <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                          <Text style={styles.sessionTime}>
                            {formatTime(session.start_time)} - {session.end_time ? formatTime(session.end_time) : 'Vyksta'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons 
                        name={expandedSession === session.id ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#6b7280" 
                      />
                    </View>
                  </TouchableOpacity>

                  {expandedSession === session.id && (
                    <View style={styles.sessionDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Trukmė:</Text>
                        <Text style={styles.detailValue}>
                          {calculateDuration(session.start_time, session.end_time)}
                        </Text>
                      </View>

                      {session.overtime_minutes !== null && session.overtime_minutes > 0 && (
                        <View style={[styles.detailRow, styles.overtimeRow]}>
                          <Text style={styles.detailLabel}>Viršvalandžiai:</Text>
                          <Text style={styles.overtimeValue}>
                            {(session.overtime_minutes / 60).toFixed(2)} val
                          </Text>
                        </View>
                      )}

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Nuotraukos:</Text>
                        <Text style={styles.detailValue}>
                          {session.photos?.length || 0}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>El. laiškas:</Text>
                        <View style={styles.emailStatus}>
                          {session.email_sent ? (
                            <>
                              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                              <Text style={styles.emailSent}>Išsiųstas</Text>
                            </>
                          ) : (
                            <>
                              <Ionicons name="close-circle" size={16} color="#6b7280" />
                              <Text style={styles.emailNotSent}>Neišsiųstas</Text>
                            </>
                          )}
                        </View>
                      </View>

                      {session.scheduled_start && session.scheduled_end && (
                        <View style={styles.scheduledInfo}>
                          <Text style={styles.scheduledLabel}>Planuotas laikas:</Text>
                          <Text style={styles.scheduledValue}>
                            {session.scheduled_start} - {session.scheduled_end}
                          </Text>
                        </View>
                      )}

                      {/* Edit Button */}
                      <TouchableOpacity 
                        style={styles.editButton} 
                        onPress={() => openEditModal(session)}
                      >
                        <Ionicons name="create" size={20} color="#2563eb" />
                        <Text style={styles.editButtonText}>Redaguoti laiką</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="folder-open-outline" size={64} color="#6b7280" />
                <Text style={styles.noDataText}>Nėra darbo sesijų</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Redaguoti sesijos laiką</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="2025-01-12"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pradžios laikas (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={editStartTime}
                onChangeText={setEditStartTime}
                placeholder="08:00"
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.hint}>24 valandų formatas, pvz: 08:30</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pabaigos laikas (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={editEndTime}
                onChangeText={setEditEndTime}
                placeholder="17:00"
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.hint}>Palikite tuščią jei sesija dar vyksta</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Atšaukti</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                <Text style={styles.saveButtonText}>Išsaugoti</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  statsSection: {
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  historySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionHeaderText: {
    marginLeft: 12,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  sessionTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  sessionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  overtimeRow: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  overtimeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d97706',
  },
  emailStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailSent: {
    fontSize: 14,
    color: '#10b981',
    marginLeft: 4,
  },
  emailNotSent: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  scheduledInfo: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 12,
  },
  scheduledLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  scheduledValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    marginTop: 8,
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
