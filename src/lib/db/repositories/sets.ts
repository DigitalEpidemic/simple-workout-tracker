/**
 * Sets Repository
 *
 * Data access layer for workout sets.
 * Handles all CRUD operations for sets performed during workouts.
 */

import { WorkoutSet } from '@/types';
import { query, execute, getOne, transaction } from '../helpers';

/**
 * Database row types (snake_case from SQLite)
 */
interface WorkoutSetRow {
  id: string;
  exercise_id: string;
  workout_session_id: string;
  set_number: number;
  reps: number;
  weight: number;
  completed: number; // SQLite stores booleans as 0/1
  created_at: number;
  completed_at: number | null;
}

/**
 * Convert database row to WorkoutSet object
 */
function rowToWorkoutSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    workoutSessionId: row.workout_session_id,
    setNumber: row.set_number,
    reps: row.reps,
    weight: row.weight,
    completed: row.completed === 1,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  };
}

/**
 * Get all sets for a workout session
 *
 * @param sessionId - Session ID
 * @returns Promise that resolves to array of sets
 */
export async function getAllSetsBySessionId(
  sessionId: string
): Promise<WorkoutSet[]> {
  const rows = await query<WorkoutSetRow>(
    'SELECT * FROM workout_sets WHERE workout_session_id = ? ORDER BY set_number ASC',
    [sessionId]
  );

  return rows.map(rowToWorkoutSet);
}

/**
 * Get all sets for an exercise
 *
 * @param exerciseId - Exercise ID
 * @returns Promise that resolves to array of sets
 */
export async function getAllSetsByExerciseId(
  exerciseId: string
): Promise<WorkoutSet[]> {
  const rows = await query<WorkoutSetRow>(
    'SELECT * FROM workout_sets WHERE exercise_id = ? ORDER BY set_number ASC',
    [exerciseId]
  );

  return rows.map(rowToWorkoutSet);
}

/**
 * Get a single set by ID
 *
 * @param id - Set ID
 * @returns Promise that resolves to the set or null if not found
 */
export async function getSetById(id: string): Promise<WorkoutSet | null> {
  const row = await getOne<WorkoutSetRow>(
    'SELECT * FROM workout_sets WHERE id = ?',
    [id]
  );

  return row ? rowToWorkoutSet(row) : null;
}

/**
 * Create a new workout set
 *
 * @param set - Set data
 * @returns Promise that resolves when set is created
 */
