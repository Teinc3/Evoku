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
  isActionOfType,
  getAvailableActionTypes
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

  describe('Generic Type Checking (isActionOfType)', () => {
    it('should work with all valid type names', () => {
      const firePUPAction = 20; // USE_INFERNO from FirePUPActions
      const lobbyAction = -50; // JOIN_QUEUE from LobbyActions
      
      // Test Fire PUP action with all type names
      expect(isActionOfType(firePUPAction, 'ActionEnum')).toBe(true);
      expect(isActionOfType(firePUPAction, 'MatchActions')).toBe(true);
      expect(isActionOfType(firePUPAction, 'PlayerActions')).toBe(true);
      expect(isActionOfType(firePUPAction, 'PUPActions')).toBe(true);
      expect(isActionOfType(firePUPAction, 'FirePUPActions')).toBe(true);
      expect(isActionOfType(firePUPAction, 'SystemActions')).toBe(false);
      
      // Test Lobby action with all type names
      expect(isActionOfType(lobbyAction, 'ActionEnum')).toBe(true);
      expect(isActionOfType(lobbyAction, 'SystemActions')).toBe(true);
      expect(isActionOfType(lobbyAction, 'LobbyActions')).toBe(true);
      expect(isActionOfType(lobbyAction, 'MatchActions')).toBe(false);
      expect(isActionOfType(lobbyAction, 'FirePUPActions')).toBe(false);
    });

    it('should handle invalid type names gracefully', () => {
      const firePUPAction = 20;
      
      expect(isActionOfType(firePUPAction, 'NonExistentType')).toBe(false);
      expect(isActionOfType(firePUPAction, '')).toBe(false);
      expect(isActionOfType(firePUPAction, 'actionenum')).toBe(false); // Case sensitive
    });

    it('should handle invalid action numbers', () => {
      expect(isActionOfType(999, 'ActionEnum')).toBe(false);
      expect(isActionOfType(-999, 'SystemActions')).toBe(false);
      expect(isActionOfType(0.5, 'FirePUPActions')).toBe(false);
    });
  });

  describe('Available Action Types (getAvailableActionTypes)', () => {
    it('should return all expected type names', () => {
      const availableTypes = getAvailableActionTypes();
      
      const expectedTypes = [
        'ActionEnum',
        'SystemActions',
        'LobbyActions',
        'SessionActions',
        'MatchActions',
        'PlayerActions',
        'MechanicsActions',
        'PUPActions',
        'FirePUPActions',
        'WaterPUPActions',
        'WoodPUPActions',
        'MetalPUPActions',
        'EarthPUPActions',
        'ProtocolActions',
        'LifecycleActions'
      ];
      
      expect(availableTypes).toHaveLength(expectedTypes.length);
      expectedTypes.forEach(type => {
        expect(availableTypes).toContain(type);
      });
    });

    it('should return a new array each time', () => {
      const types1 = getAvailableActionTypes();
      const types2 = getAvailableActionTypes();
      
      expect(types1).toEqual(types2);
      expect(types1).not.toBe(types2); // Different references
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
      expect(isActionEnum(null as any)).toBe(false);
      expect(isActionEnum(undefined as any)).toBe(false);
      expect(isActionEnum('' as any)).toBe(false);
      expect(isActionEnum('20' as any)).toBe(false);
      expect(isActionEnum([] as any)).toBe(false);
      expect(isActionEnum({} as any)).toBe(false);
    });

    it('should maintain consistency across all type guards', () => {
      const testValues = [999, -999, 0, 0.5, null, undefined, NaN];
      
      testValues.forEach(value => {
        // If it's not a valid ActionEnum, no other type guard should return true
        if (!isActionEnum(value as any)) {
          expect(isSystemActions(value as any)).toBe(false);
          expect(isMatchActions(value as any)).toBe(false);
          expect(isPlayerActions(value as any)).toBe(false);
          expect(isPUPActions(value as any)).toBe(false);
          expect(isFirePUPActions(value as any)).toBe(false);
          expect(isLobbyActions(value as any)).toBe(false);
          expect(isSessionActions(value as any)).toBe(false);
          expect(isMechanicsActions(value as any)).toBe(false);
          expect(isWaterPUPActions(value as any)).toBe(false);
          expect(isWoodPUPActions(value as any)).toBe(false);
          expect(isMetalPUPActions(value as any)).toBe(false);
          expect(isEarthPUPActions(value as any)).toBe(false);
          expect(isProtocolActions(value as any)).toBe(false);
          expect(isLifecycleActions(value as any)).toBe(false);
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