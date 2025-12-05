import * as programRepo from "@/src/lib/db/repositories/programs";
import { generateId } from "@/src/lib/utils/id";
import {
  Program,
  ProgramDay,
  ProgramDayExercise,
  ProgramDayExerciseSet,
} from "@/types";
import * as programService from "../programService";

// Mock dependencies
jest.mock("@/src/lib/db/repositories/programs");
jest.mock("@/src/lib/utils/id");

// Strongly typed mocks
const mockedRepo = programRepo as jest.Mocked<typeof programRepo>;
const mockedGenerateId = generateId as jest.MockedFunction<typeof generateId>;

// ----------------------------------------------------------------------------
// Test Data Factories (Helpers to create valid typed objects)
// ----------------------------------------------------------------------------

const createMockProgram = (overrides?: Partial<Program>): Program => ({
  id: "program-1",
  name: "Test Program",
  description: "Test Description",
  isActive: false,
  currentDayIndex: 0,
  totalWorkoutsCompleted: 0,
  days: [],
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

const createMockDay = (overrides?: Partial<ProgramDay>): ProgramDay => ({
  id: "day-1",
  programId: "program-1",
  dayIndex: 0,
  name: "Test Day",
  exercises: [],
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

const createMockExercise = (
  overrides?: Partial<ProgramDayExercise>
): ProgramDayExercise => ({
  id: "ex-1",
  programDayId: "day-1",
  exerciseName: "Squat",
  order: 0,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("Program Service", () => {
  const mockNow = 1000;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(mockNow);
    mockedGenerateId.mockReturnValue("test-id");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fetchAllPrograms", () => {
    it("should return all programs with day counts", async () => {
      const mockResult = [
        {
          ...createMockProgram(),
          days: undefined, // Omitted in this specific return type
          dayCount: 5,
        },
      ];

      // We must cast because the Repo return type uses Omit<Program, 'days'>
      mockedRepo.getAllPrograms.mockResolvedValue(mockResult);

      const result = await programService.fetchAllPrograms();

      expect(result).toEqual(mockResult);
      expect(mockedRepo.getAllPrograms).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchProgramById", () => {
    it("should return a program with details", async () => {
      const mockProgram = createMockProgram();
      mockedRepo.getProgramWithDaysAndExercises.mockResolvedValue(mockProgram);

      const result = await programService.fetchProgramById("program-1");

      expect(result).toEqual(mockProgram);
      expect(mockedRepo.getProgramWithDaysAndExercises).toHaveBeenCalledWith(
        "program-1"
      );
    });

    it("should return null if not found", async () => {
      mockedRepo.getProgramWithDaysAndExercises.mockResolvedValue(null);
      const result = await programService.fetchProgramById("missing");
      expect(result).toBeNull();
    });
  });

  describe("createNewProgram", () => {
    it("should create a new program with default values", async () => {
      const name = "New Program";
      const description = "Desc";

      const result = await programService.createNewProgram(name, description);

      const expectedProgram: Program = {
        id: "test-id",
        name,
        description,
        isActive: false,
        currentDayIndex: 0,
        totalWorkoutsCompleted: 0,
        days: [],
        createdAt: mockNow,
        updatedAt: mockNow,
      };

      expect(result).toEqual(expectedProgram);
      expect(mockedRepo.createProgram).toHaveBeenCalledWith(expectedProgram);
    });
  });

  describe("updateExistingProgram", () => {
    it("should call repo update with correct params", async () => {
      await programService.updateExistingProgram("p1", "New Name", "New Desc");

      expect(mockedRepo.updateProgram).toHaveBeenCalledWith("p1", {
        name: "New Name",
        description: "New Desc",
      });
    });
  });

  describe("removeProgram", () => {
    it("should call repo delete", async () => {
      await programService.removeProgram("p1");
      expect(mockedRepo.deleteProgram).toHaveBeenCalledWith("p1");
    });
  });

  describe("activateProgram", () => {
    it("should activate program if it has days", async () => {
      const mockProgram = createMockProgram({
        days: [createMockDay()],
      });
      mockedRepo.getProgramWithDaysAndExercises.mockResolvedValue(mockProgram);

      await programService.activateProgram("p1");

      expect(mockedRepo.setActiveProgram).toHaveBeenCalledWith("p1");
    });

    it("should throw error if program has no days", async () => {
      const mockProgram = createMockProgram({ days: [] });
      mockedRepo.getProgramWithDaysAndExercises.mockResolvedValue(mockProgram);

      await expect(programService.activateProgram("p1")).rejects.toThrow(
        "Cannot activate program with no days"
      );

      expect(mockedRepo.setActiveProgram).not.toHaveBeenCalled();
    });

    it("should throw error if program not found", async () => {
      mockedRepo.getProgramWithDaysAndExercises.mockResolvedValue(null);

      await expect(programService.activateProgram("p1")).rejects.toThrow(
        "Cannot activate program with no days"
      ); // Assuming same error for null
    });
  });

  describe("getActiveProgramInfo", () => {
    it("should return program and next day", async () => {
      const mockProgram = createMockProgram({ id: "p1" });
      const mockNextDay = createMockDay({ id: "d1" });

      // Mock the simple getter
      mockedRepo.getActiveProgram.mockResolvedValue(mockProgram);
      // Mock the full getter
      mockedRepo.getProgramWithDaysAndExercises.mockResolvedValue(mockProgram);
      // Mock the next day getter
      mockedRepo.getNextProgramDay.mockResolvedValue(mockNextDay);

      const result = await programService.getActiveProgramInfo();

      expect(result).toEqual({
        program: mockProgram,
        nextDay: mockNextDay,
      });
    });

    it("should return null if no active program", async () => {
      mockedRepo.getActiveProgram.mockResolvedValue(null);
      const result = await programService.getActiveProgramInfo();
      expect(result).toBeNull();
    });

    it("should return null if no next day found", async () => {
      const mockProgram = createMockProgram({ id: "p1" });
      mockedRepo.getActiveProgram.mockResolvedValue(mockProgram);
      mockedRepo.getProgramWithDaysAndExercises.mockResolvedValue(mockProgram);
      mockedRepo.getNextProgramDay.mockResolvedValue(null);

      const result = await programService.getActiveProgramInfo();
      expect(result).toBeNull();
    });
  });

  describe("Day Management", () => {
    describe("addProgramDay", () => {
      it("should add a new day with correct index based on existing days", async () => {
        // Mock existing days (length 2 -> next index 2)
        const existingDays = [
          createMockDay({ dayIndex: 0 }),
          createMockDay({ dayIndex: 1 }),
        ];
        mockedRepo.getProgramDaysByProgramId.mockResolvedValue(existingDays);

        const result = await programService.addProgramDay("p1", "Leg Day");

        const expectedDay: ProgramDay = {
          id: "test-id",
          programId: "p1",
          dayIndex: 2,
          name: "Leg Day",
          exercises: [],
          createdAt: mockNow,
          updatedAt: mockNow,
        };

        expect(result).toEqual(expectedDay);
        expect(mockedRepo.createProgramDay).toHaveBeenCalledWith(expectedDay);
      });
    });

    describe("updateProgramDayName", () => {
      it("should update day name", async () => {
        await programService.updateProgramDayName("d1", "New Name");
        expect(mockedRepo.updateProgramDay).toHaveBeenCalledWith("d1", {
          name: "New Name",
        });
      });
    });

    describe("removeProgramDay", () => {
      it("should remove day and reorder remaining days", async () => {
        // Setup: 3 days (Indices 0, 1, 2). Deleting index 1 (d2).
        const dayToDelete = createMockDay({ id: "d2", dayIndex: 1 });
        const remainingDays = [
          createMockDay({ id: "d1", dayIndex: 0 }),
          createMockDay({ id: "d3", dayIndex: 2 }), // Needs shift to 1
        ];

        mockedRepo.getProgramDayById.mockResolvedValue(dayToDelete);
        // During the function execution, it calls this to get remaining days
        mockedRepo.getProgramDaysByProgramId.mockResolvedValue(remainingDays);

        // Mock program check for bounds
        mockedRepo.getProgramById.mockResolvedValue(
          createMockProgram({ currentDayIndex: 0 })
        );

        await programService.removeProgramDay("p1", "d2");

        // 1. Verify deletion
        expect(mockedRepo.deleteProgramDay).toHaveBeenCalledWith("d2");

        // 2. Verify reordering (d3 should move to index 1)
        expect(mockedRepo.updateProgramDay).toHaveBeenCalledWith("d3", {
          dayIndex: 1,
        });
        // d1 is already index 0, so no update needed
        expect(mockedRepo.updateProgramDay).not.toHaveBeenCalledWith(
          "d1",
          expect.anything()
        );
      });

      it("should reset currentDayIndex if it exceeds remaining day count", async () => {
        const dayToDelete = createMockDay({ id: "d1", dayIndex: 0 });
        const remainingDays: ProgramDay[] = []; // Empty after delete

        mockedRepo.getProgramDayById.mockResolvedValue(dayToDelete);
        mockedRepo.getProgramDaysByProgramId.mockResolvedValue(remainingDays);
        // Current index was 5, but now 0 days exist
        mockedRepo.getProgramById.mockResolvedValue(
          createMockProgram({ currentDayIndex: 5 })
        );

        await programService.removeProgramDay("p1", "d1");

        expect(mockedRepo.updateProgram).toHaveBeenCalledWith("p1", {
          currentDayIndex: 0,
        });
      });

      it("should return early if day not found", async () => {
        mockedRepo.getProgramDayById.mockResolvedValue(null);
        await programService.removeProgramDay("p1", "missing");
        expect(mockedRepo.deleteProgramDay).not.toHaveBeenCalled();
      });
    });

    describe("reorderProgramDays", () => {
      it("should update day indices based on array order", async () => {
        const newOrderIds = ["d3", "d1", "d2"];

        await programService.reorderProgramDays("p1", newOrderIds);

        expect(mockedRepo.updateProgramDay).toHaveBeenCalledTimes(3);
        expect(mockedRepo.updateProgramDay).toHaveBeenCalledWith("d3", {
          dayIndex: 0,
        });
        expect(mockedRepo.updateProgramDay).toHaveBeenCalledWith("d1", {
          dayIndex: 1,
        });
        expect(mockedRepo.updateProgramDay).toHaveBeenCalledWith("d2", {
          dayIndex: 2,
        });
      });
    });
  });

  describe("Exercise Management", () => {
    describe("addProgramDayExercise", () => {
      it("should create exercise with legacy fields and individual sets", async () => {
        // Setup: existing exercise count 1 -> next order 1
        mockedRepo.getProgramDayExercisesByDayId.mockResolvedValue([
          createMockExercise(),
        ]);

        // Mock IDs: 1 for exercise, 2 for sets
        mockedGenerateId
          .mockReturnValueOnce("ex-id")
          .mockReturnValueOnce("set-id-1")
          .mockReturnValueOnce("set-id-2");

        const exerciseData = {
          exerciseName: "Squat",
          targetSets: 2, // Legacy
          sets: [
            { targetReps: 5, targetWeight: 100 },
            { targetReps: 5, targetWeight: 100 },
          ],
        };

        const result = await programService.addProgramDayExercise(
          "d1",
          exerciseData
        );

        // Verify Exercise Creation
        expect(mockedRepo.createProgramDayExercise).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "ex-id",
            programDayId: "d1",
            exerciseName: "Squat",
            order: 1,
            targetSets: 2,
          })
        );

        // Verify Sets Creation
        expect(mockedRepo.createProgramDayExerciseSet).toHaveBeenCalledTimes(2);

        const expectedSet1: ProgramDayExerciseSet = {
          id: "set-id-1",
          programDayExerciseId: "ex-id",
          setNumber: 1,
          targetReps: 5,
          targetWeight: 100,
          createdAt: mockNow,
          updatedAt: mockNow,
        };

        expect(mockedRepo.createProgramDayExerciseSet).toHaveBeenCalledWith(
          expectedSet1
        );

        // Verify return object structure
        expect(result.sets).toHaveLength(2);
        expect(result.id).toBe("ex-id");
      });
    });

    describe("updateProgramDayExercise", () => {
      it("should simple update exercise fields without touching sets", async () => {
        await programService.updateProgramDayExercise("ex1", {
          notes: "Updated",
        });

        expect(mockedRepo.updateProgramDayExercise).toHaveBeenCalledWith(
          "ex1",
          { notes: "Updated" }
        );
        expect(mockedRepo.deleteProgramDayExerciseSets).not.toHaveBeenCalled();
      });

      it("should replace sets when sets array is provided", async () => {
        mockedGenerateId.mockReturnValue("new-set-id");

        const updates = {
          exerciseName: "New Name",
          sets: [{ targetReps: 10 }],
        };

        await programService.updateProgramDayExercise("ex1", updates);

        // 1. Delete old sets
        expect(mockedRepo.deleteProgramDayExerciseSets).toHaveBeenCalledWith(
          "ex1"
        );

        // 2. Create new sets
        expect(mockedRepo.createProgramDayExerciseSet).toHaveBeenCalledWith(
          expect.objectContaining({
            programDayExerciseId: "ex1",
            setNumber: 1,
            targetReps: 10,
          })
        );

        // 3. Update exercise fields (excluding sets array)
        expect(mockedRepo.updateProgramDayExercise).toHaveBeenCalledWith(
          "ex1",
          {
            exerciseName: "New Name",
          }
        );
      });
    });

    describe("removeProgramDayExercise", () => {
      it("should remove exercise and reorder remaining", async () => {
        // Scenario: Ex1(0), Ex2(1), Ex3(2). Removing Ex2(1).
        // Remaining: Ex1(0), Ex3(2). Ex3 needs to move to 1.

        const remainingExercises = [
          createMockExercise({ id: "ex1", order: 0 }),
          createMockExercise({ id: "ex3", order: 2 }),
        ];

        mockedRepo.getProgramDayExercisesByDayId.mockResolvedValue(
          remainingExercises
        );

        await programService.removeProgramDayExercise("d1", "ex2");

        expect(mockedRepo.deleteProgramDayExercise).toHaveBeenCalledWith("ex2");

        // Ex3 update
        expect(mockedRepo.updateProgramDayExercise).toHaveBeenCalledWith(
          "ex3",
          { order: 1 }
        );
        // Ex1 should not update
        expect(mockedRepo.updateProgramDayExercise).not.toHaveBeenCalledWith(
          "ex1",
          expect.anything()
        );
      });
    });

    describe("reorderProgramDayExercises", () => {
      it("should update exercise orders based on input array", async () => {
        const ids = ["ex3", "ex1", "ex2"];
        await programService.reorderProgramDayExercises(ids);

        expect(mockedRepo.updateProgramDayExercise).toHaveBeenCalledWith(
          "ex3",
          { order: 0 }
        );
        expect(mockedRepo.updateProgramDayExercise).toHaveBeenCalledWith(
          "ex1",
          { order: 1 }
        );
        expect(mockedRepo.updateProgramDayExercise).toHaveBeenCalledWith(
          "ex2",
          { order: 2 }
        );
      });
    });
  });

  describe("getProgramHistory", () => {
    it("should return history from repo", async () => {
      const mockHistory = [{ id: "hist-1" }];
      // @ts-ignore - allowing implicit any for the quick mock, but let's be strict:
      mockedRepo.getProgramHistory.mockResolvedValue(mockHistory as any);

      const result = await programService.getProgramHistory("p1");
      expect(result).toEqual(mockHistory);
    });
  });
});
