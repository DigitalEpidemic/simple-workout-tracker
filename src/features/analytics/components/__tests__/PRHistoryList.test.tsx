import * as PRService from "@/src/features/workouts/api/prService";
import * as PRRepo from "@/src/lib/db/repositories/pr-records";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";
import { ActivityIndicator } from "react-native"; // Import for type checking
import { PRHistoryList } from "../PRHistoryList";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("@/src/lib/db/repositories/pr-records");
jest.mock("@/src/features/workouts/api/prService");

jest.mock("@/src/hooks/useWeightDisplay", () => ({
  useWeightDisplay: () => ({
    displayWeight: (w: number) => `${w} lbs`,
  }),
}));

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const NOW = Date.now();
const DAY_MS = 86400000;

const mockPRsSquat = [
  { id: "pr1", reps: 5, weight: 225, achievedAt: NOW }, // Today
  { id: "pr2", reps: 1, weight: 315, achievedAt: NOW - DAY_MS }, // Yesterday
];

const mockPRsBench = [
  { id: "pr3", reps: 10, weight: 135, achievedAt: NOW - DAY_MS * 10 }, // 10 days ago
];

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("PRHistoryList Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default Mocks
    (PRService.getDisplayName as jest.Mock).mockImplementation((name) => name);
    (PRRepo.getExerciseNamesWithPRs as jest.Mock).mockResolvedValue([
      "Squat",
      "Bench Press",
    ]);
    (PRRepo.getPRsByExerciseName as jest.Mock).mockImplementation(
      async (name) => {
        if (name === "Squat") return mockPRsSquat;
        if (name === "Bench Press") return mockPRsBench;
        return [];
      }
    );
  });

  describe("Loading & Empty States", () => {
    it("shows loading indicator initially", () => {
      (PRRepo.getExerciseNamesWithPRs as jest.Mock).mockReturnValue(
        new Promise(() => {})
      );

      render(<PRHistoryList />);

      // FIX 1: Use UNSAFE_getByType to find the component without a testID
      // This avoids needing to mock the entire react-native library
      expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it("renders empty state when no PRs exist", async () => {
      (PRRepo.getExerciseNamesWithPRs as jest.Mock).mockResolvedValue([]);

      render(<PRHistoryList />);

      await waitFor(() => {
        expect(screen.getByText("No Personal Records Yet")).toBeTruthy();
        expect(screen.getByText(/Complete workouts to start/)).toBeTruthy();
      });
    });
  });

  describe("Data Rendering", () => {
    it("renders list of exercises grouped and sorted", async () => {
      render(<PRHistoryList />);

      await waitFor(() => {
        expect(screen.getByText("Squat")).toBeTruthy();
        expect(screen.getByText("Bench Press")).toBeTruthy();
      });

      expect(screen.getByText("2 PRs")).toBeTruthy();
      expect(screen.getByText("1 PR")).toBeTruthy();
    });

    it("formats dates correctly (Today, Yesterday, Date)", async () => {
      render(<PRHistoryList />);
      await waitFor(() => screen.getByText("Squat"));

      fireEvent.press(screen.getByText("Squat"));

      expect(screen.getByText("Today")).toBeTruthy();
      expect(screen.getByText("Yesterday")).toBeTruthy();

      fireEvent.press(screen.getByText("Bench Press"));

      const dateText = new Date(NOW - DAY_MS * 10).toLocaleDateString(
        undefined,
        { month: "short", day: "numeric" }
      );
      expect(screen.getByText(dateText)).toBeTruthy();
    });
  });

  describe("Interactions", () => {
    it("toggles expansion when clicked (Default Behavior)", async () => {
      render(<PRHistoryList />);
      await waitFor(() => screen.getByText("Squat"));

      expect(screen.queryByText("315 lbs")).toBeNull();

      fireEvent.press(screen.getByText("Squat"));
      expect(screen.getByText("315 lbs")).toBeTruthy();

      fireEvent.press(screen.getByText("Squat"));
      expect(screen.queryByText("315 lbs")).toBeNull();
    });

    it("calls onExercisePress callback if provided (Override Behavior)", async () => {
      const mockPress = jest.fn();
      render(<PRHistoryList onExercisePress={mockPress} />);

      await waitFor(() => screen.getByText("Squat"));

      fireEvent.press(screen.getByText("Squat"));

      expect(mockPress).toHaveBeenCalledWith("Squat");
      expect(screen.queryByText("315 lbs")).toBeNull();
    });
  });

  describe("Sorting Logic", () => {
    it("sorts PRs by reps ascending", async () => {
      render(<PRHistoryList />);
      await waitFor(() => screen.getByText("Squat"));

      fireEvent.press(screen.getByText("Squat"));

      const repTexts = screen.getAllByText(/rep/); // Matches "1 rep", "5 reps"

      // FIX 2: Check for Number type (1) instead of String type ("1")
      // React Native renders variable interpolations {reps} as numbers in the Virtual DOM
      expect(repTexts[0].props.children).toEqual(
        expect.arrayContaining([1, " ", "rep"])
      );
      expect(repTexts[1].props.children).toEqual(
        expect.arrayContaining([5, " ", "reps"])
      );
    });
  });
});
