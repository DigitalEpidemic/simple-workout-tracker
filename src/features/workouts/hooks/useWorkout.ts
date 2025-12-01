/**
 * useWorkout Hook - Manages workout session state
 *
 * Provides access to the current workout session with automatic updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession } from '@/types';
import { getSessionById } from '@/src/lib/db/repositories/sessions';

/**
 * Custom hook for accessing and managing workout session data
 *
 * @param sessionId - The workout session ID to load
 * @returns Workout session state
 */
export function useWorkout(sessionId: string) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSessionById(sessionId, true);
      setSession(data);
    } catch (err) {
      console.error('Error loading workout session:', err);
      setError(err instanceof Error ? err : new Error('Failed to load workout'));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const refresh = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  return {
    session,
    loading,
    error,
    refresh,
  };
}
