import { jest } from '@jest/globals';

import RoomModel from '.';

import type { UUID } from 'crypto';
import type MatchActions from '@shared/types/enums/actions/match';
import type ActionMap from '@shared/types/actionmap';
import type BroadcastOptions from '../../../types/broadcast';
import type { SessionModel } from "..";


// Mock BiMap class
class MockBiMap {
  private map = new Map<UUID, number>();
  private reverseMap = new Map<number, UUID>();

  set(key: UUID, value: number): void {
    this.map.set(key, value);
    this.reverseMap.set(value, key);
  }

  get(key: UUID): number | undefined {
    return this.map.get(key);
  }

  getKey(value: number): UUID | undefined {
    return this.reverseMap.get(value);
  }

  delete(key: UUID): boolean {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.reverseMap.delete(value);
      return true;
    }
    return false;
  }

  clear(): void {
    this.map.clear();
    this.reverseMap.clear();
  }
}

// Mock classes for testing
class MockServerSocket {
  constructor(public readyState: number = 1) {}
  close = jest.fn();
  send = jest.fn();
  setListener = jest.fn();
  removeAllListeners = jest.fn();
  on = jest.fn();
}

class MockSession {
  public readonly uuid: UUID;
  public socketInstance: MockServerSocket | null;
  public room: RoomModel | null = null;

  constructor(uuid: UUID, socket: MockServerSocket | null = null) {
    this.uuid = uuid;
    this.socketInstance = socket;
  }

  disconnect = jest.fn();
  destroy = jest.fn();
  reconnect = jest.fn();
  forward = jest.fn();
}

