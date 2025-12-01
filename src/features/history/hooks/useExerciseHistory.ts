/**
 * useExerciseHistory Hook - Manages exercise performance history
 *
 * Provides access to exercise history data with loading states.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getExercisePerformanceHistory,
  getExerciseStatistics,
  ExercisePerformance,
} from '../api/exerciseHistoryService';

/**
 * Exercise statistics
 */
interface ExerciseStats {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  maxWeight: number;
  avgVolume: number;
  avgSets: number;
  lastPerformed?: number;
}

/**
 * Custom hook for managing exercise history data
 *
 * @param exerciseName - The exercise name to load history for
 * @returns Exercise history state and refresh function
 */
export function useExerciseHistory(exerciseName: string) {
  const [performances, setPerformances] = useState<ExercisePerformance[]>([]);
  const [statistics, setStatistics] = useState<ExerciseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadHistory = useCallback(async () => {
    if (!exerciseName) {
      setPerformances([]);
      setStatistics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [performanceData, stats] = await Promise.all([
        getExercisePerformanceHistory(exerciseName),
        getExerciseStatistics(exerciseName),
      ]);

      setPerformances(performanceData);
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading exercise history:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to load exercise history')
      );
    } finally {
      setLoading(false);
    }
  }, [exerciseName]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const refresh = useCallback(async () => {
    await loadHistory();
  }, [loadHistory]);

  return {
    performances,
    statistics,
    loading,
    error,
    refresh,
  };
}
