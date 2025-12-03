/**
 * Sessions Repository
 *
 * Data access layer for workout sessions and exercises.
 * Handles all CRUD operations for active and completed workouts.
 */

import { WorkoutSession, Exercise } from '@/types';
import { query, execute, getOne, transaction } from '../helpers';
import { getAllSetsBySessionId } from './sets';

/**
 * Database row types (snake_case from SQLite)
 */
interface WorkoutSessionRow {
  id: string;
  template_id: string | null;
  template_name: string | null;
  program_id: string | null;
  program_day_id: string | null;
  program_day_name: string | null;
  name: string;
  start_time: number;
  end_time: number | null;
  duration: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

interface ExerciseRow {
  id: string;
  workout_session_id: string;
  name: string;
  order: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Convert database row to WorkoutSession object
 */
function rowToWorkoutSession(
  row: WorkoutSessionRow,
  exercises: Exercise[] = []
): WorkoutSession {
  return {
    id: row.id,
    templateId: row.template_id ?? undefined,
    templateName: row.template_name ?? undefined,
    programId: row.program_id ?? undefined,
    programDayId: row.program_day_id ?? undefined,
    programDayName: row.program_day_name ?? undefined,
    name: row.name,
    exercises,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    duration: row.duration ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to Exercise object
 */
async function rowToExercise(row: ExerciseRow): Promise<Exercise> {
  const sets = await getAllSetsBySessionId(row.workout_session_id);
  const exerciseSets = sets.filter((set) => set.exerciseId === row.id);

  return {
    id: row.id,
    workoutSessionId: row.workout_session_id,
    name: row.name,
    order: row.order,
    sets: exerciseSets,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all workout sessions
 *
 * @param includeExercises - Whether to include exercises and sets
 * @param limit - Maximum number of sessions to return
 * @returns Promise that resolves to array of workout sessions
 */
export async function getAllSessions(
  includeExercises: boolean = true,
  limit?: number
): Promise<WorkoutSession[]> {
  const sql = limit
    ? 'SELECT * FROM workout_sessions ORDER BY start_time DESC LIMIT ?'
    : 'SELECT * FROM workout_sessions ORDER BY start_time DESC';

  const params = limit ? [limit] : undefined;
  const rows = await query<WorkoutSessionRow>(sql, params);

  if (!includeExercises) {
    return rows.map((row) => rowToWorkoutSession(row, []));
  }

  const sessions: WorkoutSession[] = [];
  for (const row of rows) {
    const exercises = await getExercisesBySessionId(row.id);
    sessions.push(rowToWorkoutSession(row, exercises));
  }

  return sessions;
}

/**
 * Get a single workout session by ID
 *
 * @param id - Session ID
 * @param includeExercises - Whether to include exercises and sets
 * @returns Promise that resolves to the session or null if not found
 */
export async function getSessionById(
  id: string,
  includeExercises: boolean = true
): Promise<WorkoutSession | null> {
  const row = await getOne<WorkoutSessionRow>(
    'SELECT * FROM workout_sessions WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  const exercises = includeExercises
    ? await getExercisesBySessionId(id)
    : [];

  return rowToWorkoutSession(row, exercises);
}

/**
 * Get the currently active workout session (not completed)
 *
 * @param includeExercises - Whether to include exercises and sets
 * @returns Promise that resolves to the active session or null if none exists
 */
export async function getActiveSession(
  includeExercises: boolean = true
): Promise<WorkoutSession | null> {
  const row = await getOne<WorkoutSessionRow>(
    'SELECT * FROM workout_sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1'
  );

  if (!row) {
    return null;
  }

  const exercises = includeExercises
    ? await getExercisesBySessionId(row.id)
    : [];

  return rowToWorkoutSession(row, exercises);
}

/**
 * Get completed workout sessions
 *
 * @param includeExercises - Whether to include exercises and sets
 * @param limit - Maximum number of sessions to return
 * @returns Promise that resolves to array of completed sessions
 */
export async function getCompletedSessions(
  includeExercises: boolean = true,
  limit?: number
): Promise<WorkoutSession[]> {
  const sql = limit
    ? 'SELECT * FROM workout_sessions WHERE end_time IS NOT NULL ORDER BY start_time DESC LIMIT ?'
    : 'SELECT * FROM workout_sessions WHERE end_time IS NOT NULL ORDER BY start_time DESC';

  const params = limit ? [limit] : undefined;
  const rows = await query<WorkoutSessionRow>(sql, params);

  if (!includeExercises) {
    return rows.map((row) => rowToWorkoutSession(row, []));
  }

  const sessions: WorkoutSession[] = [];
  for (const row of rows) {
    const exercises = await getExercisesBySessionId(row.id);
    sessions.push(rowToWorkoutSession(row, exercises));
  }

  return sessions;
}

/**
 * Get workout sessions within a date range
 *
 * @param startDate - Start timestamp (inclusive)
 * @param endDate - End timestamp (inclusive)
 * @param includeExercises - Whether to include exercises and sets
 * @returns Promise that resolves to array of sessions in date range
 */
export async function getSessionsByDateRange(
  startDate: number,
  endDate: number,
  includeExercises: boolean = true
): Promise<WorkoutSession[]> {
  const rows = await query<WorkoutSessionRow>(
    'SELECT * FROM workout_sessions WHERE start_time >= ? AND start_time <= ? ORDER BY start_time DESC',
    [startDate, endDate]
  );

  if (!includeExercises) {
    return rows.map((row) => rowToWorkoutSession(row, []));
  }

  const sessions: WorkoutSession[] = [];
  for (const row of rows) {
    const exercises = await getExercisesBySessionId(row.id);
    sessions.push(rowToWorkoutSession(row, exercises));
  }

  return sessions;
}

/**
 * Create a new workout session
 *
 * @param session - Session data (without exercises)
 * @returns Promise that resolves when session is created
 */
export async function createSession(
  session: Omit<WorkoutSession, 'exercises'>
): Promise<void> {
  await execute(
    `INSERT INTO workout_sessions
     (id, template_id, template_name, program_id, program_day_id, program_day_name, name, start_time, end_time, duration, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.templateId ?? null,
      session.templateName ?? null,
      session.programId ?? null,
      session.programDayId ?? null,
      session.programDayName ?? null,
      session.name,
      session.startTime,
      session.endTime ?? null,
      session.duration ?? null,
      session.notes ?? null,
      session.createdAt,
      session.updatedAt,
    ]
  );
}

/**
 * Update an existing workout session
 *
 * @param id - Session ID
 * @param updates - Fields to update
 * @returns Promise that resolves when session is updated
 */
export async function updateSession(
  id: string,
  updates: {
    name?: string;
    endTime?: number;
    duration?: number;
    notes?: string | null;
    updatedAt: number;
  }
): Promise<void> {
  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.name !== undefined) {
    setParts.push('name = ?');
    params.push(updates.name);
  }

  if (updates.endTime !== undefined) {
    setParts.push('end_time = ?');
    params.push(updates.endTime);
  }

  if (updates.duration !== undefined) {
    setParts.push('duration = ?');
    params.push(updates.duration);
  }

  if (updates.notes !== undefined) {
    setParts.push('notes = ?');
    params.push(updates.notes);
  }

  setParts.push('updated_at = ?');
  params.push(updates.updatedAt);

  params.push(id);

  await execute(
    `UPDATE workout_sessions SET ${setParts.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Complete a workout session
 *
 * Sets end_time and calculates duration.
 * If session is from a program, logs program history and advances day.
 *
 * @param id - Session ID
 * @param endTime - End timestamp
 * @returns Promise that resolves when session is completed
 */
export async function completeSession(
  id: string,
  endTime: number
): Promise<void> {
  const session = await getSessionById(id, false);
  if (!session) {
    throw new Error(`Session ${id} not found`);
  }

  const duration = Math.floor((endTime - session.startTime) / 1000); // Duration in seconds

  await execute(
    'UPDATE workout_sessions SET end_time = ?, duration = ?, updated_at = ? WHERE id = ?',
    [endTime, duration, Date.now(), id]
  );

  // If this is a program workout, log history and advance day
  if (session.programId && session.programDayId) {
    // Import here to avoid circular dependency
    const { logProgramHistory, advanceProgramDay } = await import('./programs');

    await logProgramHistory({
      programId: session.programId,
      programDayId: session.programDayId,
      workoutSessionId: id,
      performedAt: endTime,
      durationSeconds: duration,
    });

    await advanceProgramDay(session.programId);
  }
}

/**
 * Delete a workout session
 *
 * Also deletes all associated exercises and sets (CASCADE)
 *
 * @param id - Session ID
 * @returns Promise that resolves when session is deleted
 */
export async function deleteSession(id: string): Promise<void> {
  await execute('DELETE FROM workout_sessions WHERE id = ?', [id]);
}

/**
 * Get all exercises for a workout session
 *
 * @param sessionId - Session ID
 * @returns Promise that resolves to array of exercises with sets
 */
export async function getExercisesBySessionId(
  sessionId: string
): Promise<Exercise[]> {
  const rows = await query<ExerciseRow>(
    'SELECT * FROM exercises WHERE workout_session_id = ? ORDER BY "order" ASC',
    [sessionId]
  );

  const exercises: Exercise[] = [];
  for (const row of rows) {
    exercises.push(await rowToExercise(row));
  }

  return exercises;
}

/**
 * Get a single exercise by ID
 *
 * @param id - Exercise ID
 * @returns Promise that resolves to the exercise or null if not found
 */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const row = await getOne<ExerciseRow>(
    'SELECT * FROM exercises WHERE id = ?',
    [id]
  );

  return row ? await rowToExercise(row) : null;
}

/**
 * Create a new exercise
 *
 * @param exercise - Exercise data (without sets)
 * @returns Promise that resolves when exercise is created
 */
export async function createExercise(
  exercise: Omit<Exercise, 'sets'>
): Promise<void> {
  await execute(
    `INSERT INTO exercises
     (id, workout_session_id, name, "order", notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      exercise.id,
      exercise.workoutSessionId,
      exercise.name,
      exercise.order,
      exercise.notes ?? null,
      exercise.createdAt,
      exercise.updatedAt,
    ]
  );
}

/**
 * Update an existing exercise
 *
 * @param id - Exercise ID
 * @param updates - Fields to update
 * @returns Promise that resolves when exercise is updated
 */
export async function updateExercise(
  id: string,
  updates: {
    name?: string;
    order?: number;
    notes?: string | null;
    updatedAt: number;
  }
): Promise<void> {
  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.name !== undefined) {
    setParts.push('name = ?');
    params.push(updates.name);
  }

  if (updates.order !== undefined) {
    setParts.push('"order" = ?');
    params.push(updates.order);
  }

  if (updates.notes !== undefined) {
    setParts.push('notes = ?');
    params.push(updates.notes);
  }

  setParts.push('updated_at = ?');
  params.push(updates.updatedAt);

  params.push(id);

  await execute(
    `UPDATE exercises SET ${setParts.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Delete an exercise
 *
 * Also deletes all associated sets (CASCADE)
 *
 * @param id - Exercise ID
 * @returns Promise that resolves when exercise is deleted
 */
export async function deleteExercise(id: string): Promise<void> {
  await execute('DELETE FROM exercises WHERE id = ?', [id]);
}

/**
 * Reorder exercises within a workout session
 *
 * Updates the order field for multiple exercises in a transaction.
 *
 * @param exerciseOrders - Array of { id, order } pairs
 * @returns Promise that resolves when exercises are reordered
 */
export async function reorderExercises(
  exerciseOrders: Array<{ id: string; order: number }>
): Promise<void> {
  const now = Date.now();
  const statements = exerciseOrders.map(({ id, order }) => ({
    sql: 'UPDATE exercises SET "order" = ?, updated_at = ? WHERE id = ?',
    params: [order, now, id],
  }));

  await transaction(statements);
}

/**
 * Create a complete workout session with exercises in a transaction
 *
 * Note: If exercises contain sets, they will be created in the same transaction.
 * This is useful when starting workouts from programs/templates with pre-defined sets.
 *
 * @param session - Complete workout session with exercises (and optionally sets)
 * @returns Promise that resolves when session, exercises, and sets are created
 */
export async function createSessionWithExercises(
  session: WorkoutSession
): Promise<void> {
  const statements = [
    {
      sql: `INSERT INTO workout_sessions
            (id, template_id, template_name, program_id, program_day_id, program_day_name, name, start_time, end_time, duration, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        session.id,
        session.templateId ?? null,
        session.templateName ?? null,
        session.programId ?? null,
        session.programDayId ?? null,
        session.programDayName ?? null,
        session.name,
        session.startTime,
        session.endTime ?? null,
        session.duration ?? null,
        session.notes ?? null,
        session.createdAt,
        session.updatedAt,
      ],
    },
  ];

  // Add exercise inserts
  for (const exercise of session.exercises) {
    statements.push({
      sql: `INSERT INTO exercises
            (id, workout_session_id, name, "order", notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params: [
        exercise.id,
        exercise.workoutSessionId,
        exercise.name,
        exercise.order,
        exercise.notes ?? null,
        exercise.createdAt,
        exercise.updatedAt,
      ],
    });

    // Add set inserts if the exercise has pre-defined sets
    if (exercise.sets && exercise.sets.length > 0) {
      for (const set of exercise.sets) {
        statements.push({
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
        });
      }
    }
  }

  await transaction(statements);
}
