/**
 * PRHistoryList Component
 *
 * Displays a comprehensive list of all personal records grouped by exercise.
 * Shows each PR with rep count, weight, and date achieved.
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@/constants/theme';
import { PRRecord } from '@/types';
import { getExerciseNamesWithPRs, getPRsByExerciseName } from '@/src/lib/db/repositories/pr-records';
import { getDisplayName } from '@/src/features/workouts/api/prService';

interface ExercisePRGroup {
  exerciseName: string;
  displayName: string;
  prs: PRRecord[];
}

interface PRHistoryListProps {
  onExercisePress?: (exerciseName: string) => void;
}

export function PRHistoryList({ onExercisePress }: PRHistoryListProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [exercisePRs, setExercisePRs] = useState<ExercisePRGroup[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPRHistory();
  }, []);

  const loadPRHistory = async () => {
    try {
      setLoading(true);

      // Get all exercises that have PRs
      const exerciseNames = await getExerciseNamesWithPRs();

      // Load PRs for each exercise
      const prGroups: ExercisePRGroup[] = [];
      for (const exerciseName of exerciseNames) {
        const prs = await getPRsByExerciseName(exerciseName);
        if (prs.length > 0) {
          prGroups.push({
            exerciseName,
            displayName: getDisplayName(exerciseName),
            prs: prs.sort((a, b) => a.reps - b.reps), // Sort by reps ascending
          });
        }
      }

      // Sort exercises alphabetically
      prGroups.sort((a, b) => a.displayName.localeCompare(b.displayName));

      setExercisePRs(prGroups);
    } catch (error) {
      console.error('Error loading PR history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (exerciseName: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseName)) {
        next.delete(exerciseName);
      } else {
        next.add(exerciseName);
      }
      return next;
    });
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (exercisePRs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="trophy-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Personal Records Yet
        </Text>
        <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
          Complete workouts to start tracking your PRs!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {exercisePRs.map((group) => {
          const isExpanded = expandedExercises.has(group.exerciseName);

          return (
            <View key={group.exerciseName} style={styles.exerciseGroup}>
              <Pressable
                onPress={() => {
                  if (onExercisePress) {
                    onExercisePress(group.exerciseName);
                  } else {
                    toggleExercise(group.exerciseName);
                  }
                }}
                style={[
                  styles.exerciseHeader,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.exerciseHeaderLeft}>
                  <View
                    style={[
                      styles.trophyBadge,
                      { backgroundColor: colors.warningLight },
                    ]}
                  >
                    <Ionicons name="trophy" size={20} color={colors.warning} />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {group.displayName}
                    </Text>
                    <Text style={[styles.prCount, { color: colors.textSecondary }]}>
                      {group.prs.length} PR{group.prs.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                {!onExercisePress && (
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.textSecondary}
                  />
                )}
              </Pressable>

              {isExpanded && !onExercisePress && (
                <View style={styles.prList}>
                  {group.prs.map((pr) => (
                    <View
                      key={pr.id}
                      style={[
                        styles.prCard,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.prCardLeft}>
                        <Text style={[styles.prReps, { color: colors.primary }]}>
                          {pr.reps} {pr.reps === 1 ? 'rep' : 'reps'}
                        </Text>
                        <Text style={[styles.prWeight, { color: colors.text }]}>
                          {pr.weight} lbs
                        </Text>
                      </View>
                      <Text style={[styles.prDate, { color: colors.textSecondary }]}>
                        {formatDate(pr.achievedAt)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: FontSizes.base,
    textAlign: 'center',
  },
  exerciseGroup: {
    marginBottom: Spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  exerciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  trophyBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  exerciseName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  prCount: {
    fontSize: FontSizes.sm,
  },
  prList: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    paddingLeft: Spacing.lg,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  prCardLeft: {
    gap: Spacing.xs,
  },
  prReps: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  prWeight: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  prDate: {
    fontSize: FontSizes.sm,
  },
});
