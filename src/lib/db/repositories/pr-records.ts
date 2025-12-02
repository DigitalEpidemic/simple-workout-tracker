/**
 * PR Records Repository
 *
 * Data access layer for personal records (PRs).
 * Handles tracking and querying best performances for exercises at specific rep ranges.
 */

import { PRRecord } from '@/types';
import { query, execute, getOne, transaction } from '../helpers';

/**
 * Database row types (snake_case from SQLite)
 */
interface PRRecordRow {
  id: string;
  exercise_name: string;
  reps: number;
  weight: number;
  workout_session_id: string;
  achieved_at: number;
  created_at: number;
}

/**
 * Convert database row to PRRecord object
 */
function rowToPRRecord(row: PRRecordRow): PRRecord {
  return {
    id: row.id,
    exerciseName: row.exercise_name,
    reps: row.reps,
    weight: row.weight,
    workoutSessionId: row.workout_session_id,
    achievedAt: row.achieved_at,
    createdAt: row.created_at,
  };
}

/**
 * Get all PR records
 *
 * @returns Promise that resolves to array of all PR records
 */
export async function getAllPRs(): Promise<PRRecord[]> {
  const rows = await query<PRRecordRow>(
    'SELECT * FROM pr_records ORDER BY achieved_at DESC'
  );

  return rows.map(rowToPRRecord);
}

/**
 * Get all PR records for a specific exercise
 *
 * @param exerciseName - Exercise name (normalized)
 * @returns Promise that resolves to array of PRs for the exercise
 */
export async function getPRsByExerciseName(
  exerciseName: string
): Promise<PRRecord[]> {
  const rows = await query<PRRecordRow>(
    'SELECT * FROM pr_records WHERE exercise_name = ? ORDER BY reps ASC',
    [exerciseName]
  );

  return rows.map(rowToPRRecord);
}

/**
 * Get all PR records achieved in a specific workout session
 *
 * @param sessionId - Workout session ID
 * @returns Promise that resolves to array of PRs achieved in the session
 */
export async function getPRsBySessionId(
  sessionId: string
): Promise<PRRecord[]> {
  const rows = await query<PRRecordRow>(
    'SELECT * FROM pr_records WHERE workout_session_id = ? ORDER BY achieved_at DESC',
    [sessionId]
  );

  return rows.map(rowToPRRecord);
}

/**
 * Get PR record for a specific exercise at a specific rep count
 *
 * @param exerciseName - Exercise name (normalized)
 * @param reps - Rep count (1-12)
 * @returns Promise that resolves to the PR or null if none exists
 */
export async function getPRByExerciseAndReps(
  exerciseName: string,
  reps: number
): Promise<PRRecord | null> {
  const row = await getOne<PRRecordRow>(
    'SELECT * FROM pr_records WHERE exercise_name = ? AND reps = ? ORDER BY weight DESC LIMIT 1',
    [exerciseName, reps]
  );

  return row ? rowToPRRecord(row) : null;
}

/**
 * Get a single PR record by ID
 *
 * @param id - PR record ID
 * @returns Promise that resolves to the PR or null if not found
 */
export async function getPRById(id: string): Promise<PRRecord | null> {
  const row = await getOne<PRRecordRow>(
    'SELECT * FROM pr_records WHERE id = ?',
    [id]
  );

  return row ? rowToPRRecord(row) : null;
}

/**
 * Create a new PR record
 *
 * @param pr - PR record data
 * @returns Promise that resolves when PR is created
 */
