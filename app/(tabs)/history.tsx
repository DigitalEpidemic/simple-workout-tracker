import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * History Screen - List of completed workouts
 *
 * Features:
 * - List all completed workouts in reverse chronological order
 * - Group by week/month
 * - Display summary for each workout
 * - Filter by date range or exercise
 * - Search workouts
 */
export default function HistoryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">History</ThemedText>
          <ThemedText style={styles.subtitle}>Your workout history</ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedText style={styles.emptyState}>
            No workouts yet. Complete your first workout to see it here!
          </ThemedText>
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
    padding: 20,
    paddingTop: 60,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  emptyState: {
    padding: 40,
    textAlign: 'center',
    opacity: 0.5,
  },
});
