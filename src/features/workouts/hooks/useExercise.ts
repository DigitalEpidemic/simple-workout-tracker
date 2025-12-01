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

      // Optimistically update local state
      setExercise((prevExercise) => {
        if (!prevExercise) return prevExercise;

        return {
          ...prevExercise,
          sets: [...prevExercise.sets, newSet],
        };
      });

      // Create in database in background
      await createSet(newSet);
    },
    [exercise]
  );

  /**
   * Update an existing set
   */
  const updateSetData = useCallback(
    async (
      setId: string,
      updates: { reps?: number; weight?: number; completed?: boolean }
    ) => {
      if (!exercise) return;

      // Optimistically update local state
      setExercise((prevExercise) => {
        if (!prevExercise) return prevExercise;

        return {
          ...prevExercise,
          sets: prevExercise.sets.map((set) =>
            set.id === setId ? { ...set, ...updates } : set
          ),
        };
      });

      // Update database in background
      await updateSet(setId, updates);
    },
    [exercise]
  );

  /**
   * Remove a set from the exercise
   */
  const removeSet = useCallback(
    async (setId: string) => {
      if (!exercise) return;

      // Optimistically update local state
      setExercise((prevExercise) => {
        if (!prevExercise) return prevExercise;

        return {
          ...prevExercise,
          sets: prevExercise.sets.filter((set) => set.id !== setId),
        };
      });

      // Delete from database in background
      await deleteSet(setId);
    },
    [exercise]
  );

  /**
   * Toggle set completion status
   */
  const toggleSetCompletion = useCallback(
    async (setId: string, completed: boolean) => {
      if (!exercise) return;

      const completedAt = completed ? Date.now() : undefined;

      // Optimistically update local state
      setExercise((prevExercise) => {
        if (!prevExercise) return prevExercise;

        return {
          ...prevExercise,
          sets: prevExercise.sets.map((set) =>
            set.id === setId ? { ...set, completed, completedAt } : set
          ),
        };
      });

      // Update database in background
      await updateSet(setId, { completed, completedAt });
    },
    [exercise]
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
