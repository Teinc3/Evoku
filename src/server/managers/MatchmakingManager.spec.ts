import { jest } from '@jest/globals';

import LobbyActions from '@shared/types/enums/actions/system/lobby';
import MatchmakingManager from "./MatchmakingManager";

import type { UUID } from 'crypto';
import type SessionModel from '../models/networking/Session';
import type RoomModel from '../models/networking/Room';
import type MatchmakingEntryModel from '../models/MatchmakingEntry';
import type SessionManager from "./SessionManager";
import type RoomManager from "./RoomManager";


// Mock classes for testing
class MockSession implements Partial<SessionModel> {
  public uuid: UUID;
  public forward = jest.fn();

  constructor(uuid: string) {
    this.uuid = uuid as UUID;
  }
}

class MockSessionManager implements Partial<SessionManager> {
  public getOnlineCount = jest.fn<() => number>().mockReturnValue(10);
}

class MockRoomManager implements Partial<RoomManager> {
  public createRoom = jest.fn<() => RoomModel>().mockReturnValue({
    addPlayers: jest.fn()
  } as unknown as RoomModel);
}

describe('MatchmakingManager', () => {
  let matchmakingManager: MatchmakingManager;
  let mockSessionManager: MockSessionManager;
  let mockRoomManager: MockRoomManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSessionManager = new MockSessionManager();
    mockRoomManager = new MockRoomManager();
    matchmakingManager = new MatchmakingManager(
      mockSessionManager as unknown as SessionManager,
      mockRoomManager as unknown as RoomManager
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    matchmakingManager.close();
  });

  describe('constructor', () => {
    it('should initialize with empty queues', () => {
      // Access private properties for testing
      const manager = matchmakingManager as unknown as {
        pendingQueue: Map<string, MatchmakingEntryModel>;
        activeQueue: MatchmakingEntryModel[];
      };

      expect(manager.pendingQueue).toBeInstanceOf(Map);
      expect(manager.pendingQueue.size).toBe(0);
      expect(manager.activeQueue).toEqual([]);
    });

    it('should start periodic broadcasts', () => {
      // Access private property for testing
      const manager = matchmakingManager as unknown as {
        broadcastTimer?: NodeJS.Timeout;
      };

      expect(manager.broadcastTimer).toBeDefined();
    });
  });

  describe('joinQueue', () => {
    it('should add new player to pending queue', () => {
      // Arrange
      const session = new MockSession('session-1');

      // Act
      const result = matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');

      // Assert
      expect(result).toBe(true);

      const manager = matchmakingManager as unknown as {
        pendingQueue: Map<string, MatchmakingEntryModel>;
      };
      expect(manager.pendingQueue.has('session-1')).toBe(true);
      expect(manager.pendingQueue.size).toBe(1);
    });

    it('should send initial queue update when joining', () => {
      // Arrange
      const session = new MockSession('session-1');

      // Act
      matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');

      // Assert
      expect(session.forward).toHaveBeenCalledWith(
        LobbyActions.QUEUE_UPDATE,
        { inQueue: true, onlineCount: 10 }
      );
    });

    it('should not add player already in pending queue', () => {
      // Arrange
      const session = new MockSession('session-1');
      matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');

      // Act
      const result = matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');

      // Assert
      expect(result).toBe(false);

      const manager = matchmakingManager as unknown as {
        pendingQueue: Map<string, MatchmakingEntryModel>;
      };
      expect(manager.pendingQueue.size).toBe(1);
    });

    it('should not add player already in active queue', () => {
      // Arrange
      const session = new MockSession('session-1');
      matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');

      // Manually promote to active queue
      jest.advanceTimersByTime(5000);

      // Act
      const result = matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');

      // Assert
      expect(result).toBe(false);
    });

    it('should promote player to active queue after 5 seconds', () => {
      // Arrange
      const session = new MockSession('session-1');
      matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');

      const manager = matchmakingManager as unknown as {
        pendingQueue: Map<string, MatchmakingEntryModel>;
        activeQueue: MatchmakingEntryModel[];
      };

      // Verify initially in pending
      expect(manager.pendingQueue.has('session-1')).toBe(true);
      expect(manager.activeQueue.length).toBe(0);

      // Act
      jest.advanceTimersByTime(5000);

      // Assert
      expect(manager.pendingQueue.has('session-1')).toBe(false);
      expect(manager.activeQueue.length).toBe(1);
    });

    it('should attempt to match players when promoting to active queue', () => {
      // Arrange
      const session1 = new MockSession('session-1');
      const session2 = new MockSession('session-2');
      matchmakingManager.joinQueue(session1 as unknown as SessionModel, 'Player1');
      matchmakingManager.joinQueue(session2 as unknown as SessionModel, 'Player2');

      // Act - Advance time to promote first player (should trigger tryMatchPlayers)
      jest.advanceTimersByTime(5000);

      // Assert - Both players should be matched and removed from queues
      const manager = matchmakingManager as unknown as {
        pendingQueue: Map<string, MatchmakingEntryModel>;
        activeQueue: MatchmakingEntryModel[];
      };
      expect(manager.pendingQueue.size).toBe(0);
      expect(manager.activeQueue.length).toBe(0);
      expect(mockRoomManager.createRoom).toHaveBeenCalled();
    });
  });

  describe('leaveQueue', () => {
    it('should remove player from pending queue', () => {
      // Arrange
      const session = new MockSession('session-1');
      matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');

      const manager = matchmakingManager as unknown as {
        pendingQueue: Map<string, MatchmakingEntryModel>;
      };
      expect(manager.pendingQueue.has('session-1')).toBe(true);

      // Act
      matchmakingManager.leaveQueue('session-1');

      // Assert
      expect(manager.pendingQueue.has('session-1')).toBe(false);
    });

    it('should call destroy on pending entry when removing', () => {
      // Arrange
      const session = new MockSession('session-1');
      matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');

      const manager = matchmakingManager as unknown as {
        pendingQueue: Map<string, MatchmakingEntryModel>;
      };
      const entry = manager.pendingQueue.get('session-1')!;
      const destroySpy = jest.spyOn(entry, 'destroy');

      // Act
      matchmakingManager.leaveQueue('session-1');

      // Assert
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should remove player from active queue', () => {
      // Arrange
      const session = new MockSession('session-1');
      matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');
      jest.advanceTimersByTime(5000); // Promote to active

      const manager = matchmakingManager as unknown as {
        activeQueue: MatchmakingEntryModel[];
      };
      expect(manager.activeQueue.length).toBe(1);

      // Act
      matchmakingManager.leaveQueue('session-1');

      // Assert
      expect(manager.activeQueue.length).toBe(0);
    });

    it('should handle removing non-existent player', () => {
      // Act & Assert
      expect(() => matchmakingManager.leaveQueue('non-existent')).not.toThrow();
    });
  });

  describe('onSessionDisconnect', () => {
    it('should delegate to leaveQueue', () => {
      // Arrange
      const leaveQueueSpy = jest.spyOn(matchmakingManager, 'leaveQueue');

      // Act
      matchmakingManager.onSessionDisconnect('session-1');

      // Assert
      expect(leaveQueueSpy).toHaveBeenCalledWith('session-1');
    });
  });

  describe('tryMatchPlayers', () => {
    it('should not match when less than 2 players in active queue', () => {
      // Arrange
      const session = new MockSession('session-1');
      matchmakingManager.joinQueue(session as unknown as SessionModel, 'Player1');
      jest.advanceTimersByTime(5000); // Promote to active

      // Act
      const manager = matchmakingManager as unknown as {
        tryMatchPlayers(): void;
      };
      manager.tryMatchPlayers();

      // Assert - No room should be created
      expect(mockRoomManager.createRoom).not.toHaveBeenCalled();
    });

    it('should match 2 players and create room', () => {
      // Arrange
      const session1 = new MockSession('session-1');
      const session2 = new MockSession('session-2');
      matchmakingManager.joinQueue(session1 as unknown as SessionModel, 'Player1');
      matchmakingManager.joinQueue(session2 as unknown as SessionModel, 'Player2');
      jest.advanceTimersByTime(5000); // Promote both to active

      // Act
      const manager = matchmakingManager as unknown as {
        tryMatchPlayers(): void;
      };
      manager.tryMatchPlayers();

      // Assert
      expect(mockRoomManager.createRoom).toHaveBeenCalled();

      const mockRoom = mockRoomManager.createRoom.mock.results[0].value as unknown as RoomModel;
      expect(mockRoom.addPlayers).toHaveBeenCalledWith([session1, session2]);
    });

    it('should send MATCH_FOUND packets to both players', () => {
      // Arrange
      const session1 = new MockSession('session-1');
      const session2 = new MockSession('session-2');
      matchmakingManager.joinQueue(session1 as unknown as SessionModel, 'Player1');
      matchmakingManager.joinQueue(session2 as unknown as SessionModel, 'Player2');
      jest.advanceTimersByTime(5000); // Promote both to active

      // Act
      const manager = matchmakingManager as unknown as {
        tryMatchPlayers(): void;
      };
      manager.tryMatchPlayers();

      // Assert
      expect(session1.forward).toHaveBeenCalledWith(
        LobbyActions.MATCH_FOUND,
        {
          myID: 0,
          players: [
            { playerID: 0, username: 'Player1' },
            { playerID: 1, username: 'Player2' }
          ]
        }
      );

      expect(session2.forward).toHaveBeenCalledWith(
        LobbyActions.MATCH_FOUND,
        {
          myID: 1,
          players: [
            { playerID: 0, username: 'Player1' },
            { playerID: 1, username: 'Player2' }
          ]
        }
      );
    });

    it('should remove matched players from active queue', () => {
      // Arrange
      const session1 = new MockSession('session-1');
      const session2 = new MockSession('session-2');
      matchmakingManager.joinQueue(session1 as unknown as SessionModel, 'Player1');
      matchmakingManager.joinQueue(session2 as unknown as SessionModel, 'Player2');

      const manager = matchmakingManager as unknown as {
        activeQueue: MatchmakingEntryModel[];
      };

      // Players should be matched immediately when promoted to active queue
      expect(manager.activeQueue.length).toBe(0); // Already matched and removed
    });
  });

  describe('getQueueStatus', () => {
    it('should return correct queue counts', () => {
      // Arrange
      const session1 = new MockSession('session-1');
      const session2 = new MockSession('session-2');
      const session3 = new MockSession('session-3');

      matchmakingManager.joinQueue(session1 as unknown as SessionModel, 'Player1'); // pending
      matchmakingManager.joinQueue(session2 as unknown as SessionModel, 'Player2'); // pending
      matchmakingManager.joinQueue(session3 as unknown as SessionModel, 'Player3'); // pending

      jest.advanceTimersByTime(5000); // Promote all to active

      // Act
      const status = matchmakingManager.getQueueStatus();

      // Assert
      expect(status).toEqual({
        pending: 0,
        active: 1 // First 2 players were matched immediately, leaving 1 active
      });
    });
  });

  describe('broadcastQueueUpdate', () => {
    it('should send queue updates to all players in queue', () => {
      // Arrange
      const session1 = new MockSession('session-1');
      const session2 = new MockSession('session-2');
      const session3 = new MockSession('session-3');

      matchmakingManager.joinQueue(session1 as unknown as SessionModel, 'Player1'); // pending
      matchmakingManager.joinQueue(session2 as unknown as SessionModel, 'Player2'); // pending
      jest.advanceTimersByTime(5000); // Promote to active
      matchmakingManager.joinQueue(session3 as unknown as SessionModel, 'Player3'); // pending

      // Act
      const manager = matchmakingManager as unknown as {
        broadcastQueueUpdate(): void;
      };
      manager.broadcastQueueUpdate();

      // Assert
      expect(session1.forward).toHaveBeenCalledWith(
        LobbyActions.QUEUE_UPDATE,
        { inQueue: true, onlineCount: 10 }
      );
      expect(session2.forward).toHaveBeenCalledWith(
        LobbyActions.QUEUE_UPDATE,
        { inQueue: true, onlineCount: 10 }
      );
      expect(session3.forward).toHaveBeenCalledWith(
        LobbyActions.QUEUE_UPDATE,
        { inQueue: true, onlineCount: 10 }
      );
    });
  });

  describe('close', () => {
    it('should clear broadcast timer', () => {
      // Act
      matchmakingManager.close();

      // Assert
      const manager = matchmakingManager as unknown as {
        broadcastTimer?: NodeJS.Timeout;
      };
      expect(manager.broadcastTimer).toBeUndefined();
    });

    it('should destroy all pending entries', () => {
      // Arrange
      const session1 = new MockSession('session-1');
      const session2 = new MockSession('session-2');
      matchmakingManager.joinQueue(session1 as unknown as SessionModel, 'Player1');
      matchmakingManager.joinQueue(session2 as unknown as SessionModel, 'Player2');

      const manager = matchmakingManager as unknown as {
        pendingQueue: Map<string, MatchmakingEntryModel>;
      };
      const entry1 = manager.pendingQueue.get('session-1')!;
      const entry2 = manager.pendingQueue.get('session-2')!;
      const destroySpy1 = jest.spyOn(entry1, 'destroy');
      const destroySpy2 = jest.spyOn(entry2, 'destroy');

      // Act
      matchmakingManager.close();

      // Assert
      expect(destroySpy1).toHaveBeenCalled();
      expect(destroySpy2).toHaveBeenCalled();
    });

    it('should clear all queues', () => {
      // Arrange
      const session1 = new MockSession('session-1');
      const session2 = new MockSession('session-2');
      matchmakingManager.joinQueue(session1 as unknown as SessionModel, 'Player1');
      matchmakingManager.joinQueue(session2 as unknown as SessionModel, 'Player2');
      jest.advanceTimersByTime(5000); // Promote to active

      // Act
      matchmakingManager.close();

      // Assert
      const manager = matchmakingManager as unknown as {
        pendingQueue: Map<string, MatchmakingEntryModel>;
        activeQueue: MatchmakingEntryModel[];
      };
      expect(manager.pendingQueue.size).toBe(0);
      expect(manager.activeQueue.length).toBe(0);
    });
  });
});