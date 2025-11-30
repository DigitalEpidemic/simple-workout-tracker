/**
 * Template Service
 *
 * Business logic layer for workout template management.
 * Handles validation and orchestration of template operations.
 *
 * @note Weight units are currently hardcoded to lbs throughout the UI.
 *       Database stores numeric values without units.
 *       Phase 4.6 will implement user settings for weight unit toggle (lbs/kg).
 */

import { WorkoutTemplate, ExerciseTemplate } from '@/types';
import {
  getAllTemplates,
  getTemplateById,
  createTemplateWithExercises,
  updateTemplateWithExercises,
  deleteTemplate,
} from '@/src/lib/db/repositories/templates';

/**
 * Generate a unique ID for database records
 * Using timestamp + random string for simplicity (offline-first)
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Fetch all workout templates
 *
 * @returns Promise that resolves to array of templates
 */
export async function fetchAllTemplates(): Promise<WorkoutTemplate[]> {
  return getAllTemplates(true);
}

/**
 * Fetch a single template by ID
 *
 * @param id - Template ID
 * @returns Promise that resolves to the template or null
 */
export async function fetchTemplateById(id: string): Promise<WorkoutTemplate | null> {
  return getTemplateById(id, true);
}

/**
 * Create a new workout template
 *
 * @param name - Template name
 * @param description - Template description (optional)
 * @param exercises - Array of exercise definitions
 * @returns Promise that resolves to the created template
 */
export async function createNewTemplate(
  name: string,
  description: string | undefined,
  exercises: Array<{
    name: string;
    targetSets?: number;
    targetReps?: number;
    targetWeight?: number;
    notes?: string;
  }>
): Promise<WorkoutTemplate> {
  const now = Date.now();
  const templateId = generateId();

  // Create exercise templates with order
  const exerciseTemplates: ExerciseTemplate[] = exercises.map((ex, index) => ({
    id: generateId(),
    workoutTemplateId: templateId,
    name: ex.name,
    order: index,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps,
    targetWeight: ex.targetWeight,
    notes: ex.notes,
    createdAt: now,
    updatedAt: now,
  }));

  const template: WorkoutTemplate = {
    id: templateId,
    name,
    description,
    exercises: exerciseTemplates,
    createdAt: now,
    updatedAt: now,
  };

  await createTemplateWithExercises(template);

  return template;
}

/**
 * Update an existing workout template
 *
 * @param id - Template ID
 * @param name - Updated name
 * @param description - Updated description
 * @param exercises - Updated exercise list
 * @returns Promise that resolves to the updated template
 */
export async function updateExistingTemplate(
  id: string,
  name: string,
  description: string | undefined,
  exercises: Array<{
    id?: string; // Existing exercise ID (if editing)
    name: string;
    targetSets?: number;
    targetReps?: number;
    targetWeight?: number;
    notes?: string;
  }>
): Promise<WorkoutTemplate> {
  const existing = await getTemplateById(id, false);

  if (!existing) {
    throw new Error(`Template with ID ${id} not found`);
  }

  const now = Date.now();

  // Create exercise templates with order, preserving IDs where possible
  const exerciseTemplates: ExerciseTemplate[] = exercises.map((ex, index) => ({
    id: ex.id || generateId(),
    workoutTemplateId: id,
    name: ex.name,
    order: index,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps,
    targetWeight: ex.targetWeight,
    notes: ex.notes,
    createdAt: existing.createdAt, // Preserve original creation time
    updatedAt: now,
  }));

  const template: WorkoutTemplate = {
    id,
    name,
    description,
    exercises: exerciseTemplates,
    createdAt: existing.createdAt,
    updatedAt: now,
    lastUsed: existing.lastUsed,
  };

  await updateTemplateWithExercises(template);

  return template;
}

/**
 * Delete a workout template
 *
 * @param id - Template ID
 * @returns Promise that resolves when template is deleted
 */
export async function removeTemplate(id: string): Promise<void> {
  await deleteTemplate(id);
}

/**
 * Validate template name
 *
 * @param name - Template name
 * @returns Error message if invalid, null if valid
 */
export function validateTemplateName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return 'Template name is required';
  }

  if (trimmed.length < 2) {
    return 'Template name must be at least 2 characters';
  }

  if (trimmed.length > 50) {
    return 'Template name must be less than 50 characters';
  }

  return null;
}

/**
 * Validate exercise name
 *
 * @param name - Exercise name
 * @returns Error message if invalid, null if valid
 */
export function validateExerciseName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return 'Exercise name is required';
  }

  if (trimmed.length < 2) {
    return 'Exercise name must be at least 2 characters';
  }

  if (trimmed.length > 50) {
    return 'Exercise name must be less than 50 characters';
  }

  return null;
}

/**
 * Validate exercise targets (sets, reps, weight)
 *
 * @param targetSets - Target sets
 * @param targetReps - Target reps
 * @param targetWeight - Target weight
 * @returns Error message if invalid, null if valid
 */
export function validateExerciseTargets(
  targetSets?: number,
  targetReps?: number,
  targetWeight?: number
): string | null {
  if (targetSets !== undefined && (targetSets < 1 || targetSets > 20)) {
    return 'Target sets must be between 1 and 20';
  }

  if (targetReps !== undefined && (targetReps < 1 || targetReps > 100)) {
    return 'Target reps must be between 1 and 100';
  }

  if (targetWeight !== undefined && targetWeight < 0) {
    return 'Target weight must be positive';
  }

  return null;
}
