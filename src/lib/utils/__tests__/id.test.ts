/**
 * Unit tests for ID generation utilities
 */

import { generateId } from '../id';

describe('id utilities', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id = generateId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('should generate IDs in format {timestamp}_{random}', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+_[a-z0-9]+$/);
    });

    it('should generate unique IDs on consecutive calls', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should include timestamp component', () => {
      const beforeTimestamp = Date.now();
      const id = generateId();
      const afterTimestamp = Date.now();

      const timestampPart = parseInt(id.split('_')[0], 10);
      expect(timestampPart).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestampPart).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should include random component', () => {
      const id = generateId();
      const parts = id.split('_');

      expect(parts).toHaveLength(2);
      expect(parts[1]).toBeTruthy();
      expect(parts[1].length).toBeGreaterThan(0);
    });
  });
});
