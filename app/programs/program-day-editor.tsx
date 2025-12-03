/**
 * Program Day Editor Screen
 *
 * Edit exercises for a specific program day.
 * Features:
 * - Edit day name
 * - Add/remove/reorder exercises
 * - Set targets (sets, reps, weight, rest time) for each exercise
 * - Add notes to exercises
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  updateProgramDayName,
  addProgramDayExercise,
  updateProgramDayExercise,
  removeProgramDayExercise,
} from '@/src/features/programs/api/programService';
import * as programRepo from '@/src/lib/db/repositories/programs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeightDisplay } from '@/src/hooks/useWeightDisplay';
import { consolidateSets } from '@/src/lib/utils/formatters';

interface SetForm {
  id?: string;
  targetReps?: number;
  targetWeight?: number;
}

interface ExerciseForm {
  id?: string;
  exerciseName: string;
  order: number;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  sets?: SetForm[];
  restSeconds?: number;
  notes?: string;
}

export default function ProgramDayEditorScreen() {
  const router = useRouter();
  const { dayId } = useLocalSearchParams<{ dayId: string; programId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { convertWeight, parseWeight, getUnit } = useWeightDisplay();

  const [dayName, setDayName] = useState('');
  const [exercises, setExercises] = useState<ExerciseForm[]>([]);
  const [saving, setSaving] = useState(false);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [exerciseFormName, setExerciseFormName] = useState('');
  const [exerciseFormSets, setExerciseFormSets] = useState<SetForm[]>([]);
  const [exerciseFormRestTime, setExerciseFormRestTime] = useState('');
  const [exerciseFormNotes, setExerciseFormNotes] = useState('');

  useEffect(() => {
    if (dayId) {
      loadProgramDay(dayId);
    }
  }, [dayId]);

  const loadProgramDay = async (id: string) => {
    try {
      const day = await programRepo.getProgramDayById(id);
      if (day) {
        setDayName(day.name);
        setExercises(
          day.exercises.map((ex, idx) => ({
            id: ex.id,
            exerciseName: ex.exerciseName,
            order: idx,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetWeight: ex.targetWeight,
            sets: ex.sets?.map(s => ({
              id: s.id,
              targetReps: s.targetReps,
              targetWeight: s.targetWeight,
            })),
            restSeconds: ex.restSeconds,
            notes: ex.notes,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading program day:', error);
      Alert.alert('Error', 'Failed to load program day');
    }
  };

  const handleAddExercise = () => {
    setEditingExerciseIndex(null);
    setExerciseFormName('');
    setExerciseFormSets([{ targetReps: undefined, targetWeight: undefined }]);
    setExerciseFormRestTime('');
    setExerciseFormNotes('');
    setShowExerciseModal(true);
  };

  const handleEditExercise = (index: number) => {
    const exercise = exercises[index];
    setEditingExerciseIndex(index);
    setExerciseFormName(exercise.exerciseName);

    // Load sets if they exist, otherwise create a default set
    if (exercise.sets && exercise.sets.length > 0) {
      setExerciseFormSets(
        exercise.sets.map(s => ({
          id: s.id,
          targetReps: s.targetReps,
          targetWeight: s.targetWeight ? convertWeight(s.targetWeight) : undefined,
        }))
      );
    } else {
      // For legacy exercises with uniform sets, create individual set entries
      const numSets = exercise.targetSets || 1;
      setExerciseFormSets(
        Array.from({ length: numSets }, () => ({
          targetReps: exercise.targetReps,
          targetWeight: exercise.targetWeight ? convertWeight(exercise.targetWeight) : undefined,
        }))
      );
    }

    setExerciseFormRestTime(exercise.restSeconds?.toString() || '');
    setExerciseFormNotes(exercise.notes || '');
    setShowExerciseModal(true);
  };

  const handleAddSet = () => {
    setExerciseFormSets([...exerciseFormSets, { targetReps: undefined, targetWeight: undefined }]);
  };

  const handleRemoveSet = (index: number) => {
    if (exerciseFormSets.length > 1) {
      setExerciseFormSets(exerciseFormSets.filter((_, i) => i !== index));
    }
  };

  const handleUpdateSet = (index: number, field: 'targetReps' | 'targetWeight', value: string) => {
    const updated = [...exerciseFormSets];
    if (field === 'targetReps') {
      updated[index].targetReps = value ? parseInt(value, 10) : undefined;
    } else {
      updated[index].targetWeight = value ? parseWeight(parseFloat(value)) : undefined;
    }
    setExerciseFormSets(updated);
  };

  const handleSaveExercise = async () => {
    if (exerciseFormName.trim().length === 0) {
      Alert.alert('Invalid Name', 'Exercise name cannot be empty');
      return;
    }

    const restTime = exerciseFormRestTime ? parseInt(exerciseFormRestTime, 10) : undefined;

    try {
      if (editingExerciseIndex !== null) {
        // Update existing exercise
        const exercise = exercises[editingExerciseIndex];
        if (exercise.id) {
          await updateProgramDayExercise(exercise.id, {
            exerciseName: exerciseFormName.trim(),
            sets: exerciseFormSets as any, // Type will be handled by API layer
            restSeconds: restTime,
            notes: exerciseFormNotes.trim() || undefined,
          });
        }

        const updated = [...exercises];
        updated[editingExerciseIndex] = {
          ...updated[editingExerciseIndex],
          exerciseName: exerciseFormName.trim(),
          sets: exerciseFormSets,
          targetSets: undefined,
          targetReps: undefined,
          targetWeight: undefined,
          restSeconds: restTime,
          notes: exerciseFormNotes.trim() || undefined,
        };
        setExercises(updated);
      } else {
        // Add new exercise
        const newExercise = await addProgramDayExercise(dayId!, {
          exerciseName: exerciseFormName.trim(),
          sets: exerciseFormSets,
          restSeconds: restTime,
          notes: exerciseFormNotes.trim() || undefined,
        });

        setExercises([
          ...exercises,
          {
            id: newExercise.id,
            exerciseName: newExercise.exerciseName,
            order: exercises.length,
            sets: exerciseFormSets,
            restSeconds: newExercise.restSeconds,
            notes: newExercise.notes,
          },
        ]);
      }

      setShowExerciseModal(false);
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Error', 'Failed to save exercise');
    }
  };

  const handleRemoveExercise = (index: number) => {
    const exercise = exercises[index];
    Alert.alert(
      'Remove Exercise',
      `Remove "${exercise.exerciseName}" from this day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (exercise.id) {
                await removeProgramDayExercise(dayId!, exercise.id);
              }
              const updated = exercises
                .filter((_, i) => i !== index)
                .map((ex, idx) => ({ ...ex, order: idx }));
              setExercises(updated);
            } catch (error) {
              console.error('Error removing exercise:', error);
              Alert.alert('Error', 'Failed to remove exercise');
            }
          },
        },
      ]
    );
  };

  const handleSaveDay = async () => {
    if (dayName.trim().length === 0) {
      Alert.alert('Invalid Name', 'Day name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      await updateProgramDayName(dayId!, dayName.trim());
      Alert.alert('Success', 'Program day updated');
      router.back();
    } catch (error) {
      console.error('Error saving day:', error);
      Alert.alert('Error', 'Failed to save program day');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Edit Day</Text>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={100}
      >
          <View>
            {/* Day Name */}
            <View style={styles.section}>
              <Input
                label="Day Name"
                placeholder="e.g., Upper Body"
                value={dayName}
                onChangeText={setDayName}
                autoCapitalize="words"
              />
            </View>

            {/* Exercises */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Exercises</ThemedText>
                <Pressable onPress={handleAddExercise}>
                  <ThemedText style={[styles.addButton, { color: colors.tint }]}>
                    + Add Exercise
                  </ThemedText>
                </Pressable>
              </View>

              {exercises.length === 0 ? (
                <ThemedText style={styles.emptyText}>
                  No exercises yet. Add your first exercise to get started.
                </ThemedText>
              ) : (
                exercises.map((exercise, index) => (
                  <View key={exercise.id || index} style={styles.exerciseCard}>
                    <Pressable style={styles.exerciseContent} onPress={() => handleEditExercise(index)}>
                      <ThemedText style={styles.exerciseName}>{exercise.exerciseName}</ThemedText>

                      {/* Show individual sets if they exist */}
                      {exercise.sets && exercise.sets.length > 0 ? (
                        <View style={styles.setsDisplay}>
                          {consolidateSets(
                            exercise.sets,
                            (weight) => `${convertWeight(weight)} ${getUnit()}`
                          ).map((setDescription, idx) => (
                            <ThemedText key={idx} style={styles.exerciseTargets}>
                              {setDescription}
                            </ThemedText>
                          ))}
                        </View>
                      ) : (
                        /* Fallback to legacy uniform sets display */
                        (exercise.targetSets || exercise.targetReps || exercise.targetWeight) && (
                          <ThemedText style={styles.exerciseTargets}>
                            {exercise.targetSets && `${exercise.targetSets} sets`}
                            {exercise.targetSets && exercise.targetReps && ' × '}
                            {exercise.targetReps && `${exercise.targetReps} reps`}
                            {exercise.targetWeight &&
                              ` @ ${convertWeight(exercise.targetWeight)} ${getUnit()}`}
                          </ThemedText>
                        )
                      )}

                      {exercise.restSeconds && (
                        <ThemedText style={styles.exerciseRest}>
                          Rest: {exercise.restSeconds}s
                        </ThemedText>
                      )}
                    </Pressable>
                    <Pressable onPress={() => handleRemoveExercise(index)} style={styles.deleteButton}>
                      <IconSymbol name="trash" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <Button
            title="Save Day"
            onPress={handleSaveDay}
            loading={saving}
            disabled={saving}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Exercise Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowExerciseModal(false)}>
              <ThemedText style={styles.modalCancel}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>
              {editingExerciseIndex !== null ? 'Edit Exercise' : 'Add Exercise'}
            </ThemedText>
            <Pressable onPress={handleSaveExercise}>
              <ThemedText style={[styles.modalSave, { color: colors.tint }]}>Save</ThemedText>
            </Pressable>
          </View>

          <KeyboardAwareScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bottomOffset={40}
          >
            <Input
              label="Exercise Name"
              placeholder="e.g., Squat"
              value={exerciseFormName}
              onChangeText={setExerciseFormName}
              autoCapitalize="words"
              autoFocus
            />

            {/* Sets Section */}
            <View style={styles.setsSection}>
              <View style={styles.setsSectionHeader}>
                <ThemedText style={styles.setsLabel}>Sets</ThemedText>
                <Pressable onPress={handleAddSet}>
                  <ThemedText style={[styles.addSetButton, { color: colors.tint }]}>
                    + Add Set
                  </ThemedText>
                </Pressable>
              </View>

              {exerciseFormSets.map((set, index) => (
                <View key={index} style={styles.setRow}>
                  <ThemedText style={styles.setNumber}>{index + 1}</ThemedText>
                  <View style={styles.setInputs}>
                    <View style={styles.setInputHalf}>
                      <Input
                        label="Reps"
                        placeholder="10"
                        value={set.targetReps?.toString() || ''}
                        onChangeText={(value) => handleUpdateSet(index, 'targetReps', value)}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.setInputHalf}>
                      <Input
                        label={getUnit()}
                        placeholder="225"
                        value={set.targetWeight?.toString() || ''}
                        onChangeText={(value) => handleUpdateSet(index, 'targetWeight', value)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  {exerciseFormSets.length > 1 && (
                    <Pressable
                      onPress={() => handleRemoveSet(index)}
                      style={styles.removeSetButton}
                    >
                      <IconSymbol name="trash" size={18} color={colors.error} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            <Input
              label="Rest Time (s)"
              placeholder="90"
              value={exerciseFormRestTime}
              onChangeText={setExerciseFormRestTime}
              keyboardType="number-pad"
            />

            <Input
              label="Notes (optional)"
              placeholder="Any additional notes"
              value={exerciseFormNotes}
              onChangeText={setExerciseFormNotes}
              multiline
            />
          </KeyboardAwareScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 40,
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
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  addButton: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    marginBottom: 4,
  },
  exerciseTargets: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
  },
  setsDisplay: {
    marginTop: 4,
  },
  exerciseRest: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  modalCancel: {
    fontSize: FontSizes.base,
  },
  modalSave: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  setsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  setsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  setsLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  addSetButton: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  setNumber: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    width: 24,
    textAlign: 'center',
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  setInputHalf: {
    flex: 1,
  },
  removeSetButton: {
    padding: 8,
  },
});
