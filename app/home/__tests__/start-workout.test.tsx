import { fetchTemplateById } from "@/src/features/templates/api/templateService";
import {
  startEmptyWorkout,
  startWorkoutFromTemplate,
} from "@/src/features/workouts/api/workoutService";
import * as programRepo from "@/src/lib/db/repositories/programs";
import { createSessionWithExercises } from "@/src/lib/db/repositories/sessions";
import { generateId } from "@/src/lib/utils/id";
import { workoutStore } from "@/src/stores/workoutStore";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import StartWorkoutScreen from "../start-workout";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/src/features/templates/api/templateService");
jest.mock("@/src/features/workouts/api/workoutService");
jest.mock("@/src/lib/db/repositories/programs");
jest.mock("@/src/lib/db/repositories/sessions");
jest.mock("@/src/lib/utils/id");
jest.mock("@/src/lib/utils/formatters", () => ({
  consolidateSets: jest.fn().mockReturnValue(["3 x 10 @ 100 lbs"]),
}));

jest.mock("@/src/stores/workoutStore", () => ({
  workoutStore: {
    setActiveSession: jest.fn(),
  },
}));

// Mock Weight Hook
jest.mock("@/src/hooks/useWeightDisplay", () => ({
  useWeightDisplay: () => ({
    displayWeight: (w: number) => `${w} lbs`,
  }),
}));

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockTemplate = {
  id: "temp-1",
  name: "Upper Body A",
  description: "Strength focus",
  exercises: [
    {
      id: "ex-1",
      name: "Bench Press",
      targetSets: 3,
      targetReps: 5,
      targetWeight: 135,
      order: 0,
    },
  ],
};

const mockProgramDay = {
  id: "day-1",
  programId: "prog-1",
  name: "Week 1 - Leg Day",
  exercises: [
    {
      id: "pd-ex-1",
      exerciseName: "Squat",
      targetSets: 3,
      targetReps: 5,
      targetWeight: 225,
      order: 0,
      notes: "Go heavy",
    },
    {
      id: "pd-ex-2", // Exercise with individual sets
      exerciseName: "Lunges",
      order: 1,
      sets: [
        { targetReps: 10, targetWeight: 50 },
        { targetReps: 10, targetWeight: 50 },
      ],
    },
  ],
};

