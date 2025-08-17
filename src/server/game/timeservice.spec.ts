import ProtocolActions from '@shared/types/enums/actions/match/protocol';
import MechanicsActions from '@shared/types/enums/actions/match/player/mechanics';
import TimeValidationReason from '../types/enums/timevalidation';
import TimeService from './time';

import type RoomModel from '../models/networking/Room';


// Mock RoomModel for testing
const mockSession = {
  forward: jest.fn()
};

const mockSession2 = {
  forward: jest.fn()
};

const mockRoom = {
  participants: new Map([['session1', mockSession], ['session2', mockSession2]]),
  getPlayerID: jest.fn(session => {
    if (session === mockSession) {
      return 1;
    }
    if (session === mockSession2) {
      return 2;
    }
    return null;
  }),
  getSessionIDFromPlayerID: jest.fn(playerID => {
    if (playerID === 1) {
      return 'session1';
    }
    if (playerID === 2) {
      return 'session2';
    }
    return undefined;
  })
} as unknown as RoomModel;

describe('TimeService', () => {
  let timeService: TimeService;

  beforeEach(() => {
    jest.useFakeTimers();
    
    timeService = new TimeService(mockRoom);
    
    jest.clearAllMocks();
    mockSession.forward.mockClear();
    mockSession2.forward.mockClear();
  });

  afterEach(() => {
    // Ensure complete cleanup
    timeService.close();
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Also clear mock call history to prevent cross-test pollution
    mockSession.forward.mockClear();
    mockSession2.forward.mockClear();
  });

  // Helper function to advance Jest timers (performance.now is now handled by Jest)
  const advanceTime = (ms: number) => {
    jest.advanceTimersByTime(ms);
  };

  // Helper to get the latest PING payload (serverTime/clientPing) for a session
  const getLatestPingPayload = (session = mockSession) => {
    const calls = session.forward.mock.calls.filter(c => c[0] === ProtocolActions.PING);
    if (calls.length === 0) return undefined;
    return calls[calls.length - 1][1];
  };

  // Helper to get the latest PING serverTime for a session
  const getLatestPingServerTime = (session = mockSession): number | undefined => {
    return getLatestPingPayload(session)?.serverTime;
  };


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

  describe('PONG Validation Security', () => {
    beforeEach(() => {
      timeService.start();
      timeService.addPlayerSession(1);
    });

    it('should accept PONG with valid server time', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Simulate ping being sent
      advanceTime(TimeService.PING_INTERVAL);
      
      // Get the server time that was sent in the ping
      const serverTime = getLatestPingServerTime();
      expect(serverTime).toBeDefined();
      
      // Send valid PONG
      timeService.handlePong(1, 1000, serverTime as number);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(timeService.getPlayerPing(1)).toBeGreaterThanOrEqual(0);
      consoleSpy.mockRestore();
    });

    it('should reject PONG with invalid server time', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Send PONG with server time we never sent
      timeService.handlePong(1, 1000, 12345);
      
      expect(consoleSpy).toHaveBeenCalledWith('Player 1 sent PONG with invalid serverTime: 12345');
      expect(timeService.getPlayerPing(1)).toBe(0); // Should remain unchanged
      consoleSpy.mockRestore();
    });

    it('should handle out-of-order PONG responses', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Send multiple pings by advancing time
      advanceTime(TimeService.PING_INTERVAL + 100);
      const serverTime1 = getLatestPingServerTime();
      expect(serverTime1).toBeDefined();

      advanceTime(TimeService.PING_INTERVAL);
      const serverTime2 = getLatestPingServerTime();
      expect(serverTime2).toBeDefined();
      expect(serverTime2).not.toBe(serverTime1);
      
      advanceTime(TimeService.PING_INTERVAL);
      const serverTime3 = getLatestPingServerTime();
      expect(serverTime3).toBeDefined();
      expect(serverTime3).not.toBe(serverTime2);
      
      // Respond to pings out of order
      timeService.handlePong(1, 1002, serverTime2 as number); // Second ping first
      timeService.handlePong(1, 1001, serverTime1 as number); // First ping second  
      timeService.handlePong(1, 1003, serverTime3 as number); // Third ping last
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should prevent ping replay attacks', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Send ping and respond
      advanceTime(TimeService.PING_INTERVAL);
      
      const serverTime = getLatestPingServerTime();
      expect(serverTime).toBeDefined();
      
      timeService.handlePong(1, 1000, serverTime as number); // First response - valid
      timeService.handlePong(1, 1001, serverTime as number); // Second response - invalid
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Player 1 sent PONG with invalid serverTime: ' + serverTime
      );
      consoleSpy.mockRestore();
    });

    it('should clean up old pending pings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Get the initial ping that was sent
      const serverTime = getLatestPingServerTime();
      expect(serverTime).toBeDefined();
      
      // Advance time past MAX_PING_AGE to make the ping expire
      advanceTime(TimeService.MAX_PING_AGE + 1000);
      
      // Send another ping to trigger cleanup of old pings by responding to the first ping
      // This will clear the first ping and allow a new one
      timeService.handlePong(1, 1000, serverTime as number);
      
      // Now advance time to trigger a new ping
      advanceTime(TimeService.PING_INTERVAL);
      
      // Now try to respond to the old ping again - should be rejected as it was cleaned up
      timeService.handlePong(1, 1000, serverTime as number);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Player 1 sent PONG with invalid serverTime: ' + serverTime
      );
      consoleSpy.mockRestore();
    });
  });

  describe('assessTiming', () => {
    beforeEach(() => {
      timeService.start();
      timeService.addPlayerSession(1);
    });

    it('should return NO_SYNC_PROFILE for player without sync data', () => {
      const result = timeService.assessTiming(999, 1000); // Non-existent player
      expect(result).toBe(TimeValidationReason.NO_SYNC_PROFILE);
    });

    it('should return positive value for valid first action after sync', () => {
      // Establish sync using actual PING/PONG
      advanceTime(TimeService.PING_INTERVAL);
      const pingServerTime = getLatestPingServerTime();
      expect(pingServerTime).toBeDefined();

      // Respond with PONG
      timeService.handlePong(1, 1000, pingServerTime as number);

      const result = timeService.assessTiming(1, 1100);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return MONOTONIC_VIOLATION for non-monotonic client time', () => {
      // A sync is not required to test monotonic; commit an action
      timeService.updateLastActionTime(1, MechanicsActions.SET_CELL, 1100);

      // Try action with same client time
      const result = timeService.assessTiming(1, 1100);
      expect(result).toBe(TimeValidationReason.MONOTONIC_VIOLATION);
    });

    it('should return RATE_LIMIT for rate limiting', () => {
      // Commit 5 actions quickly to trigger rate limit
      for (let i = 0; i < 5; i++) {
        timeService.updateLastActionTime(1, MechanicsActions.SET_CELL, 1100 + i);
      }
      const result = timeService.assessTiming(1, 1200);
      expect(result).toBe(TimeValidationReason.RATE_LIMIT);
    });
  });

  describe('estimateServerTime', () => {
    beforeEach(() => {
      timeService.start();
      timeService.addPlayerSession(1);
    });

    it('should be based on time conversion when no actions exist', () => {
      // Establish sync using real ping/pong
      advanceTime(TimeService.PING_INTERVAL);
      const pingServerTime = getLatestPingServerTime();
      expect(pingServerTime).toBeDefined();

      timeService.handlePong(1, 1000, pingServerTime as number);

      const time1 = timeService.estimateServerTime(1, 1100);
      const time2 = timeService.estimateServerTime(1, 1050); // Earlier client time

      expect(time1).toBeGreaterThan(0);
      expect(time2).toBeGreaterThan(0);
    });

    it('should use last action server time as minimum', () => {
      // Commit an action
      const actionServerTime
        = timeService.updateLastActionTime(1, MechanicsActions.SET_CELL, 1100);

      // Estimate should be at least the action's server time
      const estimated = timeService.estimateServerTime(1, 1050); // Earlier client time
      expect(estimated).toBeGreaterThanOrEqual(actionServerTime);
    });
  });

  describe('updateLastActionTime', () => {
    beforeEach(() => {
      timeService.start();
      timeService.addPlayerSession(1);
    });

    it('should return current server time and store action', () => {
      const serverTime
        = timeService.updateLastActionTime(1, MechanicsActions.SET_CELL, 1100);
      
      expect(typeof serverTime).toBe('number');
      expect(serverTime).toBeGreaterThanOrEqual(0);
    });

    it('should maintain action history limit', () => {
      // Add more actions than the limit
      for (let i = 0; i < TimeService.MAX_ACTION_HISTORY_COUNT + 5; i++) {
        timeService.updateLastActionTime(1, MechanicsActions.SET_CELL, 1000 + i);
      }
      
      // Should still work without issues (internal history trimming)
      const result = timeService.updateLastActionTime(1, MechanicsActions.SET_CELL, 2000);
      expect(typeof result).toBe('number');
    });
  });

  describe('Ping Service Timing', () => {
    it('should send ping immediately when adding session after game init', () => {
      timeService.start();
      timeService.addPlayerSession(1);
      
      // Clear previous calls
      mockSession.forward.mockClear();
      mockSession2.forward.mockClear();
      
      // Add new session
      timeService.addPlayerSession(2);
      
      // Should send immediate ping to the new session
      expect(mockSession2.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: expect.any(Number),
        clientPing: 0
      });
    });

    it('should send pings at regular intervals', () => {
      timeService.start();
      timeService.addPlayerSession(1);
      
      // Check initial ping was sent
      expect(mockSession.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: expect.any(Number),
        clientPing: 0
      });
      
      // Clear initial calls
      mockSession.forward.mockClear();
      
      // Advance time by ping interval
      advanceTime(TimeService.PING_INTERVAL);
      
      expect(mockSession.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: expect.any(Number),
        clientPing: expect.any(Number)
      });
      
      // Advance time again - should send another ping
      mockSession.forward.mockClear();
      advanceTime(TimeService.PING_INTERVAL);
      
      expect(mockSession.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: expect.any(Number),
        clientPing: expect.any(Number)
      });
    });

    it('should not send pings before game initialization', () => {
      // Add session but don't start service
      timeService.addPlayerSession(1);
      
      // Advance time
      advanceTime(TimeService.PING_INTERVAL * 3);
      
      expect(mockSession.forward).not.toHaveBeenCalled();
    });

    it('should stop sending pings when session is removed', () => {
      timeService.start();
      timeService.addPlayerSession(1);
      
      // Remove session
      timeService.removePlayerSession(1);
      
      // Clear any previous calls
      mockSession.forward.mockClear();
      
      // Advance time
      advanceTime(TimeService.PING_INTERVAL);
      
      expect(mockSession.forward).not.toHaveBeenCalled();
    });

    it('should not skip pinging other players if one is within MIN_PING_INTERVAL', () => {
      timeService.start();
      timeService.addPlayerSession(1);
      timeService.addPlayerSession(2);

      // Immediate pass happens; clear calls to observe next tick
      mockSession.forward.mockClear();
      mockSession2.forward.mockClear();

      // Simulate player 1 just received an immediate ping (within MIN_PING_INTERVAL)
      // by sending another immediate ping to player 1 only
      timeService['pingCoordinator']['sendImmediatePing'](1);

      // Advance by the regular ping interval (both should be considered)
      jest.advanceTimersByTime(TimeService.PING_INTERVAL);

      // Player 1 may be suppressed by MIN_PING_INTERVAL; player 2 must still get a ping
      expect(mockSession2.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: expect.any(Number),
        clientPing: expect.any(Number)
      });
    });
  });

  describe('Time Synchronization with Real Timing', () => {
    beforeEach(() => {
      timeService.start();
      timeService.addPlayerSession(1);
    });

    it('should handle PONG and update player data with real timing', () => {
      // Start ping service and trigger a ping
      advanceTime(TimeService.PING_INTERVAL);
      
      // Get the server time from the ping
      const serverTime = getLatestPingServerTime();
      expect(serverTime).toBeDefined();
      
      // Simulate network delay and client response
      advanceTime(50); // 50ms network delay
      const clientTime = 1000;
      
      timeService.handlePong(1, clientTime, serverTime as number);
      
      // Ping should be updated with RTT
      expect(timeService.getPlayerPing(1)).toBeGreaterThan(0);
    });

    it('should convert between client and server time after sync', () => {
      // Establish real sync
      advanceTime(TimeService.PING_INTERVAL);
      const serverTime = getLatestPingServerTime();
      expect(serverTime).toBeDefined();
      
      advanceTime(25); // Simulate network delay
      timeService.handlePong(1, 1000, serverTime as number);
      
      // Test time conversion
      const tsPriv = timeService as unknown as {
        clientToServerTime: (playerID: number, clientTime: number) => number;
        serverToClientTime: (playerID: number, serverTime: number) => number;
      };
      const convertedServerTime = tsPriv.clientToServerTime(1, 1100);
      const convertedClientTime = tsPriv.serverToClientTime(1, (serverTime as number) + 100);
      
      expect(typeof convertedServerTime).toBe('number');
      expect(typeof convertedClientTime).toBe('number');
      expect(convertedServerTime).toBeGreaterThan(0);
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
  });
});
