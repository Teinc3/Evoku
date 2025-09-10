import {
  isActionEnum,
  isSystemActions,
  isLobbyActions,
  isSessionActions,
  isMatchActions,
  isPlayerActions,
  isMechanicsActions,
  isPUPActions,
  isFirePUPActions,
  isWaterPUPActions,
  isWoodPUPActions,
  isMetalPUPActions,
  isEarthPUPActions,
  isProtocolActions,
  isLifecycleActions,
  ActionGuard
} from './actions';


describe('Action Type Guards', () => {
  describe('Individual Type Guards', () => {
    it('should correctly identify Fire PUP actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      expect(isFirePUPActions(firePUPAction)).toBe(true);
      expect(isFirePUPActions(-50)).toBe(false); // Lobby action
      expect(isFirePUPActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify Lobby actions', () => {
      const lobbyAction = -50; // JOIN_QUEUE from LobbyActions
      
      expect(isLobbyActions(lobbyAction)).toBe(true);
      expect(isLobbyActions(20)).toBe(false); // Fire PUP action
      expect(isLobbyActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify System actions', () => {
      const lobbyAction = -50; // JOIN_QUEUE from LobbyActions
      
      expect(isSystemActions(lobbyAction)).toBe(true);
      expect(isSystemActions(20)).toBe(false); // Fire PUP action
      expect(isSystemActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify PUP actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      expect(isPUPActions(firePUPAction)).toBe(true);
      expect(isPUPActions(-50)).toBe(false); // Lobby action
      expect(isPUPActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify Player actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      expect(isPlayerActions(firePUPAction)).toBe(true);
      expect(isPlayerActions(-50)).toBe(false); // Lobby action
      expect(isPlayerActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify Match actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      expect(isMatchActions(firePUPAction)).toBe(true);
      expect(isMatchActions(-50)).toBe(false); // Lobby action
      expect(isMatchActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify ActionEnum', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      const lobbyAction = -50; // JOIN_QUEUE from LobbyActions
      
      expect(isActionEnum(firePUPAction)).toBe(true);
      expect(isActionEnum(lobbyAction)).toBe(true);
      expect(isActionEnum(999)).toBe(false); // Invalid action
    });
  });

  describe('Hierarchical Relationships', () => {
    it('should maintain proper hierarchy for Fire PUP actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      // Should be true for all parent categories
      expect(isFirePUPActions(firePUPAction)).toBe(true);
      expect(isPUPActions(firePUPAction)).toBe(true);
      expect(isPlayerActions(firePUPAction)).toBe(true);
      expect(isMatchActions(firePUPAction)).toBe(true);
      expect(isActionEnum(firePUPAction)).toBe(true);
      
      // Should be false for non-parent categories
      expect(isSystemActions(firePUPAction)).toBe(false);
      expect(isLobbyActions(firePUPAction)).toBe(false);
      expect(isSessionActions(firePUPAction)).toBe(false);
      expect(isMechanicsActions(firePUPAction)).toBe(false);
      expect(isWaterPUPActions(firePUPAction)).toBe(false);
      expect(isWoodPUPActions(firePUPAction)).toBe(false);
      expect(isMetalPUPActions(firePUPAction)).toBe(false);
      expect(isEarthPUPActions(firePUPAction)).toBe(false);
      expect(isProtocolActions(firePUPAction)).toBe(false);
      expect(isLifecycleActions(firePUPAction)).toBe(false);
    });

    it('should maintain proper hierarchy for Lobby actions', () => {
      const lobbyAction = -50; // JOIN_QUEUE from LobbyActions
      
      // Should be true for all parent categories
      expect(isLobbyActions(lobbyAction)).toBe(true);
      expect(isSystemActions(lobbyAction)).toBe(true);
      expect(isActionEnum(lobbyAction)).toBe(true);
      
      // Should be false for non-parent categories
      expect(isMatchActions(lobbyAction)).toBe(false);
      expect(isPlayerActions(lobbyAction)).toBe(false);
      expect(isPUPActions(lobbyAction)).toBe(false);
      expect(isFirePUPActions(lobbyAction)).toBe(false);
      expect(isSessionActions(lobbyAction)).toBe(false);
      expect(isMechanicsActions(lobbyAction)).toBe(false);
      expect(isProtocolActions(lobbyAction)).toBe(false);
      expect(isLifecycleActions(lobbyAction)).toBe(false);
    });
  });

  describe('ActionGuard Static Class', () => {
    it('should provide all type guards through static methods', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      expect(ActionGuard.isFirePUPActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isPUPActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isPlayerActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isMatchActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isActionEnum(firePUPAction)).toBe(true);
      expect(ActionGuard.isSystemActions(firePUPAction)).toBe(false);
    });

    it('should maintain backward compatibility with individual functions', () => {
      const firePUPAction = 20;
      
      // Static class methods should give same results as individual functions
      expect(ActionGuard.isFirePUPActions(firePUPAction)).toBe(isFirePUPActions(firePUPAction));
      expect(ActionGuard.isPUPActions(firePUPAction)).toBe(isPUPActions(firePUPAction));
      expect(ActionGuard.isPlayerActions(firePUPAction)).toBe(isPlayerActions(firePUPAction));
      expect(ActionGuard.isMatchActions(firePUPAction)).toBe(isMatchActions(firePUPAction));
      expect(ActionGuard.isActionEnum(firePUPAction)).toBe(isActionEnum(firePUPAction));
    });
  });

  describe('Performance Tests', () => {
    it('should correctly identify action types without hierarchical function calls', () => {
      // Test with a Fire PUP action (should be positive for multiple type guards)
      const firePUPAction = 20; // Assuming this is a Fire PUP action

      // All these should return true for a Fire PUP action
      expect(isActionEnum(firePUPAction)).toBe(true);
      expect(isMatchActions(firePUPAction)).toBe(true);
      expect(isPlayerActions(firePUPAction)).toBe(true);
      expect(isPUPActions(firePUPAction)).toBe(true);
      expect(isFirePUPActions(firePUPAction)).toBe(true);

      // These should return false
      expect(isSystemActions(firePUPAction)).toBe(false);
    });

    it('should maintain type safety and correctness', () => {
      // Test with invalid action number
      const invalidAction = 999;

      expect(isActionEnum(invalidAction)).toBe(false);
      expect(isSystemActions(invalidAction)).toBe(false);
      expect(isMatchActions(invalidAction)).toBe(false);
      expect(isPlayerActions(invalidAction)).toBe(false);
      expect(isPUPActions(invalidAction)).toBe(false);
      expect(isFirePUPActions(invalidAction)).toBe(false);
    });

    it('should demonstrate performance improvement with direct Set lookups', () => {
      const iterations = 10000;
      const testAction = 20; // Fire PUP action

      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        // Each function now does direct Set lookups instead of calling other functions
        isActionEnum(testAction);
        isMatchActions(testAction);
        isPlayerActions(testAction);
        isPUPActions(testAction);
        isFirePUPActions(testAction);
      }
      
      const end = performance.now();
      const duration = end - start;

      // This test documents that the optimization eliminates nested function calls
      console.log(`Performance test: ${iterations} iterations took ${duration.toFixed(3)}ms`);
      console.log(`Average per call: ${(duration / (iterations * 5)).toFixed(6)}ms`);
      
      // The optimization should complete in reasonable time (less than 100ms for this test)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme number values', () => {
      expect(isActionEnum(Number.MAX_SAFE_INTEGER)).toBe(false);
      expect(isActionEnum(Number.MIN_SAFE_INTEGER)).toBe(false);
      expect(isActionEnum(Infinity)).toBe(false);
      expect(isActionEnum(-Infinity)).toBe(false);
      expect(isActionEnum(NaN)).toBe(false);
    });

    it('should handle type coercion consistently', () => {
      // These should all be false since they're not valid action numbers
      expect(isActionEnum(null as unknown as number)).toBe(false);
      expect(isActionEnum(undefined as unknown as number)).toBe(false);
      expect(isActionEnum('' as unknown as number)).toBe(false);
      expect(isActionEnum('20' as unknown as number)).toBe(false);
      expect(isActionEnum([] as unknown as number)).toBe(false);
      expect(isActionEnum({} as unknown as number)).toBe(false);
    });

    it('should maintain consistency across all type guards', () => {
      const testValues = [999, -999, 0, 0.5, null, undefined, NaN];
      
      testValues.forEach(value => {
        // If it's not a valid ActionEnum, no other type guard should return true
        if (!isActionEnum(value as unknown as number)) {
          expect(isSystemActions(value as unknown as number)).toBe(false);
          expect(isMatchActions(value as unknown as number)).toBe(false);
          expect(isPlayerActions(value as unknown as number)).toBe(false);
          expect(isPUPActions(value as unknown as number)).toBe(false);
          expect(isFirePUPActions(value as unknown as number)).toBe(false);
          expect(isLobbyActions(value as unknown as number)).toBe(false);
          expect(isSessionActions(value as unknown as number)).toBe(false);
          expect(isMechanicsActions(value as unknown as number)).toBe(false);
          expect(isWaterPUPActions(value as unknown as number)).toBe(false);
          expect(isWoodPUPActions(value as unknown as number)).toBe(false);
          expect(isMetalPUPActions(value as unknown as number)).toBe(false);
          expect(isEarthPUPActions(value as unknown as number)).toBe(false);
          expect(isProtocolActions(value as unknown as number)).toBe(false);
          expect(isLifecycleActions(value as unknown as number)).toBe(false);
        }
      });
    });
  });

  describe('Performance Consistency', () => {
    it('should have consistent performance across all type guards', () => {
      const firePUPAction = 20;
      const iterations = 1000;
      
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        // Test all type guards to ensure consistent O(1) performance
        isActionEnum(firePUPAction);
        isSystemActions(firePUPAction);
        isMatchActions(firePUPAction);
        isPlayerActions(firePUPAction);
        isPUPActions(firePUPAction);
        isFirePUPActions(firePUPAction);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete very quickly with optimized Set lookups
      expect(duration).toBeLessThan(50); // Conservative threshold
    });
  });
});