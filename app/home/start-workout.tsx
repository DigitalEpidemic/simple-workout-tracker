import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AddExerciseButton } from '@/components/add-exercise-button';

/**
 * Start Workout Flow Screen - Preview before starting workout
 *
 * Features:
 * - Preview selected template or empty workout
 * - ADD EXERCISES to empty workout BEFORE starting
 * - Show all exercises and planned sets
 * - Allow last-minute exercise reordering
 * - Begin workout confirmation (starts timer)
 */
export default function StartWorkoutScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();

  const handleStartWorkout = () => {
    // TODO: Create workout session and navigate to active workout
    // For now, just show placeholder
    alert('Workout session will be created here');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <IconSymbol size={28} name="chevron.left" color="#007AFF" />
          </Pressable>
          <ThemedText type="title">Start Workout</ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedView style={styles.infoCard}>
            <ThemedText style={styles.workoutName}>
              {templateId ? 'Template Workout' : 'Empty Workout'}
            </ThemedText>
            <ThemedText style={styles.workoutInfo}>
              0 exercises · Ready to begin
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Exercises</ThemedText>

            <AddExerciseButton />

            <ThemedText style={styles.emptyState}>
              No exercises added yet. Add exercises before starting your workout!
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      <ThemedView style={styles.footer}>
        <Pressable style={styles.startButton} onPress={handleStartWorkout}>
          <IconSymbol size={24} name="play.fill" color="#FFFFFF" />
          <ThemedText style={styles.startButtonText}>Begin Workout</ThemedText>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    gap: 12,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  workoutInfo: {
    fontSize: 14,
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
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
