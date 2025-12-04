/**
 * Unit tests for Workout Service
 */

import * as sessionRepo from "@/src/lib/db/repositories/sessions";
import * as templateRepo from "@/src/lib/db/repositories/templates";
import * as idUtils from "@/src/lib/utils/id";
import { WorkoutTemplate } from "@/types";
import {
  addExerciseToSession,
  removeExerciseFromSession,
  startEmptyWorkout,
  startWorkoutFromTemplate,
} from "../workoutService";

// Mock dependencies
jest.mock("@/src/lib/db/repositories/sessions");
jest.mock("@/src/lib/db/repositories/templates");
jest.mock("@/src/lib/utils/id");

describe("Workout Service", () => {
  const mockTimestamp = 1640000000000;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Date.now
    jest.spyOn(Date, "now").mockReturnValue(mockTimestamp);

    // Mock generateId to return predictable values
    let idCounter = 0;
    (idUtils.generateId as jest.Mock).mockImplementation(
      () => `id-${++idCounter}`
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("startWorkoutFromTemplate", () => {
    const mockTemplate: WorkoutTemplate = {
      id: "template-1",
      name: "Full Body",
      exercises: [
        {
          id: "temp-ex-1",
          workoutTemplateId: "template-1",
          name: "Squat",
          order: 0,
          notes: "Deep",
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          id: "temp-ex-2",
          workoutTemplateId: "template-1",
          name: "Bench",
          order: 1,
          notes: undefined,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ],
      createdAt: 1000,
      updatedAt: 1000,
      lastUsed: 1000, // Corrected property name
    };

    it("should create session with copied exercises and update template", async () => {
      (sessionRepo.createSessionWithExercises as jest.Mock).mockResolvedValue(
        undefined
      );
      (templateRepo.updateTemplateLastUsed as jest.Mock).mockResolvedValue(
        undefined
      );

      const session = await startWorkoutFromTemplate(mockTemplate);

      // Verify Session Structure
      expect(session).toEqual({
        id: "id-1",
        templateId: "template-1",
        templateName: "Full Body",
        name: "Full Body",
        startTime: mockTimestamp,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        exercises: expect.arrayContaining([
          expect.objectContaining({ name: "Squat", order: 0, notes: "Deep" }),
          expect.objectContaining({
            name: "Bench",
            order: 1,
            notes: undefined,
          }),
        ]),
      });

      // Verify DB calls
      expect(sessionRepo.createSessionWithExercises).toHaveBeenCalledWith(
        session
      );
      expect(templateRepo.updateTemplateLastUsed).toHaveBeenCalledWith(
        "template-1",
        mockTimestamp
      );
    });

    it("should handle template with no exercises", async () => {
      const emptyTemplate = { ...mockTemplate, exercises: [] };
      const session = await startWorkoutFromTemplate(emptyTemplate);

      expect(session.exercises).toEqual([]);
      expect(sessionRepo.createSessionWithExercises).toHaveBeenCalled();
    });

    it("should fall back to array index if exercise order is undefined", async () => {
      const unorderedTemplate = {
        ...mockTemplate,
        exercises: [{ ...mockTemplate.exercises[0], order: undefined } as any],
      };

      const session = await startWorkoutFromTemplate(unorderedTemplate);
      expect(session.exercises[0].order).toBe(0); // Should be index 0
    });
  });

  describe("startEmptyWorkout", () => {
    it("should create a session with default name", async () => {
      (sessionRepo.createSessionWithExercises as jest.Mock).mockResolvedValue(
        undefined
      );

      const session = await startEmptyWorkout();

      expect(session).toEqual({
        id: "id-1",
        name: "Workout",
        exercises: [],
        startTime: mockTimestamp,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      });

      expect(sessionRepo.createSessionWithExercises).toHaveBeenCalledWith(
        session
      );
    });

    it("should create a session with provided name", async () => {
      const session = await startEmptyWorkout("Leg Day");
      expect(session.name).toBe("Leg Day");
    });
  });

  describe("addExerciseToSession", () => {
    it("should create exercise with correct order", async () => {
      // Mock existing exercises to verify order calculation
      (sessionRepo.getExercisesBySessionId as jest.Mock).mockResolvedValue([
        { id: "ex-1" }, // Order 0
        { id: "ex-2" }, // Order 1
      ]);
      (sessionRepo.createExercise as jest.Mock).mockResolvedValue(undefined);

      const result = await addExerciseToSession(
        "session-1",
        "Deadlift",
        "Heavy"
      );

      expect(result).toEqual({
        id: "id-1",
        workoutSessionId: "session-1",
        name: "Deadlift",
        order: 2, // Length was 2, so next is 2
        notes: "Heavy",
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        sets: [],
      });

      expect(sessionRepo.createExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          order: 2,
        })
      );
    });

    it("should be first exercise (order 0) if session is empty", async () => {
      (sessionRepo.getExercisesBySessionId as jest.Mock).mockResolvedValue([]);

      const result = await addExerciseToSession("session-1", "Squat");

      expect(result.order).toBe(0);
    });
  });

  describe("removeExerciseFromSession", () => {
    it("should delegate to repository delete", async () => {
      (sessionRepo.deleteExercise as jest.Mock).mockResolvedValue(undefined);

      await removeExerciseFromSession("ex-1");

      expect(sessionRepo.deleteExercise).toHaveBeenCalledWith("ex-1");
    });
  });
});
