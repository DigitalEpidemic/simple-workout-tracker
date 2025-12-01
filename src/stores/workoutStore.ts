/**
 * Workout Store - Global state management for active workout sessions
 *
 * Simple state container for the currently active workout session.
 * This will be used by WorkoutContext for React integration.
 */

import { WorkoutSession } from '@/types';
import { getActiveSession } from '@/src/lib/db/repositories/sessions';

class WorkoutStore {
  private activeSession: WorkoutSession | null = null;
  private listeners: Set<() => void> = new Set();

  getActiveSession(): WorkoutSession | null {
    return this.activeSession;
  }

  setActiveSession(session: WorkoutSession | null): void {
    this.activeSession = session;
    this.notifyListeners();
  }

  async loadActiveSession(): Promise<WorkoutSession | null> {
    try {
      const session = await getActiveSession(true);
      this.activeSession = session;
      this.notifyListeners();
      return session;
    } catch (error) {
      console.error('Failed to load active session:', error);
      this.activeSession = null;
      this.notifyListeners();
      return null;
    }
  }

  clearActiveSession(): void {
    this.activeSession = null;
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const workoutStore = new WorkoutStore();
