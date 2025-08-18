
import TimeValidationReason from '../../types/enums/timevalidation';
import ActionValidator from './ActionValidator';

import type PlayerActions from '@shared/types/enums/actions/match/player';
import type SyncProfile from '../../models/networking/SyncProfile';


// Mock types
const mockSyncProfile = {
  hasInitialSync: () => true,
  calculateCumulativeDrift: () => 0,
  clientToServerTime: (clientTime: number) => clientTime + 100,
} as unknown as SyncProfile;

describe('ActionValidator', () => {
  let validator: ActionValidator;
  const playerID = 1;

  beforeEach(() => {
    validator = new ActionValidator();
  });

  it('should return NO_SYNC_PROFILE if syncProfile is missing', () => {
    const result = validator.assessTiming(playerID, 1000, 1000, undefined, 1000);
    expect(result).toBe(TimeValidationReason.NO_SYNC_PROFILE);
  });

  it('should allow first valid action after sync', () => {
    const result
      = validator.assessTiming(playerID, 1000, 1000, mockSyncProfile as SyncProfile, 1000);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('should return MONOTONIC_VIOLATION for non-monotonic client time', () => {
    validator.updateLastActionTime(playerID, 0 as PlayerActions, 1100, 1200);
    const result = validator.assessTiming(playerID, 1099, 1199, mockSyncProfile, 1200);
    expect(result).toBe(TimeValidationReason.MONOTONIC_VIOLATION);
  });

  it('should return RATE_LIMIT for rate limiting', () => {
    for (let i = 0; i < 5; i++) {
      validator.updateLastActionTime(playerID, 0 as PlayerActions, 1100 + i, 1200 + i);
    }
    const result = validator.assessTiming(playerID, 1200, 1205, mockSyncProfile, 1205);
    expect(result).toBe(TimeValidationReason.RATE_LIMIT);
  });

  it('should maintain action history limit', () => {
    for (let i = 0; i < ActionValidator.MAX_ACTION_HISTORY_COUNT + 5; i++) {
      validator.updateLastActionTime(playerID, 0 as PlayerActions, 1000 + i, 2000 + i);
    }
    // Should not throw and should keep only the most recent actions
    expect(() => validator.updateLastActionTime(playerID, 0 as PlayerActions, 3000, 4000))
      .not.toThrow();
  });

  it('should use last action server time as minimum in estimateServerTime', () => {
    validator.updateLastActionTime(playerID, 0 as PlayerActions, 1100, 1200);
    const estimated = validator.estimateServerTime(playerID, 1050, mockSyncProfile, 1000);
    expect(estimated).toBeGreaterThanOrEqual(1200);
  });
});
