import { createMockEffect } from '../../utils/MockEffect';

import type BaseEffectModel from '.';


describe('BaseEffectModel', () => {
  const baseTime = 1000;

  describe('constructor', () => {
    it('should create effect with start time only', () => {
      const effect = createMockEffect(baseTime);

      expect(effect.startedAt).toBe(baseTime);
      expect(effect.lastUntil).toBeUndefined();
    });

    it('should create effect with start and end time', () => {
      const endTime = baseTime + 5000;
      const effect = createMockEffect(baseTime, endTime);

      expect(effect.startedAt).toBe(baseTime);
      expect(effect.lastUntil).toBe(endTime);
    });

    it('should handle zero start time', () => {
      const effect = createMockEffect(0, 1000);

      expect(effect.startedAt).toBe(0);
      expect(effect.lastUntil).toBe(1000);
    });

    it('should handle same start and end time', () => {
      const effect = createMockEffect(baseTime, baseTime);

      expect(effect.startedAt).toBe(baseTime);
      expect(effect.lastUntil).toBe(baseTime);
    });
  });

  describe('validateSetValue method - capability flag logic', () => {
    it('should always allow setting when canBlockSet is false', () => {
      const nonBlockingEffect = createMockEffect(baseTime, baseTime + 5000, false, true);

      // Should always return true regardless of timing when canBlockSet is false
      expect(nonBlockingEffect.validateSetValue()).toBe(true);
      expect(nonBlockingEffect.validateSetValue(baseTime - 1000)).toBe(true);
      expect(nonBlockingEffect.validateSetValue(baseTime + 1000)).toBe(true);
      expect(nonBlockingEffect.validateSetValue(baseTime + 6000)).toBe(true);
    });

    it('should use timing logic when canBlockSet is true and has end time', () => {
      const blockingEffect = createMockEffect(baseTime, baseTime + 5000, true, true);

      // Should allow when time is undefined OR time >= lastUntil
      expect(blockingEffect.validateSetValue()).toBe(true); // No time parameter
      expect(blockingEffect.validateSetValue(baseTime + 1000)).toBe(false); // During effect
      expect(blockingEffect.validateSetValue(baseTime + 5000)).toBe(true); // At end time
      expect(blockingEffect.validateSetValue(baseTime + 6000)).toBe(true); // After effect
    });

    it('should block permanently when no end time with time parameter', () => {
      const permanentBlockingEffect = createMockEffect(baseTime, undefined, true, true);

      // When lastUntil is undefined and canBlockSet is true, condition becomes:
      // !true || (undefined !== undefined && ...) = false || false = false
      expect(permanentBlockingEffect.validateSetValue()).toBe(false);
      expect(permanentBlockingEffect.validateSetValue(baseTime + 1000)).toBe(false);
      expect(permanentBlockingEffect.validateSetValue(baseTime + 100000)).toBe(false);
    });

    it('should handle edge case times with blocking capability', () => {
      const effect = createMockEffect(0, 1, true, true);

      expect(effect.validateSetValue(0)).toBe(false);
      expect(effect.validateSetValue(0.5)).toBe(false);
      expect(effect.validateSetValue(1)).toBe(true);
      expect(effect.validateSetValue(1.1)).toBe(true);
    });
  });

  describe('blockSetProgress method - capability flag logic', () => {
    it('should never block progress when canBlockProgress is false', () => {
      const nonProgressBlockingEffect = createMockEffect(baseTime, baseTime + 5000, true, false);

      // Should always return false regardless of timing when canBlockProgress is false
      expect(nonProgressBlockingEffect.blockSetProgress()).toBe(false);
      expect(nonProgressBlockingEffect.blockSetProgress(baseTime + 1000)).toBe(false);
      expect(nonProgressBlockingEffect.blockSetProgress(baseTime + 6000)).toBe(false);
    });

    it('should use timing logic when canBlockProgress is true', () => {
      const progressBlockingEffect = createMockEffect(baseTime, baseTime + 5000, true, true);

      // Should block when time is defined AND (lastUntil is undefined OR time < lastUntil)
      expect(progressBlockingEffect.blockSetProgress()).toBe(false); // No time parameter
      expect(progressBlockingEffect.blockSetProgress(baseTime + 1000)).toBe(true); // During effect
      expect(progressBlockingEffect.blockSetProgress(baseTime + 5000)).toBe(false); // At end time
      expect(progressBlockingEffect.blockSetProgress(baseTime + 6000)).toBe(false); // After effect
    });

    it('should handle no end time with progress blocking capability', () => {
      const permanentProgressBlockingEffect = createMockEffect(baseTime, undefined, true, true);

      // When lastUntil is undefined and canBlockProgress is true, should always block
      expect(permanentProgressBlockingEffect.blockSetProgress()).toBe(false);
      expect(permanentProgressBlockingEffect.blockSetProgress(baseTime + 1000)).toBe(true);
      expect(permanentProgressBlockingEffect.blockSetProgress(baseTime + 10000)).toBe(true);
    });
  });

  describe('computeHash method', () => {
    it('should compute hash based on start time', () => {
      const effect1 = createMockEffect(1000);
      const effect2 = createMockEffect(2000);

      expect(effect1.computeHash()).not.toBe(effect2.computeHash());
    });

    it('should compute hash based on end time', () => {
      const effect1 = createMockEffect(baseTime, baseTime + 1000);
      const effect2 = createMockEffect(baseTime, baseTime + 2000);

      expect(effect1.computeHash()).not.toBe(effect2.computeHash());
    });

    it('should compute hash based on capability flags', () => {
      const effect1 = createMockEffect(baseTime, baseTime + 5000, true, false);
      const effect2 = createMockEffect(baseTime, baseTime + 5000, false, true);

      expect(effect1.computeHash()).not.toBe(effect2.computeHash());
    });

    it('should produce consistent hashes for same state', () => {
      const effect1 = createMockEffect(baseTime, baseTime + 5000, true, false);
      const effect2 = createMockEffect(baseTime, baseTime + 5000, true, false);

      expect(effect1.computeHash()).toBe(effect2.computeHash());
    });

    it('should handle large time values', () => {
      const largeTimeEffect = createMockEffect(1234567890, 1234567890 + 5000);
      const hash = largeTimeEffect.computeHash();

      // Hash should be within int32 limits
      expect(hash).toBeLessThan(2147483647);
      expect(hash).toBeGreaterThanOrEqual(-2147483648);
    });
  });

  describe('createMockEffect factory function', () => {
    it('should create effects with default blocking behavior', () => {
      const defaultEffect = createMockEffect(baseTime, baseTime + 5000);

      // Default should be canBlockSet=true, canBlockProgress=true
      expect(defaultEffect.validateSetValue(baseTime + 1000)).toBe(false);
      expect(defaultEffect.blockSetProgress(baseTime + 1000)).toBe(true);
    });

    it('should create effects with custom blocking behavior', () => {
      const customEffect = createMockEffect(baseTime, baseTime + 5000, false, false);

      // Should not block anything
      expect(customEffect.validateSetValue(baseTime + 1000)).toBe(true);
      expect(customEffect.blockSetProgress(baseTime + 1000)).toBe(false);
    });

    it('should create effects with mixed blocking behavior', () => {
      const mixedEffect = createMockEffect(baseTime, baseTime + 5000, true, false);

      // Can block setting but not progress
      expect(mixedEffect.validateSetValue(baseTime + 1000)).toBe(false);
      expect(mixedEffect.blockSetProgress(baseTime + 1000)).toBe(false);
    });
  });

  describe('edge cases and integration', () => {
    it('should handle extreme time values', () => {
      const extremeEffect = createMockEffect(
        Number.MAX_SAFE_INTEGER - 1000,
        Number.MAX_SAFE_INTEGER,
        true,
        true
      );

      expect(extremeEffect.validateSetValue(Number.MAX_SAFE_INTEGER - 500)).toBe(false);
      expect(extremeEffect.validateSetValue(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should handle negative time values', () => {
      const negativeEffect = createMockEffect(-1000, -500, true, true);

      expect(negativeEffect.validateSetValue(-750)).toBe(false);
      expect(negativeEffect.validateSetValue(-400)).toBe(true);
    });

    it('should handle fractional time values', () => {
      const fractionalEffect = createMockEffect(1000.5, 2000.7, true, true);

      expect(fractionalEffect.validateSetValue(1500.6)).toBe(false);
      expect(fractionalEffect.validateSetValue(2000.7)).toBe(true);
      expect(fractionalEffect.validateSetValue(2000.8)).toBe(true);
    });

    it('should handle zero duration effects', () => {
      const instantEffect = createMockEffect(baseTime, baseTime, true, true);

      expect(instantEffect.validateSetValue(baseTime - 1)).toBe(false);
      expect(instantEffect.validateSetValue(baseTime)).toBe(true);
      expect(instantEffect.validateSetValue(baseTime + 1)).toBe(true);
    });

    it('should work correctly with polymorphic arrays', () => {
      const effects: BaseEffectModel[] = [
        createMockEffect(baseTime, baseTime + 1000, true, true),
        createMockEffect(baseTime, baseTime + 2000, false, true),
        createMockEffect(baseTime, undefined, false, false),
        createMockEffect(baseTime, baseTime + 3000, true, false)
      ];

      effects.forEach(effect => {
        expect(effect.startedAt).toBe(baseTime);
        expect(effect.validateSetValue(baseTime + 5000)).toEqual(expect.any(Boolean));
        expect(effect.blockSetProgress(baseTime + 5000)).toEqual(expect.any(Boolean));
        expect(effect.computeHash()).toEqual(expect.any(Number));
      });
    });

    it('should maintain consistent state across multiple calls', () => {
      const effect = createMockEffect(baseTime, baseTime + 5000, true, true);
      const hash1 = effect.computeHash();

      // Multiple calls to read-only methods shouldn't change state
      effect.validateSetValue(baseTime + 1000);
      effect.blockSetProgress(baseTime + 1000);
      effect.validateSetValue(baseTime + 6000);
      effect.blockSetProgress(baseTime + 6000);

      const hash2 = effect.computeHash();
      expect(hash1).toBe(hash2);
    });
  });
});
