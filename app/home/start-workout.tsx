/**
 * Start Workout Flow Screen - Phase 2.2: Template Selection
 *
 * Features:
 * - Load and preview selected template
 * - Display template exercises and target sets/reps/weight
 * - "Start Workout" button to begin workout session (Phase 2.3)
 * - Support for empty workout (no template)
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WorkoutTemplate, ProgramDay } from '@/types';
import { fetchTemplateById } from '@/src/features/templates/api/templateService';
import { startWorkoutFromTemplate } from '@/src/features/workouts/api/workoutService';
import { workoutStore } from '@/src/stores/workoutStore';
import * as programRepo from '@/src/lib/db/repositories/programs';
import { Button } from '@/components/ui/button';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeightDisplay } from '@/src/hooks/useWeightDisplay';
import { consolidateSets } from '@/src/lib/utils/formatters';

export default function StartWorkoutScreen() {
  const router = useRouter();
  const { templateId, programId, programDayId } = useLocalSearchParams<{
    templateId?: string;
    programId?: string;
    programDayId?: string;
  }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { displayWeight } = useWeightDisplay();

  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [programDay, setProgramDay] = useState<ProgramDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (programDayId) {
      loadProgramDay();
    } else {
      loadTemplate();
    }
  }, [templateId, programDayId]);

  const loadProgramDay = async () => {
    if (!programDayId) {
      setLoading(false);
      return;
    }

    try {
      const day = await programRepo.getProgramDayById(programDayId as string);
      if (!day) {
        Alert.alert('Error', 'Program day not found');
        router.back();
        return;
      }
      setProgramDay(day);
    } catch (error) {
      console.error('Error loading program day:', error);
      Alert.alert('Error', 'Failed to load program day');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async () => {
    if (!templateId) {
      // Empty workout (no template)
      setLoading(false);
      return;
    }

    try {
      const data = await fetchTemplateById(templateId as string);
      if (!data) {
        Alert.alert('Error', 'Template not found');
        router.back();
        return;
      }
      setTemplate(data);
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load template');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async () => {
    try {
      let session;

      if (programDay) {
        // Create workout session from program day
        const { generateId } = await import('@/src/lib/utils/id');
        const { createSessionWithExercises } = await import('@/src/lib/db/repositories/sessions');

        const now = Date.now();
        const sessionId = generateId();

        // Create exercise instances from program day exercises with sets
        const exercises = programDay.exercises.map((ex, index) => {
          const exerciseId = generateId();

          // Create sets based on program template
          let sets;
          if (ex.sets && ex.sets.length > 0) {
            // Use individual set configurations
            sets = ex.sets.map((setConfig, setIndex) => ({
              id: generateId(),
              exerciseId,
              workoutSessionId: sessionId,
              setNumber: setIndex + 1,
              reps: setConfig.targetReps ?? 0,
              weight: setConfig.targetWeight ?? 0,
              completed: false,
              createdAt: now,
            }));
          } else {
            // Fallback to legacy uniform sets
            const numSets = ex.targetSets ?? 0;
            sets = Array.from({ length: numSets }, (_, setIndex) => ({
              id: generateId(),
              exerciseId,
              workoutSessionId: sessionId,
              setNumber: setIndex + 1,
              reps: ex.targetReps ?? 0,
              weight: ex.targetWeight ?? 0,
              completed: false,
              createdAt: now,
            }));
          }

          return {
            id: exerciseId,
            workoutSessionId: sessionId,
            name: ex.exerciseName,
            order: ex.order ?? index,
            sets,
            notes: ex.notes,
            createdAt: now,
            updatedAt: now,
          };
        });

        // Create workout session with program context
        session = {
          id: sessionId,
          programId: programId as string,
          programDayId: programDay.id,
          programDayName: programDay.name,
          name: programDay.name,
          exercises,
          startTime: now,
          createdAt: now,
          updatedAt: now,
        };

        await createSessionWithExercises(session);
      } else if (template) {
        // Create workout session from template
        session = await startWorkoutFromTemplate(template);
      } else {
        // Start empty workout (no template)
        const { startEmptyWorkout } = await import('@/src/features/workouts/api/workoutService');
        session = await startEmptyWorkout('Empty Workout');
      }

      // Update global store with active session
      workoutStore.setActiveSession(session);

      // Navigate to active workout screen
      router.replace(`/home/active-workout?workoutSessionId=${session.id}`);
    } catch (error) {
      console.error('Error starting workout:', error);
      Alert.alert('Error', 'Failed to start workout. Please try again.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Display logic handles both template and program day
  const workoutName = programDay?.name || template?.name || 'Empty Workout';
  const exerciseCount = programDay?.exercises.length || template?.exercises.length || 0;

  // Convert program day exercises to template-like format for display
  const exercises = programDay
    ? programDay.exercises.map((ex) => ({
        id: ex.id,
        name: ex.exerciseName,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetWeight: ex.targetWeight,
        sets: ex.sets,
        notes: ex.notes,
      }))
    : template?.exercises || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Start Workout</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Workout Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.primaryLight, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.workoutName, { color: colors.text }]}>{workoutName}</Text>
          {template?.description && (
            <Text style={[styles.workoutDescription, { color: colors.textSecondary }]}>
              {template.description}
            </Text>
          )}
          <Text style={[styles.workoutInfo, { color: colors.textSecondary }]}>
            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
            {exerciseCount > 0 && ' · Ready to begin'}
          </Text>
        </View>

        {/* Exercise List */}
        {exerciseCount > 0 ? (
          <View style={styles.exerciseSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises</Text>
            {exercises.map((exercise, index) => (
              <View
                key={exercise.id}
                style={[
                  styles.exerciseCard,
                  { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                ]}
              >
                <View style={styles.exerciseHeader}>
                  <View style={[styles.exerciseNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    {'sets' in exercise && exercise.sets && exercise.sets.length > 0 ? (
                      <View style={styles.individualSets}>
                        {consolidateSets(
                          exercise.sets,
                          (weight) => displayWeight(weight)
                        ).map((setDescription, idx) => (
                          <Text key={idx} style={[styles.setDetail, { color: colors.textSecondary }]}>
                            {setDescription}
                          </Text>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.exerciseTargets}>
                        {exercise.targetSets && (
                          <Text style={[styles.targetText, { color: colors.textSecondary }]}>
                            {exercise.targetSets} sets
                          </Text>
                        )}
                        {exercise.targetReps && (
                          <Text style={[styles.targetText, { color: colors.textSecondary }]}>
                            × {exercise.targetReps} reps
                          </Text>
                        )}
                        {exercise.targetWeight && (
                          <Text style={[styles.targetText, { color: colors.textSecondary }]}>
                            @ {displayWeight(exercise.targetWeight)}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                {exercise.notes && (
                  <Text style={[styles.exerciseNotes, { color: colors.textSecondary }]}>
                    Note: {exercise.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Exercises</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Start your workout and add exercises as you go.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer with Start Button */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title="Begin Workout"
          onPress={handleStartWorkout}
          fullWidth
        />
        {exerciseCount === 0 && (
          <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
            You can add exercises during your workout
          </Text>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  workoutName: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  workoutDescription: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.sm,
  },
  workoutInfo: {
    fontSize: FontSizes.sm,
  },
  exerciseSection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
  },
  exerciseCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
  },
  exerciseTargets: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  targetText: {
    fontSize: FontSizes.sm,
  },
  individualSets: {
    gap: Spacing.xs / 2,
    marginTop: Spacing.xs,
  },
  setDetail: {
    fontSize: FontSizes.sm,
  },
  exerciseNotes: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: FontSizes.base,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  footerNote: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
});
