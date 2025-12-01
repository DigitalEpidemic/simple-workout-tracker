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

import { Button } from "@/components/ui/button";
import {
  BorderRadius,
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  addExerciseToSession,
  removeExerciseFromSession,
} from "@/src/features/workouts/api/workoutService";
import { useTimer } from "@/src/features/workouts/hooks/useTimer";
import { useWorkout } from "@/src/features/workouts/hooks/useWorkout";
import {
  completeSession,
  reorderExercises,
} from "@/src/lib/db/repositories/sessions";
import { workoutStore } from "@/src/stores/workoutStore";
import { Exercise, WorkoutSet } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { workoutSessionId } = useLocalSearchParams<{
    workoutSessionId: string;
  }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { session, loading, error, refresh } = useWorkout(
    workoutSessionId as string
  );
  const { formattedTime } = useTimer({
    startTime: session?.startTime ?? Date.now(),
    isActive: !!session && !session.endTime,
  });

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  // Update local exercises when session changes
  React.useEffect(() => {
    if (session?.exercises) {
      setExercises(session.exercises);
    }
  }, [session]);

  const handleFinishWorkout = async () => {
    if (!session) return;

    Alert.alert(
      "Finish Workout",
      "Are you sure you want to finish this workout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finish",
          style: "default",
          onPress: async () => {
            try {
              const endTime = Date.now();
              await completeSession(session.id, endTime);
              workoutStore.clearActiveSession();
              router.replace(
                `/home/workout-summary?workoutSessionId=${session.id}`
              );
            } catch (err) {
              console.error("Error finishing workout:", err);
              Alert.alert(
                "Error",
                "Failed to finish workout. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      "Cancel Workout",
      "Are you sure you want to cancel this workout? All progress will be lost.",
      [
        { text: "Keep Working Out", style: "cancel" },
        {
          text: "Cancel Workout",
          style: "destructive",
          onPress: async () => {
            try {
              if (session) {
                // For now, just clear the active session and go back
                // In Phase 3.4, we'll implement proper deletion
                workoutStore.clearActiveSession();
              }
              router.back();
            } catch (err) {
              console.error("Error canceling workout:", err);
              Alert.alert("Error", "Failed to cancel workout.");
            }
          },
        },
      ]
    );
  };

  const handleExercisePress = (exerciseId: string) => {
    router.push(
      `/home/exercise-detail?workoutSessionId=${session?.id}&exerciseId=${exerciseId}`
    );
  };

  const handleAddExercise = () => {
    setIsAddingExercise(true);
  };

  const handleConfirmAddExercise = async () => {
    if (!session) return;

    const trimmedName = newExerciseName.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Please enter an exercise name");
      return;
    }

    try {
      await addExerciseToSession(session.id, trimmedName);
      setNewExerciseName("");
      setIsAddingExercise(false);
      await refresh();
    } catch (err) {
      console.error("Error adding exercise:", err);
      Alert.alert("Error", "Failed to add exercise. Please try again.");
    }
  };

  const handleCancelAddExercise = () => {
    setNewExerciseName("");
    setIsAddingExercise(false);
  };

  const handleRemoveExercise = async (
    exerciseId: string,
    exerciseName: string
  ) => {
    Alert.alert(
      "Remove Exercise",
      `Are you sure you want to remove "${exerciseName}"? All sets will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeExerciseFromSession(exerciseId);
              await refresh();
            } catch (err) {
              console.error("Error removing exercise:", err);
              Alert.alert(
                "Error",
                "Failed to remove exercise. Please try again."
              );
            }
          },
        },
      ]
    );
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
      console.error("Error reordering exercises:", err);
      Alert.alert("Error", "Failed to reorder exercises. Please try again.");
      // Revert to original order
      if (session?.exercises) {
        setExercises(session.exercises);
      }
    }
  };

  const renderExerciseItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Exercise>) => {
      const completedSets = item.sets.filter(
        (set: WorkoutSet) => set.completed
      ).length;
      const totalSets = item.sets.length;
      const isComplete = totalSets > 0 && completedSets === totalSets;

      const renderRightActions = () => {
        return (
          <Pressable
            onPress={() => handleRemoveExercise(item.id, item.name)}
            style={[
              styles.deleteAction,
              {
                backgroundColor: colors.error,
              },
            ]}
          >
            <View style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={28} color="#FFFFFF" />
              <Text style={styles.deleteText}>Remove</Text>
            </View>
          </Pressable>
        );
      };

      return (
        <ScaleDecorator>
          <Swipeable
            renderRightActions={renderRightActions}
            overshootRight={false}
            rightThreshold={80}
          >
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
                    <Text
                      style={[
                        styles.dragHandleText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ⋮⋮
                    </Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.exerciseStats,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {totalSets === 0
                        ? "No sets yet"
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
                      <Text
                        style={[
                          styles.completeBadgeText,
                          { color: colors.success },
                        ]}
                      >
                        ✓
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[styles.chevron, { color: colors.textTertiary }]}
                    >
                      ›
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          </Swipeable>
        </ScaleDecorator>
      );
    },
    [colors, handleExercisePress, handleRemoveExercise]
  );

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error?.message || "Workout not found"}
        </Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleCancelWorkout} style={styles.headerButton}>
          <Text style={[styles.cancelText, { color: colors.error }]}>✕</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.workoutName, { color: colors.text }]}>
            {session.name}
          </Text>
          <Text style={[styles.timer, { color: colors.primary }]}>
            {formattedTime}
          </Text>
        </View>
        <Pressable onPress={handleFinishWorkout} style={styles.headerButton}>
          <Text style={[styles.finishText, { color: colors.success }]}>✓</Text>
        </Pressable>
      </View>

      {/* Exercise List */}
      <View style={styles.content}>
        {exercises.length === 0 && !isAddingExercise ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Exercises
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.textSecondary }]}
            >
              Add exercises to start your workout.
            </Text>
            <Button
              title="Add Exercise"
              onPress={handleAddExercise}
              style={styles.emptyAddButton}
            />
          </View>
        ) : (
          <DraggableFlatList
            data={exercises}
            onDragEnd={handleDragEnd}
            keyExtractor={(item: Exercise) => item.id}
            renderItem={renderExerciseItem}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              isAddingExercise ? (
                <View
                  style={[
                    styles.addExerciseCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.addExerciseLabel, { color: colors.text }]}
                  >
                    Exercise Name
                  </Text>
                  <TextInput
                    value={newExerciseName}
                    onChangeText={setNewExerciseName}
                    placeholder="e.g., Bench Press"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.addExerciseInput,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    autoFocus
                    onSubmitEditing={handleConfirmAddExercise}
                  />
                  <View style={styles.addExerciseActions}>
                    <Button
                      title="Cancel"
                      onPress={handleCancelAddExercise}
                      variant="outline"
                      style={styles.addExerciseButton}
                    />
                    <Button
                      title="Add"
                      onPress={handleConfirmAddExercise}
                      style={styles.addExerciseButton}
                    />
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handleAddExercise}
                  style={[
                    styles.addExerciseFooterButton,
                    {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[styles.addExerciseIcon, { color: colors.primary }]}
                  >
                    +
                  </Text>
                  <Text
                    style={[styles.addExerciseText, { color: colors.primary }]}
                  >
                    Add Exercise
                  </Text>
                </Pressable>
              )
            }
          />
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerHint, { color: colors.textSecondary }]}>
          Tap exercise to log sets · Hold and drag to reorder · Swipe to reveal delete button
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
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
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
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.semibold,
  },
  finishText: {
    fontSize: FontSizes["3xl"],
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  dragHandle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: FontSizes["2xl"],
  },
  completeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  completeBadgeText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: FontSizes.base,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  emptyAddButton: {
    marginTop: Spacing.md,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  addExerciseCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  addExerciseLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  addExerciseInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
  },
  addExerciseActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  addExerciseButton: {
    flex: 1,
  },
  addExerciseFooterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  addExerciseIcon: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.semibold,
  },
  addExerciseText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  footerHint: {
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
  errorText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  errorButton: {
    marginTop: Spacing.md,
  },
});
