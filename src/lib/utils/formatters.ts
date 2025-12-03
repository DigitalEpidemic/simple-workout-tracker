/**
 * Utility functions for formatting data (dates, weights, durations)
 */

/**
 * Format weight value with unit
 *
 * @param weight - Weight value in lbs (stored format)
 * @param unit - Target display unit ('lbs' or 'kg')
 * @returns Formatted weight string with unit
 */
export function formatWeight(weight: number, unit: 'lbs' | 'kg'): string {
  if (unit === 'kg') {
    // Convert lbs to kg (1 lb = 0.453592 kg)
    const kg = weight * 0.453592;
    return `${kg.toFixed(1)} kg`;
  }
  return `${weight} lbs`;
}

/**
 * Format duration in seconds to human-readable string
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1h 23m", "45m", "30s")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && hours === 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
}

/**
 * Format date to short string (e.g., "Jan 15, 2024")
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date and time to string (e.g., "Jan 15, 2024 at 3:45 PM")
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format time only (e.g., "3:45 PM")
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format relative date (e.g., "Today", "Yesterday", "2 days ago")
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative date string
 */
export function formatRelativeDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to midnight for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday';
  } else {
    const diffTime = todayOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  }
}

/**
 * Format number with comma separators (e.g., 1,234,567)
 *
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Consolidate consecutive sets with the same reps and weight into a range format
 *
 * @param sets - Array of sets with targetReps and targetWeight
 * @param formatWeight - Function to format weight value (e.g., "225 lbs" or "100 kg")
 * @returns Array of consolidated set descriptions
 *
 * @example
 * Input: [{targetReps: 10, targetWeight: 225}, {targetReps: 10, targetWeight: 225}, {targetReps: 10, targetWeight: 225}]
 * Output: ["Set 1-3: 10 reps @ 225 lbs"]
 *
 * @example
 * Input: [{targetReps: 10, targetWeight: 100}, {targetReps: 10, targetWeight: 100}, {targetReps: 8, targetWeight: 120}]
 * Output: ["Set 1-2: 10 reps @ 100 lbs", "Set 3: 8 reps @ 120 lbs"]
 */
export function consolidateSets(
  sets: Array<{ targetReps?: number; targetWeight?: number }>,
  formatWeight: (weight: number) => string
): string[] {
  if (sets.length === 0) return [];

  const consolidated: string[] = [];
  let rangeStart = 0;

  for (let i = 0; i < sets.length; i++) {
    const currentSet = sets[i];
    const nextSet = sets[i + 1];

    // Check if we should continue the current range
    const shouldContinueRange = nextSet &&
      currentSet.targetReps === nextSet.targetReps &&
      currentSet.targetWeight === nextSet.targetWeight;

    if (!shouldContinueRange) {
      // End of range - format and add to results
      const setRange = rangeStart === i
        ? `Set ${i + 1}`
        : `Set ${rangeStart + 1}-${i + 1}`;

      const reps = currentSet.targetReps ?? '?';
      const weight = currentSet.targetWeight
        ? formatWeight(currentSet.targetWeight)
        : '?';

      consolidated.push(`${setRange}: ${reps} reps @ ${weight}`);
      rangeStart = i + 1;
    }
  }

  return consolidated;
}
