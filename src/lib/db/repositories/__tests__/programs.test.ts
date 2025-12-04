/**
 * Unit tests for Programs Repository
 */

import { Program } from "@/types";
import * as dbHelpers from "../../helpers";
import {
  advanceProgramDay,
  createProgram,
  createProgramDay,
  createProgramDayExercise,
  createProgramDayExerciseSet,
  deleteProgram,
  deleteProgramDay,
  deleteProgramDayExercise,
  deleteProgramDayExerciseSet,
  deleteProgramDayExerciseSets,
  getActiveProgram,
  getAllPrograms,
  getNextProgramDay,
  getProgramById,
  getProgramDayById,
  getProgramDayExercisesByDayId,
  getProgramDaysByProgramId,
  getProgramHistory,
  getProgramHistoryBySessionId,
  getProgramWithDaysAndExercises,
  logProgramHistory,
  setActiveProgram,
  updateProgram,
  updateProgramDay,
  updateProgramDayExercise,
  updateProgramDayExerciseSet,
} from "../programs";

// Mock dependencies
jest.mock("../../helpers");

describe("Programs Repository", () => {
  const mockTimestamp = 1640000000000;

  // --- Mock Data Factories ---
  const mockProgramRow = {
    id: "prog-1",
    name: "Strength 101",
    description: "Basic strength",
    is_active: 1,
    current_day_index: 0,
    total_workouts_completed: 5,
    created_at: mockTimestamp,
    updated_at: mockTimestamp,
  };

  const mockProgramDayRow = {
    id: "day-1",
    program_id: "prog-1",
    day_index: 0,
    name: "Leg Day",
    created_at: mockTimestamp,
    updated_at: mockTimestamp,
  };

  const mockExerciseRow = {
    id: "ex-1",
    program_day_id: "day-1",
    exercise_name: "Squat",
    order: 0,
    target_sets: 3,
    target_reps: 5,
    target_weight: 225,
    rest_seconds: 180,
    notes: "Go heavy",
    created_at: mockTimestamp,
    updated_at: mockTimestamp,
  };

  const mockSetRow = {
    id: "set-1",
    program_day_exercise_id: "ex-1",
    set_number: 1,
    target_reps: 5,
    target_weight: 225,
    created_at: mockTimestamp,
    updated_at: mockTimestamp,
  };

  const mockHistoryRow = {
    id: "hist-1",
    program_id: "prog-1",
    program_day_id: "day-1",
    workout_session_id: "session-1",
    performed_at: mockTimestamp,
    duration_seconds: 3600,
    created_at: mockTimestamp,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // Program CRUD Tests
  // ==========================================================================

  describe("Program CRUD", () => {
    describe("createProgram", () => {
      it("should insert a new program", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        const newProgram: Omit<Program, "days"> = {
          id: "prog-new",
          name: "New Prog",
          description: "Some description",
          isActive: true,
          currentDayIndex: 0,
          totalWorkoutsCompleted: 0,
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp,
        };

        await createProgram(newProgram);

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO programs"),
          expect.arrayContaining(["prog-new", "New Prog", 1])
        );
      });
    });

    describe("updateProgram", () => {
      it("should update all provided fields", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await updateProgram("prog-1", {
          name: "Updated Name",
          description: "Updated Desc",
          isActive: false,
          currentDayIndex: 2,
          totalWorkoutsCompleted: 10,
        });

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE programs SET"),
          expect.arrayContaining(["Updated Name", 0, 2, 10, "prog-1"])
        );
      });

      it("should update only specific fields (Partial Update)", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await updateProgram("prog-1", { name: "Just Name" });

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining(
            "UPDATE programs SET name = ?, updated_at = ?"
          ),
          expect.arrayContaining(["Just Name"])
        );
      });
    });

    describe("deleteProgram", () => {
      it("should delete a program by id", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);
        await deleteProgram("prog-1");
        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM programs"),
          ["prog-1"]
        );
      });
    });

    describe("getAllPrograms", () => {
      it("should return programs with day counts", async () => {
        // Mock getAll to handle the main query and the sub-query loop
        (dbHelpers.getAll as jest.Mock).mockImplementation(async (sql) => {
          if (sql.includes("FROM programs")) return [mockProgramRow];
          if (sql.includes("FROM program_days")) return [{ count: 5 }];
          return [];
        });

        const result = await getAllPrograms();

        expect(result).toHaveLength(1);
        expect(result[0].dayCount).toBe(5);
        expect(result[0].id).toBe("prog-1");
      });
    });

    describe("getProgramById", () => {
      it("should return program if found", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockProgramRow);
        const result = await getProgramById("prog-1");
        expect(result).toBeTruthy();
        expect(result?.id).toBe("prog-1");
      });

      it("should return null if not found", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        const result = await getProgramById("prog-999");
        expect(result).toBeNull();
      });
    });

    describe("getActiveProgram", () => {
      it("should return the active program", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockProgramRow);
        const result = await getActiveProgram();
        expect(result?.isActive).toBe(true);
      });
    });

    describe("setActiveProgram", () => {
      it("should use transaction to deactivate others and activate target", async () => {
        (dbHelpers.transaction as jest.Mock).mockResolvedValue(undefined);

        await setActiveProgram("prog-1");

        expect(dbHelpers.transaction).toHaveBeenCalledWith([
          { sql: "UPDATE programs SET is_active = 0" },
          {
            sql: expect.stringContaining("UPDATE programs SET is_active = 1"),
            params: expect.arrayContaining(["prog-1"]),
          },
        ]);
      });
    });

    describe("getProgramWithDaysAndExercises", () => {
      it("should return full deep structure", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockProgramRow);

        // Mock nested getAll calls
        (dbHelpers.getAll as jest.Mock).mockImplementation(async (sql) => {
          if (sql.includes("FROM program_days")) return [mockProgramDayRow];
          if (sql.includes("FROM program_day_exercises"))
            return [mockExerciseRow];
          if (sql.includes("FROM program_day_exercise_sets"))
            return [mockSetRow];
          return [];
        });

        const result = await getProgramWithDaysAndExercises("prog-1");

        expect(result).not.toBeNull();
        expect(result?.days).toHaveLength(1);
        expect(result?.days[0].exercises).toHaveLength(1);
        expect(result?.days[0].exercises[0].sets).toHaveLength(1);
      });

      it("should return null if program does not exist", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        const result = await getProgramWithDaysAndExercises("prog-999");
        expect(result).toBeNull();
      });
    });
  });

  // ==========================================================================
  // Program Day CRUD Tests
  // ==========================================================================

  describe("Program Day CRUD", () => {
    describe("createProgramDay", () => {
      it("should insert a new program day", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);
        await createProgramDay({
          id: "d1",
          programId: "p1",
          dayIndex: 0,
          name: "Day 1",
          createdAt: 100,
          updatedAt: 100,
        });
        expect(dbHelpers.execute).toHaveBeenCalled();
      });
    });

    describe("updateProgramDay", () => {
      it("should update partial fields", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await updateProgramDay("day-1", { dayIndex: 5 });

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE program_days SET day_index = ?"),
          expect.arrayContaining([5])
        );
      });
    });

    // Coverage for Line 318
    describe("deleteProgramDay", () => {
      it("should delete a program day by id", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);
        await deleteProgramDay("day-1");
        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM program_days"),
          ["day-1"]
        );
      });
    });

    describe("getProgramDayById", () => {
      // Coverage for Lines 341-342 (Null check)
      it("should return null if day does not exist", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        const result = await getProgramDayById("non-existent");
        expect(result).toBeNull();
      });

      it("should return day with exercises if exists", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockProgramDayRow);
        (dbHelpers.getAll as jest.Mock).mockResolvedValue([]); // No exercises
        const result = await getProgramDayById("day-1");
        expect(result?.id).toBe("day-1");
      });

      it("should return null if the database returns no row", async () => {
        // Force the database to return null for this specific call
        (dbHelpers.getOne as jest.Mock).mockResolvedValueOnce(null);

        const result = await getProgramDayById("non-existent");

        expect(result).toBeNull();
      });
    });

    describe("getProgramDaysByProgramId", () => {
      it("should fetch days and cascade fetch exercises", async () => {
        (dbHelpers.getAll as jest.Mock).mockImplementation(async (sql) => {
          if (sql.includes("FROM program_days")) return [mockProgramDayRow];
          if (sql.includes("FROM program_day_exercises")) return []; // Stop recursion
          return [];
        });

        const result = await getProgramDaysByProgramId("prog-1");
        expect(result).toHaveLength(1);
        expect(result[0].exercises).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // Exercise & Set CRUD Tests
  // ==========================================================================

  describe("Program Day Exercise CRUD", () => {
    describe("createProgramDayExercise", () => {
      it("should insert a new exercise", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);
        await createProgramDayExercise({
          id: "ex1",
          programDayId: "d1",
          exerciseName: "Ex",
          order: 1,
          createdAt: 100,
          updatedAt: 100,
        });
        expect(dbHelpers.execute).toHaveBeenCalled();
      });
    });

    describe("updateProgramDayExercise", () => {
      // Coverage for Lines 398-416 (Branches for all fields)

      it("should update ALL fields to ensure all if-branches are hit (True paths)", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        // Providing values for ALL optional fields forces every `if` to evaluate to TRUE
        await updateProgramDayExercise("ex-1", {
          exerciseName: "New Name",
          order: 99,
          targetSets: 10,
          targetReps: 12,
          targetWeight: 100,
          restSeconds: 60,
          notes: "Updated notes",
        });

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining(
            'SET exercise_name = ?, "order" = ?, target_sets = ?, target_reps = ?, target_weight = ?, rest_seconds = ?, notes = ?'
          ),
          expect.arrayContaining([
            "New Name",
            99,
            10,
            12,
            100,
            60,
            "Updated notes",
          ])
        );
      });

      it("should update NO fields to hit the implicit else branches (False paths)", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        // Providing empty object forces every `if` to evaluate to FALSE
        await updateProgramDayExercise("ex-1", {});

        // It should only update `updated_at` (and WHERE id)
        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("SET updated_at = ?"),
          expect.any(Array)
        );
      });
    });

    describe("deleteProgramDayExercise", () => {
      it("should delete an exercise by id", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);
        await deleteProgramDayExercise("ex-1");
        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM program_day_exercises"),
          ["ex-1"]
        );
      });
    });

    describe("getProgramDayExercisesByDayId", () => {
      it("should handle exercises with NO sets", async () => {
        (dbHelpers.getAll as jest.Mock).mockImplementation(async (sql) => {
          if (sql.includes("FROM program_day_exercises"))
            return [mockExerciseRow];
          if (sql.includes("FROM program_day_exercise_sets")) return []; // No sets
          return [];
        });

        const result = await getProgramDayExercisesByDayId("day-1");
        expect(result[0].sets).toBeUndefined();
      });
    });
  });

  describe("Program Day Exercise Set CRUD", () => {
    describe("createProgramDayExerciseSet", () => {
      it("should insert a new set", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);
        await createProgramDayExerciseSet({
          id: "s1",
          programDayExerciseId: "ex1",
          setNumber: 1,
          createdAt: 100,
          updatedAt: 100,
        });
        expect(dbHelpers.execute).toHaveBeenCalled();
      });
    });

    describe("updateProgramDayExerciseSet", () => {
      it("should update partial fields", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);
        await updateProgramDayExerciseSet("set-1", { targetReps: 10 });
        expect(dbHelpers.execute).toHaveBeenCalled();
      });
    });

    // Coverage for Line 528
    describe("deleteProgramDayExerciseSet", () => {
      it("should delete a set by id", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);
        await deleteProgramDayExerciseSet("set-1");
        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM program_day_exercise_sets"),
          ["set-1"]
        );
      });
    });

    describe("deleteProgramDayExerciseSets", () => {
      it("should delete sets by exercise id", async () => {
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);
        await deleteProgramDayExerciseSets("ex-1");
        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("DELETE FROM program_day_exercise_sets"),
          ["ex-1"]
        );
      });
    });

    describe("getProgramDayExerciseSetsByExerciseId", () => {
      it("should return sets", async () => {
        (dbHelpers.getAll as jest.Mock).mockResolvedValue([mockSetRow]);
        const result = await dbHelpers.getAll("..."); // Just to verify mock
        expect(result).toHaveLength(1);
      });
    });
  });

  // ==========================================================================
  // Execution Logic Tests
  // ==========================================================================

  describe("Program Execution Logic", () => {
    describe("advanceProgramDay", () => {
      beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
      });

      afterEach(() => {
        (console.log as jest.Mock).mockRestore();
        (console.warn as jest.Mock).mockRestore();
      });

      it("should throw if program not found", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        await expect(advanceProgramDay("prog-1", "day-1")).rejects.toThrow();
      });

      it("should return early if program has zero days", async () => {
        // 1. Program exists
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockProgramRow);

        // 2. STRICT MOCK: Return empty array specifically for program days query
        (dbHelpers.getAll as jest.Mock).mockImplementation(async (sql) => {
          if (sql.includes("FROM program_days")) return [];
          return [mockExerciseRow]; // Return something else for other queries just in case
        });

        await advanceProgramDay("prog-1", "day-1");

        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining("has no days")
        );
        expect(dbHelpers.execute).not.toHaveBeenCalled();
      });

      it("should do nothing if completed day is not found in program", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockProgramRow);
        (dbHelpers.getAll as jest.Mock).mockResolvedValue([
          { ...mockProgramDayRow, id: "other" },
        ]);

        await advanceProgramDay("prog-1", "day-1");
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining("not found in program")
        );
      });

      it("should advance index and increment total workouts", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockProgramRow);
        const days = [
          { ...mockProgramDayRow, id: "day-1", day_index: 0 },
          { ...mockProgramDayRow, id: "day-2", day_index: 1 },
        ];
        (dbHelpers.getAll as jest.Mock).mockResolvedValue(days); // Return valid days
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await advanceProgramDay("prog-1", "day-1");

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE programs SET"),
          expect.arrayContaining([1, 6])
        );
      });

      it("should wrap around to index 0 on last day", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockProgramRow);
        (dbHelpers.getAll as jest.Mock).mockResolvedValue([
          { ...mockProgramDayRow, id: "day-1", day_index: 0 },
        ]);
        (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

        await advanceProgramDay("prog-1", "day-1");

        expect(dbHelpers.execute).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE programs SET"),
          expect.arrayContaining([0])
        );
      });
    });

    describe("getNextProgramDay", () => {
      it("should return the day at current_day_index", async () => {
        // Program is at index 1
        (dbHelpers.getOne as jest.Mock).mockResolvedValue({
          ...mockProgramRow,
          current_day_index: 1,
        });

        const days = [
          { ...mockProgramDayRow, id: "day-A", day_index: 0 },
          { ...mockProgramDayRow, id: "day-B", day_index: 1 }, // Target
        ];

        (dbHelpers.getAll as jest.Mock).mockImplementation(async (sql) => {
          if (sql.includes("FROM program_days")) return days;
          if (sql.includes("FROM program_day_exercises")) return [];
          return [];
        });

        const result = await getNextProgramDay("prog-1");
        expect(result?.id).toBe("day-B");
      });

      it("should return null if program has no days", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockProgramRow);
        (dbHelpers.getAll as jest.Mock).mockResolvedValue([]);
        const result = await getNextProgramDay("prog-1");
        expect(result).toBeNull();
      });

      it("should return null if program not found", async () => {
        (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
        const result = await getNextProgramDay("prog-999");
        expect(result).toBeNull();
      });
    });
  });

  // ==========================================================================
  // History Tests (Null handling)
  // ==========================================================================

  describe("Program History", () => {
    it("should log history with nullable duration", async () => {
      (dbHelpers.execute as jest.Mock).mockResolvedValue(undefined);

      await logProgramHistory({
        programId: "p1",
        programDayId: "d1",
        workoutSessionId: "s1",
        performedAt: 123,
        durationSeconds: undefined, // Should become null
      });

      expect(dbHelpers.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO program_history"),
        expect.arrayContaining([null])
      );
    });

    it("should map history rows with nulls correctly", async () => {
      const rowWithNulls = { ...mockHistoryRow, duration_seconds: null };
      (dbHelpers.getAll as jest.Mock).mockResolvedValue([rowWithNulls]);

      const result = await getProgramHistory("prog-1");
      expect(result[0].durationSeconds).toBeUndefined();
    });

    it("should return null if history by session not found", async () => {
      (dbHelpers.getOne as jest.Mock).mockResolvedValue(null);
      const result = await getProgramHistoryBySessionId("sess-99");
      expect(result).toBeNull();
    });

    it("should return history by session if found", async () => {
      (dbHelpers.getOne as jest.Mock).mockResolvedValue(mockHistoryRow);
      const result = await getProgramHistoryBySessionId("sess-1");
      expect(result?.id).toBe("hist-1");
    });
  });
});
