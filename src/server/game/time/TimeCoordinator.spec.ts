import { MechanicsActions } from '@shared/types/enums/actions';
import TimeCoordinator from '.';

import type { RoomModel } from '../../models/networking';


// Mock RoomModel for testing
const mockSession = {
  forward: jest.fn()
};

const mockRoom = {
  participants: new Map([['session1', mockSession]]),
  getPlayerID: jest.fn(session => {
    if (session === mockSession) {
      return 1;
    }
    return null;
  }),
  getSessionIDFromPlayerID: jest.fn(playerID => {
    if (playerID === 1) {
      return 'session1';
    }
    return undefined;
  })
} as unknown as RoomModel;

describe('TimeCoordinator Unit Tests', () => {
  let timeService: TimeCoordinator;

  beforeEach(() => {
    jest.useFakeTimers();
    timeService = new TimeCoordinator(mockRoom);
    jest.clearAllMocks();
    mockSession.forward.mockClear();
  });

  afterEach(() => {
    timeService.close();
    jest.clearAllTimers();
    jest.useRealTimers();
    mockSession.forward.mockClear();
  });

  describe('Player Session Management', () => {
    it('should add a player session successfully', () => {
      timeService.start();
      timeService.addPlayerSession(1);
      
      // Should not throw and should have default ping of 0
      expect(timeService.getPlayerPing(1)).toBe(0);
    });

    it('should handle duplicate player session addition gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      timeService.start();
      timeService.addPlayerSession(1);
      timeService.addPlayerSession(1); // Duplicate
      
      expect(consoleSpy).toHaveBeenCalledWith('Player session 1 already exists in time service.');
      consoleSpy.mockRestore();
    });

    it('should remove a player session successfully', () => {
      timeService.start();
      timeService.addPlayerSession(1);
      timeService.removePlayerSession(1);
      
      expect(timeService.getPlayerPing(1)).toBe(0); // Should fall back to 0
    });
  });

  describe('Service Lifecycle', () => {
    it('should initialize properly on start', () => {
      expect(() => timeService.start()).not.toThrow();
    });

    it('should handle start before adding sessions', () => {
      timeService.start();
      expect(() => timeService.addPlayerSession(1)).not.toThrow();
    });

    it('should handle adding sessions before start', () => {
      timeService.addPlayerSession(1);
      expect(() => timeService.start()).not.toThrow();
    });
  });

  describe('Basic Time Operations', () => {
    beforeEach(() => {
      timeService.start();
      timeService.addPlayerSession(1);
    });

    it('should return current server time for updateLastActionTime', () => {
      const serverTime = timeService.updateLastActionTime(1, MechanicsActions.SET_CELL, 1100);
      
      expect(typeof serverTime).toBe('number');
      expect(serverTime).toBeGreaterThanOrEqual(0);
    });

    it('should maintain action history limit without throwing', () => {
      // Add more actions than the limit
      for (let i = 0; i < TimeCoordinator.MAX_ACTION_HISTORY_COUNT + 5; i++) {
        timeService.updateLastActionTime(1, MechanicsActions.SET_CELL, 1000 + i);
      }
      
      // Should still work without issues (internal history trimming)
      const result = timeService.updateLastActionTime(1, MechanicsActions.SET_CELL, 2000);
      expect(typeof result).toBe('number');
    });

    it('should provide estimateServerTime for any player', () => {
      const estimated = timeService.estimateServerTime(1, 1000);
      expect(typeof estimated).toBe('number');
      expect(estimated).toBeGreaterThanOrEqual(0);
    });

    it('should provide ping information', () => {
      const ping = timeService.getPlayerPing(1);
      expect(typeof ping).toBe('number');
      expect(ping).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on close', () => {
      timeService.start();
      timeService.addPlayerSession(1);
      
      timeService.close();
      
      // Should not crash on subsequent operations
      expect(timeService.getPlayerPing(1)).toBe(0);
    });

    it('should handle close without start gracefully', () => {
      expect(() => timeService.close()).not.toThrow();
    });

    it('should handle multiple close calls gracefully', () => {
      timeService.start();
      timeService.close();
      expect(() => timeService.close()).not.toThrow();
    });
  });

  describe('Constants Export', () => {
    it('should export relevant constants for testing', () => {
      expect(TimeCoordinator.MAX_ACTION_HISTORY_COUNT).toBeDefined();
      expect(TimeCoordinator.PING_INTERVAL).toBeDefined();
      expect(TimeCoordinator.MIN_PING_INTERVAL).toBeDefined();
      expect(TimeCoordinator.MAX_PENDING_PINGS).toBeDefined();
      
      expect(typeof TimeCoordinator.MAX_ACTION_HISTORY_COUNT).toBe('number');
      expect(typeof TimeCoordinator.PING_INTERVAL).toBe('number');
      expect(typeof TimeCoordinator.MIN_PING_INTERVAL).toBe('number');
      expect(typeof TimeCoordinator.MAX_PENDING_PINGS).toBe('number');
    });
  });
});
