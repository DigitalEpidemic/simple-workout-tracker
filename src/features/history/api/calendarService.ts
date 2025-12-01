/**
 * Calendar Service - Business logic for calendar view
 *
 * Provides functions to get workouts grouped by date for calendar display.
 */

import { getSessionsByDateRange } from '@/src/lib/db/repositories/sessions';

/**
 * Workout data for a specific date in the calendar
 */
export interface CalendarDate {
  date: string; // YYYY-MM-DD format
  timestamp: number; // Start of day timestamp
  workoutCount: number;
  workoutIds: string[];
}

/**
 * Get the start of day timestamp for a given date
 *
 * @param year - Year
 * @param month - Month (0-11)
 * @param day - Day of month (1-31)
 * @returns Timestamp at start of day (00:00:00 local time)
 */
function getStartOfDay(year: number, month: number, day: number): number {
  const date = new Date(year, month, day, 0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get the end of day timestamp for a given date
 *
 * @param year - Year
 * @param month - Month (0-11)
 * @param day - Day of month (1-31)
 * @returns Timestamp at end of day (23:59:59.999 local time)
 */
function getEndOfDay(year: number, month: number, day: number): number {
  const date = new Date(year, month, day, 23, 59, 59, 999);
  return date.getTime();
}

/**
 * Format date as YYYY-MM-DD string
 *
 * @param year - Year
 * @param month - Month (0-11)
 * @param day - Day of month (1-31)
 * @returns Date string in YYYY-MM-DD format
 */
function formatDateKey(year: number, month: number, day: number): string {
  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Get workouts grouped by date for a specific month
 *
 * Returns a map of dates with workout counts for the specified month.
 * Only includes dates that have workouts.
 *
 * @param year - Year
 * @param month - Month (0-11, where 0 = January)
 * @returns Promise that resolves to map of date strings to CalendarDate objects
 */
export async function getWorkoutsByMonth(
  year: number,
  month: number
): Promise<Map<string, CalendarDate>> {
  // Get start and end of month
  const startOfMonth = getStartOfDay(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate(); // Get last day of month
  const endOfMonth = getEndOfDay(year, month, lastDay);

  // Fetch all workouts in this month (without exercises for performance)
  const sessions = await getSessionsByDateRange(startOfMonth, endOfMonth, false);

  // Group workouts by date
  const dateMap = new Map<string, CalendarDate>();

  for (const session of sessions) {
    const sessionDate = new Date(session.startTime);
    const dateKey = formatDateKey(
      sessionDate.getFullYear(),
      sessionDate.getMonth(),
      sessionDate.getDate()
    );

    const existing = dateMap.get(dateKey);
    if (existing) {
      existing.workoutCount += 1;
      existing.workoutIds.push(session.id);
    } else {
      dateMap.set(dateKey, {
        date: dateKey,
        timestamp: getStartOfDay(
          sessionDate.getFullYear(),
          sessionDate.getMonth(),
          sessionDate.getDate()
        ),
        workoutCount: 1,
        workoutIds: [session.id],
      });
    }
  }

  return dateMap;
}

/**
 * Get workout IDs for a specific date
 *
 * @param year - Year
 * @param month - Month (0-11)
 * @param day - Day of month (1-31)
 * @returns Promise that resolves to array of workout session IDs
 */
export async function getWorkoutsForDate(
  year: number,
  month: number,
  day: number
): Promise<string[]> {
  const startOfDay = getStartOfDay(year, month, day);
  const endOfDay = getEndOfDay(year, month, day);

  const sessions = await getSessionsByDateRange(startOfDay, endOfDay, false);
  return sessions.map((session) => session.id);
}
