import React from 'react';
import { StyleSheet, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * Shared Add Exercise Button component
 * Used in Template Builder and Start Workout screens
 */
interface AddExerciseButtonProps {
  onPress?: () => void;
}

export function AddExerciseButton({ onPress }: AddExerciseButtonProps) {
  return (
    <Pressable style={styles.addButton} onPress={onPress}>
      <IconSymbol size={24} name="plus.circle.fill" color="#007AFF" />
      <ThemedText style={styles.addButtonText}>Add Exercise</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
});
