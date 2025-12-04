/**
 * Unit tests for History Service
 */

import * as sessionRepo from "@/src/lib/db/repositories/sessions";
import { WorkoutSession } from "@/types";
import {
  deleteWorkout,
  getDisplayNameForHistoryItem,
  getSecondaryInfoForHistoryItem,
  getWorkoutById,
  getWorkoutHistory,
  getWorkoutType,
  WorkoutSummary,
} from "../historyService";

// Mock repository
jest.mock("@/src/lib/db/repositories/sessions");

describe("History Service", () => {
  const mockTimestamp = 1640000000000;

  // Helper to create mock sessions with specific configurations
  const createMockSession = (
    overrides: Partial<WorkoutSession> = {}
  ): WorkoutSession => ({
    id: "sess-1",
    name: "Workout A",
    startTime: mockTimestamp,
    endTime: mockTimestamp + 3600,
    duration: 3600,
    exercises: [],
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getWorkoutHistory", () => {
    it("should fetch sessions and calculate metrics correctly", async () => {
      // Mock a session with mixed complete/incomplete sets
      const mockSession = createMockSession({
        exercises: [
          {
            id: "ex-1",
            workoutSessionId: "sess-1",
            name: "Squat",
            order: 0,
            sets: [
              { reps: 10, weight: 100, completed: true } as any, // Vol: 1000
              { reps: 5, weight: 200, completed: true } as any, // Vol: 1000
              { reps: 10, weight: 100, completed: false } as any, // Ignored
            ],
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          },
        ],
      });

      (sessionRepo.getCompletedSessions as jest.Mock).mockResolvedValue([
        mockSession,
      ]);

      const history = await getWorkoutHistory();

      expect(history).toHaveLength(1);

      const summary = history[0];

      // Basic Fields
      expect(summary.id).toBe("sess-1");
      expect(summary.name).toBe("Workout A");

      // Metrics
      expect(summary.totalSets).toBe(2); // Only completed
      expect(summary.totalVolume).toBe(2000); // 1000 + 1000
      expect(summary.exerciseCount).toBe(1);
    });

    it("should pass limit to repository", async () => {
      (sessionRepo.getCompletedSessions as jest.Mock).mockResolvedValue([]);

      await getWorkoutHistory(5);

      expect(sessionRepo.getCompletedSessions).toHaveBeenCalledWith(true, 5);
    });

    it("should handle empty sessions correctly (zero metrics)", async () => {
      const emptySession = createMockSession({ exercises: [] });
      (sessionRepo.getCompletedSessions as jest.Mock).mockResolvedValue([
        emptySession,
      ]);

      const history = await getWorkoutHistory();

      expect(history[0].totalVolume).toBe(0);
      expect(history[0].totalSets).toBe(0);
    });
  });

  describe("Delegated Operations", () => {
    describe("getWorkoutById", () => {
      it("should delegate to repository", async () => {
        const mockSession = createMockSession();
        (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(
          mockSession
        );

        const result = await getWorkoutById("sess-1");

        expect(result).toEqual(mockSession);
        expect(sessionRepo.getSessionById).toHaveBeenCalledWith("sess-1", true);
      });
    });

    describe("deleteWorkout", () => {
      it("should delegate to repository", async () => {
        (sessionRepo.deleteSession as jest.Mock).mockResolvedValue(undefined);

        await deleteWorkout("sess-1");

        expect(sessionRepo.deleteSession).toHaveBeenCalledWith("sess-1");
      });
    });
  });

  describe("Display Logic Utilities", () => {
    // --- getDisplayNameForHistoryItem ---
    describe("getDisplayNameForHistoryItem", () => {
      it("should return program day name if available", () => {
        const item = {
          name: "Generic Workout",
          programDayName: "Leg Day Phase 1",
        } as WorkoutSummary;

        expect(getDisplayNameForHistoryItem(item)).toBe("Leg Day Phase 1");
      });

      it("should fallback to workout name if not from program", () => {
        const item = {
          name: "My Custom Workout",
          programDayName: undefined,
        } as WorkoutSummary;

        expect(getDisplayNameForHistoryItem(item)).toBe("My Custom Workout");
      });
    });

    // --- getWorkoutType ---
    describe("getWorkoutType", () => {
      it("should identify program workouts", () => {
        const item = { programId: "p1", programDayId: "d1" } as WorkoutSummary;
        expect(getWorkoutType(item)).toBe("program");
      });

      it("should identify template workouts", () => {
        const item = { templateId: "t1" } as WorkoutSummary;
        expect(getWorkoutType(item)).toBe("template");
      });

      it("should identify free workouts (no program/template)", () => {
        const item = { name: "Free" } as WorkoutSummary;
        expect(getWorkoutType(item)).toBe("free");
      });
    });

    // --- getSecondaryInfoForHistoryItem ---
    describe("getSecondaryInfoForHistoryItem", () => {
      it('should return "Program Day" for program workouts', () => {
        const item = { programId: "p1", programDayId: "d1" } as WorkoutSummary;
        expect(getSecondaryInfoForHistoryItem(item)).toBe("Program Day");
      });

      it('should return "from TemplateName" if names differ', () => {
        const item = {
          templateId: "t1",
          name: "Afternoon Lift",
          templateName: "Full Body A",
        } as WorkoutSummary;

        expect(getSecondaryInfoForHistoryItem(item)).toBe("from Full Body A");
      });

      it("should return undefined for templates if name matches (redundant info)", () => {
        const item = {
          templateId: "t1",
          name: "Full Body A",
          templateName: "Full Body A",
        } as WorkoutSummary;

        expect(getSecondaryInfoForHistoryItem(item)).toBeUndefined();
      });

      it("should return undefined for free workouts", () => {
        const item = { name: "Free Lift" } as WorkoutSummary;
        expect(getSecondaryInfoForHistoryItem(item)).toBeUndefined();
      });
    });
  });
});
