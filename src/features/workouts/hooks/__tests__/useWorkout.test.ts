/**
 * Unit tests for useWorkout hook
 */

import * as sessionRepo from "@/src/lib/db/repositories/sessions";
import { WorkoutSession } from "@/types";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useWorkout } from "../useWorkout";

// Mock repository dependency
jest.mock("@/src/lib/db/repositories/sessions");

describe("useWorkout Hook", () => {
  const mockSessionId = "sess-123";

  // Updated mock to match the exact WorkoutSession interface
  const mockSession: WorkoutSession = {
    id: mockSessionId,
    name: "Morning Workout",
    exercises: [], // Required array
    startTime: 1000,
    endTime: 2000,
    programId: "prog-1",
    programDayId: "day-1",
    createdAt: 1000,
    updatedAt: 2000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Data Loading", () => {
    it("should load session data successfully", async () => {
      // Mock successful DB response
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useWorkout(mockSessionId));

      // Initial state should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.session).toBeNull();

      // Wait for async load to finish
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Verify final state
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();

      // Verify repo was called with correct ID and deep=true
      expect(sessionRepo.getSessionById).toHaveBeenCalledWith(
        mockSessionId,
        true
      );
    });

    it("should handle errors correctly", async () => {
      const mockError = new Error("Database failure");
      (sessionRepo.getSessionById as jest.Mock).mockRejectedValue(mockError);

      // Silence console error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useWorkout(mockSessionId));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.session).toBeNull();
      expect(result.current.error).toEqual(mockError);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error loading workout session:",
        mockError
      );

      consoleSpy.mockRestore();
    });

    it("should handle non-Error objects thrown during loading", async () => {
      // Mock a string throw instead of an Error object
      (sessionRepo.getSessionById as jest.Mock).mockRejectedValue(
        "String Error"
      );
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useWorkout(mockSessionId));

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check fallback error creation
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Failed to load workout");

      consoleSpy.mockRestore();
    });
  });

  describe("Refresh", () => {
    it("should re-fetch data when refresh is called", async () => {
      // 1. Initial Load
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(mockSession);
      const { result } = renderHook(() => useWorkout(mockSessionId));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // 2. Prepare for Refresh (Mock a changed value)
      // Change endTime to simulate an update (e.g. workout finished)
      const updatedSession = { ...mockSession, endTime: 3000 };
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(
        updatedSession
      );

      // 3. Call refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.session).toEqual(updatedSession);
      expect(sessionRepo.getSessionById).toHaveBeenCalledTimes(2); // Initial + Refresh
    });
  });
});
