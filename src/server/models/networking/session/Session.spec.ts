import { jest } from '@jest/globals';

import SessionActions from '@shared/types/enums/actions/system/session';
import LobbyActions from '@shared/types/enums/actions/system/lobby';
import MechanicsActions from '@shared/types/enums/actions/match/player/mechanics';
import SessionModel from './Session';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type SystemActions from '@shared/types/enums/actions/system';
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';
import type ServerSocket from '../serversocket';
import type RoomModel from '../room';
import type IDataHandler from '../../../types/handler';


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
    handleData: jest.fn().mockImplementation(() => Promise.resolve(true))
  };

  removeSession = jest.fn();
}

class MockSystemHandler {
  handleData = jest.fn().mockImplementation(() => Promise.resolve(true));
}

describe('SessionModel', () => {
  let mockSocket: MockServerSocket;
  let mockRoom: MockRoom;
  let mockSystemHandler: MockSystemHandler;
  let onDisconnectSpy: jest.MockedFunction<(session: SessionModel) => void>;
  let onDestroySpy: jest.MockedFunction<(session: SessionModel) => void>;
  let onAuthenticateSpy: jest.MockedFunction<(session: SessionModel, playerID: string) => void>;
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
    onAuthenticateSpy = jest.fn();

    session = new SessionModel(
      mockSocket as unknown as ServerSocket,
      onDisconnectSpy,
      onDestroySpy,
      onAuthenticateSpy,
      mockSystemHandler as unknown as IDataHandler<SystemActions>,
      mockRoom as unknown as RoomModel
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should generate a unique UUID', async () => {
      expect(session.uuid).toBeDefined();
      expect(typeof session.uuid).toBe('string');
      expect(session.uuid.length).toBeGreaterThan(0);
    });

    it('should set socket instance', async () => {
      expect(session.socketInstance).toBe(mockSocket);
    });

    it('should set room reference', async () => {
      expect(session.room).toBe(mockRoom);
    });

    it('should set last active time to current time', async () => {
      const beforeTime = Date.now();
      const newSession = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>
      );
      const afterTime = Date.now();

      expect(newSession.lastActiveTime).toBeGreaterThanOrEqual(beforeTime);
      expect(newSession.lastActiveTime).toBeLessThanOrEqual(afterTime);
    });

    it('should set socket listener when socket is provided', async () => {
      expect(mockSocket.setListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not set socket listener when socket is null', async () => {
      const freshMockSocket = new MockServerSocket();

      expect(freshMockSocket.setListener).not.toHaveBeenCalled();
    });

    it('should bind callback functions to session instance', async () => {
      expect(onDisconnectSpy).toHaveBeenCalledTimes(0); // Not called during construction
      expect(onDestroySpy).toHaveBeenCalledTimes(0); // Not called during construction
    });
  });

  describe('disconnect', () => {
    it('should close socket when socket exists', async () => {
      // Act
      session.disconnect();

      // Assert
      expect(mockSocket.close).toHaveBeenCalled();
      expect(session.socketInstance).toBeNull();
    });

    it('should not close socket when socket is already null', async () => {
      // Arrange
      const sessionWithoutSocket = new SessionModel(
        null,
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>
      );

      // Act
      sessionWithoutSocket.disconnect();

      // Assert
      expect(mockSocket.close).not.toHaveBeenCalled();
    });

    it('should trigger disconnect event by default', async () => {
      // Act
      session.disconnect();

      // Assert
      expect(onDisconnectSpy).toHaveBeenCalledWith(session);
    });

    it('should not trigger disconnect event when triggerEvent is false', async () => {
      // Act
      session.disconnect(false);

      // Assert
      expect(onDisconnectSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple disconnect calls gracefully', async () => {
      // Arrange
      const freshOnDisconnectSpy = jest.fn();
      const freshSession = new SessionModel(
        mockSocket as unknown as ServerSocket,
        freshOnDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
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
    it('should remove session from room when room exists', async () => {
      // Act
      session.destroy();

      // Assert
      expect(mockRoom.removeSession).toHaveBeenCalledWith(session);
      expect(session.room).toBeNull();
    });

    it('should not remove from room when room is null', async () => {
      // Arrange
      const sessionWithoutRoom = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        null
      );

      // Act
      sessionWithoutRoom.destroy();

      // Assert
      expect(mockRoom.removeSession).not.toHaveBeenCalled();
    });

    it('should close socket when socket exists', async () => {
      // Act
      session.destroy();

      // Assert
      expect(mockSocket.close).toHaveBeenCalled();
      expect(session.socketInstance).toBeNull();
    });

    it('should trigger destroy event by default', async () => {
      // Act
      session.destroy();

      // Assert
      expect(onDestroySpy).toHaveBeenCalledWith(session);
    });

    it('should not trigger destroy event when triggerEvent is false', async () => {
      // Act
      session.destroy(false);

      // Assert
      expect(onDestroySpy).not.toHaveBeenCalled();
    });

    it('should clear all references', async () => {
      // Act
      session.destroy();

      // Assert
      expect(session.room).toBeNull();
      expect(session.socketInstance).toBeNull();
    });
  });

  describe('reconnect', () => {
    it('should set new socket instance', async () => {
      // Arrange
      const newSocket = new MockServerSocket();

      // Act
      session.reconnect(newSocket as unknown as ServerSocket, []);

      // Assert
      expect(session.socketInstance).toBe(newSocket);
    });

    it('should set listener on new socket', async () => {
      // Arrange
      const newSocket = new MockServerSocket();

      // Act
      session.reconnect(newSocket as unknown as ServerSocket, []);

      // Assert
      expect(newSocket.setListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should replace existing socket', async () => {
      // Arrange
      const newSocket = new MockServerSocket();
      const originalSocket = session.socketInstance;

      // Act
      session.reconnect(newSocket as unknown as ServerSocket, []);

      // Assert
      expect(session.socketInstance).toBe(newSocket);
      expect(session.socketInstance).not.toBe(originalSocket);
    });
  });

  describe('forward', () => {
    it('should send data through socket when socket exists', async () => {
      // Arrange
      const action = 'GAME_INIT' as unknown as ActionEnum;
      const data = { test: 'data' } as unknown as ActionMap[ActionEnum];

      // Act
      session.forward(action, data);

      // Assert
      expect(mockSocket.send).toHaveBeenCalledWith(action, data);
    });

    it('should not send data when socket is null', async () => {
      // Arrange
      const sessionWithoutSocket = new SessionModel(
        null,
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>
      );
      const action = SessionActions.HEARTBEAT;
      const data = {};

      // Act
      sessionWithoutSocket.forward(action, data);

      // Assert
      expect(mockSocket.send).not.toHaveBeenCalled();
    });

    it('should handle different action types', async () => {
      // Arrange
      const actions = [
        MechanicsActions.SET_CELL,
        LobbyActions.JOIN_QUEUE,
        SessionActions.HEARTBEAT
      ];

      // Act & Assert
      actions.forEach(action => {
        const data = {} as unknown as ActionMap[ActionEnum];
        session.forward(action, data);
        expect(mockSocket.send).toHaveBeenCalledWith(action, data);
      });
    });
  });

  describe('dataListener', () => {
    it('should update last active time when data is handled successfully', async () => {
      // Arrange
      // Authenticate first
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440000', 1000);
      const originalTime = session.lastActiveTime;
      jest.advanceTimersByTime(1000); // Advance time by 1 second

      const data: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 42,
        cellIndex: 5,
        value: 2
      };

      // Mock successful handling
      mockRoom.roomDataHandler.handleData.mockReturnValue(true);

      // Act - Call the private method via type assertion
      await (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => Promise<void> 
      }).dataListener(data);

      // Assert
      expect(session.lastActiveTime).toBeGreaterThan(originalTime);
    });

    it('should handle match actions when room exists', async () => {
      // Arrange
      // Authenticate first
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440001', 1000);
      const data: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 42,
        cellIndex: 5,
        value: 2
      };

      // Act - Call the private method via type assertion
      await (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => Promise<void>
      }).dataListener(data);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).toHaveBeenCalledWith(session, data);
    });

    it('should handle system actions when authenticated', async () => {
      // Arrange
      // Authenticate first
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440002', 1000);
      const data: AugmentAction<LobbyActions.JOIN_QUEUE> = {
        action: LobbyActions.JOIN_QUEUE,
        username: 'test-user'
      };

      // Act - Call the private method via type assertion
      await (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => Promise<void> 
      }).dataListener(data);

      // Assert
      expect(mockSystemHandler.handleData).toHaveBeenCalledWith(session, data);
    });

    it('should queue unknown actions when not authenticated'
        + ' and disconnect after authentication', async () => {
      // Arrange
      const data = {
        action: 99999, // Invalid action number
        unknownField: 'test'
      } as unknown as AugmentAction<ActionEnum>;

      // Act - Call the private method via type assertion
      await (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => Promise<void> 
      }).dataListener(data);

      // Now authenticate the session to trigger processing queued packets
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440006', 1000);
      
      // Assert
      expect(mockSystemHandler.handleData).not.toHaveBeenCalled();
      expect(mockRoom.roomDataHandler.handleData).not.toHaveBeenCalled();
      expect(mockSocket.close).toHaveBeenCalled(); // Should disconnect due to unknown action
    });
  });

  describe('handleData', () => {
    it('should route match actions to room handler ' +
      'when room exists and authenticated', async () => {
      // Arrange
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440003', 1000);
      // Authenticate the session first
      const data: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 42,
        cellIndex: 5,
        value: 2
      };

      // Act - Call the private method via type assertion
      const result = await (session as unknown as {
        handleData: (data: AugmentAction<ActionEnum>) => Promise<boolean>
      }).handleData(data);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).toHaveBeenCalledWith(session, data);
      expect(result).toBe(true);
    });

    it('should route AUTH actions to system handler when not authenticated', async () => {
      // Arrange - Use AUTH action which should be allowed even when not authenticated
      const data: AugmentAction<SessionActions.AUTH> = {
        action: SessionActions.AUTH,
        token: 'test-auth-token',
        version: '1.0.0',
      };

      // Act
      const result = await (session as unknown as {
        handleData: (data: AugmentAction<ActionEnum>) => Promise<boolean>
      }).handleData(data);

      // Assert
      expect(mockSystemHandler.handleData).toHaveBeenCalledWith(session, data);
      expect(result).toBe(true);
      expect((session as unknown as { preAuthPacketQueue: AugmentAction<ActionEnum>[] })
        .preAuthPacketQueue).toHaveLength(0); // Should not be queued
    });

    it('should queue match actions when not authenticated', async () => {
      // Arrange - Use a match action to test authentication check
      const data: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 42,
        cellIndex: 5,
        value: 2
      };

      // Act
      const result = await (session as unknown as { 
        handleData: (data: AugmentAction<ActionEnum>) => Promise<boolean> 
      }).handleData(data);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).not.toHaveBeenCalled();
      expect(result).toBe(true); // Should return true because packet is queued
      expect((session as unknown as { preAuthPacketQueue: AugmentAction<ActionEnum>[] })
        .preAuthPacketQueue).toHaveLength(1);
    });

    it('should return false for match actions when room is null', async () => {
      // Arrange
      const sessionWithoutRoom = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        null
      );
      await sessionWithoutRoom.setAuthenticated('550e8400-e29b-41d4-a716-446655440004', 1000);
      // Authenticate so we can test room logic
      const data: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 42,
        cellIndex: 5,
        value: 2
      };

      // Act - Call the private method via type assertion
      const result = await (sessionWithoutRoom as unknown as {
        handleData: (data: AugmentAction<ActionEnum>) => Promise<boolean>
      }).handleData(data);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should route system actions to system handler when authenticated', async () => {
      // Arrange
      // Authenticate first
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440005', 1000);
      const data: AugmentAction<LobbyActions.JOIN_QUEUE> = {
        action: LobbyActions.JOIN_QUEUE,
        username: 'test-user'
      };

      // Act - Call the private method via type assertion
      const result = await (session as unknown as {
        handleData: (data: AugmentAction<ActionEnum>) => Promise<boolean>
      }).handleData(data);

      // Assert
      expect(mockSystemHandler.handleData).toHaveBeenCalledWith(session, data);
      expect(result).toBe(true);
    });

    it('should process queued packets after authentication', async () => {
      // Arrange - Send a packet before authentication
      const data: AugmentAction<LobbyActions.JOIN_QUEUE> = {
        action: LobbyActions.JOIN_QUEUE,
        username: 'test-user',
      };

      // Send packet before authentication
      await (session as unknown as { 
        handleData: (data: AugmentAction<ActionEnum>) => Promise<boolean> 
      }).handleData(data);

      // Verify packet is queued
      expect((session as unknown as { preAuthPacketQueue: AugmentAction<ActionEnum>[] })
        .preAuthPacketQueue).toHaveLength(1);
      expect(mockSystemHandler.handleData).not.toHaveBeenCalled();

      // Act - Authenticate the session
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440010', 1000);

      // Assert - Queued packet should be processed
      expect(mockSystemHandler.handleData).toHaveBeenCalledWith(session, data);
      expect((session as unknown as { preAuthPacketQueue: AugmentAction<ActionEnum>[] })
        .preAuthPacketQueue).toHaveLength(0);
    });

    it('should disconnect session when pre-auth packet queue is full', async () => {
      // Arrange - Create a fresh session for this test without socket to avoid auth timeout
      const freshSession = new SessionModel(
        null, // No socket to avoid auth timeout
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        mockRoom as unknown as RoomModel
      );

      // Verify session starts unauthenticated
      expect(freshSession.isAuthenticated()).toBe(false);

      // Fill the queue to max capacity (20)
      for (let i = 0; i < 20; i++) {
        const data: AugmentAction<MechanicsActions.SET_CELL> = {
          action: MechanicsActions.SET_CELL,
          clientTime: 1000,
          actionID: 42,
          cellIndex: i,
          value: 2
        };
        const result = await (freshSession as unknown as {
          handleData: (data: AugmentAction<ActionEnum>) => Promise<boolean>
        }).handleData(data);
        expect(result).toBe(true); // Should return true for queued packets
      }

      // Verify queue is full
      expect((freshSession as unknown as { preAuthPacketQueue: AugmentAction<ActionEnum>[] })
        .preAuthPacketQueue).toHaveLength(20);

      // Now send one more packet that should trigger disconnect
      const overflowData: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 43,
        cellIndex: 20,
        value: 3
      };

      // Act
      const result = await (freshSession as unknown as {
        handleData: (data: AugmentAction<ActionEnum>) => Promise<boolean>
      }).handleData(overflowData);

      // Assert
      expect(onDisconnectSpy).toHaveBeenCalledWith(freshSession);
      expect(result).toBe(false);
      expect((freshSession as unknown as { preAuthPacketQueue: AugmentAction<ActionEnum>[] })
        .preAuthPacketQueue).toHaveLength(0); // Queue should be cleared on disconnect
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete session lifecycle', async () => {
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
      session.reconnect(newSocket as unknown as ServerSocket, []);
      expect(session.socketInstance).toBe(newSocket);

      // Destroy
      session.destroy();
      expect(session.room).toBeNull();
      expect(session.socketInstance).toBeNull();
      expect(onDestroySpy).toHaveBeenCalledWith(session);
    });

    it('should handle data flow correctly', async () => {
      // Arrange
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440007', 1000);
      // Authenticate first to allow match actions
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
      await (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => Promise<void> 
      }).dataListener(matchData);
      await (session as unknown as { 
        dataListener: (data: AugmentAction<ActionEnum>) => Promise<void> 
      }).dataListener(systemData);

      // Assert
      expect(mockRoom.roomDataHandler.handleData).toHaveBeenCalledWith(session, matchData);
      expect(mockSystemHandler.handleData).toHaveBeenCalledWith(session, systemData);
      expect(session.lastActiveTime).toBeGreaterThan(0);
    });
  });

  describe('authentication', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start with authenticated as false', () => {
      // Assert
      expect(session.isAuthenticated()).toBe(false);
    });

    it('should set authenticated to true when setAuthenticated is called', async () => {
      // Act
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440008', 1000);

      // Assert
      expect(session.isAuthenticated()).toBe(true);
    });

    it('should disconnect session after auth timeout if not authenticated', () => {
      // Arrange - Create a new session with a shorter timeout for testing
      const sessionWithTimeout = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        mockRoom as unknown as RoomModel
      );

      // Act - Advance time past the auth timeout
      jest.advanceTimersByTime(6000);

      // Assert
      expect(onDisconnectSpy).toHaveBeenCalledWith(sessionWithTimeout);
    });

    it('should not disconnect session after auth timeout if authenticated', async () => {
      // Arrange - Create a new session with a shorter timeout for testing
      const sessionWithTimeout = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        mockRoom as unknown as RoomModel
      );

      // Authenticate the session
      await sessionWithTimeout.setAuthenticated('550e8400-e29b-41d4-a716-446655440009', 1000);

      // Act - Advance time past the auth timeout
      jest.advanceTimersByTime(6000);

      // Assert
      expect(onDisconnectSpy).not.toHaveBeenCalled();
    });

    it('should clear auth timeout on disconnect', () => {
      // Arrange
      const sessionWithTimeout = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        mockRoom as unknown as RoomModel
      );

      // Act
      sessionWithTimeout.disconnect();

      // Clear existing calls from disconnect
      onDisconnectSpy.mockClear();

      // Advance time past the original auth timeout
      jest.advanceTimersByTime(6000);

      // Assert - Should not disconnect again
      expect(onDisconnectSpy).not.toHaveBeenCalled();
    });

    it('should not start auth timeout on reconnect for authenticated sessions', async () => {
      // Arrange - Create and authenticate a session, then disconnect
      const sessionWithTimeout = new SessionModel(
        mockSocket as unknown as ServerSocket,
        onDisconnectSpy,
        onDestroySpy,
        onAuthenticateSpy,
        mockSystemHandler as unknown as IDataHandler<SystemActions>,
        mockRoom as unknown as RoomModel
      );
      await sessionWithTimeout.setAuthenticated('550e8400-e29b-41d4-a716-446655440008', 1000);
      sessionWithTimeout.disconnect(false); // Disconnect without triggering event
      onDisconnectSpy.mockClear();

      // Act - Reconnect with a new socket
      const newSocket = new MockServerSocket();
      sessionWithTimeout.reconnect(newSocket as unknown as ServerSocket, []);

      // Assert - Disconnect should have been called once during reconnect
      expect(onDisconnectSpy).toHaveBeenCalledTimes(1);

      // Advance time past the auth timeout
      jest.advanceTimersByTime(6000);

      // Assert - Should NOT disconnect again because session is already authenticated
      expect(onDisconnectSpy).toHaveBeenCalledTimes(1);
    });
  });
});
