/**
 * Unit tests for Analytics Repository
 */

import { buildFilterWhereClause } from "@/src/features/analytics/types/filters";
import * as dbHelpers from "../../helpers";
import {
  getAverageWorkoutDuration,
  getExerciseProgression,
  getPRCount,
  getPRTimeline,
  getTotalVolume,
  getTotalWorkoutCount,
  getUniqueExerciseNames,
  getVolumeOverTime,
} from "../analytics";

// Mock database helpers
jest.mock("../../helpers");

// Mock the filter builder to isolate repository testing
jest.mock("@/src/features/analytics/types/filters", () => ({
  buildFilterWhereClause: jest.fn(),
}));

describe("Analytics Repository", () => {
  const mockStartDate = 1000;
  const mockEndDate = 2000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // 1. Volume Over Time
  // ==========================================================================
  describe("getVolumeOverTime", () => {
    const mockVolumeRow = {
      date_str: "2023-01-01",
      date: 1672531200000,
      total_volume: 1000,
      total_sets: 10,
      total_reps: 50,
    };

    it("should return volume data points correctly mapped", async () => {
      (dbHelpers.query as jest.Mock).mockResolvedValue([mockVolumeRow]);

      const result = await getVolumeOverTime(mockStartDate, mockEndDate);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: 1672531200000,
        totalVolume: 1000,
        totalSets: 10,
        totalReps: 50,
      });
      expect(dbHelpers.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        expect.arrayContaining([mockStartDate, mockEndDate])
      );
    });

    it("should apply filters when provided", async () => {
      (dbHelpers.query as jest.Mock).mockResolvedValue([]);

      // Mock the filter builder to return a SQL fragment
      (buildFilterWhereClause as jest.Mock).mockReturnValue({
        whereClause: "wss.program_id = ?",
        params: ["prog-1"],
      });

      await getVolumeOverTime(mockStartDate, mockEndDate, {
        programId: "prog-1",
      } as any);

      expect(dbHelpers.query).toHaveBeenCalledWith(
        expect.stringContaining("AND wss.program_id = ?"),
        // Should contain original params + filter params
        expect.arrayContaining([mockStartDate, mockEndDate, "prog-1"])
      );
    });

    it("should handle null values in DB rows (fallback to 0)", async () => {
      (dbHelpers.query as jest.Mock).mockResolvedValue([
        {
          ...mockVolumeRow,
          total_volume: null,
          total_sets: null,
          total_reps: null,
        },
      ]);

      const result = await getVolumeOverTime(mockStartDate, mockEndDate);

      expect(result[0].totalVolume).toBe(0);
      expect(result[0].totalSets).toBe(0);
      expect(result[0].totalReps).toBe(0);
    });
  });

  // ==========================================================================
  // 2. Exercise Progression
  // ==========================================================================
  describe("getExerciseProgression", () => {
    const mockProgressionRows = [
      {
        date: 2000, // Newer
        workout_session_id: "ws-2",
        max_weight: 100,
        total_volume: 1000,
        total_sets: 5,
        total_reps: 25,
      },
      {
        date: 1000, // Older
        workout_session_id: "ws-1",
        max_weight: 90,
        total_volume: 900,
        total_sets: 5,
        total_reps: 25,
      },
    ];

    it("should return reversed data (chronological order)", async () => {
      // DB returns DESC (Newest first)
      (dbHelpers.query as jest.Mock).mockResolvedValue(mockProgressionRows);

      const result = await getExerciseProgression("Bench Press");

      // Function should reverse it to ASC (Oldest first)
      expect(result[0].date).toBe(1000); // Older first
      expect(result[1].date).toBe(2000); // Newer second
      expect(result).toHaveLength(2);
    });

    it("should include filter params and limit", async () => {
      (dbHelpers.query as jest.Mock).mockResolvedValue([]);
      (buildFilterWhereClause as jest.Mock).mockReturnValue({
        whereClause: "mock_filter",
        params: ["filter_val"],
      });

      await getExerciseProgression("Bench Press", 10, {
        programId: "p1",
      } as any);

      expect(dbHelpers.query).toHaveBeenCalledWith(
        expect.stringContaining("mock_filter"),
        // Params order: [exerciseName, ...filterParams, limit]
        ["Bench Press", "filter_val", 10]
      );
    });

    it("should ignore filter if buildFilterWhereClause returns empty clause", async () => {
      (dbHelpers.query as jest.Mock).mockResolvedValue([]);

      // Mock returns empty clause
      (buildFilterWhereClause as jest.Mock).mockReturnValue({
        whereClause: "",
        params: [],
      });

      // We pass a filter object, but the builder returns nothing relevant
      await getExerciseProgression("Bench Press", 50, {} as any);

      expect(dbHelpers.query).toHaveBeenCalledWith(
        // Verify we simply have the base query structure
        expect.stringContaining("LOWER(e.name) = LOWER(?)"),
        // KEY CHECK: Verify params list is just [name, limit] with NO filter params added
        ["Bench Press", 50]
      );
    });
  });

  // ==========================================================================
  // 3. PR Timeline
  // ==========================================================================
  describe("getPRTimeline", () => {
    it("should map PR rows correctly", async () => {
      (dbHelpers.query as jest.Mock).mockResolvedValue([
        {
          date: 1000,
          exercise_name: "Squat",
          reps: 5,
          weight: 315,
          workout_session_id: "ws-1",
        },
      ]);

      const result = await getPRTimeline(mockStartDate, mockEndDate);

      expect(result[0]).toEqual({
        date: 1000,
        exerciseName: "Squat",
        reps: 5,
        weight: 315,
        workoutSessionId: "ws-1",
      });
    });

    it("should integrate filters correctly", async () => {
      (dbHelpers.query as jest.Mock).mockResolvedValue([]);
      (buildFilterWhereClause as jest.Mock).mockReturnValue({
        whereClause: "wss.template_id = ?",
        params: ["temp-1"],
      });

      await getPRTimeline(mockStartDate, mockEndDate, {
        templateId: "temp-1",
      } as any);

      expect(dbHelpers.query).toHaveBeenCalledWith(
        expect.stringContaining("AND wss.template_id = ?"),
        [mockStartDate, mockEndDate, "temp-1"]
      );
    });
  });

  // ==========================================================================
  // 4. Unique Exercise Names
  // ==========================================================================
  describe("getUniqueExerciseNames", () => {
    it("should return plain string array", async () => {
      (dbHelpers.query as jest.Mock).mockResolvedValue([
        { name: "Bench" },
        { name: "Squat" },
      ]);

      const result = await getUniqueExerciseNames();

      expect(result).toEqual(["Bench", "Squat"]);
    });

    it("should work with filters", async () => {
      (dbHelpers.query as jest.Mock).mockResolvedValue([]);
      (buildFilterWhereClause as jest.Mock).mockReturnValue({
        whereClause: "filter",
        params: ["val"],
      });

      await getUniqueExerciseNames({ programId: "p1" } as any);

      expect(dbHelpers.query).toHaveBeenCalledWith(
        expect.stringContaining("filter"),
        ["val"]
      );
    });
  });

  // ==========================================================================
  // 5. Aggregates (Counts, Sums, Averages)
  // ==========================================================================
  describe("Aggregates", () => {
    // --- getTotalWorkoutCount ---
    describe("getTotalWorkoutCount", () => {
      it("should return count from result", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ count: 42 });
        const result = await getTotalWorkoutCount(mockStartDate, mockEndDate);
        expect(result).toBe(42);
      });

      it("should return 0 if result is null (no row)", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        const result = await getTotalWorkoutCount(mockStartDate, mockEndDate);
        expect(result).toBe(0);
      });

      it("should return 0 if count property is missing or null", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ count: null });
        const result = await getTotalWorkoutCount(mockStartDate, mockEndDate);
        expect(result).toBe(0);
      });

      it('should use "ws" alias for filter building', async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ count: 0 });
        (buildFilterWhereClause as jest.Mock).mockReturnValue({
          whereClause: "x",
          params: [],
        });

        await getTotalWorkoutCount(mockStartDate, mockEndDate, {} as any);

        expect(buildFilterWhereClause).toHaveBeenCalledWith(
          expect.any(Object),
          "ws"
        );
      });

      // Branch Coverage: Filter provided, but clause is empty
      it("should handle empty filter clause gracefully", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ count: 0 });
        (buildFilterWhereClause as jest.Mock).mockReturnValue({
          whereClause: "",
          params: [],
        });

        await getTotalWorkoutCount(mockStartDate, mockEndDate, {
          someFilter: true,
        } as any);

        expect(dbHelpers.getOne).toHaveBeenCalledWith(
          // Verify the base SQL is still there
          expect.stringContaining("WHERE"),
          // KEY CHECK: Verify params contain ONLY [start, end], meaning no extra filter params were added
          [mockStartDate, mockEndDate]
        );
      });
    });

    // --- getTotalVolume ---
    describe("getTotalVolume", () => {
      it("should return volume sum", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({
          total_volume: 5000,
        });
        const result = await getTotalVolume(mockStartDate, mockEndDate);
        expect(result).toBe(5000);
      });

      it("should return 0 if total_volume is explicitly null", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({
          total_volume: null,
        });
        const result = await getTotalVolume(mockStartDate, mockEndDate);
        expect(result).toBe(0);
      });

      it("should return 0 if db result is null (no row)", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        const result = await getTotalVolume(mockStartDate, mockEndDate);
        expect(result).toBe(0);
      });

      // Branch Coverage: Filter provided, but clause is empty
      it("should handle empty filter clause", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ total_volume: 0 });
        (buildFilterWhereClause as jest.Mock).mockReturnValue({
          whereClause: "",
          params: [],
        });

        await getTotalVolume(mockStartDate, mockEndDate, {
          programId: "p1",
        } as any);

        expect(dbHelpers.getOne).toHaveBeenCalledWith(
          expect.stringContaining("WHERE"),
          [mockStartDate, mockEndDate]
        );
      });
    });

    // --- getAverageWorkoutDuration ---
    describe("getAverageWorkoutDuration", () => {
      it("should return average duration", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({
          avg_duration: 3600,
        });
        const result = await getAverageWorkoutDuration(
          mockStartDate,
          mockEndDate
        );
        expect(result).toBe(3600);
      });

      it("should return 0 if avg_duration is explicitly null", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({
          avg_duration: null,
        });
        const result = await getAverageWorkoutDuration(
          mockStartDate,
          mockEndDate
        );
        expect(result).toBe(0);
      });

      it("should return 0 if result is null", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        const result = await getAverageWorkoutDuration(
          mockStartDate,
          mockEndDate
        );
        expect(result).toBe(0);
      });

      // Branch Coverage: Filter provided, but clause is empty
      it("should handle empty filter clause", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ avg_duration: 0 });
        (buildFilterWhereClause as jest.Mock).mockReturnValue({
          whereClause: "",
          params: [],
        });

        await getAverageWorkoutDuration(mockStartDate, mockEndDate, {
          programId: "p1",
        } as any);

        expect(dbHelpers.getOne).toHaveBeenCalledWith(
          expect.stringContaining("WHERE"),
          [mockStartDate, mockEndDate]
        );
      });
    });

    // --- getPRCount ---
    describe("getPRCount", () => {
      it("should return count", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ count: 10 });
        const result = await getPRCount(mockStartDate, mockEndDate);
        expect(result).toBe(10);
      });

      it("should return 0 if count is explicitly null", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ count: null });
        const result = await getPRCount(mockStartDate, mockEndDate);
        expect(result).toBe(0);
      });

      it("should return 0 if result is null", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        const result = await getPRCount(mockStartDate, mockEndDate);
        expect(result).toBe(0);
      });

      it('should integrate filters using "wss" alias', async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ count: 0 });
        (buildFilterWhereClause as jest.Mock).mockReturnValue({
          whereClause: "x",
          params: [],
        });

        await getPRCount(mockStartDate, mockEndDate, {} as any);

        expect(buildFilterWhereClause).toHaveBeenCalledWith(
          expect.any(Object),
          "wss"
        );
        expect(dbHelpers.getOne).toHaveBeenCalledWith(
          expect.stringContaining("AND x"),
          expect.any(Array)
        );
      });
    });
  });
});
