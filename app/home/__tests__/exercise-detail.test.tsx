import { useExercise } from "@/src/features/workouts/hooks/useExercise";
import { useWeightDisplay } from "@/src/hooks/useWeightDisplay";
import { useDefaultRestTime } from "@/src/stores/settingsStore";
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
import ExerciseDetailScreen from "../exercise-detail";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("@/src/features/workouts/hooks/useExercise");
jest.mock("@/src/hooks/useWeightDisplay");
jest.mock("@/src/stores/settingsStore");

jest.mock("react-native-gesture-handler", () => {
  const { View } = jest.requireActual("react-native");
  return {
    GestureHandlerRootView: ({ children }: any) => children,
    Swipeable: ({ children, renderRightActions }: any) => (
      <View>
        {children}
        {renderRightActions && renderRightActions()}
      </View>
    ),
  };
});

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockExercise = {
  id: "ex-1",
  name: "Bench Press",
  notes: "Keep elbows tucked",
  sets: [
    { id: "set-1", reps: 10, weight: 135, completed: true },
    { id: "set-2", reps: 8, weight: 145, completed: false },
  ],
};

const mockPreviousSets = [{ id: "prev-set-1", reps: 12, weight: 135 }];

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("ExerciseDetailScreen", () => {
  const mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
  };

  const mockUseExercise = {
    exercise: mockExercise,
    previousSets: mockPreviousSets,
    loading: false,
    error: null,
    addSet: jest.fn(),
    updateSetData: jest.fn(),
    removeSet: jest.fn(),
    toggleSetCompletion: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ exerciseId: "ex-1" });
    (useExercise as jest.Mock).mockReturnValue(mockUseExercise);

    (useWeightDisplay as jest.Mock).mockReturnValue({
      displayWeight: (w: number) => `${w} lbs`,
      convertWeight: (w: number) => w,
      parseWeight: (w: number) => w,
      getUnit: () => "lbs",
    });

    (useDefaultRestTime as jest.Mock).mockReturnValue(90);
    jest.spyOn(Alert, "alert");
  });

  it("renders loading state", () => {
    (useExercise as jest.Mock).mockReturnValue({
      ...mockUseExercise,
      loading: true,
      exercise: null,
    });
    render(<ExerciseDetailScreen />);
    expect(() => screen.getByTestId("exercise-name")).toThrow();
  });

  it("renders error state", () => {
    (useExercise as jest.Mock).mockReturnValue({
      ...mockUseExercise,
      error: { message: "Failed to load" },
      exercise: null,
    });
    render(<ExerciseDetailScreen />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
    expect(screen.getByText("Go Back")).toBeTruthy();
  });

  it("renders exercise details and sets", () => {
    render(<ExerciseDetailScreen />);
    expect(screen.getByTestId("exercise-name")).toBeTruthy();
    expect(screen.getByText("Bench Press")).toBeTruthy();
    expect(screen.getByText("Previous best: 135 lbs × 12")).toBeTruthy();
    expect(screen.getAllByPlaceholderText("0")).toHaveLength(4);
  });

  describe("Navigation", () => {
    it("navigates back on header back button", () => {
      render(<ExerciseDetailScreen />);
      fireEvent.press(screen.getByTestId("header-back-button"));
      expect(mockRouter.back).toHaveBeenCalled();
    });

    it("navigates back on done button", () => {
      render(<ExerciseDetailScreen />);
      fireEvent.press(screen.getByTestId("footer-done-button"));
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe("Best Set Calculation", () => {
    it("calculates and displays the correct best previous set based on volume", () => {
      const complexPreviousSets = [
        { id: "p1", reps: 10, weight: 100 }, // Volume 1000
        { id: "p2", reps: 5, weight: 300 }, // Volume 1500 (Best)
        { id: "p3", reps: 20, weight: 50 }, // Volume 1000
      ];

      (useExercise as jest.Mock).mockReturnValue({
        ...mockUseExercise,
        previousSets: complexPreviousSets,
      });

      render(<ExerciseDetailScreen />);
      expect(screen.getByText("Previous best: 300 lbs × 5")).toBeTruthy();
    });
  });

  describe("Set Interaction", () => {
    it("updates reps on blur", () => {
      render(<ExerciseDetailScreen />);
      const repsInputs = screen.getAllByPlaceholderText("0");
      const repsInput = repsInputs[1];

      fireEvent.changeText(repsInput, "12");
      fireEvent(repsInput, "blur");

      expect(mockUseExercise.updateSetData).toHaveBeenCalledWith("set-1", {
        reps: 12,
      });
    });

    it("updates weight on blur", () => {
      render(<ExerciseDetailScreen />);
      const inputs = screen.getAllByPlaceholderText("0");
      const weightInput = inputs[0];

      fireEvent.changeText(weightInput, "150");
      fireEvent(weightInput, "blur");

      expect(mockUseExercise.updateSetData).toHaveBeenCalledWith("set-1", {
        weight: 150,
      });
    });

    it("resets invalid inputs on blur", () => {
      render(<ExerciseDetailScreen />);
      const inputs = screen.getAllByPlaceholderText("0");
      const weightInput = inputs[0];
      const repsInput = inputs[1];

      // Test Invalid Weight
      fireEvent.changeText(weightInput, "abc");
      fireEvent(weightInput, "blur");
      expect(mockUseExercise.updateSetData).not.toHaveBeenCalled();
      expect(weightInput.props.value).toBe("135"); // Reset to original

      // Test Invalid Reps
      fireEvent.changeText(repsInput, "-5");
      fireEvent(repsInput, "blur");
      expect(mockUseExercise.updateSetData).not.toHaveBeenCalled();
      expect(repsInput.props.value).toBe("10"); // Reset to original
    });
  });

  describe("Completion & Timer", () => {
    it("uncompletes a completed set on press", () => {
      render(<ExerciseDetailScreen />);
      const checkbox = screen.getByTestId("set-checkbox-set-1"); // Set 1 is complete

      fireEvent.press(checkbox);

      expect(mockUseExercise.toggleSetCompletion).toHaveBeenCalledWith(
        "set-1",
        false
      );
    });

    it("toggles an incomplete set and triggers timer if sets remain", async () => {
      // Mock data where Set 1 is incomplete, and Set 2 is also incomplete.
      // completing Set 1 should trigger the timer because Set 2 is still incomplete.
      const incompleteSetsMock = {
        ...mockUseExercise,
        exercise: {
          ...mockExercise,
          sets: [
            { id: "set-1", reps: 10, weight: 135, completed: false }, // Clicking this
            { id: "set-2", reps: 8, weight: 145, completed: false }, // Remaining set
          ],
        },
      };
      (useExercise as jest.Mock).mockReturnValue(incompleteSetsMock);

      render(<ExerciseDetailScreen />);

      const checkbox = screen.getByTestId("set-checkbox-set-1");
      fireEvent.press(checkbox);

      // 1. Verify toggle was called
      expect(incompleteSetsMock.toggleSetCompletion).toHaveBeenCalledWith(
        "set-1",
        true
      );

      // 2. Verify router pushed to timer (logic lines 292-300)
      // Since `toggleSetCompletion` is async in the hook but mocked here as jest.fn(),
      // the component awaits it immediately.
      // We wait for the router effect.
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining("/rest-timer?duration=90")
        );
      });
    });
  });

  describe("Add/Remove Logic", () => {
    it("adds a new set with default values (based on last set)", async () => {
      render(<ExerciseDetailScreen />);
      fireEvent.press(screen.getByText("Add Set"));

      await waitFor(() => {
        expect(mockUseExercise.addSet).toHaveBeenCalledWith({
          reps: 8,
          weight: 145,
        });
      });
    });

    it("adds set using previous workout values when current is empty", async () => {
      const emptyExerciseMock = {
        ...mockUseExercise,
        exercise: { ...mockExercise, sets: [] }, // No sets currently
        previousSets: [{ id: "p1", reps: 15, weight: 200 }], // Previous data
      };
      (useExercise as jest.Mock).mockReturnValue(emptyExerciseMock);

      render(<ExerciseDetailScreen />);
      fireEvent.press(screen.getByText("Add Set"));

      await waitFor(() => {
        expect(emptyExerciseMock.addSet).toHaveBeenCalledWith({
          reps: 15,
          weight: 200,
        });
      });
    });

    it("removes a set after confirmation", async () => {
      render(<ExerciseDetailScreen />);
      const removeButtons = screen.getAllByText("Remove");
      fireEvent.press(removeButtons[0]);

      // @ts-ignore
      const confirmBtn = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.style === "destructive"
      );
      confirmBtn.onPress();

      expect(mockUseExercise.removeSet).toHaveBeenCalledWith("set-1");
    });
  });

  describe("Autofill", () => {
    it("shows autofill button when sets are empty", () => {
      const emptySetsMock = {
        ...mockUseExercise,
        exercise: { ...mockExercise, sets: [] },
        previousSets: mockPreviousSets,
      };
      (useExercise as jest.Mock).mockReturnValue(emptySetsMock);

      render(<ExerciseDetailScreen />);

      const autofillBtn = screen.getByText("Autofill 1 sets from last workout");
      fireEvent.press(autofillBtn);

      // @ts-ignore
      const confirmBtn = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.text === "Autofill"
      );

      act(() => {
        confirmBtn.onPress();
      });

      expect(emptySetsMock.addSet).toHaveBeenCalledWith({
        reps: 12,
        weight: 135,
      });
    });
  });
});
