/**
 * useTimer Hook - Tracks elapsed time for workout sessions
 *
 * Provides a running timer that tracks elapsed time since a start time.
 * The timer continues running even when the component unmounts/remounts.
 */

import { useEffect, useRef, useState } from "react";

export interface UseTimerOptions {
  startTime: number; // Unix timestamp when workout started
  isActive?: boolean; // Whether the timer should be running (default: true)
}

export interface UseTimerReturn {
  elapsedSeconds: number; // Total elapsed seconds
  formattedTime: string; // Formatted as HH:MM:SS
}

/**
 * Format seconds into HH:MM:SS
 */
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Custom hook for workout timer
 *
 * @param options - Timer configuration
 * @returns Timer state and formatted time
 */
export function useTimer({
  startTime,
  isActive = true,
}: UseTimerOptions): UseTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate initial elapsed time
  useEffect(() => {
    const calculateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    calculateElapsed();
  }, [startTime]);

  // Start/stop interval based on isActive
  useEffect(() => {
    // If not active, simply return. The cleanup function from the PREVIOUS run
    // has already cleared the interval, so we don't need to do it again here.
    if (!isActive) {
      return;
    }

    // Update timer every second
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startTime, isActive]);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
  };
}