export async function createPR(pr: PRRecord): Promise<void> {
  await execute(
    `INSERT INTO pr_records
     (id, exercise_name, reps, weight, workout_session_id, achieved_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      pr.id,
      pr.exerciseName,
      pr.reps,
      pr.weight,
      pr.workoutSessionId,
      pr.achievedAt,
      pr.createdAt,
    ]
  );
}

/**
 * Update an existing PR record
 *
 * Note: Typically PRs are not updated, but replaced with new records.
 * This is provided for edge cases.
 *
 * @param id - PR record ID
 * @param updates - Fields to update
 * @returns Promise that resolves when PR is updated
 */
export async function updatePR(
  id: string,
  updates: {
    weight?: number;
    workoutSessionId?: string;
    achievedAt?: number;
  }
): Promise<void> {
  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.weight !== undefined) {
    setParts.push('weight = ?');
    params.push(updates.weight);
  }

  if (updates.workoutSessionId !== undefined) {
    setParts.push('workout_session_id = ?');
    params.push(updates.workoutSessionId);
  }

  if (updates.achievedAt !== undefined) {
    setParts.push('achieved_at = ?');
    params.push(updates.achievedAt);
  }

  if (setParts.length === 0) {
    return;
  }

  params.push(id);

  await execute(
    `UPDATE pr_records SET ${setParts.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Delete a PR record
 *
 * @param id - PR record ID
 * @returns Promise that resolves when PR is deleted
 */
export async function deletePR(id: string): Promise<void> {
  await execute('DELETE FROM pr_records WHERE id = ?', [id]);
}

/**
 * Delete all PR records for an exercise
 *
 * @param exerciseName - Exercise name
 * @returns Promise that resolves when all PRs are deleted
 */
export async function deletePRsByExerciseName(
  exerciseName: string
): Promise<void> {
  await execute('DELETE FROM pr_records WHERE exercise_name = ?', [
    exerciseName,
  ]);
}

/**
 * Check if a set qualifies as a new PR
 *
 * Compares the given weight against the current PR for the exercise at that rep count.
 *
 * @param exerciseName - Exercise name (normalized)
 * @param reps - Rep count
 * @param weight - Weight lifted
 * @returns Promise that resolves to true if this is a new PR
 */
export async function isNewPR(
  exerciseName: string,
  reps: number,
  weight: number
): Promise<boolean> {
  const currentPR = await getPRByExerciseAndReps(exerciseName, reps);

  if (!currentPR) {
    // No existing PR, so this is automatically a PR
    return true;
  }

  // New PR if weight is greater than current PR
  return weight > currentPR.weight;
}

/**
 * Record a new PR and optionally replace the old one
 *
 * If a PR already exists for this exercise/reps combination with lower weight,
 * it will be deleted and replaced with the new PR.
 *
 * @param pr - New PR record
 * @returns Promise that resolves when PR is recorded
 */
export async function recordPR(pr: PRRecord): Promise<void> {
  const currentPR = await getPRByExerciseAndReps(pr.exerciseName, pr.reps);

  if (!currentPR) {
    // No existing PR, just create the new one
    await createPR(pr);
    return;
  }

  if (pr.weight > currentPR.weight) {
    // New PR is better, replace the old one
    const statements = [
      {
        sql: 'DELETE FROM pr_records WHERE id = ?',
        params: [currentPR.id],
      },
      {
        sql: `INSERT INTO pr_records
              (id, exercise_name, reps, weight, workout_session_id, achieved_at, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params: [
          pr.id,
          pr.exerciseName,
          pr.reps,
          pr.weight,
          pr.workoutSessionId,
          pr.achievedAt,
          pr.createdAt,
        ],
      },
    ];

    await transaction(statements);
  }
  // If new weight is not better, do nothing
}

/**
 * Get all unique exercise names that have PRs
 *
 * @returns Promise that resolves to array of exercise names
 */
export async function getExerciseNamesWithPRs(): Promise<string[]> {
  const rows = await query<{ exercise_name: string }>(
    'SELECT DISTINCT exercise_name FROM pr_records ORDER BY exercise_name ASC'
  );

  return rows.map((row) => row.exercise_name);
}

/**
 * Get PR count for an exercise
 *
 * Returns how many different rep ranges have PRs for this exercise.
 *
 * @param exerciseName - Exercise name
 * @returns Promise that resolves to count of PRs
 */
export async function getPRCountByExerciseName(
  exerciseName: string
): Promise<number> {
  const result = await getOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM pr_records WHERE exercise_name = ?',
    [exerciseName]
  );

  return result?.count ?? 0;
}

/**
 * Get total PR count across all exercises
 *
 * @returns Promise that resolves to total count of PRs
 */
export async function getTotalPRCount(): Promise<number> {
  const result = await getOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM pr_records'
  );

  return result?.count ?? 0;
}

/**
 * Get recent PRs across all exercises
 *
 * @param limit - Maximum number of PRs to return
 * @returns Promise that resolves to array of recent PRs
 */
export async function getRecentPRs(limit: number = 10): Promise<PRRecord[]> {
  const rows = await query<PRRecordRow>(
    'SELECT * FROM pr_records ORDER BY achieved_at DESC LIMIT ?',
    [limit]
  );

  return rows.map(rowToPRRecord);
}

/**
 * Get PRs achieved within a date range
 *
 * @param startDate - Start timestamp (inclusive)
 * @param endDate - End timestamp (inclusive)
 * @returns Promise that resolves to array of PRs in date range
 */
export async function getPRsByDateRange(
  startDate: number,
  endDate: number
): Promise<PRRecord[]> {
  const rows = await query<PRRecordRow>(
    'SELECT * FROM pr_records WHERE achieved_at >= ? AND achieved_at <= ? ORDER BY achieved_at DESC',
    [startDate, endDate]
  );

  return rows.map(rowToPRRecord);
}

/**
 * Extended PR record with program context
 */
export interface PRRecordWithContext extends PRRecord {
  programDayName?: string;
  programId?: string;
  programDayId?: string;
}

/**
 * Get PR records with program context (if achieved during a program workout)
 *
 * @param exerciseName - Exercise name (normalized)
 * @returns Promise that resolves to array of PRs with program context
 */
export async function getPRsWithContextByExerciseName(
  exerciseName: string
): Promise<PRRecordWithContext[]> {
  interface PRWithContextRow extends PRRecordRow {
    program_id?: string;
    program_day_id?: string;
    program_day_name?: string;
  }

  const rows = await query<PRWithContextRow>(
    `SELECT
      pr.*,
      ws.program_id,
      ws.program_day_id,
      ws.program_day_name
    FROM pr_records pr
    LEFT JOIN workout_sessions ws ON pr.workout_session_id = ws.id
    WHERE pr.exercise_name = ?
    ORDER BY pr.reps ASC`,
    [exerciseName]
  );

  return rows.map((row) => ({
    ...rowToPRRecord(row),
    programId: row.program_id ?? undefined,
    programDayId: row.program_day_id ?? undefined,
    programDayName: row.program_day_name ?? undefined,
  }));
}

/**
 * Get all PRs with program context
 *
 * @returns Promise that resolves to array of all PRs with program context
 */
export async function getAllPRsWithContext(): Promise<PRRecordWithContext[]> {
  interface PRWithContextRow extends PRRecordRow {
    program_id?: string;
    program_day_id?: string;
    program_day_name?: string;
  }

  const rows = await query<PRWithContextRow>(
    `SELECT
      pr.*,
      ws.program_id,
      ws.program_day_id,
      ws.program_day_name
    FROM pr_records pr
    LEFT JOIN workout_sessions ws ON pr.workout_session_id = ws.id
    ORDER BY pr.achieved_at DESC`
  );

  return rows.map((row) => ({
    ...rowToPRRecord(row),
    programId: row.program_id ?? undefined,
    programDayId: row.program_day_id ?? undefined,
    programDayName: row.program_day_name ?? undefined,
  }));
}
