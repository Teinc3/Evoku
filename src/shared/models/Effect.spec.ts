import BaseEffectModel from './Effect';


// Simple concrete implementation for testing base functionality
class SimpleEffect extends BaseEffectModel {
  constructor(startedAt: number, lastUntil?: number) {
    super(startedAt, lastUntil);
  }
}

// Concrete effect implementations for testing
class TestEffect extends BaseEffectModel {
  constructor(
    startedAt: number,
    lastUntil?: number,
    private _customValidation: boolean = true,
    private _customBlockProgress: boolean = false
  ) {
    super(startedAt, lastUntil);
  }

  public override validateSetValue(time?: number): boolean {
    // First check base timing logic
    if (!super.validateSetValue(time)) {
      return false;
    }
    // Then apply our custom blocking logic
    return this._customValidation;
  }

  public override blockSetProgress(time?: number): boolean {
    // First check base timing logic
    if (super.blockSetProgress(time)) {
      return true;
    }
    // Then apply our custom blocking logic
    return this._customBlockProgress;
  }

  public override computeHash(): number {
    return super.computeHash()
      + (this._customValidation ? 1 : 0) + (this._customBlockProgress ? 2 : 0);
  }
}

class PermanentEffect extends BaseEffectModel {
  constructor(startedAt: number) {
    super(startedAt); // No lastUntil - permanent effect
  }
}

class TimedEffect extends BaseEffectModel {
  constructor(startedAt: number, duration: number) {
    super(startedAt, startedAt + duration);
  }
}

