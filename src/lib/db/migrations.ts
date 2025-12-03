/**
 * Database migration system
 *
 * Handles versioned database migrations for schema changes.
 * Each migration is numbered and runs in order to bring the database
 * from one version to the next.
 */

import * as SQLite from 'expo-sqlite';
import { ALL_TABLES, ALL_INDEXES } from './schema';

/**
 * Current database version
 * Increment this when adding new migrations
 */
export const CURRENT_DB_VERSION = 4;

/**
 * Migration function type
 */
type Migration = (db: SQLite.SQLiteDatabase) => Promise<void>;

/**
 * Migration 1: Initial schema
 * Creates all tables and indexes for the first time
 */
const migration1: Migration = async (db: SQLite.SQLiteDatabase) => {
  console.log('Running migration 1: Initial schema');

  // Create all tables
  for (const createTableSQL of ALL_TABLES) {
    await db.execAsync(createTableSQL);
  }

  // Create all indexes
  for (const createIndexSQL of ALL_INDEXES) {
    await db.execAsync(createIndexSQL);
  }

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  console.log('Migration 1 complete');
};

/**
 * Migration 2: Add program tables
 * Creates tables for multi-day training programs
 */
const migration2: Migration = async (db: SQLite.SQLiteDatabase) => {
  console.log('Running migration 2: Add program tables');

  // Create programs table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 0,
      current_day_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Create program_days table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS program_days (
      id TEXT PRIMARY KEY NOT NULL,
      program_id TEXT NOT NULL,
      day_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );
  `);

  // Create program_day_exercises table
  await db.execAsync(`
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
  `);

  // Create program_history table
  await db.execAsync(`
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
  `);

  // Add indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_program_days_program_id
    ON program_days(program_id, day_index);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_program_day_exercises_program_day_id
    ON program_day_exercises(program_day_id);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_program_history_program_id
    ON program_history(program_id, performed_at DESC);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_program_history_workout_session_id
    ON program_history(workout_session_id);
  `);

  // Add program fields to workout_sessions table
  await db.execAsync(`
    ALTER TABLE workout_sessions ADD COLUMN program_id TEXT;
  `);

  await db.execAsync(`
    ALTER TABLE workout_sessions ADD COLUMN program_day_id TEXT;
  `);

  await db.execAsync(`
    ALTER TABLE workout_sessions ADD COLUMN program_day_name TEXT;
  `);

  console.log('Migration 2 complete');
};

/**
 * Migration 3: Add program day exercise sets table
 * Allows individual set configurations for program exercises
 */
const migration3: Migration = async (db: SQLite.SQLiteDatabase) => {
  console.log('Running migration 3: Add program day exercise sets table');

  // Create program_day_exercise_sets table
  await db.execAsync(`
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
  `);

  // Add index for program_day_exercise_sets
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_program_day_exercise_sets_program_day_exercise_id
    ON program_day_exercise_sets(program_day_exercise_id);
  `);

  console.log('Migration 3 complete');
};

/**
 * Migration 4: Add total workouts completed tracking to programs
 * Tracks the total number of workouts completed in the program
 */
const migration4: Migration = async (db: SQLite.SQLiteDatabase) => {
  console.log('Running migration 4: Add total_workouts_completed to programs');

  // Add total_workouts_completed column to programs table
  await db.execAsync(`
    ALTER TABLE programs ADD COLUMN total_workouts_completed INTEGER NOT NULL DEFAULT 0;
  `);

  console.log('Migration 4 complete');
};

/**
 * All migrations in order
 * Add new migrations to this array as needed
 */
const migrations: Migration[] = [
  migration1,
  migration2,
  migration3,
  migration4,
];

/**
 * Get current database version
 */
async function getDatabaseVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version;'
    );
    return result?.user_version ?? 0;
  } catch (error) {
    console.error('Error getting database version:', error);
    return 0;
  }
}

/**
 * Set database version
 */
async function setDatabaseVersion(
  db: SQLite.SQLiteDatabase,
  version: number
): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version};`);
}

/**
 * Run all pending migrations
 *
 * @param db - SQLite database instance
 * @returns Promise that resolves when all migrations are complete
 */
export async function runMigrations(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const currentVersion = await getDatabaseVersion(db);

  console.log(`Current database version: ${currentVersion}`);
  console.log(`Target database version: ${CURRENT_DB_VERSION}`);

  if (currentVersion >= CURRENT_DB_VERSION) {
    console.log('Database is up to date');
    return;
  }

  // Run migrations in order, starting from the version after currentVersion
  for (let i = currentVersion; i < CURRENT_DB_VERSION; i++) {
    const migrationNumber = i + 1;
    const migration = migrations[i];

    if (!migration) {
      throw new Error(`Migration ${migrationNumber} not found`);
    }

    console.log(`Running migration ${migrationNumber}...`);

    try {
      await migration(db);
      await setDatabaseVersion(db, migrationNumber);
      console.log(`Migration ${migrationNumber} completed successfully`);
    } catch (error) {
      console.error(`Migration ${migrationNumber} failed:`, error);
      throw new Error(
        `Failed to run migration ${migrationNumber}: ${error}`
      );
    }
  }

  console.log('All migrations completed successfully');
}

/**
 * Reset database (for development/testing)
 * WARNING: This will delete all data!
 */
export async function resetDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  console.warn('RESETTING DATABASE - ALL DATA WILL BE LOST');

  // Drop all tables in reverse order (to handle foreign key constraints)
  const tables = [
    'sync_queue',
    'user_settings',
    'program_history',
    'program_day_exercise_sets',
    'program_day_exercises',
    'program_days',
    'programs',
    'pr_records',
    'workout_sets',
    'exercises',
    'workout_sessions',
    'exercise_templates',
    'workout_templates',
  ];

  for (const table of tables) {
    await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
  }

  // Reset version to 0
  await setDatabaseVersion(db, 0);

  console.log('Database reset complete');
}
