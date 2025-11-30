import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * Active Workout Screen - Main workout interface
 *
 * Features:
 * - Display workout session timer (elapsed time)
 * - Show exercise list with completion status
 * - Current exercise highlighted
 * - Show completed sets with checkmarks
 * - Add Exercise button (mid-workout)
 * - Finish Workout button
 * - Cancel Workout option
 */
export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { workoutSessionId } = useLocalSearchParams<{ workoutSessionId: string }>();

  const handleFinishWorkout = () => {
    router.push(`/home/workout-summary?workoutSessionId=${workoutSessionId}`);
  };

  const handleCancelWorkout = () => {
    // TODO: Show confirmation dialog
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <Pressable onPress={handleCancelWorkout}>
            <IconSymbol size={28} name="xmark" color="#FF3B30" />
          </Pressable>
          <ThemedView style={styles.headerCenter}>
            <ThemedText type="title">Workout</ThemedText>
            <ThemedText style={styles.timer}>00:00:00</ThemedText>
          </ThemedView>
          <Pressable onPress={handleFinishWorkout}>
            <IconSymbol size={28} name="checkmark.circle.fill" color="#34C759" />
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedText style={styles.emptyState}>
            No exercises yet. Add an exercise to begin!
          </ThemedText>

          <Pressable style={styles.addButton}>
            <IconSymbol size={24} name="plus.circle.fill" color="#007AFF" />
            <ThemedText style={styles.addButtonText}>Add Exercise</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  headerCenter: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 4,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  emptyState: {
    padding: 40,
    textAlign: 'center',
    opacity: 0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    gap: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
