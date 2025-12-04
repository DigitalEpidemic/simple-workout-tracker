/**
 * PR Service - Personal Record Detection and Management
 *
 * Handles detecting and saving new PRs when a workout is completed.
 * PRs are tracked for each exercise at specific rep ranges (1-12 reps).
 */

import { isNewPR, recordPR } from "@/src/lib/db/repositories/pr-records";
import { getSessionById } from "@/src/lib/db/repositories/sessions";
import { formatWeight } from "@/src/lib/utils/formatters";
import { Exercise, PRRecord } from "@/types";

/**
 * Normalize exercise name for PR tracking
 * Converts to lowercase and trims whitespace for consistent matching.
 */
function normalizeExerciseName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Detect new PRs in a completed workout session
 *
 * @param sessionId - The workout session ID
 * @returns Promise that resolves to array of new PR records
 */
export async function detectPRsInSession(
  sessionId: string
): Promise<PRRecord[]> {
  const session = await getSessionById(sessionId, true);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const newPRs: PRRecord[] = [];

  for (const exercise of session.exercises) {
    const exercisePRs = await detectPRsInExercise(
      exercise,
      sessionId,
      session.endTime ?? Date.now()
    );
    newPRs.push(...exercisePRs);
  }

  return newPRs;
}

/**
 * Detect new PRs in a single exercise
 *
 * @param exercise - The exercise to check
 * @param sessionId - The workout session ID
 * @param achievedAt - Timestamp when PRs were achieved
 * @returns Promise that resolves to array of new PR records
 */
async function detectPRsInExercise(
  exercise: Exercise,
  sessionId: string,
  achievedAt: number
): Promise<PRRecord[]> {
  const normalizedName = normalizeExerciseName(exercise.name);
  const newPRs: PRRecord[] = [];

  // Only consider completed sets
  const completedSets = exercise.sets.filter((set) => set.completed);

  // Group sets by rep count and track the highest weight for each rep range
  const repRangeMap = new Map<number, number>(); // reps -> max weight

  for (const set of completedSets) {
    const reps = set.reps;
    const weight = set.weight;

    // Track PRs for any positive rep count
    if (reps < 1 || weight <= 0) {
      continue;
    }

    const currentMax = repRangeMap.get(reps) ?? 0;
    if (weight > currentMax) {
      repRangeMap.set(reps, weight);
    }
  }

  // Check each rep range to see if it's a new PR
  for (const [reps, weight] of repRangeMap.entries()) {
    const isPR = await isNewPR(normalizedName, reps, weight);

    if (isPR) {
      const prRecord: PRRecord = {
        id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        exerciseName: normalizedName,
        reps,
        weight,
        workoutSessionId: sessionId,
        achievedAt,
        createdAt: Date.now(),
      };

      newPRs.push(prRecord);
    }
  }

  return newPRs;
}

/**
 * Save detected PRs to the database
 *
 * This will automatically replace old PRs with lower weights.
 *
 * @param prs - Array of PR records to save
 * @returns Promise that resolves when all PRs are saved
 */
export async function savePRs(prs: PRRecord[]): Promise<void> {
  for (const pr of prs) {
    await recordPR(pr);
  }
}

/**
 * Detect and save PRs for a completed workout session
 *
 * This is the main function to call when a workout is completed.
 *
 * @param sessionId - The workout session ID
 * @returns Promise that resolves to array of saved PR records
 */
export async function detectAndSavePRs(sessionId: string): Promise<PRRecord[]> {
  const newPRs = await detectPRsInSession(sessionId);
  await savePRs(newPRs);
  return newPRs;
}

/**
 * Get display name for PR (capitalize first letter of each word)
 *
 * @param normalizedName - Normalized exercise name
 * @returns Display-friendly name
 */
export function getDisplayName(normalizedName: string): string {
  return normalizedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format PR description for display
 *
 * @param pr - PR record
 * @param weightUnit - User's preferred weight unit ('lbs' or 'kg')
 * @returns Formatted string like "Bench Press: 225 lbs x 5 reps"
 */
export function formatPRDescription(
  pr: PRRecord,
  weightUnit: "lbs" | "kg" = "lbs"
): string {
  const displayName = getDisplayName(pr.exerciseName);
  const formattedWeight = formatWeight(pr.weight, weightUnit);
  return `${displayName}: ${formattedWeight} × ${pr.reps} ${
    pr.reps === 1 ? "rep" : "reps"
  }`;
}
