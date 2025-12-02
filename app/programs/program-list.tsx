/**
 * Program List Screen
 *
 * PLACEHOLDER: Shows all programs, allows create/edit/delete/activate
 * TODO: Implement full CRUD functionality
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProgramCard } from '@/src/features/programs/components/ProgramCard';
import { fetchAllPrograms } from '@/src/features/programs/api/programService';
import { Program } from '@/types';

export default function ProgramListScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<(Omit<Program, 'days'> & { dayCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrograms();
  }, []);

  async function loadPrograms() {
    try {
      const allPrograms = await fetchAllPrograms();
      // TODO: Fetch day count for each program
      const programsWithCount = allPrograms.map(p => ({ ...p, dayCount: 0 }));
      setPrograms(programsWithCount);
    } catch (error) {
      console.error('Failed to load programs:', error);
      Alert.alert('Error', 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }

  function handleCreateProgram() {
    // TODO: Navigate to program builder
    Alert.alert('Coming Soon', 'Program creation will be implemented next');
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          {loading ? (
            <ThemedText style={styles.emptyText}>Loading...</ThemedText>
          ) : programs.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>No programs yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Create your first multi-day training program
              </ThemedText>
            </ThemedView>
          ) : (
            programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onPress={() => {
                  // TODO: Navigate to program builder for editing
                  Alert.alert('Coming Soon', 'Program editing will be implemented next');
                }}
                onActivate={() => {
                  // TODO: Implement activation
                  Alert.alert('Coming Soon', 'Program activation will be implemented next');
                }}
                onEdit={() => {
                  // TODO: Navigate to program builder
                  Alert.alert('Coming Soon', 'Program editing will be implemented next');
                }}
                onDelete={() => {
                  // TODO: Implement delete with confirmation
                  Alert.alert('Coming Soon', 'Program deletion will be implemented next');
                }}
              />
            ))
          )}
        </ThemedView>
      </ScrollView>

      <Pressable style={styles.fab} onPress={handleCreateProgram}>
        <IconSymbol size={24} name="plus" color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.4,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
