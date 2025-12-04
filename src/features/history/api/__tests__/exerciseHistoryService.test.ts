/**
 * Unit tests for Exercise History Service
 */

import * as setsRepo from "@/src/lib/db/repositories/sets";
import { ExerciseHistoryRow } from "@/src/lib/db/repositories/sets";
import { WorkoutSet } from "@/types";
import {
  getExercisePerformanceHistory,
  getExerciseStatistics,
} from "../exerciseHistoryService";

// Mock dependencies
jest.mock("@/src/lib/db/repositories/sets");

describe("Exercise History Service", () => {
  const mockExerciseName = "Squat";
  const mockTimestamp = 1640000000000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getExercisePerformanceHistory", () => {
    const mockHistoryRow: ExerciseHistoryRow = {
      workoutSessionId: "sess-1",
      workoutName: "Leg Day",
      workoutDate: mockTimestamp,
      exerciseId: "ex-1",
      totalSets: 3,
      completedSets: 2,
      totalVolume: 1000,
      maxWeight: 225,
      totalReps: 10,
      programDayName: "Week 1",
      programId: "p1",
      programDayId: "pd1",
    };

    const mockSets: WorkoutSet[] = [
      { id: "s1", completed: true, weight: 225, reps: 5 } as WorkoutSet,
      { id: "s2", completed: true, weight: 225, reps: 5 } as WorkoutSet,
      { id: "s3", completed: false, weight: 225, reps: 5 } as WorkoutSet, // Incomplete
    ];

    it("should aggregate history rows with their sets", async () => {
      (setsRepo.getExerciseHistory as jest.Mock).mockResolvedValue([
        mockHistoryRow,
      ]);
      (setsRepo.getSetsByExerciseAndSession as jest.Mock).mockResolvedValue(
        mockSets
      );

      const result = await getExercisePerformanceHistory(mockExerciseName);

      expect(result).toHaveLength(1);

      const perf = result[0];
      expect(perf.workoutSessionId).toBe("sess-1");
      expect(perf.maxWeight).toBe(225);

      // Verify joined fields
      expect(perf.programDayName).toBe("Week 1");
      expect(perf.programId).toBe("p1");

      // Verify DB calls
      expect(setsRepo.getExerciseHistory).toHaveBeenCalledWith(
        mockExerciseName
      );
      expect(setsRepo.getSetsByExerciseAndSession).toHaveBeenCalledWith(
        "ex-1",
        "sess-1"
      );
    });

    it("should filter out incomplete sets", async () => {
      (setsRepo.getExerciseHistory as jest.Mock).mockResolvedValue([
        mockHistoryRow,
      ]);
      (setsRepo.getSetsByExerciseAndSession as jest.Mock).mockResolvedValue(
        mockSets
      );

      const result = await getExercisePerformanceHistory(mockExerciseName);

      // Only 2 of the 3 sets were completed
      expect(result[0].sets).toHaveLength(2);
      expect(result[0].sets.every((s) => s.completed)).toBe(true);
    });

    it("should handle empty history", async () => {
      (setsRepo.getExerciseHistory as jest.Mock).mockResolvedValue([]);

      const result = await getExercisePerformanceHistory(mockExerciseName);

      expect(result).toEqual([]);
      expect(setsRepo.getSetsByExerciseAndSession).not.toHaveBeenCalled();
    });
  });

  describe("getExerciseStatistics", () => {
    const historyData: ExerciseHistoryRow[] = [
      {
        workoutDate: 2000, // Newer
        totalVolume: 1000,
        completedSets: 2,
        totalReps: 10,
        maxWeight: 100,
        // ...other required fields irrelevant to stats math
        workoutSessionId: "1",
        workoutName: "A",
        exerciseId: "e1",
        totalSets: 2,
      },
      {
        workoutDate: 1000, // Older
        totalVolume: 2000,
        completedSets: 4,
        totalReps: 20,
        maxWeight: 200, // Max across all
        workoutSessionId: "2",
        workoutName: "B",
        exerciseId: "e2",
        totalSets: 4,
      },
    ];

    it("should calculate statistics correctly", async () => {
      (setsRepo.getExerciseHistory as jest.Mock).mockResolvedValue(historyData);

      const stats = await getExerciseStatistics(mockExerciseName);

      expect(stats.totalWorkouts).toBe(2);
      expect(stats.totalVolume).toBe(3000); // 1000 + 2000
      expect(stats.totalSets).toBe(6); // 2 + 4
      expect(stats.totalReps).toBe(30); // 10 + 20
      expect(stats.maxWeight).toBe(200); // Max(100, 200)

      expect(stats.avgVolume).toBe(1500); // 3000 / 2
      expect(stats.avgSets).toBe(3); // 6 / 2

      // Should pick date from first element (assumed newest by repo sort order)
      expect(stats.lastPerformed).toBe(2000);
    });

    it("should return zeros for empty history", async () => {
      (setsRepo.getExerciseHistory as jest.Mock).mockResolvedValue([]);

      const stats = await getExerciseStatistics(mockExerciseName);

      expect(stats).toEqual({
        totalWorkouts: 0,
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
        maxWeight: 0,
        avgVolume: 0,
        avgSets: 0,
      });
    });
  });
});
