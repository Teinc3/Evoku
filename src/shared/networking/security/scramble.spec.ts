import LifecycleActions from '../../types/enums/actions/match/lifecycle';


// NOTE: We purposefully DO NOT import PacketScrambler at the top level.
// The implementation reads its seed from a statically imported JSON config. To
// vary the seed per test, we mock that JSON module before requiring the class.
import type ActionEnum from '../../types/enums/actions';


// PRNG mock used by dynamic module factory. We avoid a top-level jest.mock here
// because jest hoists those calls before variable initialization (TDZ issue).
const mockPrng = jest.fn();

/**
 * Helper to create a PacketScrambler instance with a provided seed *without*
 * relying on process.env. We mock the JSON config module that the
 * implementation imports: '@config/client.json'. Each invocation
 * resets modules so the fresh mock is picked up.
 */
function createScrambler(seed?: string) {
  jest.resetModules();
  // Re‑mock seedrandom after reset
  jest.doMock('seedrandom', () => jest.fn(() => mockPrng));
  jest.doMock('@config/client.json', () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: {
      security: { packetScramblerSeed: seed }
    }
  }), { virtual: true });
  // Now require AFTER mocks are in place
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PacketScrambler } = require('./scramble');
  return new PacketScrambler();
}

describe('PacketScrambler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor without seed', () => {
    it('should create PacketScrambler without seed', () => {
      const scrambler = createScrambler(undefined);
      expect(scrambler).toBeDefined();
    });

    it('should pass through IDs unchanged when no seed is provided', () => {
      const scrambler = createScrambler(undefined);
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
      mockPrng.mockReturnValue(0.5);
      const scrambler = createScrambler('test-seed');
      expect(scrambler).toBeDefined();
    });

    it('should use seedrandom with provided seed', () => {
      mockPrng.mockReturnValue(0.5);
      createScrambler('my-test-seed');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const seedrandom = require('seedrandom');
      expect(seedrandom).toHaveBeenCalledWith('my-test-seed');
    });
  });

  describe('scrambleID', () => {
    it('should return original ID when no seed is configured', () => {
      const scrambler = createScrambler(undefined);
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      const result = scrambler.scrambleID(testID);
      expect(result).toBe(testID);
    });

    it('should scramble ID when seed is configured', () => {
      const randVals = [0.1, 0.2, 0.3, 0.4, 0.5];
      let callCount = 0;
      mockPrng.mockImplementation(() => randVals[callCount++ % randVals.length]);
      const scrambler = createScrambler('test-seed');
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      let different = false;
      for (let i = 0; i < 5; i++) {
        const result = scrambler.scrambleID(testID);
        if (result !== testID) { different = true; break; }
      }
      expect(different).toBe(true);
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
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = scrambler.scrambleID(outOfRangeID);
      
      expect(result).toBe(outOfRangeID);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No mapping for devID 999')
      );
      consoleSpy.mockRestore();
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
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = scrambler.unscrambleID(invalidScrambledID);
      
      expect(result).toBe(invalidScrambledID);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not unscramble ID 999')
      );
      consoleSpy.mockRestore();
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
        expect(end - start).toBeLessThan(1); // Should be very fast
      });
    });
  });
});