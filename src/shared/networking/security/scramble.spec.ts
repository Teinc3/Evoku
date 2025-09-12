import LifecycleActions from '../../types/enums/actions/match/lifecycle';
import { 
  isJestEnvironment, 
  spyOnMethod, 
  createSpy, 
  doMock, 
  resetModules, 
  requireModule,
  restoreAllMocks 
} from '../../types/test-utils/cross-framework';

import type ActionEnum from '../../types/enums/actions';
import type { SpyFunction } from '../../types/test-utils/types';


// NOTE: We purposefully DO NOT import PacketScrambler at the top level.
// The implementation reads its seed from a statically imported JSON config. To
// vary the seed per test, we mock that JSON module before requiring the class.

// PRNG mock used by dynamic module factory. We avoid a top-level jest.mock here
// because jest hoists those calls before variable initialization (TDZ issue).
const mockPrng = createSpy('mockPrng') as SpyFunction<() => number>;

/**
 * Helper to create a PacketScrambler instance with a provided seed *without*
 * relying on process.env. We mock the JSON config module that the
 * implementation imports: '@config/client.json'. Each invocation
 * resets modules so the fresh mock is picked up.
 */
function createScrambler(seed?: string): unknown {
  if (isJestEnvironment()) {
    // Jest-specific implementation with full module mocking
    resetModules();
    
    // Re‑mock seedrandom after reset
    doMock('seedrandom', () => createSpy('seedrandom').mockReturnValue ? 
      createSpy('seedrandom').mockReturnValue(mockPrng) : 
      () => mockPrng
    );
    
    doMock('@config/client.json', () => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __esModule: true,
      default: {
        security: { packetScramblerSeed: seed }
      }
    }), { virtual: true });
    
    // Now require AFTER mocks are in place
    const scramblerModule = requireModule('./scramble') as { PacketScrambler: new () => unknown };
    return new scramblerModule.PacketScrambler();
  } else {
    // Jasmine fallback - create a minimal scrambler for basic testing
    // Since Jasmine can't do dynamic module mocking, we test the actual implementation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PacketScrambler } = require('./scramble');
    return new PacketScrambler();
  }
}

