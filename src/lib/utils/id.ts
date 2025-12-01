/**
 * ID Generation Utilities
 *
 * Generates unique IDs for database records in an offline-first environment.
 */

/**
 * Generate a unique ID for database records
 *
 * Uses timestamp + random string for simplicity and offline-first operation.
 * Format: {timestamp}_{random}
 *
 * @returns A unique ID string
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
