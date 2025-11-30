/**
 * SQLite database schema definitions
 *
 * All CREATE TABLE statements for the workout tracking application.
 * Tables are designed for offline-first operation with SQLite.
 */

/**
 * Workout templates table
 * Stores reusable workout plans
 */
export const CREATE_WORKOUT_TEMPLATES_TABLE = `
  CREATE TABLE IF NOT EXISTS workout_templates (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_used INTEGER
  );
`;

/**
 * Exercise templates table
 * Stores exercises within workout templates
 */
export const CREATE_EXERCISE_TEMPLATES_TABLE = `
  CREATE TABLE IF NOT EXISTS exercise_templates (
    id TEXT PRIMARY KEY NOT NULL,
    workout_template_id TEXT NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    target_sets INTEGER,
    target_reps INTEGER,
    target_weight REAL,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (workout_template_id) REFERENCES workout_templates(id) ON DELETE CASCADE
  );
`;

/**
 * Workout sessions table
 * Stores active and completed workout sessions
 */
export const CREATE_WORKOUT_SESSIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    template_id TEXT,
    template_name TEXT,
    name TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    duration INTEGER,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL
  );
`;

/**
 * Exercises table
 * Stores exercise instances in workout sessions
 */
export const CREATE_EXERCISES_TABLE = `
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY NOT NULL,
    workout_session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
  );
`;

/**
 * Workout sets table
 * Stores individual sets performed during workouts
 */
export const CREATE_WORKOUT_SETS_TABLE = `
  CREATE TABLE IF NOT EXISTS workout_sets (
    id TEXT PRIMARY KEY NOT NULL,
    exercise_id TEXT NOT NULL,
    workout_session_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight REAL NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
  );
`;

/**
 * Personal records table
 * Stores PR records for exercises at specific rep ranges
 */
export const CREATE_PR_RECORDS_TABLE = `
  CREATE TABLE IF NOT EXISTS pr_records (
    id TEXT PRIMARY KEY NOT NULL,
    exercise_name TEXT NOT NULL,
    reps INTEGER NOT NULL,
    weight REAL NOT NULL,
    workout_session_id TEXT NOT NULL,
    achieved_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
  );
`;

/**
 * User settings table
 * Stores app preferences and user settings
 */
export const CREATE_USER_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY NOT NULL,
    weight_unit TEXT NOT NULL DEFAULT 'kg',
    default_rest_time INTEGER NOT NULL DEFAULT 90,
    enable_haptics INTEGER NOT NULL DEFAULT 1,
    enable_sync_reminders INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

/**
 * Sync queue table
 * Stores pending sync operations for offline-first Firebase sync
 */
export const CREATE_SYNC_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0,
    synced_at INTEGER,
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  );
`;

/**
 * Indexes for performance optimization
 */

// Index for looking up exercise templates by workout template
export const CREATE_EXERCISE_TEMPLATES_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_exercise_templates_workout_template_id
  ON exercise_templates(workout_template_id);
`;

// Index for looking up exercises by workout session
export const CREATE_EXERCISES_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_exercises_workout_session_id
  ON exercises(workout_session_id);
`;

// Index for looking up sets by exercise
export const CREATE_WORKOUT_SETS_EXERCISE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id
  ON workout_sets(exercise_id);
`;

// Index for looking up sets by workout session
export const CREATE_WORKOUT_SETS_SESSION_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_session_id
  ON workout_sets(workout_session_id);
`;

// Index for PR lookups by exercise name and reps
export const CREATE_PR_RECORDS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_pr_records_exercise_reps
  ON pr_records(exercise_name, reps);
`;

// Index for workout sessions by date (for history queries)
export const CREATE_WORKOUT_SESSIONS_DATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_workout_sessions_start_time
  ON workout_sessions(start_time DESC);
`;

// Index for unsynced items in sync queue
export const CREATE_SYNC_QUEUE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_sync_queue_synced
  ON sync_queue(synced, created_at);
`;

/**
 * All table creation statements in order
 */
export const ALL_TABLES = [
  CREATE_WORKOUT_TEMPLATES_TABLE,
  CREATE_EXERCISE_TEMPLATES_TABLE,
  CREATE_WORKOUT_SESSIONS_TABLE,
  CREATE_EXERCISES_TABLE,
  CREATE_WORKOUT_SETS_TABLE,
  CREATE_PR_RECORDS_TABLE,
  CREATE_USER_SETTINGS_TABLE,
  CREATE_SYNC_QUEUE_TABLE,
];

/**
 * All index creation statements
 */
export const ALL_INDEXES = [
  CREATE_EXERCISE_TEMPLATES_INDEX,
  CREATE_EXERCISES_INDEX,
  CREATE_WORKOUT_SETS_EXERCISE_INDEX,
  CREATE_WORKOUT_SETS_SESSION_INDEX,
  CREATE_PR_RECORDS_INDEX,
  CREATE_WORKOUT_SESSIONS_DATE_INDEX,
  CREATE_SYNC_QUEUE_INDEX,
];
