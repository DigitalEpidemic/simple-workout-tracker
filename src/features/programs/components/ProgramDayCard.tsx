/**
 * ProgramDayCard Component
 *
 * Displays a program day in a card format.
 * Shows day name, index, exercise count, and next day indicator.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProgramDay } from '@/types';
import { Card } from '@/components/ui/card';
import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ProgramDayCardProps {
  day: ProgramDay;
  isNextDay?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProgramDayCard({
  day,
  isNextDay = false,
  onPress,
  onEdit,
  onDelete,
}: ProgramDayCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.dayNumber, { color: colors.textSecondary }]}>
                Day {day.dayIndex + 1}
              </Text>
              {isNextDay && (
                <View style={[styles.nextBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.nextBadgeText}>NEXT</Text>
                </View>
              )}
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{day.name}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {day.exercises.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {day.exercises.length === 1 ? 'Exercise' : 'Exercises'}
            </Text>
          </View>
        </View>

        {(onEdit || onDelete) && (
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onEdit}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onDelete}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs / 2,
  },
  dayNumber: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  nextBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 4,
  },
  nextBadgeText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs / 2,
  },
  statLabel: {
    fontSize: FontSizes.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  actionText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
  },
});