export async function createSet(set: WorkoutSet): Promise<void> {
  await execute(
    `INSERT INTO workout_sets
     (id, exercise_id, workout_session_id, set_number, reps, weight, completed, created_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      set.id,
      set.exerciseId,
      set.workoutSessionId,
      set.setNumber,
      set.reps,
      set.weight,
      set.completed ? 1 : 0,
      set.createdAt,
      set.completedAt ?? null,
    ]
  );
}

/**
 * Update an existing workout set
 *
 * @param id - Set ID
 * @param updates - Fields to update
 * @returns Promise that resolves when set is updated
 */
export async function updateSet(
  id: string,
  updates: {
    reps?: number;
    weight?: number;
    completed?: boolean;
    completedAt?: number;
  }
): Promise<void> {
  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.reps !== undefined) {
    setParts.push('reps = ?');
    params.push(updates.reps);
  }

  if (updates.weight !== undefined) {
    setParts.push('weight = ?');
    params.push(updates.weight);
  }

  if (updates.completed !== undefined) {
    setParts.push('completed = ?');
    params.push(updates.completed ? 1 : 0);
  }

  if (updates.completedAt !== undefined) {
    setParts.push('completed_at = ?');
    params.push(updates.completedAt);
  }

  if (setParts.length === 0) {
    return;
  }

  params.push(id);

  await execute(
    `UPDATE workout_sets SET ${setParts.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Mark a set as completed
 *
 * @param id - Set ID
 * @param completedAt - Completion timestamp (defaults to now)
 * @returns Promise that resolves when set is marked complete
 */
export async function completeSet(
  id: string,
  completedAt?: number
): Promise<void> {
  const timestamp = completedAt ?? Date.now();
  await execute(
    'UPDATE workout_sets SET completed = 1, completed_at = ? WHERE id = ?',
    [timestamp, id]
  );
}

/**
 * Mark a set as incomplete
 *
 * @param id - Set ID
 * @returns Promise that resolves when set is marked incomplete
 */
export async function uncompleteSet(id: string): Promise<void> {
  await execute(
    'UPDATE workout_sets SET completed = 0, completed_at = NULL WHERE id = ?',
    [id]
  );
}

/**
 * Delete a workout set
 *
 * @param id - Set ID
 * @returns Promise that resolves when set is deleted
 */
export async function deleteSet(id: string): Promise<void> {
  await execute('DELETE FROM workout_sets WHERE id = ?', [id]);
}

/**
 * Delete all sets for an exercise
 *
 * @param exerciseId - Exercise ID
 * @returns Promise that resolves when all sets are deleted
 */
export async function deleteSetsByExerciseId(exerciseId: string): Promise<void> {
  await execute('DELETE FROM workout_sets WHERE exercise_id = ?', [exerciseId]);
}

/**
 * Delete all sets for a workout session
 *
 * @param sessionId - Session ID
 * @returns Promise that resolves when all sets are deleted
 */
export async function deleteSetsBySessionId(sessionId: string): Promise<void> {
  await execute('DELETE FROM workout_sets WHERE workout_session_id = ?', [
    sessionId,
  ]);
}

/**
 * Create multiple sets in a transaction
 *
 * Useful for initializing sets for an exercise all at once.
 *
 * @param sets - Array of sets to create
 * @returns Promise that resolves when all sets are created
 */
export async function createMultipleSets(sets: WorkoutSet[]): Promise<void> {
  const statements = sets.map((set) => ({
    sql: `INSERT INTO workout_sets
          (id, exercise_id, workout_session_id, set_number, reps, weight, completed, created_at, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      set.id,
      set.exerciseId,
      set.workoutSessionId,
      set.setNumber,
      set.reps,
      set.weight,
      set.completed ? 1 : 0,
      set.createdAt,
      set.completedAt ?? null,
    ],
  }));

  await transaction(statements);
}

/**
 * Get the most recent sets for an exercise by name
 *
 * Useful for autofilling sets based on previous workout performance.
 *
 * @param exerciseName - Exercise name
 * @param limit - Maximum number of sets to return
 * @returns Promise that resolves to array of recent sets
 */
export async function getRecentSetsByExerciseName(
  exerciseName: string,
  limit: number = 10
): Promise<WorkoutSet[]> {
  const rows = await query<WorkoutSetRow>(
    `SELECT ws.*
     FROM workout_sets ws
     INNER JOIN exercises e ON ws.exercise_id = e.id
     INNER JOIN workout_sessions wss ON ws.workout_session_id = wss.id
     WHERE e.name = ? AND ws.completed = 1 AND wss.end_time IS NOT NULL
     ORDER BY wss.start_time DESC, ws.set_number ASC
     LIMIT ?`,
    [exerciseName, limit]
  );

  return rows.map(rowToWorkoutSet);
}

/**
 * Get the last completed sets for an exercise by name
 *
 * Returns all sets from the most recent completed workout containing this exercise.
 *
 * @param exerciseName - Exercise name
 * @returns Promise that resolves to array of sets from the last workout
 */
export async function getLastWorkoutSetsByExerciseName(
  exerciseName: string
): Promise<WorkoutSet[]> {
  // First, find the most recent completed workout session with this exercise
  const lastSessionRow = await getOne<{ workout_session_id: string }>(
    `SELECT DISTINCT ws.workout_session_id
     FROM workout_sets ws
     INNER JOIN exercises e ON ws.exercise_id = e.id
     INNER JOIN workout_sessions wss ON ws.workout_session_id = wss.id
     WHERE e.name = ? AND wss.end_time IS NOT NULL
     ORDER BY wss.start_time DESC
     LIMIT 1`,
    [exerciseName]
  );

  if (!lastSessionRow) {
    return [];
  }

  // Get all sets for this exercise from that session
  const rows = await query<WorkoutSetRow>(
    `SELECT ws.*
     FROM workout_sets ws
     INNER JOIN exercises e ON ws.exercise_id = e.id
     WHERE e.name = ? AND ws.workout_session_id = ?
     ORDER BY ws.set_number ASC`,
    [exerciseName, lastSessionRow.workout_session_id]
  );

  return rows.map(rowToWorkoutSet);
}

/**
 * Get total volume (reps × weight) for a workout session
 *
 * @param sessionId - Session ID
 * @returns Promise that resolves to total volume
 */
export async function getTotalVolumeBySessionId(
  sessionId: string
): Promise<number> {
  const result = await getOne<{ total_volume: number | null }>(
    'SELECT SUM(reps * weight) as total_volume FROM workout_sets WHERE workout_session_id = ? AND completed = 1',
    [sessionId]
  );

  return result?.total_volume ?? 0;
}

/**
 * Get total volume for an exercise
 *
 * @param exerciseId - Exercise ID
 * @returns Promise that resolves to total volume
 */
export async function getTotalVolumeByExerciseId(
  exerciseId: string
): Promise<number> {
  const result = await getOne<{ total_volume: number | null }>(
    'SELECT SUM(reps * weight) as total_volume FROM workout_sets WHERE exercise_id = ? AND completed = 1',
    [exerciseId]
  );

  return result?.total_volume ?? 0;
}

/**
 * Count completed sets for a workout session
 *
 * @param sessionId - Session ID
 * @returns Promise that resolves to count of completed sets
 */
export async function countCompletedSetsBySessionId(
  sessionId: string
): Promise<number> {
  const result = await getOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM workout_sets WHERE workout_session_id = ? AND completed = 1',
    [sessionId]
  );

  return result?.count ?? 0;
}

/**
 * Count total sets for a workout session
 *
 * @param sessionId - Session ID
 * @returns Promise that resolves to total count of sets
 */
export async function countTotalSetsBySessionId(
  sessionId: string
): Promise<number> {
  const result = await getOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM workout_sets WHERE workout_session_id = ?',
    [sessionId]
  );

  return result?.count ?? 0;
}
