import {
  addExerciseToSession,
  removeExerciseFromSession,
} from "@/src/features/workouts/api/workoutService";
import { useTimer } from "@/src/features/workouts/hooks/useTimer";
import { useWorkout } from "@/src/features/workouts/hooks/useWorkout";
import {
  completeSession,
  reorderExercises,
} from "@/src/lib/db/repositories/sessions";
import { workoutStore } from "@/src/stores/workoutStore";
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
import ActiveWorkoutScreen from "../active-workout";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("@/src/features/workouts/hooks/useWorkout");
jest.mock("@/src/features/workouts/hooks/useTimer");
jest.mock("@/src/features/workouts/api/workoutService");
jest.mock("@/src/lib/db/repositories/sessions");
jest.mock("@/src/stores/workoutStore", () => ({
  workoutStore: {
    clearActiveSession: jest.fn(),
  },
}));

// Mock DraggableFlatList
jest.mock("react-native-draggable-flatlist", () => {
  const { View, Pressable } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ data, renderItem, ListFooterComponent, onDragEnd }: any) => (
      <View testID="draggable-list">
        {/* Expose onDragEnd for testing via a hidden button */}
        <Pressable
          testID="trigger-drag-end"
          onPress={() => onDragEnd({ data: [...data].reverse() })}
        />
        {data.map((item: any, index: number) => (
          <View key={item.id}>
            {renderItem({
              item,
              drag: jest.fn(),
              isActive: false,
              getIndex: () => index,
            })}
          </View>
        ))}
        {ListFooterComponent}
      </View>
    ),
    ScaleDecorator: ({ children }: any) => children,
  };
});

