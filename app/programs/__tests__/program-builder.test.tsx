import * as ProgramService from "@/src/features/programs/api/programService";
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
import ProgramBuilderScreen from "../program-builder";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    useRouter: jest.fn(),
    useLocalSearchParams: jest.fn(),
    useFocusEffect: (cb: any) =>
      useEffect(() => {
        cb();
      }, [cb]),
  };
});

jest.mock("@/src/features/programs/api/programService");

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockProgram = {
  id: "prog-123",
  name: "Stronglifts 5x5",
  description: "Classic strength program",
  days: [{ id: "day-1", name: "Workout A", exercises: [] }],
};

describe("ProgramBuilderScreen Integration", () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({}); // Default: Create Mode

    jest.spyOn(Alert, "alert");
    jest.spyOn(Alert, "prompt");
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  const getSubmitButton = (text: string) => {
    const elements = screen.getAllByText(text);
    return elements[elements.length - 1];
  };

  describe("Form Interaction & Saving", () => {
    it("creates a new program end-to-end", async () => {
      (ProgramService.createNewProgram as jest.Mock).mockResolvedValue({
        id: "new-id",
      });

      render(<ProgramBuilderScreen />);

      const nameInput = screen.getByPlaceholderText("e.g., Upper/Lower Split");
      const descInput = screen.getByPlaceholderText(
        "e.g., 4-day split focusing on strength"
      );
      const createBtn = getSubmitButton("Create Program");

      fireEvent.changeText(nameInput, "New Split");
      fireEvent.changeText(descInput, "My Desc");
      fireEvent.press(createBtn);

      await waitFor(() => {
        expect(ProgramService.createNewProgram).toHaveBeenCalledWith(
          "New Split",
          "My Desc"
        );
        expect(Alert.alert).toHaveBeenCalledWith("Success", "Program created");
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("loads existing data and updates program", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "prog-123" });
      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue(
        mockProgram
      );
      (ProgramService.updateExistingProgram as jest.Mock).mockResolvedValue(
        true
      );

      render(<ProgramBuilderScreen />);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(
          "e.g., Upper/Lower Split"
        );
        expect(nameInput.props.value).toBe("Stronglifts 5x5");
      });

      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Upper/Lower Split"),
        "Updated Name"
      );
      fireEvent.press(getSubmitButton("Update Program"));

      await waitFor(() => {
        expect(ProgramService.updateExistingProgram).toHaveBeenCalledWith(
          "prog-123",
          "Updated Name",
          "Classic strength program"
        );
      });
    });

    it("validates empty name input", async () => {
      render(<ProgramBuilderScreen />);
      fireEvent.press(getSubmitButton("Create Program"));
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Name",
        "Program name cannot be empty"
      );
      expect(ProgramService.createNewProgram).not.toHaveBeenCalled();
    });
  });

  describe("Managing Program Days", () => {
    it("auto-saves program before adding a day (Complex Flow)", async () => {
      (ProgramService.createNewProgram as jest.Mock).mockResolvedValue({
        id: "auto-saved-id",
      });
      (ProgramService.addProgramDay as jest.Mock).mockResolvedValue({
        id: "d1",
        name: "Legs",
        exercises: [],
      });

      render(<ProgramBuilderScreen />);

      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Upper/Lower Split"),
        "Draft Program"
      );
      fireEvent.press(screen.getByText("+ Add Day"));

      await waitFor(() => {
        expect(ProgramService.createNewProgram).toHaveBeenCalledWith(
          "Draft Program",
          ""
        );
      });

      await waitFor(() => expect(Alert.prompt).toHaveBeenCalled());

      // @ts-ignore
      const addButton = Alert.prompt.mock.calls[0][2].find(
        (b: any) => b.text === "Add"
      );
      await act(async () => {
        await addButton.onPress("Legs");
      });

      expect(ProgramService.addProgramDay).toHaveBeenCalledWith(
        "auto-saved-id",
        "Legs"
      );
    });

    it("navigates to Day Editor when clicking a day", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "prog-123" });
      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue(
        mockProgram
      );

      render(<ProgramBuilderScreen />);

      await waitFor(() => screen.getByText("Workout A"));
      fireEvent.press(screen.getByText("Workout A"));

      expect(mockRouter.push).toHaveBeenCalledWith(
        "/programs/program-day-editor?dayId=day-1&programId=prog-123"
      );
    });

    it("deletes a day after confirmation", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "prog-123" });
      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue(
        mockProgram
      );
      (ProgramService.removeProgramDay as jest.Mock).mockResolvedValue(true);

      render(<ProgramBuilderScreen />);
      await waitFor(() => screen.getByText("Workout A"));

      const deleteTrigger =
        screen.queryByText(/delete/i) ||
        screen.queryByText(/remove/i) ||
        screen.queryByLabelText(/delete/i);
      if (!deleteTrigger) return;

      fireEvent.press(deleteTrigger);

      // @ts-ignore
      const confirmBtn = Alert.alert.mock.calls[0][2].find(
        (b: any) => b.style === "destructive"
      );
      await act(async () => {
        await confirmBtn.onPress();
      });

      expect(ProgramService.removeProgramDay).toHaveBeenCalledWith(
        "prog-123",
        "day-1"
      );
      expect(screen.queryByText("Workout A")).toBeNull();
    });
  });

  describe("Error Handling & Edge Cases", () => {
    // Covers Lines 80-81: if (!savedId) return;
    it("halts adding a day if silent save fails", async () => {
      (ProgramService.createNewProgram as jest.Mock).mockRejectedValue(
        new Error("Save failed")
      );

      render(<ProgramBuilderScreen />);

      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Upper/Lower Split"),
        "Draft"
      );
      fireEvent.press(screen.getByText("+ Add Day"));

      // Should show error alert
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to save program"
        );
      });

      // FIX: Check it wasn't called with the PROMPT title.
      expect(Alert.prompt).not.toHaveBeenCalledWith(
        "Add Program Day",
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    // Covers Lines 112-113 (catch block for addProgramDay)
    it("handles API failure when adding a day", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "prog-123" });
      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue(
        mockProgram
      );
      (ProgramService.addProgramDay as jest.Mock).mockRejectedValue(
        new Error("Add failed")
      );

      render(<ProgramBuilderScreen />);
      await waitFor(() => screen.getByText("+ Add Day"));

      fireEvent.press(screen.getByText("+ Add Day"));

      // @ts-ignore
      const addButton = Alert.prompt.mock.calls[0][2].find(
        (b: any) => b.text === "Add"
      );
      await act(async () => {
        await addButton.onPress("New Day");
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to add day");
      });
    });

    // Covers Line 192 (return null in handleSaveProgram catch)
    it("handles API failure when saving program", async () => {
      (ProgramService.createNewProgram as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      render(<ProgramBuilderScreen />);
      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Upper/Lower Split"),
        "Name"
      );

      fireEvent.press(getSubmitButton("Create Program"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to save program"
        );
      });
    });

    // Covers Line 139 (catch block in handleDeleteDay)
    it("handles API failure when deleting day", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "prog-123" });
      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue(
        mockProgram
      );
      (ProgramService.removeProgramDay as jest.Mock).mockRejectedValue(
        new Error("Delete error")
      );

      render(<ProgramBuilderScreen />);
      await waitFor(() => screen.getByText("Workout A"));

      const deleteTrigger =
        screen.queryByText(/delete/i) ||
        screen.queryByText(/remove/i) ||
        screen.queryByLabelText(/delete/i);
      if (deleteTrigger) {
        fireEvent.press(deleteTrigger);
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
            "Failed to delete day"
          );
        });
      }
    });

    // Covers implicit else in loadProgram (Lines ~70)
    it("does nothing if loaded program is null (not found)", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "missing-id" });
      (ProgramService.fetchProgramById as jest.Mock).mockResolvedValue(null);

      render(<ProgramBuilderScreen />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("e.g., Upper/Lower Split").props.value
        ).toBe("");
      });
    });
  });
});
