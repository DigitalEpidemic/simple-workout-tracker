/**
 * Database initialization and connection
 *
 * Provides a singleton database instance and initialization logic.
 * The database is automatically initialized on first access.
 */

import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

/**
 * Database name
 */
const DB_NAME = 'workout_tracker.db';

/**
 * Singleton database instance
 */
let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Flag to track if database has been initialized
 */
let isInitialized = false;

/**
 * Flag to prevent multiple simultaneous initialization attempts
 */
let initializationPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Initialize the database
 *
 * - Opens the database connection
 * - Runs all pending migrations
 * - Sets up foreign key constraints
 *
 * This function is idempotent and safe to call multiple times.
 *
 * @returns Promise that resolves to the database instance
 */
async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  // If already initialized, return the instance
  if (isInitialized && dbInstance) {
    return dbInstance;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      console.log('Initializing database...');

      // Open database connection
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      dbInstance = db;

      // Enable foreign key constraints
      await db.execAsync('PRAGMA foreign_keys = ON;');

      // Run migrations to bring database to current version
      await runMigrations(db);

      isInitialized = true;
      console.log('Database initialized successfully');

      return db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Reset state on failure so initialization can be retried
      isInitialized = false;
      dbInstance = null;
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Get the database instance
 *
 * Automatically initializes the database on first access.
 * Subsequent calls return the same instance.
 *
 * @returns Promise that resolves to the database instance
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  return initializeDatabase();
}

/**
 * Close the database connection
 *
 * This should typically only be called when the app is shutting down.
 * After calling this, getDatabase() will reinitialize the connection.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    try {
      await dbInstance.closeAsync();
      console.log('Database closed');
    } catch (error) {
      console.error('Error closing database:', error);
    } finally {
      dbInstance = null;
      isInitialized = false;
      initializationPromise = null;
    }
  }
}

/**
 * Execute a raw SQL query
 *
 * For most operations, prefer using typed service functions instead.
 * This is provided for advanced use cases and debugging.
 *
 * @param sql - SQL query to execute
 * @param params - Query parameters
 * @returns Promise that resolves to query results
 */
export async function executeQuery<T>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<T>(sql, params ?? []);
  return result;
}

/**
 * Execute a raw SQL statement (INSERT, UPDATE, DELETE)
 *
 * For most operations, prefer using typed service functions instead.
 * This is provided for advanced use cases and debugging.
 *
 * @param sql - SQL statement to execute
 * @param params - Statement parameters
 * @returns Promise that resolves to the run result
 */
export async function executeStatement(
  sql: string,
  params?: any[]
): Promise<SQLite.SQLiteRunResult> {
  const db = await getDatabase();
  const result = await db.runAsync(sql, params ?? []);
  return result;
}

/**
 * Check if database is initialized
 *
 * @returns true if database has been initialized
 */
export function isDatabaseInitialized(): boolean {
  return isInitialized;
}
