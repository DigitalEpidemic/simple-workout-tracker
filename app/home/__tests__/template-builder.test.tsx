import * as TemplateService from "@/src/features/templates/api/templateService";
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
import TemplateBuilderScreen from "../template-builder";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("@/src/features/templates/api/templateService");

jest.mock("@/src/hooks/useWeightDisplay", () => ({
  useWeightDisplay: () => ({
    convertWeight: (w: number) => w,
    parseWeight: (w: number) => w,
    getUnit: () => "lbs",
  }),
}));

jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAwareScrollView: ({ children }: any) => children,
}));

// Robustly mock Modal via the main react-native module
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  // FIX: Use jest.requireActual instead of require() to satisfy linter
  const React = jest.requireActual("react");

  RN.Alert.alert = jest.fn();

  const MockModal = ({ visible, children }: any) => {
    return visible
      ? React.createElement(RN.View, { testID: "mock-modal" }, children)
      : null;
  };
  MockModal.displayName = "MockModal";

  RN.Modal = MockModal;
  return RN;
});

// Mock ExerciseListItem to simplify list interaction
jest.mock("@/src/features/templates/components/ExerciseListItem", () => ({
  ExerciseListItem: ({ exercise, onPress, onRemove }: any) => {
    // FIX: Use jest.requireActual instead of require()
    const { View, Text, Pressable } = jest.requireActual("react-native");
    return (
      <View testID={`exercise-item-${exercise.name}`}>
        <Pressable onPress={onPress} testID={`edit-${exercise.name}`}>
          <Text>{exercise.name}</Text>
          <Text>
            {exercise.targetSets} x {exercise.targetReps}
          </Text>
        </Pressable>
        <Pressable onPress={onRemove} testID={`remove-${exercise.name}`}>
          <Text>Remove</Text>
        </Pressable>
      </View>
    );
  },
}));

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockTemplate = {
  id: "temp-1",
  name: "Full Body A",
  description: "Monday Routine",
  exercises: [
    {
      id: "ex-1",
      name: "Bench Press",
      targetSets: 3,
      targetReps: 10,
      targetWeight: 135,
      order: 0,
      notes: "Touch chest",
    },
  ],
};

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("TemplateBuilderScreen", () => {
  const mockRouter = {
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    (TemplateService.validateTemplateName as jest.Mock).mockReturnValue(null);
    (TemplateService.validateExerciseName as jest.Mock).mockReturnValue(null);
    (TemplateService.validateExerciseTargets as jest.Mock).mockReturnValue(
      null
    );

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Rendering", () => {
    it('renders "New Template" mode correctly', () => {
      render(<TemplateBuilderScreen />);

      expect(screen.getByText("New Template")).toBeTruthy();
      expect(
        screen.getByPlaceholderText("e.g., Push Day, Leg Day")
      ).toBeTruthy();
      expect(screen.getByText("Exercises (0)")).toBeTruthy();
    });

    it('renders "Edit Template" mode and loads data', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        templateId: "temp-1",
      });
      (TemplateService.fetchTemplateById as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      render(<TemplateBuilderScreen />);

      await waitFor(() => {
        expect(screen.getByText("Edit Template")).toBeTruthy();
        expect(screen.getByDisplayValue("Full Body A")).toBeTruthy();
        expect(screen.getByDisplayValue("Monday Routine")).toBeTruthy();
        expect(screen.getByText("Exercises (1)")).toBeTruthy();
        expect(screen.getByText("Bench Press")).toBeTruthy();
      });
    });

    it("handles load error in Edit mode", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        templateId: "temp-1",
      });
      (TemplateService.fetchTemplateById as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      render(<TemplateBuilderScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to load template"
        );
      });
    });
  });

  describe("Adding Exercises", () => {
    it("opens modal, fills form, and adds exercise", async () => {
      render(<TemplateBuilderScreen />);

      fireEvent.press(screen.getByText("Add Exercise"));
      expect(screen.getByText("Exercise Name")).toBeTruthy();

      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Bench Press, Squat"),
        "Squat"
      );
      fireEvent.changeText(screen.getByPlaceholderText("3"), "5");
      fireEvent.changeText(screen.getByPlaceholderText("10"), "5");
      fireEvent.changeText(screen.getByPlaceholderText("135"), "225");

      fireEvent.press(screen.getByText("Save"));

      expect(TemplateService.validateExerciseName).toHaveBeenCalledWith(
        "Squat"
      );
      expect(TemplateService.validateExerciseTargets).toHaveBeenCalledWith(
        5,
        5,
        225
      );

      await waitFor(() => {
        expect(screen.getByText("Exercises (1)")).toBeTruthy();
        expect(screen.getByText("Squat")).toBeTruthy();
      });
    });

    it("validates exercise input", () => {
      (TemplateService.validateExerciseName as jest.Mock).mockReturnValue(
        "Name required"
      );

      render(<TemplateBuilderScreen />);
      fireEvent.press(screen.getByText("Add Exercise"));
      fireEvent.press(screen.getByText("Save"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Exercise Name",
        "Name required"
      );
      expect(screen.getByText("Exercise Name")).toBeTruthy(); // Modal still open
    });

    it("validates target inputs", () => {
      (TemplateService.validateExerciseTargets as jest.Mock).mockReturnValue(
        "Invalid targets"
      );

      render(<TemplateBuilderScreen />);
      fireEvent.press(screen.getByText("Add Exercise"));
      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Bench Press, Squat"),
        "Valid Name"
      );
      fireEvent.press(screen.getByText("Save"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Targets",
        "Invalid targets"
      );
    });
  });

  describe("Editing Exercises", () => {
    it("opens modal with existing data and updates exercise", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        templateId: "temp-1",
      });
      (TemplateService.fetchTemplateById as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      render(<TemplateBuilderScreen />);
      await waitFor(() => screen.getByText("Bench Press"));

      fireEvent.press(screen.getByTestId("edit-Bench Press"));

      expect(screen.getByDisplayValue("Bench Press")).toBeTruthy();
      expect(screen.getByDisplayValue("3")).toBeTruthy();

      fireEvent.changeText(
        screen.getByDisplayValue("Bench Press"),
        "Incline Bench"
      );
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText("Incline Bench")).toBeTruthy();
        expect(screen.queryByText("Bench Press")).toBeNull();
      });
    });

    it("handles editing an exercise with missing optional fields", async () => {
      const mockTemplateIncomplete = {
        ...mockTemplate,
        exercises: [{ id: "ex-2", name: "Pullups", order: 0 }],
      };
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        templateId: "temp-1",
      });
      (TemplateService.fetchTemplateById as jest.Mock).mockResolvedValue(
        mockTemplateIncomplete
      );

      render(<TemplateBuilderScreen />);
      await waitFor(() => screen.getByText("Pullups"));

      fireEvent.press(screen.getByTestId("edit-Pullups"));

      const weightInput = screen.getByPlaceholderText("135");
      expect(weightInput.props.value).toBe("");

      const notesInput = screen.getByPlaceholderText("Form cues, tips, etc.");
      expect(notesInput.props.value).toBe("");

      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText("Pullups")).toBeTruthy();
      });
    });
  });

  describe("Removing Exercises", () => {
    it("removes exercise after confirmation", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        templateId: "temp-1",
      });
      (TemplateService.fetchTemplateById as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      render(<TemplateBuilderScreen />);
      await waitFor(() => screen.getByText("Bench Press"));

      fireEvent.press(screen.getByTestId("remove-Bench Press"));

      // @ts-ignore
      const confirmBtn = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.style === "destructive"
      );

      act(() => {
        confirmBtn.onPress();
      });

      await waitFor(() => {
        expect(screen.getByText("Exercises (0)")).toBeTruthy();
        expect(screen.queryByText("Bench Press")).toBeNull();
      });
    });

    it("reorders remaining exercises when one is removed", async () => {
      const mockMulti = {
        ...mockTemplate,
        exercises: [
          { id: "1", name: "A", order: 0 },
          { id: "2", name: "B", order: 1 },
          { id: "3", name: "C", order: 2 },
        ],
      };
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        templateId: "temp-1",
      });
      (TemplateService.fetchTemplateById as jest.Mock).mockResolvedValue(
        mockMulti
      );

      render(<TemplateBuilderScreen />);
      await waitFor(() => screen.getByText("B"));

      fireEvent.press(screen.getByTestId("remove-B"));

      // @ts-ignore
      const confirmBtn = Alert.alert.mock.calls[0][2].find(
        (btn: any) => btn.style === "destructive"
      );
      act(() => confirmBtn.onPress());

      fireEvent.press(screen.getByText("Update Template"));

      await waitFor(() => {
        expect(TemplateService.updateExistingTemplate).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.any(String),
          expect.arrayContaining([
            expect.objectContaining({ name: "A", order: 0 }),
            expect.objectContaining({ name: "C", order: 1 }),
          ])
        );
      });
    });
  });

  describe("Saving Template", () => {
    it("validates template name", () => {
      (TemplateService.validateTemplateName as jest.Mock).mockReturnValue(
        "Name required"
      );

      render(<TemplateBuilderScreen />);
      fireEvent.press(screen.getByText("Save Template"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Template Name",
        "Name required"
      );
      expect(TemplateService.createNewTemplate).not.toHaveBeenCalled();
    });

    it("validates empty exercises", () => {
      render(<TemplateBuilderScreen />);
      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Push Day, Leg Day"),
        "My Workout"
      );

      fireEvent.press(screen.getByText("Save Template"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "No Exercises",
        expect.any(String)
      );
      expect(TemplateService.createNewTemplate).not.toHaveBeenCalled();
    });

    it("creates new template successfully", async () => {
      render(<TemplateBuilderScreen />);

      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Push Day, Leg Day"),
        "New Routine"
      );

      fireEvent.press(screen.getByText("Add Exercise"));
      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Bench Press, Squat"),
        "Dip"
      );
      fireEvent.press(screen.getByText("Save"));

      fireEvent.press(screen.getByText("Save Template"));

      await waitFor(() => {
        expect(TemplateService.createNewTemplate).toHaveBeenCalledWith(
          "New Routine",
          undefined,
          expect.arrayContaining([expect.objectContaining({ name: "Dip" })])
        );
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("updates existing template successfully", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        templateId: "temp-1",
      });
      (TemplateService.fetchTemplateById as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      render(<TemplateBuilderScreen />);
      await waitFor(() => screen.getByText("Update Template"));

      fireEvent.changeText(
        screen.getByDisplayValue("Full Body A"),
        "Full Body B"
      );
      fireEvent.press(screen.getByText("Update Template"));

      await waitFor(() => {
        expect(TemplateService.updateExistingTemplate).toHaveBeenCalledWith(
          "temp-1",
          "Full Body B",
          "Monday Routine",
          expect.any(Array)
        );
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("handles save error", async () => {
      (TemplateService.createNewTemplate as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      render(<TemplateBuilderScreen />);

      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Push Day, Leg Day"),
        "New Routine"
      );
      fireEvent.press(screen.getByText("Add Exercise"));
      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., Bench Press, Squat"),
        "Dip"
      );
      fireEvent.press(screen.getByText("Save"));

      fireEvent.press(screen.getByText("Save Template"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to save template"
        );
        expect(mockRouter.back).not.toHaveBeenCalled();
      });
    });
  });
});
