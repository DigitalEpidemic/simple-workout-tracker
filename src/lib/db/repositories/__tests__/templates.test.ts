/**
 * Unit tests for Templates Repository
 */

import { WorkoutTemplate, ExerciseTemplate } from '@/types';
import * as helpers from '../../helpers';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getExerciseTemplatesByWorkoutId,
  getExerciseTemplateById,
  createExerciseTemplate,
  updateExerciseTemplate,
  deleteExerciseTemplate,
  deleteExerciseTemplatesByWorkoutId,
  createTemplateWithExercises,
  updateTemplateWithExercises,
  updateTemplateLastUsed,
} from '../templates';

// Mock the database helpers
jest.mock('../../helpers');

describe('Templates Repository', () => {
  const mockTimestamp = 1640000000000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTemplates', () => {
    const mockTemplateRows = [
      {
        id: 'template-1',
        name: 'Push Day',
        description: 'Upper body push',
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
        last_used: mockTimestamp,
      },
      {
        id: 'template-2',
        name: 'Pull Day',
        description: null,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
        last_used: null,
      },
    ];

    const mockExerciseRows = [
      {
        id: 'exercise-1',
        workout_template_id: 'template-1',
        name: 'Bench Press',
        order: 0,
        target_sets: 3,
        target_reps: 10,
        target_weight: 185,
        notes: 'Focus on form',
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      },
    ];

    it('should return all templates with exercises', async () => {
      (helpers.query as jest.Mock)
        .mockResolvedValueOnce(mockTemplateRows)
        .mockResolvedValueOnce(mockExerciseRows)
        .mockResolvedValueOnce([]);

      const result = await getAllTemplates(true);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'template-1',
        name: 'Push Day',
        description: 'Upper body push',
        exercises: [
          {
            id: 'exercise-1',
            workoutTemplateId: 'template-1',
            name: 'Bench Press',
            order: 0,
            targetSets: 3,
            targetReps: 10,
            targetWeight: 185,
            notes: 'Focus on form',
          },
        ],
      });
      expect(result[1]).toMatchObject({
        id: 'template-2',
        name: 'Pull Day',
        description: undefined,
        exercises: [],
        lastUsed: undefined,
      });
    });

    it('should return templates without exercises when includeExercises is false', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockTemplateRows);

      const result = await getAllTemplates(false);

      expect(result).toHaveLength(2);
      expect(result[0].exercises).toEqual([]);
      expect(result[1].exercises).toEqual([]);
      expect(helpers.query).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no templates exist', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);

      const result = await getAllTemplates();

      expect(result).toEqual([]);
    });
  });

  describe('getTemplateById', () => {
    const mockTemplateRow = {
      id: 'template-1',
      name: 'Push Day',
      description: 'Upper body push',
      created_at: mockTimestamp,
      updated_at: mockTimestamp,
      last_used: mockTimestamp,
    };

    const mockExerciseRows = [
      {
        id: 'exercise-1',
        workout_template_id: 'template-1',
        name: 'Bench Press',
        order: 0,
        target_sets: 3,
        target_reps: 10,
        target_weight: 185,
        notes: null,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      },
    ];

    it('should return template with exercises', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockTemplateRow);
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockExerciseRows);

      const result = await getTemplateById('template-1', true);

      expect(result).toMatchObject({
        id: 'template-1',
        name: 'Push Day',
        description: 'Upper body push',
        exercises: [
          {
            id: 'exercise-1',
            workoutTemplateId: 'template-1',
            name: 'Bench Press',
            order: 0,
            targetSets: 3,
            targetReps: 10,
            targetWeight: 185,
            notes: undefined,
          },
        ],
      });
      expect(helpers.getOne).toHaveBeenCalledWith(
        'SELECT * FROM workout_templates WHERE id = ?',
        ['template-1']
      );
    });

    it('should return template without exercises when includeExercises is false', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockTemplateRow);

      const result = await getTemplateById('template-1', false);

      expect(result).toMatchObject({
        id: 'template-1',
        name: 'Push Day',
        exercises: [],
      });
      expect(helpers.query).not.toHaveBeenCalled();
    });

    it('should return null when template not found', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await getTemplateById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 1,
        changes: 1,
      });

      const template: Omit<WorkoutTemplate, 'exercises'> = {
        id: 'template-1',
        name: 'Push Day',
        description: 'Upper body push',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        lastUsed: mockTimestamp,
      };

      await createTemplate(template);

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workout_templates'),
        [
          'template-1',
          'Push Day',
          'Upper body push',
          mockTimestamp,
          mockTimestamp,
          mockTimestamp,
        ]
      );
    });

    it('should handle template without optional fields', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 1,
        changes: 1,
      });

      const template: Omit<WorkoutTemplate, 'exercises'> = {
        id: 'template-1',
        name: 'Push Day',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createTemplate(template);

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workout_templates'),
        ['template-1', 'Push Day', null, mockTimestamp, mockTimestamp, null]
      );
    });
  });

  describe('updateTemplate', () => {
    it('should update template name', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateTemplate('template-1', {
        name: 'New Name',
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_templates SET name = ?, updated_at = ? WHERE id = ?',
        ['New Name', mockTimestamp, 'template-1']
      );
    });

    it('should update template description', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateTemplate('template-1', {
        description: 'New description',
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_templates SET description = ?, updated_at = ? WHERE id = ?',
        ['New description', mockTimestamp, 'template-1']
      );
    });

    it('should update multiple fields', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateTemplate('template-1', {
        name: 'New Name',
        description: 'New description',
        lastUsed: mockTimestamp + 1000,
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE workout_templates SET'),
        [
          'New Name',
          'New description',
          mockTimestamp + 1000,
          mockTimestamp,
          'template-1',
        ]
      );
    });

    it('should handle null description', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateTemplate('template-1', {
        description: null,
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_templates SET description = ?, updated_at = ? WHERE id = ?',
        [null, mockTimestamp, 'template-1']
      );
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await deleteTemplate('template-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'DELETE FROM workout_templates WHERE id = ?',
        ['template-1']
      );
    });
  });

  describe('getExerciseTemplatesByWorkoutId', () => {
    const mockExerciseRows = [
      {
        id: 'exercise-1',
        workout_template_id: 'template-1',
        name: 'Bench Press',
        order: 0,
        target_sets: 3,
        target_reps: 10,
        target_weight: 185,
        notes: 'Focus on form',
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      },
      {
        id: 'exercise-2',
        workout_template_id: 'template-1',
        name: 'Overhead Press',
        order: 1,
        target_sets: null,
        target_reps: null,
        target_weight: null,
        notes: null,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      },
    ];

    it('should return exercises for a workout template', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce(mockExerciseRows);

      const result = await getExerciseTemplatesByWorkoutId('template-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'exercise-1',
        workoutTemplateId: 'template-1',
        name: 'Bench Press',
        order: 0,
        targetSets: 3,
        targetReps: 10,
        targetWeight: 185,
        notes: 'Focus on form',
      });
      expect(result[1]).toMatchObject({
        id: 'exercise-2',
        workoutTemplateId: 'template-1',
        name: 'Overhead Press',
        order: 1,
        targetSets: undefined,
        targetReps: undefined,
        targetWeight: undefined,
        notes: undefined,
      });
    });

    it('should return empty array when no exercises exist', async () => {
      (helpers.query as jest.Mock).mockResolvedValueOnce([]);

      const result = await getExerciseTemplatesByWorkoutId('template-1');

      expect(result).toEqual([]);
    });
  });

  describe('getExerciseTemplateById', () => {
    const mockExerciseRow = {
      id: 'exercise-1',
      workout_template_id: 'template-1',
      name: 'Bench Press',
      order: 0,
      target_sets: 3,
      target_reps: 10,
      target_weight: 185,
      notes: null,
      created_at: mockTimestamp,
      updated_at: mockTimestamp,
    };

    it('should return exercise template by id', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(mockExerciseRow);

      const result = await getExerciseTemplateById('exercise-1');

      expect(result).toMatchObject({
        id: 'exercise-1',
        workoutTemplateId: 'template-1',
        name: 'Bench Press',
        order: 0,
        targetSets: 3,
        targetReps: 10,
        targetWeight: 185,
        notes: undefined,
      });
    });

    it('should return null when exercise not found', async () => {
      (helpers.getOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await getExerciseTemplateById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('createExerciseTemplate', () => {
    it('should create a new exercise template', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 1,
        changes: 1,
      });

      const exercise: ExerciseTemplate = {
        id: 'exercise-1',
        workoutTemplateId: 'template-1',
        name: 'Bench Press',
        order: 0,
        targetSets: 3,
        targetReps: 10,
        targetWeight: 185,
        notes: 'Focus on form',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createExerciseTemplate(exercise);

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO exercise_templates'),
        [
          'exercise-1',
          'template-1',
          'Bench Press',
          0,
          3,
          10,
          185,
          'Focus on form',
          mockTimestamp,
          mockTimestamp,
        ]
      );
    });

    it('should handle exercise without optional fields', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 1,
        changes: 1,
      });

      const exercise: ExerciseTemplate = {
        id: 'exercise-1',
        workoutTemplateId: 'template-1',
        name: 'Bench Press',
        order: 0,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createExerciseTemplate(exercise);

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO exercise_templates'),
        [
          'exercise-1',
          'template-1',
          'Bench Press',
          0,
          null,
          null,
          null,
          null,
          mockTimestamp,
          mockTimestamp,
        ]
      );
    });
  });

  describe('updateExerciseTemplate', () => {
    it('should update exercise name', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateExerciseTemplate('exercise-1', {
        name: 'New Exercise',
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE exercise_templates SET name = ?, updated_at = ? WHERE id = ?',
        ['New Exercise', mockTimestamp, 'exercise-1']
      );
    });

    it('should update exercise order', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateExerciseTemplate('exercise-1', {
        order: 5,
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE exercise_templates SET "order" = ?, updated_at = ? WHERE id = ?',
        [5, mockTimestamp, 'exercise-1']
      );
    });

    it('should update multiple fields', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateExerciseTemplate('exercise-1', {
        name: 'New Exercise',
        targetSets: 4,
        targetReps: 8,
        targetWeight: 225,
        notes: 'New notes',
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE exercise_templates SET'),
        [
          'New Exercise',
          4,
          8,
          225,
          'New notes',
          mockTimestamp,
          'exercise-1',
        ]
      );
    });

    it('should handle null values', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateExerciseTemplate('exercise-1', {
        targetSets: null,
        targetReps: null,
        targetWeight: null,
        notes: null,
        updatedAt: mockTimestamp,
      });

      expect(helpers.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE exercise_templates SET'),
        [null, null, null, null, mockTimestamp, 'exercise-1']
      );
    });
  });

  describe('deleteExerciseTemplate', () => {
    it('should delete an exercise template', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await deleteExerciseTemplate('exercise-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'DELETE FROM exercise_templates WHERE id = ?',
        ['exercise-1']
      );
    });
  });

  describe('deleteExerciseTemplatesByWorkoutId', () => {
    it('should delete all exercises for a workout template', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 3,
      });

      await deleteExerciseTemplatesByWorkoutId('template-1');

      expect(helpers.execute).toHaveBeenCalledWith(
        'DELETE FROM exercise_templates WHERE workout_template_id = ?',
        ['template-1']
      );
    });
  });

  describe('createTemplateWithExercises', () => {
    it('should create template with exercises in transaction', async () => {
      (helpers.transaction as jest.Mock).mockResolvedValueOnce(undefined);

      const template: WorkoutTemplate = {
        id: 'template-1',
        name: 'Push Day',
        description: 'Upper body push',
        exercises: [
          {
            id: 'exercise-1',
            workoutTemplateId: 'template-1',
            name: 'Bench Press',
            order: 0,
            targetSets: 3,
            targetReps: 10,
            targetWeight: 185,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          },
          {
            id: 'exercise-2',
            workoutTemplateId: 'template-1',
            name: 'Overhead Press',
            order: 1,
            targetSets: 3,
            targetReps: 10,
            targetWeight: 95,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          },
        ],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createTemplateWithExercises(template);

      expect(helpers.transaction).toHaveBeenCalledWith([
        {
          sql: expect.stringContaining('INSERT INTO workout_templates'),
          params: [
            'template-1',
            'Push Day',
            'Upper body push',
            mockTimestamp,
            mockTimestamp,
            null,
          ],
        },
        {
          sql: expect.stringContaining('INSERT INTO exercise_templates'),
          params: [
            'exercise-1',
            'template-1',
            'Bench Press',
            0,
            3,
            10,
            185,
            null,
            mockTimestamp,
            mockTimestamp,
          ],
        },
        {
          sql: expect.stringContaining('INSERT INTO exercise_templates'),
          params: [
            'exercise-2',
            'template-1',
            'Overhead Press',
            1,
            3,
            10,
            95,
            null,
            mockTimestamp,
            mockTimestamp,
          ],
        },
      ]);
    });

    it('should create template without exercises', async () => {
      (helpers.transaction as jest.Mock).mockResolvedValueOnce(undefined);

      const template: WorkoutTemplate = {
        id: 'template-1',
        name: 'Push Day',
        exercises: [],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      await createTemplateWithExercises(template);

      expect(helpers.transaction).toHaveBeenCalledWith([
        {
          sql: expect.stringContaining('INSERT INTO workout_templates'),
          params: [
            'template-1',
            'Push Day',
            null,
            mockTimestamp,
            mockTimestamp,
            null,
          ],
        },
      ]);
    });
  });

  describe('updateTemplateWithExercises', () => {
    it('should update template and replace exercises in transaction', async () => {
      (helpers.transaction as jest.Mock).mockResolvedValueOnce(undefined);

      const template: WorkoutTemplate = {
        id: 'template-1',
        name: 'Updated Push Day',
        description: 'Updated description',
        exercises: [
          {
            id: 'exercise-new',
            workoutTemplateId: 'template-1',
            name: 'New Exercise',
            order: 0,
            targetSets: 3,
            targetReps: 10,
            targetWeight: 185,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          },
        ],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp + 1000,
      };

      await updateTemplateWithExercises(template);

      expect(helpers.transaction).toHaveBeenCalledWith([
        {
          sql: expect.stringContaining('UPDATE workout_templates'),
          params: [
            'Updated Push Day',
            'Updated description',
            mockTimestamp + 1000,
            'template-1',
          ],
        },
        {
          sql: 'DELETE FROM exercise_templates WHERE workout_template_id = ?',
          params: ['template-1'],
        },
        {
          sql: expect.stringContaining('INSERT INTO exercise_templates'),
          params: [
            'exercise-new',
            'template-1',
            'New Exercise',
            0,
            3,
            10,
            185,
            null,
            mockTimestamp,
            mockTimestamp,
          ],
        },
      ]);
    });

    it('should handle update with no exercises', async () => {
      (helpers.transaction as jest.Mock).mockResolvedValueOnce(undefined);

      const template: WorkoutTemplate = {
        id: 'template-1',
        name: 'Updated Push Day',
        exercises: [],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp + 1000,
      };

      await updateTemplateWithExercises(template);

      expect(helpers.transaction).toHaveBeenCalledWith([
        {
          sql: expect.stringContaining('UPDATE workout_templates'),
          params: [
            'Updated Push Day',
            null,
            mockTimestamp + 1000,
            'template-1',
          ],
        },
        {
          sql: 'DELETE FROM exercise_templates WHERE workout_template_id = ?',
          params: ['template-1'],
        },
      ]);
    });
  });

  describe('updateTemplateLastUsed', () => {
    it('should update template lastUsed timestamp', async () => {
      (helpers.execute as jest.Mock).mockResolvedValueOnce({
        lastInsertRowId: 0,
        changes: 1,
      });

      await updateTemplateLastUsed('template-1', mockTimestamp + 5000);

      expect(helpers.execute).toHaveBeenCalledWith(
        'UPDATE workout_templates SET last_used = ?, updated_at = ? WHERE id = ?',
        [mockTimestamp + 5000, mockTimestamp + 5000, 'template-1']
      );
    });
  });
});
