/**
 * History Service - Business logic for workout history
 *
 * Handles fetching completed workouts with calculated metrics like volume.
 */

import { WorkoutSession } from '@/types';
import { getCompletedSessions, getSessionById, deleteSession } from '@/src/lib/db/repositories/sessions';

/**
 * Workout summary data for history list display
 */
export interface WorkoutSummary {
  id: string;
  name: string;
  templateName?: string;
  date: number; // startTime timestamp
  duration?: number; // in seconds
  exerciseCount: number;
  totalSets: number;
  totalVolume: number; // sum of (reps * weight) across all sets
}

/**
 * Calculate total volume for a workout session
 *
 * Volume = sum of (reps * weight) for all completed sets
 *
 * @param session - Workout session with exercises and sets
 * @returns Total volume in lbs
 */
function calculateWorkoutVolume(session: WorkoutSession): number {
  let totalVolume = 0;

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      if (set.completed) {
        totalVolume += set.reps * set.weight;
      }
    }
  }

  return totalVolume;
}

/**
 * Calculate total number of sets in a workout
 *
 * @param session - Workout session with exercises and sets
 * @returns Total number of completed sets
 */
function calculateTotalSets(session: WorkoutSession): number {
  let totalSets = 0;

  for (const exercise of session.exercises) {
    totalSets += exercise.sets.filter((set) => set.completed).length;
  }

  return totalSets;
}

/**
 * Convert a WorkoutSession to a WorkoutSummary
 *
 * @param session - Full workout session
 * @returns Workout summary with calculated metrics
 */
function sessionToSummary(session: WorkoutSession): WorkoutSummary {
  return {
    id: session.id,
    name: session.name,
    templateName: session.templateName,
    date: session.startTime,
    duration: session.duration,
    exerciseCount: session.exercises.length,
    totalSets: calculateTotalSets(session),
    totalVolume: calculateWorkoutVolume(session),
  };
}

/**
 * Get all completed workouts as summaries
 *
 * Returns workouts in reverse chronological order (most recent first).
 *
 * @param limit - Optional maximum number of workouts to return
 * @returns Promise that resolves to array of workout summaries
 */
export async function getWorkoutHistory(limit?: number): Promise<WorkoutSummary[]> {
  const sessions = await getCompletedSessions(true, limit);
  return sessions.map(sessionToSummary);
}

/**
 * Get a single workout session by ID with all details
 *
 * @param id - Workout session ID
 * @returns Promise that resolves to the full workout session or null if not found
 */
export async function getWorkoutById(id: string): Promise<WorkoutSession | null> {
  return await getSessionById(id, true);
}

/**
 * Delete a workout from history
 *
 * Removes the workout session and all associated exercises and sets.
 *
 * @param id - Workout session ID
 * @returns Promise that resolves when workout is deleted
 */
export async function deleteWorkout(id: string): Promise<void> {
  await deleteSession(id);
}
