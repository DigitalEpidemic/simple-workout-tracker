/**
 * Core TypeScript interfaces for the workout tracking application
 *
 * @note Weight values (targetWeight, weight) are stored as numeric values without units.
 *       UI currently displays all weights in lbs until Phase 4.6 implements user settings.
 */

/**
 * Base exercise definition in a workout template
 */
export interface ExerciseTemplate {
  id: string;
  workoutTemplateId: string;
  name: string;
  order: number; // Position in the workout template
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  notes?: string;
  createdAt: number; // Unix timestamp
  updatedAt: number;
}

/**
 * Workout template - reusable workout plan
 */
export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: ExerciseTemplate[];
  createdAt: number;
  updatedAt: number;
  lastUsed?: number; // Unix timestamp of last workout session
}

/**
 * Individual set performed during a workout
 */
export interface WorkoutSet {
  id: string;
  exerciseId: string; // References Exercise.id in active session
  workoutSessionId: string;
  setNumber: number; // 1, 2, 3, etc.
  reps: number;
  weight: number; // in kg or lbs (determined by user settings)
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

/**
 * Exercise instance in an active or completed workout session
 */
export interface Exercise {
  id: string;
  workoutSessionId: string;
  name: string;
  order: number; // Position in the workout (can be reordered mid-workout)
  sets: WorkoutSet[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Active or completed workout session
 */
export interface WorkoutSession {
  id: string;
  templateId?: string; // Optional - can start workout without template
  templateName?: string; // Snapshot of template name at session creation
  name: string;
  exercises: Exercise[];
  startTime: number; // Unix timestamp - set when "Begin Workout" is pressed on Start Workout Flow screen
  endTime?: number; // Unix timestamp - set when "Finish Workout" is pressed - undefined if in progress
  duration?: number; // Total duration in seconds calculated from (endTime - startTime). Rest time is NOT excluded - this is total elapsed time.
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Personal Record for a specific exercise at a specific rep range
 */
export interface PRRecord {
  id: string;
  exerciseName: string; // Exercise name (normalized)
  reps: number; // Any positive integer (no longer limited to 1-12)
  weight: number;
  workoutSessionId: string;
  achievedAt: number; // Unix timestamp
  createdAt: number;
}

/**
 * Sync queue item for offline-first Firebase sync
 */
export interface SyncQueueItem {
  id: string;
  entityType: 'workout_template' | 'workout_session' | 'exercise' | 'set' | 'pr_record';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: any; // The actual data to sync
  createdAt: number;
  synced: boolean;
  syncedAt?: number;
  retryCount: number;
  lastError?: string;
}

/**
 * User settings/preferences
 */
export interface UserSettings {
  id: string;
  weightUnit: 'kg' | 'lbs';
  defaultRestTime: number; // seconds
  enableHaptics: boolean;
  enableSyncReminders: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Analytics data point for volume tracking
 */
export interface VolumeDataPoint {
  date: number; // Unix timestamp (day)
  exerciseName?: string; // If per-exercise, otherwise total
  totalVolume: number; // sum of (reps * weight)
  totalSets: number;
  totalReps: number;
}
