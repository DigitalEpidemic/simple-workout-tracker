import * as PRService from "@/src/features/workouts/api/prService";
import * as PRRepo from "@/src/lib/db/repositories/pr-records";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";
import PRHistoryScreen from "../pr-history";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("@/src/lib/db/repositories/pr-records");
jest.mock("@/src/features/workouts/api/prService");

// Mock hooks needed by the child component (PRHistoryList)
jest.mock("@/src/hooks/useWeightDisplay", () => ({
  useWeightDisplay: () => ({
    displayWeight: (w: number) => `${w} lbs`,
  }),
}));

// NOTE: We are NOT mocking PRHistoryList. We are testing the integration.

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockPRs = [{ id: "pr1", reps: 5, weight: 225, achievedAt: Date.now() }];

describe("PRHistoryScreen Integration", () => {
  const mockRouter = { back: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Setup success mocks for the child component's data fetching
    (PRService.getDisplayName as jest.Mock).mockImplementation((name) => name);
    (PRRepo.getExerciseNamesWithPRs as jest.Mock).mockResolvedValue(["Squat"]);
    (PRRepo.getPRsByExerciseName as jest.Mock).mockResolvedValue(mockPRs);
  });

  it("renders the screen title and fetches data", async () => {
    render(<PRHistoryScreen />);

    // 1. Verify Header (Screen level)
    expect(screen.getByText("Personal Records")).toBeTruthy();
    expect(screen.getByText("←")).toBeTruthy();

    // 2. Verify Child Component (PRHistoryList) loaded data
    await waitFor(() => {
      // "Squat" comes from the mocked data repository
      expect(screen.getByText("Squat")).toBeTruthy();
      expect(screen.getByText("1 PR")).toBeTruthy();
    });
  });

  it("navigates back when the back button is pressed", async () => {
    render(<PRHistoryScreen />);

    // Wait for content to ensure screen is interactive
    await waitFor(() => screen.getByText("Personal Records"));

    const backButton = screen.getByText("←");
    fireEvent.press(backButton);

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
