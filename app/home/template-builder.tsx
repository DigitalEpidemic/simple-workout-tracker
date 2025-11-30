import React from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * Template Builder Screen - Create or edit workout templates
 *
 * Features:
 * - Create or edit workout template
 * - Set template name
 * - Add/remove/reorder exercises
 * - Configure default sets/reps for each exercise
 * - Save or cancel template
 */
export default function TemplateBuilderScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const [templateName, setTemplateName] = React.useState('');

  const isEditing = !!templateId;

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <IconSymbol size={28} name="chevron.left" color="#007AFF" />
          </Pressable>
          <ThemedText type="title">
            {isEditing ? 'Edit Template' : 'New Template'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Template Name</ThemedText>
            <TextInput
              style={styles.input}
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="e.g., Push Day, Leg Day"
              placeholderTextColor="rgba(128, 128, 128, 0.5)"
            />
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Exercises</ThemedText>
            <Pressable style={styles.addButton}>
              <IconSymbol size={24} name="plus.circle.fill" color="#007AFF" />
              <ThemedText style={styles.addButtonText}>Add Exercise</ThemedText>
            </Pressable>

            <ThemedText style={styles.emptyState}>
              No exercises added yet. Tap &ldquo;Add Exercise&rdquo; to get started!
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      <ThemedView style={styles.footer}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </Pressable>
        <Pressable style={styles.saveButton}>
          <ThemedText style={styles.saveButtonText}>Save Template</ThemedText>
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
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    fontSize: 16,
  },
  section: {
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    gap: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
