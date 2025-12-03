/**
 * Program Service
 *
 * Business logic layer for multi-day training program management.
 * Handles validation and orchestration of program operations.
 */

import { Program, ProgramDay, ProgramDayExercise, ProgramDayExerciseSet } from '@/types';
import * as programRepo from '@/src/lib/db/repositories/programs';
import { generateId } from '@/src/lib/utils/id';

/**
 * Fetch all programs
 *
 * @returns Promise that resolves to array of programs (without full day/exercise data)
 */
export async function fetchAllPrograms(): Promise<(Omit<Program, 'days'> & { dayCount: number })[]> {
  return programRepo.getAllPrograms();
}

/**
 * Fetch a single program by ID with full days and exercises
 *
 * @param id - Program ID
 * @returns Promise that resolves to the program or null
 */
export async function fetchProgramById(id: string): Promise<Program | null> {
  return programRepo.getProgramWithDaysAndExercises(id);
}

/**
 * Create a new program
 *
 * @param name - Program name
 * @param description - Program description (optional)
 * @returns Promise that resolves to the created program
 */
export async function createNewProgram(
  name: string,
  description?: string
): Promise<Program> {
  const now = Date.now();
  const programId = generateId();

  const program: Program = {
    id: programId,
    name,
    description,
    isActive: false,
    currentDayIndex: 0,
    totalWorkoutsCompleted: 0,
    days: [],
    createdAt: now,
    updatedAt: now,
  };

  await programRepo.createProgram(program);

  return program;
}

/**
 * Update an existing program (name/description only)
 *
 * @param id - Program ID
 * @param name - Updated name
 * @param description - Updated description
 */
export async function updateExistingProgram(
  id: string,
  name: string,
  description?: string
): Promise<void> {
  await programRepo.updateProgram(id, { name, description });
}

/**
 * Delete a program
 *
 * @param id - Program ID
 */
export async function removeProgram(id: string): Promise<void> {
  await programRepo.deleteProgram(id);
}

/**
 * Activate a program (deactivates all others)
 *
 * @param id - Program ID
 */
export async function activateProgram(id: string): Promise<void> {
  // Verify program has at least one day
  const program = await programRepo.getProgramWithDaysAndExercises(id);
  if (!program || program.days.length === 0) {
    throw new Error('Cannot activate program with no days');
  }

  await programRepo.setActiveProgram(id);
}

/**
 * Get the currently active program with full data
 *
 * @returns Promise that resolves to active program or null
 */
export async function getActiveProgram(): Promise<Program | null> {
  const program = await programRepo.getActiveProgram();
  if (!program) return null;

  return programRepo.getProgramWithDaysAndExercises(program.id);
}

/**
 * Get active program info with next day to perform
 *
 * @returns Promise that resolves to program info or null
 */
export async function getActiveProgramInfo(): Promise<{
  program: Program;
  nextDay: ProgramDay;
} | null> {
  const program = await getActiveProgram();
  if (!program) return null;

  const nextDay = await programRepo.getNextProgramDay(program.id);
  if (!nextDay) return null;

  return { program, nextDay };
}

// ============================================================================
// Program Day Management
// ============================================================================

/**
 * Add a new day to a program
 *
 * @param programId - Program ID
 * @param name - Day name (e.g., "Upper Body")
 * @returns Promise that resolves to the created day
 */
export async function addProgramDay(
  programId: string,
  name: string
): Promise<ProgramDay> {
  const now = Date.now();

  // Get existing days to determine next dayIndex
  const existingDays = await programRepo.getProgramDaysByProgramId(programId);
  const dayIndex = existingDays.length;

  const day: ProgramDay = {
    id: generateId(),
    programId,
    dayIndex,
    name,
    exercises: [],
    createdAt: now,
    updatedAt: now,
  };

  await programRepo.createProgramDay(day);

  return day;
}

/**
 * Update a program day (name only)
 *
 * @param dayId - Day ID
 * @param name - Updated name
 */
export async function updateProgramDayName(
  dayId: string,
  name: string
): Promise<void> {
  await programRepo.updateProgramDay(dayId, { name });
}

/**
 * Delete a program day
 * Updates current_day_index if needed
 *
 * @param programId - Program ID
 * @param dayId - Day ID
 */
export async function removeProgramDay(
  programId: string,
  dayId: string
): Promise<void> {
  // Get day being deleted
  const dayToDelete = await programRepo.getProgramDayById(dayId);
  if (!dayToDelete) return;

  // Delete the day
  await programRepo.deleteProgramDay(dayId);

  // Get remaining days
  const remainingDays = await programRepo.getProgramDaysByProgramId(programId);

  // Reorder remaining days to fill the gap
  for (let i = 0; i < remainingDays.length; i++) {
    if (remainingDays[i].dayIndex !== i) {
      await programRepo.updateProgramDay(remainingDays[i].id, { dayIndex: i });
    }
  }

  // Check if current_day_index is out of bounds
  const program = await programRepo.getProgramById(programId);
  if (program && program.currentDayIndex >= remainingDays.length) {
    await programRepo.updateProgram(programId, { currentDayIndex: 0 });
  }
}

