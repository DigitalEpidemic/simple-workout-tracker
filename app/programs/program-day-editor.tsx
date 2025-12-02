/**
 * Program Day Editor Screen
 *
 * PLACEHOLDER: Edit exercises for a specific program day
 * TODO: Implement exercise CRUD for program days
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProgramDayEditorScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.placeholder}>
            Program Day Editor - Coming Soon
          </ThemedText>
          <ThemedText style={styles.subtext}>
            This screen will allow you to:
            {'\n'}- Edit day name
            {'\n'}- Add/remove/reorder exercises
            {'\n'}- Set targets (sets, reps, weight, rest time) for each exercise
            {'\n'}- Add notes to exercises
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
