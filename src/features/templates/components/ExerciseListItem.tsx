/**
 * ExerciseListItem Component
 *
 * Displays an exercise in a template builder with drag handle,
 * exercise details, and remove button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExerciseTemplate } from '@/types';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ExerciseListItemProps {
  exercise: Omit<ExerciseTemplate, 'id' | 'workoutTemplateId' | 'createdAt' | 'updatedAt'>;
  index: number;
  onPress?: () => void;
  onRemove?: () => void;
  dragHandle?: React.ReactNode;
}

export function ExerciseListItem({
  exercise,
  index,
  onPress,
  onRemove,
  dragHandle,
}: ExerciseListItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatTargets = () => {
    const parts: string[] = [];

    if (exercise.targetSets) {
      parts.push(`${exercise.targetSets} sets`);
    }

    if (exercise.targetReps) {
      parts.push(`${exercise.targetReps} reps`);
    }

    if (exercise.targetWeight) {
      parts.push(`${exercise.targetWeight} lbs`);
    }

    return parts.length > 0 ? parts.join(' " ') : 'No targets set';
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          },
        ]}
      >
        {dragHandle && <View style={styles.dragHandle}>{dragHandle}</View>}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.orderNumber, { color: colors.textTertiary }]}>
              {index + 1}.
            </Text>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>{exercise.name}</Text>
              <Text style={[styles.targets, { color: colors.textSecondary }]}>
                {formatTargets()}
              </Text>
              {exercise.notes && (
                <Text
                  style={[styles.notes, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {exercise.notes}
                </Text>
              )}
            </View>
          </View>
        </View>

        {onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            activeOpacity={0.7}
          >
            <Text style={[styles.removeText, { color: colors.error }]}>�</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dragHandle: {
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    marginRight: Spacing.sm,
    minWidth: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs / 2,
  },
  targets: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs / 2,
  },
  notes: {
    fontSize: FontSizes.xs,
    fontStyle: 'italic',
  },
  removeButton: {
    marginLeft: Spacing.sm,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    lineHeight: 32,
  },
});
