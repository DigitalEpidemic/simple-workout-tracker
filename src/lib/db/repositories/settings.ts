/**
 * Settings Repository
 *
 * Database operations for user settings and preferences.
 * Settings are stored as a single row in the user_settings table.
 */

import { UserSettings } from '@/types';
import { getDatabase } from '../index';
import { generateId } from '../../utils/id';

/**
 * Database row type for user_settings table
 */
interface SettingsRow {
  id: string;
  weight_unit: string;
  default_rest_time: number;
  enable_haptics: number;
  enable_sync_reminders: number;
  created_at: number;
  updated_at: number;
}

/**
 * Convert database row to UserSettings interface
 */
function mapRowToSettings(row: SettingsRow): UserSettings {
  return {
    id: row.id,
    weightUnit: row.weight_unit as 'kg' | 'lbs',
    defaultRestTime: row.default_rest_time,
    enableHaptics: row.enable_haptics === 1,
    enableSyncReminders: row.enable_sync_reminders === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Default settings values
 */
const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  weightUnit: 'lbs',
  defaultRestTime: 90,
  enableHaptics: true,
  enableSyncReminders: true,
};

/**
 * Get user settings
 *
 * Returns the current settings, or creates default settings if none exist.
 *
 * @returns Promise resolving to UserSettings
 */
export async function getSettings(): Promise<UserSettings> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<SettingsRow>(
    'SELECT * FROM user_settings LIMIT 1'
  );

  if (rows.length > 0) {
    return mapRowToSettings(rows[0]);
  }

  // No settings exist - create default settings
  const now = Date.now();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO user_settings (
      id,
      weight_unit,
      default_rest_time,
      enable_haptics,
      enable_sync_reminders,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      DEFAULT_SETTINGS.weightUnit,
      DEFAULT_SETTINGS.defaultRestTime,
      DEFAULT_SETTINGS.enableHaptics ? 1 : 0,
      DEFAULT_SETTINGS.enableSyncReminders ? 1 : 0,
      now,
      now,
    ]
  );

  return {
    id,
    ...DEFAULT_SETTINGS,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update user settings
 *
 * @param updates - Partial settings to update
 * @returns Promise resolving to updated UserSettings
 */
export async function updateSettings(
  updates: Partial<Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<UserSettings> {
  const db = await getDatabase();
  const currentSettings = await getSettings();
  const now = Date.now();

  const updatedSettings: UserSettings = {
    ...currentSettings,
    ...updates,
    updatedAt: now,
  };

  await db.runAsync(
    `UPDATE user_settings SET
      weight_unit = ?,
      default_rest_time = ?,
      enable_haptics = ?,
      enable_sync_reminders = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      updatedSettings.weightUnit,
      updatedSettings.defaultRestTime,
      updatedSettings.enableHaptics ? 1 : 0,
      updatedSettings.enableSyncReminders ? 1 : 0,
      now,
      currentSettings.id,
    ]
  );

  return updatedSettings;
}

/**
 * Reset settings to defaults
 *
 * @returns Promise resolving to default UserSettings
 */
export async function resetSettings(): Promise<UserSettings> {
  return updateSettings(DEFAULT_SETTINGS);
}

/**
 * Delete all user data (DANGEROUS - use with caution)
 *
 * This will delete:
 * - All workout sessions
 * - All workout templates
 * - All exercises and sets
 * - All PR records
 * - All programs and program days
 * - Settings will be reset to defaults
 *
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteAllData(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    BEGIN TRANSACTION;

    DELETE FROM workout_sets;
    DELETE FROM exercises;
    DELETE FROM workout_sessions;
    DELETE FROM exercise_templates;
    DELETE FROM workout_templates;
    DELETE FROM pr_records;
    DELETE FROM program_day_exercises;
    DELETE FROM program_days;
    DELETE FROM program_history;
    DELETE FROM programs;
    DELETE FROM sync_queue;

    COMMIT;
  `);

  // Reset settings to defaults
  await resetSettings();
}
