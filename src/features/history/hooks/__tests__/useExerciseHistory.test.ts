/**
 * Unit tests for useExerciseHistory hook
 */

import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as historyService from "../../api/exerciseHistoryService";
import { useExerciseHistory } from "../useExerciseHistory";

// Mock the API service
jest.mock("../../api/exerciseHistoryService");

describe("useExerciseHistory Hook", () => {
  const mockExerciseName = "Bench Press";

  const mockPerformances = [
    {
      id: "perf-1",
      date: 1640000000000,
      workoutSessionId: "sess-1",
      sets: [{ reps: 10, weight: 135, completed: true }],
    },
  ];

  const mockStats = {
    totalWorkouts: 5,
    totalVolume: 5000,
    totalSets: 15,
    totalReps: 150,
    maxWeight: 185,
    avgVolume: 1000,
    avgSets: 3,
    lastPerformed: 1640000000000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Data Loading", () => {
    it("should load history and statistics successfully", async () => {
      // Setup successful API responses
      (
        historyService.getExercisePerformanceHistory as jest.Mock
      ).mockResolvedValue(mockPerformances);
      (historyService.getExerciseStatistics as jest.Mock).mockResolvedValue(
        mockStats
      );

      const { result } = renderHook(() => useExerciseHistory(mockExerciseName));

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.performances).toEqual([]);
      expect(result.current.statistics).toBeNull();

      // Wait for loading to finish
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Verify final state
      expect(result.current.performances).toEqual(mockPerformances);
      expect(result.current.statistics).toEqual(mockStats);
      expect(result.current.error).toBeNull();

      // Verify API calls
      expect(historyService.getExercisePerformanceHistory).toHaveBeenCalledWith(
        mockExerciseName
      );
      expect(historyService.getExerciseStatistics).toHaveBeenCalledWith(
        mockExerciseName
      );
    });

    it("should handle empty exercise name (guard clause)", async () => {
      const { result } = renderHook(() => useExerciseHistory(""));

      // Should not be loading immediately or after effect
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.performances).toEqual([]);
      expect(result.current.statistics).toBeNull();

      // Ensure APIs were NOT called
      expect(
        historyService.getExercisePerformanceHistory
      ).not.toHaveBeenCalled();
      expect(historyService.getExerciseStatistics).not.toHaveBeenCalled();
    });

    it("should handle API errors", async () => {
      const mockError = new Error("Network failure");
      (
        historyService.getExercisePerformanceHistory as jest.Mock
      ).mockRejectedValue(mockError);

      // Silence console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useExerciseHistory(mockExerciseName));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.performances).toEqual([]);
      expect(result.current.statistics).toBeNull();
      expect(result.current.error).toEqual(mockError);

      consoleSpy.mockRestore();
    });

    it("should handle non-Error objects thrown during loading", async () => {
      // Mock a string throw
      (
        historyService.getExercisePerformanceHistory as jest.Mock
      ).mockRejectedValue("String Error");
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useExerciseHistory(mockExerciseName));

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check fallback error creation
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Failed to load exercise history"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Refresh", () => {
    it("should re-fetch data when refresh is called", async () => {
      // 1. Initial Load
      (
        historyService.getExercisePerformanceHistory as jest.Mock
      ).mockResolvedValue(mockPerformances);
      (historyService.getExerciseStatistics as jest.Mock).mockResolvedValue(
        mockStats
      );

      const { result } = renderHook(() => useExerciseHistory(mockExerciseName));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // 2. Prepare for Refresh (Mock updated values)
      const updatedStats = { ...mockStats, totalWorkouts: 6 };
      (historyService.getExerciseStatistics as jest.Mock).mockResolvedValue(
        updatedStats
      );

      // 3. Call refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.statistics).toEqual(updatedStats);
      expect(historyService.getExerciseStatistics).toHaveBeenCalledTimes(2);
    });
  });
});
