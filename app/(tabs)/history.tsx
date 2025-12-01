/**
 * History Screen - Phase 4.1
 *
 * Features:
 * - List all completed workouts in reverse chronological order
 * - Display summary for each workout (date, duration, volume)
 * - Tap to open detailed session view
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, View, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WorkoutCard } from '@/src/features/history/components/workout-card';
import { getWorkoutHistory, WorkoutSummary } from '@/src/features/history/api/historyService';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load workout history from database
   */
  const loadWorkouts = async () => {
    try {
      const history = await getWorkoutHistory();
      setWorkouts(history);
    } catch (error) {
      console.error('Failed to load workout history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Reload workouts when screen is focused
   */
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWorkouts();
    }, [])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkouts();
  };

  /**
   * Navigate to workout detail screen
   */
  const handleWorkoutPress = (workoutId: string) => {
    router.push({
      pathname: '/history/workout-detail',
      params: { workoutId },
    });
  };

  /**
   * Render empty state when no workouts exist
   */
  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyStateContainer}>
        <ThemedText style={[styles.emptyState, { color: colors.textSecondary }]}>
          No workouts yet.{'\n'}Complete your first workout to see it here!
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">History</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {workouts.length === 0
            ? 'No workouts completed'
            : `${workouts.length} ${workouts.length === 1 ? 'workout' : 'workouts'} completed`}
        </ThemedText>
      </ThemedView>

      {/* Loading indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        /* Workout list */
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onPress={() => handleWorkoutPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 60,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    flexGrow: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});
