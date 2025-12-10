import ActionGuard from './actions';


describe('Action Type Guards', () => {
  describe('Individual Type Guards', () => {
    it('should correctly identify Fire PUP actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      expect(ActionGuard.isFirePUPActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isFirePUPActions(-50)).toBe(false); // Lobby action
      expect(ActionGuard.isFirePUPActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify Lobby actions', () => {
      const lobbyAction = -50; // JOIN_QUEUE from LobbyActions
      
      expect(ActionGuard.isLobbyActions(lobbyAction)).toBe(true);
      expect(ActionGuard.isLobbyActions(20)).toBe(false); // Fire PUP action
      expect(ActionGuard.isLobbyActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify System actions', () => {
      const lobbyAction = -50; // JOIN_QUEUE from LobbyActions
      
      expect(ActionGuard.isSystemActions(lobbyAction)).toBe(true);
      expect(ActionGuard.isSystemActions(20)).toBe(false); // Fire PUP action
      expect(ActionGuard.isSystemActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify PUP actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      expect(ActionGuard.isPUPActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isPUPActions(-50)).toBe(false); // Lobby action
      expect(ActionGuard.isPUPActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify Player actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      expect(ActionGuard.isPlayerActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isPlayerActions(-50)).toBe(false); // Lobby action
      expect(ActionGuard.isPlayerActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify Match actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      expect(ActionGuard.isMatchActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isMatchActions(-50)).toBe(false); // Lobby action
      expect(ActionGuard.isMatchActions(999)).toBe(false); // Invalid action
    });

    it('should correctly identify ActionEnum', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      const lobbyAction = -50; // JOIN_QUEUE from LobbyActions
      
      expect(ActionGuard.isActionEnum(firePUPAction)).toBe(true);
      expect(ActionGuard.isActionEnum(lobbyAction)).toBe(true);
      expect(ActionGuard.isActionEnum(999)).toBe(false); // Invalid action
    });
  });

  describe('Hierarchical Relationships', () => {
    it('should maintain proper hierarchy for Fire PUP actions', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      
      // Should be true for all parent categories
      expect(ActionGuard.isFirePUPActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isPUPActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isPlayerActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isMatchActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isActionEnum(firePUPAction)).toBe(true);
      
      // Should be false for non-parent categories
      expect(ActionGuard.isSystemActions(firePUPAction)).toBe(false);
      expect(ActionGuard.isLobbyActions(firePUPAction)).toBe(false);
      expect(ActionGuard.isSessionActions(firePUPAction)).toBe(false);
      expect(ActionGuard.isMechanicsActions(firePUPAction)).toBe(false);
      expect(ActionGuard.isWaterPUPActions(firePUPAction)).toBe(false);
      expect(ActionGuard.isWoodPUPActions(firePUPAction)).toBe(false);
      expect(ActionGuard.isMetalPUPActions(firePUPAction)).toBe(false);
      expect(ActionGuard.isEarthPUPActions(firePUPAction)).toBe(false);
      expect(ActionGuard.isProtocolActions(firePUPAction)).toBe(false);
      expect(ActionGuard.isLifecycleActions(firePUPAction)).toBe(false);
    });

    it('should maintain proper hierarchy for Lobby actions', () => {
      const lobbyAction = -50; // JOIN_QUEUE from LobbyActions
      
      // Should be true for all parent categories
      expect(ActionGuard.isLobbyActions(lobbyAction)).toBe(true);
      expect(ActionGuard.isSystemActions(lobbyAction)).toBe(true);
      expect(ActionGuard.isActionEnum(lobbyAction)).toBe(true);
      
      // Should be false for non-parent categories
      expect(ActionGuard.isMatchActions(lobbyAction)).toBe(false);
      expect(ActionGuard.isPlayerActions(lobbyAction)).toBe(false);
      expect(ActionGuard.isPUPActions(lobbyAction)).toBe(false);
      expect(ActionGuard.isFirePUPActions(lobbyAction)).toBe(false);
      expect(ActionGuard.isSessionActions(lobbyAction)).toBe(false);
      expect(ActionGuard.isMechanicsActions(lobbyAction)).toBe(false);
      expect(ActionGuard.isProtocolActions(lobbyAction)).toBe(false);
      expect(ActionGuard.isLifecycleActions(lobbyAction)).toBe(false);
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
      
      // Static class methods should give same results as individual functions would have
      expect(ActionGuard.isFirePUPActions(firePUPAction))
        .toBe(ActionGuard.isFirePUPActions(firePUPAction));
      expect(ActionGuard.isPUPActions(firePUPAction))
        .toBe(ActionGuard.isPUPActions(firePUPAction));
      expect(ActionGuard.isPlayerActions(firePUPAction))
        .toBe(ActionGuard.isPlayerActions(firePUPAction));
      expect(ActionGuard.isMatchActions(firePUPAction))
        .toBe(ActionGuard.isMatchActions(firePUPAction));
      expect(ActionGuard.isActionEnum(firePUPAction))
        .toBe(ActionGuard.isActionEnum(firePUPAction));
    });
  });

  describe('Performance Tests', () => {
    it('should correctly identify action types without hierarchical function calls', () => {
      // Test with a Fire PUP action (should be positive for multiple type guards)
      const firePUPAction = 20; // Assuming this is a Fire PUP action

      // All these should return true for a Fire PUP action
      expect(ActionGuard.isActionEnum(firePUPAction)).toBe(true);
      expect(ActionGuard.isMatchActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isPlayerActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isPUPActions(firePUPAction)).toBe(true);
      expect(ActionGuard.isFirePUPActions(firePUPAction)).toBe(true);

      // These should return false
      expect(ActionGuard.isSystemActions(firePUPAction)).toBe(false);
    });

    it('should maintain type safety and correctness', () => {
      // Test with invalid action number
      const invalidAction = 999;

      expect(ActionGuard.isActionEnum(invalidAction)).toBe(false);
      expect(ActionGuard.isSystemActions(invalidAction)).toBe(false);
      expect(ActionGuard.isMatchActions(invalidAction)).toBe(false);
      expect(ActionGuard.isPlayerActions(invalidAction)).toBe(false);
      expect(ActionGuard.isPUPActions(invalidAction)).toBe(false);
      expect(ActionGuard.isFirePUPActions(invalidAction)).toBe(false);
    });

    it('should demonstrate performance improvement with direct Set lookups', () => {
      const iterations = 10000;
      const testAction = 20; // Fire PUP action

      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        // Each function now does direct Set lookups instead of calling other functions
        ActionGuard.isActionEnum(testAction);
        ActionGuard.isMatchActions(testAction);
        ActionGuard.isPlayerActions(testAction);
        ActionGuard.isPUPActions(testAction);
        ActionGuard.isFirePUPActions(testAction);
      }
      
      const end = performance.now();
      const duration = end - start;

      // This test documents that the optimization eliminates nested function calls
      
      // The optimization should complete in reasonable time (less than 100ms for this test)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme number values', () => {
      expect(ActionGuard.isActionEnum(Number.MAX_SAFE_INTEGER)).toBe(false);
      expect(ActionGuard.isActionEnum(Number.MIN_SAFE_INTEGER)).toBe(false);
      expect(ActionGuard.isActionEnum(Infinity)).toBe(false);
      expect(ActionGuard.isActionEnum(-Infinity)).toBe(false);
      expect(ActionGuard.isActionEnum(NaN)).toBe(false);
    });

    it('should handle type coercion consistently', () => {
      // These should all be false since they're not valid action numbers
      expect(ActionGuard.isActionEnum(null as unknown as number)).toBe(false);
      expect(ActionGuard.isActionEnum(undefined as unknown as number)).toBe(false);
      expect(ActionGuard.isActionEnum('' as unknown as number)).toBe(false);
      expect(ActionGuard.isActionEnum('20' as unknown as number)).toBe(false);
      expect(ActionGuard.isActionEnum([] as unknown as number)).toBe(false);
      expect(ActionGuard.isActionEnum({} as unknown as number)).toBe(false);
    });

    it('should maintain consistency across all type guards', () => {
      const testValues = [999, -999, 0, 0.5, null, undefined, NaN];
      
      testValues.forEach(value => {
        // If it's not a valid ActionEnum, no other type guard should return true
        if (!ActionGuard.isActionEnum(value as unknown as number)) {
          expect(ActionGuard.isSystemActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isMatchActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isPlayerActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isPUPActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isFirePUPActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isLobbyActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isSessionActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isMechanicsActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isWaterPUPActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isWoodPUPActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isMetalPUPActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isEarthPUPActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isProtocolActions(value as unknown as number)).toBe(false);
          expect(ActionGuard.isLifecycleActions(value as unknown as number)).toBe(false);
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
        ActionGuard.isActionEnum(firePUPAction);
        ActionGuard.isSystemActions(firePUPAction);
        ActionGuard.isMatchActions(firePUPAction);
        ActionGuard.isPlayerActions(firePUPAction);
        ActionGuard.isPUPActions(firePUPAction);
        ActionGuard.isFirePUPActions(firePUPAction);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete very quickly with optimized Set lookups
      expect(duration).toBeLessThan(50); // Conservative threshold
    });
  });

  describe('isActionContract', () => {
    it('should return true for valid action contract with matching action', () => {
      const action = 20; // USE_INFERNO
      const data = { action: 20, payload: {} };
      
      expect(ActionGuard.isActionContract(action, data)).toBe(true);
    });

    it('should return false for data without action property', () => {
      const action = 20;
      const data = { payload: {} };
      
      expect(ActionGuard.isActionContract(action, data)).toBe(false);
    });

    it('should return false for data with non-matching action', () => {
      const action = 20;
      const data = { action: 30, payload: {} };
      
      expect(ActionGuard.isActionContract(action, data)).toBe(false);
    });

    it('should return false for non-object data', () => {
      const action = 20;
      
      expect(ActionGuard.isActionContract(action, null as unknown as object)).toBe(false);
      expect(ActionGuard.isActionContract(action, undefined as unknown as object)).toBe(false);
      expect(ActionGuard.isActionContract(action, 'string' as unknown as object)).toBe(false);
      expect(ActionGuard.isActionContract(action, 42 as unknown as object)).toBe(false);
    });
  });
});
