/**
 * Unit tests for PR Records Repository
 */

import { PRRecord } from "@/types";
import * as dbHelpers from "../../helpers";
import {
  createPR,
  deletePR,
  deletePRsByExerciseName,
  getAllPRs,
  getAllPRsWithContext,
  getExerciseNamesWithPRs,
  getPRByExerciseAndReps,
  getPRById,
  getPRCountByExerciseName,
  getPRsByDateRange,
  getPRsByExerciseName,
  getPRsBySessionId,
  getPRsWithContextByExerciseName,
  getRecentPRs,
  getTotalPRCount,
  isNewPR,
  recordPR,
  updatePR,
} from "../pr-records";

// Mock dependencies
jest.mock("../../helpers");

describe("PR Records Repository", () => {
  const mockTimestamp = 1640000000000;

  // Standard Mock Data
  const mockPRRow = {
    id: "pr-123",
    exercise_name: "Bench Press",
    reps: 5,
    weight: 100,
    workout_session_id: "session-1",
    achieved_at: mockTimestamp,
    created_at: mockTimestamp - 1000,
  };

  const mockPRResult: PRRecord = {
    id: "pr-123",
    exerciseName: "Bench Press",
    reps: 5,
    weight: 100,
    workoutSessionId: "session-1",
    achievedAt: mockTimestamp,
    createdAt: mockTimestamp - 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Basic Queries", () => {
    describe("getAllPRs", () => {
      it("should return all PRs ordered by date", async () => {
        (dbHelpers.query as jest.Mock).mockResolvedValue([mockPRRow]);

        const result = await getAllPRs();

        expect(result).toEqual([mockPRResult]);
        expect(dbHelpers.query).toHaveBeenCalledWith(
          expect.stringContaining(
            "SELECT * FROM pr_records ORDER BY achieved_at DESC"
          )
        );
      });
    });

    describe("getPRsByExerciseName", () => {
      it("should return PRs for specific exercise ordered by reps", async () => {
        (dbHelpers.query as jest.Mock).mockResolvedValue([mockPRRow]);

        const result = await getPRsByExerciseName("Bench Press");

        expect(result).toEqual([mockPRResult]);
        expect(dbHelpers.query).toHaveBeenCalledWith(
          expect.stringContaining("WHERE exercise_name = ?"),
          ["Bench Press"]
        );
      });
    });

    describe("getPRsBySessionId", () => {
      it("should return PRs for specific session", async () => {
        (dbHelpers.query as jest.Mock).mockResolvedValue([mockPRRow]);

        const result = await getPRsBySessionId("session-1");

        expect(result).toEqual([mockPRResult]);
        expect(dbHelpers.query).toHaveBeenCalledWith(
          expect.stringContaining("WHERE workout_session_id = ?"),
          ["session-1"]
        );
      });
    });

    describe("getPRById", () => {
      it("should return specific PR by ID", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockPRRow);

        const result = await getPRById("pr-123");

        expect(result).toEqual(mockPRResult);
        expect(dbHelpers.getOne).toHaveBeenCalledWith(
          expect.stringContaining("WHERE id = ?"),
          ["pr-123"]
        );
      });

      it("should return null if PR not found", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);

        const result = await getPRById("non-existent");

        expect(result).toBeNull();
      });
    });

    describe("getPRByExerciseAndReps", () => {
      it("should return PR for specific exercise and rep count", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockPRRow);

        const result = await getPRByExerciseAndReps("Bench Press", 5);

        expect(result).toEqual(mockPRResult);
        expect(dbHelpers.getOne).toHaveBeenCalledWith(
          expect.stringContaining("WHERE exercise_name = ? AND reps = ?"),
          ["Bench Press", 5]
        );
      });
    });
  });

  describe("Mutations", () => {
    describe("createPR", () => {
      it("should insert new PR record", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await createPR(mockPRResult);

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO pr_records"),
          [
            "pr-123",
            "Bench Press",
            5,
            100,
            "session-1",
            mockTimestamp,
            mockTimestamp - 1000,
          ]
        );
      });
    });

    describe("updatePR", () => {
      it("should update specific fields", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await updatePR("pr-123", {
          weight: 105,
          achievedAt: mockTimestamp + 1000,
        });

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining(
            "UPDATE pr_records SET weight = ?, achieved_at = ?"
          ),
          [105, mockTimestamp + 1000, "pr-123"]
        );
      });

      it("should do nothing if no updates provided", async () => {
        await updatePR("pr-123", {});
        expect(dbHelpers.execute).not.toHaveBeenCalled();
      });

      it("should update only one field and ignore undefined ones", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        // Only updating workoutSessionId, leaving weight and achievedAt undefined
        await updatePR("pr-123", { workoutSessionId: "session-2" });

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining(
            "UPDATE pr_records SET workout_session_id = ? WHERE id = ?"
          ),
          ["session-2", "pr-123"]
        );
      });
    });

    describe("deletePR", () => {
      it("should delete PR by ID", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await deletePR("pr-123");

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM pr_records WHERE id = ?"),
          ["pr-123"]
        );
      });
    });

    describe("deletePRsByExerciseName", () => {
      it("should delete all PRs for an exercise", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await deletePRsByExerciseName("Bench Press");

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining(
            "DELETE FROM pr_records WHERE exercise_name = ?"
          ),
          ["Bench Press"]
        );
      });
    });
  });

  describe("Business Logic", () => {
    describe("isNewPR", () => {
      it("should return true if no previous PR exists", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);

        const result = await isNewPR("Squat", 5, 200);

        expect(result).toBe(true);
      });

      it("should return true if new weight is higher", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({
          ...mockPRRow,
          weight: 190,
        });

        const result = await isNewPR("Squat", 5, 200);

        expect(result).toBe(true);
      });

      it("should return false if new weight is lower or equal", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({
          ...mockPRRow,
          weight: 200,
        });

        const result = await isNewPR("Squat", 5, 195);

        expect(result).toBe(false);
      });
    });

    describe("recordPR", () => {
      it("should create new PR if none exists", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null); // No existing PR
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await recordPR(mockPRResult);

        // Should verify that createPR logic was triggered (which calls execute)
        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO pr_records"),
          expect.any(Array)
        );
      });

      it("should replace existing PR if new one is better", async () => {
        // Existing PR is weaker (90 vs 100)
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({
          ...mockPRRow,
          weight: 90,
          id: "old-pr",
        });
        (dbHelpers.transaction as jest.Mock).mockResolvedValue(undefined);

        await recordPR(mockPRResult);

        expect(dbHelpers.transaction).toHaveBeenCalledWith([
          {
            sql: "DELETE FROM pr_records WHERE id = ?",
            params: ["old-pr"],
          },
          {
            sql: expect.stringContaining("INSERT INTO pr_records"),
            params: expect.arrayContaining(["pr-123", 100]),
          },
        ]);
      });

      it("should ignore new PR if existing one is better", async () => {
        // Existing PR is stronger (110 vs 100)
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({
          ...mockPRRow,
          weight: 110,
        });

        await recordPR(mockPRResult);

        expect(dbHelpers.execute).not.toHaveBeenCalled();
        expect(dbHelpers.transaction).not.toHaveBeenCalled();
      });
    });
  });

  describe("Aggregates and Filters", () => {
    describe("getExerciseNamesWithPRs", () => {
      it("should return list of unique exercise names", async () => {
        (dbHelpers.query as jest.Mock).mockResolvedValue([
          { exercise_name: "Bench" },
          { exercise_name: "Squat" },
        ]);

        const result = await getExerciseNamesWithPRs();

        expect(result).toEqual(["Bench", "Squat"]);
        expect(dbHelpers.query).toHaveBeenCalledWith(
          expect.stringContaining("SELECT DISTINCT exercise_name")
        );
      });
    });

    describe("getPRCountByExerciseName", () => {
      it("should return count for specific exercise", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ count: 5 });

        const result = await getPRCountByExerciseName("Bench Press");

        expect(result).toBe(5);
      });

      it("should return 0 if result is null", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        const result = await getPRCountByExerciseName("Bench Press");
        expect(result).toBe(0);
      });
    });

    describe("getTotalPRCount", () => {
      it("should return total count", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({ count: 15 });
        const result = await getTotalPRCount();
        expect(result).toBe(15);
      });
    });

    describe("getRecentPRs", () => {
      it("should return limited recent PRs", async () => {
        (dbHelpers.query as jest.Mock).mockResolvedValue([mockPRRow]);

        const result = await getRecentPRs(5);

        expect(result).toHaveLength(1);
        expect(dbHelpers.query).toHaveBeenCalledWith(
          expect.stringContaining("LIMIT ?"),
          [5]
        );
      });
    });

    describe("getPRsByDateRange", () => {
      it("should return PRs within timestamps", async () => {
        (dbHelpers.query as jest.Mock).mockResolvedValue([mockPRRow]);
        const start = 1000;
        const end = 2000;

        const result = await getPRsByDateRange(start, end);

        expect(result).toEqual([mockPRResult]);
        expect(dbHelpers.query).toHaveBeenCalledWith(
          expect.stringContaining("achieved_at >= ? AND achieved_at <= ?"),
          [start, end]
        );
      });
    });
  });

  describe("Context Queries", () => {
    const mockContextRow = {
      ...mockPRRow,
      program_id: "prog-1",
      program_day_id: "day-1",
      program_day_name: "Chest Day",
    };

    const mockContextResult = {
      ...mockPRResult,
      programId: "prog-1",
      programDayId: "day-1",
      programDayName: "Chest Day",
    };

    describe("getPRsWithContextByExerciseName", () => {
      it("should map joined fields correctly", async () => {
        (dbHelpers.query as jest.Mock).mockResolvedValue([mockContextRow]);

        const result = await getPRsWithContextByExerciseName("Bench Press");

        expect(result).toEqual([mockContextResult]);
        expect(dbHelpers.query).toHaveBeenCalledWith(
          expect.stringContaining("LEFT JOIN workout_sessions"),
          ["Bench Press"]
        );
      });

      it("should handle null program context values", async () => {
        // Mock a row where the LEFT JOIN returned nulls (e.g. ad-hoc workout)
        const mockNullContextRow = {
          ...mockPRRow,
          program_id: null,
          program_day_id: null,
          program_day_name: null,
        };

        (dbHelpers.query as jest.Mock).mockResolvedValue([mockNullContextRow]);

        const result = await getPRsWithContextByExerciseName("Bench Press");

        expect(result).toEqual([
          {
            ...mockPRResult,
            programId: undefined,
            programDayId: undefined,
            programDayName: undefined,
          },
        ]);
      });
    });

    describe("getAllPRsWithContext", () => {
      it("should return all PRs with program info", async () => {
        (dbHelpers.query as jest.Mock).mockResolvedValue([mockContextRow]);

        const result = await getAllPRsWithContext();

        expect(result).toEqual([mockContextResult]);
        expect(dbHelpers.query).toHaveBeenCalledWith(
          expect.stringContaining("LEFT JOIN workout_sessions")
        );
      });
    });
  });
});
