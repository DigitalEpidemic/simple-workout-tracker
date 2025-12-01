/**
 * Active Workout Screen - Phase 3.1
 *
 * Features:
 * - Running workout timer (elapsed time)
 * - List of exercises in session
 * - Drag to reorder exercises
 * - Navigate into an exercise
 * - Finish workout button
 * - Cancel workout option
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Exercise, WorkoutSet } from '@/types';
import { useWorkout } from '@/src/features/workouts/hooks/useWorkout';
import { useTimer } from '@/src/features/workouts/hooks/useTimer';
import { reorderExercises } from '@/src/lib/db/repositories/sessions';
import { completeSession } from '@/src/lib/db/repositories/sessions';
import { workoutStore } from '@/src/stores/workoutStore';
import { Button } from '@/components/ui/button';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { workoutSessionId } = useLocalSearchParams<{ workoutSessionId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { session, loading, error, refresh } = useWorkout(workoutSessionId as string);
  const { formattedTime } = useTimer({
    startTime: session?.startTime ?? Date.now(),
    isActive: !!session && !session.endTime,
  });

  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Update local exercises when session changes
  React.useEffect(() => {
    if (session?.exercises) {
      setExercises(session.exercises);
    }
  }, [session]);

  const handleFinishWorkout = async () => {
    if (!session) return;

    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'default',
          onPress: async () => {
            try {
              const endTime = Date.now();
              await completeSession(session.id, endTime);
              workoutStore.clearActiveSession();
              router.replace(`/home/workout-summary?workoutSessionId=${session.id}`);
            } catch (err) {
              console.error('Error finishing workout:', err);
              Alert.alert('Error', 'Failed to finish workout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? All progress will be lost.',
      [
        { text: 'Keep Working Out', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (session) {
                // For now, just clear the active session and go back
                // In Phase 3.4, we'll implement proper deletion
                workoutStore.clearActiveSession();
              }
              router.back();
            } catch (err) {
              console.error('Error canceling workout:', err);
              Alert.alert('Error', 'Failed to cancel workout.');
            }
          },
        },
      ]
    );
  };

  const handleExercisePress = (exerciseId: string) => {
    router.push(`/home/exercise-detail?workoutSessionId=${session?.id}&exerciseId=${exerciseId}`);
  };

  const handleDragEnd = async ({ data }: { data: Exercise[] }) => {
    // Update local state immediately for responsiveness
    setExercises(data);

    // Update order in database
    try {
      const exerciseOrders = data.map((exercise, index) => ({
        id: exercise.id,
        order: index,
      }));
      await reorderExercises(exerciseOrders);
      await refresh();
    } catch (err) {
      console.error('Error reordering exercises:', err);
      Alert.alert('Error', 'Failed to reorder exercises. Please try again.');
      // Revert to original order
      if (session?.exercises) {
        setExercises(session.exercises);
      }
    }
  };

  const renderExerciseItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Exercise>) => {
      const completedSets = item.sets.filter((set: WorkoutSet) => set.completed).length;
      const totalSets = item.sets.length;
      const isComplete = totalSets > 0 && completedSets === totalSets;

      return (
        <ScaleDecorator>
          <Pressable
            onPress={() => handleExercisePress(item.id)}
            onLongPress={drag}
            disabled={isActive}
            style={[
              styles.exerciseCard,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                opacity: isActive ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseLeft}>
                <View
                  style={[
                    styles.dragHandle,
                    { backgroundColor: colors.backgroundTertiary },
                  ]}
                >
                  <Text style={[styles.dragHandleText, { color: colors.textSecondary }]}>
                    ⋮⋮
                  </Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.exerciseStats, { color: colors.textSecondary }]}>
                    {totalSets === 0
                      ? 'No sets yet'
                      : `${completedSets} of ${totalSets} sets completed`}
                  </Text>
                </View>
              </View>
              <View style={styles.exerciseRight}>
                {isComplete ? (
                  <View
                    style={[
                      styles.completeBadge,
                      { backgroundColor: colors.successLight },
                    ]}
                  >
                    <Text style={[styles.completeBadgeText, { color: colors.success }]}>
                      ✓
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
                )}
              </View>
            </View>
          </Pressable>
        </ScaleDecorator>
      );
    },
    [colors, handleExercisePress]
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error?.message || 'Workout not found'}
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={styles.errorButton} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleCancelWorkout} style={styles.headerButton}>
          <Text style={[styles.cancelText, { color: colors.error }]}>✕</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.workoutName, { color: colors.text }]}>{session.name}</Text>
          <Text style={[styles.timer, { color: colors.primary }]}>{formattedTime}</Text>
        </View>
        <Pressable onPress={handleFinishWorkout} style={styles.headerButton}>
          <Text style={[styles.finishText, { color: colors.success }]}>✓</Text>
        </Pressable>
      </View>

      {/* Exercise List */}
      <View style={styles.content}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Exercises</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Add exercises to start your workout.
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={exercises}
            onDragEnd={handleDragEnd}
            keyExtractor={(item: Exercise) => item.id}
            renderItem={renderExerciseItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerHint, { color: colors.textSecondary }]}>
          Tap an exercise to log sets · Hold and drag to reorder
        </Text>
      </View>
    </GestureHandlerRootView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  workoutName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  timer: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  cancelText: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semibold,
  },
  finishText: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  exerciseCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  dragHandle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandleText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  exerciseInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  exerciseName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  exerciseStats: {
    fontSize: FontSizes.sm,
  },
  exerciseRight: {
    marginLeft: Spacing.sm,
  },
  chevron: {
    fontSize: FontSizes['2xl'],
  },
  completeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBadgeText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: FontSizes.base,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  footerHint: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: Spacing.md,
  },
});
