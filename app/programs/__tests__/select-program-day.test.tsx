import * as ProgramService from "@/src/features/programs/api/programService";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import SelectProgramDayScreen from "../select-program-day";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("@/src/features/programs/api/programService");

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

// Mock based on your real Program interface
const mockProgram = {
  id: "prog-1",
  name: "PPL Routine",
  isActive: true,
  currentDayIndex: 1, // "Pull" is next
  totalWorkoutsCompleted: 5,
  days: [
    // FIX: Included 'exercises: []' to match ProgramDay interface and prevent child component crash
    { id: "d1", name: "Push", dayIndex: 0, programId: "prog-1", exercises: [] },
    { id: "d2", name: "Pull", dayIndex: 1, programId: "prog-1", exercises: [] }, // Pre-selected
    { id: "d3", name: "Legs", dayIndex: 2, programId: "prog-1", exercises: [] },
  ],
  createdAt: 12345,
  updatedAt: 12345,
};

describe("SelectProgramDayScreen Integration", () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      programId: "prog-1",
    });

    // Default success mock
    (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue(
      mockProgram
    );

    jest.spyOn(Alert, "alert");
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Loading & Error States", () => {
    it("shows loading indicator initially", () => {
      // Hold the promise in pending state
      (ProgramService.fetchProgramById as jest.Mock).mockReturnValue(
        new Promise(() => {})
      );

      render(<SelectProgramDayScreen />);

      // Screen title shouldn't be visible yet
      expect(screen.queryByText("PPL Routine")).toBeNull();
    });

    it("handles program not found (null return)", async () => {
      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue(null);

      render(<SelectProgramDayScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Program not found");
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("handles fetch errors", async () => {
      (ProgramService.fetchProgramById as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      render(<SelectProgramDayScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to load program"
        );
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("renders empty state if program has no days", async () => {
      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue({
        ...mockProgram,
        days: [],
      });

      render(<SelectProgramDayScreen />);

      await waitFor(() => {
        expect(screen.getByText("No Days in Program")).toBeTruthy();
      });
    });
  });

  describe("Selection Logic", () => {
    it('pre-selects the "Next Up" day automatically based on currentDayIndex', async () => {
      // currentDayIndex is 1, so 'd2' (Pull) should be selected.
      render(<SelectProgramDayScreen />);

      await waitFor(() => {
        expect(screen.getByText("PPL Routine")).toBeTruthy();
        expect(screen.getByText("Push")).toBeTruthy();
        expect(screen.getByText("Pull")).toBeTruthy();
      });

      // Verify the selection by checking the navigation payload
      fireEvent.press(screen.getByText("Start Workout"));

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/home/start-workout",
        params: {
          programId: "prog-1",
          programDayId: "d2", // Auto-selected
        },
      });
    });

    it("allows selecting a different day manually", async () => {
      render(<SelectProgramDayScreen />);
      await waitFor(() => screen.getByText("PPL Routine"));

      // Manually select 'Legs' (d3)
      fireEvent.press(screen.getByText("Legs"));

      fireEvent.press(screen.getByText("Start Workout"));

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/home/start-workout",
        params: {
          programId: "prog-1",
          programDayId: "d3", // Manually selected
        },
      });
    });

    it("prevents starting workout if selection is somehow invalid", async () => {
      // Simulate a case where currentDayIndex points to a non-existent day (99)
      // and thus nothing is pre-selected.
      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue({
        ...mockProgram,
        currentDayIndex: 99,
      });

      render(<SelectProgramDayScreen />);
      await waitFor(() => screen.getByText("PPL Routine"));

      const startBtn = screen.getByText("Start Workout");
      fireEvent.press(startBtn);

      // Should not navigate because selectedDayId is null
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("navigates back when back button pressed", async () => {
      render(<SelectProgramDayScreen />);
      await waitFor(() => screen.getByText("PPL Routine"));

      fireEvent.press(screen.getByText("←"));
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});
