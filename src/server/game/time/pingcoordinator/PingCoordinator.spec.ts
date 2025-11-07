import { ProtocolActions } from '@shared/types/enums/actions';
import { PendingPingStore, type SyncProfile } from '..';
import PingCoordinator from '.';

import type { RoomModel } from '../../../models/networking';


interface MockSession {
  forward: jest.Mock;
}

interface MockRoom {
  participants: Map<string, MockSession>;
  getSessionIDFromPlayerID: jest.Mock;
}

describe('PingCoordinator', () => {
  let pingCoordinator: PingCoordinator;
  let mockRoom: MockRoom;
  let mockSyncProfiles: Map<number, Partial<SyncProfile>>;
  let mockPendingPings: PendingPingStore;
  let mockGetServerTime: jest.Mock;
  let mockIsGameInitialised: jest.Mock;
  let mockSession1: MockSession;
  let mockSession2: MockSession;

  beforeEach(() => {
    jest.useFakeTimers();
    
    mockSession1 = { forward: jest.fn() };
    mockSession2 = { forward: jest.fn() };
    
    mockRoom = {
      participants: new Map([
        ['session1', mockSession1],
        ['session2', mockSession2]
      ]),
      getSessionIDFromPlayerID: jest.fn((playerID: number) => {
        if (playerID === 1) return 'session1';
        if (playerID === 2) return 'session2';
        return undefined;
      })
    };

    mockSyncProfiles = new Map([
      [1, { getRtt: () => 50 }],
      [2, { getRtt: () => 75 }]
    ]);

    mockPendingPings = new PendingPingStore();
    mockGetServerTime = jest.fn(() => 1000);
    mockIsGameInitialised = jest.fn(() => true);

    pingCoordinator = new PingCoordinator(
      mockRoom as unknown as RoomModel,
      mockSyncProfiles as Map<number, SyncProfile>,
      mockPendingPings,
      mockGetServerTime,
      mockIsGameInitialised
    );
  });

  afterEach(() => {
    pingCoordinator.stop();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('startPingService', () => {
    it('should send immediate ping on start', () => {
      pingCoordinator.startPingService();
      
      expect(mockSession1.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000,
        clientPing: 50
      });
      expect(mockSession2.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000,
        clientPing: 75
      });
    });

    it('should send pings at regular intervals', () => {
      pingCoordinator.startPingService();
      
      // Clear initial calls
      mockSession1.forward.mockClear();
      mockSession2.forward.mockClear();
      
      // Mock that server time increases
      mockGetServerTime.mockReturnValue(1000 + PingCoordinator.PING_INTERVAL);
      
      // Advance time by ping interval
      jest.advanceTimersByTime(PingCoordinator.PING_INTERVAL);
      
      expect(mockSession1.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000 + PingCoordinator.PING_INTERVAL,
        clientPing: 50
      });
      expect(mockSession2.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000 + PingCoordinator.PING_INTERVAL,
        clientPing: 75
      });
    });

    it('should not start multiple intervals', () => {
      pingCoordinator.startPingService();
      pingCoordinator.startPingService(); // Second call should be ignored
      
      // Only one set of pings should be sent
      expect(mockSession1.forward).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendImmediatePing', () => {
    it('should send ping immediately to specific player', () => {
      pingCoordinator.sendImmediatePing(1);
      
      expect(mockSession1.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000,
        clientPing: 50
      });
      expect(mockSession2.forward).not.toHaveBeenCalled();
    });

    it('should not send ping before game initialization', () => {
      mockIsGameInitialised.mockReturnValue(false);
      
      pingCoordinator.sendImmediatePing(1);
      
      expect(mockSession1.forward).not.toHaveBeenCalled();
    });

    it('should handle non-existent player gracefully', () => {
      expect(() => pingCoordinator.sendImmediatePing(999)).not.toThrow();
    });
  });

  describe('circuit breaker behavior', () => {
    beforeEach(() => {
      // Fill up pending pings for player 1 to trigger circuit breaker
      for (let i = 0; i < PendingPingStore.MAX_PENDING_PINGS; i++) {
        mockPendingPings.addPendingPing(1, 1000 + i);
      }
    });

    it('should skip laggy players in global ping', () => {
      pingCoordinator.startPingService();
      
      // Player 1 should be skipped (at limit), player 2 should receive ping
      expect(mockSession1.forward).not.toHaveBeenCalled();
      expect(mockSession2.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000,
        clientPing: 75
      });
    });

    it('should allow immediate pings even for laggy players', () => {
      pingCoordinator.sendImmediatePing(1);
      
      // Immediate pings bypass circuit breaker
      expect(mockSession1.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000,
        clientPing: 50
      });
    });
  });

  describe('MIN_PING_INTERVAL enforcement', () => {
    it('should respect minimum interval between pings', () => {
      // Add a recent ping for player 1
      mockPendingPings.addPendingPing(1, 900); // 100ms ago
      
      pingCoordinator.startPingService();
      
      // Player 1 should be skipped (too recent), player 2 should receive ping
      expect(mockSession1.forward).not.toHaveBeenCalled();
      expect(mockSession2.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000,
        clientPing: 75
      });
    });

    it('should allow ping if enough time has passed', () => {
      // Add an old ping for player 1
      mockPendingPings.addPendingPing(1, 400); // 600ms ago (> MIN_PING_INTERVAL)
      
      pingCoordinator.startPingService();
      
      // Both players should receive pings
      expect(mockSession1.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000,
        clientPing: 50
      });
      expect(mockSession2.forward).toHaveBeenCalledWith(ProtocolActions.PING, {
        serverTime: 1000,
        clientPing: 75
      });
    });
  });

  describe('stop', () => {
    it('should stop the ping service', () => {
      pingCoordinator.startPingService();
      pingCoordinator.stop();
      
      // Clear initial calls
      mockSession1.forward.mockClear();
      mockSession2.forward.mockClear();
      
      // Advance time - no more pings should be sent
      jest.advanceTimersByTime(PingCoordinator.PING_INTERVAL);
      
      expect(mockSession1.forward).not.toHaveBeenCalled();
      expect(mockSession2.forward).not.toHaveBeenCalled();
    });

    it('should handle stop without start gracefully', () => {
      expect(() => pingCoordinator.stop()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle missing session for player', () => {
      mockRoom.getSessionIDFromPlayerID.mockReturnValue(undefined);
      
      expect(() => pingCoordinator.sendImmediatePing(1)).not.toThrow();
    });

    it('should handle missing session in participants map', () => {
      mockRoom.getSessionIDFromPlayerID.mockReturnValue('nonexistent');
      
      expect(() => pingCoordinator.sendImmediatePing(1)).not.toThrow();
    });

    it('should handle empty sync profiles map', () => {
      mockSyncProfiles.clear();
      
      expect(() => pingCoordinator.startPingService()).not.toThrow();
    });
  });
});
