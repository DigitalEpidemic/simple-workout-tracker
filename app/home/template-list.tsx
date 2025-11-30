import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * Template List Screen - Display all workout templates
 *
 * Features:
 * - Display all saved workout templates
 * - Search/filter templates
 * - Show template metadata
 * - Create new template button
 * - Swipe actions: Edit, Delete, Duplicate
 */
export default function TemplateListScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <IconSymbol size={28} name="chevron.left" color="#007AFF" />
          </Pressable>
          <ThemedText type="title">Templates</ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push('/home/template-builder')}
          >
            <IconSymbol size={24} name="plus.circle.fill" color="#007AFF" />
            <ThemedText style={styles.createButtonText}>Create New Template</ThemedText>
          </Pressable>

          <ThemedText style={styles.emptyState}>
            No templates yet. Create your first workout template!
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    gap: 12,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    gap: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    textAlign: 'center',
    opacity: 0.5,
  },
});
