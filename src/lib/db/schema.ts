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
 * Programs table
 * Stores multi-day training programs
 */
export const CREATE_PROGRAMS_TABLE = `
  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 0,
    current_day_index INTEGER NOT NULL DEFAULT 0,
    total_workouts_completed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

/**
 * Program days table
 * Stores individual days within a program
 */
export const CREATE_PROGRAM_DAYS_TABLE = `
  CREATE TABLE IF NOT EXISTS program_days (
    id TEXT PRIMARY KEY NOT NULL,
    program_id TEXT NOT NULL,
    day_index INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
  );
`;

/**
 * Program day exercises table
 * Stores exercises for each program day
 */
export const CREATE_PROGRAM_DAY_EXERCISES_TABLE = `
  CREATE TABLE IF NOT EXISTS program_day_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    program_day_id TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    target_sets INTEGER,
    target_reps INTEGER,
    target_weight REAL,
    rest_seconds INTEGER,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE CASCADE
  );
`;

/**
 * Program day exercise sets table
 * Stores individual set configurations for program day exercises
 */
export const CREATE_PROGRAM_DAY_EXERCISE_SETS_TABLE = `
  CREATE TABLE IF NOT EXISTS program_day_exercise_sets (
    id TEXT PRIMARY KEY NOT NULL,
    program_day_exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    target_reps INTEGER,
    target_weight REAL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (program_day_exercise_id) REFERENCES program_day_exercises(id) ON DELETE CASCADE
  );
`;

/**
 * Program history table
 * Tracks which program day was performed and when
 */
export const CREATE_PROGRAM_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS program_history (
    id TEXT PRIMARY KEY NOT NULL,
    program_id TEXT NOT NULL,
    program_day_id TEXT NOT NULL,
    workout_session_id TEXT NOT NULL,
    performed_at INTEGER NOT NULL,
    duration_seconds INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
  );
`;

// Index for program_days by program_id and day_index
export const CREATE_PROGRAM_DAYS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_program_days_program_id
  ON program_days(program_id, day_index);
`;

// Index for program_day_exercises by program_day_id
export const CREATE_PROGRAM_DAY_EXERCISES_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_program_day_exercises_program_day_id
  ON program_day_exercises(program_day_id);
`;

// Index for program_day_exercise_sets by program_day_exercise_id
export const CREATE_PROGRAM_DAY_EXERCISE_SETS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_program_day_exercise_sets_program_day_exercise_id
  ON program_day_exercise_sets(program_day_exercise_id);
`;

// Index for program_history by program_id and performed_at
export const CREATE_PROGRAM_HISTORY_PROGRAM_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_program_history_program_id
  ON program_history(program_id, performed_at DESC);
`;

// Index for program_history by workout_session_id
export const CREATE_PROGRAM_HISTORY_SESSION_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_program_history_workout_session_id
  ON program_history(workout_session_id);
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
