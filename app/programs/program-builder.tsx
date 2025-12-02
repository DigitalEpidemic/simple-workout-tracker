/**
 * Program Builder Screen
 *
 * PLACEHOLDER: Create/edit program and manage days
 * TODO: Implement program CRUD and day management
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProgramBuilderScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.placeholder}>
            Program Builder - Coming Soon
          </ThemedText>
          <ThemedText style={styles.subtext}>
            This screen will allow you to:
            {'\n'}- Create/edit program name and description
            {'\n'}- Add/remove/reorder program days
            {'\n'}- Navigate to day editor for each day
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
