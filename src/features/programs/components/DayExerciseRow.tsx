/**
 * DayExerciseRow Component
 *
 * Displays an exercise in a program day editor with drag handle,
 * exercise details, and remove button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProgramDayExercise } from '@/types';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeightDisplay } from '@/src/hooks/useWeightDisplay';

export interface DayExerciseRowProps {
  exercise: ProgramDayExercise;
  index: number;
  onPress?: () => void;
  onRemove?: () => void;
  dragHandle?: React.ReactNode;
}

export function DayExerciseRow({
  exercise,
  index,
  onPress,
  onRemove,
  dragHandle,
}: DayExerciseRowProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { displayWeight } = useWeightDisplay();

  const formatTargets = () => {
    const parts: string[] = [];

    if (exercise.targetSets) {
      parts.push(`${exercise.targetSets} sets`);
    }

    if (exercise.targetReps) {
      parts.push(`${exercise.targetReps} reps`);
    }

    if (exercise.targetWeight) {
      parts.push(displayWeight(exercise.targetWeight));
    }

    if (exercise.restSeconds) {
      const minutes = Math.floor(exercise.restSeconds / 60);
      const seconds = exercise.restSeconds % 60;
      if (minutes > 0) {
        parts.push(`${minutes}:${seconds.toString().padStart(2, '0')} rest`);
      } else {
        parts.push(`${seconds}s rest`);
      }
    }

    return parts.length > 0 ? parts.join(' • ') : 'No targets set';
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
              <Text style={[styles.name, { color: colors.text }]}>
                {exercise.exerciseName}
              </Text>
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
            <Text style={[styles.removeText, { color: colors.error }]}>✕</Text>
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
    marginBottom: Spacing.sm,
    minHeight: 60,
  },
  dragHandle: {
    padding: Spacing.md,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    marginRight: Spacing.sm,
    marginTop: 2,
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
    padding: Spacing.md,
  },
  removeText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.medium,
  },
});
