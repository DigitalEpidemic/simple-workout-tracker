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
  ScrollView,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
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

interface ExerciseForm {
  id?: string;
  exerciseName: string;
  order: number;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
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
  const [exerciseFormSets, setExerciseFormSets] = useState('');
  const [exerciseFormReps, setExerciseFormReps] = useState('');
  const [exerciseFormWeight, setExerciseFormWeight] = useState('');
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
    setExerciseFormSets('');
    setExerciseFormReps('');
    setExerciseFormWeight('');
    setExerciseFormRestTime('');
    setExerciseFormNotes('');
    setShowExerciseModal(true);
  };

  const handleEditExercise = (index: number) => {
    const exercise = exercises[index];
    setEditingExerciseIndex(index);
    setExerciseFormName(exercise.exerciseName);
    setExerciseFormSets(exercise.targetSets?.toString() || '');
    setExerciseFormReps(exercise.targetReps?.toString() || '');
    setExerciseFormWeight(
      exercise.targetWeight ? convertWeight(exercise.targetWeight).toString() : ''
    );
    setExerciseFormRestTime(exercise.restSeconds?.toString() || '');
    setExerciseFormNotes(exercise.notes || '');
    setShowExerciseModal(true);
  };

  const handleSaveExercise = async () => {
    if (exerciseFormName.trim().length === 0) {
      Alert.alert('Invalid Name', 'Exercise name cannot be empty');
      return;
    }

    const sets = exerciseFormSets ? parseInt(exerciseFormSets, 10) : undefined;
    const reps = exerciseFormReps ? parseInt(exerciseFormReps, 10) : undefined;
    const weight = exerciseFormWeight ? parseWeight(parseFloat(exerciseFormWeight)) : undefined;
    const restTime = exerciseFormRestTime ? parseInt(exerciseFormRestTime, 10) : undefined;

    try {
      if (editingExerciseIndex !== null) {
        // Update existing exercise
        const exercise = exercises[editingExerciseIndex];
        if (exercise.id) {
          await updateProgramDayExercise(exercise.id, {
            exerciseName: exerciseFormName.trim(),
            targetSets: sets,
            targetReps: reps,
            targetWeight: weight,
            restSeconds: restTime,
            notes: exerciseFormNotes.trim() || undefined,
          });
        }

        const updated = [...exercises];
        updated[editingExerciseIndex] = {
          ...updated[editingExerciseIndex],
          exerciseName: exerciseFormName.trim(),
          targetSets: sets,
          targetReps: reps,
          targetWeight: weight,
          restSeconds: restTime,
          notes: exerciseFormNotes.trim() || undefined,
        };
        setExercises(updated);
      } else {
        // Add new exercise
        const newExercise = await addProgramDayExercise(dayId!, {
          exerciseName: exerciseFormName.trim(),
          targetSets: sets,
          targetReps: reps,
          targetWeight: weight,
          restSeconds: restTime,
          notes: exerciseFormNotes.trim() || undefined,
        });

        setExercises([
          ...exercises,
          {
            id: newExercise.id,
            exerciseName: newExercise.exerciseName,
            order: exercises.length,
            targetSets: newExercise.targetSets,
            targetReps: newExercise.targetReps,
            targetWeight: newExercise.targetWeight,
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
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
                      {(exercise.targetSets || exercise.targetReps || exercise.targetWeight) && (
                        <ThemedText style={styles.exerciseTargets}>
                          {exercise.targetSets && `${exercise.targetSets} sets`}
                          {exercise.targetSets && exercise.targetReps && ' × '}
                          {exercise.targetReps && `${exercise.targetReps} reps`}
                          {exercise.targetWeight &&
                            ` @ ${convertWeight(exercise.targetWeight)} ${getUnit()}`}
                        </ThemedText>
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
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <Button
            title="Save Day"
            onPress={handleSaveDay}
            loading={saving}
            disabled={saving}
          />
        </View>
      </KeyboardAvoidingView>

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

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Input
              label="Exercise Name"
              placeholder="e.g., Bench Press"
              value={exerciseFormName}
              onChangeText={setExerciseFormName}
              autoCapitalize="words"
              autoFocus
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Sets"
                  placeholder="3"
                  value={exerciseFormSets}
                  onChangeText={setExerciseFormSets}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Reps"
                  placeholder="10"
                  value={exerciseFormReps}
                  onChangeText={setExerciseFormReps}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label={`Weight (${getUnit()})`}
                  placeholder="135"
                  value={exerciseFormWeight}
                  onChangeText={setExerciseFormWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Rest Time (s)"
                  placeholder="90"
                  value={exerciseFormRestTime}
                  onChangeText={setExerciseFormRestTime}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Input
              label="Notes (optional)"
              placeholder="Any additional notes"
              value={exerciseFormNotes}
              onChangeText={setExerciseFormNotes}
              multiline
            />
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
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
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
});
