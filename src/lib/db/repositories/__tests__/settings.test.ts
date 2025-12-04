/**
 * Unit tests for Settings Repository
 */

import { UserSettings } from '@/types';
import * as dbIndex from '../../index';
import * as idUtils from '../../../utils/id';
import { getSettings, updateSettings, resetSettings, deleteAllData } from '../settings';

// Mock dependencies
jest.mock('../../index');
jest.mock('../../../utils/id');

describe('Settings Repository', () => {
  const mockTimestamp = 1640000000000;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Date.now
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

    // Mock generateId
    (idUtils.generateId as jest.Mock).mockReturnValue('settings-id-123');

    // Create mock database
    mockDb = {
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
    };

    (dbIndex.getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getSettings', () => {
    it('should return existing settings', async () => {
      const mockSettingsRow = {
        id: 'settings-1',
        weight_unit: 'kg',
        default_rest_time: 120,
        enable_haptics: 1,
        enable_sync_reminders: 0,
        created_at: mockTimestamp - 1000,
        updated_at: mockTimestamp - 500,
      };

      mockDb.getAllAsync.mockResolvedValueOnce([mockSettingsRow]);

      const result = await getSettings();

      expect(result).toEqual({
        id: 'settings-1',
        weightUnit: 'kg',
        defaultRestTime: 120,
        enableHaptics: true,
        enableSyncReminders: false,
        createdAt: mockTimestamp - 1000,
        updatedAt: mockTimestamp - 500,
      });
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM user_settings LIMIT 1'
      );
    });

    it('should create default settings if none exist', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      mockDb.runAsync.mockResolvedValueOnce({ lastInsertRowId: 1, changes: 1 });

      const result = await getSettings();

      expect(result).toEqual({
        id: 'settings-id-123',
        weightUnit: 'lbs',
        defaultRestTime: 90,
        enableHaptics: true,
        enableSyncReminders: true,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      });

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_settings'),
        [
          'settings-id-123',
          'lbs',
          90,
          1,
          1,
          mockTimestamp,
          mockTimestamp,
        ]
      );
    });

    it('should convert database booleans correctly', async () => {
      const mockSettingsRow = {
        id: 'settings-1',
        weight_unit: 'lbs',
        default_rest_time: 90,
        enable_haptics: 0,
        enable_sync_reminders: 1,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      };

      mockDb.getAllAsync.mockResolvedValueOnce([mockSettingsRow]);

      const result = await getSettings();

      expect(result.enableHaptics).toBe(false);
      expect(result.enableSyncReminders).toBe(true);
    });
  });

  describe('updateSettings', () => {
    const existingSettings: UserSettings = {
      id: 'settings-1',
      weightUnit: 'lbs',
      defaultRestTime: 90,
      enableHaptics: true,
      enableSyncReminders: true,
      createdAt: mockTimestamp - 10000,
      updatedAt: mockTimestamp - 5000,
    };

    beforeEach(() => {
      // Mock getSettings to return existing settings
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 'settings-1',
          weight_unit: 'lbs',
          default_rest_time: 90,
          enable_haptics: 1,
          enable_sync_reminders: 1,
          created_at: mockTimestamp - 10000,
          updated_at: mockTimestamp - 5000,
        },
      ]);
      mockDb.runAsync.mockResolvedValueOnce({ lastInsertRowId: 0, changes: 1 });
    });

    it('should update weight unit', async () => {
      const result = await updateSettings({ weightUnit: 'kg' });

      expect(result).toMatchObject({
        weightUnit: 'kg',
        updatedAt: mockTimestamp,
      });
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_settings SET'),
        ['kg', 90, 1, 1, mockTimestamp, 'settings-1']
      );
    });

    it('should update default rest time', async () => {
      const result = await updateSettings({ defaultRestTime: 120 });

      expect(result).toMatchObject({
        defaultRestTime: 120,
        updatedAt: mockTimestamp,
      });
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_settings SET'),
        ['lbs', 120, 1, 1, mockTimestamp, 'settings-1']
      );
    });

    it('should update haptics setting', async () => {
      const result = await updateSettings({ enableHaptics: false });

      expect(result).toMatchObject({
        enableHaptics: false,
        updatedAt: mockTimestamp,
      });
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_settings SET'),
        ['lbs', 90, 0, 1, mockTimestamp, 'settings-1']
      );
    });

    it('should update sync reminders setting', async () => {
      const result = await updateSettings({ enableSyncReminders: false });

      expect(result).toMatchObject({
        enableSyncReminders: false,
        updatedAt: mockTimestamp,
      });
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_settings SET'),
        ['lbs', 90, 1, 0, mockTimestamp, 'settings-1']
      );
    });

    it('should update multiple settings at once', async () => {
      const result = await updateSettings({
        weightUnit: 'kg',
        defaultRestTime: 120,
        enableHaptics: false,
      });

      expect(result).toMatchObject({
        weightUnit: 'kg',
        defaultRestTime: 120,
        enableHaptics: false,
        updatedAt: mockTimestamp,
      });
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_settings SET'),
        ['kg', 120, 0, 1, mockTimestamp, 'settings-1']
      );
    });

    it('should preserve unchanged settings', async () => {
      const result = await updateSettings({ weightUnit: 'kg' });

      expect(result).toMatchObject({
        weightUnit: 'kg',
        defaultRestTime: 90, // Unchanged
        enableHaptics: true, // Unchanged
        enableSyncReminders: true, // Unchanged
      });
    });

    it('should update updatedAt timestamp', async () => {
      const result = await updateSettings({ weightUnit: 'kg' });

      expect(result.updatedAt).toBe(mockTimestamp);
    });

    it('should not change createdAt timestamp', async () => {
      const result = await updateSettings({ weightUnit: 'kg' });

      expect(result.createdAt).toBe(mockTimestamp - 10000);
    });
  });

  describe('resetSettings', () => {
    it('should reset settings to defaults', async () => {
      const existingSettings = {
        id: 'settings-1',
        weight_unit: 'kg',
        default_rest_time: 120,
        enable_haptics: 0,
        enable_sync_reminders: 0,
        created_at: mockTimestamp - 10000,
        updated_at: mockTimestamp - 5000,
      };

      mockDb.getAllAsync.mockResolvedValueOnce([existingSettings]);
      mockDb.runAsync.mockResolvedValueOnce({ lastInsertRowId: 0, changes: 1 });

      const result = await resetSettings();

      expect(result).toMatchObject({
        weightUnit: 'lbs',
        defaultRestTime: 90,
        enableHaptics: true,
        enableSyncReminders: true,
      });
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_settings SET'),
        ['lbs', 90, 1, 1, mockTimestamp, 'settings-1']
      );
    });
  });

  describe('deleteAllData', () => {
    it('should delete all workout data and reset settings', async () => {
      mockDb.execAsync.mockResolvedValueOnce(undefined);

      // Mock getSettings for resetSettings call
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 'settings-1',
          weight_unit: 'kg',
          default_rest_time: 120,
          enable_haptics: 1,
          enable_sync_reminders: 1,
          created_at: mockTimestamp - 10000,
          updated_at: mockTimestamp - 5000,
        },
      ]);
      mockDb.runAsync.mockResolvedValueOnce({ lastInsertRowId: 0, changes: 1 });

      await deleteAllData();

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM workout_sets')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM exercises')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM workout_sessions')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM exercise_templates')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM workout_templates')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM pr_records')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM program_day_exercises')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM program_days')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM program_history')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM programs')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM sync_queue')
      );

      // Should reset settings to defaults
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_settings SET'),
        ['lbs', 90, 1, 1, mockTimestamp, 'settings-1']
      );
    });

    it('should use transaction for deletion', async () => {
      mockDb.execAsync.mockResolvedValueOnce(undefined);
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 'settings-1',
          weight_unit: 'lbs',
          default_rest_time: 90,
          enable_haptics: 1,
          enable_sync_reminders: 1,
          created_at: mockTimestamp,
          updated_at: mockTimestamp,
        },
      ]);
      mockDb.runAsync.mockResolvedValueOnce({ lastInsertRowId: 0, changes: 1 });

      await deleteAllData();

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('BEGIN TRANSACTION')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('COMMIT')
      );
    });
  });
});
