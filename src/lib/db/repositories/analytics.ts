/**
 * Analytics Repository
 *
 * Data access layer for analytics and statistics.
 * Handles aggregated queries for volume tracking, exercise progression, and PR timelines.
 */

import { query, getOne } from '../helpers';

/**
 * Volume data point for charts
 */
export interface VolumeDataPoint {
  date: number; // Unix timestamp (start of day)
  totalVolume: number; // sum of (reps * weight)
  totalSets: number;
  totalReps: number;
}

/**
 * Exercise progression data point
 */
export interface ExerciseProgressionPoint {
  date: number; // Unix timestamp
  workoutSessionId: string;
  maxWeight: number; // Max weight used in that workout
  totalVolume: number; // Total volume for that exercise in that workout
  totalSets: number;
  totalReps: number;
}

/**
 * PR timeline data point
 */
export interface PRTimelinePoint {
  date: number; // Unix timestamp (achieved_at)
  exerciseName: string;
  reps: number;
  weight: number;
  workoutSessionId: string;
}

/**
 * Get total volume data points over time
 *
 * Returns one data point per day with aggregated volume from all workouts that day.
 *
 * @param startDate - Start timestamp (inclusive)
 * @param endDate - End timestamp (inclusive)
 * @returns Promise that resolves to array of volume data points
 */
export async function getVolumeOverTime(
  startDate: number,
  endDate: number
): Promise<VolumeDataPoint[]> {
  const rows = await query<{
    date: number;
    total_volume: number;
    total_sets: number;
    total_reps: number;
  }>(
    `SELECT
      DATE(wss.start_time / 1000, 'unixepoch') as date_str,
      (CAST(strftime('%s', DATE(wss.start_time / 1000, 'unixepoch')) AS INTEGER) * 1000) as date,
      SUM(ws.reps * ws.weight) as total_volume,
      COUNT(ws.id) as total_sets,
      SUM(ws.reps) as total_reps
     FROM workout_sessions wss
     INNER JOIN workout_sets ws ON ws.workout_session_id = wss.id
     WHERE wss.start_time >= ?
       AND wss.start_time <= ?
       AND wss.end_time IS NOT NULL
       AND ws.completed = 1
     GROUP BY date_str
     ORDER BY date ASC`,
    [startDate, endDate]
  );

  return rows.map((row) => ({
    date: row.date,
    totalVolume: row.total_volume ?? 0,
    totalSets: row.total_sets ?? 0,
    totalReps: row.total_reps ?? 0,
  }));
}

/**
 * Get exercise progression data over time for a specific exercise
 *
 * Returns one data point per workout session where the exercise was performed.
 *
 * @param exerciseName - Exercise name (case-insensitive)
 * @param limit - Maximum number of data points to return (default 50)
 * @returns Promise that resolves to array of progression data points
 */
export async function getExerciseProgression(
  exerciseName: string,
  limit: number = 50
): Promise<ExerciseProgressionPoint[]> {
  const rows = await query<{
    date: number;
    workout_session_id: string;
    max_weight: number;
    total_volume: number;
    total_sets: number;
    total_reps: number;
  }>(
    `SELECT
      wss.start_time as date,
      wss.id as workout_session_id,
      MAX(ws.weight) as max_weight,
      SUM(ws.reps * ws.weight) as total_volume,
      COUNT(ws.id) as total_sets,
      SUM(ws.reps) as total_reps
     FROM workout_sessions wss
     INNER JOIN exercises e ON e.workout_session_id = wss.id
     INNER JOIN workout_sets ws ON ws.exercise_id = e.id
     WHERE LOWER(e.name) = LOWER(?)
       AND wss.end_time IS NOT NULL
       AND ws.completed = 1
     GROUP BY wss.id
     ORDER BY wss.start_time DESC
     LIMIT ?`,
    [exerciseName, limit]
  );

  // Reverse to show oldest first (chronological order for charts)
  return rows.reverse().map((row) => ({
    date: row.date,
    workoutSessionId: row.workout_session_id,
    maxWeight: row.max_weight ?? 0,
    totalVolume: row.total_volume ?? 0,
    totalSets: row.total_sets ?? 0,
    totalReps: row.total_reps ?? 0,
  }));
}

