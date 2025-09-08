import { 
  isActionEnum, 
  isSystemActions, 
  isMatchActions,
  isLobbyActions,
  isSessionActions,
  isPlayerActions,
  isMechanicsActions,
  isPUPActions,
  isProtocolActions,
  isLifecycleActions,
  isFirePUPActions,
  isWaterPUPActions,
  isWoodPUPActions,
  isMetalPUPActions,
  isEarthPUPActions
} from './actions';

// Import all enum values for testing
import LobbyActions from '../../enums/actions/system/lobby';
import SessionActions from '../../enums/actions/system/session';
import ProtocolActions from '../../enums/actions/match/protocol';
import LifecycleActions from '../../enums/actions/match/lifecycle';
import MechanicsActions from '../../enums/actions/match/player/mechanics';
import FirePUPActions from '../../enums/actions/match/player/powerups/fire';
import WaterPUPActions from '../../enums/actions/match/player/powerups/water';
import WoodPUPActions from '../../enums/actions/match/player/powerups/wood';
import MetalPUPActions from '../../enums/actions/match/player/powerups/metal';
import EarthPUPActions from '../../enums/actions/match/player/powerups/earth';

describe('ActionEnum Type Guards Performance & Correctness', () => {
  // Collect all valid action values (numeric only)
  const allValidActions = [
    ...Object.values(LobbyActions).filter(v => typeof v === 'number'),
    ...Object.values(SessionActions).filter(v => typeof v === 'number'),
    ...Object.values(ProtocolActions).filter(v => typeof v === 'number'),
    ...Object.values(LifecycleActions).filter(v => typeof v === 'number'),
    ...Object.values(MechanicsActions).filter(v => typeof v === 'number'),
    ...Object.values(FirePUPActions).filter(v => typeof v === 'number'),
    ...Object.values(WaterPUPActions).filter(v => typeof v === 'number'),
    ...Object.values(WoodPUPActions).filter(v => typeof v === 'number'),
    ...Object.values(MetalPUPActions).filter(v => typeof v === 'number'),
    ...Object.values(EarthPUPActions).filter(v => typeof v === 'number'),
  ] as number[];

  // Test values that should NOT be valid actions
  const invalidActions = [-100, -99, 0, 1, 5, 14, 15, 19, 24, 25, 29, 34, 35, 39, 44, 45, 49, 54, 55, 100];

  describe('Correctness Tests', () => {
    it('should correctly identify all valid actions', () => {
      for (const action of allValidActions) {
        expect(isActionEnum(action)).toBe(true);
      }
    });

    it('should correctly reject invalid actions', () => {
      for (const action of invalidActions) {
        expect(isActionEnum(action)).toBe(false);
      }
    });

    it('should correctly categorize lobby actions', () => {
      const lobbyValues = Object.values(LobbyActions).filter(v => typeof v === 'number') as number[];
      for (const action of lobbyValues) {
        expect(isLobbyActions(action)).toBe(true);
        expect(isSystemActions(action)).toBe(true);
        expect(isActionEnum(action)).toBe(true);
      }
    });

    it('should correctly categorize session actions', () => {
      const sessionValues = Object.values(SessionActions).filter(v => typeof v === 'number') as number[];
      for (const action of sessionValues) {
        expect(isSessionActions(action)).toBe(true);
        expect(isSystemActions(action)).toBe(true);
        expect(isActionEnum(action)).toBe(true);
      }
    });

    it('should correctly categorize protocol actions', () => {
      const protocolValues = Object.values(ProtocolActions).filter(v => typeof v === 'number') as number[];
      for (const action of protocolValues) {
        expect(isProtocolActions(action)).toBe(true);
        expect(isMatchActions(action)).toBe(true);
        expect(isActionEnum(action)).toBe(true);
      }
    });

    it('should correctly categorize lifecycle actions', () => {
      const lifecycleValues = Object.values(LifecycleActions).filter(v => typeof v === 'number') as number[];
      for (const action of lifecycleValues) {
        expect(isLifecycleActions(action)).toBe(true);
        expect(isMatchActions(action)).toBe(true);
        expect(isActionEnum(action)).toBe(true);
      }
    });

    it('should correctly categorize mechanics actions', () => {
      const mechanicsValues = Object.values(MechanicsActions).filter(v => typeof v === 'number') as number[];
      for (const action of mechanicsValues) {
        expect(isMechanicsActions(action)).toBe(true);
        expect(isPlayerActions(action)).toBe(true);
        expect(isMatchActions(action)).toBe(true);
        expect(isActionEnum(action)).toBe(true);
      }
    });

    it('should correctly categorize powerup actions', () => {
      const pupActionSets = [
        { values: Object.values(FirePUPActions).filter(v => typeof v === 'number') as number[], guard: isFirePUPActions },
        { values: Object.values(WaterPUPActions).filter(v => typeof v === 'number') as number[], guard: isWaterPUPActions },
        { values: Object.values(WoodPUPActions).filter(v => typeof v === 'number') as number[], guard: isWoodPUPActions },
        { values: Object.values(MetalPUPActions).filter(v => typeof v === 'number') as number[], guard: isMetalPUPActions },
        { values: Object.values(EarthPUPActions).filter(v => typeof v === 'number') as number[], guard: isEarthPUPActions },
      ];

      for (const { values, guard } of pupActionSets) {
        for (const action of values) {
          expect(guard(action)).toBe(true);
          expect(isPUPActions(action)).toBe(true);
          expect(isPlayerActions(action)).toBe(true);
          expect(isMatchActions(action)).toBe(true);
          expect(isActionEnum(action)).toBe(true);
        }
      }
    });
  });

  describe('Performance Tests', () => {
    const ITERATIONS = 100000;

    it('should perform type guard checks efficiently', () => {
      const testActions = [...allValidActions, ...invalidActions];
      
      const start = performance.now();
      
      for (let i = 0; i < ITERATIONS; i++) {
        const action = testActions[i % testActions.length] as number;
        isActionEnum(action);
      }
      
      const end = performance.now();
      const timePerCheck = (end - start) / ITERATIONS;
      
      console.log(`Performance: ${timePerCheck.toFixed(6)}ms per type guard check`);
      console.log(`Total time for ${ITERATIONS} checks: ${(end - start).toFixed(2)}ms`);
      
      // Expect reasonable performance (less than 0.01ms per check)
      expect(timePerCheck).toBeLessThan(0.01);
    });

    it('should handle batch checking efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < ITERATIONS; i++) {
        for (const action of allValidActions) {
          isActionEnum(action);
        }
      }
      
      const end = performance.now();
      console.log(`Batch performance: ${(end - start).toFixed(2)}ms for ${ITERATIONS * allValidActions.length} checks`);
    });
  });
});