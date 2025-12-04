/**
 * Unit tests for PR Service
 */

import * as prRepo from "@/src/lib/db/repositories/pr-records";
import * as sessionRepo from "@/src/lib/db/repositories/sessions";
import * as formatters from "@/src/lib/utils/formatters";
import { WorkoutSession } from "@/types";
import {
  detectAndSavePRs,
  detectPRsInSession,
  formatPRDescription,
  getDisplayName,
  savePRs,
} from "../prService";

// Mock dependencies
jest.mock("@/src/lib/db/repositories/sessions");
jest.mock("@/src/lib/db/repositories/pr-records");
jest.mock("@/src/lib/utils/formatters");

describe("PR Service", () => {
  const mockSessionId = "sess-1";
  const mockTimestamp = 1640000000000;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(mockTimestamp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- Helper to create a mock session ---
  const createMockSession = (sets: any[]): WorkoutSession => ({
    id: mockSessionId,
    name: "Test Workout",
    exercises: [
      {
        id: "ex-1",
        workoutSessionId: mockSessionId,
        name: "  Bench Press  ", // Untrimmed to test normalization
        order: 0,
        sets: sets,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      },
    ],
    startTime: mockTimestamp,
    endTime: mockTimestamp,
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
  });

  describe("detectPRsInSession", () => {
    it("should throw error if session not found", async () => {
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(null);

      await expect(detectPRsInSession("bad-id")).rejects.toThrow(
        "Session bad-id not found"
      );
    });

    it("should ignore incomplete sets or invalid reps/weight", async () => {
      const session = createMockSession([
        { reps: 5, weight: 100, completed: false }, // Incomplete
        { reps: 0, weight: 100, completed: true }, // Invalid reps
        { reps: 5, weight: 0, completed: true }, // Invalid weight
      ]);
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(session);
      (prRepo.isNewPR as jest.Mock).mockResolvedValue(true);

      const prs = await detectPRsInSession(mockSessionId);

      // Should find no candidates, so no calls to DB check
      expect(prs).toEqual([]);
      expect(prRepo.isNewPR).not.toHaveBeenCalled();
    });

    it("should identify a new PR when it beats existing", async () => {
      const session = createMockSession([
        { reps: 5, weight: 135, completed: true },
      ]);
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(session);

      // Mock DB saying "Yes, this is a new PR"
      (prRepo.isNewPR as jest.Mock).mockResolvedValue(true);

      const prs = await detectPRsInSession(mockSessionId);

      expect(prs).toHaveLength(1);
      expect(prs[0]).toMatchObject({
        exerciseName: "bench press", // Normalized
        reps: 5,
        weight: 135,
        workoutSessionId: mockSessionId,
      });

      expect(prRepo.isNewPR).toHaveBeenCalledWith("bench press", 5, 135);
    });

    it("should NOT return a PR if it does not beat existing", async () => {
      const session = createMockSession([
        { reps: 5, weight: 135, completed: true },
      ]);
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(session);

      // Mock DB saying "No, old PR is better"
      (prRepo.isNewPR as jest.Mock).mockResolvedValue(false);

      const prs = await detectPRsInSession(mockSessionId);

      expect(prs).toHaveLength(0);
    });

    it("should pick the heaviest weight for a specific rep count within the session", async () => {
      // User did 135x5, then 145x5. Only 145x5 should be checked/returned.
      const session = createMockSession([
        { reps: 5, weight: 135, completed: true },
        { reps: 5, weight: 145, completed: true },
      ]);
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(session);
      (prRepo.isNewPR as jest.Mock).mockResolvedValue(true);

      const prs = await detectPRsInSession(mockSessionId);

      expect(prs).toHaveLength(1);
      expect(prs[0].weight).toBe(145);

      // Should verify isNewPR was only called for the max (145),
      // OR called for both but since we map locally, efficiently it should just be once per rep-range.
      // The implementation iterates `repRangeMap` keys, so it calls once per unique rep count.
      expect(prRepo.isNewPR).toHaveBeenCalledTimes(1);
      expect(prRepo.isNewPR).toHaveBeenCalledWith("bench press", 5, 145);
    });

    it("should fallback to Date.now() if session.endTime is undefined", async () => {
      const session = createMockSession([
        { reps: 5, weight: 135, completed: true },
      ]);
      session.endTime = undefined; // Simulate active session check (edge case)

      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(session);
      (prRepo.isNewPR as jest.Mock).mockResolvedValue(true);

      const prs = await detectPRsInSession(mockSessionId);

      expect(prs[0].achievedAt).toBe(mockTimestamp);
    });
  });

  describe("savePRs", () => {
    it("should iterate and record each PR", async () => {
      const mockPRs = [
        { id: "1", exerciseName: "sq", reps: 5, weight: 100 } as any,
        { id: "2", exerciseName: "bp", reps: 1, weight: 200 } as any,
      ];
      (prRepo.recordPR as jest.Mock).mockResolvedValue(undefined);

      await savePRs(mockPRs);

      expect(prRepo.recordPR).toHaveBeenCalledTimes(2);
      expect(prRepo.recordPR).toHaveBeenCalledWith(mockPRs[0]);
      expect(prRepo.recordPR).toHaveBeenCalledWith(mockPRs[1]);
    });
  });

  describe("detectAndSavePRs", () => {
    it("should coordinate detection and saving", async () => {
      const session = createMockSession([
        { reps: 5, weight: 135, completed: true },
      ]);
      (sessionRepo.getSessionById as jest.Mock).mockResolvedValue(session);
      (prRepo.isNewPR as jest.Mock).mockResolvedValue(true);
      (prRepo.recordPR as jest.Mock).mockResolvedValue(undefined);

      const result = await detectAndSavePRs(mockSessionId);

      expect(result).toHaveLength(1);
      expect(prRepo.isNewPR).toHaveBeenCalled();
      expect(prRepo.recordPR).toHaveBeenCalled();
    });
  });

  describe("Utilities", () => {
    describe("getDisplayName", () => {
      it("should capitalize words correctly", () => {
        expect(getDisplayName("bench press")).toBe("Bench Press");
        expect(getDisplayName("squat")).toBe("Squat");
        // Simple splitter logic verification
        expect(getDisplayName("dumbell curl")).toBe("Dumbell Curl");
      });
    });

    describe("formatPRDescription", () => {
      it("should format full string with lbs default", () => {
        const pr = { exerciseName: "bench press", weight: 225, reps: 5 } as any;
        (formatters.formatWeight as jest.Mock).mockReturnValue("225 lbs");

        const result = formatPRDescription(pr);

        expect(result).toBe("Bench Press: 225 lbs × 5 reps");
        expect(formatters.formatWeight).toHaveBeenCalledWith(225, "lbs");
      });

      it('should format singular "rep" for 1 rep', () => {
        const pr = { exerciseName: "squat", weight: 315, reps: 1 } as any;
        (formatters.formatWeight as jest.Mock).mockReturnValue("315 lbs");

        const result = formatPRDescription(pr);

        expect(result).toMatch(/× 1 rep$/);
      });

      it("should respect kg unit preference", () => {
        const pr = { exerciseName: "deadlift", weight: 100, reps: 3 } as any;
        (formatters.formatWeight as jest.Mock).mockReturnValue("100 kg");

        const result = formatPRDescription(pr, "kg");

        expect(result).toBe("Deadlift: 100 kg × 3 reps");
        expect(formatters.formatWeight).toHaveBeenCalledWith(100, "kg");
      });
    });
  });
});
