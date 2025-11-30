/**
 * Templates Repository
 *
 * Data access layer for workout templates and exercise templates.
 * Handles all CRUD operations for the templates feature.
 */

import { WorkoutTemplate, ExerciseTemplate } from '@/types';
import { query, execute, getOne, transaction } from '../helpers';

/**
 * Database row types (snake_case from SQLite)
 */
interface WorkoutTemplateRow {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
  last_used: number | null;
}

interface ExerciseTemplateRow {
  id: string;
  workout_template_id: string;
  name: string;
  order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Convert database row to WorkoutTemplate object
 */
function rowToWorkoutTemplate(
  row: WorkoutTemplateRow,
  exercises: ExerciseTemplate[] = []
): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    exercises,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsed: row.last_used ?? undefined,
  };
}

/**
 * Convert database row to ExerciseTemplate object
 */
function rowToExerciseTemplate(row: ExerciseTemplateRow): ExerciseTemplate {
  return {
    id: row.id,
    workoutTemplateId: row.workout_template_id,
    name: row.name,
    order: row.order,
    targetSets: row.target_sets ?? undefined,
    targetReps: row.target_reps ?? undefined,
    targetWeight: row.target_weight ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all workout templates
 *
 * @param includeExercises - Whether to include exercises in the result
 * @returns Promise that resolves to array of workout templates
 */
export async function getAllTemplates(
  includeExercises: boolean = true
): Promise<WorkoutTemplate[]> {
  const rows = await query<WorkoutTemplateRow>(
    'SELECT * FROM workout_templates ORDER BY last_used DESC, updated_at DESC'
  );

  if (!includeExercises) {
    return rows.map((row) => rowToWorkoutTemplate(row, []));
  }

  // Fetch exercises for all templates
  const templates: WorkoutTemplate[] = [];
  for (const row of rows) {
    const exercises = await getExerciseTemplatesByWorkoutId(row.id);
    templates.push(rowToWorkoutTemplate(row, exercises));
  }

  return templates;
}

/**
 * Get a single workout template by ID
 *
 * @param id - Template ID
 * @param includeExercises - Whether to include exercises in the result
 * @returns Promise that resolves to the template or null if not found
 */
export async function getTemplateById(
  id: string,
  includeExercises: boolean = true
): Promise<WorkoutTemplate | null> {
  const row = await getOne<WorkoutTemplateRow>(
    'SELECT * FROM workout_templates WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  const exercises = includeExercises
    ? await getExerciseTemplatesByWorkoutId(id)
    : [];

  return rowToWorkoutTemplate(row, exercises);
}

/**
 * Create a new workout template
 *
 * @param template - Template data (without exercises)
 * @returns Promise that resolves when template is created
 */
export async function createTemplate(
  template: Omit<WorkoutTemplate, 'exercises'>
): Promise<void> {
  await execute(
    `INSERT INTO workout_templates (id, name, description, created_at, updated_at, last_used)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      template.id,
      template.name,
      template.description ?? null,
      template.createdAt,
      template.updatedAt,
      template.lastUsed ?? null,
    ]
  );
}

/**
 * Update an existing workout template
 *
 * @param id - Template ID
 * @param updates - Fields to update
 * @returns Promise that resolves when template is updated
 */
export async function updateTemplate(
  id: string,
  updates: {
    name?: string;
    description?: string | null;
    lastUsed?: number;
    updatedAt: number;
  }
): Promise<void> {
  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.name !== undefined) {
    setParts.push('name = ?');
    params.push(updates.name);
  }

  if (updates.description !== undefined) {
    setParts.push('description = ?');
    params.push(updates.description);
  }

  if (updates.lastUsed !== undefined) {
    setParts.push('last_used = ?');
    params.push(updates.lastUsed);
  }

  setParts.push('updated_at = ?');
  params.push(updates.updatedAt);

  params.push(id);

  await execute(
    `UPDATE workout_templates SET ${setParts.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Delete a workout template
 *
 * Also deletes all associated exercise templates (CASCADE)
 *
 * @param id - Template ID
 * @returns Promise that resolves when template is deleted
 */
export async function deleteTemplate(id: string): Promise<void> {
  await execute('DELETE FROM workout_templates WHERE id = ?', [id]);
}

/**
 * Get all exercise templates for a workout template
 *
 * @param workoutTemplateId - Workout template ID
 * @returns Promise that resolves to array of exercise templates
 */
export async function getExerciseTemplatesByWorkoutId(
  workoutTemplateId: string
): Promise<ExerciseTemplate[]> {
  const rows = await query<ExerciseTemplateRow>(
    'SELECT * FROM exercise_templates WHERE workout_template_id = ? ORDER BY "order" ASC',
    [workoutTemplateId]
  );

  return rows.map(rowToExerciseTemplate);
}

/**
 * Get a single exercise template by ID
 *
 * @param id - Exercise template ID
 * @returns Promise that resolves to the exercise template or null if not found
 */
export async function getExerciseTemplateById(
  id: string
): Promise<ExerciseTemplate | null> {
  const row = await getOne<ExerciseTemplateRow>(
    'SELECT * FROM exercise_templates WHERE id = ?',
    [id]
  );

  return row ? rowToExerciseTemplate(row) : null;
}

/**
 * Create a new exercise template
 *
 * @param exercise - Exercise template data
 * @returns Promise that resolves when exercise template is created
 */
export async function createExerciseTemplate(
  exercise: ExerciseTemplate
): Promise<void> {
  await execute(
    `INSERT INTO exercise_templates
     (id, workout_template_id, name, "order", target_sets, target_reps, target_weight, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exercise.id,
      exercise.workoutTemplateId,
      exercise.name,
      exercise.order,
      exercise.targetSets ?? null,
      exercise.targetReps ?? null,
      exercise.targetWeight ?? null,
      exercise.notes ?? null,
      exercise.createdAt,
      exercise.updatedAt,
    ]
  );
}

/**
 * Update an existing exercise template
 *
 * @param id - Exercise template ID
 * @param updates - Fields to update
 * @returns Promise that resolves when exercise template is updated
 */
export async function updateExerciseTemplate(
  id: string,
  updates: {
    name?: string;
    order?: number;
    targetSets?: number | null;
    targetReps?: number | null;
    targetWeight?: number | null;
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

  if (updates.targetSets !== undefined) {
    setParts.push('target_sets = ?');
    params.push(updates.targetSets);
  }

  if (updates.targetReps !== undefined) {
    setParts.push('target_reps = ?');
    params.push(updates.targetReps);
  }

  if (updates.targetWeight !== undefined) {
    setParts.push('target_weight = ?');
    params.push(updates.targetWeight);
  }

  if (updates.notes !== undefined) {
    setParts.push('notes = ?');
    params.push(updates.notes);
  }

  setParts.push('updated_at = ?');
  params.push(updates.updatedAt);

  params.push(id);

  await execute(
    `UPDATE exercise_templates SET ${setParts.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Delete an exercise template
 *
 * @param id - Exercise template ID
 * @returns Promise that resolves when exercise template is deleted
 */
export async function deleteExerciseTemplate(id: string): Promise<void> {
  await execute('DELETE FROM exercise_templates WHERE id = ?', [id]);
}

/**
 * Delete all exercise templates for a workout template
 *
 * @param workoutTemplateId - Workout template ID
 * @returns Promise that resolves when all exercise templates are deleted
 */
export async function deleteExerciseTemplatesByWorkoutId(
  workoutTemplateId: string
): Promise<void> {
  await execute('DELETE FROM exercise_templates WHERE workout_template_id = ?', [
    workoutTemplateId,
  ]);
}

/**
 * Create a complete workout template with exercises in a transaction
 *
 * @param template - Complete workout template with exercises
 * @returns Promise that resolves when template and exercises are created
 */
export async function createTemplateWithExercises(
  template: WorkoutTemplate
): Promise<void> {
  const statements = [
    {
      sql: `INSERT INTO workout_templates (id, name, description, created_at, updated_at, last_used)
            VALUES (?, ?, ?, ?, ?, ?)`,
      params: [
        template.id,
        template.name,
        template.description ?? null,
        template.createdAt,
        template.updatedAt,
        template.lastUsed ?? null,
      ],
    },
  ];

  // Add exercise inserts
  for (const exercise of template.exercises) {
    statements.push({
      sql: `INSERT INTO exercise_templates
            (id, workout_template_id, name, "order", target_sets, target_reps, target_weight, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        exercise.id,
        exercise.workoutTemplateId,
        exercise.name,
        exercise.order,
        exercise.targetSets ?? null,
        exercise.targetReps ?? null,
        exercise.targetWeight ?? null,
        exercise.notes ?? null,
        exercise.createdAt,
        exercise.updatedAt,
      ],
    });
  }

  await transaction(statements);
}

/**
 * Update a complete workout template with exercises in a transaction
 *
 * This deletes all existing exercises and recreates them.
 *
 * @param template - Complete workout template with exercises
 * @returns Promise that resolves when template and exercises are updated
 */
export async function updateTemplateWithExercises(
  template: WorkoutTemplate
): Promise<void> {
  const statements = [
    {
      sql: `UPDATE workout_templates
            SET name = ?, description = ?, updated_at = ?
            WHERE id = ?`,
      params: [
        template.name,
        template.description ?? null,
        template.updatedAt,
        template.id,
      ],
    },
    {
      sql: 'DELETE FROM exercise_templates WHERE workout_template_id = ?',
      params: [template.id],
    },
  ];

  // Add exercise inserts
  for (const exercise of template.exercises) {
    statements.push({
      sql: `INSERT INTO exercise_templates
            (id, workout_template_id, name, "order", target_sets, target_reps, target_weight, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        exercise.id,
        exercise.workoutTemplateId,
        exercise.name,
        exercise.order,
        exercise.targetSets ?? null,
        exercise.targetReps ?? null,
        exercise.targetWeight ?? null,
        exercise.notes ?? null,
        exercise.createdAt,
        exercise.updatedAt,
      ],
    });
  }

  await transaction(statements);
}
