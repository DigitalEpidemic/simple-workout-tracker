/**
 * Hook for displaying weight values with user's preferred unit
 *
 * Provides utility functions to format weight values according to user settings.
 * All weights are stored in lbs in the database and converted on display.
 */

import { useWeightUnit } from '@/src/stores/settingsStore';
import { formatWeight } from '@/src/lib/utils/formatters';

/**
 * Hook to get weight display utilities
 *
 * @returns Object with weight formatting functions
 */
export function useWeightDisplay() {
  const weightUnit = useWeightUnit();
  const unit = weightUnit ?? 'lbs';

  /**
   * Format a weight value for display
   *
   * @param weight - Weight value in lbs (storage format)
   * @returns Formatted weight string with unit (e.g., "135 lbs" or "61.2 kg")
   */
  const displayWeight = (weight: number): string => {
    return formatWeight(weight, unit);
  };

  /**
   * Get just the unit label
   *
   * @returns Unit string ('lbs' or 'kg')
   */
  const getUnit = (): string => {
    return unit;
  };

  /**
   * Convert weight value for display (without unit label)
   *
   * @param weight - Weight value in lbs (storage format)
   * @returns Converted weight value as number
   */
  const convertWeight = (weight: number): number => {
    if (unit === 'kg') {
      return parseFloat((weight * 0.453592).toFixed(1));
    }
    return weight;
  };

  /**
   * Parse user input weight value to storage format (lbs)
   *
   * @param value - Weight value entered by user
   * @returns Weight in lbs for storage
   */
  const parseWeight = (value: number): number => {
    if (unit === 'kg') {
      // Convert kg to lbs (1 kg = 2.20462 lbs)
      return parseFloat((value * 2.20462).toFixed(1));
    }
    return value;
  };

  return {
    displayWeight,
    getUnit,
    convertWeight,
    parseWeight,
    unit,
  };
}
