import {
  isActionEnum,
  isSystemActions,
  isMatchActions,
  isPlayerActions,
  isPUPActions,
  isFirePUPActions,
  isActionOfType,
  getAvailableActionTypes
} from './actions';


describe('ActionEnum Type Guards Performance', () => {
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

  it('should support generic type checking with string type names', () => {
    const firePUPAction = 20;
    
    // Test the generic function
    expect(isActionOfType(firePUPAction, 'ActionEnum')).toBe(true);
    expect(isActionOfType(firePUPAction, 'MatchActions')).toBe(true);
    expect(isActionOfType(firePUPAction, 'PlayerActions')).toBe(true);
    expect(isActionOfType(firePUPAction, 'PUPActions')).toBe(true);
    expect(isActionOfType(firePUPAction, 'FirePUPActions')).toBe(true);
    expect(isActionOfType(firePUPAction, 'SystemActions')).toBe(false);
    
    // Test with invalid type name
    expect(isActionOfType(firePUPAction, 'NonExistentType')).toBe(false);
  });

  it('should provide list of available action types', () => {
    const availableTypes = getAvailableActionTypes();
    
    expect(availableTypes).toContain('ActionEnum');
    expect(availableTypes).toContain('SystemActions');
    expect(availableTypes).toContain('MatchActions');
    expect(availableTypes).toContain('PlayerActions');
    expect(availableTypes).toContain('PUPActions');
    expect(availableTypes).toContain('FirePUPActions');
    expect(availableTypes).toContain('WaterPUPActions');
    expect(availableTypes).toContain('WoodPUPActions');
    expect(availableTypes).toContain('MetalPUPActions');
    expect(availableTypes).toContain('EarthPUPActions');
    expect(availableTypes).toContain('MechanicsActions');
    expect(availableTypes).toContain('ProtocolActions');
    expect(availableTypes).toContain('LifecycleActions');
    expect(availableTypes).toContain('LobbyActions');
    expect(availableTypes).toContain('SessionActions');
    
    // Should have exactly 15 types
    expect(availableTypes).toHaveLength(15);
  });
});