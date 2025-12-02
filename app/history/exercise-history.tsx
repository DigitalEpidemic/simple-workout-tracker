/**
 * Exercise History Screen - Phase 4.3
 *
 * Features:
 * - Display all workouts where a specific exercise was performed
 * - Show performance metrics for each workout (sets, reps, weight, volume)
 * - Display overall statistics (total workouts, max weight, average volume)
 * - Navigate to workout detail from each entry
 * - Show sets breakdown for each workout
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeightDisplay } from '@/src/hooks/useWeightDisplay';
import {
  Colors,
  Spacing,
  FontSizes,
  FontWeights,
  BorderRadius,
} from '@/constants/theme';
import { useExerciseHistory } from '@/src/features/history/hooks/useExerciseHistory';
import { ExercisePerformance } from '@/src/features/history/api/exerciseHistoryService';
import { WorkoutSet } from '@/types';

/**
 * Individual workout performance card
 */
function WorkoutPerformanceCard({
  performance,
  colors,
  onPress,
}: {
  performance: ExercisePerformance;
  colors: any;
  onPress: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { convertWeight, displayWeight, getUnit } = useWeightDisplay();

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleTimeString('en-US', options);
  };

  return (
    <View
      style={[
        styles.performanceCard,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={styles.performanceHeader}
      >
        <View style={styles.performanceHeaderLeft}>
          <Text style={[styles.workoutName, { color: colors.text }]}>
            {performance.workoutName}
          </Text>
          <Text style={[styles.workoutDate, { color: colors.textSecondary }]}>
            {formatDate(performance.workoutDate)} at{' '}
            {formatTime(performance.workoutDate)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {/* Stats summary */}
      <View style={styles.statsSummary}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {performance.completedSets}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            sets
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.round(convertWeight(performance.maxWeight))}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            max {getUnit()}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.round(convertWeight(performance.totalVolume)).toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            volume
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {performance.totalReps}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            reps
          </Text>
        </View>
      </View>

      {/* Expanded sets view */}
      {expanded && performance.sets.length > 0 && (
        <View
          style={[
            styles.setsContainer,
            { borderTopColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <Text
            style={[styles.setsHeader, { color: colors.textSecondary }]}
          >
            Sets Breakdown
          </Text>
          {performance.sets.map((set, index) => (
            <View key={set.id} style={styles.setRow}>
              <Text
                style={[styles.setNumber, { color: colors.textTertiary }]}
              >
                Set {index + 1}
              </Text>
              <Text style={[styles.setText, { color: colors.text }]}>
                {displayWeight(set.weight)} × {set.reps} reps
              </Text>
              <Text style={[styles.setVolume, { color: colors.textSecondary }]}>
                {Math.round(convertWeight(set.weight * set.reps)).toLocaleString()} {getUnit()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* View workout button */}
      <Pressable
        onPress={onPress}
        style={[
          styles.viewWorkoutButton,
          {
            borderTopColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.viewWorkoutText, { color: colors.primary }]}>
          View Full Workout
        </Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

/**
 * Statistics summary card
 */
function StatisticsCard({
  statistics,
  colors,
}: {
  statistics: any;
  colors: any;
}) {
  const { convertWeight, getUnit } = useWeightDisplay();

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <View
      style={[
        styles.statsCard,
        {
          backgroundColor: colors.primaryLight,
          borderColor: colors.primary,
        },
      ]}
    >
      <Text style={[styles.statsCardTitle, { color: colors.primary }]}>
        Overall Statistics
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.gridItem}>
          <Text style={[styles.gridValue, { color: colors.text }]}>
            {statistics.totalWorkouts}
          </Text>
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>
            Total Workouts
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.gridValue, { color: colors.text }]}>
            {statistics.totalSets}
          </Text>
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>
            Total Sets
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.gridValue, { color: colors.text }]}>
            {Math.round(convertWeight(statistics.maxWeight))}
          </Text>
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>
            Max Weight ({getUnit()})
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.gridValue, { color: colors.text }]}>
            {Math.round(convertWeight(statistics.avgVolume)).toLocaleString()}
          </Text>
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>
            Avg Volume
          </Text>
        </View>
      </View>

      <View style={styles.lastPerformedContainer}>
        <Text style={[styles.lastPerformedLabel, { color: colors.textSecondary }]}>
          Last Performed:
        </Text>
        <Text style={[styles.lastPerformedValue, { color: colors.text }]}>
          {formatDate(statistics.lastPerformed)}
        </Text>
      </View>
    </View>
  );
}

export default function ExerciseHistoryScreen() {
  const router = useRouter();
  const { exerciseName } = useLocalSearchParams<{ exerciseName: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { performances, statistics, loading, error } = useExerciseHistory(
    exerciseName as string
  );

  const handleWorkoutPress = (workoutSessionId: string) => {
    router.push(`/history/workout-detail?workoutId=${workoutSessionId}`);
  };

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {exerciseName}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Exercise History
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {performances.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="barbell-outline"
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No history found for this exercise
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Complete a workout with this exercise to see it here
            </Text>
          </View>
        ) : (
          <>
            {/* Statistics card */}
            {statistics && (
              <StatisticsCard statistics={statistics} colors={colors} />
            )}

            {/* Performance history */}
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              WORKOUT HISTORY
            </Text>
            {performances.map((performance) => (
              <WorkoutPerformanceCard
                key={`${performance.workoutSessionId}-${performance.exerciseId}`}
                performance={performance}
                colors={colors}
                onPress={() => handleWorkoutPress(performance.workoutSessionId)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  backButtonText: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.medium,
  },
  headerTitleContainer: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
  },
  subtitle: {
    fontSize: FontSizes.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.md,
  },
  statsCardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  gridValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  gridLabel: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  lastPerformedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  lastPerformedLabel: {
    fontSize: FontSizes.sm,
  },
  lastPerformedValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  performanceCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  performanceHeaderLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  workoutName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  workoutDate: {
    fontSize: FontSizes.sm,
  },
  statsSummary: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    fontSize: FontSizes.xs,
  },
  setsContainer: {
    borderTopWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  setsHeader: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  setNumber: {
    fontSize: FontSizes.sm,
    width: 50,
  },
  setText: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  setVolume: {
    fontSize: FontSizes.sm,
  },
  viewWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.xs,
  },
  viewWorkoutText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FontSizes.base,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSizes.lg,
    textAlign: 'center',
  },
});
