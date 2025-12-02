/**
 * Select Program Day Screen
 *
 * PLACEHOLDER: Choose which program day to perform
 * TODO: Implement day selection and navigation to start-workout
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SelectProgramDayScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.placeholder}>
            Select Program Day - Coming Soon
          </ThemedText>
          <ThemedText style={styles.subtext}>
            This screen will allow you to:
            {'\n'}- View all days in the active program
            {'\n'}- See which day is "Next" (based on current_day_index)
            {'\n'}- Select any day to perform
            {'\n'}- Start workout with selected day
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
  content: {
    padding: 16,
  },
  placeholder: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    opacity: 0.6,
    lineHeight: 22,
  },
});
