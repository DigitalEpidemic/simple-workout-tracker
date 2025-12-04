/**
 * Unit tests for useTimer hook
 */

import { act, renderHook } from "@testing-library/react-native";
import { useTimer } from "../useTimer";

describe("useTimer Hook", () => {
  beforeEach(() => {
    // Take control of the system clock
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should calculate initial elapsed time correctly", () => {
    const startTime = Date.now();
    // Advance time by 10 seconds before rendering
    jest.advanceTimersByTime(10000);

    const { result } = renderHook(() => useTimer({ startTime }));

    expect(result.current.elapsedSeconds).toBe(10);
    expect(result.current.formattedTime).toBe("00:00:10");
  });

  it("should update elapsed time every second", () => {
    const startTime = Date.now();
    const { result } = renderHook(() => useTimer({ startTime }));

    expect(result.current.elapsedSeconds).toBe(0);

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.elapsedSeconds).toBe(5);
    expect(result.current.formattedTime).toBe("00:00:05");
  });

  it("should format long durations correctly (HH:MM:SS)", () => {
    const startTime = Date.now();
    const { result } = renderHook(() => useTimer({ startTime }));

    // Advance 1 hour, 1 minute, and 30 seconds (3690000ms)
    act(() => {
      jest.advanceTimersByTime(3600 * 1000 + 60 * 1000 + 30 * 1000);
    });

    expect(result.current.elapsedSeconds).toBe(3690);
    expect(result.current.formattedTime).toBe("01:01:30");
  });

  it("should pause updates when isActive is false", () => {
    const startTime = Date.now();

    // Start with timer ACTIVE
    // We use 'any' here to bypass the strict 'unknown' type check on renderHook props
    const { result, rerender } = renderHook(
      ({ isActive }: any) => useTimer({ startTime, isActive }),
      { initialProps: { isActive: true } }
    );

    // Advance 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.elapsedSeconds).toBe(5);

    // Set timer to INACTIVE
    rerender({ isActive: false });

    // Advance another 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should still be 5 (paused)
    expect(result.current.elapsedSeconds).toBe(5);
  });

  it("should resume correctly after being paused", () => {
    const startTime = Date.now();

    // 1. Start Active
    const { result, rerender } = renderHook(
      ({ isActive }: any) => useTimer({ startTime, isActive }),
      { initialProps: { isActive: true } }
    );

    // 2. Advance 5s
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.elapsedSeconds).toBe(5);

    // 3. Pause
    rerender({ isActive: false });

    // 4. Advance 10s (Background time passes)
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    // Still shows 5 because UI didn't update
    expect(result.current.elapsedSeconds).toBe(5);

    // 5. Resume
    rerender({ isActive: true });

    // Force a tick to catch up the calculation
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // 5s (initial) + 10s (paused) + 1s (tick) = 16s
    expect(result.current.elapsedSeconds).toBe(16);
  });

  it("should cleanup interval on unmount", () => {
    const startTime = Date.now();
    const { unmount } = renderHook(() => useTimer({ startTime }));

    // Unmount the component
    unmount();

    // Advance time to verify no errors/leaks
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });
});