describe('BaseEffectModel', () => {
  const baseTime = 1000;

  describe('constructor', () => {
    it('should create effect with start time only', () => {
      const effect = new SimpleEffect(baseTime);

      expect(effect.startedAt).toBe(baseTime);
      expect(effect.lastUntil).toBeUndefined();
    });

    it('should create effect with start and end time', () => {
      const endTime = baseTime + 5000;
      const effect = new SimpleEffect(baseTime, endTime);

      expect(effect.startedAt).toBe(baseTime);
      expect(effect.lastUntil).toBe(endTime);
    });

    it('should handle zero start time', () => {
      const effect = new SimpleEffect(0, 1000);

      expect(effect.startedAt).toBe(0);
      expect(effect.lastUntil).toBe(1000);
    });

    it('should handle same start and end time', () => {
      const effect = new SimpleEffect(baseTime, baseTime);

      expect(effect.startedAt).toBe(baseTime);
      expect(effect.lastUntil).toBe(baseTime);
    });
  });

  describe('validateSetValue method', () => {
    it('should allow setting when no end time is specified', () => {
      const permanentEffect = new SimpleEffect(baseTime);

      expect(permanentEffect.validateSetValue()).toBe(true);
      expect(permanentEffect.validateSetValue(baseTime + 1000)).toBe(true);
      expect(permanentEffect.validateSetValue(baseTime + 10000)).toBe(true);
    });

    it('should allow setting when no time parameter is provided', () => {
      const timedEffect = new SimpleEffect(baseTime, baseTime + 5000);

      expect(timedEffect.validateSetValue()).toBe(true);
    });

    it('should block setting during effect duration', () => {
      const timedEffect = new SimpleEffect(baseTime, baseTime + 5000);

      expect(timedEffect.validateSetValue(baseTime + 1000)).toBe(false);
      expect(timedEffect.validateSetValue(baseTime + 2500)).toBe(false);
      expect(timedEffect.validateSetValue(baseTime + 4999)).toBe(false);
    });

    it('should allow setting exactly at end time', () => {
      const timedEffect = new SimpleEffect(baseTime, baseTime + 5000);

      expect(timedEffect.validateSetValue(baseTime + 5000)).toBe(true);
    });

    it('should allow setting after effect expires', () => {
      const timedEffect = new SimpleEffect(baseTime, baseTime + 5000);

      expect(timedEffect.validateSetValue(baseTime + 5001)).toBe(true);
      expect(timedEffect.validateSetValue(baseTime + 10000)).toBe(true);
    });

    it('should handle edge case times', () => {
      const effect = new SimpleEffect(0, 1);

      expect(effect.validateSetValue(0)).toBe(false);
      expect(effect.validateSetValue(0.5)).toBe(false);
      expect(effect.validateSetValue(1)).toBe(true);
      expect(effect.validateSetValue(1.1)).toBe(true);
    });
  });

  describe('computeHash method', () => {
    it('should compute hash based on start time', () => {
      const effect1 = new SimpleEffect(1000);
      const effect2 = new SimpleEffect(2000);

      expect(effect1.computeHash()).not.toBe(effect2.computeHash());
    });

    it('should compute hash based on end time', () => {
      const effect1 = new SimpleEffect(baseTime, baseTime + 1000);
      const effect2 = new SimpleEffect(baseTime, baseTime + 2000);

      expect(effect1.computeHash()).not.toBe(effect2.computeHash());
    });

    it('should handle undefined end time in hash', () => {
      const permanentEffect = new SimpleEffect(baseTime);
      const timedEffect = new SimpleEffect(baseTime, baseTime + 1000);

      expect(permanentEffect.computeHash()).not.toBe(timedEffect.computeHash());
    });

    it('should produce consistent hashes for same state', () => {
      const effect1 = new SimpleEffect(baseTime, baseTime + 5000);
      const effect2 = new SimpleEffect(baseTime, baseTime + 5000);

      expect(effect1.computeHash()).toBe(effect2.computeHash());
    });

    it('should use modulo for hash calculation', () => {
      const largeTimeEffect = new SimpleEffect(1234567890, 1234567890 + 5000);
      const hash = largeTimeEffect.computeHash();

      // Hash should be within int32 limits
      expect(hash).toBeLessThan(2147483647);
      expect(hash).toBeGreaterThanOrEqual(-2147483648);
    });

    it('should handle zero times in hash', () => {
      const zeroEffect = new SimpleEffect(0, 0);
      expect(zeroEffect.computeHash()).toEqual(expect.any(Number));
    });
  });

  describe('blockSetProgress method', () => {
    it('should not block progress when no end time specified', () => {
      const permanentEffect = new SimpleEffect(baseTime);

      expect(permanentEffect.blockSetProgress()).toBe(false);
      expect(permanentEffect.blockSetProgress(baseTime + 1000)).toBe(false);
    });

    it('should not block progress when no time parameter provided', () => {
      const timedEffect = new SimpleEffect(baseTime, baseTime + 5000);

      expect(timedEffect.blockSetProgress()).toBe(false);
    });

    it('should block progress during effect duration', () => {
      const timedEffect = new SimpleEffect(baseTime, baseTime + 5000);

      expect(timedEffect.blockSetProgress(baseTime + 1000)).toBe(true);
      expect(timedEffect.blockSetProgress(baseTime + 2500)).toBe(true);
      expect(timedEffect.blockSetProgress(baseTime + 4999)).toBe(true);
    });

    it('should not block progress exactly at end time', () => {
      const timedEffect = new SimpleEffect(baseTime, baseTime + 5000);

      expect(timedEffect.blockSetProgress(baseTime + 5000)).toBe(false);
    });

    it('should not block progress after effect expires', () => {
      const timedEffect = new SimpleEffect(baseTime, baseTime + 5000);

      expect(timedEffect.blockSetProgress(baseTime + 5001)).toBe(false);
      expect(timedEffect.blockSetProgress(baseTime + 10000)).toBe(false);
    });

  });

  describe('concrete effect implementations', () => {
    describe('TestEffect', () => {
      it('should respect custom validation logic', () => {
        const allowingEffect = new TestEffect(baseTime, baseTime + 5000, true);
        const blockingEffect = new TestEffect(baseTime, baseTime + 5000, false);

        expect(allowingEffect.validateSetValue(baseTime + 6000)).toBe(true);
        expect(blockingEffect.validateSetValue(baseTime + 6000)).toBe(false);
      });

      it('should respect custom progress blocking logic', () => {
        const normalEffect = new TestEffect(baseTime, baseTime + 5000, true, false);
        const progressBlockingEffect = new TestEffect(baseTime, baseTime + 5000, true, true);

        expect(normalEffect.blockSetProgress(baseTime + 1000)).toBe(true); // Base behavior
        expect(progressBlockingEffect.blockSetProgress(baseTime + 6000)).toBe(true);
      });

      it('should include custom properties in hash', () => {
        const effect1 = new TestEffect(baseTime, baseTime + 5000, true, false);
        const effect2 = new TestEffect(baseTime, baseTime + 5000, false, true);

        expect(effect1.computeHash()).not.toBe(effect2.computeHash());
      });
    });

    describe('PermanentEffect', () => {
      it('should never expire', () => {
        const permanentEffect = new PermanentEffect(baseTime);

        expect(permanentEffect.lastUntil).toBeUndefined();
        expect(permanentEffect.validateSetValue(baseTime + 1000000)).toBe(true);
        expect(permanentEffect.blockSetProgress(baseTime + 1000000)).toBe(false);
      });
    });

    describe('TimedEffect', () => {
      it('should have correct end time based on duration', () => {
        const duration = 3000;
        const timedEffect = new TimedEffect(baseTime, duration);

        expect(timedEffect.startedAt).toBe(baseTime);
        expect(timedEffect.lastUntil).toBe(baseTime + duration);
      });

      it('should behave correctly during and after duration', () => {
        const duration = 2000;
        const timedEffect = new TimedEffect(baseTime, duration);

        // During effect
        expect(timedEffect.validateSetValue(baseTime + 1000)).toBe(false);
        expect(timedEffect.blockSetProgress(baseTime + 1000)).toBe(true);

        // After effect
        expect(timedEffect.validateSetValue(baseTime + 3000)).toBe(true);
        expect(timedEffect.blockSetProgress(baseTime + 3000)).toBe(false);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle extreme time values', () => {
      const extremeEffect = new SimpleEffect(
        Number.MAX_SAFE_INTEGER - 1000,
        Number.MAX_SAFE_INTEGER
      );

      expect(extremeEffect.validateSetValue(Number.MAX_SAFE_INTEGER - 500)).toBe(false);
      expect(extremeEffect.validateSetValue(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should handle negative time values', () => {
      const negativeEffect = new SimpleEffect(-1000, -500);

      expect(negativeEffect.validateSetValue(-750)).toBe(false);
      expect(negativeEffect.validateSetValue(-400)).toBe(true);
    });

    it('should handle fractional time values', () => {
      const fractionalEffect = new SimpleEffect(1000.5, 2000.7);

      expect(fractionalEffect.validateSetValue(1500.6)).toBe(false);
      expect(fractionalEffect.validateSetValue(2000.7)).toBe(true);
      expect(fractionalEffect.validateSetValue(2000.8)).toBe(true);
    });

    it('should handle zero duration effects', () => {
      const instantEffect = new SimpleEffect(baseTime, baseTime);

      expect(instantEffect.validateSetValue(baseTime - 1)).toBe(false);
      expect(instantEffect.validateSetValue(baseTime)).toBe(true);
      expect(instantEffect.validateSetValue(baseTime + 1)).toBe(true);
    });

    it('should handle effects with end time before start time', () => {
      const backwardsEffect = new SimpleEffect(baseTime, baseTime - 1000);

      // Should still follow the logic even if times don't make logical sense
      expect(backwardsEffect.validateSetValue(baseTime - 500)).toBe(true);
      expect(backwardsEffect.validateSetValue(baseTime - 1000)).toBe(true);
    });
  });

  describe('inheritance and polymorphism', () => {
    it('should work correctly with polymorphic arrays', () => {
      const effects: BaseEffectModel[] = [
        new SimpleEffect(baseTime, baseTime + 1000),
        new TestEffect(baseTime, baseTime + 2000),
        new PermanentEffect(baseTime),
        new TimedEffect(baseTime, 3000)
      ];

      effects.forEach(effect => {
        expect(effect.startedAt).toBe(baseTime);
        expect(effect.validateSetValue(baseTime + 5000)).toEqual(expect.any(Boolean));
        expect(effect.blockSetProgress(baseTime + 5000)).toEqual(expect.any(Boolean));
        expect(effect.computeHash()).toEqual(expect.any(Number));
      });
    });

    it('should support method overriding correctly', () => {
      const baseEffect = new SimpleEffect(baseTime, baseTime + 5000);
      const customEffect = new TestEffect(baseTime, baseTime + 5000, false, true);

      // Same timing, different behavior due to overrides
      expect(baseEffect.validateSetValue(baseTime + 6000)).toBe(true);
      expect(customEffect.validateSetValue(baseTime + 6000)).toBe(false);

      expect(baseEffect.blockSetProgress(baseTime + 6000)).toBe(false);
      expect(customEffect.blockSetProgress(baseTime + 6000)).toBe(true);
    });
  });

  describe('state consistency and immutability', () => {
    it('should maintain consistent state across multiple calls', () => {
      const effect = new SimpleEffect(baseTime, baseTime + 5000);
      const hash1 = effect.computeHash();

      // Multiple calls to read-only methods shouldn't change state
      effect.validateSetValue(baseTime + 1000);
      effect.blockSetProgress(baseTime + 1000);
      effect.validateSetValue(baseTime + 6000);
      effect.blockSetProgress(baseTime + 6000);

      const hash2 = effect.computeHash();
      expect(hash1).toBe(hash2);
    });

    it('should be immutable after construction', () => {
      const startTime = baseTime;
      const endTime = baseTime + 5000;
      const effect = new SimpleEffect(startTime, endTime);

      expect(effect.startedAt).toBe(startTime);
      expect(effect.lastUntil).toBe(endTime);

      // Properties should be readonly (TypeScript compile-time check)
      // At runtime, we can't easily test this without breaking encapsulation
    });

    it('should handle concurrent access patterns', () => {
      const effect = new SimpleEffect(baseTime, baseTime + 5000);

      // Simulate concurrent access
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push({
          validate: effect.validateSetValue(baseTime + (i * 100)),
          progress: effect.blockSetProgress(baseTime + (i * 100)),
          hash: effect.computeHash()
        });
      }

      // All hashes should be identical (no state changes)
      const uniqueHashes = new Set(results.map(r => r.hash));
      expect(uniqueHashes.size).toBe(1);

      // Results should be deterministic based on time
      const halfway = Math.floor(results.length / 2);
      expect(results[0].validate).toBe(false); // During effect
      expect(results[halfway].validate).toBe(true);
      expect(results[results.length - 1].validate).toBe(true); // After effect
    });
  });

  describe('performance characteristics', () => {
    it('should handle rapid successive calls efficiently', () => {
      const effect = new SimpleEffect(baseTime, baseTime + 5000);
      const iterations = 10000;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        effect.validateSetValue(baseTime + i);
        effect.blockSetProgress(baseTime + i);
        effect.computeHash();
      }
      const end = performance.now();

      // Should complete quickly (adjust threshold as needed)
      expect(end - start).toBeLessThan(100);
    });

    it('should handle effects with large time ranges', () => {
      const largeRangeEffect = new SimpleEffect(0, Number.MAX_SAFE_INTEGER);

      // Should not cause performance issues or overflow
      expect(largeRangeEffect.validateSetValue(Number.MAX_SAFE_INTEGER / 2)).toBe(false);
      expect(largeRangeEffect.validateSetValue(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(largeRangeEffect.computeHash()).toEqual(expect.any(Number));
    });
  });
});
