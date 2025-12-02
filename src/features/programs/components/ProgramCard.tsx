/**
 * ProgramCard Component
 *
 * Displays a training program in a card format.
 * Shows program name, description, day count, and active status.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Program } from '@/types';
import { Card } from '@/components/ui/card';
import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ProgramCardProps {
  program: Omit<Program, 'days'>;
  onPress?: () => void;
  onActivate?: () => void;
  onDelete?: () => void;
}

export function ProgramCard({
  program,
  onPress,
  onActivate,
  onDelete,
}: ProgramCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                {program.name}
              </Text>
              {program.isActive && (
                <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              )}
            </View>
            {program.description && (
              <Text
                style={[styles.description, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {program.description}
              </Text>
            )}
          </View>
        </View>

        {program.isActive && (
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                Day {program.currentDayIndex + 1}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Next Up
              </Text>
            </View>
          </View>
        )}

        {(onActivate || onPress || onDelete) && (
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            {!program.isActive && onActivate && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onActivate}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  Activate
                </Text>
              </TouchableOpacity>
            )}
            {onPress && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onPress}
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
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  activeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  description: {
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * 1.5,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.lg,
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
