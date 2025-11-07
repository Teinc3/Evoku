import { jest } from '@jest/globals';

import { SessionModel, ServerSocket } from '../../models/networking';
import SessionManager from ".";

import type { WebSocket } from 'ws';
import type { UUID } from 'crypto';
import type { SystemActions } from '@shared/types/enums/actions';
import type IDataHandler from '../../types/handler';
import type { MatchmakingManager } from '..';


// Mock ServerSocket
jest.mock('../../models/networking', () => {
  class MockServerSocket {
    constructor(
      socket: WebSocket,
      onDisconnect: (code: number) => void,
      onError: (err: Error) => void
    ) {
      socket.on('close', (code: number) => onDisconnect(code));
      
      // Call the error callback asynchronously to test error handling
      process.nextTick(() => {
        onError(new Error('Socket error'));
      });
    }

    setListener = jest.fn();
    close = jest.fn();
    send = jest.fn();
    readyState = 1; // WebSocket.OPEN
  }

  class MockSessionModel {
    uuid: string;
    socketInstance: MockServerSocket;
    manager?: SessionManager;

    constructor(serverSocket: MockServerSocket) {
      this.socketInstance = serverSocket;
      this.uuid = `mock-uuid-${Math.random().toString(36).substr(2, 9)}`;
    }

    disconnect = jest.fn();
    destroy = jest.fn(function(this: MockSessionModel) {
      if (this.manager) {
        this.manager.onDestroy(this as unknown as SessionModel);
      }
    });
    reconnect = jest.fn();
    drainPreAuthPacketQueue = jest.fn().mockReturnValue([]);
  }

  return {
    SessionModel: MockSessionModel,
    ServerSocket: MockServerSocket,
  };
});

// Mock console methods to prevent test output pollution
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});


// Type definitions for accessing private methods
interface SessionManagerPrivate {
  sessions: Map<UUID, SessionModel>;
  cleanupInterval: NodeJS.Timeout | null;
  cleanupSessions(): void;
}

// Mock classes for testing
interface MockWebSocketInterface {
  readyState: number;
  close: jest.MockedFunction<() => void>;
  send: jest.MockedFunction<() => void>;
  removeAllListeners: jest.MockedFunction<() => void>;
  on: jest.MockedFunction<(event: string, listener: (...args: unknown[]) => void) => void>;
  ping: jest.MockedFunction<() => void>;
  pong: jest.MockedFunction<() => void>;
  terminate: jest.MockedFunction<() => void>;
  binaryType: 'arraybuffer';
  bufferedAmount: number;
  extensions: string;
  isPaused: boolean;
  protocol: string;
  url: string;
  _closeListener?: (code: number) => void;
  _errorListener?: (error: Error) => void;
  emitClose(code?: number): void;
  emitError(error: Error): void;
}

class MockWebSocket implements MockWebSocketInterface {
  constructor(public readyState: number = 1) {} // WebSocket.OPEN = 1
  close = jest.fn();
  send = jest.fn();
  removeAllListeners = jest.fn();
  on = jest.fn((event: string, listener: (...args: unknown[]) => void) => {
    // Store the listener so we can call it later
    (this as Record<string, unknown>)[`_${event}Listener`] = listener;
  });
  ping = jest.fn();
  pong = jest.fn();
  terminate = jest.fn();
  binaryType = 'arraybuffer' as const;
  bufferedAmount = 0;
  extensions = '';
  isPaused = false;
  protocol = '';
  url = '';
  
  // Method to simulate emitting events
  emitClose(code: number = 1000) {
    const listener = (this as MockWebSocketInterface)._closeListener;
    if (listener) {
      listener(code);
    }
  }
  
  emitError(error: Error) {
    const listener = (this as MockWebSocketInterface)._errorListener;
    if (listener) {
      listener(error);
    }
  }
}

