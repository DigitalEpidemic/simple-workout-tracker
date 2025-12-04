/**
 * Unit tests for Settings Store (React Context)
 */

import * as settingsRepo from "@/src/lib/db/repositories/settings";
import { UserSettings } from "@/types";
import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import {
  SettingsProvider,
  useDefaultRestTime,
  useHapticsEnabled,
  useSettings,
  useWeightUnit,
} from "../settingsStore";

// Mock the settings repository
jest.mock("@/src/lib/db/repositories/settings");

describe("Settings Store", () => {
  const mockSettings: UserSettings = {
    weightUnit: "lbs",
    defaultRestTime: 90,
    enableHaptics: true,
    id: "",
    enableSyncReminders: false,
    createdAt: 0,
    updatedAt: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for expected errors in tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe("SettingsProvider", () => {
    it("should render children", async () => {
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      const { getByText } = render(
        <SettingsProvider>
          <Text>Test Child</Text>
        </SettingsProvider>
      );

      expect(getByText("Test Child")).toBeTruthy();
    });

    it("should load settings on mount", async () => {
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      let capturedSettings: UserSettings | null = null;
      let capturedIsLoading = true;

      function TestComponent() {
        const { settings, isLoading } = useSettings();
        capturedSettings = settings;
        capturedIsLoading = isLoading;
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedIsLoading).toBe(false);
      });

      expect(settingsRepo.getSettings).toHaveBeenCalledTimes(1);
      expect(capturedSettings).toEqual(mockSettings);
    });

    it("should handle settings loading errors", async () => {
      (settingsRepo.getSettings as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      let capturedSettings: UserSettings | null = null;
      let capturedIsLoading = true;

      function TestComponent() {
        const { settings, isLoading } = useSettings();
        capturedSettings = settings;
        capturedIsLoading = isLoading;
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedIsLoading).toBe(false);
      });

      expect(capturedSettings).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Failed to load settings:",
        expect.any(Error)
      );
    });
  });

  describe("useSettings hook", () => {
    it("should throw error when used outside SettingsProvider", () => {
      function TestComponent() {
        useSettings();
        return null;
      }

      // We expect this to throw an error
      expect(() => {
        render(<TestComponent />);
      }).toThrow("useSettings must be used within a SettingsProvider");
    });

    it("should provide settings context", async () => {
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      let capturedContext: any = null;

      function TestComponent() {
        capturedContext = useSettings();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedContext.isLoading).toBe(false);
      });

      expect(capturedContext).toMatchObject({
        settings: mockSettings,
        isLoading: false,
        updateWeightUnit: expect.any(Function),
        updateDefaultRestTime: expect.any(Function),
        updateHapticsEnabled: expect.any(Function),
        refreshSettings: expect.any(Function),
      });
    });
  });

  describe("updateWeightUnit", () => {
    it("should update weight unit", async () => {
      const updatedSettings = { ...mockSettings, weightUnit: "kg" as const };
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      (settingsRepo.updateSettings as jest.Mock).mockResolvedValue(
        updatedSettings
      );

      let capturedContext: any = null;

      function TestComponent() {
        capturedContext = useSettings();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedContext.isLoading).toBe(false);
      });

      // Update weight unit
      await capturedContext.updateWeightUnit("kg");

      await waitFor(() => {
        expect(capturedContext.settings).toEqual(updatedSettings);
      });

      expect(settingsRepo.updateSettings).toHaveBeenCalledWith({
        weightUnit: "kg",
      });
    });

    it("should handle update errors", async () => {
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      (settingsRepo.updateSettings as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      let capturedContext: any = null;

      function TestComponent() {
        capturedContext = useSettings();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedContext.isLoading).toBe(false);
      });

      await expect(capturedContext.updateWeightUnit("kg")).rejects.toThrow(
        "Update failed"
      );
      expect(console.error).toHaveBeenCalledWith(
        "Failed to update weight unit:",
        expect.any(Error)
      );
    });
  });

  describe("updateDefaultRestTime", () => {
    it("should update default rest time", async () => {
      const updatedSettings = { ...mockSettings, defaultRestTime: 120 };
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      (settingsRepo.updateSettings as jest.Mock).mockResolvedValue(
        updatedSettings
      );

      let capturedContext: any = null;

      function TestComponent() {
        capturedContext = useSettings();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedContext.isLoading).toBe(false);
      });

      await capturedContext.updateDefaultRestTime(120);

      await waitFor(() => {
        expect(capturedContext.settings).toEqual(updatedSettings);
      });

      expect(settingsRepo.updateSettings).toHaveBeenCalledWith({
        defaultRestTime: 120,
      });
    });

    it("should handle update errors", async () => {
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      (settingsRepo.updateSettings as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      let capturedContext: any = null;

      function TestComponent() {
        capturedContext = useSettings();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedContext.isLoading).toBe(false);
      });

      await expect(capturedContext.updateDefaultRestTime(120)).rejects.toThrow(
        "Update failed"
      );
      expect(console.error).toHaveBeenCalledWith(
        "Failed to update default rest time:",
        expect.any(Error)
      );
    });
  });

  describe("updateHapticsEnabled", () => {
    it("should update haptics setting", async () => {
      const updatedSettings = { ...mockSettings, enableHaptics: false };
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      (settingsRepo.updateSettings as jest.Mock).mockResolvedValue(
        updatedSettings
      );

      let capturedContext: any = null;

      function TestComponent() {
        capturedContext = useSettings();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedContext.isLoading).toBe(false);
      });

      await capturedContext.updateHapticsEnabled(false);

      await waitFor(() => {
        expect(capturedContext.settings).toEqual(updatedSettings);
      });

      expect(settingsRepo.updateSettings).toHaveBeenCalledWith({
        enableHaptics: false,
      });
    });

    it("should handle update errors", async () => {
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      (settingsRepo.updateSettings as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      let capturedContext: any = null;

      function TestComponent() {
        capturedContext = useSettings();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedContext.isLoading).toBe(false);
      });

      await expect(capturedContext.updateHapticsEnabled(false)).rejects.toThrow(
        "Update failed"
      );
      expect(console.error).toHaveBeenCalledWith(
        "Failed to update haptics setting:",
        expect.any(Error)
      );
    });
  });

  describe("refreshSettings", () => {
    it("should reload settings from database", async () => {
      const newSettings = { ...mockSettings, weightUnit: "kg" as const };
      (settingsRepo.getSettings as jest.Mock)
        .mockResolvedValueOnce(mockSettings)
        .mockResolvedValueOnce(newSettings);

      let capturedContext: any = null;

      function TestComponent() {
        capturedContext = useSettings();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedContext.isLoading).toBe(false);
      });

      expect(capturedContext.settings).toEqual(mockSettings);

      // Refresh settings
      await capturedContext.refreshSettings();

      await waitFor(() => {
        expect(capturedContext.settings).toEqual(newSettings);
      });

      expect(settingsRepo.getSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe("useWeightUnit hook", () => {
    it("should return current weight unit", async () => {
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      let capturedWeightUnit: "kg" | "lbs" | null = null;

      function TestComponent() {
        capturedWeightUnit = useWeightUnit();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedWeightUnit).toBe("lbs");
      });
    });

    it("should return null while loading", () => {
      (settingsRepo.getSettings as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      let capturedWeightUnit: "kg" | "lbs" | null = "kg"; // Start with non-null

      function TestComponent() {
        capturedWeightUnit = useWeightUnit();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(capturedWeightUnit).toBeNull();
    });
  });

  describe("useDefaultRestTime hook", () => {
    it("should return default rest time", async () => {
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      let capturedRestTime: number | null = null;

      function TestComponent() {
        capturedRestTime = useDefaultRestTime();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedRestTime).toBe(90);
      });
    });

    it("should return null while loading", () => {
      (settingsRepo.getSettings as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      let capturedRestTime: number | null = 90; // Start with non-null

      function TestComponent() {
        capturedRestTime = useDefaultRestTime();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(capturedRestTime).toBeNull();
    });
  });

  describe("useHapticsEnabled hook", () => {
    it("should return haptics setting", async () => {
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      let capturedHaptics: boolean = false;

      function TestComponent() {
        capturedHaptics = useHapticsEnabled();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedHaptics).toBe(true);
      });
    });

    it("should return true as default while loading", () => {
      (settingsRepo.getSettings as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      let capturedHaptics: boolean = false; // Start with false

      function TestComponent() {
        capturedHaptics = useHapticsEnabled();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(capturedHaptics).toBe(true); // Default is true
    });

    it("should return false when haptics disabled", async () => {
      const settingsWithHapticsOff = { ...mockSettings, enableHaptics: false };
      (settingsRepo.getSettings as jest.Mock).mockResolvedValue(
        settingsWithHapticsOff
      );

      let capturedHaptics: boolean = true;

      function TestComponent() {
        capturedHaptics = useHapticsEnabled();
        return null;
      }

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(capturedHaptics).toBe(false);
      });
    });
  });
});
