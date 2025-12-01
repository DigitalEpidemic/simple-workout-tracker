/**
 * Exercise Detail Screen - Phase 3.2
 *
 * Features:
 * - Display exercise name and instructions
 * - Show all sets for this exercise
 * - Input fields for each set (weight, reps, completed)
 * - Autofill from previous workout
 * - Add/remove sets
 * - Show previous best sets (PR indicator)
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BorderRadius,
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useExercise } from "@/src/features/workouts/hooks/useExercise";
import { WorkoutSet } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

/**
 * Set input row component with swipe-to-delete
 */
function SetRow({
  set,
  setNumber,
  previousSet,
  onUpdate,
  onRemove,
  onToggleComplete,
  colors,
}: {
  set: WorkoutSet;
  setNumber: number;
  previousSet?: WorkoutSet;
  onUpdate: (
    setId: string,
    updates: { reps?: number; weight?: number }
  ) => void;
  onRemove: (setId: string) => void;
  onToggleComplete: (setId: string, completed: boolean) => void;
  colors: any;
}) {
  const swipeableRef = useRef<Swipeable>(null);
  const [reps, setReps] = useState(set.reps.toString());
  const [weight, setWeight] = useState(set.weight.toString());

  // Update local state when set prop changes, but only if the input is not being edited
  const [isEditingReps, setIsEditingReps] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);

  React.useEffect(() => {
    if (!isEditingReps) {
      setReps(set.reps.toString());
    }
  }, [set.reps, isEditingReps]);

  React.useEffect(() => {
    if (!isEditingWeight) {
      setWeight(set.weight.toString());
    }
  }, [set.weight, isEditingWeight]);

  const handleRepsChange = (value: string) => {
    setReps(value);
  };

  const handleRepsFocus = () => {
    setIsEditingReps(true);
  };

  const handleRepsBlur = () => {
    setIsEditingReps(false);
    const numValue = parseInt(reps, 10);
    if (!isNaN(numValue) && numValue > 0) {
      onUpdate(set.id, { reps: numValue });
    } else {
      // Reset to previous value if invalid
      setReps(set.reps.toString());
    }
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
  };

  const handleWeightFocus = () => {
    setIsEditingWeight(true);
  };

  const handleWeightBlur = () => {
    setIsEditingWeight(false);
    const numValue = parseFloat(weight);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate(set.id, { weight: numValue });
    } else {
      // Reset to previous value if invalid
      setWeight(set.weight.toString());
    }
  };

  const handleToggleComplete = () => {
    onToggleComplete(set.id, !set.completed);
  };

  const handleDelete = () => {
    Alert.alert("Remove Set", "Are you sure you want to remove this set?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onRemove(set.id),
      },
    ]);
  };

  // Render the delete action when swiped left
  const renderRightActions = () => {
    return (
      <Pressable
        onPress={handleDelete}
        style={[
          styles.deleteAction,
          {
            backgroundColor: colors.error,
          },
        ]}
      >
        <View style={styles.deleteButton}>
          <Ionicons
            name="trash-outline"
            size={28}
            color={styles.deleteText.color}
          />
          <Text style={styles.deleteText}>Remove</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={80}
    >
      <View
        style={[
          styles.setRow,
          {
            backgroundColor: set.completed
              ? colors.successLight
              : colors.backgroundSecondary,
            borderColor: set.completed ? colors.success : colors.border,
          },
        ]}
      >
        {/* Set number */}
        <View style={styles.setNumberContainer}>
          <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
            {setNumber}
          </Text>
        </View>

        {/* Previous set indicator */}
        <View style={styles.previousSetContainer}>
          <Text
            style={[styles.previousSetText, { color: colors.textTertiary }]}
          >
            {previousSet ? `${previousSet.weight} × ${previousSet.reps}` : "—"}
          </Text>
        </View>

        {/* Weight input */}
        <View style={styles.inputWrapper}>
          <Input
            value={weight}
            onChangeText={handleWeightChange}
            onFocus={handleWeightFocus}
            onBlur={handleWeightBlur}
            keyboardType="decimal-pad"
            placeholder="0"
            size="sm"
            containerStyle={styles.inputContainer}
            inputStyle={styles.centeredInput}
          />
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            lbs
          </Text>
        </View>

        {/* Reps input */}
        <View style={styles.inputWrapper}>
          <Input
            value={reps}
            onChangeText={handleRepsChange}
            onFocus={handleRepsFocus}
            onBlur={handleRepsBlur}
            keyboardType="number-pad"
            placeholder="0"
            size="sm"
            containerStyle={styles.inputContainer}
            inputStyle={styles.centeredInput}
          />
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            reps
          </Text>
        </View>

        {/* Completion checkbox */}
        <Pressable
          onPress={handleToggleComplete}
          style={[
            styles.checkbox,
            {
              backgroundColor: set.completed
                ? colors.success
                : colors.background,
              borderColor: set.completed ? colors.success : colors.border,
            },
          ]}
        >
          {set.completed && (
            <Text style={[styles.checkmark, { color: colors.background }]}>
              ✓
            </Text>
          )}
        </Pressable>
      </View>
    </Swipeable>
  );
}

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{
    workoutSessionId: string;
    exerciseId: string;
  }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const {
    exercise,
    previousSets,
    loading,
    error,
    addSet,
    updateSetData,
    removeSet,
    toggleSetCompletion,
  } = useExercise(exerciseId as string);

  const handleAddSet = async () => {
    if (!exercise) return;

    // Determine default values for new set
    let defaultReps = 10;
    let defaultWeight = 0;

    // Use last set from current workout
    if (exercise.sets.length > 0) {
      const lastSet = exercise.sets[exercise.sets.length - 1];
      defaultReps = lastSet.reps;
      defaultWeight = lastSet.weight;
    }
    // Or use last set from previous workout
    else if (previousSets.length > 0) {
      defaultReps = previousSets[0].reps;
      defaultWeight = previousSets[0].weight;
    }

    await addSet({ reps: defaultReps, weight: defaultWeight });
  };

  const handleRemoveSet = async (setId: string) => {
    await removeSet(setId);
  };

  const handleAutofill = async () => {
    if (!exercise || previousSets.length === 0) return;

    Alert.alert(
      "Autofill Sets",
      `Autofill ${previousSets.length} sets from your last workout?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Autofill",
          style: "default",
          onPress: async () => {
            // Add sets based on previous workout
            for (const prevSet of previousSets) {
              await addSet({ reps: prevSet.reps, weight: prevSet.weight });
            }
          },
        },
      ]
    );
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

  if (error || !exercise) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error?.message || "Exercise not found"}
        </Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  // Find best set from previous workout
  const bestPreviousSet = previousSets.reduce<WorkoutSet | null>(
    (best, set) => {
      if (!best) return set;
      const setBest = set.weight * set.reps;
      const currentBest = best.weight * best.reps;
      return setBest > currentBest ? set : best;
    },
    null
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.primary }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>
            {exercise.name}
          </Text>
          {bestPreviousSet && (
            <Text
              style={[styles.previousBest, { color: colors.textSecondary }]}
            >
              Previous best: {bestPreviousSet.weight} lbs ×{" "}
              {bestPreviousSet.reps}
            </Text>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Sets list */}
      <GestureHandlerRootView style={styles.scrollView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Autofill button */}
          {previousSets.length > 0 && exercise.sets.length === 0 && (
            <View style={styles.autofillContainer}>
              <Button
                title={`Autofill ${previousSets.length} sets from last workout`}
                onPress={handleAutofill}
                variant="outline"
              />
            </View>
          )}

          {/* Sets header */}
          {exercise.sets.length > 0 && (
            <View style={styles.setsHeader}>
              <View style={styles.setNumberContainer}>
                <Text
                  style={[
                    styles.setsHeaderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  SET
                </Text>
              </View>
              <View style={styles.previousSetContainer}>
                <Text
                  style={[
                    styles.setsHeaderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  PREVIOUS
                </Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text
                  style={[
                    styles.setsHeaderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  WEIGHT
                </Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text
                  style={[
                    styles.setsHeaderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  REPS
                </Text>
              </View>
              <View style={styles.setsHeaderSpacer} />
            </View>
          )}

          {/* Sets */}
          <View style={styles.setsList}>
            {exercise.sets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No sets yet. Add your first set!
                </Text>
              </View>
            ) : (
              exercise.sets.map((set, index) => (
                <SetRow
                  key={set.id}
                  set={set}
                  setNumber={index + 1}
                  previousSet={previousSets[index]}
                  onUpdate={updateSetData}
                  onRemove={handleRemoveSet}
                  onToggleComplete={toggleSetCompletion}
                  colors={colors}
                />
              ))
            )}
          </View>

          {/* Add set button */}
          <Pressable
            onPress={handleAddSet}
            style={[
              styles.addSetButton,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.addSetIcon, { color: colors.primary }]}>
              +
            </Text>
            <Text style={[styles.addSetText, { color: colors.primary }]}>
              Add Set
            </Text>
          </Pressable>

          {/* Notes section */}
          {exercise.notes && (
            <View style={styles.notesContainer}>
              <Text
                style={[styles.notesLabel, { color: colors.textSecondary }]}
              >
                Notes:
              </Text>
              <Text style={[styles.notesText, { color: colors.text }]}>
                {exercise.notes}
              </Text>
            </View>
          )}
        </ScrollView>
      </GestureHandlerRootView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title="Done"
          onPress={() => router.back()}
          style={styles.doneButton}
        />
      </View>
    </View>
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
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 36,
    fontWeight: FontWeights.semibold,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerRight: {
    width: 44,
  },
  exerciseName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  previousBest: {
    fontSize: FontSizes.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  autofillContainer: {
    marginBottom: Spacing.md,
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  setsHeaderText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    textAlign: "center",
  },
  setsHeaderSpacer: {
    width: 60,
  },
  setsList: {
    gap: Spacing.sm,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  setNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  setNumber: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  previousSetContainer: {
    width: 70,
    alignItems: "center",
  },
  previousSetText: {
    fontSize: FontSizes.xs,
    textAlign: "center",
  },
  inputWrapper: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  inputContainer: {
    width: "100%",
  },
  centeredInput: {
    textAlign: "center",
  },
  inputLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
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
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  addSetIcon: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.semibold,
  },
  addSetText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  notesContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  notesLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  notesText: {
    fontSize: FontSizes.base,
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: FontSizes.base,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  doneButton: {
    width: "100%",
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
