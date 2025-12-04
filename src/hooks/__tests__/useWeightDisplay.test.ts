/**
 * Unit tests for useWeightDisplay hook
 */

import { formatWeight } from "@/src/lib/utils/formatters";
import { useWeightUnit } from "@/src/stores/settingsStore";
import { renderHook } from "@testing-library/react-native";
import { useWeightDisplay } from "../useWeightDisplay";

// Mock dependencies
jest.mock("@/src/stores/settingsStore");
jest.mock("@/src/lib/utils/formatters");

describe("useWeightDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('When unit is "lbs" (default)', () => {
    beforeEach(() => {
      // Mock store to return 'lbs'
      (useWeightUnit as jest.Mock).mockReturnValue("lbs");
      // Mock formatter to return a predictable string
      (formatWeight as jest.Mock).mockImplementation((w, u) => `${w} ${u}`);
    });

    it("should return correct unit", () => {
      const { result } = renderHook(() => useWeightDisplay());
      expect(result.current.unit).toBe("lbs");
      expect(result.current.getUnit()).toBe("lbs");
    });

    it('should format weight using "lbs"', () => {
      const { result } = renderHook(() => useWeightDisplay());

      const output = result.current.displayWeight(135);

      expect(formatWeight).toHaveBeenCalledWith(135, "lbs");
      expect(output).toBe("135 lbs");
    });

    it("should not convert weight values (identity)", () => {
      const { result } = renderHook(() => useWeightDisplay());
      // 135 lbs is 135 lbs
      expect(result.current.convertWeight(135)).toBe(135);
    });

    it("should not parse weight values (identity)", () => {
      const { result } = renderHook(() => useWeightDisplay());
      // Input 135 means 135 lbs
      expect(result.current.parseWeight(135)).toBe(135);
    });
  });

  describe('When unit is "kg"', () => {
    beforeEach(() => {
      // Mock store to return 'kg'
      (useWeightUnit as jest.Mock).mockReturnValue("kg");
      (formatWeight as jest.Mock).mockImplementation((w, u) => `${w} ${u}`);
    });

    it("should return correct unit", () => {
      const { result } = renderHook(() => useWeightDisplay());
      expect(result.current.unit).toBe("kg");
      expect(result.current.getUnit()).toBe("kg");
    });

    it('should format weight using "kg"', () => {
      const { result } = renderHook(() => useWeightDisplay());

      result.current.displayWeight(135);

      expect(formatWeight).toHaveBeenCalledWith(135, "kg");
    });

    it("should convert stored lbs to display kg", () => {
      const { result } = renderHook(() => useWeightDisplay());

      // 100 lbs * 0.453592 = 45.3592 -> 45.4 kg
      const kgValue = result.current.convertWeight(100);

      expect(kgValue).toBe(45.4);
    });

    it("should parse input kg to stored lbs", () => {
      const { result } = renderHook(() => useWeightDisplay());

      // 20 kg * 2.20462 = 44.0924 -> 44.1 lbs
      const lbsValue = result.current.parseWeight(20);

      expect(lbsValue).toBe(44.1);
    });
  });

  describe("Fallback behavior", () => {
    it('should default to "lbs" if store returns undefined', () => {
      (useWeightUnit as jest.Mock).mockReturnValue(undefined);

      const { result } = renderHook(() => useWeightDisplay());

      expect(result.current.unit).toBe("lbs");
      expect(result.current.convertWeight(100)).toBe(100);
    });
  });
});
