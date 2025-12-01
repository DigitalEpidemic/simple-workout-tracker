/**
 * Workout Service - Business logic for workout operations
 *
 * Handles creating workout sessions from templates and managing active workouts.
 */

import { WorkoutSession, Exercise, WorkoutTemplate } from '@/types';
import { createSessionWithExercises } from '@/src/lib/db/repositories/sessions';
import { updateTemplateLastUsed } from '@/src/lib/db/repositories/templates';
import { generateId } from '@/src/lib/utils/id';

/**
 * Start a new workout from a template
 *
 * Creates a new workout session, copies template exercises into the session,
 * and starts the workout timer. Updates the template's lastUsed timestamp.
 *
 * @param template - The workout template to use
 * @returns Promise that resolves to the created workout session
 */
export async function startWorkoutFromTemplate(
  template: WorkoutTemplate
): Promise<WorkoutSession> {
  const now = Date.now();
  const sessionId = generateId();

  // Create exercise instances from template
  const exercises: Exercise[] = template.exercises.map((exerciseTemplate, index) => ({
    id: generateId(),
    workoutSessionId: sessionId,
    name: exerciseTemplate.name,
    order: exerciseTemplate.order ?? index,
    sets: [], // Sets will be added during the workout
    notes: exerciseTemplate.notes,
    createdAt: now,
    updatedAt: now,
  }));

  // Create workout session
  const session: WorkoutSession = {
    id: sessionId,
    templateId: template.id,
    templateName: template.name,
    name: template.name,
    exercises,
    startTime: now, // Timer starts immediately when session is created
    createdAt: now,
    updatedAt: now,
  };

  // Save to database in a transaction
  await createSessionWithExercises(session);

  // Update template's lastUsed timestamp
  await updateTemplateLastUsed(template.id, now);

  return session;
}

/**
 * Start an empty workout (without a template)
 *
 * Creates a new workout session with no exercises.
 * User can add exercises during the workout.
 *
 * @param name - Optional name for the workout
 * @returns Promise that resolves to the created workout session
 */
export async function startEmptyWorkout(name: string = 'Workout'): Promise<WorkoutSession> {
  const now = Date.now();
  const sessionId = generateId();

  const session: WorkoutSession = {
    id: sessionId,
    name,
    exercises: [],
    startTime: now,
    createdAt: now,
    updatedAt: now,
  };

  await createSessionWithExercises(session);

  return session;
}