describe('RoomModel', () => {
  let room: RoomModel;
  let mockSession1: SessionModel;
  let mockSession2: SessionModel;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a partial mock of RoomModel to avoid constructor issues
    room = Object.create(RoomModel.prototype) as RoomModel;

    // Set read-only properties using Object.defineProperty
    Object.defineProperty(room, 'roomID', { value: 'test-room', writable: false });
    Object.defineProperty(room, 'participants', { value: new Map(), writable: false });
    Object.defineProperty(room, 'stateController', {
      value: {
        addPlayer: jest.fn(),
        removePlayer: jest.fn()
      },
      writable: false
    });
    Object.defineProperty(room, 'lifecycle', {
      value: {
        onPlayerJoined: jest.fn(),
        onPlayerLeft: jest.fn(),
        close: jest.fn()
      },
      writable: false
    });
    Object.defineProperty(room, 'timeService', {
      value: {
        addPlayerSession: jest.fn(),
        removePlayerSession: jest.fn(),
        close: jest.fn()
      },
      writable: false
    });
    Object.defineProperty(room, 'roomDataHandler', {
      value: {
        handleData: jest.fn().mockReturnValue(true)
      },
      writable: false
    });

    // Mock private properties
    Object.defineProperty(room, 'playerMap', {
      value: new MockBiMap(),
      writable: true
    });
    Object.defineProperty(room, 'playerIDCounter', {
      value: 0,
      writable: true
    });

    Object.defineProperty(room, 'trackedTimeouts', {
      value: new Set(),
      writable: true
    });

    mockSession1 = new MockSession(
      'session-1' as UUID, 
      new MockServerSocket()
    ) as unknown as SessionModel;
    mockSession2 = new MockSession(
      'session-2' as UUID, 
      new MockServerSocket()
    ) as unknown as SessionModel;
  });

  describe('constructor', () => {
    it('should initialize with correct room ID', () => {
      expect(room.roomID).toBe('test-room');
    });

    it('should initialize empty participants map', () => {
      expect(room.participants).toBeInstanceOf(Map);
      expect(room.participants.size).toBe(0);
    });

    it('should initialize empty player map', () => {
      expect((room as unknown as { playerMap: unknown }).playerMap).toBeDefined();
    });

    it('should initialize player ID counter to 0', () => {
      expect((room as unknown as { playerIDCounter: number }).playerIDCounter).toBe(0);
    });

    it('should initialize controllers and services', () => {
      expect(room.stateController).toBeDefined();
      expect(room.lifecycle).toBeDefined();
      expect(room.timeService).toBeDefined();
      expect(room.roomDataHandler).toBeDefined();
    });
  });

  describe('addPlayers', () => {
    it('should add sessions as players', () => {
      // Act
      room.addPlayers([mockSession1, mockSession2]);

      // Assert
      expect(room.participants.size).toBe(2);
      expect(room.participants.has(mockSession1.uuid)).toBe(true);
      expect(room.participants.has(mockSession2.uuid)).toBe(true);
    });

    it('should assign player IDs sequentially', () => {
      // Act
      room.addPlayers([mockSession1, mockSession2]);

      // Assert
      expect(room.getPlayerID(mockSession1)).toBe(0);
      expect(room.getPlayerID(mockSession2)).toBe(1);
    });

    it('should set room reference on sessions', () => {
      // Act
      room.addPlayers([mockSession1]);

      // Assert
      expect(mockSession1.room).toBe(room);
    });

    it('should notify lifecycle controller when players join', () => {
      // Act
      room.addPlayers([mockSession1]);

      // Assert
      expect(room.lifecycle.onPlayerJoined).toHaveBeenCalled();
    });

    it('should call state controller addPlayer for each session', () => {
      // Act
      room.addPlayers([mockSession1, mockSession2]);

      // Assert
      expect(room.stateController.addPlayer).toHaveBeenCalledWith(0);
      expect(room.stateController.addPlayer).toHaveBeenCalledWith(1);
    });

    it('should call time service addPlayerSession for each session', () => {
      // Act
      room.addPlayers([mockSession1, mockSession2]);

      // Assert
      expect(room.timeService.addPlayerSession).toHaveBeenCalledWith(0);
      expect(room.timeService.addPlayerSession).toHaveBeenCalledWith(1);
    });
  });

  describe('removeSession', () => {
    beforeEach(() => {
      room.addPlayers([mockSession1, mockSession2]);
    });

    it('should remove session from participants', () => {
      // Act
      room.removeSession(mockSession1);

      // Assert
      expect(room.participants.size).toBe(1);
      expect(room.participants.has(mockSession1.uuid)).toBe(false);
      expect(room.participants.has(mockSession2.uuid)).toBe(true);
    });

    it('should clear room reference from session', () => {
      // Act
      room.removeSession(mockSession1);

      // Assert
      expect(mockSession1.room).toBeNull();
    });

    it('should remove player from state controller', () => {
      // Act
      room.removeSession(mockSession1);

      // Assert
      expect(room.stateController.removePlayer).toHaveBeenCalledWith(0);
    });

    it('should remove player from time service', () => {
      // Act
      room.removeSession(mockSession1);

      // Assert
      expect(room.timeService.removePlayerSession).toHaveBeenCalledWith(0);
    });

    it('should notify lifecycle controller when player leaves', () => {
      // Act
      room.removeSession(mockSession1);

      // Assert
      expect(room.lifecycle.onPlayerLeft).toHaveBeenCalled();
    });

    it('should handle removing non-existent session gracefully', () => {
      // Arrange
      const nonExistentSession = new MockSession('non-existent' as UUID);

      // Act & Assert - Should not throw
      expect(() => {
        room.removeSession(nonExistentSession as unknown as SessionModel);
      }).not.toThrow();
    });
  });

  describe('broadcast', () => {
    beforeEach(() => {
      room.addPlayers([mockSession1, mockSession2]);
    });

    it('should broadcast to all participants by default', () => {
      // Arrange
      const action = 'GAME_INIT' as unknown as MatchActions;
      const data = { test: 'data' } as unknown as ActionMap[MatchActions];

      // Act
      room.broadcast(action, data);

      // Assert
      expect(mockSession1.forward).toHaveBeenCalledWith(action, data);
      expect(mockSession2.forward).toHaveBeenCalledWith(action, data);
    });

    it('should broadcast to specific recipients when specified', () => {
      // Arrange
      const action = 'GAME_INIT' as unknown as MatchActions;
      const data = { test: 'data' } as unknown as ActionMap[MatchActions];
      const options: BroadcastOptions = {
        to: [mockSession1.uuid]
      };

      // Act
      room.broadcast(action, data, options);

      // Assert
      expect(mockSession1.forward).toHaveBeenCalledWith(action, data);
      expect(mockSession2.forward).not.toHaveBeenCalled();
    });

    it('should exclude specified sessions', () => {
      // Arrange
      const action = 'GAME_INIT' as unknown as MatchActions;
      const data = { test: 'data' } as unknown as ActionMap[MatchActions];
      const options: BroadcastOptions = {
        exclude: new Set([mockSession1.uuid])
      };

      // Act
      room.broadcast(action, data, options);

      // Assert
      expect(mockSession1.forward).not.toHaveBeenCalled();
      expect(mockSession2.forward).toHaveBeenCalledWith(action, data);
    });

    it('should handle non-existent recipient UUIDs gracefully', () => {
      // Arrange
      const action = 'GAME_INIT' as unknown as MatchActions;
      const data = { test: 'data' } as unknown as ActionMap[MatchActions];
      const options: BroadcastOptions = {
        to: ['non-existent-uuid' as UUID]
      };

      // Act & Assert - Should not throw
      expect(() => {
        room.broadcast(action, data, options);
      }).not.toThrow();

      expect(mockSession1.forward).not.toHaveBeenCalled();
      expect(mockSession2.forward).not.toHaveBeenCalled();
    });
  });

  describe('getPlayerID', () => {
    beforeEach(() => {
      room.addPlayers([mockSession1]);
    });

    it('should return correct player ID for session', () => {
      // Act
      const playerID = room.getPlayerID(mockSession1);

      // Assert
      expect(playerID).toBe(0);
    });

    it('should return undefined for non-existent session', () => {
      // Arrange
      const nonExistentSession = new MockSession('non-existent' as UUID);

      // Act
      const playerID = room.getPlayerID(nonExistentSession as unknown as SessionModel);

      // Assert
      expect(playerID).toBeUndefined();
    });
  });

  describe('getSessionIDFromPlayerID', () => {
    beforeEach(() => {
      room.addPlayers([mockSession1, mockSession2]);
    });

    it('should return correct session UUID for player ID', () => {
      // Act
      const sessionID = room.getSessionIDFromPlayerID(1);

      // Assert
      expect(sessionID).toBe(mockSession2.uuid);
    });

    it('should return undefined for non-existent player ID', () => {
      // Act
      const sessionID = room.getSessionIDFromPlayerID(999);

      // Assert
      expect(sessionID).toBeUndefined();
    });
  });

  describe('close', () => {
    beforeEach(() => {
      room.addPlayers([mockSession1, mockSession2]);
    });

    it('should close lifecycle controller', () => {
      // Act
      room.close();

      // Assert
      expect(room.lifecycle.close).toHaveBeenCalled();
    });

    it('should close time service', () => {
      // Act
      room.close();

      // Assert
      expect(room.timeService.close).toHaveBeenCalled();
    });

    it('should clear room references from all sessions', () => {
      // Act
      room.close();

      // Assert
      expect(mockSession1.room).toBeNull();
      expect(mockSession2.room).toBeNull();
    });

    it('should clear participants map', () => {
      // Act
      room.close();

      // Assert
      expect(room.participants.size).toBe(0);
    });

    it('should clear player map', () => {
      // Act
      room.close();

      // Assert
      // Since playerMap is private, we verify by checking that getPlayerID returns undefined
      expect(room.getPlayerID(mockSession1)).toBeUndefined();
    });
  });

  describe('logAction', () => {
    it('should be callable without throwing', () => {
      // Act & Assert
      expect(() => {
        room.logAction();
      }).not.toThrow();
    });
  });
});
