/**
 * Unit tests for useExercise hook
 */

import * as sessionRepo from "@/src/lib/db/repositories/sessions";
import * as setsRepo from "@/src/lib/db/repositories/sets";
import { Exercise, WorkoutSet } from "@/types";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useExercise } from "../useExercise";

// Mock dependencies
jest.mock("@/src/lib/db/repositories/sessions");
jest.mock("@/src/lib/db/repositories/sets");

describe("useExercise Hook", () => {
  const mockExerciseId = "ex-123";
  const mockSessionId = "sess-123";

  const mockSet: WorkoutSet = {
    id: "set-1",
    exerciseId: mockExerciseId,
    workoutSessionId: mockSessionId,
    setNumber: 1,
    reps: 10,
    weight: 135,
    completed: true,
    createdAt: 1000,
  };

  const mockExercise: Exercise = {
    id: mockExerciseId,
    workoutSessionId: mockSessionId,
    name: "Bench Press",
    order: 1,
    sets: [mockSet],
    createdAt: 1000,
    updatedAt: 1000,
  };

  const mockPreviousSets: WorkoutSet[] = [
    { ...mockSet, id: "prev-set-1", weight: 130 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Data Loading", () => {
    it("should load exercise data and previous sets successfully", async () => {
      // Setup Mocks
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(
        mockExercise
      );
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue({
        id: mockSessionId,
        programDayId: "prog-day-1",
      });
      (
        setsRepo.getLastWorkoutSetsByExerciseName as jest.Mock
      ).mockResolvedValue(mockPreviousSets);

      const { result } = renderHook(() => useExercise(mockExerciseId));

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.exercise).toBeNull();

      // Wait for async load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Verify data
      expect(result.current.exercise).toEqual(mockExercise);
      expect(result.current.previousSets).toEqual(mockPreviousSets);
      expect(result.current.error).toBeNull();

      // Verify Calls
      expect(sessionRepo.getExerciseById).toHaveBeenCalledWith(mockExerciseId);
      expect(sessionRepo.getSessionById).toHaveBeenCalledWith(
        mockSessionId,
        false
      );
      // Should pass programDayId if present in session
      expect(setsRepo.getLastWorkoutSetsByExerciseName).toHaveBeenCalledWith(
        "Bench Press",
        "prog-day-1"
      );
    });

    it("should handle missing programDayId when fetching previous sets", async () => {
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(
        mockExercise
      );
      // Session exists but isn't part of a program
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue({
        id: mockSessionId,
        programDayId: undefined,
      });
      (
        setsRepo.getLastWorkoutSetsByExerciseName as jest.Mock
      ).mockResolvedValue([]);

      const { result } = renderHook(() => useExercise(mockExerciseId));

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should call with undefined programDayId
      expect(setsRepo.getLastWorkoutSetsByExerciseName).toHaveBeenCalledWith(
        "Bench Press",
        undefined
      );
    });

    it("should handle errors during loading", async () => {
      // Silence console.error for this specific test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const error = new Error("Network error");
      (sessionRepo.getExerciseById as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useExercise(mockExerciseId));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.exercise).toBeNull();
      expect(result.current.error).toEqual(error);

      // Verify error was logged (optional but good practice)
      expect(consoleSpy).toHaveBeenCalledWith("Error loading exercise:", error);

      // Restore console.error
      consoleSpy.mockRestore();
    });

    it("should handle case where exercise is not found (null return)", async () => {
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useExercise(mockExerciseId));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.exercise).toBeNull();
      // Should skip looking up session/previous sets
      expect(sessionRepo.getSessionById).not.toHaveBeenCalled();
    });

    it("should handle non-Error objects thrown during loading", async () => {
      // Mock a string throw instead of an Error object
      (sessionRepo.getExerciseById as jest.Mock).mockRejectedValue(
        "String Error"
      );
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useExercise(mockExerciseId));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Failed to load exercise");

      consoleSpy.mockRestore();
    });
  });

  describe("CRUD Operations", () => {
    // Setup a clean state with loaded exercise for these tests
    beforeEach(() => {
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(
        mockExercise
      );
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue({});
      (
        setsRepo.getLastWorkoutSetsByExerciseName as jest.Mock
      ).mockResolvedValue([]);
    });

    it("should add a set optimistically", async () => {
      (setsRepo.createSet as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExercise(mockExerciseId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addSet({ reps: 8, weight: 145 });
      });

      // Check Optimistic Update
      expect(result.current.exercise?.sets).toHaveLength(2);
      const addedSet = result.current.exercise?.sets[1];
      expect(addedSet).toMatchObject({
        reps: 8,
        weight: 145,
        setNumber: 2,
        completed: false,
      });

      // Verify DB call
      expect(setsRepo.createSet).toHaveBeenCalledWith(
        expect.objectContaining({
          reps: 8,
          weight: 145,
          exerciseId: mockExerciseId,
          workoutSessionId: mockSessionId,
        })
      );
    });

    it("should update a set optimistically", async () => {
      (setsRepo.updateSet as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExercise(mockExerciseId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateSetData("set-1", { weight: 140 });
      });

      // Check Optimistic Update
      expect(result.current.exercise?.sets[0].weight).toBe(140);

      // Verify DB call
      expect(setsRepo.updateSet).toHaveBeenCalledWith("set-1", { weight: 140 });
    });

    it("should remove a set optimistically", async () => {
      (setsRepo.deleteSet as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExercise(mockExerciseId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.removeSet("set-1");
      });

      // Check Optimistic Update
      expect(result.current.exercise?.sets).toHaveLength(0);

      // Verify DB call
      expect(setsRepo.deleteSet).toHaveBeenCalledWith("set-1");
    });

    it("should toggle set completion optimistically", async () => {
      (setsRepo.updateSet as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExercise(mockExerciseId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Toggle from true (mock) to false
      await act(async () => {
        await result.current.toggleSetCompletion("set-1", false);
      });

      // Check Optimistic Update
      expect(result.current.exercise?.sets[0].completed).toBe(false);
      expect(result.current.exercise?.sets[0].completedAt).toBeUndefined();

      // Verify DB call
      expect(setsRepo.updateSet).toHaveBeenCalledWith("set-1", {
        completed: false,
        completedAt: undefined,
      });

      // Toggle back to true
      await act(async () => {
        await result.current.toggleSetCompletion("set-1", true);
      });

      expect(result.current.exercise?.sets[0].completed).toBe(true);
      expect(result.current.exercise?.sets[0].completedAt).toEqual(
        expect.any(Number)
      );
    });

    it("should leave other sets unchanged during updates", async () => {
      // Setup exercise with TWO sets
      const set1 = { ...mockSet, id: "set-1", setNumber: 1 };
      const set2 = { ...mockSet, id: "set-2", setNumber: 2 };

      const multiSetExercise = { ...mockExercise, sets: [set1, set2] };
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(
        multiSetExercise
      );
      (setsRepo.updateSet as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExercise(mockExerciseId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Update Set 1
      await act(async () => {
        await result.current.updateSetData("set-1", { reps: 99 });
      });

      // Verify Set 1 changed
      expect(
        result.current.exercise?.sets.find((s) => s.id === "set-1")?.reps
      ).toBe(99);
      // Verify Set 2 DID NOT change (Hits the : set branch in the map)
      expect(
        result.current.exercise?.sets.find((s) => s.id === "set-2")?.reps
      ).toBe(10);

      // Toggle completion for Set 1
      await act(async () => {
        await result.current.toggleSetCompletion("set-1", true);
      });

      // Verify Set 2 DID NOT change (Hits the : set branch in the completion map)
      expect(
        result.current.exercise?.sets.find((s) => s.id === "set-2")?.completed
      ).toBe(true); // mockSet default is true
    });
  });

  describe("Refresh", () => {
    it("should re-fetch data when refresh is called", async () => {
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(
        mockExercise
      );
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue({});
      (
        setsRepo.getLastWorkoutSetsByExerciseName as jest.Mock
      ).mockResolvedValue([]);

      const { result } = renderHook(() => useExercise(mockExerciseId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Clear mocks to verify re-call
      jest.clearAllMocks();

      // Change mock response for refresh
      const updatedExercise = { ...mockExercise, name: "Updated Name" };
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(
        updatedExercise
      );
      // We also need to mock the subsequent calls again because clearAllMocks cleared them
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue({});
      (
        setsRepo.getLastWorkoutSetsByExerciseName as jest.Mock
      ).mockResolvedValue([]);

      await act(async () => {
        await result.current.refresh();
      });

      expect(sessionRepo.getExerciseById).toHaveBeenCalledTimes(1);
      expect(result.current.exercise?.name).toBe("Updated Name");
    });
  });

  describe("Safety Checks", () => {
    it("should return early from operations if exercise is null", async () => {
      // Mock failure to load
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(null);
      (setsRepo.createSet as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExercise(mockExerciseId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Call operations
      await act(async () => {
        await result.current.addSet({ reps: 5, weight: 100 });
        await result.current.removeSet("set-1");
        await result.current.updateSetData("set-1", {});
      });

      // Ensure no DB calls were made
      expect(setsRepo.createSet).not.toHaveBeenCalled();
      expect(setsRepo.deleteSet).not.toHaveBeenCalled();
      expect(setsRepo.updateSet).not.toHaveBeenCalled();
    });

    it("should protect against state updates when exercise becomes null", async () => {
      // 1. Setup valid exercise
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(
        mockExercise
      );
      (setsRepo.createSet as jest.Mock).mockResolvedValue(undefined);
      (setsRepo.updateSet as jest.Mock).mockResolvedValue(undefined);
      (setsRepo.deleteSet as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExercise(mockExerciseId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // 2. Capture functions bound to the VALID exercise state
      const { addSet, updateSetData, removeSet, toggleSetCompletion } =
        result.current;

      // 3. Force the hook to reload and get NULL
      (sessionRepo.getExerciseById as jest.Mock).mockResolvedValue(null);
      await act(async () => {
        await result.current.refresh();
      });

      // 4. Now call the OLD functions.
      // They captured 'exercise' in their closure so they pass "if (!exercise) return".
      // But setExercise will see the CURRENT state (which is now null), hitting the inner safety check.
      await act(async () => {
        await addSet({ reps: 10, weight: 100 });
        await updateSetData("set-1", { reps: 5 });
        await removeSet("set-1");
        await toggleSetCompletion("set-1", true);
      });

      // Verify no crashes (the test passing implies the returns worked)
      expect(result.current.exercise).toBeNull();
    });
  });
});
