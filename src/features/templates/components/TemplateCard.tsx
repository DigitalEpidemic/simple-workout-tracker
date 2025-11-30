/**
 * TemplateCard Component
 *
 * Displays a workout template in a card format.
 * Shows template name, description, exercise count, and last used date.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WorkoutTemplate } from '@/types';
import { Card } from '@/components/ui/card';
import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface TemplateCardProps {
  template: WorkoutTemplate;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TemplateCard({ template, onPress, onEdit, onDelete }: TemplateCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Never used';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{template.name}</Text>
            {template.description && (
              <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                {template.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {template.exercises.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {template.exercises.length === 1 ? 'Exercise' : 'Exercises'}
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>
              {formatDate(template.lastUsed)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Used</Text>
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
                <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onDelete}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
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
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
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
