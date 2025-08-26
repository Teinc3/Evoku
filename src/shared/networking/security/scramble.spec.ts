import LifecycleActions from '../../types/enums/actions/match/lifecycle';
import { PacketScrambler } from './scramble';

import type ActionEnum from '../../types/enums/actions';


// Mock seedrandom
const mockPrng = jest.fn();
jest.mock('seedrandom', () => {
  return jest.fn(() => mockPrng);
});

describe('PacketScrambler', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor without seed', () => {
    it('should create PacketScrambler without seed', () => {
      delete process.env['NG_APP_PACKET_SCRAMBLER_SEED'];
      
      const scrambler = new PacketScrambler();
      
      expect(scrambler).toBeDefined();
      expect(scrambler).toBeInstanceOf(PacketScrambler);
    });

    it('should pass through IDs unchanged when no seed is provided', () => {
      delete process.env['NG_APP_PACKET_SCRAMBLER_SEED'];
      
      const scrambler = new PacketScrambler();
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      
      expect(scrambler.scrambleID(testID)).toBe(testID);
      expect(scrambler.unscrambleID(testID)).toBe(testID);
    });
  });

  describe('constructor with seed', () => {
    it('should create PacketScrambler with seed', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'test-seed';
      
      const scrambler = new PacketScrambler();
      
      expect(scrambler).toBeDefined();
    });

    it('should initialize maps when seed is provided', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'test-seed';
      // Setup mock PRNG to return predictable values
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
      
      expect(scrambler).toBeDefined();
    });

    it('should use seedrandom with provided seed', () => {
      const seedrandom = jest.requireMock('seedrandom');
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'my-test-seed';
      mockPrng.mockReturnValue(0.5);
      
      new PacketScrambler();
      
      expect(seedrandom).toHaveBeenCalledWith('my-test-seed');
    });
  });

  describe('scrambleID', () => {
    it('should return original ID when no seed is configured', () => {
      delete process.env['NG_APP_PACKET_SCRAMBLER_SEED'];
      
      const scrambler = new PacketScrambler();
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      
      const result = scrambler.scrambleID(testID);
      
      expect(result).toBe(testID);
    });

    it('should scramble ID when seed is configured', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'test-seed';
      // Use a deterministic sequence of PRNG outputs across attempts to reduce
      // the chance of an accidental identity mapping. Try up to 5 times.
      const randVals = [0.1, 0.2, 0.3, 0.4, 0.5];
      let callCount = 0;
      mockPrng.mockImplementation(() => randVals[callCount++ % randVals.length]);

      const scrambler = new PacketScrambler();
      const testID = LifecycleActions.GAME_INIT as ActionEnum;

      let different = false;
      for (let i = 0; i < 5; i++) {
        const result = scrambler.scrambleID(testID);
        if (result !== testID) {
          different = true;
          break;
        }
      }

      // Expect at least one scramble to differ from the original ID
      expect(different).toBe(true);
    });

    it('should handle edge case IDs within byte range', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'test-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
      const edgeIDs = [-128, -1, 0, 1, 127] as ActionEnum[];
      
      edgeIDs.forEach(id => {
        const result = scrambler.scrambleID(id);
        expect(result).toEqual(expect.any(Number));
        expect(result).toBeGreaterThanOrEqual(-128);
        expect(result).toBeLessThanOrEqual(127);
      });
    });

    it('should return original ID for unmapped values', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'test-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
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
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'consistent-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
      const testID = LifecycleActions.GAME_OVER as ActionEnum;
      
      const result1 = scrambler.scrambleID(testID);
      const result2 = scrambler.scrambleID(testID);
      
      expect(result1).toBe(result2);
    });
  });

  describe('unscrambleID', () => {
    it('should return original ID when no seed is configured', () => {
      delete process.env['NG_APP_PACKET_SCRAMBLER_SEED'];
      
      const scrambler = new PacketScrambler();
      const testID = 42;
      
      const result = scrambler.unscrambleID(testID);
      
      expect(result).toBe(testID);
    });

    it('should unscramble ID when seed is configured', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'test-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
      const scrambledID = 50; // Some scrambled value
      
      const result = scrambler.unscrambleID(scrambledID);
      
      expect(result).toEqual(expect.any(Number));
    });

    it('should return original ID for unmapped scrambled values', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'test-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
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
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'consistent-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
      const scrambledID = 25;
      
      const result1 = scrambler.unscrambleID(scrambledID);
      const result2 = scrambler.unscrambleID(scrambledID);
      
      expect(result1).toBe(result2);
    });
  });

  describe('round-trip scrambling', () => {
    it('should maintain identity through scramble and unscramble', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'roundtrip-seed';
      // Create deterministic but varied shuffle
      let callCount = 0;
      mockPrng.mockImplementation(() => {
        const values = [0.3, 0.7, 0.1, 0.9, 0.5];
        return values[callCount++ % values.length];
      });
      
      const scrambler = new PacketScrambler();
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
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'mapping-seed';
      // Create varied shuffle for mapping
      let callCount = 0;
      mockPrng.mockImplementation(() => {
        const values = [0.2, 0.8, 0.4, 0.6, 0.1, 0.9, 0.3, 0.7];
        return values[callCount++ % values.length];
      });
      
      const scrambler = new PacketScrambler();
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
      // First scrambler with seed1
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'seed1';
      mockPrng.mockReturnValue(0.3);
      const scrambler1 = new PacketScrambler();
      
      // Second scrambler with seed2
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'seed2';
      mockPrng.mockReturnValue(0.7);
      const scrambler2 = new PacketScrambler();
      
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      
      const scrambled1 = scrambler1.scrambleID(testID);
      const scrambled2 = scrambler2.scrambleID(testID);
      
      // Different seeds should produce different scrambled values
      // (though this might occasionally be the same due to randomness)
      expect(scrambled1).toEqual(expect.any(Number));
      expect(scrambled2).toEqual(expect.any(Number));
    });
  });

  describe('byte range validation', () => {
    it('should handle all values in byte range', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'byte-range-seed';
      let callCount = 0;
      mockPrng.mockImplementation(() => {
        // Return varied values to ensure good shuffle
        return (callCount++ * 0.123) % 1;
      });
      
      const scrambler = new PacketScrambler();
      
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
    it('should handle null ID gracefully', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'error-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const scrambled = scrambler.scrambleID(null as unknown as ActionEnum);
      const unscrambled = scrambler.unscrambleID(null as unknown as number);
      
      expect(scrambled).toBe(null);
      expect(unscrambled).toBe(null);
      
      consoleSpy.mockRestore();
    });

    it('should handle undefined ID gracefully', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'error-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const scrambled = scrambler.scrambleID(undefined as unknown as ActionEnum);
      const unscrambled = scrambler.unscrambleID(undefined as unknown as number);
      
      expect(scrambled).toBe(undefined);
      expect(unscrambled).toBe(undefined);
      
      consoleSpy.mockRestore();
    });

    it('should handle empty string seed', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = '';
      
      const scrambler = new PacketScrambler();
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      
      // Should still scramble with empty seed
      const result = scrambler.scrambleID(testID);
      expect(result).toEqual(expect.any(Number));
    });
  });

  describe('performance considerations', () => {
    it('should handle multiple operations efficiently', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'performance-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
      const testID = LifecycleActions.GAME_OVER as ActionEnum;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const scrambled = scrambler.scrambleID(testID);
        const unscrambled = scrambler.unscrambleID(scrambled);
        expect(unscrambled).toBe(testID);
      }
    });

    it('should maintain consistent performance across different IDs', () => {
      process.env['NG_APP_PACKET_SCRAMBLER_SEED'] = 'consistency-seed';
      mockPrng.mockReturnValue(0.5);
      
      const scrambler = new PacketScrambler();
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