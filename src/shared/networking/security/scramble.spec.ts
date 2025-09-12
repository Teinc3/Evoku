import { isJestEnvironment } from '../../types/test-utils/cross-framework';
import LifecycleActions from '../../types/enums/actions/match/lifecycle';
import { PacketScrambler } from './scramble';

import type ActionEnum from '../../types/enums/actions';


describe('PacketScrambler', () => {
  let scrambler: PacketScrambler;

  beforeEach(() => {
    // Cross-framework console mocking
    if (isJestEnvironment()) {
      const jestGlobal = globalThis as { jest?: { 
        spyOn: (obj: unknown, method: string) => { mockImplementation: (fn?: () => void) => void }
      } };
      jestGlobal.jest?.spyOn(console, 'warn').mockImplementation();
    }
    
    // Create scrambler instance - this will use the actual config
    scrambler = new PacketScrambler();
  });

  describe('constructor', () => {
    it('should create PacketScrambler instance', () => {
      expect(scrambler).toBeDefined();
      expect(scrambler).toBeInstanceOf(PacketScrambler);
    });
  });

  describe('scrambleID', () => {
    it('should handle valid action IDs without throwing', () => {
      const testID = LifecycleActions.GAME_INIT as ActionEnum;
      
      expect(() => {
        const result = scrambler.scrambleID(testID);
        expect(typeof result).toBe('number');
      }).not.toThrow();
    });

    it('should consistently scramble the same ID', () => {
      const testID = LifecycleActions.GAME_OVER as ActionEnum;
      
      const result1 = scrambler.scrambleID(testID);
      const result2 = scrambler.scrambleID(testID);
      
      expect(result1).toBe(result2);
    });

    it('should handle edge case IDs', () => {
      const edgeIDs = [-128, -1, 0, 1, 127] as ActionEnum[];
      
      edgeIDs.forEach(id => {
        expect(() => {
          const result = scrambler.scrambleID(id);
          expect(typeof result).toBe('number');
        }).not.toThrow();
      });
    });

    it('should handle out of range IDs gracefully', () => {
      const outOfRangeID = 999 as ActionEnum;
      
      expect(() => {
        const result = scrambler.scrambleID(outOfRangeID);
        expect(typeof result).toBe('number');
      }).not.toThrow();
    });
  });

  describe('unscrambleID', () => {
    it('should handle numeric IDs without throwing', () => {
      const testID = 42;
      
      expect(() => {
        const result = scrambler.unscrambleID(testID);
        expect(typeof result).toBe('number');
      }).not.toThrow();
    });

    it('should consistently unscramble the same ID', () => {
      const scrambledID = 25;
      
      const result1 = scrambler.unscrambleID(scrambledID);
      const result2 = scrambler.unscrambleID(scrambledID);
      
      expect(result1).toBe(result2);
    });

    it('should handle out of range scrambled values gracefully', () => {
      const invalidScrambledID = 999;
      
      expect(() => {
        const result = scrambler.unscrambleID(invalidScrambledID);
        expect(typeof result).toBe('number');
      }).not.toThrow();
    });
  });

  describe('round-trip scrambling', () => {
    it('should maintain identity through scramble and unscramble', () => {
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
  });

  describe('performance considerations', () => {
    it('should handle multiple operations efficiently', () => {
      const testID = LifecycleActions.GAME_OVER as ActionEnum;
      
      // Perform many operations - reduced count for cross-framework compatibility
      for (let i = 0; i < 100; i++) {
        const scrambled = scrambler.scrambleID(testID);
        const unscrambled = scrambler.unscrambleID(scrambled);
        expect(unscrambled).toBe(testID);
      }
    });

    it('should maintain consistent performance across different IDs', () => {
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
  });

  // Note: This test file is simplified for cross-framework compatibility
  // Complex Jest module mocking features like jest.doMock() and require() 
  // cannot be replicated in Jasmine. The tests focus on functionality
  // that can be verified in both environments using the actual implementation.
});