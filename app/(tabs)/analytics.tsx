import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * Analytics Screen - Stats and charts
 *
 * Features:
 * - Overview cards (total workouts, volume, frequency, streak)
 * - Charts (volume over time, workouts per week, top exercises)
 * - Filter by date range
 * - PR summary cards
 */
export default function AnalyticsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Analytics</ThemedText>
          <ThemedText style={styles.subtitle}>Track your progress</ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedText style={styles.emptyState}>
            Complete some workouts to see your analytics and progress charts!
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
