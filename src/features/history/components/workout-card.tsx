/**
 * WorkoutCard Component
 *
 * Displays a summary card for a completed workout in the history list.
 * Shows date, name, duration, exercise count, total sets, and volume.
 */

import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeightDisplay } from '@/src/hooks/useWeightDisplay';
import { WorkoutSummary } from '../api/historyService';

export interface WorkoutCardProps {
  workout: WorkoutSummary;
  onPress: () => void;
}

/**
 * Format duration in seconds to a readable string
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string like "1h 23m" or "45m"
 */
function formatDuration(seconds?: number): string {
  if (!seconds) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/**
 * Format timestamp to a readable date string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string like "Mon, Jan 1"
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString('en-US', options);
}

export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { convertWeight, getUnit } = useWeightDisplay();

  /**
   * Format volume to a readable string
   *
   * @param volume - Total volume in lbs (storage format)
   * @returns Formatted string like "1,234" or "612"
   */
  const formatVolume = (volume: number): string => {
    const converted = Math.round(convertWeight(volume));
    return converted.toLocaleString();
  };

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card
          variant="elevated"
          style={[
            styles.card,
            pressed && { opacity: 0.7 },
          ]}
        >
          {/* Header: Date and Duration */}
          <View style={styles.header}>
            <ThemedText style={styles.date}>
              {formatDate(workout.date)}
            </ThemedText>
            <ThemedText style={[styles.duration, { color: colors.textSecondary }]}>
              {formatDuration(workout.duration)}
            </ThemedText>
          </View>

          {/* Workout Name */}
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {workout.name}
          </ThemedText>

          {/* Template Name (if used) */}
          {workout.templateName && workout.templateName !== workout.name && (
            <ThemedText style={[styles.templateName, { color: colors.textSecondary }]}>
              from {workout.templateName}
            </ThemedText>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                {workout.exerciseCount}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                {workout.exerciseCount === 1 ? 'exercise' : 'exercises'}
              </ThemedText>
            </View>

            <View style={styles.stat}>
              <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                {workout.totalSets}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                {workout.totalSets === 1 ? 'set' : 'sets'}
              </ThemedText>
            </View>

            <View style={styles.stat}>
              <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                {formatVolume(workout.totalVolume)}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                volume ({getUnit()})
              </ThemedText>
            </View>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  duration: {
    fontSize: FontSizes.sm,
  },
  name: {
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xs,
  },
  templateName: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSizes.xs,
  },
});