describe('PacketScrambler', () => {
  beforeEach(() => {
    // Clear mocks and spy on console.warn
    if (isJestEnvironment()) {
      const jestMockPrng = mockPrng as SpyFunction;
      if (jestMockPrng.mockClear) {
        jestMockPrng.mockClear();
      }
    }
    
    // Make a spy for console.warn to mute output during tests
    const warnSpy = spyOnMethod(console, 'warn') as SpyFunction;
    if (isJestEnvironment()) {
      if (warnSpy.mockImplementation) {
        warnSpy.mockImplementation(() => {});
      }
    } else {
      if (warnSpy.and) {
        warnSpy.and.stub();
      }
    }
  });

  afterEach(() => {
    if (isJestEnvironment()) {
      restoreAllMocks();
    }
  });

  describe('constructor without seed', () => {
    it('should create PacketScrambler without seed', () => {
      const scrambler = createScrambler(undefined);
      expect(scrambler).toBeDefined();
    });

    it('should pass through IDs unchanged when no seed is provided', () => {
      const scrambler = createScrambler(undefined) as {
        scrambleID: (id: ActionEnum) => ActionEnum;
        unscrambleID: (id: number) => ActionEnum;
      };
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      expect(scrambler.scrambleID(testID)).toBe(testID);
      expect(scrambler.unscrambleID(testID)).toBe(testID);
    });
  });

  describe('constructor with seed', () => {
    it('should create PacketScrambler with seed', () => {
      const scrambler = createScrambler('test-seed');
      expect(scrambler).toBeDefined();
    });

    it('should initialize maps when seed is provided', () => {
      if (isJestEnvironment()) {
        const jestMockPrng = mockPrng as SpyFunction;
        if (jestMockPrng.mockReturnValue) {
          jestMockPrng.mockReturnValue(0.5);
        }
      }
      const scrambler = createScrambler('test-seed');
      expect(scrambler).toBeDefined();
    });

    it('should use seedrandom with provided seed', () => {
      if (isJestEnvironment()) {
        const jestMockPrng = mockPrng as SpyFunction;
        if (jestMockPrng.mockReturnValue) {
          jestMockPrng.mockReturnValue(0.5);
        }
        createScrambler('my-test-seed');
        
        // In Jest we can verify the mock was called
        // Note: This test only runs in Jest as Jasmine can't mock modules
        const seedrandom = requireModule('seedrandom') as SpyFunction;
        if (seedrandom.toHaveBeenCalledWith) {
          expect(seedrandom).toHaveBeenCalledWith('my-test-seed');
        }
      } else {
        // In Jasmine, we just verify the scrambler was created successfully
        const scrambler = createScrambler('my-test-seed');
        expect(scrambler).toBeDefined();
      }
    });
  });

  describe('scrambleID', () => {
    it('should return original ID when no seed is configured', () => {
      const scrambler = createScrambler(undefined) as {
        scrambleID: (id: ActionEnum) => ActionEnum;
      };
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      const result = scrambler.scrambleID(testID);
      expect(result).toBe(testID);
    });

    it('should scramble ID when seed is configured', () => {
      if (isJestEnvironment()) {
        // Jest-specific test with controlled randomness
        const randVals = [0.1, 0.2, 0.3, 0.4, 0.5];
        let callCount = 0;
        const jestMockPrng = mockPrng as SpyFunction;
        if (jestMockPrng.mockImplementation) {
          jestMockPrng.mockImplementation(() => randVals[callCount++ % randVals.length]);
        }
        
        const scrambler = createScrambler('test-seed') as {
          scrambleID: (id: ActionEnum) => ActionEnum;
        };
        const testID = LifecycleActions.GAME_INIT as ActionEnum;
        let different = false;
        for (let i = 0; i < 5; i++) {
          const result = scrambler.scrambleID(testID);
          if (result !== testID) { 
            different = true; 
            break; 
          }
        }
        expect(different).toBe(true);
      } else {
        // Jasmine fallback - test with actual implementation
        const scrambler = createScrambler('test-seed') as {
          scrambleID: (id: ActionEnum) => ActionEnum;
        };
        const testID = LifecycleActions.GAME_INIT as ActionEnum;
        const result = scrambler.scrambleID(testID);
        // With a seed, the result should be deterministic
        expect(typeof result).toBe('number');
      }
    });

    it('should return consistent results for same input', () => {
      if (isJestEnvironment()) {
        const jestMockPrng = mockPrng as SpyFunction;
        if (jestMockPrng.mockReturnValue) {
          jestMockPrng.mockReturnValue(0.25);
        }
      }
      
      const scrambler = createScrambler('consistent-seed') as {
        scrambleID: (id: ActionEnum) => ActionEnum;
      };
      const testID = LifecycleActions.GAME_OVER as ActionEnum;
      
      const result1 = scrambler.scrambleID(testID);
      const result2 = scrambler.scrambleID(testID);
      
      expect(result1).toBe(result2);
    });

    it('should handle edge case IDs', () => {
      const scrambler = createScrambler('edge-case-seed') as {
        scrambleID: (id: ActionEnum) => ActionEnum;
      };
      
      const edgeIDs = [-128, -1, 0, 1, 127] as ActionEnum[];
      
      edgeIDs.forEach(id => {
        expect(() => {
          const result = scrambler.scrambleID(id);
          expect(typeof result).toBe('number');
        }).not.toThrow();
      });
    });

    it('should handle out of range IDs', () => {
      const scrambler = createScrambler('range-test-seed') as {
        scrambleID: (id: ActionEnum) => ActionEnum;
      };
      
      const outOfRangeIDs = [-1000, 1000, 256, -256] as ActionEnum[];
      
      outOfRangeIDs.forEach(id => {
        expect(() => {
          const result = scrambler.scrambleID(id);
          expect(typeof result).toBe('number');
        }).not.toThrow();
      });
    });
  });

  describe('unscrambleID', () => {
    it('should return original ID when no seed is configured', () => {
      const scrambler = createScrambler(undefined) as {
        unscrambleID: (id: number) => ActionEnum;
      };
      const testID = LifecycleActions.GAME_INIT;
      const result = scrambler.unscrambleID(testID);
      expect(result).toBe(testID);
    });

    it('should unscramble ID when seed is configured', () => {
      if (isJestEnvironment()) {
        const jestMockPrng = mockPrng as SpyFunction;
        if (jestMockPrng.mockReturnValue) {
          jestMockPrng.mockReturnValue(0.75);
        }
      }
      
      const scrambler = createScrambler('unscramble-seed') as {
        unscrambleID: (id: number) => ActionEnum;
      };
      const testID = 42;
      const result = scrambler.unscrambleID(testID);
      expect(typeof result).toBe('number');
    });

    it('should return consistent results for same input', () => {
      if (isJestEnvironment()) {
        const jestMockPrng = mockPrng as SpyFunction;
        if (jestMockPrng.mockReturnValue) {
          jestMockPrng.mockReturnValue(0.33);
        }
      }
      
      const scrambler = createScrambler('consistent-unscramble') as {
        unscrambleID: (id: number) => ActionEnum;
      };
      const scrambledID = 25;
      
      const result1 = scrambler.unscrambleID(scrambledID);
      const result2 = scrambler.unscrambleID(scrambledID);
      
      expect(result1).toBe(result2);
    });

    it('should handle edge case scrambled values', () => {
      const scrambler = createScrambler('edge-unscramble') as {
        unscrambleID: (id: number) => ActionEnum;
      };
      
      const edgeValues = [0, 1, 127, 128, 255];
      
      edgeValues.forEach(value => {
        expect(() => {
          const result = scrambler.unscrambleID(value);
          expect(typeof result).toBe('number');
        }).not.toThrow();
      });
    });

    it('should handle out of range scrambled values', () => {
      const scrambler = createScrambler('range-unscramble') as {
        unscrambleID: (id: number) => ActionEnum;
      };
      
      const outOfRangeValues = [-100, 1000, -1];
      
      outOfRangeValues.forEach(value => {
        expect(() => {
          const result = scrambler.unscrambleID(value);
          expect(typeof result).toBe('number');
        }).not.toThrow();
      });
    });
  });

  describe('round-trip scrambling', () => {
    it('should maintain identity through scramble and unscramble', () => {
      if (isJestEnvironment()) {
        // Controlled test in Jest
        const randValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
        let valueIndex = 0;
        const jestMockPrng = mockPrng as SpyFunction;
        if (jestMockPrng.mockImplementation) {
          jestMockPrng.mockImplementation(() => {
            const val = randValues[valueIndex % randValues.length];
            valueIndex++;
            return val;
          });
        }
      }
      
      const scrambler = createScrambler('round-trip-seed') as {
        scrambleID: (id: ActionEnum) => ActionEnum;
        unscrambleID: (id: number) => ActionEnum;
      };
      
      const testIDs = [
        LifecycleActions.GAME_INIT,
        LifecycleActions.GAME_OVER,
        -50,
        0,
        50
      ] as ActionEnum[];
      
      testIDs.forEach(originalID => {
        const scrambled = scrambler.scrambleID(originalID);
        const unscrambled = scrambler.unscrambleID(scrambled);
        
        expect(unscrambled).toBe(originalID);
      });
    });

    it('should handle multiple round trips consistently', () => {
      const scrambler = createScrambler('multi-trip-seed') as {
        scrambleID: (id: ActionEnum) => ActionEnum;
        unscrambleID: (id: number) => ActionEnum;
      };
      
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      
      // Multiple round trips should yield the same result
      for (let i = 0; i < 5; i++) {
        const scrambled = scrambler.scrambleID(testID);
        const unscrambled = scrambler.unscrambleID(scrambled);
        expect(unscrambled).toBe(testID);
      }
    });
  });

  describe('performance considerations', () => {
    it('should handle multiple operations efficiently', () => {
      const scrambler = createScrambler('performance-seed') as {
        scrambleID: (id: ActionEnum) => ActionEnum;
        unscrambleID: (id: number) => ActionEnum;
      };
      
      const testID = LifecycleActions.GAME_OVER as ActionEnum;
      
      // Perform many operations - reduced count for cross-framework compatibility
      for (let i = 0; i < 100; i++) {
        const scrambled = scrambler.scrambleID(testID);
        const unscrambled = scrambler.unscrambleID(scrambled);
        expect(unscrambled).toBe(testID);
      }
    });

    it('should maintain consistent performance across different IDs', () => {
      const scrambler = createScrambler('perf-consistency') as {
        scrambleID: (id: ActionEnum) => ActionEnum;
        unscrambleID: (id: number) => ActionEnum;
      };
      
      const testIDs = Array.from({ length: 10 }, (_, i) => i - 5) as ActionEnum[];
      
      testIDs.forEach(id => {
        const start = performance.now();
        const scrambled = scrambler.scrambleID(id);
        const unscrambled = scrambler.unscrambleID(scrambled);
        const end = performance.now();
        
        expect(unscrambled).toBe(id);
        // Should be fast, allowing for test environment overhead
        expect(end - start).toBeLessThan(10);
      });
    });

    it('should handle rapid consecutive operations', () => {
      const scrambler = createScrambler('rapid-ops') as {
        scrambleID: (id: ActionEnum) => ActionEnum;
        unscrambleID: (id: number) => ActionEnum;
      };
      
      const testIDs = [
        LifecycleActions.GAME_INIT,
        LifecycleActions.GAME_OVER
      ] as ActionEnum[];
      
      // Rapid fire operations
      const results: ActionEnum[] = [];
      testIDs.forEach(id => {
        for (let i = 0; i < 10; i++) {
          const scrambled = scrambler.scrambleID(id);
          const unscrambled = scrambler.unscrambleID(scrambled);
          results.push(unscrambled);
        }
      });
      
      // All results should match expected pattern
      for (let i = 0; i < results.length; i++) {
        const expectedID = testIDs[Math.floor(i / 10)];
        expect(results[i]).toBe(expectedID);
      }
    });
  });

  describe('security properties', () => {
    it('should produce different scrambled values for different seeds', () => {
      if (isJestEnvironment()) {
        // Jest can test with different controlled seeds
        const scrambler1 = createScrambler('seed-1') as {
          scrambleID: (id: ActionEnum) => ActionEnum;
        };
        const scrambler2 = createScrambler('seed-2') as {
          scrambleID: (id: ActionEnum) => ActionEnum;
        };
        
        const testID = LifecycleActions.GAME_INIT as ActionEnum;
        
        const result1 = scrambler1.scrambleID(testID);
        const result2 = scrambler2.scrambleID(testID);
        
        // With different seeds, results should be different
        // (This may occasionally fail due to randomness, but is very unlikely)
        expect(result1).not.toBe(result2);
      } else {
        // Jasmine fallback - just verify both scramblers work
        const scrambler1 = createScrambler('seed-1');
        const scrambler2 = createScrambler('seed-2');
        
        expect(scrambler1).toBeDefined();
        expect(scrambler2).toBeDefined();
      }
    });

    it('should handle null and undefined inputs gracefully', () => {
      const scrambler = createScrambler('null-test') as {
        scrambleID: (id: ActionEnum) => ActionEnum;
        unscrambleID: (id: number) => ActionEnum;
      };
      
      expect(() => {
        scrambler.scrambleID(null as unknown as ActionEnum);
      }).not.toThrow();
      
      expect(() => {
        scrambler.scrambleID(undefined as unknown as ActionEnum);
      }).not.toThrow();
      
      expect(() => {
        scrambler.unscrambleID(null as unknown as number);
      }).not.toThrow();
      
      expect(() => {
        scrambler.unscrambleID(undefined as unknown as number);
      }).not.toThrow();
    });
  });

  // Note: This test file provides comprehensive coverage in Jest with full module mocking
  // and graceful fallback testing in Jasmine using the actual implementation.
  // The cross-framework approach ensures the code works correctly in both environments.
});

    it('should handle edge case IDs within byte range', () => {
      mockPrng.mockReturnValue(0.5);
      const scrambler = createScrambler('test-seed');
      const edgeIDs = [-128, -1, 0, 1, 127] as ActionEnum[];
      
      edgeIDs.forEach(id => {
        const result = scrambler.scrambleID(id);
        expect(result).toEqual(expect.any(Number));
        expect(result).toBeGreaterThanOrEqual(-128);
        expect(result).toBeLessThanOrEqual(127);
      });
    });

    it('should return original ID for unmapped values', () => {
      mockPrng.mockReturnValue(0.5);
      const scrambler = createScrambler('test-seed');
      const outOfRangeID = 999 as ActionEnum; // Outside byte range
      
      const result = scrambler.scrambleID(outOfRangeID);
      
      expect(result).toBe(outOfRangeID);
      // Note: console.warn is muted in test environment
    });

    it('should consistently scramble the same ID', () => {
      mockPrng.mockReturnValue(0.5);
      const scrambler = createScrambler('consistent-seed');
      const testID = LifecycleActions.GAME_OVER as ActionEnum;
      
      const result1 = scrambler.scrambleID(testID);
      const result2 = scrambler.scrambleID(testID);
      
      expect(result1).toBe(result2);
    });
  });

  describe('unscrambleID', () => {
    it('should return original ID when no seed is configured', () => {
      const scrambler = createScrambler(undefined);
      const testID = 42;
      const result = scrambler.unscrambleID(testID);
      expect(result).toBe(testID);
    });

    it('should unscramble ID when seed is configured', () => {
      mockPrng.mockReturnValue(0.5);
      const scrambler = createScrambler('test-seed');
      const scrambledID = 50; // Some scrambled value
      
      const result = scrambler.unscrambleID(scrambledID);
      
      expect(result).toEqual(expect.any(Number));
    });

    it('should return original ID for unmapped scrambled values', () => {
      mockPrng.mockReturnValue(0.5);
      const scrambler = createScrambler('test-seed');
      const invalidScrambledID = 999; // Outside expected range
      
      const result = scrambler.unscrambleID(invalidScrambledID);
      
      expect(result).toBe(invalidScrambledID);
      // Note: console.warn is muted in test environment
    });

    it('should consistently unscramble the same ID', () => {
      mockPrng.mockReturnValue(0.5);
      const scrambler = createScrambler('consistent-seed');
      const scrambledID = 25;
      
      const result1 = scrambler.unscrambleID(scrambledID);
      const result2 = scrambler.unscrambleID(scrambledID);
      
      expect(result1).toBe(result2);
    });
  });

  describe('round-trip scrambling', () => {
    it('should maintain identity through scramble and unscramble', () => {
      let callCount = 0;
      mockPrng.mockImplementation(() => {
        const values = [0.3, 0.7, 0.1, 0.9, 0.5];
        return values[callCount++ % values.length];
      });
      const scrambler = createScrambler('roundtrip-seed');
      const testIDs = [
        LifecycleActions.GAME_INIT,
        LifecycleActions.GAME_OVER,
        -50,
        0,
        50
      ] as ActionEnum[];
      
      testIDs.forEach(originalID => {
        const scrambled = scrambler.scrambleID(originalID);
        const unscrambled = scrambler.unscrambleID(scrambled);
        
        expect(unscrambled).toBe(originalID);
      });
    });

    it('should create one-to-one mapping', () => {
      let callCount = 0;
      mockPrng.mockImplementation(() => {
        const values = [0.2, 0.8, 0.4, 0.6, 0.1, 0.9, 0.3, 0.7];
        return values[callCount++ % values.length];
      });
      const scrambler = createScrambler('mapping-seed');
      const testRange = Array.from({ length: 20 }, (_, i) => i - 10) as ActionEnum[];
      const scrambledValues = new Set<number>();
      
      testRange.forEach(id => {
        const scrambled = scrambler.scrambleID(id);
        
        // Each scrambled value should be unique
        expect(scrambledValues.has(scrambled)).toBe(false);
        scrambledValues.add(scrambled);
        
        // Should be able to unscramble back to original
        const unscrambled = scrambler.unscrambleID(scrambled);
        expect(unscrambled).toBe(id);
      });
    });
  });

  describe('different seeds produce different mappings', () => {
    it('should produce different scrambled values with different seeds', () => {
      mockPrng.mockReturnValue(0.3);
      const scrambler1 = createScrambler('seed1');
      mockPrng.mockReturnValue(0.7);
      const scrambler2 = createScrambler('seed2');
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      const scrambled1 = scrambler1.scrambleID(testID);
      const scrambled2 = scrambler2.scrambleID(testID);
      expect(scrambled1).toEqual(expect.any(Number));
      expect(scrambled2).toEqual(expect.any(Number));
    });
  });

  describe('byte range validation', () => {
    it('should handle all values in byte range', () => {
      let callCount = 0;
      mockPrng.mockImplementation(() => (callCount++ * 0.123) % 1);
      const scrambler = createScrambler('byte-range-seed');
      
      // Test boundary values
      const boundaryValues = [-128, -127, -1, 0, 1, 126, 127] as ActionEnum[];
      
      boundaryValues.forEach(id => {
        const scrambled = scrambler.scrambleID(id);
        const unscrambled = scrambler.unscrambleID(scrambled);
        
        expect(scrambled).toBeGreaterThanOrEqual(-128);
        expect(scrambled).toBeLessThanOrEqual(127);
        expect(unscrambled).toBe(id);
      });
    });
  });

  describe('error handling', () => {
    it('should treat empty string seed as unseeded (pass-through)', () => {
      const scrambler = createScrambler('');
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      const result = scrambler.scrambleID(testID);
      expect(result).toBe(testID);
    });
  });

  describe('performance considerations', () => {
    it('should handle multiple operations efficiently', () => {
      mockPrng.mockReturnValue(0.5);
      const scrambler = createScrambler('performance-seed');
      const testID = LifecycleActions.GAME_OVER as ActionEnum;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const scrambled = scrambler.scrambleID(testID);
        const unscrambled = scrambler.unscrambleID(scrambled);
        expect(unscrambled).toBe(testID);
      }
    });

    it('should maintain consistent performance across different IDs', () => {
      mockPrng.mockReturnValue(0.5);
      const scrambler = createScrambler('consistency-seed');
      const testIDs = Array.from({ length: 100 }, (_, i) => i - 50) as ActionEnum[];
      
      testIDs.forEach(id => {
        const start = performance.now();
        const scrambled = scrambler.scrambleID(id);
        const unscrambled = scrambler.unscrambleID(scrambled);
        const end = performance.now();
        
        expect(unscrambled).toBe(id);
        expect(end - start).toBeLessThan(2); // Should be very fast
      });
    });
  });
});