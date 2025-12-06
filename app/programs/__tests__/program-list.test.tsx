import * as ProgramService from "@/src/features/programs/api/programService";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import ProgramListScreen from "../program-list";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("@/src/features/programs/api/programService");

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockPrograms = [
  { id: "p1", name: "Stronglifts", isActive: true, dayCount: 3 },
  { id: "p2", name: "PPL", isActive: false, dayCount: 6 },
];

describe("ProgramListScreen Integration", () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default success response
    (ProgramService.fetchAllPrograms as jest.Mock).mockResolvedValue(
      mockPrograms
    );

    jest.spyOn(Alert, "alert");
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Rendering", () => {
    it("shows loading indicator initially", () => {
      // Return promise that never resolves to hold loading state
      (ProgramService.fetchAllPrograms as jest.Mock).mockReturnValue(
        new Promise(() => {})
      );

      render(<ProgramListScreen />);
      expect(screen.queryByText("Training Programs")).toBeNull();
    });

    it("renders empty state when no programs exist", async () => {
      (ProgramService.fetchAllPrograms as jest.Mock).mockResolvedValue([]);

      render(<ProgramListScreen />);

      await waitFor(() => {
        expect(screen.getByText("No Programs Yet")).toBeTruthy();
        expect(screen.getAllByText("Create Program").length).toBeGreaterThan(0);
      });
    });

    it("renders list of programs correctly", async () => {
      render(<ProgramListScreen />);

      await waitFor(() => {
        expect(screen.getByText("Training Programs")).toBeTruthy();
        expect(screen.getByText("2 programs")).toBeTruthy();

        expect(screen.getByText("Stronglifts")).toBeTruthy();
        expect(screen.getByText("PPL")).toBeTruthy();

        expect(screen.getByText("3 days")).toBeTruthy();
        expect(screen.getByText("6 days")).toBeTruthy();
      });
    });

    it("handles loading errors gracefully", async () => {
      (ProgramService.fetchAllPrograms as jest.Mock).mockRejectedValue(
        new Error("Fetch failed")
      );

      render(<ProgramListScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to load programs"
        );
      });
    });
  });

  describe("Navigation", () => {
    it("navigates to Program Builder (Create Mode)", async () => {
      (ProgramService.fetchAllPrograms as jest.Mock).mockResolvedValue([]);
      render(<ProgramListScreen />);

      await waitFor(() => screen.getByText("Create Program"));

      fireEvent.press(screen.getByText("Create Program"));

      expect(mockRouter.push).toHaveBeenCalledWith("/programs/program-builder");
    });

    it("navigates to Program Builder (Edit Mode)", async () => {
      render(<ProgramListScreen />);
      await waitFor(() => screen.getByText("Stronglifts"));

      fireEvent.press(screen.getByText("Stronglifts"));

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/programs/program-builder",
        params: { id: "p1" },
      });
    });

    it("navigates back when header back button pressed", async () => {
      render(<ProgramListScreen />);
      await waitFor(() => screen.getByText("Training Programs"));

      fireEvent.press(screen.getByText("←"));
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe("Activation Logic", () => {
    it("activates a valid program successfully", async () => {
      render(<ProgramListScreen />);
      await waitFor(() => screen.getByText("PPL"));

      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue({
        id: "p2",
        days: [{ id: "d1" }],
      });
      (ProgramService.activateProgram as jest.Mock).mockResolvedValue(true);

      // PPL is inactive, so it has an "Activate" button.
      const activateBtn = screen.getByText("Activate");
      fireEvent.press(activateBtn);

      await waitFor(() => {
        expect(ProgramService.activateProgram).toHaveBeenCalledWith("p2");
        expect(Alert.alert).toHaveBeenCalledWith(
          "Success",
          "Program activated"
        );
        expect(ProgramService.fetchAllPrograms).toHaveBeenCalledTimes(2);
      });
    });

    it("prevents activation if program has no days", async () => {
      render(<ProgramListScreen />);
      await waitFor(() => screen.getByText("PPL"));

      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue({
        id: "p2",
        days: [], // No days!
      });

      const activateBtn = screen.getByText("Activate");
      fireEvent.press(activateBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Cannot Activate",
          expect.stringContaining("no days")
        );
        expect(ProgramService.activateProgram).not.toHaveBeenCalled();
      });
    });

    it("handles activation errors", async () => {
      render(<ProgramListScreen />);
      await waitFor(() => screen.getByText("PPL"));

      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue({
        id: "p2",
        days: [{ id: "d1" }],
      });
      (ProgramService.activateProgram as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      const activateBtn = screen.getByText("Activate");
      fireEvent.press(activateBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to activate program"
        );
      });
    });
  });

  describe("Deletion Logic", () => {
    // Helper to find the first delete button
    const findFirstDeleteButton = () => {
      const buttons = screen.queryAllByText("Delete");
      return buttons.length > 0 ? buttons[0] : null;
    };

    it("cancels deletion", async () => {
      render(<ProgramListScreen />);
      await waitFor(() => screen.getByText("Stronglifts"));

      const deleteBtn = findFirstDeleteButton();
      if (!deleteBtn) throw new Error("Could not find Delete button");

      fireEvent.press(deleteBtn);

      expect(Alert.alert).toHaveBeenCalledWith(
        "Delete Program",
        expect.stringContaining("Are you sure"),
        expect.any(Array)
      );

      // Simulate Cancel
      // @ts-ignore
      const cancelBtn = Alert.alert.mock.calls[0][2].find(
        (b: any) => b.style === "cancel" || b.text === "Cancel"
      );
      act(() => {
        cancelBtn.onPress && cancelBtn.onPress();
      });

      expect(ProgramService.removeProgram).not.toHaveBeenCalled();
    });

    it("deletes program upon confirmation", async () => {
      (ProgramService.removeProgram as jest.Mock).mockResolvedValue(true);

      render(<ProgramListScreen />);
      await waitFor(() => screen.getByText("Stronglifts"));

      const deleteBtn = findFirstDeleteButton();
      if (!deleteBtn) throw new Error("Could not find Delete button");

      fireEvent.press(deleteBtn);

      // Simulate Delete press
      // @ts-ignore
      const confirmBtn = Alert.alert.mock.calls[0][2].find(
        (b: any) => b.style === "destructive" || b.text === "Delete"
      );
      await act(async () => {
        await confirmBtn.onPress();
      });

      expect(ProgramService.removeProgram).toHaveBeenCalled();
      expect(ProgramService.fetchAllPrograms).toHaveBeenCalledTimes(2);
    });

    it("handles deletion errors", async () => {
      (ProgramService.removeProgram as jest.Mock).mockRejectedValue(
        new Error("Delete failed")
      );

      render(<ProgramListScreen />);
      await waitFor(() => screen.getByText("Stronglifts"));

      const deleteBtn = findFirstDeleteButton();
      if (!deleteBtn) return;

      fireEvent.press(deleteBtn);

      // Confirm
      // @ts-ignore
      const confirmBtn = Alert.alert.mock.calls[0][2].find(
        (b: any) => b.style === "destructive" || b.text === "Delete"
      );
      await act(async () => {
        await confirmBtn.onPress();
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to delete program"
        );
      });
    });
  });
});
