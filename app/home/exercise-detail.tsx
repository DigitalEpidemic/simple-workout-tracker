import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * Exercise Detail Screen - Input sets/reps/weight
 *
 * Features:
 * - Display exercise name and instructions
 * - Show all sets for this exercise
 * - Input fields for each set (weight, reps, completed)
 * - Autofill from previous workout
 * - Add/remove sets
 * - Show previous best sets (PR indicator)
 */
export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { workoutSessionId, exerciseId } = useLocalSearchParams<{
    workoutSessionId: string;
    exerciseId: string;
  }>();

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <IconSymbol size={28} name="chevron.left" color="#007AFF" />
          </Pressable>
          <ThemedText type="title">Exercise</ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedView style={styles.exerciseInfo}>
            <ThemedText style={styles.exerciseName}>Bench Press</ThemedText>
            <ThemedText style={styles.previousBest}>Previous best: 135 lbs × 8</ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Sets</ThemedText>
            <ThemedText style={styles.emptyState}>
              No sets recorded yet. Add a set to begin!
            </ThemedText>

            <Pressable style={styles.addButton}>
              <IconSymbol size={24} name="plus.circle.fill" color="#007AFF" />
              <ThemedText style={styles.addButtonText}>Add Set</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      <ThemedView style={styles.footer}>
        <Pressable style={styles.doneButton} onPress={() => router.back()}>
          <ThemedText style={styles.doneButtonText}>Done</ThemedText>
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
  exerciseInfo: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  previousBest: {
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  doneButton: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
