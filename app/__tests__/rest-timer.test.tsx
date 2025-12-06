import * as SettingsStore from "@/src/stores/settingsStore";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { AppState } from "react-native";
import RestTimerModal from "../rest-timer";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notification-id"),
  cancelScheduledNotificationAsync: jest.fn(),
  dismissNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  AndroidNotificationPriority: { MAX: "max" },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: "timeInterval" },
}));

jest.mock("@/src/stores/settingsStore", () => ({
  useDefaultRestTime: jest.fn(),
  useHapticsEnabled: jest.fn(),
}));

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("RestTimerModal", () => {
  const mockRouter = { back: jest.fn() };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ duration: "60" });
    (SettingsStore.useDefaultRestTime as jest.Mock).mockReturnValue(90);
    (SettingsStore.useHapticsEnabled as jest.Mock).mockReturnValue(true);

    Object.defineProperty(AppState, "currentState", {
      value: "active",
      configurable: true,
      writable: true,
    });

    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  // --------------------------------------------------------------------------
  // CORE FUNCTIONALITY
  // --------------------------------------------------------------------------

  describe("Initialization & Rendering", () => {
    it("configures notification handler correctly", async () => {
      jest.isolateModules(() => {
        require("../rest-timer");

        expect(Notifications.setNotificationHandler).toHaveBeenCalled();

        const handler =
          // @ts-ignore
          Notifications.setNotificationHandler.mock.calls[0][0]
            .handleNotification;
        return handler().then((config: any) => {
          expect(config).toEqual({
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          });
        });
      });
    });

    it("initializes with duration from params", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ duration: "120" });
      render(<RestTimerModal />);

      expect(screen.getByText("2:00")).toBeTruthy();

      await waitFor(() => {
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      });
    });
  });

  describe("Timer Logic", () => {
    it("ticks down every second", () => {
      render(<RestTimerModal />);

      expect(screen.getByText("1:00")).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText("0:59")).toBeTruthy();
    });

    it("pauses and resumes", () => {
      render(<RestTimerModal />);
      fireEvent.press(screen.getByText("Pause"));
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getByText("1:00")).toBeTruthy();
      fireEvent.press(screen.getByText("Resume"));
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText("0:59")).toBeTruthy();
    });
  });

  describe("Adjusting Time", () => {
    it("adds 30 seconds", async () => {
      render(<RestTimerModal />);

      await waitFor(() =>
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled()
      );

      await act(async () => {
        fireEvent.press(screen.getByText("+30s"));
      });

      expect(screen.getByText("1:30")).toBeTruthy();
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalled();
    });

    it("completes immediately if subtracting results in negative time", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ duration: "10" });
      render(<RestTimerModal />);
      await waitFor(() =>
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled()
      );

      await act(async () => {
        fireEvent.press(screen.getByText("-30s"));
      });

      expect(screen.getByText("Complete!")).toBeTruthy();
    });
  });

  describe("Completion Logic", () => {
    it("handles timer completion and navigation", async () => {
      (SettingsStore.useHapticsEnabled as jest.Mock).mockReturnValue(false);
      render(<RestTimerModal />);

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(screen.getByText("Complete!")).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe("Background App State Handling", () => {
    let appStateListener: (state: string) => void;

    beforeEach(() => {
      jest
        .spyOn(AppState, "addEventListener")
        .mockImplementation((event, handler) => {
          if (event === "change") appStateListener = handler;
          return { remove: jest.fn() } as any;
        });
    });

    it("completes timer if background time exceeded duration", () => {
      render(<RestTimerModal />);

      act(() => {
        appStateListener("background");
      });

      const NOW = Date.now();
      jest.setSystemTime(NOW + 70000);

      act(() => {
        appStateListener("active");
      });

      expect(screen.getByText("Complete!")).toBeTruthy();
    });

    it("cancels existing notifications when updating background notification", async () => {
      render(<RestTimerModal />);

      await waitFor(() =>
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled()
      );

      await act(async () => {
        appStateListener("background");
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalled();
    });
  });

  describe("Error Handling & Edge Cases", () => {
    it("logs warning if permissions are not granted", async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      render(<RestTimerModal />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          "Notification permissions not granted"
        );
      });
    });

    it("logs error if initial notification scheduling fails", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error("Schedule fail")
      );

      render(<RestTimerModal />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          "Error scheduling initial completion notification:",
          expect.any(Error)
        );
      });
    });

    it("logs error if background notification scheduling fails", async () => {
      let appStateListener: (state: string) => void = () => {};
      jest
        .spyOn(AppState, "addEventListener")
        .mockImplementation((_, handler) => {
          appStateListener = handler;
          return { remove: jest.fn() } as any;
        });

      // Clear previous mocks to ensure a clean mount
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        "notification-id"
      );

      render(<RestTimerModal />);

      // Wait for mount logic to settle
      await waitFor(() =>
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled()
      );

      // Clear logs from initialization
      (console.log as jest.Mock).mockClear();

      // Now mock the failure for the background switch
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error("Background fail")
      );

      await act(async () => {
        appStateListener("background");
      });

      expect(console.log).toHaveBeenCalledWith(
        "Error scheduling notification:",
        expect.any(Error)
      );
    });

    it("logs error if canceling notifications fails during unmount", async () => {
      // Clear previous mocks
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        "notification-id"
      );

      const { unmount } = render(<RestTimerModal />);

      // Wait for mount schedule to complete so the ref is populated
      await waitFor(() =>
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled()
      );

      // Clear logs from initialization
      (console.log as jest.Mock).mockClear();

      // Mock failure for the cancel call
      (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mockRejectedValue(new Error("Cancel fail"));

      // Trigger unmount
      unmount();

      // The cleanup function is async (fire and forget), so we wait for the log
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          "Error canceling notifications:",
          expect.any(Error)
        );
      });
    });

    it("logs error if haptics fail during completion", async () => {
      (Haptics.notificationAsync as jest.Mock).mockRejectedValue(
        new Error("Haptic fail")
      );

      render(<RestTimerModal />);

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          "Haptic feedback not available:",
          expect.any(Error)
        );
      });
    });

    it("logs errors when handling immediate completion via subtraction", async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ duration: "10" });
      // Reset schedule success so mount passes
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        "id"
      );

      render(<RestTimerModal />);
      await waitFor(() =>
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled()
      );

      (console.log as jest.Mock).mockClear();

      // Setup errors for the interaction
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error("Notify fail")
      );
      (Haptics.impactAsync as jest.Mock).mockRejectedValue(
        new Error("Impact fail")
      );

      await act(async () => {
        fireEvent.press(screen.getByText("-30s"));
      });

      expect(console.log).toHaveBeenCalledWith(
        "Error showing completion notification:",
        expect.any(Error)
      );
    });

    it("logs errors when adding time", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        "id"
      );

      render(<RestTimerModal />);
      await waitFor(() =>
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled()
      );

      (console.log as jest.Mock).mockClear();

      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error("Reschedule fail")
      );
      (Haptics.impactAsync as jest.Mock).mockRejectedValue(
        new Error("Impact fail")
      );

      await act(async () => {
        fireEvent.press(screen.getByText("+30s"));
      });

      expect(console.log).toHaveBeenCalledWith(
        "Error rescheduling completion notification:",
        expect.any(Error)
      );
      expect(console.log).toHaveBeenCalledWith(
        "Haptic feedback not available:",
        expect.any(Error)
      );
    });

    it("logs error if haptics fail during skip", async () => {
      (Haptics.impactAsync as jest.Mock).mockRejectedValue(
        new Error("Skip Impact fail")
      );

      render(<RestTimerModal />);

      await act(async () => {
        fireEvent.press(screen.getByText("Skip Rest"));
      });

      expect(console.log).toHaveBeenCalledWith(
        "Haptic feedback not available:",
        expect.any(Error)
      );
    });
  });
});
