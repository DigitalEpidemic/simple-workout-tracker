/**
 * Exercise History Service - Business logic for exercise history
 *
 * Handles fetching exercise performance history across workouts.
 */

import { WorkoutSet } from '@/types';
import {
  getExerciseHistory,
  getSetsByExerciseAndSession,
  ExerciseHistoryRow,
} from '@/src/lib/db/repositories/sets';

/**
 * Exercise performance summary for a single workout
 */
export interface ExercisePerformance {
  workoutSessionId: string;
  workoutName: string;
  workoutDate: number;
  exerciseId: string;
  totalSets: number;
  completedSets: number;
  totalVolume: number;
  maxWeight: number;
  totalReps: number;
  sets: WorkoutSet[];
}

/**
 * Get exercise performance history by exercise name
 *
 * Returns performance data for each workout session where this exercise was performed,
 * including all sets from each workout.
 *
 * @param exerciseName - Exercise name
 * @returns Promise that resolves to array of exercise performances
 */
export async function getExercisePerformanceHistory(
  exerciseName: string
): Promise<ExercisePerformance[]> {
  // Get aggregated history data
  const historyRows = await getExerciseHistory(exerciseName);

  // Fetch sets for each workout
  const performances: ExercisePerformance[] = [];

  for (const row of historyRows) {
    const sets = await getSetsByExerciseAndSession(
      row.exerciseId,
      row.workoutSessionId
    );

    performances.push({
      workoutSessionId: row.workoutSessionId,
      workoutName: row.workoutName,
      workoutDate: row.workoutDate,
      exerciseId: row.exerciseId,
      totalSets: row.totalSets,
      completedSets: row.completedSets,
      totalVolume: row.totalVolume,
      maxWeight: row.maxWeight,
      totalReps: row.totalReps,
      sets: sets.filter((set) => set.completed),
    });
  }

  return performances;
}

/**
 * Get exercise statistics across all workouts
 *
 * @param exerciseName - Exercise name
 * @returns Promise that resolves to statistics object
 */
export async function getExerciseStatistics(exerciseName: string): Promise<{
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  maxWeight: number;
  avgVolume: number;
  avgSets: number;
  lastPerformed?: number;
}> {
  const history = await getExerciseHistory(exerciseName);

  if (history.length === 0) {
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
      maxWeight: 0,
      avgVolume: 0,
      avgSets: 0,
    };
  }

  const totalWorkouts = history.length;
  const totalVolume = history.reduce((sum, h) => sum + h.totalVolume, 0);
  const totalSets = history.reduce((sum, h) => sum + h.completedSets, 0);
  const totalReps = history.reduce((sum, h) => sum + h.totalReps, 0);
  const maxWeight = Math.max(...history.map((h) => h.maxWeight));
  const avgVolume = totalVolume / totalWorkouts;
  const avgSets = totalSets / totalWorkouts;
  const lastPerformed = history[0]?.workoutDate;

  return {
    totalWorkouts,
    totalVolume,
    totalSets,
    totalReps,
    maxWeight,
    avgVolume,
    avgSets,
    lastPerformed,
  };
}
