import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * Workout Summary Screen - Display completed workout details
 *
 * Features:
 * - Display completed workout details
 * - Total duration, exercises completed, total sets, total volume
 * - PRs achieved (highlighted)
 * - Option to add workout notes
 * - Save or Discard workout
 */
export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const { workoutSessionId } = useLocalSearchParams<{ workoutSessionId: string }>();

  const handleSaveWorkout = () => {
    // TODO: Save workout to database
    router.push('/(tabs)');
  };

  const handleDiscardWorkout = () => {
    // TODO: Show confirmation dialog and delete workout
    router.push('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Workout Complete!</ThemedText>
          <IconSymbol size={48} name="checkmark.circle.fill" color="#34C759" />
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedView style={styles.statsGrid}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statValue}>0:00:00</ThemedText>
              <ThemedText style={styles.statLabel}>Duration</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Exercises</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Sets</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statValue}>0 lbs</ThemedText>
              <ThemedText style={styles.statLabel}>Volume</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Exercises</ThemedText>
            <ThemedText style={styles.emptyState}>
              No exercises completed
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      <ThemedView style={styles.footer}>
        <Pressable style={styles.discardButton} onPress={handleDiscardWorkout}>
          <ThemedText style={styles.discardButtonText}>Discard</ThemedText>
        </Pressable>
        <Pressable style={styles.saveButton} onPress={handleSaveWorkout}>
          <ThemedText style={styles.saveButtonText}>Save Workout</ThemedText>
        </Pressable>
      </ThemedView>
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
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    gap: 12,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    gap: 12,
  },
  emptyState: {
    padding: 20,
    textAlign: 'center',
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  discardButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  saveButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#34C759',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
