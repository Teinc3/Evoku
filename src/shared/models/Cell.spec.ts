import { createMockEffect } from './utils/MockEffect';
import BaseCellModel from './Cell';


describe('BaseCellModel', () => {
  let cell: BaseCellModel;
  const baseTime = 1000;

  beforeEach(() => {
    cell = new BaseCellModel();
  });

  describe('constructor', () => {
    it('should create cell with default values', () => {
      expect(cell.value).toBe(0);
      expect(cell.fixed).toBe(false);
      expect(cell.effects).toEqual([]);
      expect(cell.lastCooldownEnd).toBe(0);
    });

    it('should create cell with provided values', () => {
      const effect = createMockEffect(100, 200);
      const customCell = new BaseCellModel(5, true, [effect]);

      expect(customCell.value).toBe(5);
      expect(customCell.fixed).toBe(true);
      expect(customCell.effects).toEqual([effect]);
      expect(customCell.lastCooldownEnd).toBe(0);
    });

    it('should create cell with partial parameters', () => {
      const valueOnlyCell = new BaseCellModel(3);
      expect(valueOnlyCell.value).toBe(3);
      expect(valueOnlyCell.fixed).toBe(false);
      expect(valueOnlyCell.effects).toEqual([]);

      const valueFixedCell = new BaseCellModel(7, true);
      expect(valueFixedCell.value).toBe(7);
      expect(valueFixedCell.fixed).toBe(true);
      expect(valueFixedCell.effects).toEqual([]);
    });
  });

  describe('validate method', () => {
    it('should validate correct values', () => {
      expect(cell.validate(0, baseTime)).toBe(true);
      expect(cell.validate(1, baseTime)).toBe(true);
      expect(cell.validate(5, baseTime)).toBe(true);
      expect(cell.validate(9, baseTime)).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(cell.validate(-1, baseTime)).toBe(false);
      expect(cell.validate(10, baseTime)).toBe(false);
      expect(cell.validate(100, baseTime)).toBe(false);
    });

    it('should reject changes to fixed cells', () => {
      const fixedCell = new BaseCellModel(5, true);
      expect(fixedCell.validate(3, baseTime)).toBe(false);
      expect(fixedCell.validate(0, baseTime)).toBe(false);
    });

    it('should work without time parameter', () => {
      expect(cell.validate(5)).toBe(true);
      expect(cell.validate(-1)).toBe(false);
    });

    it('should respect cooldown when time is provided', () => {
      cell.lastCooldownEnd = baseTime + 5000;

      expect(cell.validate(5, baseTime + 1000)).toBe(false); // During cooldown
      expect(cell.validate(5, baseTime + 6000)).toBe(true);  // After cooldown
    });

    it('should validate with effects blocking', () => {
      const blockingEffect = createMockEffect(baseTime, baseTime + 3000, true);
      const effectCell = new BaseCellModel(0, false, [blockingEffect]);

      expect(effectCell.validate(5, baseTime + 1000)).toBe(false);
      expect(effectCell.validate(5, baseTime + 4000)).toBe(true);
    });

    it('should handle multiple effects', () => {
      const allowingEffect = createMockEffect(baseTime, baseTime + 2000, false);
      const blockingEffect = createMockEffect(baseTime, baseTime + 5000, true);
      const effectCell = new BaseCellModel(0, false, [allowingEffect, blockingEffect]);

      expect(effectCell.validate(5, baseTime + 3000)).toBe(false); // Blocked by second
      expect(effectCell.validate(5, baseTime + 6000)).toBe(true);  // Second expired
    });

    it('should handle edge cases', () => {
      expect(cell.validate(0, baseTime)).toBe(true);  // Clear cell
      expect(cell.validate(9, baseTime)).toBe(true);  // Max valid value
    });
  });

  describe('update method', () => {
    it('should update value and cooldown', () => {
      cell.update(7, baseTime);

      expect(cell.value).toBe(7);
      expect(cell.lastCooldownEnd).toBe(baseTime + BaseCellModel.CELL_COOLDOWN_DURATION);
    });

    it('should update without time parameter', () => {
      cell.update(4);

      expect(cell.value).toBe(4);
      expect(cell.lastCooldownEnd).toBe(0);
    });

    it('should update fixed cells (no validation)', () => {
      const fixedCell = new BaseCellModel(5, true);
      fixedCell.update(3, baseTime);

      expect(fixedCell.value).toBe(3);
      expect(fixedCell.fixed).toBe(true); // Fixed status preserved
    });

    it('should handle multiple updates', () => {
      cell.update(1, baseTime);
      expect(cell.value).toBe(1);

      cell.update(9, baseTime + 1000);
      expect(cell.value).toBe(9);
      expect(cell.lastCooldownEnd).toBe(baseTime + 1000 + BaseCellModel.CELL_COOLDOWN_DURATION);
    });

    it('should update with zero value', () => {
      cell.value = 5;
      cell.update(0, baseTime);

      expect(cell.value).toBe(0);
    });
  });

  describe('computeHash method', () => {
    it('should compute hash based on cell properties', () => {
      const hash1 = cell.computeHash();

      cell.value = 5;
      const hash2 = cell.computeHash();

      expect(hash1).not.toBe(hash2);
    });

    it('should include fixed status in hash', () => {
      const regularCell = new BaseCellModel(5, false);
      const fixedCell = new BaseCellModel(5, true);

      expect(regularCell.computeHash()).not.toBe(fixedCell.computeHash());
    });

    it('should include cooldown in hash', () => {
      const hash1 = cell.computeHash();

      cell.lastCooldownEnd = 5000;
      const hash2 = cell.computeHash();

      expect(hash1).not.toBe(hash2);
    });

    it('should include effects in hash', () => {
      const cellWithoutEffects = new BaseCellModel(5);
      const effect = createMockEffect(100, 200);
      const cellWithEffects = new BaseCellModel(5, false, [effect]);

      expect(cellWithoutEffects.computeHash()).not.toBe(cellWithEffects.computeHash());
    });

    it('should produce consistent hashes for identical state', () => {
      const cell1 = new BaseCellModel(5, true);
      const cell2 = new BaseCellModel(5, true);

      cell1.lastCooldownEnd = 1000;
      cell2.lastCooldownEnd = 1000;

      expect(cell1.computeHash()).toBe(cell2.computeHash());
    });

    it('should handle effects in hash computation', () => {
      const effect1 = createMockEffect(100, 200, false, false);
      const effect2 = createMockEffect(100, 200, true, false);
      const cell1 = new BaseCellModel(5, false, [effect1]);
      const cell2 = new BaseCellModel(5, false, [effect2]);

      expect(cell1.computeHash()).not.toBe(cell2.computeHash());
    });
  });

  describe('progress method', () => {
    it('should return true for correct non-fixed cell', () => {
      cell.value = 5;
      expect(cell.progress(5, baseTime)).toBe(true);
    });

    it('should return false for incorrect value', () => {
      cell.value = 3;
      expect(cell.progress(5, baseTime)).toBe(false);
    });

    it('should return false for fixed cells even if correct', () => {
      const fixedCell = new BaseCellModel(5, true);
      expect(fixedCell.progress(5, baseTime)).toBe(false);
    });

    it('should work without time parameter', () => {
      cell.value = 7;
      expect(cell.progress(7)).toBe(true);
    });

    it('should handle effects blocking progress', () => {
      const progressBlockingEffect = createMockEffect(baseTime, baseTime + 3000, false, true);
      const effectCell = new BaseCellModel(5, false, [progressBlockingEffect]);

      expect(effectCell.progress(5, baseTime + 1000)).toBe(false);
      expect(effectCell.progress(5, baseTime + 4000)).toBe(true);
    });

    it('should handle multiple effects for progress', () => {
      const normalEffect = createMockEffect(baseTime, baseTime + 2000, false, false);
      const blockingEffect = createMockEffect(baseTime, baseTime + 3000, false, true);
      const effectCell = new BaseCellModel(5, false, [normalEffect, blockingEffect]);

      expect(effectCell.progress(5, baseTime + 1000)).toBe(false); // Blocked
      expect(effectCell.progress(5, baseTime + 4000)).toBe(true);  // Not blocked after expiry
    });

    it('should handle zero values correctly', () => {
      cell.value = 0;
      expect(cell.progress(0, baseTime)).toBe(true);
      expect(cell.progress(5, baseTime)).toBe(false);
    });
  });

  describe('cooldown behavior', () => {
    it('should have correct cooldown duration', () => {
      expect(BaseCellModel.CELL_COOLDOWN_DURATION).toBe(10000);
    });

    it('should calculate cooldown end correctly', () => {
      cell.update(1, baseTime);
      expect(cell.lastCooldownEnd).toBe(baseTime + 10000);
    });

    it('should handle cooldown expiration', () => {
      cell.update(1, baseTime);

      expect(cell.validate(2, baseTime + 5000)).toBe(false);  // Still on cooldown
      expect(cell.validate(2, baseTime + 10000)).toBe(true); // Exactly at end (>= condition)
      expect(cell.validate(2, baseTime + 10001)).toBe(true);  // After cooldown
    });

    it('should reset cooldown with each update', () => {
      cell.update(1, baseTime);
      const firstEnd = cell.lastCooldownEnd;

      cell.update(2, baseTime + 5000);
      const secondEnd = cell.lastCooldownEnd;

      expect(secondEnd).toBe(baseTime + 5000 + 10000);
      expect(secondEnd).toBeGreaterThan(firstEnd);
    });
  });

  describe('effect integration', () => {
    it('should work with no effects', () => {
      expect(cell.validate(5, baseTime)).toBe(true);
      expect(cell.progress(5, baseTime)).toBe(false); // Wrong value
    });

    it('should work with single effect', () => {
      const effect = createMockEffect(baseTime, baseTime + 2000, true);
      const effectCell = new BaseCellModel(0, false, [effect]);

      expect(effectCell.validate(5, baseTime + 1000)).toBe(false);
      expect(effectCell.validate(5, baseTime + 3000)).toBe(true);
    });

    it('should work with multiple effects', () => {
      const effect1 = createMockEffect(baseTime, baseTime + 2000, true, false);
      const effect2 = createMockEffect(baseTime, baseTime + 3000, false, true);
      const effectCell = new BaseCellModel(5, false, [effect1, effect2]);

      // Blocked by first effect
      expect(effectCell.validate(3, baseTime + 1000)).toBe(false);
      // First expired but second still blocks progress
      expect(effectCell.progress(5, baseTime + 2500)).toBe(false);
      // Both expired
      expect(effectCell.validate(3, baseTime + 4000)).toBe(true);
      expect(effectCell.progress(5, baseTime + 4000)).toBe(true);
    });

    it('should handle effects with no end time', () => {
      const permanentEffect = createMockEffect(baseTime); // No lastUntil
      const effectCell = new BaseCellModel(0, false, [permanentEffect]);

      expect(effectCell.validate(5, baseTime + 10000)).toBe(false); // Permanent effect still active
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle extreme values gracefully', () => {
      expect(cell.validate(Number.MAX_SAFE_INTEGER, baseTime)).toBe(false);
      expect(cell.validate(Number.MIN_SAFE_INTEGER, baseTime)).toBe(false);
      expect(cell.validate(NaN, baseTime)).toBe(false);
    });

    it('should handle extreme time values', () => {
      cell.lastCooldownEnd = Number.MAX_SAFE_INTEGER;
      expect(cell.validate(5, 1000)).toBe(false);

      cell.lastCooldownEnd = 0;
      expect(cell.validate(5, Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should maintain state consistency under rapid operations', () => {
      const originalHash = cell.computeHash();

      // Multiple validations shouldn't change state
      for (let i = 0; i < 100; i++) {
        cell.validate(i % 10, baseTime + i);
      }

      expect(cell.computeHash()).toBe(originalHash);
    });

    it('should handle empty effects array correctly', () => {
      cell.effects = [];
      expect(cell.validate(5, baseTime)).toBe(true);
      expect(cell.progress(5, baseTime)).toBe(false); // Wrong value
    });

    it('should work with fractional time values', () => {
      cell.update(1, baseTime + 0.5);
      expect(cell.lastCooldownEnd).toBe(baseTime + 0.5 + 10000);
      expect(cell.validate(2, baseTime + 10000)).toBe(false); // Still on cooldown
      expect(cell.validate(2, baseTime + 10001)).toBe(true);
    });
  });

  describe('state transitions', () => {
    it('should handle value changes correctly', () => {
      const values = [1, 5, 9, 0, 3];
      const hashes: number[] = [];

      for (const value of values) {
        cell.update(value, baseTime);
        hashes.push(cell.computeHash());
        expect(cell.value).toBe(value);
      }

      // All hashes should be different
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(values.length);
    });

    it('should handle fixed status changes', () => {
      expect(cell.validate(5, baseTime)).toBe(true);

      cell.fixed = true;
      expect(cell.validate(5, baseTime)).toBe(false);

      cell.fixed = false;
      expect(cell.validate(5, baseTime)).toBe(true);
    });

    it('should handle effect lifecycle', () => {
      const shortEffect = createMockEffect(baseTime, baseTime + 1000, true);
      cell.effects = [shortEffect];

      expect(cell.validate(5, baseTime + 500)).toBe(false);
      expect(cell.validate(5, baseTime + 1500)).toBe(true);

      // Remove effect
      cell.effects = [];
      expect(cell.validate(5, baseTime + 500)).toBe(true);
    });
  });
});
