/**
 * Programs repository
 *
 * Database operations for multi-day training programs
 */

import {
  Program,
  ProgramDay,
  ProgramDayExercise,
  ProgramHistoryEntry,
} from '@/types';
import { execute, getAll, getOne, transaction } from '../helpers';

/**
 * Database row types (snake_case from SQLite)
 */
interface ProgramRow {
  id: string;
  name: string;
  description: string | null;
  is_active: number;
  current_day_index: number;
  created_at: number;
  updated_at: number;
}

interface ProgramDayRow {
  id: string;
  program_id: string;
  day_index: number;
  name: string;
  created_at: number;
  updated_at: number;
}

interface ProgramDayExerciseRow {
  id: string;
  program_day_id: string;
  exercise_name: string;
  order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  rest_seconds: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

interface ProgramHistoryRow {
  id: string;
  program_id: string;
  program_day_id: string;
  workout_session_id: string;
  performed_at: number;
  duration_seconds: number | null;
  created_at: number;
}

/**
 * Convert database row to Program object
 */
function mapRowToProgram(row: ProgramRow): Omit<Program, 'days'> {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    isActive: row.is_active === 1,
    currentDayIndex: row.current_day_index,
    days: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to ProgramDay object
 */
function mapRowToProgramDay(row: ProgramDayRow): Omit<ProgramDay, 'exercises'> {
  return {
    id: row.id,
    programId: row.program_id,
    dayIndex: row.day_index,
    name: row.name,
    exercises: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to ProgramDayExercise object
 */
function mapRowToProgramDayExercise(
  row: ProgramDayExerciseRow
): ProgramDayExercise {
  return {
    id: row.id,
    programDayId: row.program_day_id,
    exerciseName: row.exercise_name,
    order: row.order,
    targetSets: row.target_sets ?? undefined,
    targetReps: row.target_reps ?? undefined,
    targetWeight: row.target_weight ?? undefined,
    restSeconds: row.rest_seconds ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to ProgramHistoryEntry object
 */
function mapRowToProgramHistoryEntry(
  row: ProgramHistoryRow
): ProgramHistoryEntry {
  return {
    id: row.id,
    programId: row.program_id,
    programDayId: row.program_day_id,
    workoutSessionId: row.workout_session_id,
    performedAt: row.performed_at,
    durationSeconds: row.duration_seconds ?? undefined,
    createdAt: row.created_at,
  };
}

// ============================================================================
// Program CRUD
// ============================================================================

/**
 * Create a new program
 */
export async function createProgram(
  program: Omit<Program, 'days'>
): Promise<void> {
  await execute(
    `INSERT INTO programs (id, name, description, is_active, current_day_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      program.id,
      program.name,
      program.description ?? null,
      program.isActive ? 1 : 0,
      program.currentDayIndex,
      program.createdAt,
      program.updatedAt,
    ]
  );
}

/**
 * Update an existing program
 */
export async function updateProgram(
  id: string,
  updates: Partial<Omit<Program, 'id' | 'days' | 'createdAt'>>
): Promise<void> {
  const now = Date.now();
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    values.push(updates.description ?? null);
  }
  if (updates.isActive !== undefined) {
    setClauses.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }
  if (updates.currentDayIndex !== undefined) {
    setClauses.push('current_day_index = ?');
    values.push(updates.currentDayIndex);
  }

  setClauses.push('updated_at = ?');
  values.push(now);

  values.push(id);

  await execute(
    `UPDATE programs SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Delete a program and all related data (cascades to days, exercises, history)
 */
export async function deleteProgram(id: string): Promise<void> {
  await execute('DELETE FROM programs WHERE id = ?', [id]);
}

/**
 * Get all programs (without days/exercises)
 */
export async function getAllPrograms(): Promise<Omit<Program, 'days'>[]> {
  const rows = await getAll<ProgramRow>(
    'SELECT * FROM programs ORDER BY created_at DESC'
  );
  return rows.map(mapRowToProgram);
}

/**
 * Get a program by ID (without days/exercises)
 */
export async function getProgramById(
  id: string
): Promise<Omit<Program, 'days'> | null> {
  const row = await getOne<ProgramRow>(
    'SELECT * FROM programs WHERE id = ?',
    [id]
  );
  return row ? mapRowToProgram(row) : null;
}

/**
 * Get the active program (without days/exercises)
 */
export async function getActiveProgram(): Promise<Omit<Program, 'days'> | null> {
  const row = await getOne<ProgramRow>(
    'SELECT * FROM programs WHERE is_active = 1'
  );
  return row ? mapRowToProgram(row) : null;
}

/**
 * Set a program as active (deactivates all others)
 */
export async function setActiveProgram(id: string): Promise<void> {
  await transaction([
    { sql: 'UPDATE programs SET is_active = 0' },
    { sql: 'UPDATE programs SET is_active = 1, updated_at = ? WHERE id = ?', params: [Date.now(), id] },
  ]);
}

/**
 * Get a full program with all days and exercises
 */
export async function getProgramWithDaysAndExercises(
  id: string
): Promise<Program | null> {
  const program = await getProgramById(id);
  if (!program) return null;

  const days = await getProgramDaysByProgramId(id);

  return {
    ...program,
    days,
  };
}

// ============================================================================
// Program Day CRUD
// ============================================================================

/**
 * Create a new program day
 */
export async function createProgramDay(
  day: Omit<ProgramDay, 'exercises'>
): Promise<void> {
  await execute(
    `INSERT INTO program_days (id, program_id, day_index, name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [day.id, day.programId, day.dayIndex, day.name, day.createdAt, day.updatedAt]
  );
}

/**
 * Update an existing program day
 */
export async function updateProgramDay(
  id: string,
  updates: Partial<Omit<ProgramDay, 'id' | 'programId' | 'exercises' | 'createdAt'>>
): Promise<void> {
  const now = Date.now();
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.dayIndex !== undefined) {
    setClauses.push('day_index = ?');
    values.push(updates.dayIndex);
  }
  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }

  setClauses.push('updated_at = ?');
  values.push(now);

  values.push(id);

  await execute(
    `UPDATE program_days SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Delete a program day (cascades to exercises)
 */
export async function deleteProgramDay(id: string): Promise<void> {
  await execute('DELETE FROM program_days WHERE id = ?', [id]);
}

/**
 * Get all days for a program (with exercises)
 */
export async function getProgramDaysByProgramId(
  programId: string
): Promise<ProgramDay[]> {
  const rows = await getAll<ProgramDayRow>(
    'SELECT * FROM program_days WHERE program_id = ? ORDER BY day_index ASC',
    [programId]
  );

  const days: ProgramDay[] = [];

  for (const row of rows) {
    const exercises = await getProgramDayExercisesByDayId(row.id);
    days.push({
      ...mapRowToProgramDay(row),
      exercises,
    });
  }

  return days;
}

/**
 * Get a program day by ID (with exercises)
 */
export async function getProgramDayById(id: string): Promise<ProgramDay | null> {
  const row = await getOne<ProgramDayRow>(
    'SELECT * FROM program_days WHERE id = ?',
    [id]
  );

  if (!row) return null;

  const exercises = await getProgramDayExercisesByDayId(id);

  return {
    ...mapRowToProgramDay(row),
    exercises,
  };
}

// ============================================================================
// Program Day Exercise CRUD
// ============================================================================

/**
 * Create a new program day exercise
 */
export async function createProgramDayExercise(
  exercise: ProgramDayExercise
): Promise<void> {
  await execute(
    `INSERT INTO program_day_exercises
     (id, program_day_id, exercise_name, "order", target_sets, target_reps, target_weight, rest_seconds, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exercise.id,
      exercise.programDayId,
      exercise.exerciseName,
      exercise.order,
      exercise.targetSets ?? null,
      exercise.targetReps ?? null,
      exercise.targetWeight ?? null,
      exercise.restSeconds ?? null,
      exercise.notes ?? null,
      exercise.createdAt,
      exercise.updatedAt,
    ]
  );
}

/**
 * Update an existing program day exercise
 */
export async function updateProgramDayExercise(
  id: string,
  updates: Partial<Omit<ProgramDayExercise, 'id' | 'programDayId' | 'createdAt'>>
): Promise<void> {
  const now = Date.now();
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.exerciseName !== undefined) {
    setClauses.push('exercise_name = ?');
    values.push(updates.exerciseName);
  }
  if (updates.order !== undefined) {
    setClauses.push('"order" = ?');
    values.push(updates.order);
  }
  if (updates.targetSets !== undefined) {
    setClauses.push('target_sets = ?');
    values.push(updates.targetSets ?? null);
  }
  if (updates.targetReps !== undefined) {
    setClauses.push('target_reps = ?');
    values.push(updates.targetReps ?? null);
  }
  if (updates.targetWeight !== undefined) {
    setClauses.push('target_weight = ?');
    values.push(updates.targetWeight ?? null);
  }
  if (updates.restSeconds !== undefined) {
    setClauses.push('rest_seconds = ?');
    values.push(updates.restSeconds ?? null);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    values.push(updates.notes ?? null);
  }

  setClauses.push('updated_at = ?');
  values.push(now);

  values.push(id);

  await execute(
    `UPDATE program_day_exercises SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Delete a program day exercise
 */
export async function deleteProgramDayExercise(id: string): Promise<void> {
  await execute('DELETE FROM program_day_exercises WHERE id = ?', [id]);
}

/**
 * Get all exercises for a program day
 */
export async function getProgramDayExercisesByDayId(
  dayId: string
): Promise<ProgramDayExercise[]> {
  const rows = await getAll<ProgramDayExerciseRow>(
    'SELECT * FROM program_day_exercises WHERE program_day_id = ? ORDER BY "order" ASC',
    [dayId]
  );
  return rows.map(mapRowToProgramDayExercise);
}

// ============================================================================
// Program Execution
// ============================================================================

/**
 * Advance program to next day (called after completing a workout)
 * Wraps around to day 0 when reaching the end
 */
export async function advanceProgramDay(programId: string): Promise<void> {
  // Get current state
  const program = await getProgramById(programId);
  if (!program) {
    throw new Error(`Program ${programId} not found`);
  }

  // Get total number of days
  const days = await getProgramDaysByProgramId(programId);
  const totalDays = days.length;

  if (totalDays === 0) {
    console.warn(`Program ${programId} has no days, cannot advance`);
    return;
  }

  // Calculate next index (wrap around)
  const nextIndex = (program.currentDayIndex + 1) % totalDays;

  // Update program
  await updateProgram(programId, { currentDayIndex: nextIndex });

  console.log(
    `Advanced program ${programId} from day ${program.currentDayIndex} to day ${nextIndex}`
  );
}

/**
 * Get the next program day to perform (based on current_day_index)
 */
export async function getNextProgramDay(
  programId: string
): Promise<ProgramDay | null> {
  const program = await getProgramById(programId);
  if (!program) return null;

  const days = await getProgramDaysByProgramId(programId);
  if (days.length === 0) return null;

  // Return day at current_day_index
  return days[program.currentDayIndex] ?? null;
}

// ============================================================================
// Program History
// ============================================================================

/**
 * Log program history after completing a workout
 */
export async function logProgramHistory(
  entry: Omit<ProgramHistoryEntry, 'id' | 'createdAt'>
): Promise<void> {
  const id = `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await execute(
    `INSERT INTO program_history (id, program_id, program_day_id, workout_session_id, performed_at, duration_seconds, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      entry.programId,
      entry.programDayId,
      entry.workoutSessionId,
      entry.performedAt,
      entry.durationSeconds ?? null,
      now,
    ]
  );
}

/**
 * Get program history for a specific program
 */
export async function getProgramHistory(
  programId: string
): Promise<ProgramHistoryEntry[]> {
  const rows = await getAll<ProgramHistoryRow>(
    'SELECT * FROM program_history WHERE program_id = ? ORDER BY performed_at DESC',
    [programId]
  );
  return rows.map(mapRowToProgramHistoryEntry);
}

/**
 * Get program history for a specific workout session
 */
export async function getProgramHistoryBySessionId(
  sessionId: string
): Promise<ProgramHistoryEntry | null> {
  const row = await getOne<ProgramHistoryRow>(
    'SELECT * FROM program_history WHERE workout_session_id = ?',
    [sessionId]
  );
  return row ? mapRowToProgramHistoryEntry(row) : null;
}
