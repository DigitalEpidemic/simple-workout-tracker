import * as PRService from "@/src/features/workouts/api/prService";
import * as SessionRepo from "@/src/lib/db/repositories/sessions";
import * as SetsRepo from "@/src/lib/db/repositories/sets";
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
import WorkoutSummaryScreen from "../workout-summary";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("@/src/lib/db/repositories/sessions");
jest.mock("@/src/lib/db/repositories/sets");
jest.mock("@/src/features/workouts/api/prService");

jest.mock("@/src/hooks/useWeightDisplay", () => ({
  useWeightDisplay: () => ({
    displayWeight: (w: number) => `${w} lbs`,
    convertWeight: (w: number) => w,
    getUnit: () => "lbs",
    unit: "lbs",
  }),
}));

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockSession = {
  id: "session-123",
  name: "Full Body A",
  startTime: 1000,
  endTime: 4600, // 1 hour later
  duration: 3600, // 1 hour
  notes: "Felt good",
  exercises: [
    {
      id: "ex-1",
      name: "Squat",
      sets: [
        { id: "s1", weight: 225, reps: 5, completed: true },
        { id: "s2", weight: 225, reps: 5, completed: true },
      ],
    },
  ],
};

const mockPRs = [{ id: "pr-1", exerciseName: "Squat", weight: 225, reps: 5 }];

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("WorkoutSummaryScreen", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      workoutSessionId: "session-123",
    });

    // Default Success Mocks
    (SessionRepo.getSessionById as jest.Mock).mockResolvedValue(mockSession);
    (SetsRepo.getTotalVolumeBySessionId as jest.Mock).mockResolvedValue(2250);
    (SetsRepo.countCompletedSetsBySessionId as jest.Mock).mockResolvedValue(2);
    (PRService.detectAndSavePRs as jest.Mock).mockResolvedValue(mockPRs);
    (PRService.formatPRDescription as jest.Mock).mockReturnValue("225 lbs x 5");
    (SessionRepo.updateSession as jest.Mock).mockResolvedValue(true);
    (SessionRepo.deleteSession as jest.Mock).mockResolvedValue(true);

    jest.spyOn(Alert, "alert");
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Loading & Rendering", () => {
    it("renders loading state initially", async () => {
      (SessionRepo.getSessionById as jest.Mock).mockReturnValue(
        new Promise(() => {})
      );

      render(<WorkoutSummaryScreen />);

      // Check for absence of content due to loading
      expect(screen.queryByText("Workout Complete!")).toBeNull();
    });

    it("renders error state if session not found", async () => {
      (SessionRepo.getSessionById as jest.Mock).mockResolvedValue(null);

      render(<WorkoutSummaryScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Workout session not found"
        );
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("renders workout summary correctly", async () => {
      render(<WorkoutSummaryScreen />);

      await waitFor(() => {
        expect(screen.getByText("Workout Complete!")).toBeTruthy();
        expect(screen.getByText("Full Body A")).toBeTruthy();

        // Stats
        expect(screen.getByText("1:00:00")).toBeTruthy(); // Duration
        expect(screen.getByText("2,250")).toBeTruthy(); // Volume
        expect(screen.getByText("2")).toBeTruthy(); // Sets

        // Exercise List
        expect(screen.getByText("Squat")).toBeTruthy();
        // Use getAllByText because we have duplicated sets in mock data
        expect(screen.getAllByText("225 lbs × 5 reps").length).toBeGreaterThan(
          0
        );
      });
    });

    // COVERAGE FIX: Lines 80-81 (Duration > 1 hour)
    it("formats long duration (> 1 hour) correctly", async () => {
      const longSession = { ...mockSession, duration: 3665 }; // 1h 1m 5s
      (SessionRepo.getSessionById as jest.Mock).mockResolvedValue(longSession);

      render(<WorkoutSummaryScreen />);

      await waitFor(() => {
        // "1:01:05"
        expect(screen.getByText("1:01:05")).toBeTruthy();
      });
    });

    // COVERAGE FIX: Line 95 (Null notes)
    it("handles null notes gracefully", async () => {
      const sessionNoNotes = { ...mockSession, notes: null };
      (SessionRepo.getSessionById as jest.Mock).mockResolvedValue(
        sessionNoNotes
      );

      render(<WorkoutSummaryScreen />);

      await waitFor(() => {
        // Check input value is empty string
        const input = screen.getByPlaceholderText(
          "Add notes about this workout..."
        );
        expect(input.props.value).toBe("");
      });
    });

    it("renders PR section if PRs exist", async () => {
      render(<WorkoutSummaryScreen />);

      await waitFor(() => {
        expect(screen.getByText("New Personal Records!")).toBeTruthy();
      });
    });

    it("hides PR section if no PRs", async () => {
      (PRService.detectAndSavePRs as jest.Mock).mockResolvedValue([]);

      render(<WorkoutSummaryScreen />);

      await waitFor(() => {
        expect(screen.getByText("Workout Complete!")).toBeTruthy();
        expect(screen.queryByText("New Personal Records!")).toBeNull();
      });
    });
  });

  describe("Interactions", () => {
    it("allows editing notes", async () => {
      render(<WorkoutSummaryScreen />);
      await waitFor(() => screen.getByText("Notes (Optional)"));

      const input = screen.getByPlaceholderText(
        "Add notes about this workout..."
      );
      fireEvent.changeText(input, "New notes");

      expect(input.props.value).toBe("New notes");
    });
  });

  describe("Save Workout", () => {
    it("saves workout with updated notes and navigates home", async () => {
      render(<WorkoutSummaryScreen />);
      await waitFor(() => screen.getByText("Save Workout"));

      // Update notes
      const input = screen.getByPlaceholderText(
        "Add notes about this workout..."
      );
      fireEvent.changeText(input, "My updated notes");

      fireEvent.press(screen.getByText("Save Workout"));

      await waitFor(() => {
        expect(SessionRepo.updateSession).toHaveBeenCalledWith(
          "session-123",
          expect.objectContaining({
            notes: "My updated notes",
          })
        );

        expect(Alert.alert).toHaveBeenCalledWith(
          "Workout Saved!",
          expect.stringContaining("Great job"),
          expect.any(Array)
        );
      });

      // Simulate OK press
      // @ts-ignore
      const okButton = Alert.alert.mock.calls[0][2][0];
      act(() => {
        okButton.onPress();
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)");
    });

    it("handles save error", async () => {
      (SessionRepo.updateSession as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      render(<WorkoutSummaryScreen />);
      await waitFor(() => screen.getByText("Save Workout"));

      fireEvent.changeText(
        screen.getByPlaceholderText("Add notes about this workout..."),
        "Notes"
      );
      fireEvent.press(screen.getByText("Save Workout"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          expect.stringContaining("Failed to save")
        );
      });
    });
  });

  describe("Discard Workout", () => {
    it("cancels discard", async () => {
      render(<WorkoutSummaryScreen />);
      await waitFor(() => screen.getByText("Discard"));

      fireEvent.press(screen.getByText("Discard"));

      // @ts-ignore
      const cancelButton = Alert.alert.mock.calls[0][2].find(
        (b: any) => b.style === "cancel"
      );

      act(() => {
        if (cancelButton.onPress) cancelButton.onPress();
      });

      expect(SessionRepo.deleteSession).not.toHaveBeenCalled();
    });

    it("discards workout and navigates home", async () => {
      render(<WorkoutSummaryScreen />);
      await waitFor(() => screen.getByText("Discard"));

      fireEvent.press(screen.getByText("Discard"));

      // Confirm Discard
      // @ts-ignore
      const discardButton = Alert.alert.mock.calls[0][2].find(
        (b: any) => b.style === "destructive"
      );

      await act(async () => {
        await discardButton.onPress();
      });

      expect(SessionRepo.deleteSession).toHaveBeenCalledWith("session-123");
      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)");
    });

    // COVERAGE FIX: Line 172 (Discard failure)
    it("handles discard error", async () => {
      (SessionRepo.deleteSession as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      render(<WorkoutSummaryScreen />);
      await waitFor(() => screen.getByText("Discard"));

      fireEvent.press(screen.getByText("Discard"));

      // Confirm Discard
      // @ts-ignore
      const discardButton = Alert.alert.mock.calls[0][2].find(
        (b: any) => b.style === "destructive"
      );

      await act(async () => {
        await discardButton.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("Failed to discard")
      );
    });
  });

  describe("Foratting", () => {
    it("handles singular formats (1 set, 1 rep, 1 exercise) and short duration", async () => {
      const singularSession = {
        ...mockSession,
        duration: 59, // 59 seconds (Hits the "else" in formatDuration, i.e., < 1 hour)
        exercises: [
          {
            id: "ex-1",
            name: "Pull Up",
            sets: [
              { id: "s1", weight: 0, reps: 1, completed: true }, // 1 rep
            ],
          },
        ],
      };

      (SessionRepo.getSessionById as jest.Mock).mockResolvedValue(
        singularSession
      );
      (SetsRepo.countCompletedSetsBySessionId as jest.Mock).mockResolvedValue(
        1
      ); // 1 set

      render(<WorkoutSummaryScreen />);

      await waitFor(() => {
        // Duration formatting (0:59) - Hits line 80-81 else path
        expect(screen.getByText("0:59")).toBeTruthy();

        // Singular Pluralization Checks
        expect(screen.getByText("1 set completed")).toBeTruthy();
        expect(screen.getByText("Exercise")).toBeTruthy(); // Not "Exercises"
        expect(screen.getByText("Set")).toBeTruthy(); // Not "Sets"
        expect(screen.getAllByText(/1 rep/).length).toBeGreaterThan(0); // Not "reps"
      });
    });
  });
});
