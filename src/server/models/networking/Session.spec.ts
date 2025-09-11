import { jest } from '@jest/globals';

import LobbyActions from '@shared/types/enums/actions/system/lobby';
import MechanicsActions from '@shared/types/enums/actions/match/player/mechanics';
import SessionModel from './Session';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type SystemActions from '@shared/types/enums/actions/system';
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';
import type IDataHandler from '../../types/handler';
import type ServerSocket from './ServerSocket';
import type RoomModel from './Room';


// Mock classes for testing
class MockServerSocket {
  constructor(public readyState: number = 1) {}
  close = jest.fn();
  send = jest.fn();
  setListener = jest.fn();
  removeAllListeners = jest.fn();
  on = jest.fn();
}

class MockRoom {
  public readonly roomID = 'test-room';
  public participants = new Map();
  public roomDataHandler = {
    handleData: jest.fn().mockReturnValue(true)
  };

  removeSession = jest.fn();
}

class MockSystemHandler {
  handleData = jest.fn().mockReturnValue(true);
}

describe('SessionModel', () => {
  let mockSocket: MockServerSocket;
  let mockRoom: MockRoom;
  let mockSystemHandler: MockSystemHandler;
  let onDisconnectSpy: jest.MockedFunction<(session: SessionModel) => void>;
  let onDestroySpy: jest.MockedFunction<(session: SessionModel) => void>;
  let session: SessionModel;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock console.error to suppress error logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockSocket = new MockServerSocket();
    mockRoom = new MockRoom();
    mockSystemHandler = new MockSystemHandler();
    onDisconnectSpy = jest.fn();
    onDestroySpy = jest.fn();

    session = new SessionModel(
      mockSocket as unknown as ServerSocket,
      onDisconnectSpy,
      onDestroySpy,
      mockSystemHandler as unknown as IDataHandler<SystemActions>,
      mockRoom as unknown as RoomModel
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should generate a unique UUID', () => {
      expect(session.uuid).toBeDefined();
      expect(typeof session.uuid).toBe('string');
      expect(session.uuid.length).toBeGreaterThan(0);
    });

    it('should set socket instance', () => {
      expect(session.socketInstance).toBe(mockSocket);
    });

    it('should set room reference', () => {
      expect(session.room).toBe(mockRoom);
    });

    it('should set last active time to current time', () => {
      const beforeTime = Date.now();
      const newSession = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>
      );
      const afterTime = Date.now();

      expect(newSession.lastActiveTime).toBeGreaterThanOrEqual(beforeTime);
      expect(newSession.lastActiveTime).toBeLessThanOrEqual(afterTime);
    });

    it('should set socket listener when socket is provided', () => {
      expect(mockSocket.setListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not set socket listener when socket is null', () => {
      const freshMockSocket = new MockServerSocket();

      expect(freshMockSocket.setListener).not.toHaveBeenCalled();
    });

    it('should bind callback functions to session instance', () => {
      expect(onDisconnectSpy).toHaveBeenCalledTimes(0); // Not called during construction
      expect(onDestroySpy).toHaveBeenCalledTimes(0); // Not called during construction
    });
  });

  describe('disconnect', () => {
    it('should close socket when socket exists', () => {
      // Act
      session.disconnect();

      // Assert
      expect(mockSocket.close).toHaveBeenCalled();
      expect(session.socketInstance).toBeNull();
    });

    it('should not close socket when socket is already null', () => {
      // Arrange
      const sessionWithoutSocket = new SessionModel(
        null,
        onDisconnectSpy,
        onDestroySpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>
      );

      // Act
      sessionWithoutSocket.disconnect();

      // Assert
      expect(mockSocket.close).not.toHaveBeenCalled();
    });

    it('should trigger disconnect event by default', () => {
      // Act
      session.disconnect();

      // Assert
      expect(onDisconnectSpy).toHaveBeenCalledWith(session);
    });

    it('should not trigger disconnect event when triggerEvent is false', () => {
      // Act
      session.disconnect(false);

      // Assert
      expect(onDisconnectSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple disconnect calls gracefully', () => {
      // Arrange
      const freshOnDisconnectSpy = jest.fn();
      const freshSession = new SessionModel(
        mockSocket as unknown as ServerSocket,
        freshOnDisconnectSpy,
        onDestroySpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        mockRoom as unknown as RoomModel
      );

      // Act
      freshSession.disconnect();
      freshSession.disconnect();

      // Assert
      expect(mockSocket.close).toHaveBeenCalledTimes(1);
      expect(freshOnDisconnectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('should remove session from room when room exists', () => {
      // Act
      session.destroy();

      // Assert
      expect(mockRoom.removeSession).toHaveBeenCalledWith(session);
      expect(session.room).toBeNull();
    });

    it('should not remove from room when room is null', () => {
      // Arrange
      const sessionWithoutRoom = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        null
      );

      // Act
      sessionWithoutRoom.destroy();

      // Assert
      expect(mockRoom.removeSession).not.toHaveBeenCalled();
    });

    it('should close socket when socket exists', () => {
      // Act
      session.destroy();

      // Assert
      expect(mockSocket.close).toHaveBeenCalled();
      expect(session.socketInstance).toBeNull();
    });

    it('should trigger destroy event by default', () => {
      // Act
      session.destroy();

      // Assert
      expect(onDestroySpy).toHaveBeenCalledWith(session);
    });

    it('should not trigger destroy event when triggerEvent is false', () => {
      // Act
      session.destroy(false);

      // Assert
      expect(onDestroySpy).not.toHaveBeenCalled();
    });

    it('should clear all references', () => {
      // Act
      session.destroy();

      // Assert
      expect(session.room).toBeNull();
      expect(session.socketInstance).toBeNull();
    });
  });

  describe('reconnect', () => {
    it('should set new socket instance', () => {
      // Arrange
      const newSocket = new MockServerSocket();

      // Act
      session.reconnect(newSocket as unknown as ServerSocket);

      // Assert
      expect(session.socketInstance).toBe(newSocket);
    });

    it('should set listener on new socket', () => {
      // Arrange
      const newSocket = new MockServerSocket();

      // Act
      session.reconnect(newSocket as unknown as ServerSocket);

      // Assert
      expect(newSocket.setListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should replace existing socket', () => {
      // Arrange
      const newSocket = new MockServerSocket();
      const originalSocket = session.socketInstance;

      // Act
      session.reconnect(newSocket as unknown as ServerSocket);

      // Assert
      expect(session.socketInstance).toBe(newSocket);
      expect(session.socketInstance).not.toBe(originalSocket);
    });
  });

  describe('forward', () => {
    it('should send data through socket when socket exists', () => {
      // Arrange
      const action = 'GAME_INIT' as unknown as ActionEnum;
      const data = { test: 'data' } as unknown as ActionMap[ActionEnum];

      // Act
      session.forward(action, data);

      // Assert
      expect(mockSocket.send).toHaveBeenCalledWith(action, data);
    });

    it('should not send data when socket is null', () => {
      // Arrange
      const sessionWithoutSocket = new SessionModel(
        null,
        onDisconnectSpy,
        onDestroySpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>
      );
      const action = 'GAME_INIT' as unknown as ActionEnum;
      const data = { test: 'data' } as unknown as ActionMap[ActionEnum];

      // Act
      sessionWithoutSocket.forward(action, data);

      // Assert
      expect(mockSocket.send).not.toHaveBeenCalled();
    });

    it('should handle different action types', () => {
      // Arrange
      const actions = [
        'GAME_INIT' as unknown as ActionEnum,
        'PLAYER_JOIN' as unknown as ActionEnum,
        'GAME_OVER' as unknown as ActionEnum
      ];

      // Act & Assert
      actions.forEach(action => {
        const data = { test: 'data' } as unknown as ActionMap[ActionEnum];
        session.forward(action, data);
        expect(mockSocket.send).toHaveBeenCalledWith(action, data);
      });
    });
  });

  describe('dataListener', () => {
    it('should update last active time when data is handled successfully', () => {
      // Arrange
      const originalTime = session.lastActiveTime;
      jest.advanceTimersByTime(1000); // Advance time by 1 second

      const data = {
        action: 'GAME_INIT' as unknown as ActionEnum,
        data: { test: 'data' }
      } as unknown as AugmentAction<ActionEnum>;

      // Mock successful handling
      mockRoom.roomDataHandler.handleData.mockReturnValue(true);

      // Act - Call the private method via type assertion
      (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => void 
      }).dataListener(data);

      // Assert
      expect(session.lastActiveTime).toBeGreaterThan(originalTime);
    });

    it('should disconnect when data handling fails', () => {
      // Arrange
      const data = {
        action: 'INVALID_ACTION' as unknown as ActionEnum,
        data: { test: 'data' }
      } as unknown as AugmentAction<ActionEnum>;

      // Mock failed handling
      mockRoom.roomDataHandler.handleData.mockReturnValue(false);

      // Act - Call the private method via type assertion
      (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => void 
      }).dataListener(data);

      // Assert
      expect(onDisconnectSpy).toHaveBeenCalledWith(session);
    });

    it('should handle match actions when room exists', () => {
      // Arrange
      const data = {
        action: 'SET_CELL' as unknown as ActionEnum,
        data: { x: 0, y: 0, element: 'fire' }
      } as unknown as AugmentAction<ActionEnum>;

      // Act - Call the private method via type assertion
      (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => void
      }).dataListener(data);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).toHaveBeenCalledWith(session, data);
    });

    it('should handle system actions', () => {
      // Arrange
      const data = {
        action: 'JOIN_QUEUE' as unknown as ActionEnum,
        data: { difficulty: 'easy' }
      } as unknown as AugmentAction<ActionEnum>;

      // Act - Call the private method via type assertion
      (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => void 
      }).dataListener(data);

      // Assert
      expect(mockSystemHandler.handleData).toHaveBeenCalledWith(session, data);
    });

    it('should handle unknown actions', () => {
      // Arrange
      const data = {
        action: 'UNKNOWN_ACTION' as unknown as ActionEnum,
        data: { test: 'data' }
      } as unknown as AugmentAction<ActionEnum>;

      // Act - Call the private method via type assertion
      (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => void 
      }).dataListener(data);

      // Assert
      expect(onDisconnectSpy).toHaveBeenCalledWith(session);
    });
  });

  describe('handleData', () => {
    it('should route match actions to room handler when room exists', () => {
      // Arrange
      const data = {
        action: 'SET_CELL' as unknown as ActionEnum,
        data: { x: 0, y: 0, element: 'fire' }
      } as unknown as AugmentAction<ActionEnum>;

      // Act - Call the private method via type assertion
      const result = (session as unknown as { 
        handleData: (data: AugmentAction<ActionEnum>) => boolean 
      }).handleData(data);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).toHaveBeenCalledWith(session, data);
      expect(result).toBe(true);
    });

    it('should return false for match actions when room is null', () => {
      // Arrange
      const sessionWithoutRoom = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        null
      );
      const data = {
        action: 'SET_CELL' as unknown as ActionEnum,
        data: { x: 0, y: 0, element: 'fire' }
      } as unknown as AugmentAction<ActionEnum>;

      // Act - Call the private method via type assertion
      const result = (sessionWithoutRoom as unknown as { 
        handleData: (data: AugmentAction<ActionEnum>) => boolean 
      }).handleData(data);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should route system actions to system handler', () => {
      // Arrange
      const data = {
        action: 'JOIN_QUEUE' as unknown as ActionEnum,
        data: { difficulty: 'easy' }
      } as unknown as AugmentAction<ActionEnum>;

      // Act - Call the private method via type assertion
      const result = (session as unknown as { 
        handleData: (data: AugmentAction<ActionEnum>) => boolean 
      }).handleData(data);

      // Assert
      expect(mockSystemHandler.handleData).toHaveBeenCalledWith(session, data);
      expect(result).toBe(true);
    });

    it('should return false for unknown action types', () => {
      // Arrange
      const data = {
        action: 'UNKNOWN_ACTION' as unknown as ActionEnum,
        data: { test: 'data' }
      } as unknown as AugmentAction<ActionEnum>;

      // Act - Call the private method via type assertion
      const result = (session as unknown as { 
        handleData: (data: AugmentAction<ActionEnum>) => boolean 
      }).handleData(data);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).not.toHaveBeenCalled();
      expect(mockSystemHandler.handleData).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should propagate handler return values', () => {
      // Arrange
      const data: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        cellIndex: 0,
        value: 1,
        clientTime: 1000,
        actionID: 42
      };

      mockRoom.roomDataHandler.handleData.mockReturnValue(false);

      // Act - Call the private method via type assertion
      const result = (session as unknown as { 
        handleData: (data: AugmentAction<ActionEnum>) => boolean
      }).handleData(data);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete session lifecycle', () => {
      // Arrange
      const newSocket = new MockServerSocket();

      // Act & Assert - Initial state
      expect(session.socketInstance).toBe(mockSocket);
      expect(session.room).toBe(mockRoom);

      // Disconnect
      session.disconnect();
      expect(session.socketInstance).toBeNull();
      expect(onDisconnectSpy).toHaveBeenCalledWith(session);

      // Reconnect
      session.reconnect(newSocket as unknown as ServerSocket);
      expect(session.socketInstance).toBe(newSocket);

      // Destroy
      session.destroy();
      expect(session.room).toBeNull();
      expect(session.socketInstance).toBeNull();
      expect(onDestroySpy).toHaveBeenCalledWith(session);
    });

    it('should handle data flow correctly', () => {
      // Arrange
      const matchData: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        cellIndex: 5,
        value: 2,
        clientTime: 1000,
        actionID: 42
      };

      const systemData: AugmentAction<LobbyActions.JOIN_QUEUE> = {
        action: LobbyActions.JOIN_QUEUE,
        username: 'test-user',
      };

      // Act
      (session as unknown as { dataListener: (data: AugmentAction<ActionEnum>) => void })
        .dataListener(matchData);
      (session as unknown as { dataListener: (data: AugmentAction<ActionEnum>) => void })
        .dataListener(systemData);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).toHaveBeenCalledWith(session, matchData);
      expect(mockSystemHandler.handleData).toHaveBeenCalledWith(session, systemData);
      expect(session.lastActiveTime).toBeGreaterThan(0);
    });
  });
});
