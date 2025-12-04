/**
 * Unit tests for Calendar Service
 */

import * as sessionRepo from "@/src/lib/db/repositories/sessions";
import { WorkoutSession } from "@/types";
import { getWorkoutsByMonth, getWorkoutsForDate } from "../calendarService";

// Mock repository
jest.mock("@/src/lib/db/repositories/sessions");

describe("Calendar Service", () => {
  // Use a fixed month for testing: January 2023
  const YEAR = 2023;
  const MONTH = 0; // January

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getWorkoutsByMonth", () => {
    const createMockSession = (day: number, id: string): WorkoutSession => {
      // Create a timestamp for Jan {day}, 2023 at 12:00 PM
      const date = new Date(YEAR, MONTH, day, 12, 0, 0);
      return {
        id,
        startTime: date.getTime(),
        name: "Workout",
        exercises: [],
        createdAt: date.getTime(),
        updatedAt: date.getTime(),
      } as WorkoutSession;
    };

    it("should calculate date ranges correctly and group workouts", async () => {
      const sessions = [
        createMockSession(5, "sess-1"), // Jan 5
        createMockSession(5, "sess-2"), // Jan 5 (2nd workout)
        createMockSession(20, "sess-3"), // Jan 20
      ];

      (sessionRepo.getSessionsByDateRange as jest.Mock).mockResolvedValue(
        sessions
      );

      const result = await getWorkoutsByMonth(YEAR, MONTH);

      // Verify DB Call
      const startOfJan = new Date(YEAR, MONTH, 1, 0, 0, 0, 0).getTime();
      const endOfJan = new Date(YEAR, MONTH, 31, 23, 59, 59, 999).getTime();

      expect(sessionRepo.getSessionsByDateRange).toHaveBeenCalledWith(
        startOfJan,
        endOfJan,
        false // shallow fetch
      );

      // Verify Grouping
      expect(result.size).toBe(2); // Two distinct days

      // Check Jan 5
      const jan5 = result.get("2023-01-05");
      expect(jan5).toBeDefined();
      expect(jan5?.workoutCount).toBe(2);
      expect(jan5?.workoutIds).toEqual(["sess-1", "sess-2"]);
      expect(jan5?.timestamp).toBe(new Date(YEAR, MONTH, 5).getTime());

      // Check Jan 20
      const jan20 = result.get("2023-01-20");
      expect(jan20).toBeDefined();
      expect(jan20?.workoutCount).toBe(1);
      expect(jan20?.workoutIds).toEqual(["sess-3"]);
    });

    it("should handle months with no workouts", async () => {
      (sessionRepo.getSessionsByDateRange as jest.Mock).mockResolvedValue([]);

      const result = await getWorkoutsByMonth(YEAR, MONTH);

      expect(result.size).toBe(0);
    });

    it("should handle leap years correctly (Feb 29)", async () => {
      // 2024 is a leap year
      const leapYear = 2024;
      const febMonth = 1;

      const session = {
        id: "leap-sess",
        startTime: new Date(leapYear, febMonth, 29, 10, 0).getTime(),
        exercises: [],
      } as any;

      (sessionRepo.getSessionsByDateRange as jest.Mock).mockResolvedValue([
        session,
      ]);

      const result = await getWorkoutsByMonth(leapYear, febMonth);

      // Verify DB call range covers the 29th
      const startOfFeb = new Date(leapYear, febMonth, 1).getTime();
      const endOfFeb = new Date(
        leapYear,
        febMonth,
        29,
        23,
        59,
        59,
        999
      ).getTime();

      expect(sessionRepo.getSessionsByDateRange).toHaveBeenCalledWith(
        startOfFeb,
        endOfFeb,
        false
      );

      expect(result.has("2024-02-29")).toBe(true);
    });
  });

  describe("getWorkoutsForDate", () => {
    it("should fetch workouts for specific day boundaries", async () => {
      const mockSessions = [{ id: "s1" }, { id: "s2" }];
      (sessionRepo.getSessionsByDateRange as jest.Mock).mockResolvedValue(
        mockSessions
      );

      const day = 15;
      const result = await getWorkoutsForDate(YEAR, MONTH, day);

      const startOfDay = new Date(YEAR, MONTH, day, 0, 0, 0, 0).getTime();
      const endOfDay = new Date(YEAR, MONTH, day, 23, 59, 59, 999).getTime();

      expect(sessionRepo.getSessionsByDateRange).toHaveBeenCalledWith(
        startOfDay,
        endOfDay,
        false
      );

      expect(result).toEqual(["s1", "s2"]);
    });
  });
});
