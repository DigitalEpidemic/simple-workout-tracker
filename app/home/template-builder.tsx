/**
 * Template Builder Screen
 *
 * Create or edit workout templates with full CRUD operations.
 * Features:
 * - Create/Edit template with name and description
 * - Add/remove/reorder exercises
 * - Set target sets, reps, weight for each exercise
 * - Validation and error handling
 * - Save to SQLite database
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Modal,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  fetchTemplateById,
  createNewTemplate,
  updateExistingTemplate,
  validateTemplateName,
  validateExerciseName,
  validateExerciseTargets,
} from '@/src/features/templates/api/templateService';
import { ExerciseListItem } from '@/src/features/templates/components/ExerciseListItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Colors, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeightDisplay } from '@/src/hooks/useWeightDisplay';

interface ExerciseForm {
  id?: string;
  name: string;
  order: number;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  notes?: string;
}

export default function TemplateBuilderScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { convertWeight, parseWeight, getUnit } = useWeightDisplay();

  const isEditing = !!templateId;

  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [exercises, setExercises] = useState<ExerciseForm[]>([]);
  const [saving, setSaving] = useState(false);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [exerciseFormName, setExerciseFormName] = useState('');
  const [exerciseFormSets, setExerciseFormSets] = useState('');
  const [exerciseFormReps, setExerciseFormReps] = useState('');
  const [exerciseFormWeight, setExerciseFormWeight] = useState('');
  const [exerciseFormNotes, setExerciseFormNotes] = useState('');

  useEffect(() => {
    if (isEditing && templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = async (id: string) => {
    try {
      const template = await fetchTemplateById(id);
      if (template) {
        setTemplateName(template.name);
        setTemplateDescription(template.description || '');
        setExercises(
          template.exercises.map((ex, idx) => ({
            id: ex.id,
            name: ex.name,
            order: idx,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetWeight: ex.targetWeight,
            notes: ex.notes,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load template');
    }
  };

  const handleAddExercise = () => {
    setEditingExerciseIndex(null);
    setExerciseFormName('');
    setExerciseFormSets('');
    setExerciseFormReps('');
    setExerciseFormWeight('');
    setExerciseFormNotes('');
    setShowExerciseModal(true);
  };

  const handleEditExercise = (index: number) => {
    const exercise = exercises[index];
    setEditingExerciseIndex(index);
    setExerciseFormName(exercise.name);
    setExerciseFormSets(exercise.targetSets?.toString() || '');
    setExerciseFormReps(exercise.targetReps?.toString() || '');
    // Convert weight from lbs (storage) to user's preferred unit for display
    setExerciseFormWeight(exercise.targetWeight ? convertWeight(exercise.targetWeight).toString() : '');
    setExerciseFormNotes(exercise.notes || '');
    setShowExerciseModal(true);
  };

  const handleSaveExercise = () => {
    const nameError = validateExerciseName(exerciseFormName);
    if (nameError) {
      Alert.alert('Invalid Exercise Name', nameError);
      return;
    }

    const sets = exerciseFormSets ? parseInt(exerciseFormSets, 10) : undefined;
    const reps = exerciseFormReps ? parseInt(exerciseFormReps, 10) : undefined;
    // Parse weight from user's unit back to lbs for storage
    const weight = exerciseFormWeight ? parseWeight(parseFloat(exerciseFormWeight)) : undefined;

    const targetsError = validateExerciseTargets(sets, reps, weight);
    if (targetsError) {
      Alert.alert('Invalid Targets', targetsError);
      return;
    }

    if (editingExerciseIndex !== null) {
      const updated = [...exercises];
      updated[editingExerciseIndex] = {
        ...updated[editingExerciseIndex],
        name: exerciseFormName.trim(),
        targetSets: sets,
        targetReps: reps,
        targetWeight: weight,
        notes: exerciseFormNotes.trim() || undefined,
      };
      setExercises(updated);
    } else {
      const newExercise: ExerciseForm = {
        name: exerciseFormName.trim(),
        order: exercises.length,
        targetSets: sets,
        targetReps: reps,
        targetWeight: weight,
        notes: exerciseFormNotes.trim() || undefined,
      };
      setExercises([...exercises, newExercise]);
    }

    setShowExerciseModal(false);
  };

  const handleRemoveExercise = (index: number) => {
    Alert.alert(
      'Remove Exercise',
      `Remove "${exercises[index].name}" from template?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = exercises
              .filter((_, i) => i !== index)
              .map((ex, idx) => ({ ...ex, order: idx }));
            setExercises(updated);
          },
        },
      ]
    );
  };

  const handleSaveTemplate = async () => {
    const nameError = validateTemplateName(templateName);
    if (nameError) {
      Alert.alert('Invalid Template Name', nameError);
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise to the template');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && templateId) {
        await updateExistingTemplate(
          templateId,
          templateName.trim(),
          templateDescription.trim() || undefined,
          exercises
        );
      } else {
        await createNewTemplate(
          templateName.trim(),
          templateDescription.trim() || undefined,
          exercises
        );
      }

      router.back();
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? 'Edit Template' : 'New Template'}
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={100}
      >
        <Input
          label="Template Name"
          value={templateName}
          onChangeText={setTemplateName}
          placeholder="e.g., Push Day, Leg Day"
          containerStyle={styles.inputContainer}
        />

        <Input
          label="Description (Optional)"
          value={templateDescription}
          onChangeText={setTemplateDescription}
          placeholder="Notes about this workout"
          multiline
          numberOfLines={3}
          containerStyle={styles.inputContainer}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Exercises ({exercises.length})
          </Text>

          {exercises.map((exercise, index) => (
            <ExerciseListItem
              key={index}
              exercise={exercise}
              index={index}
              onPress={() => handleEditExercise(index)}
              onRemove={() => handleRemoveExercise(index)}
            />
          ))}

          <Button
            title="Add Exercise"
            variant="outline"
            onPress={handleAddExercise}
            fullWidth
          />
        </View>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title="Cancel"
          variant="ghost"
          onPress={() => router.back()}
          style={styles.footerButton}
        />
        <Button
          title={isEditing ? 'Update Template' : 'Save Template'}
          onPress={handleSaveTemplate}
          loading={saving}
          style={styles.footerButton}
        />
      </View>

      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingExerciseIndex !== null ? 'Edit Exercise' : 'Add Exercise'}
            </Text>
          </View>

          <KeyboardAwareScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bottomOffset={40}
          >
            <Input
              label="Exercise Name"
              value={exerciseFormName}
              onChangeText={setExerciseFormName}
              placeholder="e.g., Bench Press, Squat"
              containerStyle={styles.inputContainer}
            />

            <View style={styles.row}>
              <Input
                label="Target Sets"
                value={exerciseFormSets}
                onChangeText={setExerciseFormSets}
                placeholder="3"
                keyboardType="number-pad"
                containerStyle={styles.rowInput}
              />
              <Input
                label="Target Reps"
                value={exerciseFormReps}
                onChangeText={setExerciseFormReps}
                placeholder="10"
                keyboardType="number-pad"
                containerStyle={styles.rowInput}
              />
            </View>

            <Input
              label={`Target Weight (${getUnit()})`}
              value={exerciseFormWeight}
              onChangeText={setExerciseFormWeight}
              placeholder="135"
              keyboardType="decimal-pad"
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Notes (Optional)"
              value={exerciseFormNotes}
              onChangeText={setExerciseFormNotes}
              placeholder="Form cues, tips, etc."
              multiline
              numberOfLines={3}
              containerStyle={styles.inputContainer}
            />
          </KeyboardAwareScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setShowExerciseModal(false)}
              style={styles.footerButton}
            />
            <Button
              title="Save"
              onPress={handleSaveExercise}
              style={styles.footerButton}
            />
          </View>
        </View>
      </Modal>
    </View>
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
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  rowInput: {
    flex: 1,
    marginBottom: 0,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
});
