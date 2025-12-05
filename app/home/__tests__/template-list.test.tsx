import * as TemplateService from "@/src/features/templates/api/templateService";
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
import TemplateListScreen from "../template-list";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    const React = jest.requireActual("react");
    React.useEffect(callback, []);
  }),
}));

jest.mock("@/src/features/templates/api/templateService");

// Mock TemplateCard to expose specific interactions for testing
jest.mock("@/src/features/templates/components/TemplateCard", () => ({
  TemplateCard: ({ template, onPress, onEdit, onDelete }: any) => {
    // FIX: Use jest.requireActual() instead of require() to satisfy linter
    const { View, Text, Pressable } = jest.requireActual("react-native");
    return (
      <View testID={`template-card-${template.id}`}>
        <Pressable onPress={onPress} testID={`start-${template.id}`}>
          <Text>{template.name}</Text>
        </Pressable>
        <Pressable onPress={onEdit} testID={`edit-${template.id}`}>
          <Text>Edit</Text>
        </Pressable>
        <Pressable onPress={onDelete} testID={`delete-${template.id}`}>
          <Text>Delete</Text>
        </Pressable>
      </View>
    );
  },
}));

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const mockTemplates = [
  { id: "t1", name: "Upper Body", exercises: [] },
  { id: "t2", name: "Lower Body", exercises: [] },
];

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("TemplateListScreen", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default success response
    (TemplateService.fetchAllTemplates as jest.Mock).mockResolvedValue(
      mockTemplates
    );
    (TemplateService.removeTemplate as jest.Mock).mockResolvedValue(undefined);

    jest.spyOn(Alert, "alert");
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Rendering & Loading", () => {
    it("renders loading state initially", async () => {
      (TemplateService.fetchAllTemplates as jest.Mock).mockReturnValue(
        new Promise(() => {})
      );

      render(<TemplateListScreen />);

      expect(screen.queryByText("Upper Body")).toBeNull();
    });

    it("renders empty state when no templates exist", async () => {
      (TemplateService.fetchAllTemplates as jest.Mock).mockResolvedValue([]);

      render(<TemplateListScreen />);

      await waitFor(() => {
        expect(screen.getByText("No Templates Yet")).toBeTruthy();
        expect(screen.getByText("Create Template")).toBeTruthy();
      });
    });

    it("renders list of templates when data exists", async () => {
      render(<TemplateListScreen />);

      await waitFor(() => {
        expect(screen.getByText("Workout Templates")).toBeTruthy();
        expect(screen.getByText("2 templates")).toBeTruthy();
        expect(screen.getByText("Upper Body")).toBeTruthy();
        expect(screen.getByText("Lower Body")).toBeTruthy();
        expect(screen.getByText("Create New Template")).toBeTruthy();
      });
    });

    it("handles load error", async () => {
      (TemplateService.fetchAllTemplates as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      render(<TemplateListScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to load templates"
        );
      });
    });
  });

  describe("Navigation", () => {
    it("navigates to Template Builder (Create New)", async () => {
      render(<TemplateListScreen />);
      await waitFor(() => screen.getByText("Create New Template"));

      fireEvent.press(screen.getByText("Create New Template"));

      expect(mockRouter.push).toHaveBeenCalledWith("/home/template-builder");
    });

    it("navigates to Template Builder (Edit)", async () => {
      render(<TemplateListScreen />);
      await waitFor(() => screen.getByTestId("edit-t1"));

      fireEvent.press(screen.getByTestId("edit-t1"));

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/home/template-builder",
        params: { templateId: "t1" },
      });
    });

    it("navigates to Start Workout", async () => {
      render(<TemplateListScreen />);
      await waitFor(() => screen.getByTestId("start-t1"));

      fireEvent.press(screen.getByTestId("start-t1"));

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/home/start-workout",
        params: { templateId: "t1" },
      });
    });

    it("navigates back", async () => {
      render(<TemplateListScreen />);
      await waitFor(() => screen.getByText("←"));

      fireEvent.press(screen.getByText("←"));

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe("Deletion", () => {
    it("cancels deletion", async () => {
      render(<TemplateListScreen />);
      await waitFor(() => screen.getByTestId("delete-t1"));

      fireEvent.press(screen.getByTestId("delete-t1"));

      expect(Alert.alert).toHaveBeenCalled();

      // FIX: Only invoke onPress if it exists (Cancel button often has no handler)
      // @ts-ignore
      const buttons = Alert.alert.mock.calls[0][2];
      const cancelBtn = buttons.find((b: any) => b.style === "cancel");

      if (cancelBtn && cancelBtn.onPress) {
        act(() => {
          cancelBtn.onPress();
        });
      }

      expect(TemplateService.removeTemplate).not.toHaveBeenCalled();
    });

    it("deletes template after confirmation and reloads list", async () => {
      render(<TemplateListScreen />);
      await waitFor(() => screen.getByTestId("delete-t1"));

      // FIX: Clear mocks to reset the fetchAllTemplates call count (ignoring initial load)
      jest.clearAllMocks();

      fireEvent.press(screen.getByTestId("delete-t1"));

      // @ts-ignore
      const buttons = Alert.alert.mock.calls[0][2];
      const deleteBtn = buttons.find((b: any) => b.style === "destructive");

      await act(async () => {
        await deleteBtn.onPress();
      });

      expect(TemplateService.removeTemplate).toHaveBeenCalledWith("t1");
      // Should be called 1 time (the reload), since we cleared mocks after initial load
      expect(TemplateService.fetchAllTemplates).toHaveBeenCalledTimes(1);
    });

    it("handles delete error", async () => {
      (TemplateService.removeTemplate as jest.Mock).mockRejectedValue(
        new Error("Delete Failed")
      );

      render(<TemplateListScreen />);
      await waitFor(() => screen.getByTestId("delete-t1"));

      fireEvent.press(screen.getByTestId("delete-t1"));

      // @ts-ignore
      const buttons = Alert.alert.mock.calls[0][2];
      const deleteBtn = buttons.find((b: any) => b.style === "destructive");

      await act(async () => {
        await deleteBtn.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to delete template"
      );
    });
  });

  describe("Refresh", () => {
    it("reloads templates on pull-to-refresh", async () => {
      render(<TemplateListScreen />);
      await waitFor(() => screen.getByText("Workout Templates"));

      // FIX: Clear mocks so we only check the refresh call
      jest.clearAllMocks();

      const scrollView = screen.getByTestId("template-list-scroll");
      const { refreshControl } = scrollView.props;

      await act(async () => {
        refreshControl.props.onRefresh();
      });

      expect(TemplateService.fetchAllTemplates).toHaveBeenCalledTimes(1);
    });
  });
});
