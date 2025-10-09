import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

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
                <TouchableOpacity 
                  key={index} 
                  style={styles.sessionCard}
                  onPress={() => toggleSession(session.id)}
                >
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
                    </View>
                  )}
                </TouchableOpacity>
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
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
});