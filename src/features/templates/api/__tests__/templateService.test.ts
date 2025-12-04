/**
 * Unit tests for Template Service
 */

import * as templateRepo from "@/src/lib/db/repositories/templates";
import * as idUtils from "@/src/lib/utils/id";
import { WorkoutTemplate } from "@/types";
import {
  createNewTemplate,
  fetchAllTemplates,
  fetchTemplateById,
  removeTemplate,
  updateExistingTemplate,
  validateExerciseName,
  validateExerciseTargets,
  validateTemplateName,
} from "../templateService";

// Mock dependencies
jest.mock("@/src/lib/db/repositories/templates");
jest.mock("@/src/lib/utils/id");

describe("Template Service", () => {
  const mockTimestamp = 1640000000000;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Date.now
    jest.spyOn(Date, "now").mockReturnValue(mockTimestamp);

    // Mock generateId to return predictable values
    let idCounter = 0;
    (idUtils.generateId as jest.Mock).mockImplementation(
      () => `id-${++idCounter}`
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- Fetch Tests ---

  describe("fetchAllTemplates", () => {
    it("should delegate to repository", async () => {
      const mockTemplates = [{ id: "t1" }];
      (templateRepo.getAllTemplates as jest.Mock).mockResolvedValue(
        mockTemplates
      );

      const result = await fetchAllTemplates();

      expect(result).toEqual(mockTemplates);
      expect(templateRepo.getAllTemplates).toHaveBeenCalledWith(true);
    });
  });

  describe("fetchTemplateById", () => {
    it("should delegate to repository", async () => {
      const mockTemplate = { id: "t1" };
      (templateRepo.getTemplateById as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      const result = await fetchTemplateById("t1");

      expect(result).toEqual(mockTemplate);
      expect(templateRepo.getTemplateById).toHaveBeenCalledWith("t1", true);
    });
  });

  // --- Creation Tests ---

  describe("createNewTemplate", () => {
    it("should create template and map exercises correctly", async () => {
      (templateRepo.createTemplateWithExercises as jest.Mock).mockResolvedValue(
        undefined
      );

      const inputExercises = [
        { name: "Squat", targetSets: 3, targetReps: 5 },
        { name: "Bench", notes: "Heavy" },
      ];

      const result = await createNewTemplate(
        "Strength A",
        "Desc",
        inputExercises
      );

      // Verify Template Structure
      expect(result).toMatchObject({
        id: "id-1", // First generated ID (template)
        name: "Strength A",
        description: "Desc",
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      });

      // Verify Exercise Mapping
      expect(result.exercises).toHaveLength(2);

      // Exercise 1
      expect(result.exercises[0]).toMatchObject({
        id: "id-2", // Second generated ID
        workoutTemplateId: "id-1",
        name: "Squat",
        order: 0,
        targetSets: 3,
        targetReps: 5,
        createdAt: mockTimestamp,
      });

      // Exercise 2
      expect(result.exercises[1]).toMatchObject({
        id: "id-3", // Third generated ID
        workoutTemplateId: "id-1",
        name: "Bench",
        order: 1,
        notes: "Heavy",
      });

      expect(templateRepo.createTemplateWithExercises).toHaveBeenCalledWith(
        result
      );
    });
  });

  // --- Update Tests ---

  describe("updateExistingTemplate", () => {
    const existingTemplate: WorkoutTemplate = {
      id: "template-1",
      name: "Old Name",
      description: "Old Desc",
      exercises: [],
      createdAt: 1000,
      updatedAt: 1000,
      lastUsed: 5000,
    };

    it("should update template fields and preserve creation dates", async () => {
      (templateRepo.getTemplateById as jest.Mock).mockResolvedValue(
        existingTemplate
      );
      (templateRepo.updateTemplateWithExercises as jest.Mock).mockResolvedValue(
        undefined
      );

      const inputExercises = [
        { id: "ex-1", name: "Existing Ex" }, // Has ID
        { name: "New Ex" }, // No ID (needs generation)
      ];

      const result = await updateExistingTemplate(
        "template-1",
        "New Name",
        undefined,
        inputExercises
      );

      expect(result).toMatchObject({
        id: "template-1",
        name: "New Name",
        description: undefined,
        createdAt: 1000, // Preserved
        updatedAt: mockTimestamp, // Updated
        lastUsed: 5000, // Preserved
      });

      // Check Exercises
      expect(result.exercises[0].id).toBe("ex-1"); // Preserved
      expect(result.exercises[1].id).toBe("id-1"); // Generated
      expect(result.exercises[1].workoutTemplateId).toBe("template-1");

      expect(templateRepo.updateTemplateWithExercises).toHaveBeenCalledWith(
        result
      );
    });

    it("should throw error if template does not exist", async () => {
      (templateRepo.getTemplateById as jest.Mock).mockResolvedValue(null);

      await expect(
        updateExistingTemplate("bad-id", "Name", undefined, [])
      ).rejects.toThrow("Template with ID bad-id not found");

      expect(templateRepo.updateTemplateWithExercises).not.toHaveBeenCalled();
    });
  });

  // --- Deletion Tests ---

  describe("removeTemplate", () => {
    it("should delegate to repository", async () => {
      (templateRepo.deleteTemplate as jest.Mock).mockResolvedValue(undefined);
      await removeTemplate("t1");
      expect(templateRepo.deleteTemplate).toHaveBeenCalledWith("t1");
    });
  });

  // --- Validation Tests ---

  describe("Validation Utilities", () => {
    describe("validateTemplateName", () => {
      it("should return error if empty", () => {
        expect(validateTemplateName("")).toBe("Template name is required");
        expect(validateTemplateName("   ")).toBe("Template name is required");
      });

      it("should return error if too short", () => {
        expect(validateTemplateName("A")).toBe(
          "Template name must be at least 2 characters"
        );
      });

      it("should return error if too long", () => {
        const longName = "a".repeat(51);
        expect(validateTemplateName(longName)).toBe(
          "Template name must be less than 50 characters"
        );
      });

      it("should return null if valid", () => {
        expect(validateTemplateName("Leg Day")).toBeNull();
      });
    });

    describe("validateExerciseName", () => {
      it("should return error if empty", () => {
        expect(validateExerciseName("")).toBe("Exercise name is required");
      });

      it("should return error if too short", () => {
        expect(validateExerciseName("B")).toBe(
          "Exercise name must be at least 2 characters"
        );
      });

      it("should return error if too long", () => {
        const longName = "b".repeat(51);
        expect(validateExerciseName(longName)).toBe(
          "Exercise name must be less than 50 characters"
        );
      });

      it("should return null if valid", () => {
        expect(validateExerciseName("Squat")).toBeNull();
      });
    });

    describe("validateExerciseTargets", () => {
      it("should return null for undefined values (optional fields)", () => {
        expect(
          validateExerciseTargets(undefined, undefined, undefined)
        ).toBeNull();
      });

      it("should validate sets range (1-20)", () => {
        expect(validateExerciseTargets(0)).toBe(
          "Target sets must be between 1 and 20"
        );
        expect(validateExerciseTargets(21)).toBe(
          "Target sets must be between 1 and 20"
        );
        expect(validateExerciseTargets(5)).toBeNull();
      });

      it("should validate reps range (1-100)", () => {
        expect(validateExerciseTargets(undefined, 0)).toBe(
          "Target reps must be between 1 and 100"
        );
        expect(validateExerciseTargets(undefined, 101)).toBe(
          "Target reps must be between 1 and 100"
        );
        expect(validateExerciseTargets(undefined, 10)).toBeNull();
      });

      it("should validate weight (positive)", () => {
        expect(validateExerciseTargets(undefined, undefined, -5)).toBe(
          "Target weight must be positive"
        );
        expect(validateExerciseTargets(undefined, undefined, 0)).toBeNull(); // 0 is acceptable (bodyweight)
        expect(validateExerciseTargets(undefined, undefined, 100)).toBeNull();
      });
    });
  });
});