class MockSystemHandler implements IDataHandler<SystemActions> {
  handleData = jest.fn<() => boolean>().mockReturnValue(true);
}

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockSystemHandler: MockSystemHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSystemHandler = new MockSystemHandler();
    sessionManager = new SessionManager(mockSystemHandler);
  });

  afterEach(() => {
    jest.useRealTimers();
    sessionManager.close();
  });

  describe('constructor', () => {
    it('should initialize with empty sessions map', () => {
      // Act & Assert
      expect((sessionManager as unknown as SessionManagerPrivate).sessions).toBeInstanceOf(Map);
      expect((sessionManager as unknown as SessionManagerPrivate).sessions.size).toBe(0);
    });

    it('should set up cleanup interval', () => {
      // Act & Assert
      expect((sessionManager as unknown as SessionManagerPrivate).cleanupInterval).not.toBeNull();
    });
  });

  describe('createSession', () => {
    it('should create and store a new session', () => {
      // Arrange
      const socket = new MockWebSocket();

      // Act
      const session = sessionManager.createSession(socket as unknown as WebSocket);

      // Assert
      expect(session).toBeInstanceOf(SessionModel);
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(session.uuid)).toBe(true);
    });

    it('should pass correct parameters to SessionModel constructor', () => {
      // Arrange
      const socket = new MockWebSocket();

      // Act
      const session = sessionManager.createSession(socket as unknown as WebSocket);

      // Assert
      expect(session.socketInstance).toBeInstanceOf(ServerSocket);
      expect(typeof session.uuid).toBe('string');
    });
  });

  describe('getSession', () => {
    it('should return session if it exists', () => {
      // Arrange
      const socket = new MockWebSocket();
      const session = sessionManager.createSession(socket as unknown as WebSocket);

      // Act
      const retrieved = sessionManager.getSession(session.uuid);

      // Assert
      expect(retrieved).toBe(session);
    });

    it('should return undefined if session does not exist', () => {
      // Act
      const retrieved = sessionManager.getSession('nonexistent-uuid' as UUID);

      // Assert
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getOnlineCount', () => {
    it('should return 0 when no sessions exist', () => {
      // Act
      const count = sessionManager.getOnlineCount();

      // Assert
      expect(count).toBe(0);
    });

    it('should return correct count with one session', () => {
      // Arrange
      const socket = new MockWebSocket();
      sessionManager.createSession(socket as unknown as WebSocket);

      // Act
      const count = sessionManager.getOnlineCount();

      // Assert
      expect(count).toBe(1);
    });

    it('should return correct count with multiple sessions', () => {
      // Arrange
      const socket1 = new MockWebSocket();
      const socket2 = new MockWebSocket();
      const socket3 = new MockWebSocket();
      sessionManager.createSession(socket1 as unknown as WebSocket);
      sessionManager.createSession(socket2 as unknown as WebSocket);
      sessionManager.createSession(socket3 as unknown as WebSocket);

      // Act
      const count = sessionManager.getOnlineCount();

      // Assert
      expect(count).toBe(3);
    });

    it('should decrease count when session is destroyed', () => {
      // Arrange
      const socket = new MockWebSocket();
      const session = sessionManager.createSession(socket as unknown as WebSocket);
      expect(sessionManager.getOnlineCount()).toBe(1);

      // Act
      sessionManager.onDestroy(session);

      // Assert
      expect(sessionManager.getOnlineCount()).toBe(0);
    });
  });

  describe('onDisconnect', () => {
    it('should handle disconnection event', () => {
      // Arrange - Create a session using the manager so it's properly stored
      const socket = new MockWebSocket();
      const session = sessionManager.createSession(socket as unknown as WebSocket);

      // Act
      sessionManager.onDisconnect(session);

      // Assert
      // Expect session to still remain in the sessions map for potential reconnection
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(session.uuid)).toBe(true);
    });

    it('should notify matchmaking manager when session disconnects', () => {
      // Arrange
      const mockMatchmakingManager = {
        onSessionDisconnect: jest.fn(),
      } as unknown as MatchmakingManager;

      sessionManager.setMatchmakingManager(mockMatchmakingManager);

      const socket = new MockWebSocket();
      const session = sessionManager.createSession(socket as unknown as WebSocket);

      // Act
      sessionManager.onDisconnect(session);

      // Assert
      expect(mockMatchmakingManager.onSessionDisconnect).toHaveBeenCalledWith(session.uuid);
    });
  });

  describe('onDestroy', () => {
    it('should remove session from sessions map', () => {
      // Arrange
      const socket = new MockWebSocket();
      const session = sessionManager.createSession(socket as unknown as WebSocket);
      const sessionId = session.uuid;

      // Verify session exists
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(sessionId)).toBe(true);

      // Act
      sessionManager.onDestroy(session);

      // Assert
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(sessionId)).toBe(false);
    });
  });

  describe('cleanupSessions', () => {
    it('should destroy sessions inactive for more than 2 minutes', () => {
      // Arrange
      const socket = new MockWebSocket();
      const session = sessionManager.createSession(socket as unknown as WebSocket);

      // Spy on the destroy method
      const destroySpy = jest.spyOn(session, 'destroy');

      // Simulate session being inactive for 2+ minutes
      const twoMinutesAgo = Date.now() - (2 * 60 * 1000) - 1000;
      (session as unknown as { lastActiveTime: number }).lastActiveTime = twoMinutesAgo;

      // Act
      const cleanupMethod = (sessionManager as unknown as SessionManagerPrivate)
        .cleanupSessions.bind(sessionManager);
      cleanupMethod();

      // Assert
      expect(destroySpy).toHaveBeenCalledWith(true);
    });

    it('should disconnect sockets for sessions inactive for more than 30 seconds', () => {
      // Arrange
      const socket = new MockWebSocket();
      const session = sessionManager.createSession(socket as unknown as WebSocket);

      // Spy on the disconnect method
      const disconnectSpy = jest.spyOn(session, 'disconnect');

      // Simulate session being inactive for 30+ seconds but less than 2 minutes
      const thirtySecondsAgo = Date.now() - (30 * 1000) - 1000;
      (session as unknown as { lastActiveTime: number }).lastActiveTime = thirtySecondsAgo;

      // Act
      const cleanupMethod = (sessionManager as unknown as SessionManagerPrivate)
        .cleanupSessions.bind(sessionManager);
      cleanupMethod();

      // Assert
      expect(disconnectSpy).toHaveBeenCalledWith(true);
    });

    it('should not affect sessions that are recently active', () => {
      // Arrange
      const socket = new MockWebSocket();
      const session = sessionManager.createSession(socket as unknown as WebSocket);

      // Spy on the methods
      const disconnectSpy = jest.spyOn(session, 'disconnect');
      const destroySpy = jest.spyOn(session, 'destroy');

      // Session is recently active (within 30 seconds)
      (session as unknown as { lastActiveTime: number }).lastActiveTime = Date.now();

      // Act
      const cleanupMethod = (sessionManager as unknown as SessionManagerPrivate)
        .cleanupSessions.bind(sessionManager);
      cleanupMethod();

      // Assert
      expect(disconnectSpy).not.toHaveBeenCalled();
      expect(destroySpy).not.toHaveBeenCalled();
    });

    it('should be called periodically by the cleanup timer', () => {
      // Arrange - Spy on the prototype method before creating the manager
      const cleanupSpy = jest.spyOn(
        SessionManager.prototype as unknown as SessionManagerPrivate,
        'cleanupSessions'
      );

      // Create manager after spying
      const freshManager = new SessionManager(mockSystemHandler);

      // Act
      jest.advanceTimersByTime(10 * 1000); // Advance 10 seconds

      // Assert
      expect(cleanupSpy).toHaveBeenCalled();

      // Clean up
      freshManager.close();
    });
  });

  describe('close', () => {
    it('should clear the cleanup interval', () => {
      // Act
      sessionManager.close();

      // Assert
      expect((sessionManager as unknown as SessionManagerPrivate).cleanupInterval).toBeNull();
    });

    it('should destroy all sessions', () => {
      // Arrange
      const socket1 = new MockWebSocket();
      const socket2 = new MockWebSocket();
      const session1 = sessionManager.createSession(socket1 as unknown as WebSocket);
      const session2 = sessionManager.createSession(socket2 as unknown as WebSocket);

      // Spy on the destroy methods
      const destroySpy1 = jest.spyOn(session1, 'destroy');
      const destroySpy2 = jest.spyOn(session2, 'destroy');

      // Act
      sessionManager.close();

      // Assert
      expect(destroySpy1).toHaveBeenCalledWith(true);
      expect(destroySpy2).toHaveBeenCalledWith(true);
    });

    it('should clear the sessions map', () => {
      // Arrange
      const socket = new MockWebSocket();
      sessionManager.createSession(socket as unknown as WebSocket);

      // Act
      sessionManager.close();

      // Assert
      expect((sessionManager as unknown as SessionManagerPrivate).sessions.size).toBe(0);
    });
  });

  describe('socket disconnection callback', () => {
    it('should call session.disconnect when socket closes', () => {
      // Arrange
      const mockSocket = new MockWebSocket();
      
      // Act
      const session = sessionManager.createSession(mockSocket as unknown as WebSocket);

      // Spy on session.disconnect
      const disconnectSpy = jest.spyOn(session, 'disconnect');

      // Simulate socket close
      mockSocket.emitClose(1000);

      // Assert
      expect(disconnectSpy).toHaveBeenCalledWith();
    });
  });

  describe('onAuthenticate', () => {
    it('should assign userID as session UUID when no existing session exists', () => {
      // Arrange
      const socket = new MockWebSocket();
      const session = sessionManager.createSession(socket as unknown as WebSocket);
      const originalUuid = session.uuid;
      const userId = 'user-123' as UUID;

      // Act
      sessionManager.onAuthenticate(session, userId);

      // Assert
      expect(session.uuid).toBe(userId);
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(originalUuid)).toBe(false);
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(userId)).toBe(true);
      expect(sessionManager.getSession(userId)).toBe(session);
    });

    it('should reconnect existing session when userID already has a session', () => {
      // Arrange
      const socket1 = new MockWebSocket();
      const socket2 = new MockWebSocket();
      const existingSession = sessionManager.createSession(socket1 as unknown as WebSocket);
      const userId = 'user-456' as UUID;

      // Authenticate first session
      sessionManager.onAuthenticate(existingSession, userId);

      // Create second session (simulating new connection from same user)
      const newSession = sessionManager.createSession(socket2 as unknown as WebSocket);
      const newSessionUuid = newSession.uuid;

      // Set the manager on the mock session so destroy works properly
      (newSession as { manager?: SessionManager }).manager = sessionManager;

      // Spy on reconnect method
      const reconnectSpy = jest.spyOn(existingSession, 'reconnect');
      const destroySpy = jest.spyOn(newSession, 'destroy');

      // Act - Authenticate second session with same userID
      sessionManager.onAuthenticate(newSession, userId);

      // Assert
      expect(reconnectSpy).toHaveBeenCalledWith(
        expect.any(Object), 
        expect.any(Array)
      ); // ServerSocket instance and packetQueue
      expect(destroySpy).toHaveBeenCalledWith(true);
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(newSessionUuid)).toBe(false); // New session removed
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(userId)).toBe(true); // Existing session remains
      expect(sessionManager.getSession(userId)).toBe(existingSession);
    });
  });
});
