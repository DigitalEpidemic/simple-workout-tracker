/**
 * Unit tests for Sets Repository
 */

import { WorkoutSet } from '@/types';
import * as helpers from '../../helpers';
import {
  getAllSetsBySessionId,
  getAllSetsByExerciseId,
  getSetById,
  createSet,
  updateSet,
  completeSet,
  uncompleteSet,
  deleteSet,
  deleteSetsByExerciseId,
  deleteSetsBySessionId,
  createMultipleSets,
  getRecentSetsByExerciseName,
  getLastWorkoutSetsByExerciseName,
  getTotalVolumeBySessionId,
  getTotalVolumeByExerciseId,
  countCompletedSetsBySessionId,
  countTotalSetsBySessionId,
  getExerciseHistory,
  getSetsByExerciseAndSession,
} from '../sets';

// Mock the database helpers
jest.mock('../../helpers');

describe('Sets Repository', () => {
  const mockTimestamp = 1640000000000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSetsBySessionId', () => {
    const mockSetRows = [
      {
        id: 'set-1',
        exercise_id: 'exercise-1',
        workout_session_id: 'session-1',
        set_number: 1,
        reps: 10,
        weight: 185,
        completed: 1,
        created_at: mockTimestamp,
        completed_at: mockTimestamp + 1000,
      },
      {
        id: 'set-2',
        exercise_id: 'exercise-1',
        workout_session_id: 'session-1',
        set_number: 2,
        reps: 8,
        weight: 185,
        completed: 0,
        created_at: mockTimestamp,
        completed_at: null,
      },
    ];

    it('should return all sets for a session', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockSetRows);

      const result = await getAllSetsBySessionId('session-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'set-1',
        exerciseId: 'exercise-1',
        workoutSessionId: 'session-1',
        setNumber: 1,
        reps: 10,
        weight: 185,
        completed: true,
        completedAt: mockTimestamp + 1000,
      });
      expect(result[1]).toMatchObject({
        id: 'set-2',
        completed: false,
        completedAt: undefined,
      });
      expect(helpers.query).toHaveBeenCalledWith(
        'SELECT * FROM workout_sets WHERE workout_session_id = ? ORDER BY set_number ASC',
        ['session-1']
      );
    });

    it('should return empty array when no sets exist', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);

      const result = await getAllSetsBySessionId('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAllSetsByExerciseId', () => {
    const mockSetRows = [
      {
        id: 'set-1',
        exercise_id: 'exercise-1',
        workout_session_id: 'session-1',
        set_number: 1,
        reps: 10,
        weight: 185,
        completed: 1,
        created_at: mockTimestamp,
        completed_at: mockTimestamp + 1000,
      },
    ];

    it('should return all sets for an exercise', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockSetRows);

      const result = await getAllSetsByExerciseId('exercise-1');

      expect(result).toHaveLength(1);
      expect(result[0].exerciseId).toBe('exercise-1');
      expect(helpers.query).toHaveBeenCalledWith(
        'SELECT * FROM workout_sets WHERE exercise_id = ? ORDER BY set_number ASC',
        ['exercise-1']
      );
    });
  });

  describe('getSetById', () => {
    const mockSetRow = {
      id: 'set-1',
      exercise_id: 'exercise-1',
      workout_session_id: 'session-1',
      set_number: 1,
      reps: 10,
      weight: 185,
      completed: 1,
      created_at: mockTimestamp,
      completed_at: mockTimestamp + 1000,
    };

    it('should return set by id', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockSetRow);

      const result = await getSetById('set-1');

      expect(result).toMatchObject({
        id: 'set-1',
        exerciseId: 'exercise-1',
        completed: true,
      });
    });

    it('should return null when set not found', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await getSetById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('createSet', () => {
    it('should create a new set', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 1,
        changes: 1,
      });

      const set: WorkoutSet = {
        id: 'set-1',
        exerciseId: 'exercise-1',
        workoutSessionId: 'session-1',
        setNumber: 1,
        reps: 10,
        weight: 185,
        completed: true,
        createdAt: mockTimestamp,
        completedAt: mockTimestamp + 1000,
      };

      await createSet(set);

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workout_sets'),
        [
          'set-1',
          'exercise-1',
          'session-1',
          1,
          10,
          185,
          1,
          mockTimestamp,
          mockTimestamp + 1000,
        ]
      );
    });

    it('should handle incomplete set without completedAt', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 1,
        changes: 1,
      });

      const set: WorkoutSet = {
        id: 'set-1',
        exerciseId: 'exercise-1',
        workoutSessionId: 'session-1',
        setNumber: 1,
        reps: 10,
        weight: 185,
        completed: false,
        createdAt: mockTimestamp,
      };

      await createSet(set);

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workout_sets'),
        ['set-1', 'exercise-1', 'session-1', 1, 10, 185, 0, mockTimestamp, null]
      );
    });
  });

  describe('updateSet', () => {
    it('should update set reps', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateSet('set-1', { reps: 12 });

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_sets SET reps = ? WHERE id = ?',
        [12, 'set-1']
      );
    });

    it('should update set weight', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateSet('set-1', { weight: 225 });

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_sets SET weight = ? WHERE id = ?',
        [225, 'set-1']
      );
    });

    it('should update multiple fields', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateSet('set-1', {
        reps: 12,
        weight: 225,
        completed: true,
        completedAt: mockTimestamp + 5000,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE workout_sets SET'),
        [12, 225, 1, mockTimestamp + 5000, 'set-1']
      );
    });

    it('should return early if no updates provided', async () => {
      await updateSet('set-1', {});

      expect(helpers.execute).not.toHaveBeenCalled();
    });
  });

  describe('completeSet', () => {
    it('should mark set as completed with custom timestamp', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await completeSet('set-1', mockTimestamp + 2000);

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_sets SET completed = 1, completed_at = ? WHERE id = ?',
        [mockTimestamp + 2000, 'set-1']
      );
    });

    it('should use current timestamp if not provided', async () => {
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await completeSet('set-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_sets SET completed = 1, completed_at = ? WHERE id = ?',
        [mockTimestamp, 'set-1']
      );

      dateSpy.mockRestore();
    });
  });

  describe('uncompleteSet', () => {
    it('should mark set as incomplete', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await uncompleteSet('set-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_sets SET completed = 0, completed_at = NULL WHERE id = ?',
        ['set-1']
      );
    });
  });

  describe('deleteSet', () => {
    it('should delete a set', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await deleteSet('set-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'DELETE FROM workout_sets WHERE id = ?',
        ['set-1']
      );
    });
  });

  describe('deleteSetsByExerciseId', () => {
    it('should delete all sets for an exercise', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 3,
      });

      await deleteSetsByExerciseId('exercise-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'DELETE FROM workout_sets WHERE exercise_id = ?',
        ['exercise-1']
      );
    });
  });

  describe('deleteSetsBySessionId', () => {
    it('should delete all sets for a session', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 10,
      });

      await deleteSetsBySessionId('session-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'DELETE FROM workout_sets WHERE workout_session_id = ?',
        ['session-1']
      );
    });
  });

  describe('createMultipleSets', () => {
    it('should create multiple sets in transaction', async () => {
      (helpers.transaction as jest.Mock).mockResolvedValueOnce(undefined);

      const sets: WorkoutSet[] = [
        {
          id: 'set-1',
          exerciseId: 'exercise-1',
          workoutSessionId: 'session-1',
          setNumber: 1,
          reps: 10,
          weight: 185,
          completed: false,
          createdAt: mockTimestamp,
        },
        {
          id: 'set-2',
          exerciseId: 'exercise-1',
          workoutSessionId: 'session-1',
          setNumber: 2,
          reps: 10,
          weight: 185,
          completed: false,
          createdAt: mockTimestamp,
        },
      ];

      await createMultipleSets(sets);

      expect(helpers.transaction).toHaveBeenCalledWith([
        {
          sql: expect.stringContaining('INSERT INTO workout_sets'),
          params: [
            'set-1',
            'exercise-1',
            'session-1',
            1,
            10,
            185,
            0,
            mockTimestamp,
            null,
          ],
        },
        {
          sql: expect.stringContaining('INSERT INTO workout_sets'),
          params: [
            'set-2',
            'exercise-1',
            'session-1',
            2,
            10,
            185,
            0,
            mockTimestamp,
            null,
          ],
        },
      ]);
    });
  });

  describe('getRecentSetsByExerciseName', () => {
    const mockSetRows = [
      {
        id: 'set-1',
        exercise_id: 'exercise-1',
        workout_session_id: 'session-1',
        set_number: 1,
        reps: 10,
        weight: 185,
        completed: 1,
        created_at: mockTimestamp,
        completed_at: mockTimestamp + 1000,
      },
      {
        id: 'set-2',
        exercise_id: 'exercise-1',
        workout_session_id: 'session-1',
        set_number: 2,
        reps: 10,
        weight: 185,
        completed: 1,
        created_at: mockTimestamp,
        completed_at: mockTimestamp + 2000,
      },
    ];

    it('should return recent sets for an exercise', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockSetRows);

      const result = await getRecentSetsByExerciseName('Bench Press', 10);

      expect(result).toHaveLength(2);
      expect(helpers.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE e.name = ? AND ws.completed = 1'),
        ['Bench Press', 10]
      );
    });

    it('should use default limit of 10', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);

      await getRecentSetsByExerciseName('Bench Press');

      expect(helpers.query).toHaveBeenCalledWith(expect.any(String), [
        'Bench Press',
        10,
      ]);
    });
  });

  describe('getLastWorkoutSetsByExerciseName', () => {
    const mockSessionRow = {
      workout_session_id: 'session-1',
    };

    const mockSetRows = [
      {
        id: 'set-1',
        exercise_id: 'exercise-1',
        workout_session_id: 'session-1',
        set_number: 1,
        reps: 10,
        weight: 185,
        completed: 1,
        created_at: mockTimestamp,
        completed_at: mockTimestamp + 1000,
      },
    ];

    it('should return sets from last workout for an exercise', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockSessionRow);
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockSetRows);

      const result = await getLastWorkoutSetsByExerciseName('Bench Press');

      expect(result).toHaveLength(1);
      expect(result[0].workoutSessionId).toBe('session-1');
      expect(helpers.getOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE e.name = ? AND wss.end_time IS NOT NULL'),
        ['Bench Press']
      );
      expect(helpers.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE e.name = ? AND ws.workout_session_id = ?'),
        ['Bench Press', 'session-1']
      );
    });

    it('should filter by program day if provided', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockSessionRow);
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockSetRows);

      await getLastWorkoutSetsByExerciseName('Bench Press', 'day-1');

      expect(helpers.getOne).toHaveBeenCalledWith(
        expect.stringContaining('AND wss.program_day_id = ?'),
        ['Bench Press', 'day-1']
      );
    });

    it('should return empty array when no previous workout found', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await getLastWorkoutSetsByExerciseName('Bench Press');

      expect(result).toEqual([]);
      expect(helpers.query).not.toHaveBeenCalled();
    });
  });

  describe('getTotalVolumeBySessionId', () => {
    it('should return total volume for a session', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce({
        total_volume: 5550,
      });

      const result = await getTotalVolumeBySessionId('session-1');

      expect(result).toBe(5550);
      expect(helpers.getOne).toHaveBeenCalledWith(
        'SELECT SUM(reps * weight) as total_volume FROM workout_sets WHERE workout_session_id = ? AND completed = 1',
        ['session-1']
      );
    });

    it('should return 0 when no sets exist', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce({
        total_volume: null,
      });

      const result = await getTotalVolumeBySessionId('session-1');

      expect(result).toBe(0);
    });
  });

  describe('getTotalVolumeByExerciseId', () => {
    it('should return total volume for an exercise', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce({
        total_volume: 1850,
      });

      const result = await getTotalVolumeByExerciseId('exercise-1');

      expect(result).toBe(1850);
      expect(helpers.getOne).toHaveBeenCalledWith(
        'SELECT SUM(reps * weight) as total_volume FROM workout_sets WHERE exercise_id = ? AND completed = 1',
        ['exercise-1']
      );
    });
  });

  describe('countCompletedSetsBySessionId', () => {
    it('should return count of completed sets', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce({ count: 15 });

      const result = await countCompletedSetsBySessionId('session-1');

      expect(result).toBe(15);
      expect(helpers.getOne).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM workout_sets WHERE workout_session_id = ? AND completed = 1',
        ['session-1']
      );
    });

    it('should return 0 when no completed sets', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce({ count: 0 });

      const result = await countCompletedSetsBySessionId('session-1');

      expect(result).toBe(0);
    });
  });

  describe('countTotalSetsBySessionId', () => {
    it('should return total count of sets', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce({ count: 20 });

      const result = await countTotalSetsBySessionId('session-1');

      expect(result).toBe(20);
      expect(helpers.getOne).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM workout_sets WHERE workout_session_id = ?',
        ['session-1']
      );
    });
  });

  describe('getExerciseHistory', () => {
    const mockHistoryRows = [
      {
        workout_session_id: 'session-1',
        workout_name: 'Push Day',
        workout_date: mockTimestamp,
        exercise_id: 'exercise-1',
        total_sets: 3,
        completed_sets: 3,
        total_volume: 5550,
        max_weight: 185,
        total_reps: 30,
        program_day_name: 'Day 1',
        program_id: 'program-1',
        program_day_id: 'day-1',
      },
      {
        workout_session_id: 'session-2',
        workout_name: 'Push Day',
        workout_date: mockTimestamp - 86400000,
        exercise_id: 'exercise-2',
        total_sets: 3,
        completed_sets: 2,
        total_volume: 3700,
        max_weight: 185,
        total_reps: 20,
        program_day_name: null,
        program_id: null,
        program_day_id: null,
      },
    ];

    it('should return exercise history', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockHistoryRows);

      const result = await getExerciseHistory('Bench Press');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        workoutSessionId: 'session-1',
        workoutName: 'Push Day',
        workoutDate: mockTimestamp,
        exerciseId: 'exercise-1',
        totalSets: 3,
        completedSets: 3,
        totalVolume: 5550,
        maxWeight: 185,
        totalReps: 30,
        programDayName: 'Day 1',
        programId: 'program-1',
        programDayId: 'day-1',
      });
      expect(result[1]).toMatchObject({
        workoutSessionId: 'session-2',
        programDayName: undefined,
        programId: undefined,
        programDayId: undefined,
      });
      expect(helpers.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE LOWER(e.name) = LOWER(?)'),
        ['Bench Press']
      );
    });

    it('should handle null values in history', async () => {
      const rowWithNulls = [
        {
          workout_session_id: 'session-1',
          workout_name: 'Push Day',
          workout_date: mockTimestamp,
          exercise_id: 'exercise-1',
          total_sets: 3,
          completed_sets: 0,
          total_volume: null,
          max_weight: null,
          total_reps: null,
          program_day_name: null,
          program_id: null,
          program_day_id: null,
        },
      ];

      (helpers.query as jest.Mock).mockResolvedValueOnce(rowWithNulls);

      const result = await getExerciseHistory('Bench Press');

      expect(result[0]).toMatchObject({
        totalVolume: 0,
        maxWeight: 0,
        totalReps: 0,
      });
    });
  });

  describe('getSetsByExerciseAndSession', () => {
    const mockSetRows = [
      {
        id: 'set-1',
        exercise_id: 'exercise-1',
        workout_session_id: 'session-1',
        set_number: 1,
        reps: 10,
        weight: 185,
        completed: 1,
        created_at: mockTimestamp,
        completed_at: mockTimestamp + 1000,
      },
    ];

    it('should return sets for specific exercise and session', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockSetRows);

      const result = await getSetsByExerciseAndSession(
        'exercise-1',
        'session-1'
      );

      expect(result).toHaveLength(1);
      expect(result[0].exerciseId).toBe('exercise-1');
      expect(result[0].workoutSessionId).toBe('session-1');
      expect(helpers.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE exercise_id = ? AND workout_session_id = ?'
        ),
        ['exercise-1', 'session-1']
      );
    });
  });
});