const mockSession = { id: "session-123" };

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("StartWorkoutScreen", () => {
  const mockRouter = {
    back: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default mock implementations
    (fetchTemplateById as jest.Mock).mockResolvedValue(mockTemplate);
    (programRepo.getProgramDayById as jest.Mock).mockResolvedValue(
      mockProgramDay
    );
    (startWorkoutFromTemplate as jest.Mock).mockResolvedValue(mockSession);
    (startEmptyWorkout as jest.Mock).mockResolvedValue(mockSession);
    (createSessionWithExercises as jest.Mock).mockResolvedValue(mockSession);
    (generateId as jest.Mock).mockReturnValue("gen-id");

    jest.spyOn(Alert, "alert");
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe("Loading States", () => {
    it("shows empty workout state when no params provided", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});

      render(<StartWorkoutScreen />);

      await waitFor(() => {
        expect(screen.getByText("Empty Workout")).toBeTruthy();
        expect(screen.getByText("No Exercises")).toBeTruthy();
      });
    });

    it("renders loading indicator initially", () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        templateId: "temp-1",
      });
      // Return a pending promise to simulate loading
      (fetchTemplateById as jest.Mock).mockReturnValue(new Promise(() => {}));

      render(<StartWorkoutScreen />);

      // We check that the activity indicator (or its container) is present
      // Since we don't have a testID on the indicator, we check that content is NOT there
      expect(screen.queryByText("Upper Body A")).toBeNull();
    });
  });

  describe("Template Flow", () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        templateId: "temp-1",
      });
    });

    it("loads and displays template details", async () => {
      render(<StartWorkoutScreen />);

      await waitFor(() => {
        expect(screen.getByText("Upper Body A")).toBeTruthy();
        expect(screen.getByText("Strength focus")).toBeTruthy();
        expect(screen.getByText("Bench Press")).toBeTruthy();
        expect(screen.getByText("3 sets")).toBeTruthy();
      });
    });

    it("handles template not found", async () => {
      (fetchTemplateById as jest.Mock).mockResolvedValue(null);

      render(<StartWorkoutScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Template not found");
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("starts workout from template", async () => {
      render(<StartWorkoutScreen />);
      await waitFor(() => screen.getByText("Begin Workout"));

      fireEvent.press(screen.getByText("Begin Workout"));

      await waitFor(() => {
        expect(startWorkoutFromTemplate).toHaveBeenCalledWith(mockTemplate);
        expect(workoutStore.setActiveSession).toHaveBeenCalledWith(mockSession);
        expect(mockRouter.replace).toHaveBeenCalledWith(
          "/home/active-workout?workoutSessionId=session-123"
        );
      });
    });
  });

  describe("Program Day Flow", () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        programId: "prog-1",
        programDayId: "day-1",
      });
    });

    it("loads and displays program day details", async () => {
      render(<StartWorkoutScreen />);

      await waitFor(() => {
        expect(screen.getByText("Week 1 - Leg Day")).toBeTruthy();
        expect(screen.getByText("Squat")).toBeTruthy();
        expect(screen.getByText("Lunges")).toBeTruthy();
        expect(screen.getByText("Note: Go heavy")).toBeTruthy();
      });
    });

    it("handles program day not found", async () => {
      (programRepo.getProgramDayById as jest.Mock).mockResolvedValue(null);

      render(<StartWorkoutScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Program day not found"
        );
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("starts workout from program day (Complex Transformation Logic)", async () => {
      render(<StartWorkoutScreen />);
      await waitFor(() => screen.getByText("Begin Workout"));

      jest.spyOn(Date, "now").mockReturnValue(1000);

      fireEvent.press(screen.getByText("Begin Workout"));

      await waitFor(() => {
        expect(createSessionWithExercises).toHaveBeenCalledWith(
          expect.objectContaining({
            programId: "prog-1",
            programDayId: "day-1",
            name: "Week 1 - Leg Day",
            exercises: expect.arrayContaining([
              expect.objectContaining({
                name: "Squat",
                sets: expect.arrayContaining([
                  expect.objectContaining({
                    setNumber: 1,
                    reps: 5,
                    weight: 225,
                  }),
                  expect.objectContaining({
                    setNumber: 2,
                    reps: 5,
                    weight: 225,
                  }),
                  expect.objectContaining({
                    setNumber: 3,
                    reps: 5,
                    weight: 225,
                  }),
                ]),
              }),
              expect.objectContaining({
                name: "Lunges",
                sets: expect.arrayContaining([
                  expect.objectContaining({
                    setNumber: 1,
                    reps: 10,
                    weight: 50,
                  }),
                  expect.objectContaining({
                    setNumber: 2,
                    reps: 10,
                    weight: 50,
                  }),
                ]),
              }),
            ]),
          })
        );

        expect(workoutStore.setActiveSession).toHaveBeenCalled();
        expect(mockRouter.replace).toHaveBeenCalled();
      });
    });
  });

  describe("Empty Workout Flow", () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({}); // No params
    });

    it("starts empty workout", async () => {
      render(<StartWorkoutScreen />);
      await waitFor(() => screen.getByText("Begin Workout"));

      fireEvent.press(screen.getByText("Begin Workout"));

      await waitFor(() => {
        expect(startEmptyWorkout).toHaveBeenCalledWith("Empty Workout");
        expect(workoutStore.setActiveSession).toHaveBeenCalledWith(mockSession);
        expect(mockRouter.replace).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("handles error during start workout", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});
      (startEmptyWorkout as jest.Mock).mockRejectedValue(new Error("Failed"));

      render(<StartWorkoutScreen />);
      await waitFor(() => screen.getByText("Begin Workout"));

      fireEvent.press(screen.getByText("Begin Workout"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          expect.stringContaining("Failed to start")
        );
      });
    });

    it("handles back navigation", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});
      render(<StartWorkoutScreen />);
      await waitFor(() => screen.getByText("←"));

      fireEvent.press(screen.getByText("←"));

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});
