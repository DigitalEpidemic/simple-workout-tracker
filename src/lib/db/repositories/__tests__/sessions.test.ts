/**
 * Unit tests for Sessions Repository
 */

import { WorkoutSession, Exercise, WorkoutSet } from '@/types';
import * as helpers from '../../helpers';
import * as setsRepo from '../sets';
import {
  getAllSessions,
  getSessionById,
  getActiveSession,
  getCompletedSessions,
  getSessionsByDateRange,
  createSession,
  updateSession,
  completeSession,
  deleteSession,
  getExercisesBySessionId,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  reorderExercises,
  createSessionWithExercises,
} from '../sessions';

// Mock the database helpers and dependencies
jest.mock('../../helpers');
jest.mock('../sets');
jest.mock('../programs', () => ({
  logProgramHistory: jest.fn(),
  advanceProgramDay: jest.fn(),
}));

describe('Sessions Repository', () => {
  const mockTimestamp = 1640000000000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSessions', () => {
    const mockSessionRows = [
      {
        id: 'session-1',
        template_id: 'template-1',
        template_name: 'Push Day',
        program_id: null,
        program_day_id: null,
        program_day_name: null,
        name: 'Push Day',
        start_time: mockTimestamp,
        end_time: mockTimestamp + 3600000,
        duration: 3600,
        notes: 'Good workout',
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      },
      {
        id: 'session-2',
        template_id: null,
        template_name: null,
        program_id: 'program-1',
        program_day_id: 'day-1',
        program_day_name: 'Day 1',
        name: 'Program Day 1',
        start_time: mockTimestamp - 86400000,
        end_time: null,
        duration: null,
        notes: null,
        created_at: mockTimestamp - 86400000,
        updated_at: mockTimestamp - 86400000,
      },
    ];

    it('should return all sessions with exercises', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockSessionRows);
      (setsRepo.getAllSetsBySessionId as jest.Mock).mockResolvedValue([]);

      // Mock getExercisesBySessionId calls
      (helpers.query as jest.Mock)
        .mockResolvedValueOnce([]) // session-1 exercises
        .mockResolvedValueOnce([]); // session-2 exercises

      const result = await getAllSessions(true);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'session-1',
        templateId: 'template-1',
        templateName: 'Push Day',
        programId: undefined,
        name: 'Push Day',
        exercises: [],
      });
      expect(result[1]).toMatchObject({
        id: 'session-2',
        programId: 'program-1',
        programDayId: 'day-1',
        programDayName: 'Day 1',
        name: 'Program Day 1',
        endTime: undefined,
        duration: undefined,
      });
    });

    it('should return sessions without exercises when includeExercises is false', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockSessionRows);

      const result = await getAllSessions(false);

      expect(result).toHaveLength(2);
      expect(result[0].exercises).toEqual([]);
      expect(result[1].exercises).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce([mockSessionRows[0]]);

      const result = await getAllSessions(false, 1);

      expect(helpers.query).toHaveBeenCalledWith(
        'SELECT * FROM workout_sessions ORDER BY start_time DESC LIMIT ?',
        [1]
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no sessions exist', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);

      const result = await getAllSessions();

      expect(result).toEqual([]);
    });
  });

  describe('getSessionById', () => {
    const mockSessionRow = {
      id: 'session-1',
      template_id: 'template-1',
      template_name: 'Push Day',
      program_id: null,
      program_day_id: null,
      program_day_name: null,
      name: 'Push Day',
      start_time: mockTimestamp,
      end_time: mockTimestamp + 3600000,
      duration: 3600,
      notes: 'Good workout',
      created_at: mockTimestamp,
      updated_at: mockTimestamp,
    };

    it('should return session with exercises', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockSessionRow);
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);
      (setsRepo.getAllSetsBySessionId as jest.Mock).mockResolvedValue([]);

      const result = await getSessionById('session-1', true);

      expect(result).toMatchObject({
        id: 'session-1',
        templateId: 'template-1',
        templateName: 'Push Day',
        name: 'Push Day',
        exercises: [],
      });
    });

    it('should return session without exercises when includeExercises is false', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockSessionRow);

      const result = await getSessionById('session-1', false);

      expect(result).toMatchObject({
        id: 'session-1',
        exercises: [],
      });
    });

    it('should return null when session not found', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await getSessionById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getActiveSession', () => {
    const mockActiveSessionRow = {
      id: 'session-active',
      template_id: 'template-1',
      template_name: 'Push Day',
      program_id: null,
      program_day_id: null,
      program_day_name: null,
      name: 'Push Day',
      start_time: mockTimestamp,
      end_time: null,
      duration: null,
      notes: null,
      created_at: mockTimestamp,
      updated_at: mockTimestamp,
    };

    it('should return active session', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockActiveSessionRow);
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);
      (setsRepo.getAllSetsBySessionId as jest.Mock).mockResolvedValue([]);

      const result = await getActiveSession(true);

      expect(result).toMatchObject({
        id: 'session-active',
        endTime: undefined,
        duration: undefined,
      });
      expect(helpers.getOne).toHaveBeenCalledWith(
        'SELECT * FROM workout_sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1'
      );
    });

    it('should return null when no active session exists', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await getActiveSession();

      expect(result).toBeNull();
    });
  });

  describe('getCompletedSessions', () => {
    const mockCompletedSessionRows = [
      {
        id: 'session-1',
        template_id: 'template-1',
        template_name: 'Push Day',
        program_id: null,
        program_day_id: null,
        program_day_name: null,
        name: 'Push Day',
        start_time: mockTimestamp,
        end_time: mockTimestamp + 3600000,
        duration: 3600,
        notes: null,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      },
    ];

    it('should return completed sessions', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(
        mockCompletedSessionRows
      );
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);
      (setsRepo.getAllSetsBySessionId as jest.Mock).mockResolvedValue([]);

      const result = await getCompletedSessions(true);

      expect(result).toHaveLength(1);
      expect(result[0].endTime).toBeDefined();
      expect(helpers.query).toHaveBeenCalledWith(
        'SELECT * FROM workout_sessions WHERE end_time IS NOT NULL ORDER BY start_time DESC',
        undefined
      );
    });

    it('should respect limit parameter', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(
        mockCompletedSessionRows
      );

      const result = await getCompletedSessions(false, 10);

      expect(helpers.query).toHaveBeenCalledWith(
        'SELECT * FROM workout_sessions WHERE end_time IS NOT NULL ORDER BY start_time DESC LIMIT ?',
        [10]
      );
    });
  });

  describe('getSessionsByDateRange', () => {
    const mockSessionRows = [
      {
        id: 'session-1',
        template_id: 'template-1',
        template_name: 'Push Day',
        program_id: null,
        program_day_id: null,
        program_day_name: null,
        name: 'Push Day',
        start_time: mockTimestamp,
        end_time: mockTimestamp + 3600000,
        duration: 3600,
        notes: null,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      },
    ];

    it('should return sessions within date range', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockSessionRows);
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);
      (setsRepo.getAllSetsBySessionId as jest.Mock).mockResolvedValue([]);

      const startDate = mockTimestamp - 86400000;
      const endDate = mockTimestamp + 86400000;

      const result = await getSessionsByDateRange(startDate, endDate, true);

      expect(result).toHaveLength(1);
      expect(helpers.query).toHaveBeenCalledWith(
        'SELECT * FROM workout_sessions WHERE start_time >= ? AND start_time <= ? ORDER BY start_time DESC',
        [startDate, endDate]
      );
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 1,
        changes: 1,
      });

      const session: Omit<WorkoutSession, 'exercises'> = {
        id: 'session-1',
        templateId: 'template-1',
        templateName: 'Push Day',
        name: 'Push Day',
        startTime: mockTimestamp,
        endTime: mockTimestamp + 3600000,
        duration: 3600,
        notes: 'Good workout',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createSession(session);

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workout_sessions'),
        [
          'session-1',
          'template-1',
          'Push Day',
          null,
          null,
          null,
          'Push Day',
          mockTimestamp,
          mockTimestamp + 3600000,
          3600,
          'Good workout',
          mockTimestamp,
          mockTimestamp,
        ]
      );
    });

    it('should handle session with program fields', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 1,
        changes: 1,
      });

      const session: Omit<WorkoutSession, 'exercises'> = {
        id: 'session-1',
        programId: 'program-1',
        programDayId: 'day-1',
        programDayName: 'Day 1',
        name: 'Program Day 1',
        startTime: mockTimestamp,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createSession(session);

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workout_sessions'),
        [
          'session-1',
          null,
          null,
          'program-1',
          'day-1',
          'Day 1',
          'Program Day 1',
          mockTimestamp,
          null,
          null,
          null,
          mockTimestamp,
          mockTimestamp,
        ]
      );
    });
  });

  describe('updateSession', () => {
    it('should update session name', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateSession('session-1', {
        name: 'New Name',
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_sessions SET name = ?, updated_at = ? WHERE id = ?',
        ['New Name', mockTimestamp, 'session-1']
      );
    });

    it('should update multiple fields', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateSession('session-1', {
        name: 'New Name',
        endTime: mockTimestamp + 3600000,
        duration: 3600,
        notes: 'Updated notes',
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE workout_sessions SET'),
        [
          'New Name',
          mockTimestamp + 3600000,
          3600,
          'Updated notes',
          mockTimestamp,
          'session-1',
        ]
      );
    });
  });

  describe('completeSession', () => {
    it('should complete a session', async () => {
      const mockSession = {
        id: 'session-1',
        name: 'Push Day',
        startTime: mockTimestamp,
        exercises: [],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      (helpers.getOne as jest.Mock).mockResolvedValueOnce({
        id: 'session-1',
        template_id: 'template-1',
        template_name: 'Push Day',
        program_id: null,
        program_day_id: null,
        program_day_name: null,
        name: 'Push Day',
        start_time: mockTimestamp,
        end_time: null,
        duration: null,
        notes: null,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      });
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      const endTime = mockTimestamp + 3600000;
      await completeSession('session-1', endTime);

      const expectedDuration = Math.floor((endTime - mockTimestamp) / 1000);

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_sessions SET end_time = ?, duration = ?, updated_at = ? WHERE id = ?',
        [endTime, expectedDuration, expect.any(Number), 'session-1']
      );
    });

    it('should throw error when session not found', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        completeSession('nonexistent-id', mockTimestamp)
      ).rejects.toThrow('Session nonexistent-id not found');
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await deleteSession('session-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'DELETE FROM workout_sessions WHERE id = ?',
        ['session-1']
      );
    });
  });

  describe('getExercisesBySessionId', () => {
    const mockExerciseRows = [
      {
        id: 'exercise-1',
        workout_session_id: 'session-1',
        name: 'Bench Press',
        order: 0,
        notes: 'Focus on form',
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      },
      {
        id: 'exercise-2',
        workout_session_id: 'session-1',
        name: 'Overhead Press',
        order: 1,
        notes: null,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      },
    ];

    const mockSets: WorkoutSet[] = [
      {
        id: 'set-1',
        exerciseId: 'exercise-1',
        workoutSessionId: 'session-1',
        setNumber: 1,
        reps: 10,
        weight: 185,
        completed: true,
        createdAt: mockTimestamp,
        completedAt: mockTimestamp,
      },
    ];

    it('should return exercises with sets for a session', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockExerciseRows);
      (setsRepo.getAllSetsBySessionId as jest.Mock).mockResolvedValue(mockSets);

      const result = await getExercisesBySessionId('session-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'exercise-1',
        workoutSessionId: 'session-1',
        name: 'Bench Press',
        order: 0,
        notes: 'Focus on form',
        sets: mockSets,
      });
      expect(result[1]).toMatchObject({
        id: 'exercise-2',
        notes: undefined,
        sets: [],
      });
    });

    it('should return empty array when no exercises exist', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);

      const result = await getExercisesBySessionId('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('getExerciseById', () => {
    const mockExerciseRow = {
      id: 'exercise-1',
      workout_session_id: 'session-1',
      name: 'Bench Press',
      order: 0,
      notes: null,
      created_at: mockTimestamp,
      updated_at: mockTimestamp,
    };

    it('should return exercise by id', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockExerciseRow);
      (setsRepo.getAllSetsBySessionId as jest.Mock).mockResolvedValue([]);

      const result = await getExerciseById('exercise-1');

      expect(result).toMatchObject({
        id: 'exercise-1',
        workoutSessionId: 'session-1',
        name: 'Bench Press',
      });
    });

    it('should return null when exercise not found', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await getExerciseById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('createExercise', () => {
    it('should create a new exercise', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 1,
        changes: 1,
      });

      const exercise: Omit<Exercise, 'sets'> = {
        id: 'exercise-1',
        workoutSessionId: 'session-1',
        name: 'Bench Press',
        order: 0,
        notes: 'Focus on form',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createExercise(exercise);

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO exercises'),
        [
          'exercise-1',
          'session-1',
          'Bench Press',
          0,
          'Focus on form',
          mockTimestamp,
          mockTimestamp,
        ]
      );
    });
  });

  describe('updateExercise', () => {
    it('should update exercise name', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateExercise('exercise-1', {
        name: 'New Exercise',
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE exercises SET name = ?, updated_at = ? WHERE id = ?',
        ['New Exercise', mockTimestamp, 'exercise-1']
      );
    });

    it('should update multiple fields', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateExercise('exercise-1', {
        name: 'New Exercise',
        order: 5,
        notes: 'New notes',
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE exercises SET'),
        ['New Exercise', 5, 'New notes', mockTimestamp, 'exercise-1']
      );
    });
  });

  describe('deleteExercise', () => {
    it('should delete an exercise', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await deleteExercise('exercise-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'DELETE FROM exercises WHERE id = ?',
        ['exercise-1']
      );
    });
  });

  describe('reorderExercises', () => {
    it('should reorder multiple exercises in transaction', async () => {
      (helpers.transaction as jest.Mock).mockResolvedValueOnce(undefined);

      const exerciseOrders = [
        { id: 'exercise-1', order: 2 },
        { id: 'exercise-2', order: 0 },
        { id: 'exercise-3', order: 1 },
      ];

      await reorderExercises(exerciseOrders);

      expect(helpers.transaction).toHaveBeenCalledWith([
        {
          sql: 'UPDATE exercises SET "order" = ?, updated_at = ? WHERE id = ?',
          params: [2, expect.any(Number), 'exercise-1'],
        },
        {
          sql: 'UPDATE exercises SET "order" = ?, updated_at = ? WHERE id = ?',
          params: [0, expect.any(Number), 'exercise-2'],
        },
        {
          sql: 'UPDATE exercises SET "order" = ?, updated_at = ? WHERE id = ?',
          params: [1, expect.any(Number), 'exercise-3'],
        },
      ]);
    });
  });

  describe('createSessionWithExercises', () => {
    it('should create session with exercises and sets in transaction', async () => {
      (helpers.transaction as jest.Mock).mockResolvedValueOnce(undefined);

      const session: WorkoutSession = {
        id: 'session-1',
        templateId: 'template-1',
        templateName: 'Push Day',
        name: 'Push Day',
        startTime: mockTimestamp,
        exercises: [
          {
            id: 'exercise-1',
            workoutSessionId: 'session-1',
            name: 'Bench Press',
            order: 0,
            sets: [
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
            ],
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          },
        ],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createSessionWithExercises(session);

      expect(helpers.transaction).toHaveBeenCalledWith([
        {
          sql: expect.stringContaining('INSERT INTO workout_sessions'),
          params: [
            'session-1',
            'template-1',
            'Push Day',
            null,
            null,
            null,
            'Push Day',
            mockTimestamp,
            null,
            null,
            null,
            mockTimestamp,
            mockTimestamp,
          ],
        },
        {
          sql: expect.stringContaining('INSERT INTO exercises'),
          params: [
            'exercise-1',
            'session-1',
            'Bench Press',
            0,
            null,
            mockTimestamp,
            mockTimestamp,
          ],
        },
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
      ]);
    });

    it('should handle session without sets', async () => {
      (helpers.transaction as jest.Mock).mockResolvedValueOnce(undefined);

      const session: WorkoutSession = {
        id: 'session-1',
        name: 'Push Day',
        startTime: mockTimestamp,
        exercises: [
          {
            id: 'exercise-1',
            workoutSessionId: 'session-1',
            name: 'Bench Press',
            order: 0,
            sets: [],
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          },
        ],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createSessionWithExercises(session);

      const call = (helpers.transaction as jest.Mock).mock.calls[0][0];
      expect(call).toHaveLength(2); // Session + 1 exercise, no sets
    });
  });
});
