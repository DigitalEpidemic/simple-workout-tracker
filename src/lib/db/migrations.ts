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
export const CURRENT_DB_VERSION = 1;

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
 * All migrations in order
 * Add new migrations to this array as needed
 */
const migrations: Migration[] = [
  migration1,
  // Future migrations go here:
  // migration2,
  // migration3,
  // etc.
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