/**
 * Reorder program days
 *
 * @param programId - Program ID
 * @param dayIds - Array of day IDs in new order
 */
export async function reorderProgramDays(
  programId: string,
  dayIds: string[]
): Promise<void> {
  // Update dayIndex for each day
  for (let i = 0; i < dayIds.length; i++) {
    await programRepo.updateProgramDay(dayIds[i], { dayIndex: i });
  }
}

// ============================================================================
// Program Day Exercise Management
// ============================================================================

/**
 * Add an exercise to a program day
 *
 * @param dayId - Program day ID
 * @param exerciseData - Exercise details
 * @returns Promise that resolves to the created exercise
 */
export async function addProgramDayExercise(
  dayId: string,
  exerciseData: {
    exerciseName: string;
    targetSets?: number;
    targetReps?: number;
    targetWeight?: number;
    sets?: Array<{ targetReps?: number; targetWeight?: number }>;
    restSeconds?: number;
    notes?: string;
  }
): Promise<ProgramDayExercise> {
  const now = Date.now();
  const exerciseId = generateId();

  // Get existing exercises to determine order
  const existingExercises = await programRepo.getProgramDayExercisesByDayId(dayId);
  const order = existingExercises.length;

  const exercise: ProgramDayExercise = {
    id: exerciseId,
    programDayId: dayId,
    exerciseName: exerciseData.exerciseName,
    order,
    targetSets: exerciseData.targetSets,
    targetReps: exerciseData.targetReps,
    targetWeight: exerciseData.targetWeight,
    restSeconds: exerciseData.restSeconds,
    notes: exerciseData.notes,
    createdAt: now,
    updatedAt: now,
  };

  await programRepo.createProgramDayExercise(exercise);

  // Create individual sets if provided
  if (exerciseData.sets && exerciseData.sets.length > 0) {
    const sets: ProgramDayExerciseSet[] = exerciseData.sets.map((setData, index) => ({
      id: generateId(),
      programDayExerciseId: exerciseId,
      setNumber: index + 1,
      targetReps: setData.targetReps,
      targetWeight: setData.targetWeight,
      createdAt: now,
      updatedAt: now,
    }));

    for (const set of sets) {
      await programRepo.createProgramDayExerciseSet(set);
    }

    exercise.sets = sets;
  }

  return exercise;
}

/**
 * Update a program day exercise
 *
 * @param exerciseId - Exercise ID
 * @param updates - Partial exercise data to update
 */
export async function updateProgramDayExercise(
  exerciseId: string,
  updates: Partial<Omit<ProgramDayExercise, 'id' | 'programDayId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const now = Date.now();

  // Handle sets update
  if (updates.sets !== undefined) {
    // Delete existing sets
    await programRepo.deleteProgramDayExerciseSets(exerciseId);

    // Create new sets if provided
    if (updates.sets && updates.sets.length > 0) {
      for (let i = 0; i < updates.sets.length; i++) {
        const setData = updates.sets[i];
        const set: ProgramDayExerciseSet = {
          id: setData.id || generateId(),
          programDayExerciseId: exerciseId,
          setNumber: i + 1,
          targetReps: setData.targetReps,
          targetWeight: setData.targetWeight,
          createdAt: setData.createdAt || now,
          updatedAt: now,
        };
        await programRepo.createProgramDayExerciseSet(set);
      }
    }

    // Remove sets from updates to avoid trying to update it in the exercise table
    const { sets, ...exerciseUpdates } = updates;
    await programRepo.updateProgramDayExercise(exerciseId, exerciseUpdates);
  } else {
    await programRepo.updateProgramDayExercise(exerciseId, updates);
  }
}

/**
 * Delete a program day exercise
 *
 * @param dayId - Program day ID
 * @param exerciseId - Exercise ID
 */
export async function removeProgramDayExercise(
  dayId: string,
  exerciseId: string
): Promise<void> {
  // Delete the exercise
  await programRepo.deleteProgramDayExercise(exerciseId);

  // Get remaining exercises
  const remainingExercises = await programRepo.getProgramDayExercisesByDayId(dayId);

  // Reorder remaining exercises to fill the gap
  for (let i = 0; i < remainingExercises.length; i++) {
    if (remainingExercises[i].order !== i) {
      await programRepo.updateProgramDayExercise(remainingExercises[i].id, { order: i });
    }
  }
}

/**
 * Reorder exercises within a program day
 *
 * @param exerciseIds - Array of exercise IDs in new order
 */
export async function reorderProgramDayExercises(
  exerciseIds: string[]
): Promise<void> {
  // Update order for each exercise
  for (let i = 0; i < exerciseIds.length; i++) {
    await programRepo.updateProgramDayExercise(exerciseIds[i], { order: i });
  }
}

// ============================================================================
// Program Execution
// ============================================================================

/**
 * Get program history
 *
 * @param programId - Program ID
 * @returns Promise that resolves to history entries
 */
export async function getProgramHistory(programId: string) {
  return programRepo.getProgramHistory(programId);
}