/**
 * Get PR timeline data
 *
 * Returns all PRs achieved within the specified date range.
 *
 * @param startDate - Start timestamp (inclusive)
 * @param endDate - End timestamp (inclusive)
 * @returns Promise that resolves to array of PR timeline data points
 */
export async function getPRTimeline(
  startDate: number,
  endDate: number
): Promise<PRTimelinePoint[]> {
  const rows = await query<{
    date: number;
    exercise_name: string;
    reps: number;
    weight: number;
    workout_session_id: string;
  }>(
    `SELECT
      achieved_at as date,
      exercise_name,
      reps,
      weight,
      workout_session_id
     FROM pr_records
     WHERE achieved_at >= ? AND achieved_at <= ?
     ORDER BY achieved_at ASC`,
    [startDate, endDate]
  );

  return rows.map((row) => ({
    date: row.date,
    exerciseName: row.exercise_name,
    reps: row.reps,
    weight: row.weight,
    workoutSessionId: row.workout_session_id,
  }));
}

/**
 * Get all unique exercise names from completed workouts
 *
 * @returns Promise that resolves to array of exercise names
 */
export async function getUniqueExerciseNames(): Promise<string[]> {
  const rows = await query<{ name: string }>(
    `SELECT DISTINCT e.name
     FROM exercises e
     INNER JOIN workout_sessions wss ON e.workout_session_id = wss.id
     WHERE wss.end_time IS NOT NULL
     ORDER BY e.name ASC`
  );

  return rows.map((row) => row.name);
}

/**
 * Get total workout count for a date range
 *
 * @param startDate - Start timestamp (inclusive)
 * @param endDate - End timestamp (inclusive)
 * @returns Promise that resolves to total count
 */
export async function getTotalWorkoutCount(
  startDate: number,
  endDate: number
): Promise<number> {
  const result = await getOne<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM workout_sessions
     WHERE start_time >= ? AND start_time <= ? AND end_time IS NOT NULL`,
    [startDate, endDate]
  );

  return result?.count ?? 0;
}

/**
 * Get total volume for a date range
 *
 * @param startDate - Start timestamp (inclusive)
 * @param endDate - End timestamp (inclusive)
 * @returns Promise that resolves to total volume
 */
export async function getTotalVolume(
  startDate: number,
  endDate: number
): Promise<number> {
  const result = await getOne<{ total_volume: number | null }>(
    `SELECT SUM(ws.reps * ws.weight) as total_volume
     FROM workout_sessions wss
     INNER JOIN workout_sets ws ON ws.workout_session_id = wss.id
     WHERE wss.start_time >= ?
       AND wss.start_time <= ?
       AND wss.end_time IS NOT NULL
       AND ws.completed = 1`,
    [startDate, endDate]
  );

  return result?.total_volume ?? 0;
}

/**
 * Get average workout duration for a date range
 *
 * @param startDate - Start timestamp (inclusive)
 * @param endDate - End timestamp (inclusive)
 * @returns Promise that resolves to average duration in seconds
 */
export async function getAverageWorkoutDuration(
  startDate: number,
  endDate: number
): Promise<number> {
  const result = await getOne<{ avg_duration: number | null }>(
    `SELECT AVG(duration) as avg_duration
     FROM workout_sessions
     WHERE start_time >= ? AND start_time <= ? AND end_time IS NOT NULL`,
    [startDate, endDate]
  );

  return result?.avg_duration ?? 0;
}

/**
 * Get total PR count for a date range
 *
 * @param startDate - Start timestamp (inclusive)
 * @param endDate - End timestamp (inclusive)
 * @returns Promise that resolves to total PR count
 */
export async function getPRCount(
  startDate: number,
  endDate: number
): Promise<number> {
  const result = await getOne<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM pr_records
     WHERE achieved_at >= ? AND achieved_at <= ?`,
    [startDate, endDate]
  );

  return result?.count ?? 0;
}
