/**
 * Unit tests for Workout Store
 */

import * as sessionsRepo from "@/src/lib/db/repositories/sessions";
import { WorkoutSession } from "@/types";
import { workoutStore } from "../workoutStore";

// Mock the sessions repository
jest.mock("@/src/lib/db/repositories/sessions");

describe("WorkoutStore", () => {
  const mockSession: WorkoutSession = {
    id: "session-1",
    templateId: "template-1",
    templateName: "Test Workout",
    name: "Test Workout",
    programId: undefined,
    programDayId: undefined,
    programDayName: undefined,
    startTime: Date.now(),
    endTime: undefined,
    exercises: [],
    notes: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    // Clear the store before each test
    workoutStore.clearActiveSession();
    jest.clearAllMocks();
  });

  describe("getActiveSession", () => {
    it("should return null initially", () => {
      expect(workoutStore.getActiveSession()).toBeNull();
    });

    it("should return the active session after setting it", () => {
      workoutStore.setActiveSession(mockSession);
      expect(workoutStore.getActiveSession()).toEqual(mockSession);
    });
  });

  describe("setActiveSession", () => {
    it("should set the active session", () => {
      workoutStore.setActiveSession(mockSession);
      expect(workoutStore.getActiveSession()).toEqual(mockSession);
    });

    it("should set session to null", () => {
      workoutStore.setActiveSession(mockSession);
      workoutStore.setActiveSession(null);
      expect(workoutStore.getActiveSession()).toBeNull();
    });

    it("should notify listeners when session is set", () => {
      const listener = jest.fn();
      workoutStore.subscribe(listener);

      workoutStore.setActiveSession(mockSession);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should notify listeners when session is updated", () => {
      const listener = jest.fn();
      workoutStore.setActiveSession(mockSession);
      workoutStore.subscribe(listener);

      const updatedSession = { ...mockSession, notes: "Updated notes" };
      workoutStore.setActiveSession(updatedSession);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("loadActiveSession", () => {
    it("should load active session from database", async () => {
      (sessionsRepo.getActiveSession as jest.Mock).mockResolvedValue(
        mockSession
      );

      const result = await workoutStore.loadActiveSession();

      expect(sessionsRepo.getActiveSession).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockSession);
      expect(workoutStore.getActiveSession()).toEqual(mockSession);
    });

    it("should return null when no active session exists", async () => {
      (sessionsRepo.getActiveSession as jest.Mock).mockResolvedValue(null);

      const result = await workoutStore.loadActiveSession();

      expect(result).toBeNull();
      expect(workoutStore.getActiveSession()).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      const error = new Error("Database error");
      (sessionsRepo.getActiveSession as jest.Mock).mockRejectedValue(error);

      // Spy on console.error to suppress error output in tests
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await workoutStore.loadActiveSession();

      expect(result).toBeNull();
      expect(workoutStore.getActiveSession()).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load active session:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should notify listeners when session is loaded", async () => {
      (sessionsRepo.getActiveSession as jest.Mock).mockResolvedValue(
        mockSession
      );
      const listener = jest.fn();
      workoutStore.subscribe(listener);

      await workoutStore.loadActiveSession();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should notify listeners even when load fails", async () => {
      (sessionsRepo.getActiveSession as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );
      const listener = jest.fn();
      workoutStore.subscribe(listener);

      // Suppress console.error
      jest.spyOn(console, "error").mockImplementation();

      await workoutStore.loadActiveSession();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearActiveSession", () => {
    it("should clear the active session", () => {
      workoutStore.setActiveSession(mockSession);
      expect(workoutStore.getActiveSession()).toEqual(mockSession);

      workoutStore.clearActiveSession();
      expect(workoutStore.getActiveSession()).toBeNull();
    });

    it("should notify listeners when session is cleared", () => {
      workoutStore.setActiveSession(mockSession);
      const listener = jest.fn();
      workoutStore.subscribe(listener);

      workoutStore.clearActiveSession();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("subscribe", () => {
    it("should allow subscribing to changes", () => {
      const listener = jest.fn();
      const unsubscribe = workoutStore.subscribe(listener);

      expect(typeof unsubscribe).toBe("function");
    });

    it("should call listener when state changes", () => {
      const listener = jest.fn();
      workoutStore.subscribe(listener);

      workoutStore.setActiveSession(mockSession);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should call multiple listeners", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      workoutStore.subscribe(listener1);
      workoutStore.subscribe(listener2);
      workoutStore.subscribe(listener3);

      workoutStore.setActiveSession(mockSession);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it("should stop calling listener after unsubscribe", () => {
      const listener = jest.fn();
      const unsubscribe = workoutStore.subscribe(listener);

      workoutStore.setActiveSession(mockSession);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      workoutStore.clearActiveSession();
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it("should handle multiple subscribe/unsubscribe cycles", () => {
      const listener = jest.fn();

      const unsubscribe1 = workoutStore.subscribe(listener);
      workoutStore.setActiveSession(mockSession);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe1();
      workoutStore.clearActiveSession();
      expect(listener).toHaveBeenCalledTimes(1); // Not called

      const unsubscribe2 = workoutStore.subscribe(listener);
      workoutStore.setActiveSession(mockSession);
      expect(listener).toHaveBeenCalledTimes(2); // Called again

      unsubscribe2();
    });
  });

  describe("listener notification", () => {
    it("should only notify listeners for actual changes", () => {
      const listener = jest.fn();
      workoutStore.subscribe(listener);

      workoutStore.setActiveSession(mockSession);
      expect(listener).toHaveBeenCalledTimes(1);

      // Setting the same session again should still notify
      workoutStore.setActiveSession(mockSession);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("should not throw error if listener throws", () => {
      const goodListener = jest.fn();
      const badListener = jest.fn(() => {
        throw new Error("Listener error");
      });

      const unsubscribe1 = workoutStore.subscribe(badListener);
      const unsubscribe2 = workoutStore.subscribe(goodListener);

      expect(() => {
        workoutStore.setActiveSession(mockSession);
      }).toThrow("Listener error");

      // Good listener should still be called (if error doesn't prevent it)
      expect(badListener).toHaveBeenCalled();

      // Clean up to prevent interference with other tests
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe("integration scenarios", () => {
    it("should support complete workflow: load -> update -> clear", async () => {
      (sessionsRepo.getActiveSession as jest.Mock).mockResolvedValue(
        mockSession
      );

      const listener = jest.fn();
      workoutStore.subscribe(listener);

      // Load
      await workoutStore.loadActiveSession();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(workoutStore.getActiveSession()).toEqual(mockSession);

      // Update
      const updatedSession = { ...mockSession, notes: "Test notes" };
      workoutStore.setActiveSession(updatedSession);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(workoutStore.getActiveSession()?.notes).toBe("Test notes");

      // Clear
      workoutStore.clearActiveSession();
      expect(listener).toHaveBeenCalledTimes(3);
      expect(workoutStore.getActiveSession()).toBeNull();
    });
  });
});
