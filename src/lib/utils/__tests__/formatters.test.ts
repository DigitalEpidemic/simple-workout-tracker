/**
 * Unit tests for formatter utility functions
 */

import {
  formatWeight,
  formatDuration,
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeDate,
  formatNumber,
  consolidateSets,
} from '../formatters';

describe('formatters', () => {
  describe('formatWeight', () => {
    it('should format weight in lbs', () => {
      expect(formatWeight(225, 'lbs')).toBe('225 lbs');
      expect(formatWeight(135.5, 'lbs')).toBe('135.5 lbs');
      expect(formatWeight(0, 'lbs')).toBe('0 lbs');
    });

    it('should format weight in kg with conversion', () => {
      expect(formatWeight(225, 'kg')).toBe('102.1 kg');
      expect(formatWeight(135, 'kg')).toBe('61.2 kg');
      expect(formatWeight(0, 'kg')).toBe('0.0 kg');
    });

    it('should handle decimal lbs to kg conversion', () => {
      expect(formatWeight(100.5, 'kg')).toBe('45.6 kg');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format minutes only', () => {
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(120)).toBe('2m');
      expect(formatDuration(300)).toBe('5m');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(125)).toBe('2m 5s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(3660)).toBe('1h 1m');
      expect(formatDuration(5400)).toBe('1h 30m');
    });

    it('should format hours, minutes (no seconds when hours present)', () => {
      expect(formatDuration(3665)).toBe('1h 1m');
      expect(formatDuration(7265)).toBe('2h 1m');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should handle large durations', () => {
      expect(formatDuration(10800)).toBe('3h');
      expect(formatDuration(10860)).toBe('3h 1m');
    });
  });

  describe('formatDate', () => {
    it('should format date in MMM DD, YYYY format', () => {
      const timestamp = new Date('2024-01-15T12:00:00').getTime();
      expect(formatDate(timestamp)).toBe('Jan 15, 2024');
    });

    it('should handle different months', () => {
      const timestamp = new Date('2024-06-30T12:00:00').getTime();
      expect(formatDate(timestamp)).toBe('Jun 30, 2024');
    });

    it('should handle different years', () => {
      const timestamp = new Date('2023-12-31T12:00:00').getTime();
      expect(formatDate(timestamp)).toBe('Dec 31, 2023');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const timestamp = new Date('2024-01-15T15:45:00').getTime();
      const result = formatDateTime(timestamp);
      expect(result).toContain('Jan 15, 2024');
      expect(result).toContain('3:45');
      expect(result).toContain('PM');
    });

    it('should handle AM times', () => {
      const timestamp = new Date('2024-01-15T09:30:00').getTime();
      const result = formatDateTime(timestamp);
      expect(result).toContain('9:30');
      expect(result).toContain('AM');
    });
  });

  describe('formatTime', () => {
    it('should format time in 12-hour format', () => {
      const timestamp = new Date('2024-01-15T15:45:00').getTime();
      const result = formatTime(timestamp);
      expect(result).toContain('3:45');
      expect(result).toContain('PM');
    });

    it('should handle AM times', () => {
      const timestamp = new Date('2024-01-15T09:30:00').getTime();
      const result = formatTime(timestamp);
      expect(result).toContain('9:30');
      expect(result).toContain('AM');
    });

    it('should handle midnight', () => {
      const timestamp = new Date('2024-01-15T00:00:00').getTime();
      const result = formatTime(timestamp);
      expect(result).toContain('12:00');
      expect(result).toContain('AM');
    });
  });

  describe('formatRelativeDate', () => {
    beforeEach(() => {
      // Mock the current date to a fixed point in time
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "Today" for current date', () => {
      const timestamp = new Date('2024-01-15T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('Today');
    });

    it('should return "Yesterday" for previous day', () => {
      const timestamp = new Date('2024-01-14T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('Yesterday');
    });

    it('should return "X days ago" for recent dates', () => {
      const timestamp = new Date('2024-01-13T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('2 days ago');
    });

    it('should return "X days ago" for dates within a week', () => {
      const timestamp = new Date('2024-01-10T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('5 days ago');
    });

    it('should return "1 week ago" for 7-13 days', () => {
      const timestamp = new Date('2024-01-08T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('1 week ago');
    });

    it('should return "X weeks ago" for multiple weeks', () => {
      const timestamp = new Date('2023-12-25T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('3 weeks ago');
    });

    it('should return "1 month ago" for ~30 days', () => {
      const timestamp = new Date('2023-12-15T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('1 month ago');
    });

    it('should return "X months ago" for multiple months', () => {
      const timestamp = new Date('2023-10-15T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('3 months ago');
    });

    it('should return "1 year ago" for ~365 days', () => {
      const timestamp = new Date('2023-01-15T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('1 year ago');
    });

    it('should return "X years ago" for multiple years', () => {
      const timestamp = new Date('2021-01-15T15:00:00').getTime();
      expect(formatRelativeDate(timestamp)).toBe('3 years ago');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with comma separators', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle small numbers without commas', () => {
      expect(formatNumber(123)).toBe('123');
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });
  });

  describe('consolidateSets', () => {
    const mockFormatWeight = (weight: number) => `${weight} lbs`;

    it('should consolidate consecutive sets with same reps and weight', () => {
      const sets = [
        { targetReps: 10, targetWeight: 225 },
        { targetReps: 10, targetWeight: 225 },
        { targetReps: 10, targetWeight: 225 },
      ];
      const result = consolidateSets(sets, mockFormatWeight);
      expect(result).toEqual(['Set 1-3: 10 reps @ 225 lbs']);
    });

    it('should handle sets with different weights', () => {
      const sets = [
        { targetReps: 10, targetWeight: 100 },
        { targetReps: 10, targetWeight: 100 },
        { targetReps: 8, targetWeight: 120 },
      ];
      const result = consolidateSets(sets, mockFormatWeight);
      expect(result).toEqual([
        'Set 1-2: 10 reps @ 100 lbs',
        'Set 3: 8 reps @ 120 lbs',
      ]);
    });

    it('should handle sets with different reps', () => {
      const sets = [
        { targetReps: 10, targetWeight: 225 },
        { targetReps: 8, targetWeight: 225 },
        { targetReps: 6, targetWeight: 225 },
      ];
      const result = consolidateSets(sets, mockFormatWeight);
      expect(result).toEqual([
        'Set 1: 10 reps @ 225 lbs',
        'Set 2: 8 reps @ 225 lbs',
        'Set 3: 6 reps @ 225 lbs',
      ]);
    });

    it('should handle mixed consolidation patterns', () => {
      const sets = [
        { targetReps: 10, targetWeight: 135 },
        { targetReps: 10, targetWeight: 135 },
        { targetReps: 8, targetWeight: 185 },
        { targetReps: 8, targetWeight: 185 },
        { targetReps: 6, targetWeight: 225 },
      ];
      const result = consolidateSets(sets, mockFormatWeight);
      expect(result).toEqual([
        'Set 1-2: 10 reps @ 135 lbs',
        'Set 3-4: 8 reps @ 185 lbs',
        'Set 5: 6 reps @ 225 lbs',
      ]);
    });

    it('should handle missing targetReps', () => {
      const sets = [
        { targetWeight: 225 },
        { targetWeight: 225 },
      ];
      const result = consolidateSets(sets, mockFormatWeight);
      expect(result).toEqual(['Set 1-2: ? reps @ 225 lbs']);
    });

    it('should handle missing targetWeight', () => {
      const sets = [
        { targetReps: 10 },
        { targetReps: 10 },
      ];
      const result = consolidateSets(sets, mockFormatWeight);
      expect(result).toEqual(['Set 1-2: 10 reps @ ?']);
    });

    it('should handle empty array', () => {
      const result = consolidateSets([], mockFormatWeight);
      expect(result).toEqual([]);
    });

    it('should handle single set', () => {
      const sets = [{ targetReps: 10, targetWeight: 225 }];
      const result = consolidateSets(sets, mockFormatWeight);
      expect(result).toEqual(['Set 1: 10 reps @ 225 lbs']);
    });

    it('should use custom formatWeight function', () => {
      const customFormat = (weight: number) => `${(weight * 0.453592).toFixed(1)} kg`;
      const sets = [
        { targetReps: 10, targetWeight: 225 },
        { targetReps: 10, targetWeight: 225 },
      ];
      const result = consolidateSets(sets, customFormat);
      expect(result).toEqual(['Set 1-2: 10 reps @ 102.1 kg']);
    });
  });
});