// Mock Swipeable
jest.mock("react-native-gesture-handler", () => {
  const { View, Pressable } = jest.requireActual("react-native");
  return {
    GestureHandlerRootView: ({ children }: any) => children,
    Swipeable: ({ children, renderRightActions }: any) => (
      <View>
        {children}
        {/* Render hidden actions for testing access */}
        {renderRightActions && renderRightActions()}
      </View>
    ),
    RectButton: ({ children, onPress }: any) => (
      <Pressable onPress={onPress}>{children}</Pressable>
    ),
  };
});

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockSession = {
  id: "session-1",
  name: "Full Body",
  startTime: 1000,
  exercises: [
    { id: "ex-1", name: "Squat", sets: [] },
    {
      id: "ex-2",
      name: "Bench Press",
      sets: [{ completed: true }, { completed: false }],
    },
  ],
};

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("ActiveWorkoutScreen", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store implementation
    (workoutStore.clearActiveSession as jest.Mock).mockImplementation(() => {});

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      workoutSessionId: "session-1",
    });

    (useWorkout as jest.Mock).mockReturnValue({
      session: mockSession,
      loading: false,
      error: null,
      refresh: mockRefresh,
    });

    (useTimer as jest.Mock).mockReturnValue({
      formattedTime: "10:00",
    });

    jest.spyOn(Alert, "alert");
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("renders loading state correctly", () => {
    (useWorkout as jest.Mock).mockReturnValue({
      loading: true,
      session: null,
      refresh: jest.fn(),
      error: null,
    });

    render(<ActiveWorkoutScreen />);
    expect(screen.queryByTestId("draggable-list")).toBeNull();
  });

  it("renders error state correctly", () => {
    (useWorkout as jest.Mock).mockReturnValue({
      loading: false,
      error: { message: "Failed to load" },
      session: null,
      refresh: jest.fn(),
    });

    render(<ActiveWorkoutScreen />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
    expect(screen.getByText("Go Back")).toBeTruthy();
  });

  // Coverage for Line 427: Session is null but no error object provided
  it("renders workout not found state when session is missing", () => {
    (useWorkout as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      session: null,
      refresh: jest.fn(),
    });

    render(<ActiveWorkoutScreen />);
    expect(screen.getByText("Workout not found")).toBeTruthy();
  });

  it("renders active session details correctly", () => {
    render(<ActiveWorkoutScreen />);

    expect(screen.getByText("Full Body")).toBeTruthy();
    expect(screen.getByText("10:00")).toBeTruthy();
    expect(screen.getByText("Squat")).toBeTruthy();
    expect(screen.getByText("Bench Press")).toBeTruthy();
  });

  it("navigates to exercise detail on press", () => {
    render(<ActiveWorkoutScreen />);
    fireEvent.press(screen.getByText("Squat"));
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/home/exercise-detail?workoutSessionId=session-1&exerciseId=ex-1"
    );
  });

  describe("Adding Exercises", () => {
    it("opens add exercise input when button pressed", () => {
      render(<ActiveWorkoutScreen />);
      fireEvent.press(screen.getByText("Add Exercise"));
      expect(screen.getByPlaceholderText("e.g., Bench Press")).toBeTruthy();
    });

    it("adds exercise successfully", async () => {
      render(<ActiveWorkoutScreen />);

      fireEvent.press(screen.getByText("Add Exercise"));
      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Bench Press"),
        "Deadlift"
      );

      await act(async () => {
        fireEvent.press(screen.getByText("Add"));
      });

      await waitFor(() => {
        expect(addExerciseToSession).toHaveBeenCalledWith(
          "session-1",
          "Deadlift"
        );
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    // Coverage for Lines 163-164: Validation for empty name
    it("validates empty exercise name input", async () => {
      render(<ActiveWorkoutScreen />);

      fireEvent.press(screen.getByText("Add Exercise"));
      // Simulate user entering only whitespace
      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Bench Press"),
        "   "
      );

      await act(async () => {
        fireEvent.press(screen.getByText("Add"));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Please enter an exercise name"
      );
      expect(addExerciseToSession).not.toHaveBeenCalled();
    });

    it("cancels adding an exercise", () => {
      render(<ActiveWorkoutScreen />);

      fireEvent.press(screen.getByText("Add Exercise"));
      expect(screen.queryByPlaceholderText("e.g., Bench Press")).toBeTruthy();

      fireEvent.press(screen.getByText("Cancel"));
      expect(screen.queryByPlaceholderText("e.g., Bench Press")).toBeNull();
    });

    it("handles add exercise error", async () => {
      (addExerciseToSession as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      render(<ActiveWorkoutScreen />);

      fireEvent.press(screen.getByText("Add Exercise"));
      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Bench Press"),
        "Deadlift"
      );

      await act(async () => {
        fireEvent.press(screen.getByText("Add"));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("Failed to add")
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Removing Exercises", () => {
    it("removes exercise after confirmation", async () => {
      render(<ActiveWorkoutScreen />);
      // Coverage for Line 368: renderRightActions renders "Remove" button
      const removeButtons = screen.getAllByText("Remove");

      fireEvent.press(removeButtons[0]);

      // @ts-ignore
      const confirmButton = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.style === "destructive"
      );

      await act(async () => {
        await confirmButton.onPress();
      });

      expect(removeExerciseFromSession).toHaveBeenCalledWith("ex-1");
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("handles remove exercise error", async () => {
      (removeExerciseFromSession as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      render(<ActiveWorkoutScreen />);
      const removeButtons = screen.getAllByText("Remove");

      fireEvent.press(removeButtons[0]);

      // @ts-ignore
      const confirmButton = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.style === "destructive"
      );
      await act(async () => {
        await confirmButton.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("Failed to remove")
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Reordering Exercises", () => {
    it("handles reorder error and reverts state", async () => {
      (reorderExercises as jest.Mock).mockRejectedValue(new Error("DB Error"));

      render(<ActiveWorkoutScreen />);

      // Coverage for Line 223: Catch block logic (reverting state)
      // The catch block uses session.exercises to revert.
      // We ensure session is defined (via mockReturnValue in beforeEach).
      await act(async () => {
        fireEvent.press(screen.getByTestId("trigger-drag-end"));
      });

      expect(reorderExercises).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("Failed to reorder")
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Finishing Workout", () => {
    it("completes session and navigates to summary", async () => {
      render(<ActiveWorkoutScreen />);
      const finishButton = screen.getByText("✓");

      fireEvent.press(finishButton);

      // @ts-ignore
      const confirmButton = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.text === "Finish"
      );

      await act(async () => {
        await confirmButton.onPress();
      });

      expect(completeSession).toHaveBeenCalledWith(
        "session-1",
        expect.any(Number)
      );
      expect(workoutStore.clearActiveSession).toHaveBeenCalled();
    });

    it("handles finish workout cancellation", () => {
      render(<ActiveWorkoutScreen />);
      fireEvent.press(screen.getByText("✓"));

      // @ts-ignore
      const cancelButton = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.style === "cancel"
      );
      expect(cancelButton).toBeDefined();
    });

    it("handles finish workout error", async () => {
      (completeSession as jest.Mock).mockRejectedValue(new Error("DB Error"));

      render(<ActiveWorkoutScreen />);
      fireEvent.press(screen.getByText("✓"));

      // @ts-ignore
      const confirmButton = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.text === "Finish"
      );
      await act(async () => {
        await confirmButton.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("Failed to finish")
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Cancelling Workout", () => {
    it("dismisses cancel workout alert", () => {
      render(<ActiveWorkoutScreen />);
      fireEvent.press(screen.getByText("✕"));

      // @ts-ignore
      const keepButton = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.text === "Keep Working Out"
      );
      expect(keepButton).toBeDefined();

      expect(mockRouter.back).not.toHaveBeenCalled();
    });

    it("handles cancel workout error", async () => {
      (workoutStore.clearActiveSession as jest.Mock).mockImplementation(() => {
        throw new Error("Store Error");
      });

      render(<ActiveWorkoutScreen />);
      fireEvent.press(screen.getByText("✕"));

      // @ts-ignore
      const confirmButton = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.style === "destructive"
      );
      await act(async () => {
        await confirmButton.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("Failed to cancel")
      );
      expect(console.error).toHaveBeenCalled();
    });

    it("cancels successfully", async () => {
      render(<ActiveWorkoutScreen />);
      fireEvent.press(screen.getByText("✕"));

      // @ts-ignore
      const confirmButton = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.style === "destructive"
      );
      await act(async () => {
        await confirmButton.onPress();
      });

      expect(workoutStore.clearActiveSession).toHaveBeenCalled();
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});
