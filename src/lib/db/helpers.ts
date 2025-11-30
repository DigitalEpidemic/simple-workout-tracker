/**
 * Database helper utilities
 *
 * Provides typed helper functions for common database operations.
 * These helpers wrap the raw SQLite API with more convenient interfaces.
 */

import * as SQLite from 'expo-sqlite';
import { getDatabase } from './index';

/**
 * Execute a SELECT query and return all matching rows
 *
 * @param sql - SQL SELECT query
 * @param params - Query parameters
 * @returns Promise that resolves to array of rows
 *
 * @example
 * const templates = await query<WorkoutTemplate>(
 *   'SELECT * FROM workout_templates WHERE id = ?',
 *   [templateId]
 * );
 */
export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<T>(sql, params ?? []);
  return result;
}

/**
 * Execute an INSERT, UPDATE, or DELETE statement
 *
 * @param sql - SQL statement
 * @param params - Statement parameters
 * @returns Promise that resolves to the run result with lastInsertRowId and changes
 *
 * @example
 * const result = await execute(
 *   'INSERT INTO workout_templates (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
 *   [id, name, now, now]
 * );
 * console.log('Inserted row ID:', result.lastInsertRowId);
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<SQLite.SQLiteRunResult> {
  const db = await getDatabase();
  const result = await db.runAsync(sql, params ?? []);
  return result;
}

/**
 * Execute a SELECT query and return the first matching row
 *
 * @param sql - SQL SELECT query
 * @param params - Query parameters
 * @returns Promise that resolves to the first row or null if no matches
 *
 * @example
 * const template = await getOne<WorkoutTemplate>(
 *   'SELECT * FROM workout_templates WHERE id = ?',
 *   [templateId]
 * );
 * if (template) {
 *   console.log('Found template:', template.name);
 * }
 */
export async function getOne<T>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<T>(sql, params ?? []);
  return result ?? null;
}

/**
 * Execute a SELECT query and return all matching rows
 *
 * Alias for query() - use whichever name you prefer for clarity.
 *
 * @param sql - SQL SELECT query
 * @param params - Query parameters
 * @returns Promise that resolves to array of rows
 *
 * @example
 * const templates = await getAll<WorkoutTemplate>(
 *   'SELECT * FROM workout_templates ORDER BY last_used DESC'
 * );
 */
export async function getAll<T>(sql: string, params?: any[]): Promise<T[]> {
  return query<T>(sql, params);
}

/**
 * Execute multiple SQL statements in a transaction
 *
 * If any statement fails, the entire transaction is rolled back.
 *
 * @param statements - Array of SQL statements to execute
 * @returns Promise that resolves when transaction is complete
 *
 * @example
 * await transaction([
 *   { sql: 'INSERT INTO ...', params: [...] },
 *   { sql: 'UPDATE ...', params: [...] },
 *   { sql: 'DELETE ...', params: [...] }
 * ]);
 */
export async function transaction(
  statements: Array<{ sql: string; params?: any[] }>
): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (const { sql, params } of statements) {
      await db.runAsync(sql, params ?? []);
    }
  });
}
