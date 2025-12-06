import * as ProgramService from "@/src/features/programs/api/programService";
import * as ProgramRepo from "@/src/lib/db/repositories/programs";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import ProgramDayEditorScreen from "../program-day-editor";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("@/src/features/programs/api/programService");
jest.mock("@/src/lib/db/repositories/programs");

jest.mock("@/src/hooks/useWeightDisplay", () => ({
  useWeightDisplay: () => ({
    convertWeight: (w: number) => w,
    parseWeight: (w: number) => w,
    getUnit: () => "lbs",
  }),
}));

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockDayData = {
  id: "day-123",
  name: "Leg Day",
  exercises: [
    {
      id: "ex-1",
      exerciseName: "Squat",
      targetSets: 3,
      sets: [
        { id: "s1", targetReps: 5, targetWeight: 225 },
        { id: "s2", targetReps: 5, targetWeight: 225 },
      ],
      restSeconds: 180,
      notes: "Go deep",
    },
  ],
};

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("ProgramDayEditorScreen", () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      dayId: "day-123",
      programId: "prog-1",
    });

    // Default success mock
    (ProgramRepo.getProgramDayById as jest.Mock).mockResolvedValue(mockDayData);

    jest.spyOn(Alert, "alert");
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  const getSaveButton = () => screen.getByText("Save Day");

  describe("Loading & Rendering", () => {
    it("loads day data and renders correctly", async () => {
      render(<ProgramDayEditorScreen />);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText("e.g., Upper Body");
        expect(nameInput.props.value).toBe("Leg Day");

        expect(screen.getByText("Squat")).toBeTruthy();
        expect(screen.getByText(/5 reps @ 225 lbs/)).toBeTruthy();
      });
    });

    it("handles loading errors", async () => {
      (ProgramRepo.getProgramDayById as jest.Mock).mockRejectedValue(
        new Error("Load failed")
      );

      render(<ProgramDayEditorScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to load program day"
        );
      });
    });
  });

  describe("Legacy & Edge Cases", () => {
    // COVERS: Lines 134-136 (Legacy sets generation) AND Lines 411-415 (Legacy rendering)
    it("handles legacy exercises (no sets array) correctly", async () => {
      const legacyDay = {
        ...mockDayData,
        exercises: [
          {
            id: "legacy-ex",
            exerciseName: "Old School Lift",
            targetSets: 4, // Legacy field
            targetReps: 12, // Legacy field
            targetWeight: 100, // Legacy field
            sets: null, // FORCE legacy path
          },
        ],
      };
      (ProgramRepo.getProgramDayById as jest.Mock).mockResolvedValue(legacyDay);

      render(<ProgramDayEditorScreen />);

      // 1. Verify Legacy Rendering (Lines 411-415)
      await waitFor(() => {
        expect(screen.getByText("Old School Lift")).toBeTruthy();
        // Matches "4 sets × 12 reps @ 100 lbs" logic
        expect(screen.getByText(/4 sets/)).toBeTruthy();
        expect(screen.getByText(/12 reps/)).toBeTruthy();
      });

      // 2. Edit -> Verify Legacy Expansion (Lines 134-136)
      fireEvent.press(screen.getByText("Old School Lift"));

      // Should automatically generate 4 set rows based on targetSets: 4
      const setLabels = screen.getAllByText(/^\d$/); // Matches set numbers "1", "2", "3", "4"
      expect(setLabels).toHaveLength(4);
    });

    // COVERS: Line 258 (Validation)
    it("validates empty exercise name", async () => {
      render(<ProgramDayEditorScreen />);
      await waitFor(() => screen.getByText("Squat"));

      fireEvent.press(screen.getByText("+ Add Exercise"));
      // Don't type anything in the name field

      fireEvent.press(screen.getByText("Save"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Name",
        "Exercise name cannot be empty"
      );
      expect(ProgramService.addProgramDayExercise).not.toHaveBeenCalled();
    });

    // COVERS: Lines 282-283 (Update Failure Catch Block)
    it("shows error alert when updating an exercise fails", async () => {
      (ProgramService.updateProgramDayExercise as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      render(<ProgramDayEditorScreen />);
      await waitFor(() => screen.getByText("Squat"));

      fireEvent.press(screen.getByText("Squat")); // Edit existing
      fireEvent.press(screen.getByText("Save")); // Save immediately

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to save exercise"
        );
      });
    });
  });

  describe("Day Name Management", () => {
    it("updates day name successfully", async () => {
      render(<ProgramDayEditorScreen />);
      await waitFor(() => screen.getByText("Squat"));

      const nameInput = screen.getByPlaceholderText("e.g., Upper Body");
      fireEvent.changeText(nameInput, "Heavy Legs");

      fireEvent.press(getSaveButton());

      await waitFor(() => {
        expect(ProgramService.updateProgramDayName).toHaveBeenCalledWith(
          "day-123",
          "Heavy Legs"
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          "Success",
          "Program day updated"
        );
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("validates empty day name", async () => {
      render(<ProgramDayEditorScreen />);
      await waitFor(() => screen.getByText("Squat"));

      const nameInput = screen.getByPlaceholderText("e.g., Upper Body");
      fireEvent.changeText(nameInput, "");

      fireEvent.press(getSaveButton());

      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Name",
        "Day name cannot be empty"
      );
      expect(ProgramService.updateProgramDayName).not.toHaveBeenCalled();
    });
  });

  describe("Exercise Management (Add/Edit)", () => {
    it("adds a new exercise with sets", async () => {
      (ProgramService.addProgramDayExercise as jest.Mock).mockResolvedValue({
        id: "new-ex",
        exerciseName: "Bench Press",
        restSeconds: 90,
      });

      render(<ProgramDayEditorScreen />);
      await waitFor(() => screen.getByText("Squat"));

      fireEvent.press(screen.getByText("+ Add Exercise"));

      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Squat"),
        "Bench Press"
      );
      fireEvent.changeText(screen.getByPlaceholderText("90"), "120");

      const repInputs = screen.getAllByPlaceholderText("10");
      const weightInputs = screen.getAllByPlaceholderText("225");

      fireEvent.changeText(repInputs[0], "8");
      fireEvent.changeText(weightInputs[0], "135");

      fireEvent.press(screen.getByText("+ Add Set"));

      const newRepInputs = screen.getAllByPlaceholderText("10");
      fireEvent.changeText(newRepInputs[1], "8");

      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(ProgramService.addProgramDayExercise).toHaveBeenCalledWith(
          "day-123",
          expect.objectContaining({
            exerciseName: "Bench Press",
            restSeconds: 120,
            sets: expect.arrayContaining([
              expect.objectContaining({ targetReps: 8, targetWeight: 135 }),
              expect.objectContaining({ targetReps: 8 }),
            ]),
          })
        );
      });
    });

    it("edits an existing exercise", async () => {
      render(<ProgramDayEditorScreen />);
      await waitFor(() => screen.getByText("Squat"));

      fireEvent.press(screen.getByText("Squat"));

      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Squat"),
        "Front Squat"
      );

      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(ProgramService.updateProgramDayExercise).toHaveBeenCalledWith(
          "ex-1",
          expect.objectContaining({
            exerciseName: "Front Squat",
          })
        );
      });
    });
  });

  describe("Set Management Logic", () => {
    it("removes a set row", async () => {
      render(<ProgramDayEditorScreen />);
      await waitFor(() => screen.getByText("Squat"));

      fireEvent.press(screen.getByText("Squat"));

      // Use getAllByTestId because the mock data has 2 sets
      const setDeleteBtns = screen.getAllByTestId("remove-set-btn");
      fireEvent.press(setDeleteBtns[0]);

      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        const updateCall =
          // @ts-ignore
          ProgramService.updateProgramDayExercise.mock.calls[0];
        const payload = updateCall[1];
        expect(payload.sets).toHaveLength(1);
      });
    });
  });

  describe("Deleting Exercises", () => {
    // COVERS: Line 294 (Delete Failure Catch Block)
    it("handles delete errors gracefully", async () => {
      (ProgramService.removeProgramDayExercise as jest.Mock).mockRejectedValue(
        new Error("Delete failed")
      );

      render(<ProgramDayEditorScreen />);
      await waitFor(() => screen.getByText("Squat"));

      const deleteBtn = screen.getByTestId("delete-exercise-btn");
      fireEvent.press(deleteBtn);

      // Confirm
      // @ts-ignore
      const confirmBtn = Alert.alert.mock.calls[0][2].find(
        (b: any) => b.style === "destructive"
      );
      await act(async () => {
        await confirmBtn.onPress();
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to remove exercise"
        );
      });
    });

    it("deletes an exercise after confirmation", async () => {
      (ProgramService.removeProgramDayExercise as jest.Mock).mockResolvedValue(
        true
      );

      render(<ProgramDayEditorScreen />);
      await waitFor(() => screen.getByText("Squat"));

      const deleteBtn = screen.getByTestId("delete-exercise-btn");
      fireEvent.press(deleteBtn);

      // Confirm
      // @ts-ignore
      const confirmBtn = Alert.alert.mock.calls[0][2].find(
        (b: any) => b.style === "destructive"
      );
      await act(async () => {
        await confirmBtn.onPress();
      });

      expect(ProgramService.removeProgramDayExercise).toHaveBeenCalledWith(
        "day-123",
        "ex-1"
      );
      expect(screen.queryByText("Squat")).toBeNull();
    });
  });
});
