/**
 * Program List Screen
 *
 * Shows all programs, allows create/edit/delete/activate
 */

import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProgramCard } from '@/src/features/programs/components/ProgramCard';
import {
  fetchAllPrograms,
  removeProgram,
  activateProgram,
  fetchProgramById,
} from '@/src/features/programs/api/programService';
import { Program } from '@/types';

export default function ProgramListScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<(Omit<Program, 'days'> & { dayCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadPrograms();
    }, [])
  );

  async function loadPrograms() {
    try {
      setLoading(true);
      const allPrograms = await fetchAllPrograms();

      // Fetch day count for each program
      const programsWithCount = await Promise.all(
        allPrograms.map(async (p) => {
          const fullProgram = await fetchProgramById(p.id);
          return {
            ...p,
            dayCount: fullProgram?.days.length ?? 0,
          };
        })
      );

      setPrograms(programsWithCount);
    } catch (error) {
      console.error('Failed to load programs:', error);
      Alert.alert('Error', 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }

  function handleCreateProgram() {
    router.push('/programs/program-builder');
  }

  function handleEditProgram(programId: string) {
    router.push(`/programs/program-builder?id=${programId}`);
  }

  async function handleActivateProgram(programId: string) {
    try {
      await activateProgram(programId);
      await loadPrograms();
      Alert.alert('Success', 'Program activated');
    } catch (error: any) {
      console.error('Failed to activate program:', error);
      Alert.alert('Error', error.message || 'Failed to activate program');
    }
  }

  function handleDeleteProgram(programId: string, programName: string) {
    Alert.alert(
      'Delete Program',
      `Are you sure you want to delete "${programName}"? This will also delete all program days and exercises.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeProgram(programId);
              await loadPrograms();
              Alert.alert('Success', 'Program deleted');
            } catch (error) {
              console.error('Failed to delete program:', error);
              Alert.alert('Error', 'Failed to delete program');
            }
          },
        },
      ]
    );
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
                onPress={() => handleEditProgram(program.id)}
                onActivate={() => handleActivateProgram(program.id)}
                onEdit={() => handleEditProgram(program.id)}
                onDelete={() => handleDeleteProgram(program.id, program.name)}
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
