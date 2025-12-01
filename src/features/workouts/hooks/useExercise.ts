/**
 * useExercise Hook - Manages exercise state and sets
 *
 * Provides access to exercise data with CRUD operations for sets.
 */

import { useState, useEffect, useCallback } from 'react';
import { Exercise, WorkoutSet } from '@/types';
import { getExerciseById } from '@/src/lib/db/repositories/sessions';
import {
  createSet,
  updateSet,
  deleteSet,
  getLastWorkoutSetsByExerciseName,
} from '@/src/lib/db/repositories/sets';

/**
 * Custom hook for managing exercise data and sets
 *
 * @param exerciseId - The exercise ID to load
 * @returns Exercise state and set management functions
 */
export function useExercise(exerciseId: string) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [previousSets, setPreviousSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadExercise = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExerciseById(exerciseId);
      setExercise(data);

      // Load previous workout sets for autofill
      if (data) {
        const prevSets = await getLastWorkoutSetsByExerciseName(data.name);
        setPreviousSets(prevSets);
      }
    } catch (err) {
      console.error('Error loading exercise:', err);
      setError(err instanceof Error ? err : new Error('Failed to load exercise'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const refresh = useCallback(async () => {
    await loadExercise();
  }, [exerciseId]);

  /**
   * Add a new set to the exercise
   */
  const addSet = useCallback(
    async (setData: { reps: number; weight: number }) => {
      if (!exercise) return;

      const newSetNumber = exercise.sets.length + 1;
      const newSet: WorkoutSet = {
        id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        exerciseId: exercise.id,
        workoutSessionId: exercise.workoutSessionId,
        setNumber: newSetNumber,
        reps: setData.reps,
        weight: setData.weight,
        completed: false,
        createdAt: Date.now(),
      };

      await createSet(newSet);
      await refresh();
    },
    [exercise, refresh]
  );

  /**
   * Update an existing set
   */
  const updateSetData = useCallback(
    async (
      setId: string,
      updates: { reps?: number; weight?: number; completed?: boolean }
    ) => {
      await updateSet(setId, updates);
      await refresh();
    },
    [refresh]
  );

  /**
   * Remove a set from the exercise
   */
  const removeSet = useCallback(
    async (setId: string) => {
      await deleteSet(setId);
      await refresh();
    },
    [refresh]
  );

  /**
   * Toggle set completion status
   */
  const toggleSetCompletion = useCallback(
    async (setId: string, completed: boolean) => {
      const completedAt = completed ? Date.now() : undefined;
      await updateSet(setId, { completed, completedAt });
      await refresh();
    },
    [refresh]
  );

  return {
    exercise,
    previousSets,
    loading,
    error,
    refresh,
    addSet,
    updateSetData,
    removeSet,
    toggleSetCompletion,
  };
}
